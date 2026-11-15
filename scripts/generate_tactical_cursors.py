import bpy
import bmesh
import math
import os
from mathutils import Vector

PROJECT_ROOT = r"c:\Users\USER\Documents\Antigravity\infoPhobosia-main"
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public", "cursors")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def clear_scene():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)
    for light in list(bpy.data.lights):
        bpy.data.lights.remove(light)
    for cam in list(bpy.data.cameras):
        bpy.data.cameras.remove(cam)


def hex_to_rgb(hex_str):
    h = hex_str.lstrip('#')
    return tuple(pow(int(h[i:i+2], 16) / 255.0, 2.2) for i in (0, 2, 4))


def create_materials():
    mats = {}

    # 1. White/Silver Brushed & Scratched Titanium Armor Plate
    mat_ti = bpy.data.materials.new("TitaniumArmor")
    nodes = mat_ti.node_tree.nodes
    links = mat_ti.node_tree.links
    bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')

    tex_coord = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (20.0, 5.5, 1.0)
    mapping.inputs["Rotation"].default_value = (0.0, 0.0, math.radians(35.0))

    noise_fine = nodes.new("ShaderNodeTexNoise")
    noise_fine.inputs["Scale"].default_value = 48.0
    noise_fine.inputs["Detail"].default_value = 12.0
    noise_fine.inputs["Roughness"].default_value = 0.78

    voronoi_scratch = nodes.new("ShaderNodeTexVoronoi")
    voronoi_scratch.feature = 'DISTANCE_TO_EDGE'
    voronoi_scratch.inputs["Scale"].default_value = 30.0

    mix_scratch = nodes.new("ShaderNodeMix")
    mix_scratch.data_type = 'FLOAT'
    mix_scratch.inputs["Factor"].default_value = 0.32

    ramp_color = nodes.new("ShaderNodeValToRGB")
    ramp_color.color_ramp.elements[0].position = 0.15
    ramp_color.color_ramp.elements[0].color = (0.64, 0.67, 0.72, 1.0)
    ramp_color.color_ramp.elements[1].position = 0.70
    ramp_color.color_ramp.elements[1].color = (0.95, 0.96, 0.98, 1.0)

    ramp_rough = nodes.new("ShaderNodeValToRGB")
    ramp_rough.color_ramp.elements[0].position = 0.12
    ramp_rough.color_ramp.elements[0].color = (0.16, 0.16, 0.16, 1.0)
    ramp_rough.color_ramp.elements[1].position = 0.85
    ramp_rough.color_ramp.elements[1].color = (0.34, 0.34, 0.34, 1.0)

    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.08
    bump.inputs["Distance"].default_value = 0.005

    links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], noise_fine.inputs["Vector"])
    links.new(mapping.outputs["Vector"], voronoi_scratch.inputs["Vector"])
    links.new(noise_fine.outputs["Fac"], mix_scratch.inputs["A"])
    links.new(voronoi_scratch.outputs["Distance"], mix_scratch.inputs["B"])
    links.new(mix_scratch.outputs["Result"], ramp_color.inputs["Fac"])
    links.new(mix_scratch.outputs["Result"], ramp_rough.inputs["Fac"])
    links.new(mix_scratch.outputs["Result"], bump.inputs["Height"])

    bsdf.inputs["Metallic"].default_value = 0.45
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.80
    links.new(ramp_color.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(ramp_rough.outputs["Color"], bsdf.inputs["Roughness"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    mats["titanium"] = mat_ti

    # 2. Dark Gunmetal Chamfer / Inner Bevel
    mat_gun = bpy.data.materials.new("DarkGunmetal")
    bsdf_gun = next(n for n in mat_gun.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf_gun.inputs["Base Color"].default_value = (0.032, 0.036, 0.044, 1.0)
    bsdf_gun.inputs["Metallic"].default_value = 0.80
    bsdf_gun.inputs["Roughness"].default_value = 0.28
    mats["gunmetal"] = mat_gun

    # 3. Matte-Black Carbon Trench
    mat_carbon = bpy.data.materials.new("MatteCarbonTrench")
    c_nodes = mat_carbon.node_tree.nodes
    c_links = mat_carbon.node_tree.links
    bsdf_carb = next(n for n in c_nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf_carb.inputs["Base Color"].default_value = (0.010, 0.012, 0.015, 1.0)
    bsdf_carb.inputs["Metallic"].default_value = 0.30
    bsdf_carb.inputs["Roughness"].default_value = 0.52

    c_coord = c_nodes.new("ShaderNodeTexCoord")
    c_vor = c_nodes.new("ShaderNodeTexVoronoi")
    c_vor.inputs["Scale"].default_value = 160.0
    c_bump = c_nodes.new("ShaderNodeBump")
    c_bump.inputs["Strength"].default_value = 0.06
    c_links.new(c_coord.outputs["Object"], c_vor.inputs["Vector"])
    c_links.new(c_vor.outputs["Distance"], c_bump.inputs["Height"])
    c_links.new(c_bump.outputs["Normal"], bsdf_carb.inputs["Normal"])
    mats["carbon"] = mat_carbon

    # 4. Inner Core Slot Plasma (#FF5500, Emission Strength 18.0)
    mat_core = bpy.data.materials.new("CorePlasma")
    core_bsdf = next(n for n in mat_core.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    core_rgb = hex_to_rgb("#FF5500")
    core_bsdf.inputs["Base Color"].default_value = (*core_rgb, 1.0)
    core_bsdf.inputs["Emission Color"].default_value = (1.0, 0.22, 0.01, 1.0)
    core_bsdf.inputs["Emission Strength"].default_value = 18.0
    core_bsdf.inputs["Roughness"].default_value = 0.1
    mats["core_plasma"] = mat_core

    # 5. White-Hot Inner Core Center Filament
    mat_core_hot = bpy.data.materials.new("CorePlasmaHot")
    hot_bsdf = next(n for n in mat_core_hot.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    hot_bsdf.inputs["Base Color"].default_value = (1.0, 0.78, 0.35, 1.0)
    hot_bsdf.inputs["Emission Color"].default_value = (1.0, 0.62, 0.18, 1.0)
    hot_bsdf.inputs["Emission Strength"].default_value = 28.0
    mats["core_hot"] = mat_core_hot

    # 6. Perimeter Rim Energy (#FF6A00)
    mat_rim = bpy.data.materials.new("PerimeterRimPlasma")
    rim_bsdf = next(n for n in mat_rim.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    rim_rgb = hex_to_rgb("#FF6A00")
    rim_bsdf.inputs["Base Color"].default_value = (*rim_rgb, 1.0)
    rim_bsdf.inputs["Emission Color"].default_value = (1.0, 0.24, 0.012, 1.0)
    rim_bsdf.inputs["Emission Strength"].default_value = 18.0
    rim_bsdf.inputs["Roughness"].default_value = 0.15
    mats["rim_plasma"] = mat_rim

    # 7. HUD Reticle / Shockwave Ring Plasma
    mat_hud = bpy.data.materials.new("HudReticlePlasma")
    hud_bsdf = next(n for n in mat_hud.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    hud_bsdf.inputs["Base Color"].default_value = (*rim_rgb, 1.0)
    hud_bsdf.inputs["Emission Color"].default_value = (1.0, 0.26, 0.015, 1.0)
    hud_bsdf.inputs["Emission Strength"].default_value = 16.0
    mats["hud_plasma"] = mat_hud

    # 8. Soft Dark Smoky Backing Aura Material (gives contrast under the orange plasma bloom)
    mat_aura = bpy.data.materials.new("DarkShadowAura")
    a_nodes = mat_aura.node_tree.nodes
    a_links = mat_aura.node_tree.links
    a_bsdf = next(n for n in a_nodes if n.type == 'BSDF_PRINCIPLED')
    a_bsdf.inputs["Base Color"].default_value = (0.006, 0.005, 0.005, 1.0)
    a_bsdf.inputs["Roughness"].default_value = 1.0
    if "Specular IOR Level" in a_bsdf.inputs:
        a_bsdf.inputs["Specular IOR Level"].default_value = 0.0

    a_coord = a_nodes.new("ShaderNodeTexCoord")
    a_grad = a_nodes.new("ShaderNodeTexGradient")
    a_grad.gradient_type = 'QUADRATIC_SPHERE'
    a_map = a_nodes.new("ShaderNodeMapping")
    a_map.inputs["Location"].default_value = (0.0, 0.0, 0.0)
    a_map.inputs["Scale"].default_value = (1.0, 1.0, 1.0)

    a_ramp = a_nodes.new("ShaderNodeValToRGB")
    a_ramp.color_ramp.interpolation = 'B_SPLINE'
    a_ramp.color_ramp.elements[0].position = 0.25
    a_ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    e_mid = a_ramp.color_ramp.elements.new(0.52)
    e_mid.color = (0.28, 0.28, 0.28, 1.0)
    a_ramp.color_ramp.elements[-1].position = 0.85
    a_ramp.color_ramp.elements[-1].color = (0.68, 0.68, 0.68, 1.0)

    a_links.new(a_coord.outputs["Object"], a_map.inputs["Vector"])
    a_links.new(a_map.outputs["Vector"], a_grad.inputs["Vector"])
    a_links.new(a_grad.outputs["Fac"], a_ramp.inputs["Fac"])
    a_links.new(a_ramp.outputs["Color"], a_bsdf.inputs["Alpha"])
    mats["aura"] = mat_aura

    return mats


def create_shadow_aura_disc(name, loc, scale_xy, mat, parent):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=32, y_subdivisions=32, size=2.0, location=loc)
    disc = bpy.context.active_object
    disc.name = name
    disc.scale = (scale_xy[0], scale_xy[1], 1.0)
    disc.data.materials.append(mat)
    disc.visible_diffuse = False
    disc.visible_glossy = False
    disc.visible_shadow = False
    disc.parent = parent
    return disc


def create_polygon_prism(name, pts_top, pts_bot, mat, parent=None, bevel_width=0.0, is_emissive=False):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    v_top = [bm.verts.new(Vector(p)) for p in pts_top]
    v_bot = [bm.verts.new(Vector(p)) for p in pts_bot]
    bm.verts.ensure_lookup_table()

    n = len(v_top)
    bm.faces.new(v_top)
    bm.faces.new(list(reversed(v_bot)))
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([v_bot[i], v_bot[j], v_top[j], v_top[i]])

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent

    if is_emissive:
        # Keep orange diffuse/glossy bounce from tinting the matte-black carbon trench
        obj.visible_diffuse = False
        obj.visible_glossy = False

    if bevel_width > 0:
        bev = obj.modifiers.new("Bevel", 'BEVEL')
        bev.width = bevel_width
        bev.segments = 2
        bev.limit_method = 'ANGLE'
        bev.angle_limit = math.radians(28)
        bev.harden_normals = True

    return obj


def create_rivet(name, loc, radius, depth, mat_ring, mat_pin, parent):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=radius, depth=depth, location=loc)
    ring = bpy.context.active_object
    ring.name = name + "_Hole"
    ring.data.materials.append(mat_ring)
    ring.parent = parent

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=12,
        radius=radius * 0.54,
        depth=depth * 1.05,
        location=(loc[0], loc[1], loc[2] - 0.002)
    )
    pin = bpy.context.active_object
    pin.name = name + "_Pin"
    pin.data.materials.append(mat_pin)
    pin.parent = parent


def build_tactical_arrowhead(mats):
    """
    Builds the 3-Layer Hard-Surface Tactical Sci-Fi Arrowhead.
    Coordinates in world space match:
      Tip: (-0.7, 0.8, 0)
      Left wing: (-0.3, -0.8, 0)
      Center notch: (-0.1, -0.35, 0)
      Right wing: (0.75, -0.25, 0)
    """
    root = bpy.data.objects.new("ArrowheadRoot", None)
    bpy.context.scene.collection.objects.link(root)
    root.location = (-0.14, -0.02, 0.0)
    root.rotation_euler = (0.0, 0.0, math.radians(31.5))

    # Soft dark smoky backing aura disc behind the arrowhead
    create_shadow_aura_disc("Arrow_ShadowAura", (0.0, 0.08, -0.05), (0.88, 1.05), mats["aura"], root)

    # --- LAYER 1A: Thin Scorching Orange Perimeter Rim Energy (#FF6A00) ---
    outer_bot = [
        (0.0, 0.985, -0.025),
        (-0.635, -0.685, -0.025),
        (0.0, -0.325, -0.025),
        (0.635, -0.685, -0.025),
    ]
    outer_top = [
        (0.0, 0.965, 0.018),
        (-0.620, -0.668, 0.018),
        (0.0, -0.312, 0.018),
        (0.620, -0.668, 0.018),
    ]
    create_polygon_prism(
        "Arrow_PerimeterRim", outer_top, outer_bot, mats["rim_plasma"],
        root, bevel_width=0.006, is_emissive=True
    )

    edge_strip_pairs = [
        # Left outer leading edge
        ([(-0.005, 0.968, 0.024), (-0.624, -0.672, 0.024), (-0.602, -0.650, 0.028), (0.0, 0.930, 0.028)],
         [(-0.008, 0.980, 0.005), (-0.634, -0.682, 0.005), (-0.606, -0.654, 0.005), (0.0, 0.930, 0.005)]),
        # Right outer leading edge
        ([(0.005, 0.968, 0.024), (0.0, 0.930, 0.028), (0.602, -0.650, 0.028), (0.624, -0.672, 0.024)],
         [(0.008, 0.980, 0.005), (0.0, 0.930, 0.005), (0.606, -0.654, 0.005), (0.634, -0.682, 0.005)]),
        # Left lower trailing edge
        ([(-0.624, -0.672, 0.022), (-0.008, -0.318, 0.022), (-0.008, -0.298, 0.025), (-0.602, -0.648, 0.025)],
         [(-0.634, -0.682, 0.005), (-0.008, -0.326, 0.005), (-0.008, -0.298, 0.005), (-0.606, -0.652, 0.005)]),
        # Right lower trailing edge
        ([(0.624, -0.672, 0.022), (0.602, -0.648, 0.025), (0.008, -0.298, 0.025), (0.008, -0.318, 0.022)],
         [(0.634, -0.682, 0.005), (0.606, -0.652, 0.005), (0.008, -0.298, 0.005), (0.008, -0.326, 0.005)]),
    ]
    for idx, (st_top, st_bot) in enumerate(edge_strip_pairs):
        create_polygon_prism(
            f"Arrow_RimStrip_{idx}", st_top, st_bot, mats["rim_plasma"],
            root, bevel_width=0.002, is_emissive=True
        )

    # --- LAYER 1B: Base Chassis & Recessed Matte-Black Carbon Channel ---
    chassis_bot = [
        (0.0, 0.945, 0.012),
        (-0.608, -0.652, 0.012),
        (0.0, -0.298, 0.012),
        (0.608, -0.652, 0.012),
    ]
    chassis_top = [
        (0.0, 0.920, 0.050),
        (-0.588, -0.628, 0.050),
        (0.0, -0.282, 0.050),
        (0.588, -0.628, 0.050),
    ]
    create_polygon_prism("Arrow_CarbonChassis", chassis_top, chassis_bot, mats["carbon"], root, bevel_width=0.010)

    # Lower Central Gunmetal Mechanical Chevron Joint
    joint_bot = [
        (0.0, 0.02, 0.048),
        (-0.145, -0.355, 0.048),
        (0.0, -0.275, 0.048),
        (0.145, -0.355, 0.048),
    ]
    joint_top = [
        (0.0, -0.02, 0.072),
        (-0.118, -0.330, 0.072),
        (0.0, -0.255, 0.072),
        (0.118, -0.330, 0.072),
    ]
    create_polygon_prism("Arrow_CenterJoint", joint_top, joint_bot, mats["gunmetal"], root, bevel_width=0.008)

    # --- LAYER 2: Inner Core Trench & Glowing Orange Plasma Core Slot (#FF5500, Strength 18.0) ---
    collar_bot = [
        (0.0, 0.64, 0.048),
        (-0.054, 0.49, 0.048),
        (-0.054, 0.07, 0.048),
        (0.0, -0.03, 0.048),
        (0.054, 0.07, 0.048),
        (0.054, 0.49, 0.048),
    ]
    collar_top = [
        (0.0, 0.61, 0.070),
        (-0.044, 0.47, 0.070),
        (-0.044, 0.09, 0.070),
        (0.0, 0.00, 0.070),
        (0.044, 0.09, 0.070),
        (0.044, 0.47, 0.070),
    ]
    create_polygon_prism("Arrow_CoreCollar", collar_top, collar_bot, mats["gunmetal"], root, bevel_width=0.005)

    slot_bot = [
        (0.0, 0.56, 0.058),
        (-0.028, 0.45, 0.058),
        (-0.028, 0.12, 0.058),
        (0.0, 0.04, 0.058),
        (0.028, 0.12, 0.058),
        (0.028, 0.45, 0.058),
    ]
    slot_top = [
        (0.0, 0.54, 0.086),
        (-0.022, 0.44, 0.086),
        (-0.022, 0.13, 0.086),
        (0.0, 0.06, 0.086),
        (0.022, 0.13, 0.086),
        (0.022, 0.44, 0.086),
    ]
    create_polygon_prism(
        "Arrow_PlasmaCoreSlot", slot_top, slot_bot, mats["core_plasma"],
        root, bevel_width=0.004, is_emissive=True
    )

    hot_bot = [
        (0.0, 0.49, 0.078),
        (-0.010, 0.41, 0.078),
        (-0.010, 0.16, 0.078),
        (0.0, 0.10, 0.078),
        (0.010, 0.16, 0.078),
        (0.010, 0.41, 0.078),
    ]
    hot_top = [
        (0.0, 0.48, 0.092),
        (-0.007, 0.40, 0.092),
        (-0.007, 0.17, 0.092),
        (0.0, 0.11, 0.092),
        (0.007, 0.17, 0.092),
        (0.007, 0.40, 0.092),
    ]
    create_polygon_prism(
        "Arrow_PlasmaCoreFilament", hot_top, hot_bot, mats["core_hot"],
        root, bevel_width=0.002, is_emissive=True
    )

    # --- LAYER 3: Symmetrical Titanium Armor Plates (0.03m Chamfered Bevel + 4 Micro-Rivets) ---
    for side in (-1.0, 1.0):
        side_name = "Left" if side < 0 else "Right"

        sub_bot = [
            (side * 0.020, 0.86, 0.046),
            (side * 0.565, -0.595, 0.046),
            (side * 0.120, -0.320, 0.046),
            (side * 0.062, -0.02, 0.046),
            (side * 0.062, 0.52, 0.046),
        ]
        sub_top = [
            (side * 0.026, 0.82, 0.078),
            (side * 0.538, -0.562, 0.078),
            (side * 0.130, -0.300, 0.078),
            (side * 0.070, -0.01, 0.078),
            (side * 0.070, 0.50, 0.078),
        ]
        if side > 0:
            sub_bot.reverse()
            sub_top.reverse()
        create_polygon_prism(f"Arrow_ArmorSubPlate_{side_name}", sub_top, sub_bot, mats["gunmetal"], root, bevel_width=0.014)

        main_bot = [
            (side * 0.028, 0.80, 0.074),
            (side * 0.445, -0.350, 0.074),
            (side * 0.140, -0.225, 0.074),
            (side * 0.072, 0.01, 0.074),
            (side * 0.072, 0.50, 0.074),
        ]
        main_top = [
            (side * 0.038, 0.74, 0.122),
            (side * 0.415, -0.325, 0.122),
            (side * 0.150, -0.205, 0.122),
            (side * 0.086, 0.03, 0.122),
            (side * 0.086, 0.48, 0.122),
        ]
        if side > 0:
            main_bot.reverse()
            main_top.reverse()
        create_polygon_prism(f"Arrow_TitaniumMain_{side_name}", main_top, main_bot, mats["titanium"], root, bevel_width=0.03)

        tip_bot = [
            (side * 0.456, -0.378, 0.074),
            (side * 0.528, -0.550, 0.074),
            (side * 0.142, -0.310, 0.074),
            (side * 0.146, -0.250, 0.074),
        ]
        tip_top = [
            (side * 0.426, -0.355, 0.118),
            (side * 0.495, -0.515, 0.118),
            (side * 0.156, -0.290, 0.118),
            (side * 0.160, -0.235, 0.118),
        ]
        if side > 0:
            tip_bot.reverse()
            tip_top.reverse()
        create_polygon_prism(f"Arrow_TitaniumWingTip_{side_name}", tip_top, tip_bot, mats["titanium"], root, bevel_width=0.025)

        rivet_positions = [
            (side * 0.140, 0.36, 0.120),
            (side * 0.268, -0.16, 0.120),
        ]
        for r_idx, r_pos in enumerate(rivet_positions):
            create_rivet(
                f"Arrow_Rivet_{side_name}_{r_idx}",
                r_pos,
                radius=0.018,
                depth=0.012,
                mat_ring=mats["carbon"],
                mat_pin=mats["gunmetal"],
                parent=root
            )

    return root


def create_arc_mesh(name, center, radius, thickness, z_height, start_deg, end_deg, segments, mat, parent=None):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    r_in = radius - thickness * 0.5
    r_out = radius + thickness * 0.5
    z_bot = -z_height * 0.5
    z_top = z_height * 0.5

    verts_in_bot = []
    verts_out_bot = []
    verts_in_top = []
    verts_out_top = []

    for i in range(segments + 1):
        t = i / segments
        ang = math.radians(start_deg + t * (end_deg - start_deg))
        ca, sa = math.cos(ang), math.sin(ang)
        cx, cy, cz = center
        verts_in_bot.append(bm.verts.new((cx + r_in * ca, cy + r_in * sa, cz + z_bot)))
        verts_out_bot.append(bm.verts.new((cx + r_out * ca, cy + r_out * sa, cz + z_bot)))
        verts_in_top.append(bm.verts.new((cx + r_in * ca, cy + r_in * sa, cz + z_top)))
        verts_out_top.append(bm.verts.new((cx + r_out * ca, cy + r_out * sa, cz + z_top)))

    bm.verts.ensure_lookup_table()
    for i in range(segments):
        bm.faces.new([verts_in_top[i], verts_out_top[i], verts_out_top[i+1], verts_in_top[i+1]])
        bm.faces.new([verts_out_bot[i], verts_in_bot[i], verts_in_bot[i+1], verts_out_bot[i+1]])
        bm.faces.new([verts_in_bot[i], verts_in_top[i], verts_in_top[i+1], verts_in_bot[i+1]])
        bm.faces.new([verts_out_top[i], verts_out_bot[i], verts_out_bot[i+1], verts_out_top[i+1]])

    bm.faces.new([verts_in_bot[0], verts_out_bot[0], verts_out_top[0], verts_in_top[0]])
    bm.faces.new([verts_out_bot[-1], verts_in_bot[-1], verts_in_top[-1], verts_out_top[-1]])

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.visible_diffuse = False
    if parent:
        obj.parent = parent
    return obj


def build_hover_reticle(mats):
    reticle_root = bpy.data.objects.new("HoverReticleRoot", None)
    bpy.context.scene.collection.objects.link(reticle_root)
    center = (-0.06, -0.04, -0.04)

    for idx, (a0, a1) in enumerate([(8, 82), (98, 172), (188, 262), (278, 352)]):
        create_arc_mesh(
            f"Hover_RingArc_{idx}",
            center=center,
            radius=0.66,
            thickness=0.013,
            z_height=0.01,
            start_deg=a0,
            end_deg=a1,
            segments=32,
            mat=mats["hud_plasma"],
            parent=reticle_root
        )

    for idx, (a0, a1) in enumerate([(-25, 45), (155, 225)]):
        create_arc_mesh(
            f"Hover_OuterArc_{idx}",
            center=center,
            radius=0.76,
            thickness=0.008,
            z_height=0.008,
            start_deg=a0,
            end_deg=a1,
            segments=24,
            mat=mats["hud_plasma"],
            parent=reticle_root
        )

    for idx, ang_deg in enumerate([0, 90, 180, 270]):
        ang = math.radians(ang_deg)
        ca, sa = math.cos(ang), math.sin(ang)
        r0, r1 = 0.61, 0.71
        w = 0.008
        px, py = -sa * w, ca * w
        cx, cy, cz = center
        pts_t = [
            (cx + r0*ca - px, cy + r0*sa - py, cz + 0.008),
            (cx + r1*ca - px, cy + r1*sa - py, cz + 0.008),
            (cx + r1*ca + px, cy + r1*sa + py, cz + 0.008),
            (cx + r0*ca + px, cy + r0*sa + py, cz + 0.008),
        ]
        pts_b = [(p[0], p[1], cz - 0.008) for p in pts_t]
        create_polygon_prism(f"Hover_Tick_{idx}", pts_t, pts_b, mats["hud_plasma"], reticle_root, is_emissive=True)

    return reticle_root


def build_click_shockwave(mats):
    shock_root = bpy.data.objects.new("ClickShockwaveRoot", None)
    bpy.context.scene.collection.objects.link(shock_root)
    center = (-0.18, 0.14, -0.04)

    create_arc_mesh(
        "Click_InnerWave",
        center=center,
        radius=0.62,
        thickness=0.015,
        z_height=0.012,
        start_deg=15,
        end_deg=235,
        segments=48,
        mat=mats["rim_plasma"],
        parent=shock_root
    )
    create_arc_mesh(
        "Click_OuterWave",
        center=center,
        radius=0.77,
        thickness=0.009,
        z_height=0.010,
        start_deg=30,
        end_deg=220,
        segments=48,
        mat=mats["hud_plasma"],
        parent=shock_root
    )
    return shock_root


def build_text_ibeam(mats):
    """
    Builds the Text I-Beam Geometry (cursor-text.png) matching the reference image:
    Vertical machined titanium column with flared serif T-bars at top and bottom,
    central notched waist, dark gunmetal inner bevel, and glowing orange plasma caps
    on the top and bottom outer edges.
    """
    root = bpy.data.objects.new("TextIBeamRoot", None)
    bpy.context.scene.collection.objects.link(root)

    # Soft dark smoky backing aura behind the I-beam
    create_shadow_aura_disc("IBeam_ShadowAura", (0.0, 0.0, -0.05), (0.50, 0.96), mats["aura"], root)

    def make_ibeam_contour(dx=0.0, dy=0.0):
        pts_right = [
            (0.22 + dx, 0.74 + dy),
            (0.26 + dx, 0.69),
            (0.22 + dx, 0.64 - dy),
            (0.085 + dx, 0.61 - dy),
            (0.062 + dx, 0.53),
            (0.062 + dx, 0.065),
            (0.032 + dx, 0.00),
            (0.062 + dx, -0.065),
            (0.062 + dx, -0.53),
            (0.085 + dx, -0.61 + dy),
            (0.22 + dx, -0.64 + dy),
            (0.26 + dx, -0.69),
            (0.22 + dx, -0.74 - dy),
        ]
        pts_left = [(-x, y) for (x, y) in reversed(pts_right)]
        return pts_left + pts_right

    # 1. Outer Thin Orange Rim Bevel Silhouette (#FF6A00)
    rim_2d = make_ibeam_contour(0.012, 0.012)
    rim_bot = [(x, y, -0.018) for (x, y) in rim_2d]
    rim_top = [(x, y, 0.018) for (x, y) in rim_2d]
    create_polygon_prism("IBeam_OuterRim", rim_top, rim_bot, mats["hud_plasma"], root, bevel_width=0.005, is_emissive=True)

    # 2. Dark Gunmetal Inner Bevel Frame
    gun_2d = make_ibeam_contour(0.0, 0.0)
    gun_bot = [(x, y, 0.014) for (x, y) in gun_2d]
    gun_top = [(x * 0.94, y * 0.985, 0.068) for (x, y) in gun_2d]
    create_polygon_prism("IBeam_GunmetalFrame", gun_top, gun_bot, mats["gunmetal"], root, bevel_width=0.012)

    # 3. Machined White/Silver Titanium Column with Flared Serif T-Bars & Notched Waist
    ti_2d = make_ibeam_contour(-0.018, -0.016)
    ti_bot = [(x, y, 0.062) for (x, y) in ti_2d]
    ti_top = [(x * 0.90, y * 0.98, 0.116) for (x, y) in ti_2d]
    create_polygon_prism("IBeam_TitaniumBody", ti_top, ti_bot, mats["titanium"], root, bevel_width=0.022)

    # 4. Recessed Dark Carbon Central Spine Seam & Waist Notch Clasp
    seam_bot = [(-0.009, 0.56, 0.104), (-0.009, -0.56, 0.104), (0.009, -0.56, 0.104), (0.009, 0.56, 0.104)]
    seam_top = [(-0.007, 0.55, 0.118), (-0.007, -0.55, 0.118), (0.007, -0.55, 0.118), (0.007, 0.55, 0.118)]
    create_polygon_prism("IBeam_SpineSeam", seam_top, seam_bot, mats["carbon"], root)

    waist_bot = [(-0.072, 0.016, 0.055), (-0.072, -0.016, 0.055), (0.072, -0.016, 0.055), (0.072, 0.016, 0.055)]
    waist_top = [(-0.065, 0.012, 0.119), (-0.065, -0.012, 0.119), (0.065, -0.012, 0.119), (0.065, 0.012, 0.119)]
    create_polygon_prism("IBeam_WaistClasp", waist_top, waist_bot, mats["carbon"], root, bevel_width=0.003)

    # 5. Glowing Orange Plasma Caps on Top and Bottom Outer Edges (#FF5500 / #FF6A00)
    for sign, cap_name in [(1.0, "Top"), (-1.0, "Bottom")]:
        cap_bot = [
            (-0.235, sign * 0.720, 0.020),
            (-0.210, sign * 0.768, 0.020),
            (0.210, sign * 0.768, 0.020),
            (0.235, sign * 0.720, 0.020),
        ]
        cap_top = [
            (-0.220, sign * 0.726, 0.095),
            (-0.198, sign * 0.758, 0.095),
            (0.198, sign * 0.758, 0.095),
            (0.220, sign * 0.726, 0.095),
        ]
        if sign < 0:
            cap_bot.reverse()
            cap_top.reverse()
        create_polygon_prism(
            f"IBeam_PlasmaCap_{cap_name}", cap_top, cap_bot, mats["core_plasma"],
            root, bevel_width=0.006, is_emissive=True
        )

        fil_bot = [
            (-0.195, sign * 0.738, 0.088),
            (-0.180, sign * 0.755, 0.088),
            (0.180, sign * 0.755, 0.088),
            (0.195, sign * 0.738, 0.088),
        ]
        fil_top = [
            (-0.188, sign * 0.742, 0.106),
            (-0.174, sign * 0.753, 0.106),
            (0.174, sign * 0.753, 0.106),
            (0.188, sign * 0.742, 0.106),
        ]
        if sign < 0:
            fil_bot.reverse()
            fil_top.reverse()
        create_polygon_prism(
            f"IBeam_PlasmaFilament_{cap_name}", fil_top, fil_bot, mats["core_hot"],
            root, bevel_width=0.002, is_emissive=True
        )

    for rx in (-0.12, 0.12):
        for ry in (-0.67, 0.67):
            create_rivet(
                f"IBeam_Rivet_{rx}_{ry}",
                (rx, ry, 0.115),
                radius=0.013,
                depth=0.009,
                mat_ring=mats["carbon"],
                mat_pin=mats["gunmetal"],
                parent=root
            )

    return root


def setup_camera_and_lights(scene):
    # Orthographic Camera at (0, 0, 5) looking straight down Z-axis
    cam_data = bpy.data.cameras.new("OrthoCam")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 2.4
    cam_obj = bpy.data.objects.new("OrthoCam", cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.location = (0.0, 0.0, 5.0)
    cam_obj.rotation_euler = (0.0, 0.0, 0.0)
    scene.camera = cam_obj

    # Key Light (Upper-Right Crisp Specular Light for the Titanium Bevels)
    key_data = bpy.data.lights.new("KeyLight", type='AREA')
    key_data.energy = 80.0
    key_data.size = 2.2
    key_data.color = (0.97, 0.98, 1.0)
    key_obj = bpy.data.objects.new("KeyLight", key_data)
    scene.collection.objects.link(key_obj)
    key_obj.location = (1.8, 1.6, 3.2)
    key_obj.rotation_euler = (math.radians(-28), math.radians(28), 0.0)

    # Fill Light (Soft Cool Left Fill so Left Armor Wing is sculpted with contrast)
    fill_data = bpy.data.lights.new("FillLight", type='AREA')
    fill_data.energy = 26.0
    fill_data.size = 3.0
    fill_data.color = (0.78, 0.85, 0.96)
    fill_obj = bpy.data.objects.new("FillLight", fill_data)
    scene.collection.objects.link(fill_obj)
    fill_obj.location = (-2.2, -1.2, 2.8)
    fill_obj.rotation_euler = (math.radians(22), math.radians(-32), 0.0)

    # Top Specular Grazing Light (catches the 0.03m chamfered bevels)
    rim_data = bpy.data.lights.new("TopGrazingLight", type='AREA')
    rim_data.energy = 32.0
    rim_data.size = 1.5
    rim_data.color = (1.0, 0.95, 0.90)
    rim_obj = bpy.data.objects.new("TopGrazingLight", rim_data)
    scene.collection.objects.link(rim_obj)
    rim_obj.location = (-0.4, 2.0, 2.5)
    rim_obj.rotation_euler = (math.radians(-38), math.radians(-8), 0.0)


def setup_compositor(scene):
    """
    Sets up the Bloom/Glare compositor node:
    Threshold: 0.8, Knee (Smoothness): 0.5, Radius (Size): 6 (0.6), Mix (Strength): 0.35
    """
    scene.use_nodes = True
    tree = getattr(scene, 'compositing_node_group', None)
    if tree is None:
        tree = bpy.data.node_groups.new("CursorCompositor", "CompositorNodeTree")
        scene.compositing_node_group = tree

    tree.nodes.clear()
    tree.interface.clear()
    tree.interface.new_socket(name="Image", in_out='OUTPUT', socket_type='NodeSocketColor')

    rl = tree.nodes.new("CompositorNodeRLayers")

    glare = tree.nodes.new("CompositorNodeGlare")
    glare.inputs["Type"].default_value = "Bloom"
    glare.inputs["Quality"].default_value = "High"
    glare.inputs["Highlights Threshold"].default_value = 0.8
    glare.inputs["Highlights Smoothness"].default_value = 0.5
    glare.inputs["Size"].default_value = 0.6  # Radius 6
    glare.inputs["Strength"].default_value = 0.35
    glare.inputs["Saturation"].default_value = 1.15
    glare.inputs["Tint"].default_value = (1.0, 0.55, 0.16, 1.0)

    sep_glare = tree.nodes.new("CompositorNodeSeparateColor")
    math_max1 = tree.nodes.new("ShaderNodeMath")
    math_max1.operation = 'MAXIMUM'
    math_max2 = tree.nodes.new("ShaderNodeMath")
    math_max2.operation = 'MAXIMUM'

    math_mul_glow_alpha = tree.nodes.new("ShaderNodeMath")
    math_mul_glow_alpha.operation = 'MULTIPLY'
    math_mul_glow_alpha.inputs[1].default_value = 1.45

    math_clamp_alpha = tree.nodes.new("ShaderNodeMath")
    math_clamp_alpha.operation = 'MAXIMUM'
    math_clamp_alpha.use_clamp = True

    set_alpha = tree.nodes.new("CompositorNodeSetAlpha")
    set_alpha.inputs["Type"].default_value = "Replace Alpha"

    out = tree.nodes.new("NodeGroupOutput")

    tree.links.new(rl.outputs["Image"], glare.inputs["Image"])
    tree.links.new(glare.outputs["Glare"], sep_glare.inputs["Image"])
    tree.links.new(sep_glare.outputs["Red"], math_max1.inputs[0])
    tree.links.new(sep_glare.outputs["Green"], math_max1.inputs[1])
    tree.links.new(math_max1.outputs["Value"], math_max2.inputs[0])
    tree.links.new(sep_glare.outputs["Blue"], math_max2.inputs[1])
    tree.links.new(math_max2.outputs["Value"], math_mul_glow_alpha.inputs[0])

    tree.links.new(rl.outputs["Alpha"], math_clamp_alpha.inputs[0])
    tree.links.new(math_mul_glow_alpha.outputs["Value"], math_clamp_alpha.inputs[1])

    tree.links.new(glare.outputs["Image"], set_alpha.inputs["Image"])
    tree.links.new(math_clamp_alpha.outputs["Value"], set_alpha.inputs["Alpha"])
    tree.links.new(set_alpha.outputs["Image"], out.inputs["Image"])


def set_hierarchy_visibility(root_obj, visible):
    root_obj.hide_render = not visible
    root_obj.hide_viewport = not visible
    for child in root_obj.children_recursive:
        child.hide_render = not visible
        child.hide_viewport = not visible


def main():
    clear_scene()
    scene = bpy.context.scene

    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 64
    scene.cycles.use_denoising = False
    scene.render.film_transparent = True
    scene.render.resolution_x = 256
    scene.render.resolution_y = 256
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'

    try:
        scene.view_settings.view_transform = 'AgX'
        scene.view_settings.look = 'AgX - High Contrast'
    except TypeError:
        pass

    world = bpy.data.worlds.new("TacticalStudioWorld")
    scene.world = world
    bg = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs[0].default_value = (0.05, 0.06, 0.08, 1.0)
    bg.inputs[1].default_value = 0.7

    mats = create_materials()
    setup_camera_and_lights(scene)
    setup_compositor(scene)

    arrow_root = build_tactical_arrowhead(mats)
    hover_reticle = build_hover_reticle(mats)
    click_shockwave = build_click_shockwave(mats)
    text_ibeam = build_text_ibeam(mats)

    rim_bsdf = next(n for n in mats["rim_plasma"].node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    core_bsdf = next(n for n in mats["core_plasma"].node_tree.nodes if n.type == 'BSDF_PRINCIPLED')

    # --- 1. Render pointer-default.png ---
    set_hierarchy_visibility(arrow_root, True)
    set_hierarchy_visibility(hover_reticle, False)
    set_hierarchy_visibility(click_shockwave, False)
    set_hierarchy_visibility(text_ibeam, False)
    arrow_root.scale = (1.0, 1.0, 1.0)
    rim_bsdf.inputs["Emission Strength"].default_value = 18.0
    core_bsdf.inputs["Emission Strength"].default_value = 18.0
    scene.render.filepath = os.path.join(OUTPUT_DIR, "pointer-default.png")
    bpy.ops.render.render(write_still=True)
    print("Rendered:", scene.render.filepath)

    # --- 2. Render pointer-hover.png ---
    set_hierarchy_visibility(arrow_root, True)
    set_hierarchy_visibility(hover_reticle, True)
    set_hierarchy_visibility(click_shockwave, False)
    set_hierarchy_visibility(text_ibeam, False)
    arrow_root.scale = (1.0, 1.0, 1.0)
    rim_bsdf.inputs["Emission Strength"].default_value = 24.0
    core_bsdf.inputs["Emission Strength"].default_value = 22.0
    scene.render.filepath = os.path.join(OUTPUT_DIR, "pointer-hover.png")
    bpy.ops.render.render(write_still=True)
    print("Rendered:", scene.render.filepath)

    # --- 3. Render pointer-click.png (perimeter emission 32.0, mesh scale 0.92) ---
    set_hierarchy_visibility(arrow_root, True)
    set_hierarchy_visibility(hover_reticle, False)
    set_hierarchy_visibility(click_shockwave, True)
    set_hierarchy_visibility(text_ibeam, False)
    arrow_root.scale = (0.92, 0.92, 0.92)
    rim_bsdf.inputs["Emission Strength"].default_value = 32.0
    core_bsdf.inputs["Emission Strength"].default_value = 32.0
    scene.render.filepath = os.path.join(OUTPUT_DIR, "pointer-click.png")
    bpy.ops.render.render(write_still=True)
    print("Rendered:", scene.render.filepath)

    # --- 4. Render cursor-text.png ---
    set_hierarchy_visibility(arrow_root, False)
    set_hierarchy_visibility(hover_reticle, False)
    set_hierarchy_visibility(click_shockwave, False)
    set_hierarchy_visibility(text_ibeam, True)
    rim_bsdf.inputs["Emission Strength"].default_value = 20.0
    core_bsdf.inputs["Emission Strength"].default_value = 24.0
    scene.render.filepath = os.path.join(OUTPUT_DIR, "cursor-text.png")
    bpy.ops.render.render(write_still=True)
    print("Rendered:", scene.render.filepath)


if __name__ == "__main__":
    main()
