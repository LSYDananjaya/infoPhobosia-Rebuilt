# Blender 5.2 procedural generator for PHOBOSIA's 4 interactive 3D models:
#   1. public/models/phobosia-outpost-hero.glb (matches outpost_night_observation.png / outpost_1.png)
#   2. public/models/bento-drone.glb           (NASA-accurate coaxial Martian reconnaissance drone)
#   3. public/models/bento-rover.glb           (NASA-accurate 6-wheel pressurized Mars Terrain Vehicle)
#   4. public/models/bento-terrain-pod.glb     (NASA HiRISE Elysium Planitia relief & bio-core)

import bpy
import bmesh
import math
import os
import random
from mathutils import Vector, Euler

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODELS_DIR = os.path.join(ROOT_DIR, "public", "models")
RENDERS_DIR = os.path.join(ROOT_DIR, "public", "renders")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(RENDERS_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Scene & Material Helpers
# ---------------------------------------------------------------------------

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0


def make_mat(
    name,
    color=(0.8, 0.8, 0.8, 1.0),
    metallic=0.0,
    roughness=0.5,
    emission=None,
    emission_strength=0.0,
    alpha=1.0,
):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if alpha < 1.0:
            bsdf.inputs["Alpha"].default_value = alpha
            if hasattr(mat, "blend_method"):
                mat.blend_method = "BLEND"
        if emission is not None and emission_strength > 0:
            if "Emission Color" in bsdf.inputs:
                bsdf.inputs["Emission Color"].default_value = (*emission[:3], 1.0)
            elif "Emission" in bsdf.inputs:
                bsdf.inputs["Emission"].default_value = (*emission[:3], 1.0)
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def assign_mat(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)
    return obj


def add_bevel(obj, width=0.015, segments=2):
    mod = obj.modifiers.new(name="Bevel", type="BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(30)
    return obj


def shade_smooth_auto(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True


def add_box(name, size, loc=(0, 0, 0), rot=(0, 0, 0), mat=None, bevel=0.012):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size[0], size[1], size[2])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        add_bevel(obj, width=bevel, segments=2)
    if mat:
        assign_mat(obj, mat)
    return obj


def add_cyl(
    name,
    radius,
    depth,
    verts=32,
    loc=(0, 0, 0),
    rot=(0, 0, 0),
    mat=None,
    bevel=0.008,
    smooth=True,
):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=verts, radius=radius, depth=depth, location=loc, rotation=rot
    )
    obj = bpy.context.active_object
    obj.name = name
    if bevel > 0:
        add_bevel(obj, width=bevel, segments=2)
    if smooth:
        shade_smooth_auto(obj)
    if mat:
        assign_mat(obj, mat)
    return obj


def add_cone(
    name, r1, r2, depth, verts=32, loc=(0, 0, 0), rot=(0, 0, 0), mat=None, smooth=True
):
    bpy.ops.mesh.primitive_cone_add(
        vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot
    )
    obj = bpy.context.active_object
    obj.name = name
    if smooth:
        shade_smooth_auto(obj)
    if mat:
        assign_mat(obj, mat)
    return obj


def add_torus(
    name, major_r, minor_r, loc=(0, 0, 0), rot=(0, 0, 0), mat=None, segs=40, ring_segs=16
):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_r,
        minor_radius=minor_r,
        major_segments=segs,
        minor_segments=ring_segs,
        location=loc,
        rotation=rot,
    )
    obj = bpy.context.active_object
    obj.name = name
    shade_smooth_auto(obj)
    if mat:
        assign_mat(obj, mat)
    return obj


def export_glb(filepath):
    # Apply modifiers on all mesh objects for clean glTF export
    for obj in list(bpy.context.scene.objects):
        if obj.type == "MESH":
            bpy.context.view_layer.objects.active = obj
            for mod in list(obj.modifiers):
                try:
                    bpy.ops.object.modifier_apply(modifier=mod.name)
                except Exception:
                    pass
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
    )
    print(f"Exported GLB -> {filepath} ({os.path.getsize(filepath)} bytes)")


def render_poster(filepath, cam_loc, cam_target=(0, 0, 0), fov_deg=35, sun_energy=3.0):
    scene = bpy.context.scene
    # Use EEVEE for fast studio poster rendering
    for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES"):
        try:
            scene.render.engine = eng
            break
        except Exception:
            continue

    scene.render.film_transparent = True
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.quality = 92

    # Key, fill, rim lights
    bpy.ops.object.light_add(type="SUN", location=(5, -5, 7))
    key = bpy.context.active_object
    key.data.energy = sun_energy
    key.data.color = (1.0, 0.88, 0.78)
    key.rotation_euler = Euler((math.radians(42), math.radians(18), math.radians(32)))

    bpy.ops.object.light_add(type="AREA", location=(-5, -3, 4))
    fill = bpy.context.active_object
    fill.data.energy = 120.0
    fill.data.size = 5.0
    fill.data.color = (0.55, 0.82, 1.0)
    fill.rotation_euler = Euler((math.radians(55), 0, math.radians(-45)))

    bpy.ops.object.light_add(type="AREA", location=(0, 6, 4))
    rim = bpy.context.active_object
    rim.data.energy = 160.0
    rim.data.size = 6.0
    rim.data.color = (1.0, 0.65, 0.45)
    rim.rotation_euler = Euler((math.radians(-55), 0, 0))

    # Camera looking at target
    bpy.ops.object.camera_add(location=cam_loc)
    cam = bpy.context.active_object
    direction = Vector(cam_target) - Vector(cam_loc)
    rot_quat = direction.to_track_quat("-Z", "Y")
    cam.rotation_euler = rot_quat.to_euler()
    cam.data.lens_unit = "FOV"
    cam.data.angle = math.radians(fov_deg)
    scene.camera = cam

    scene.render.filepath = filepath
    bpy.ops.render.render(write_still=True)
    print(f"Rendered Poster -> {filepath}")


# ===========================================================================
# MODEL 1: PHOBOSIA OUTPOST HERO (Exact match to outpost_night_observation.png)
# ===========================================================================

def build_outpost_hero():
    clear_scene()
    random.seed(42)

    # PBR Materials tuned to outpost_night_observation.png & outpost_1.png
    mat_hull_white = make_mat("Hull_White", (0.83, 0.81, 0.78, 1), metallic=0.12, roughness=0.42)
    mat_hull_panel = make_mat("Hull_Panel", (0.72, 0.70, 0.67, 1), metallic=0.18, roughness=0.48)
    mat_mars_orange = make_mat("Mars_Orange", (0.82, 0.31, 0.14, 1), metallic=0.15, roughness=0.38)
    mat_hull_dark = make_mat("Hull_Slate", (0.12, 0.15, 0.20, 1), metallic=0.45, roughness=0.36)
    mat_metal_trim = make_mat("Ti_Plinth", (0.22, 0.25, 0.30, 1), metallic=0.72, roughness=0.32)
    mat_solar = make_mat("Solar_Array", (0.05, 0.12, 0.26, 1), metallic=0.65, roughness=0.22)
    mat_led_flood = make_mat(
        "LED_Warm",
        (1.0, 0.98, 0.94, 1),
        metallic=0.0,
        roughness=0.1,
        emission=(1.0, 0.95, 0.86),
        emission_strength=6.5,
    )
    mat_power_line = make_mat(
        "Power_Cable_Glow",
        (0.95, 0.28, 0.18, 1),
        metallic=0.1,
        roughness=0.3,
        emission=(0.98, 0.26, 0.15),
        emission_strength=3.2,
    )
    mat_cyan_glow = make_mat(
        "Cyan_Telemetry",
        (0.35, 0.85, 1.0, 1),
        metallic=0.0,
        roughness=0.15,
        emission=(0.35, 0.82, 1.0),
        emission_strength=3.0,
    )
    mat_regolith_lit = make_mat("Mars_Regolith_Lit", (0.54, 0.23, 0.11, 1), metallic=0.02, roughness=0.88)
    mat_regolith_mid = make_mat("Mars_Regolith_Mid", (0.34, 0.14, 0.07, 1), metallic=0.02, roughness=0.92)
    mat_regolith_dark = make_mat("Mars_Regolith_Dark", (0.12, 0.05, 0.03, 1), metallic=0.04, roughness=0.95)
    mat_rock = make_mat("Basalt_Rock", (0.20, 0.10, 0.06, 1), metallic=0.08, roughness=0.85)

    # 1. Nocturnal Illuminated Martian Terrain Base (matches dark vignette + warm floodlit ground)
    # Outer dark nocturnal rim + warm illuminated interior regolith zones
    terrain_outer = add_cyl(
        "Terrain_Nocturnal_Rim", 4.35, 0.14, verts=64, loc=(-0.35, 0.15, -0.07), mat=mat_regolith_dark, bevel=0.03
    )
    terrain_mid = add_cyl(
        "Terrain_Mid_Zone", 3.85, 0.06, verts=64, loc=(-0.35, 0.15, 0.01), mat=mat_regolith_mid, bevel=0.02
    )
    # Warm floodlit pools under the outpost and floodlight towers
    lit_zones = [
        (0.0, 0.0, 2.35, 1.95, 0.0),
        (-2.35, 0.35, 1.75, 1.45, 0.2),
        (-1.85, -1.25, 1.65, 1.25, -0.3),
        (1.45, 0.65, 1.55, 1.35, 0.3),
        (-1.85, 2.15, 1.35, 1.05, 0.1),
    ]
    for idx, (lx, ly, sx, sy, rz) in enumerate(lit_zones):
        p = add_cyl(
            f"Terrain_Lit_Pool_{idx}",
            1.0,
            0.03,
            verts=48,
            loc=(lx, ly, 0.035 + idx * 0.001),
            rot=(0, 0, rz),
            mat=mat_regolith_lit,
            bevel=0.01,
        )
        p.scale = (sx, sy, 1.0)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # 2. Central Pressurized Hub Dome at (0, 0, 0)
    # Cylindrical lower base wall
    add_cyl("Hub_Base_Wall", 1.02, 0.32, verts=48, loc=(0, 0, 0.18), mat=mat_hull_white, bevel=0.01)
    # Dark structural collar rings
    add_torus("Hub_Collar_Lower", 1.03, 0.025, loc=(0, 0, 0.31), mat=mat_hull_dark)
    add_torus("Hub_Collar_Upper", 0.99, 0.02, loc=(0, 0, 0.49), mat=mat_hull_dark)
    # Bold NASA Orange equatorial band around lower dome
    add_cone("Hub_Orange_Band", 1.03, 0.98, 0.18, verts=48, loc=(0, 0, 0.40), mat=mat_mars_orange)
    # Upper white hemisphere dome
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=1.01, location=(0, 0, 0.32))
    dome = bpy.context.active_object
    dome.name = "Hub_Geodesic_Dome"
    dome.scale = (1.0, 1.0, 0.88)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    # Cut bottom half of sphere below z=0.47
    bm = bmesh.new()
    bm.from_mesh(dome.data)
    verts_to_del = [v for v in bm.verts if v.co.z < 0.14]
    bmesh.ops.delete(bm, geom=verts_to_del, context="VERTS")
    bm.to_mesh(dome.data)
    bm.free()
    shade_smooth_auto(dome)
    assign_mat(dome, mat_hull_white)

    # Dark longitudinal structural seam ribs on the dome (seen in outpost_1.png & outpost_night_observation.png)
    for deg in (25, 115, 205, 295):
        rad = math.radians(deg)
        rib = add_torus(
            f"Hub_Dome_Seam_{deg}",
            0.995,
            0.011,
            loc=(0, 0, 0.32),
            rot=(math.radians(90), 0, rad),
            mat=mat_hull_dark,
            segs=64,
            ring_segs=10,
        )
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
        rib.scale = (1.0, 1.0, 0.875)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        # Trim lower half of seam rib below z=0.32 so it only traces the upper dome
        bm_r = bmesh.new()
        bm_r.from_mesh(rib.data)
        del_v = [v for v in bm_r.verts if v.co.z < 0.16]
        bmesh.ops.delete(bm_r, geom=del_v, context="VERTS")
        bm_r.to_mesh(rib.data)
        bm_r.free()

    # Top Orange & White Cupola Cap
    add_cyl("Hub_Cupola_Orange", 0.22, 0.14, verts=32, loc=(0, 0, 1.22), mat=mat_mars_orange, bevel=0.01)
    add_cyl("Hub_Cupola_Cap", 0.225, 0.04, verts=32, loc=(0, 0, 1.30), mat=mat_hull_white, bevel=0.008)

    # Helper to build detailed PHOBOSIA rectangular module with orange roof end-caps, wall ribs, and roof bays
    def build_detailed_module(
        prefix,
        center,
        length,
        width,
        height,
        yaw_deg,
        end_cap_len=0.28,
        skylight_count=1,
        has_side_ribs=True,
    ):
        yaw = math.radians(yaw_deg)
        cx, cy, cz = center

        def local_to_world(lx, ly, lz):
            wx = cx + lx * math.cos(yaw) - ly * math.sin(yaw)
            wy = cy + lx * math.sin(yaw) + ly * math.cos(yaw)
            return (wx, wy, cz + lz)

        # Main white hull body
        add_box(
            f"{prefix}_Body",
            (length, width, height),
            loc=(cx, cy, cz + height * 0.5),
            rot=(0, 0, yaw),
            mat=mat_hull_white,
            bevel=0.018,
        )
        # Dark lower chassis skirt
        add_box(
            f"{prefix}_Skirt",
            (length * 0.99, width * 1.01, 0.06),
            loc=(cx, cy, cz + 0.05),
            rot=(0, 0, yaw),
            mat=mat_hull_dark,
            bevel=0.006,
        )
        # Orange chamfered roof end-caps at both ends
        for side in (-1, 1):
            cap_x = side * (length * 0.5 - end_cap_len * 0.5 + 0.01)
            add_box(
                f"{prefix}_OrangeCap_{side}",
                (end_cap_len, width * 0.98, 0.07),
                loc=local_to_world(cap_x, 0, height + 0.015),
                rot=(0, 0, yaw),
                mat=mat_mars_orange,
                bevel=0.012,
            )

        # Central roof white deck + dark recessed skylight/equipment bays
        mid_len = max(0.3, length - 2 * end_cap_len - 0.06)
        add_box(
            f"{prefix}_RoofDeck",
            (mid_len, width * 0.94, 0.05),
            loc=local_to_world(0, 0, height + 0.015),
            rot=(0, 0, yaw),
            mat=mat_hull_panel,
            bevel=0.01,
        )
        if skylight_count == 1:
            add_box(
                f"{prefix}_Skylight",
                (mid_len * 0.82, width * 0.52, 0.055),
                loc=local_to_world(0, 0, height + 0.025),
                rot=(0, 0, yaw),
                mat=mat_hull_dark,
                bevel=0.008,
            )
        elif skylight_count == 2:
            for s in (-1, 1):
                add_box(
                    f"{prefix}_Skylight_{s}",
                    (mid_len * 0.36, width * 0.48, 0.055),
                    loc=local_to_world(s * mid_len * 0.24, 0, height + 0.025),
                    rot=(0, 0, yaw),
                    mat=mat_hull_dark,
                    bevel=0.008,
                )

        # Vertical exterior structural wall ribs along both sides
        if has_side_ribs:
            rib_count = max(3, int(length / 0.34))
            for r_i in range(rib_count):
                rx = -length * 0.42 + (length * 0.84) * (r_i / max(1, rib_count - 1))
                for sy in (-1, 1):
                    add_box(
                        f"{prefix}_Rib_{r_i}_{sy}",
                        (0.03, 0.025, height * 0.78),
                        loc=local_to_world(rx, sy * (width * 0.5 + 0.008), height * 0.48),
                        rot=(0, 0, yaw),
                        mat=mat_hull_panel,
                        bevel=0.004,
                    )

    # Helper to build a corridor tunnel between two points (x1, y1) and (x2, y2)
    def build_corridor(name, p1, p2, width=0.34, height=0.30):
        dx = p2[0] - p1[0]
        dy = p2[1] - p1[1]
        dist = math.hypot(dx, dy)
        yaw = math.atan2(dy, dx)
        mx = (p1[0] + p2[0]) * 0.5
        my = (p1[1] + p2[1]) * 0.5
        add_box(
            name,
            (dist, width, height),
            loc=(mx, my, 0.03 + height * 0.5),
            rot=(0, 0, yaw),
            mat=mat_hull_panel,
            bevel=0.014,
        )
        # Dark collar joint at module entry
        add_box(
            f"{name}_Collar",
            (0.08, width * 1.08, height * 1.08),
            loc=(p2[0] - dx * 0.08, p2[1] - dy * 0.08, 0.03 + height * 0.5),
            rot=(0, 0, yaw),
            mat=mat_mars_orange,
            bevel=0.008,
        )

    # 3. SPOKE 1 (Upper-Left — Habitat / Engineering Module + Parabolic Dish Antenna)
    build_corridor("Corridor_Spoke1_A", (-0.85, 0.30), (-1.65, 0.46), width=0.36, height=0.31)
    build_corridor("Corridor_Spoke1_B", (-1.60, 0.46), (-2.18, 0.42), width=0.36, height=0.31)
    build_detailed_module(
        "Mod_Spoke1_Habitat",
        center=(-2.95, 0.42, 0.03),
        length=1.65,
        width=0.76,
        height=0.42,
        yaw_deg=8,
        end_cap_len=0.28,
        skylight_count=1,
    )
    # Small white auxiliary sub-box in front of Spoke 1 module
    add_box(
        "Spoke1_Aux_Box",
        (0.24, 0.20, 0.18),
        loc=(-3.28, -0.18, 0.12),
        rot=(0, 0, math.radians(8)),
        mat=mat_hull_white,
        bevel=0.01,
    )
    # Glowing white interaction marker ring near the dish (visible in outpost_1.png)
    add_torus("Dish_Marker_Ring", 0.09, 0.012, loc=(-2.82, 0.92, 0.045), mat=mat_led_flood)

    # Large Parabolic Dish Antenna behind Spoke 1 at (-3.15, 1.15)
    add_cyl("Dish_Pedestal_Base", 0.22, 0.14, verts=32, loc=(-3.15, 1.18, 0.10), mat=mat_hull_panel)
    add_cyl("Dish_Pedestal_Mast", 0.09, 0.28, verts=24, loc=(-3.15, 1.18, 0.26), mat=mat_metal_trim)
    # Parabolic dish bowl (tilted toward upper-right sky)
    dish_rot = Euler((math.radians(38), math.radians(22), math.radians(-30)))
    add_cone(
        "Dish_Reflector",
        0.62,
        0.08,
        0.22,
        verts=48,
        loc=(-3.15, 1.18, 0.56),
        rot=dish_rot,
        mat=mat_hull_dark,
    )
    add_torus(
        "Dish_Rim",
        0.62,
        0.016,
        loc=(-3.10, 1.12, 0.64),
        rot=dish_rot,
        mat=mat_metal_trim,
    )
    add_cyl(
        "Dish_FeedHorn",
        0.025,
        0.42,
        verts=16,
        loc=(-3.02, 1.04, 0.72),
        rot=dish_rot,
        mat=mat_hull_white,
    )

    # 4. SPOKE 2 (Mid-Left / Front-Left — Long Science Lab Module)
    build_corridor("Corridor_Spoke2_A", (-0.82, -0.22), (-1.55, -0.42), width=0.35, height=0.30)
    build_corridor("Corridor_Spoke2_B", (-1.50, -0.42), (-2.05, -0.68), width=0.35, height=0.30)
    build_detailed_module(
        "Mod_Spoke2_ScienceLab",
        center=(-2.82, -1.04, 0.03),
        length=1.95,
        width=0.66,
        height=0.41,
        yaw_deg=24,
        end_cap_len=0.28,
        skylight_count=2,
    )

    # 5. SPOKE 3 (Front-Center — Narrow Elongated Corridor Wing)
    build_corridor("Corridor_Spoke3_A", (-0.28, -0.88), (-0.42, -1.45), width=0.33, height=0.30)
    build_detailed_module(
        "Mod_Spoke3_FrontWing",
        center=(-0.56, -2.28, 0.03),
        length=1.78,
        width=0.44,
        height=0.39,
        yaw_deg=80,
        end_cap_len=0.22,
        skylight_count=0,
    )
    # Dark rooftop HVAC unit near front end of Spoke 3
    add_box(
        "Spoke3_Rooftop_HVAC",
        (0.26, 0.22, 0.12),
        loc=(-0.67, -2.85, 0.48),
        rot=(0, 0, math.radians(80)),
        mat=mat_hull_dark,
        bevel=0.008,
    )

    # 6. SPOKE 4 (Front-Right — Compact Airlock Module with twin square roof hatches)
    build_corridor("Corridor_Spoke4", (0.52, -0.78), (1.02, -1.35), width=0.34, height=0.30)
    airlock_yaw = math.radians(-52)
    add_box(
        "Mod_Spoke4_Airlock",
        (0.96, 0.64, 0.40),
        loc=(1.32, -1.68, 0.23),
        rot=(0, 0, airlock_yaw),
        mat=mat_hull_white,
        bevel=0.022,
    )
    add_box(
        "Mod_Spoke4_OrangeRoof",
        (0.92, 0.60, 0.05),
        loc=(1.32, -1.68, 0.44),
        rot=(0, 0, airlock_yaw),
        mat=mat_mars_orange,
        bevel=0.01,
    )
    add_box(
        "Mod_Spoke4_DarkRoofCenter",
        (0.76, 0.44, 0.055),
        loc=(1.32, -1.68, 0.45),
        rot=(0, 0, airlock_yaw),
        mat=mat_hull_dark,
        bevel=0.008,
    )
    for hs in (-0.18, 0.18):
        hx = 1.32 + hs * math.cos(airlock_yaw)
        hy = -1.68 + hs * math.sin(airlock_yaw)
        add_box(
            f"Spoke4_HatchFrame_{hs}",
            (0.22, 0.22, 0.06),
            loc=(hx, hy, 0.46),
            rot=(0, 0, airlock_yaw),
            mat=mat_mars_orange,
            bevel=0.006,
        )
        add_box(
            f"Spoke4_HatchGlass_{hs}",
            (0.15, 0.15, 0.065),
            loc=(hx, hy, 0.462),
            rot=(0, 0, airlock_yaw),
            mat=mat_hull_white,
            bevel=0.004,
        )

    # 7. SPOKE 5 (Back-Right — Mission Control & Multi-Bay Complex)
    build_corridor("Corridor_Spoke5", (0.78, 0.45), (1.38, 0.78), width=0.36, height=0.31)
    build_detailed_module(
        "Mod_Spoke5_MainHall",
        center=(1.65, 1.25, 0.03),
        length=1.45,
        width=0.76,
        height=0.43,
        yaw_deg=-28,
        end_cap_len=0.22,
        skylight_count=1,
    )
    # Bright white skylight strip on Mission Control roof (visible in outpost_1.png & outpost_night_observation.png)
    add_box(
        "Spoke5_Roof_LightStrip",
        (0.38, 0.16, 0.06),
        loc=(1.72, 1.22, 0.47),
        rot=(0, 0, math.radians(-28)),
        mat=mat_led_flood,
        bevel=0.005,
    )
    # Side annex block attached to Spoke 5
    add_box(
        "Mod_Spoke5_Annex",
        (0.68, 0.56, 0.36),
        loc=(1.58, 0.56, 0.21),
        rot=(0, 0, math.radians(-28)),
        mat=mat_hull_white,
        bevel=0.015,
    )
    add_box(
        "Mod_Spoke5_Annex_OrangeTrim",
        (0.70, 0.58, 0.045),
        loc=(1.58, 0.56, 0.37),
        rot=(0, 0, math.radians(-28)),
        mat=mat_mars_orange,
        bevel=0.008,
    )

    # 8. BACK-LEFT POWER CABLE TRENCH, TRANSFORMER BUILDING & SOLAR FARM
    # Glowing red/orange power cable line from Central Hub to Transformer Building
    p_start = (-0.55, 0.72)
    p_end = (-1.55, 1.92)
    pdx, pdy = p_end[0] - p_start[0], p_end[1] - p_start[1]
    p_len = math.hypot(pdx, pdy)
    p_yaw = math.atan2(pdy, pdx)
    add_box(
        "Power_Conduit_GlowLine",
        (p_len, 0.04, 0.03),
        loc=((p_start[0] + p_end[0]) * 0.5, (p_start[1] + p_end[1]) * 0.5, 0.045),
        rot=(0, 0, p_yaw),
        mat=mat_power_line,
        bevel=0.004,
    )

    # Auxiliary Power Transformer Building at (-1.68, 2.05)
    add_box(
        "Power_Transformer_Bldg",
        (0.72, 0.54, 0.38),
        loc=(-1.68, 2.05, 0.22),
        rot=(0, 0, math.radians(12)),
        mat=mat_hull_white,
        bevel=0.014,
    )
    add_box(
        "Power_Transformer_Stripe",
        (0.73, 0.55, 0.04),
        loc=(-1.68, 2.05, 0.36),
        rot=(0, 0, math.radians(12)),
        mat=mat_mars_orange,
        bevel=0.006,
    )

    # Raised conduit duct + Two Photovoltaic Solar Panel Racks behind Transformer Building
    build_corridor("Solar_Feed_Duct", (-1.95, 2.25), (-2.65, 2.75), width=0.18, height=0.14)
    for s_idx, (sx, sy) in enumerate([(-2.85, 2.65), (-1.65, 2.85)]):
        add_box(
            f"Solar_Pad_{s_idx}",
            (0.95, 0.48, 0.04),
            loc=(sx, sy, 0.04),
            rot=(0, 0, math.radians(12)),
            mat=mat_hull_panel,
            bevel=0.006,
        )
        add_box(
            f"Solar_Panel_{s_idx}",
            (0.88, 0.42, 0.03),
            loc=(sx, sy, 0.18),
            rot=(math.radians(22), 0, math.radians(12)),
            mat=mat_solar,
            bevel=0.005,
        )

    # 9. 6 TALL PERIMETER FLOODLIGHT TOWERS (Exact 2x4 8-lamp heads from outpost_night_observation.png)
    towers = [
        # (x, y, height, aim_target_x, aim_target_y)
        (-1.82, -2.55, 1.55, -0.5, -0.8),   # Front-left foreground tower
        (-3.95, -0.25, 1.52, -2.4, -0.2),   # Far-left tower near Spoke 1/2
        (-2.25, 3.25, 1.62, -1.6, 1.8),     # Back-left solar farm tower
        (0.52, 1.95, 1.50, 0.0, 0.2),       # Center-back tower behind dome
        (2.35, 2.55, 1.60, 1.2, 0.8),       # Back-right upper tower
        (2.48, 0.15, 1.48, 0.4, -0.2),      # Right-mid spotlight tower (clear of Annex)
    ]
    for t_i, (tx, ty, th, ax, ay) in enumerate(towers):
        aim_yaw = math.atan2(ay - ty, ax - tx)
        # Base pad + slender pole
        add_cyl(f"Tower_Base_{t_i}", 0.08, 0.06, verts=16, loc=(tx, ty, 0.05), mat=mat_hull_dark)
        add_cyl(f"Tower_Pole_{t_i}", 0.022, th, verts=12, loc=(tx, ty, 0.05 + th * 0.5), mat=mat_hull_dark, bevel=0)
        # Floodlight housing frame at top
        head_z = 0.05 + th
        add_box(
            f"Tower_HeadFrame_{t_i}",
            (0.08, 0.42, 0.20),
            loc=(tx, ty, head_z),
            rot=(0, math.radians(24), aim_yaw),
            mat=mat_hull_dark,
            bevel=0.008,
        )
        # 2 rows x 4 columns of glowing white circular floodlight drums
        for row in (-0.048, 0.048):
            for col in (-0.135, -0.045, 0.045, 0.135):
                lx = tx + 0.03 * math.cos(aim_yaw) - col * math.sin(aim_yaw)
                ly = ty + 0.03 * math.sin(aim_yaw) + col * math.cos(aim_yaw)
                lz = head_z + row
                add_cyl(
                    f"Tower_Lamp_{t_i}_{row}_{col}",
                    0.036,
                    0.06,
                    verts=16,
                    loc=(lx, ly, lz),
                    rot=(0, math.radians(108), aim_yaw),
                    mat=mat_led_flood,
                    bevel=0.004,
                )

    # 10. Scatter small angular Martian basalt rocks on the regolith
    for r_i in range(28):
        angle = random.uniform(0, math.tau)
        dist = random.uniform(1.3, 3.9)
        rx = -0.35 + math.cos(angle) * dist
        ry = 0.15 + math.sin(angle) * dist
        # Keep rocks clear of module footprints
        if abs(rx) < 1.3 and abs(ry) < 1.3:
            continue
        rs = random.uniform(0.04, 0.11)
        bpy.ops.mesh.primitive_ico_sphere_add(
            subdivisions=1,
            radius=rs,
            location=(rx, ry, 0.035),
            rotation=(random.random(), random.random(), random.random()),
        )
        rk = bpy.context.active_object
        rk.name = f"Mars_Rock_{r_i}"
        rk.scale = (random.uniform(0.8, 1.5), random.uniform(0.7, 1.3), random.uniform(0.45, 0.8))
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        assign_mat(rk, mat_rock)

    export_glb(os.path.join(MODELS_DIR, "phobosia-outpost-hero.glb"))
    render_poster(
        os.path.join(RENDERS_DIR, "phobosia-outpost-hero.webp"),
        cam_loc=(-1.05, -9.8, 5.1),
        cam_target=(-0.45, 0.15, 0.22),
        fov_deg=36,
        sun_energy=1.6,
    )


# ===========================================================================
# MODEL 2: BENTO DRONE (NASA-Accurate Coaxial Martian Reconnaissance Drone)
# ===========================================================================

def build_bento_drone():
    clear_scene()

    mat_ochre = make_mat("Drone_OchreGold", (0.86, 0.64, 0.26, 1), metallic=0.32, roughness=0.34)
    mat_carbon = make_mat("Drone_Carbon", (0.11, 0.13, 0.16, 1), metallic=0.45, roughness=0.32)
    mat_titanium = make_mat("Drone_Titanium", (0.58, 0.62, 0.68, 1), metallic=0.82, roughness=0.26)
    mat_solar = make_mat("Drone_Solar", (0.04, 0.10, 0.24, 1), metallic=0.68, roughness=0.18)
    mat_optics = make_mat("Drone_Optics", (0.06, 0.28, 0.48, 1), metallic=0.90, roughness=0.08)
    mat_strobe_cyan = make_mat(
        "Drone_Strobe",
        (0.30, 0.85, 1.0, 1),
        emission=(0.25, 0.82, 1.0),
        emission_strength=4.5,
    )
    mat_strobe_amber = make_mat(
        "Drone_AmberLED",
        (1.0, 0.55, 0.12, 1),
        emission=(1.0, 0.50, 0.10),
        emission_strength=4.0,
    )

    # 1. Sculpted Aerodynamic Fuselage (inspired by drone_Section.png + NASA Dragonfly/Ingenuity)
    add_box("Fuselage_Core", (0.78, 1.32, 0.32), loc=(0, 0, 0.18), mat=mat_ochre, bevel=0.065)
    add_box("Fuselage_BellyPan", (0.72, 1.24, 0.12), loc=(0, 0, 0.02), mat=mat_carbon, bevel=0.035)
    # Front twin dark-graphite air-intake cowling (exact match to drone_Section.png nose)
    add_box("Nose_Cowl_Outer", (0.64, 0.34, 0.24), loc=(0, -0.62, 0.17), mat=mat_carbon, bevel=0.045)
    for sx in (-0.15, 0.15):
        add_box(f"Nose_Vent_{sx}", (0.16, 0.08, 0.12), loc=(sx, -0.76, 0.17), mat=mat_titanium, bevel=0.01)

    # Dorsal Solar Array Deck + High-Gain Telemetry Mast
    add_box("Dorsal_Solar_Frame", (0.56, 0.82, 0.04), loc=(0, 0.05, 0.35), mat=mat_carbon, bevel=0.01)
    add_box("Dorsal_Solar_Cells", (0.50, 0.76, 0.045), loc=(0, 0.05, 0.355), mat=mat_solar, bevel=0.006)
    add_cone("Dorsal_GPS_Puck", 0.11, 0.04, 0.10, verts=24, loc=(0, -0.38, 0.38), mat=mat_ochre)
    add_cyl("Dorsal_Antenna_Mast", 0.016, 0.28, verts=16, loc=(0, 0.42, 0.46), mat=mat_titanium)
    add_cyl("Dorsal_Strobe_Beacon", 0.028, 0.04, verts=16, loc=(0, 0.42, 0.61), mat=mat_strobe_cyan)

    # 2. Underslung Avionics Bay & Gimbaled Optical/LiDAR Camera Turret
    add_box("Payload_Cage", (0.48, 0.68, 0.24), loc=(0, -0.04, -0.14), mat=mat_carbon, bevel=0.02)
    for gy in (-0.18, 0.0, 0.18):
        add_box(f"Payload_GoldFoil_{gy}", (0.50, 0.11, 0.14), loc=(0, gy - 0.04, -0.14), mat=mat_ochre, bevel=0.008)
    # Forward spherical/cylindrical optical camera turret with coated lens
    add_cyl(
        "Gimbal_Turret_Housing",
        0.15,
        0.24,
        verts=32,
        loc=(0, -0.38, -0.16),
        rot=(math.radians(90), 0, 0),
        mat=mat_carbon,
        bevel=0.015,
    )
    add_cyl(
        "Gimbal_Lens_Ring",
        0.12,
        0.05,
        verts=32,
        loc=(0, -0.50, -0.16),
        rot=(math.radians(90), 0, 0),
        mat=mat_titanium,
        bevel=0.006,
    )
    add_cyl(
        "Gimbal_Optic_Glass",
        0.095,
        0.03,
        verts=32,
        loc=(0, -0.515, -0.16),
        rot=(math.radians(90), 0, 0),
        mat=mat_optics,
        bevel=0.004,
    )

    # 3. 4 Splayed Carbon-Titanium Shock-Absorbing Landing Struts
    leg_mounts = [
        (-0.28, -0.36, -0.62, -0.54),
        (0.28, -0.36, 0.62, -0.54),
        (-0.28, 0.36, -0.62, 0.54),
        (0.28, 0.36, 0.62, 0.54),
    ]
    for idx, (mx, my, fx, fy) in enumerate(leg_mounts):
        p_top = Vector((mx, my, -0.02))
        p_bot = Vector((fx, fy, -0.68))
        vec = p_bot - p_top
        length = vec.length
        mid = (p_top + p_bot) * 0.5
        rot = vec.to_track_quat("Z", "Y").to_euler()
        add_cyl(f"Landing_Leg_Upper_{idx}", 0.032, length * 0.55, verts=16, loc=p_top + vec * 0.28, rot=rot, mat=mat_ochre)
        add_cyl(f"Landing_Leg_Piston_{idx}", 0.022, length * 0.55, verts=16, loc=mid + vec * 0.22, rot=rot, mat=mat_titanium)
        add_cyl(f"Landing_Footpad_{idx}", 0.075, 0.03, verts=24, loc=(fx, fy, -0.69), mat=mat_carbon, bevel=0.006)

    # 4. 4 Outrigger Arms, Two-Tone Motor Nacelles & Coaxial Counter-Rotating Martian Rotors
    arm_targets = [
        (-1.12, -0.88, 18),
        (1.12, -0.88, -18),
        (-1.12, 0.88, -22),
        (1.12, 0.88, 22),
    ]
    for idx, (nx, ny, blade_offset_deg) in enumerate(arm_targets):
        sx = -0.32 if nx < 0 else 0.32
        sy = -0.38 if ny < 0 else 0.38
        p_in = Vector((sx, sy, 0.18))
        p_out = Vector((nx, ny, 0.22))
        avec = p_out - p_in
        alen = avec.length
        amid = (p_in + p_out) * 0.5
        arot = avec.to_track_quat("Y", "Z").to_euler()

        # Sculpted ochre outrigger arm + carbon reinforcement rib
        add_box(f"Arm_Boom_{idx}", (0.14, alen, 0.095), loc=amid, rot=arot, mat=mat_ochre, bevel=0.02)
        add_box(f"Arm_CarbonStrip_{idx}", (0.08, alen * 0.92, 0.102), loc=amid, rot=arot, mat=mat_carbon, bevel=0.008)

        # Two-Tone Motor Nacelle (Dark Graphite Upper Dome + Ochre Lower Ring + Strobe)
        add_cyl(f"Nacelle_Upper_{idx}", 0.22, 0.14, verts=32, loc=(nx, ny, 0.24), mat=mat_carbon, bevel=0.025)
        add_cyl(f"Nacelle_Lower_{idx}", 0.19, 0.10, verts=32, loc=(nx, ny, 0.14), mat=mat_ochre, bevel=0.015)
        add_torus(f"Nacelle_StrobeRing_{idx}", 0.195, 0.012, loc=(nx, ny, 0.18), mat=mat_strobe_amber)
        add_cone(f"Nacelle_Spinner_{idx}", 0.09, 0.02, 0.12, verts=24, loc=(nx, ny, 0.44), mat=mat_ochre)
        add_cyl(f"Rotor_Mast_{idx}", 0.032, 0.24, verts=20, loc=(nx, ny, 0.34), mat=mat_titanium)

        # Coaxial Lower & Upper Counter-Rotating Wide-Chord Martian Rotor Blades (4 blades per rotor disk)
        for disk_z, pitch_sign, disk_rot in [(0.31, 1, blade_offset_deg), (0.39, -1, blade_offset_deg + 45)]:
            add_cyl(f"Rotor_Hub_{idx}_{disk_z}", 0.068, 0.032, verts=20, loc=(nx, ny, disk_z), mat=mat_titanium)
            for b_i in range(2):
                b_yaw = math.radians(disk_rot + b_i * 90)
                add_box(
                    f"Rotor_Blade_{idx}_{disk_z}_{b_i}",
                    (1.22, 0.11, 0.014),
                    loc=(nx, ny, disk_z),
                    rot=(math.radians(9 * pitch_sign), 0, b_yaw),
                    mat=mat_carbon,
                    bevel=0.004,
                )
                # Ochre leading-edge tip markers
                for tip_side in (-1, 1):
                    tx = nx + tip_side * 0.56 * math.cos(b_yaw)
                    ty = ny + tip_side * 0.56 * math.sin(b_yaw)
                    add_box(
                        f"Blade_Tip_{idx}_{disk_z}_{b_i}_{tip_side}",
                        (0.10, 0.112, 0.016),
                        loc=(tx, ty, disk_z),
                        rot=(math.radians(9 * pitch_sign), 0, b_yaw),
                        mat=mat_ochre,
                        bevel=0.003,
                    )

    export_glb(os.path.join(MODELS_DIR, "bento-drone.glb"))
    render_poster(
        os.path.join(RENDERS_DIR, "bento-drone.webp"),
        cam_loc=(-2.9, -4.2, 2.0),
        cam_target=(0, -0.05, 0.02),
        fov_deg=34,
        sun_energy=2.8,
    )


# ===========================================================================
# MODEL 3: BENTO ROVER (NASA-Accurate 6-Wheel Pressurized Mars Terrain Vehicle)
# ===========================================================================

def build_bento_rover():
    clear_scene()

    mat_white = make_mat("Rover_HullWhite", (0.86, 0.84, 0.80, 1), metallic=0.15, roughness=0.38)
    mat_orange = make_mat("Rover_MarsOrange", (0.84, 0.36, 0.14, 1), metallic=0.22, roughness=0.34)
    mat_chassis = make_mat("Rover_DarkChassis", (0.12, 0.14, 0.18, 1), metallic=0.68, roughness=0.36)
    mat_tire = make_mat("Rover_TireRubber", (0.16, 0.15, 0.14, 1), metallic=0.25, roughness=0.72)
    mat_hub_gold = make_mat("Rover_HubGold", (0.86, 0.48, 0.15, 1), metallic=0.65, roughness=0.28)
    mat_glass = make_mat("Rover_AmberGlass", (0.28, 0.18, 0.08, 1), metallic=0.85, roughness=0.10)
    mat_led_head = make_mat(
        "Rover_FloodLED",
        (1.0, 0.98, 0.92, 1),
        emission=(1.0, 0.96, 0.88),
        emission_strength=6.0,
    )
    mat_hud_green = make_mat(
        "Rover_HUDGlow",
        (0.20, 0.95, 0.55, 1),
        emission=(0.20, 0.95, 0.55),
        emission_strength=4.0,
    )

    # 1. Heavy-Duty Lower Chassis Spine & Rocker-Bogie Differential Axles
    add_box("Chassis_MainSpine", (1.12, 2.55, 0.22), loc=(0, 0.05, 0.48), mat=mat_chassis, bevel=0.02)
    add_box("Chassis_FrontBumper", (1.28, 0.26, 0.18), loc=(0, -1.25, 0.44), mat=mat_chassis, bevel=0.02)
    # Front tow hooks
    for sx in (-0.42, 0.42):
        add_torus(
            f"Front_TowHook_{sx}",
            0.055,
            0.015,
            loc=(sx, -1.39, 0.44),
            rot=(0, math.radians(90), 0),
            mat=mat_orange,
        )

    # 2. Faceted Pressurized Crew Cabin & Rear Equipment Hull (matching outpost_with_terrain_Vehicle.png)
    # Main mid/rear hull body
    add_box("Cabin_MidHull", (1.36, 1.48, 0.88), loc=(0, 0.18, 0.98), mat=mat_white, bevel=0.03)
    # Upper orange trim band along cabin sides
    add_box("Cabin_OrangeBelt", (1.38, 1.42, 0.24), loc=(0, 0.18, 1.24), mat=mat_orange, bevel=0.015)

    # Sculpted Angled Forward Cockpit Nose (sloped windshield + triangular side windows)
    cockpit = add_box("Cockpit_Nose", (1.32, 0.92, 0.84), loc=(0, -0.88, 0.96), mat=mat_orange, bevel=0.025)
    # Taper front top edge backward for the iconic sloped trapezoidal windshield
    bm = bmesh.new()
    bm.from_mesh(cockpit.data)
    for v in bm.verts:
        if v.co.y < -0.1 and v.co.z > 0.1:
            v.co.y += 0.34
            v.co.x *= 0.88
        elif v.co.y < -0.1 and v.co.z <= 0.1:
            v.co.x *= 0.92
    bm.to_mesh(cockpit.data)
    bm.free()

    # Forward trapezoidal tinted windshield glass (flush with sloped nose)
    add_box(
        "Cockpit_Windshield_Frame",
        (1.04, 0.05, 0.56),
        loc=(0, -1.14, 1.00),
        rot=(math.radians(-22), 0, 0),
        mat=mat_chassis,
        bevel=0.008,
    )
    add_box(
        "Cockpit_Windshield",
        (0.96, 0.055, 0.48),
        loc=(0, -1.145, 1.00),
        rot=(math.radians(-22), 0, 0),
        mat=mat_glass,
        bevel=0.006,
    )
    # Side flush armored observation windows
    for sx in (-1, 1):
        add_box(
            f"Cockpit_SideWindow_Frame_{sx}",
            (0.04, 0.56, 0.40),
            loc=(sx * 0.61, -0.82, 1.01),
            rot=(0, math.radians(sx * -4), math.radians(sx * 3)),
            mat=mat_chassis,
            bevel=0.006,
        )
        add_box(
            f"Cockpit_SideWindow_{sx}",
            (0.045, 0.50, 0.34),
            loc=(sx * 0.614, -0.82, 1.01),
            rot=(0, math.radians(sx * -4), math.radians(sx * 3)),
            mat=mat_glass,
            bevel=0.004,
        )

    # 3. Dual Roof-Mounted 3-LED Floodlight Bars (Exact `ooo` `ooo` pods from outpost_with_terrain_Vehicle.png)
    add_box("Roof_EquipmentRack", (1.08, 1.15, 0.08), loc=(0, -0.05, 1.44), mat=mat_chassis, bevel=0.012)
    for bar_x in (-0.34, 0.34):
        add_box(
            f"Roof_LightPod_{bar_x}",
            (0.42, 0.22, 0.14),
            loc=(bar_x, -0.58, 1.48),
            mat=mat_chassis,
            bevel=0.012,
        )
        for lx_off in (-0.12, 0.0, 0.12):
            add_cyl(
                f"Roof_LED_{bar_x}_{lx_off}",
                0.042,
                0.04,
                verts=20,
                loc=(bar_x + lx_off, -0.69, 1.48),
                rot=(math.radians(90), 0, 0),
                mat=mat_led_head,
                bevel=0.004,
            )

    # Side forward double utility headlamps + status telemetry LED strips
    for sx in (-1, 1):
        for lz in (0.94, 1.05):
            add_cyl(
                f"Side_Headlamp_{sx}_{lz}",
                0.032,
                0.04,
                verts=16,
                loc=(sx * 0.67, -0.42, lz),
                rot=(0, math.radians(90), 0),
                mat=mat_led_head,
            )
        # Side EVA locker panel + green telemetry strip
        add_box(
            f"Side_Locker_{sx}",
            (0.06, 0.64, 0.48),
            loc=(sx * 0.68, 0.24, 0.92),
            mat=mat_chassis,
            bevel=0.008,
        )
        add_box(
            f"Side_StatusLED_{sx}",
            (0.065, 0.04, 0.22),
            loc=(sx * 0.685, -0.18, 0.92),
            mat=mat_hud_green,
            bevel=0.002,
        )

    # 4. Rear Pressurized Life-Support / Oxygen Tank Bay (3 vertical ribbed tanks + manifold)
    add_box("Rear_TankDeck", (1.28, 0.46, 0.16), loc=(0, 1.12, 0.62), mat=mat_chassis, bevel=0.015)
    for tx in (-0.40, 0.0, 0.40):
        add_cyl(f"Rear_O2_Tank_{tx}", 0.17, 0.72, verts=28, loc=(tx, 1.12, 1.04), mat=mat_orange, bevel=0.02)
        add_torus(f"Rear_TankBand_A_{tx}", 0.172, 0.014, loc=(tx, 1.12, 0.86), mat=mat_chassis)
        add_torus(f"Rear_TankBand_B_{tx}", 0.172, 0.014, loc=(tx, 1.12, 1.20), mat=mat_chassis)
        add_cyl(f"Rear_TankValve_{tx}", 0.05, 0.08, verts=16, loc=(tx, 1.12, 1.42), mat=mat_white)

    # High-gain rear communications whip antenna
    add_cyl("Comms_Antenna_Base", 0.04, 0.10, verts=16, loc=(-0.52, 0.65, 1.48), mat=mat_chassis)
    add_cyl("Comms_Antenna_Mast", 0.014, 0.62, verts=12, loc=(-0.52, 0.65, 1.82), mat=mat_white)
    add_cyl("Comms_Antenna_Tip", 0.026, 0.05, verts=16, loc=(-0.52, 0.65, 2.14), mat=mat_led_head)

    # 5. Authentic 6-Wheel Rocker-Bogie Suspension & Chevron-Treaded Martian Wheels
    wheel_y_positions = [-0.98, 0.08, 0.96]
    for sx in (-1, 1):
        wx = sx * 0.84
        # Rocker-bogie suspension linkage bars
        add_box(
            f"Rocker_MainArm_{sx}",
            (0.08, 1.18, 0.09),
            loc=(sx * 0.64, -0.45, 0.46),
            rot=(math.radians(6), 0, 0),
            mat=mat_chassis,
            bevel=0.01,
        )
        add_box(
            f"Bogie_RearArm_{sx}",
            (0.08, 0.98, 0.085),
            loc=(sx * 0.64, 0.52, 0.44),
            rot=(math.radians(-4), 0, 0),
            mat=mat_chassis,
            bevel=0.01,
        )
        add_cyl(
            f"Pivot_Joint_{sx}",
            0.09,
            0.14,
            verts=20,
            loc=(sx * 0.64, 0.02, 0.50),
            rot=(0, math.radians(90), 0),
            mat=mat_hub_gold,
        )

        for w_idx, wy in enumerate(wheel_y_positions):
            # Axle strut
            add_cyl(
                f"Wheel_Axle_{sx}_{w_idx}",
                0.08,
                0.36,
                verts=20,
                loc=(sx * 0.70, wy, 0.38),
                rot=(0, math.radians(90), 0),
                mat=mat_chassis,
            )
            # Main tire drum
            add_cyl(
                f"Wheel_Tire_{sx}_{w_idx}",
                0.38,
                0.32,
                verts=36,
                loc=(wx, wy, 0.38),
                rot=(0, math.radians(90), 0),
                mat=mat_tire,
                bevel=0.025,
            )
            # Anodized orange/gold hubcap rim + planetary lug ring
            add_cyl(
                f"Wheel_Rim_{sx}_{w_idx}",
                0.24,
                0.335,
                verts=28,
                loc=(wx, wy, 0.38),
                rot=(0, math.radians(90), 0),
                mat=mat_hub_gold,
                bevel=0.015,
            )
            add_cyl(
                f"Wheel_CenterHub_{sx}_{w_idx}",
                0.11,
                0.355,
                verts=20,
                loc=(wx, wy, 0.38),
                rot=(0, math.radians(90), 0),
                mat=mat_chassis,
                bevel=0.01,
            )
            # 12 Sculpted 3D Tread Grousers around each wheel circumference
            for t_i in range(12):
                ang = (t_i / 12.0) * math.tau
                tz = 0.38 + math.cos(ang) * 0.375
                ty = wy + math.sin(ang) * 0.375
                add_box(
                    f"Tread_{sx}_{w_idx}_{t_i}",
                    (0.30, 0.045, 0.028),
                    loc=(wx, ty, tz),
                    rot=(-ang, 0, math.radians(sx * 12)),
                    mat=mat_tire,
                    bevel=0.004,
                )

    export_glb(os.path.join(MODELS_DIR, "bento-rover.glb"))
    render_poster(
        os.path.join(RENDERS_DIR, "bento-rover.webp"),
        cam_loc=(-3.2, -4.1, 2.2),
        cam_target=(0, -0.05, 0.82),
        fov_deg=34,
        sun_energy=2.8,
    )


# ===========================================================================
# MODEL 4: BENTO TERRAIN POD (NASA HiRISE Planetary Relief & Bio-Core)
# ===========================================================================

def build_bento_terrain_pod():
    clear_scene()
    random.seed(108)

    mat_plinth = make_mat("Pod_Titanium", (0.10, 0.13, 0.18, 1), metallic=0.78, roughness=0.28)
    mat_orange = make_mat("Pod_OrangeAccent", (0.85, 0.36, 0.15, 1), metallic=0.25, roughness=0.35)
    mat_strata_dark = make_mat("Pod_Basalt", (0.22, 0.11, 0.07, 1), metallic=0.06, roughness=0.88)
    mat_strata_mid = make_mat("Pod_Terraces", (0.48, 0.22, 0.11, 1), metallic=0.04, roughness=0.84)
    mat_regolith_top = make_mat("Pod_RegolithTop", (0.68, 0.33, 0.17, 1), metallic=0.03, roughness=0.80)
    mat_glass = make_mat("Pod_CryoGlass", (0.65, 0.88, 0.98, 1), metallic=0.15, roughness=0.08, alpha=0.36)
    mat_cyan_led = make_mat(
        "Pod_CyanCore",
        (0.35, 0.92, 1.0, 1),
        emission=(0.30, 0.88, 1.0),
        emission_strength=4.5,
    )
    mat_flora = make_mat(
        "Pod_BotanicalGreen",
        (0.28, 0.86, 0.56, 1),
        roughness=0.35,
        emission=(0.18, 0.72, 0.45),
        emission_strength=1.4,
    )

    # 1. Precision Anodized NASA HiRISE Instrument Plinth Base
    add_cyl("HiRISE_Plinth_Base", 1.68, 0.16, verts=64, loc=(0, 0, 0.08), mat=mat_plinth, bevel=0.025)
    add_torus("HiRISE_Telemetry_Ring", 1.62, 0.014, loc=(0, 0, 0.165), mat=mat_cyan_led, segs=64)
    add_cyl("HiRISE_Mid_Collar", 1.54, 0.10, verts=64, loc=(0, 0, 0.20), mat=mat_strata_dark, bevel=0.015)

    # 2. Multi-Layer Stratigraphic Geological Relief Slab (Elysium Planitia DTEEC_017983_1865)
    def eval_hirise_relief(x, y, radius, height_scale):
        r = math.hypot(x, y)
        edge_falloff = max(0.0, min(1.0, (radius - r) / 0.22))
        # Sinuous Elysium lava channel / graben trench across front-left
        channel_d = abs((y + 0.35) - 0.25 * math.sin(x * 2.2))
        channel = -0.14 * math.exp(-(channel_d ** 2) / 0.042)
        # Eroded impact crater in front-right quadrant
        crater_r = math.hypot(x - 0.56, y + 0.40)
        crater_rim = 0.11 * math.exp(-((crater_r - 0.32) ** 2) / 0.010)
        crater_bowl = -0.15 * math.exp(-(crater_r ** 2) / 0.045)
        # Secondary smaller pit crater on front-left terrace
        pit_r = math.hypot(x + 0.52, y + 0.18)
        pit = -0.07 * math.exp(-(pit_r ** 2) / 0.025) + 0.04 * math.exp(-((pit_r - 0.20) ** 2) / 0.006)
        # Background volcanic ridge terrace
        ridge = 0.15 * math.exp(-((y - 0.55) ** 2) / 0.18)
        # Fine procedural HiRISE micro-relief
        micro = (
            0.028 * math.sin(x * 5.5 + y * 4.2)
            + 0.018 * math.cos(x * 9.0 - y * 7.5)
        )
        return 0.11 + height_scale * edge_falloff * (
            0.12 + ridge + crater_rim + crater_bowl + channel + pit + micro
        )

    # Helper to build a displaced terrain layer with crater rim, graben valley & volcanic ridge
    def build_relief_layer(name, radius, z_base, height_scale, mat, grid_res=48):
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=grid_res, radius=radius, depth=0.22, location=(0, 0, z_base)
        )
        slab = bpy.context.active_object
        slab.name = name
        bm = bmesh.new()
        bm.from_mesh(slab.data)
        top_faces = [f for f in bm.faces if f.normal.z > 0.8]
        bmesh.ops.poke(bm, faces=top_faces)
        for _ in range(3):
            top_edges = [
                e for e in bm.edges if all(v.co.z > 0.05 for v in e.verts)
            ]
            bmesh.ops.subdivide_edges(bm, edges=top_edges, cuts=1, use_grid_fill=True)

        for v in bm.verts:
            if v.co.z > 0.05:
                v.co.z = eval_hirise_relief(v.co.x, v.co.y, radius, height_scale)
        bm.to_mesh(slab.data)
        bm.free()
        shade_smooth_auto(slab)
        assign_mat(slab, mat)
        return slab

    build_relief_layer("Strata_Lower_Sulfate", 1.46, 0.30, 0.55, mat_strata_mid, grid_res=48)
    build_relief_layer("Strata_Upper_Regolith", 1.32, 0.44, 1.0, mat_regolith_top, grid_res=56)

    # Surface-Conforming Glowing Cyan LiDAR Elevation Contour Rings across the relief
    for c_idx, cr in enumerate([1.14, 0.86, 0.62]):
        ring = add_torus(
            f"LiDAR_Contour_{c_idx}",
            cr,
            0.0085,
            loc=(0, 0, 0.44),
            mat=mat_cyan_led,
            segs=96,
            ring_segs=10,
        )
        bm_c = bmesh.new()
        bm_c.from_mesh(ring.data)
        for v in bm_c.verts:
            surf_z = eval_hirise_relief(v.co.x, v.co.y, 1.32, 1.0)
            v.co.z += surf_z + 0.008
        bm_c.to_mesh(ring.data)
        bm_c.free()

    # 3. Pressurized Hydroponic Bio-Core Specimen Pod on the Central Plateau
    pod_x, pod_y, pod_z = -0.12, 0.12, 0.66
    add_cyl("BioCore_BaseCollar", 0.46, 0.12, verts=40, loc=(pod_x, pod_y, pod_z), mat=mat_plinth, bevel=0.015)
    add_torus("BioCore_OrangeSeal", 0.45, 0.022, loc=(pod_x, pod_y, pod_z + 0.07), mat=mat_orange)
    # Transparent borosilicate glass containment cylinder
    add_cyl("BioCore_GlassBell", 0.42, 0.78, verts=40, loc=(pod_x, pod_y, pod_z + 0.46), mat=mat_glass, bevel=0.0)
    # Top Titanium Cap + Cyan Grow-Light Core
    add_cyl("BioCore_TopCap", 0.45, 0.12, verts=40, loc=(pod_x, pod_y, pod_z + 0.88), mat=mat_plinth, bevel=0.02)
    add_cyl("BioCore_TopEmitter", 0.28, 0.13, verts=32, loc=(pod_x, pod_y, pod_z + 0.885), mat=mat_cyan_led)

    # 4 External Titanium Structural Tie-Rods around the glass chamber
    for deg in (45, 135, 225, 315):
        rad = math.radians(deg)
        rx = pod_x + math.cos(rad) * 0.435
        ry = pod_y + math.sin(rad) * 0.435
        add_cyl(f"BioCore_Strut_{deg}", 0.018, 0.82, verts=16, loc=(rx, ry, pod_z + 0.46), mat=mat_plinth)

    # Central glowing aeroponic nutrient column + dual helical botanical foliage tiers
    add_cyl("BioCore_CentralLamp", 0.038, 0.74, verts=20, loc=(pod_x, pod_y, pod_z + 0.46), mat=mat_cyan_led)
    for col_off in (-0.14, 0.14):
        cx = pod_x + col_off
        cy = pod_y - col_off * 0.35
        add_cyl(f"Hydro_Stem_{col_off}", 0.024, 0.68, verts=16, loc=(cx, cy, pod_z + 0.44), mat=mat_plinth)
        for tier_z in (0.24, 0.42, 0.60):
            add_torus(
                f"Hydro_Foliage_{col_off}_{tier_z}",
                0.095,
                0.042,
                loc=(cx, cy, pod_z + tier_z),
                mat=mat_flora,
                segs=24,
            )

    # 4. Micro-Scale NASA Meteorological Sensor Mast on the Right Crater Rim
    mx, my, mz = 0.64, -0.12, 0.62
    add_cyl("MetStation_Base", 0.09, 0.08, verts=20, loc=(mx, my, mz), mat=mat_plinth)
    add_cyl("MetStation_Mast", 0.018, 0.48, verts=16, loc=(mx, my, mz + 0.24), mat=mat_orange)
    add_box("MetStation_WindBoom", (0.24, 0.025, 0.025), loc=(mx, my, mz + 0.42), mat=mat_plinth)
    add_cyl("MetStation_Beacon", 0.032, 0.04, verts=16, loc=(mx, my, mz + 0.50), mat=mat_cyan_led)

    # 5. GPU-Instanced Style Angular Basaltic Boulders across the HiRISE Relief
    rock_coords = [
        (-0.78, -0.45, 0.58, 0.09),
        (-0.62, -0.68, 0.55, 0.06),
        (0.32, -0.78, 0.54, 0.08),
        (0.82, 0.28, 0.60, 0.10),
        (0.68, 0.55, 0.64, 0.07),
        (-0.75, 0.58, 0.63, 0.085),
        (-0.35, -0.72, 0.53, 0.055),
        (0.18, 0.82, 0.66, 0.075),
    ]
    for idx, (rx, ry, rz, rs) in enumerate(rock_coords):
        bpy.ops.mesh.primitive_ico_sphere_add(
            subdivisions=1,
            radius=rs,
            location=(rx, ry, rz),
            rotation=(idx * 0.7, idx * 1.1, idx * 0.4),
        )
        rk = bpy.context.active_object
        rk.name = f"HiRISE_Boulder_{idx}"
        rk.scale = (1.3, 0.9, 0.65)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        assign_mat(rk, mat_strata_dark)

    export_glb(os.path.join(MODELS_DIR, "bento-terrain-pod.glb"))
    render_poster(
        os.path.join(RENDERS_DIR, "bento-terrain-pod.webp"),
        cam_loc=(-2.6, -4.1, 2.5),
        cam_target=(0, 0, 0.58),
        fov_deg=35,
        sun_energy=2.6,
    )


if __name__ == "__main__":
    build_outpost_hero()
    build_bento_drone()
    build_bento_rover()
    build_bento_terrain_pod()
    print("ALL 4 PHOBOSIA 3D MODELS AND POSTERS GENERATED SUCCESSFULLY.")
