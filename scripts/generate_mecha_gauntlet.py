import bpy
import bmesh
import math
import os
from mathutils import Vector, Matrix, Euler

PROJECT_ROOT = r"c:\Users\USER\Documents\Antigravity\infoPhobosia-main"
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public", "cursors")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def clear_scene():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for arm in list(bpy.data.armatures):
        bpy.data.armatures.remove(arm)
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

    # 1. Segmented Ceramic-Titanium Armor (#D8DCE2, Roughness 0.35, Metallic 0.6)
    #    with procedural dark edge-wear/chipping along bevel seams & micro-scratches
    mat_armor = bpy.data.materials.new("CeramicTitaniumArmor")
    nodes = mat_armor.node_tree.nodes
    links = mat_armor.node_tree.links
    bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')

    tex_coord = nodes.new("ShaderNodeTexCoord")
    geom = nodes.new("ShaderNodeNewGeometry")
    bevel_node = nodes.new("ShaderNodeBevel")
    bevel_node.samples = 4
    bevel_node.inputs["Radius"].default_value = 0.016

    # Edge wear detection via distance(Normal, BevelNormal) + Pointiness + Noise
    vec_math_dist = nodes.new("ShaderNodeVectorMath")
    vec_math_dist.operation = 'DISTANCE'

    noise_wear = nodes.new("ShaderNodeTexNoise")
    noise_wear.inputs["Scale"].default_value = 32.0
    noise_wear.inputs["Detail"].default_value = 12.0
    noise_wear.inputs["Roughness"].default_value = 0.75

    voronoi_chip = nodes.new("ShaderNodeTexVoronoi")
    voronoi_chip.feature = 'DISTANCE_TO_EDGE'
    voronoi_chip.inputs["Scale"].default_value = 42.0

    # Isolate bevel seam edges so every plate has crisp dark chipped seams
    ramp_bevel_edge = nodes.new("ShaderNodeValToRGB")
    ramp_bevel_edge.color_ramp.elements[0].position = 0.06
    ramp_bevel_edge.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    ramp_bevel_edge.color_ramp.elements[1].position = 0.26
    ramp_bevel_edge.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)

    ramp_pointy = nodes.new("ShaderNodeValToRGB")
    ramp_pointy.color_ramp.elements[0].position = 0.51
    ramp_pointy.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    ramp_pointy.color_ramp.elements[1].position = 0.62
    ramp_pointy.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)

    math_wear_max = nodes.new("ShaderNodeMath")
    math_wear_max.operation = 'MAXIMUM'

    math_chip_mask = nodes.new("ShaderNodeMath")
    math_chip_mask.operation = 'MULTIPLY'
    math_chip_mask.use_clamp = True

    # Base ceramic-titanium color (#D8DCE2) with subtle surface texture
    base_rgb = hex_to_rgb("#D8DCE2")
    ramp_surface = nodes.new("ShaderNodeValToRGB")
    ramp_surface.color_ramp.elements[0].position = 0.18
    ramp_surface.color_ramp.elements[0].color = (base_rgb[0]*0.78, base_rgb[1]*0.79, base_rgb[2]*0.82, 1.0)
    ramp_surface.color_ramp.elements[1].position = 0.78
    ramp_surface.color_ramp.elements[1].color = (base_rgb[0]*1.05, base_rgb[1]*1.05, base_rgb[2]*1.07, 1.0)

    mix_edge_color = nodes.new("ShaderNodeMix")
    mix_edge_color.data_type = 'RGBA'
    # Dark chipped gunmetal/warm-rust edge wear color along bevel seams
    mix_edge_color.inputs["B"].default_value = (0.04, 0.032, 0.028, 1.0)

    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.09
    bump.inputs["Distance"].default_value = 0.004

    links.new(tex_coord.outputs["Object"], noise_wear.inputs["Vector"])
    links.new(tex_coord.outputs["Object"], voronoi_chip.inputs["Vector"])
    links.new(geom.outputs["Normal"], vec_math_dist.inputs[0])
    links.new(bevel_node.outputs["Normal"], vec_math_dist.inputs[1])
    links.new(vec_math_dist.outputs["Value"], ramp_bevel_edge.inputs["Fac"])
    links.new(geom.outputs["Pointiness"], ramp_pointy.inputs["Fac"])
    links.new(ramp_bevel_edge.outputs["Color"], math_wear_max.inputs[0])
    links.new(ramp_pointy.outputs["Color"], math_wear_max.inputs[1])
    links.new(math_wear_max.outputs["Value"], math_chip_mask.inputs[0])
    links.new(noise_wear.outputs["Fac"], math_chip_mask.inputs[1])

    links.new(noise_wear.outputs["Fac"], ramp_surface.inputs["Fac"])
    links.new(math_chip_mask.outputs["Value"], mix_edge_color.inputs["Factor"])
    links.new(ramp_surface.outputs["Color"], mix_edge_color.inputs["A"])

    links.new(voronoi_chip.outputs["Distance"], bump.inputs["Height"])
    links.new(bevel_node.outputs["Normal"], bump.inputs["Normal"])

    bsdf.inputs["Metallic"].default_value = 0.60
    bsdf.inputs["Roughness"].default_value = 0.35
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.85
    links.new(mix_edge_color.outputs["Result"], bsdf.inputs["Base Color"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    mats["armor"] = mat_armor

    # 2. Under-chassis & Mechanical Phalanges (#1A1D24, Metallic 0.85)
    mat_chassis = bpy.data.materials.new("GunmetalChassis")
    c_nodes = mat_chassis.node_tree.nodes
    c_links = mat_chassis.node_tree.links
    c_bsdf = next(n for n in c_nodes if n.type == 'BSDF_PRINCIPLED')
    chassis_rgb = hex_to_rgb("#1A1D24")
    c_bsdf.inputs["Base Color"].default_value = (*chassis_rgb, 1.0)
    c_bsdf.inputs["Metallic"].default_value = 0.85
    c_bsdf.inputs["Roughness"].default_value = 0.28

    c_bevel = c_nodes.new("ShaderNodeBevel")
    c_bevel.samples = 4
    c_bevel.inputs["Radius"].default_value = 0.010
    c_links.new(c_bevel.outputs["Normal"], c_bsdf.inputs["Normal"])
    mats["chassis"] = mat_chassis

    # 3. Dark Carbon Bellows / Recessed Joint Seals
    mat_seal = bpy.data.materials.new("DarkSealCarbon")
    s_bsdf = next(n for n in mat_seal.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    s_bsdf.inputs["Base Color"].default_value = (0.006, 0.007, 0.010, 1.0)
    s_bsdf.inputs["Metallic"].default_value = 0.30
    s_bsdf.inputs["Roughness"].default_value = 0.55
    mats["seal"] = mat_seal

    # 4. Warm Copper-Bronze Micro-Bolt & Seam Crevice Accent
    mat_bolt = bpy.data.materials.new("MicroBoltAccent")
    b_bsdf = next(n for n in mat_bolt.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b_bsdf.inputs["Base Color"].default_value = (0.28, 0.13, 0.04, 1.0)
    b_bsdf.inputs["Metallic"].default_value = 0.88
    b_bsdf.inputs["Roughness"].default_value = 0.25
    mats["bolt"] = mat_bolt

    # 5. Recessed Wrist & Dorsal Orange LED Telemetry Strip (#FF5500, Emission 15.0)
    mat_led = bpy.data.materials.new("WristTelemetryLED")
    l_bsdf = next(n for n in mat_led.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    led_rgb = hex_to_rgb("#FF5500")
    l_bsdf.inputs["Base Color"].default_value = (*led_rgb, 1.0)
    l_bsdf.inputs["Emission Color"].default_value = (1.0, 0.25, 0.01, 1.0)
    l_bsdf.inputs["Emission Strength"].default_value = 15.0
    l_bsdf.inputs["Roughness"].default_value = 0.1
    mats["wrist_led"] = mat_led

    # 6. HUD Emissive Rings / Containment Arcs (#FF6A00)
    mat_hud = bpy.data.materials.new("HudOrangeArc")
    h_bsdf = next(n for n in mat_hud.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    hud_rgb = hex_to_rgb("#FF6A00")
    h_bsdf.inputs["Base Color"].default_value = (*hud_rgb, 1.0)
    h_bsdf.inputs["Emission Color"].default_value = (1.0, 0.26, 0.015, 1.0)
    h_bsdf.inputs["Emission Strength"].default_value = 22.0
    mats["hud_arc"] = mat_hud

    # 7. White-Hot Inner HUD Ring Filament
    mat_hud_hot = bpy.data.materials.new("HudOrangeHot")
    hh_bsdf = next(n for n in mat_hud_hot.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    hh_bsdf.inputs["Base Color"].default_value = (1.0, 0.78, 0.32, 1.0)
    hh_bsdf.inputs["Emission Color"].default_value = (1.0, 0.58, 0.15, 1.0)
    hh_bsdf.inputs["Emission Strength"].default_value = 28.0
    mats["hud_hot"] = mat_hud_hot

    # 8. Soft Dark Smoky Backing Aura Material
    mat_aura = bpy.data.materials.new("DarkShadowAura")
    a_nodes = mat_aura.node_tree.nodes
    a_links = mat_aura.node_tree.links
    a_bsdf = next(n for n in a_nodes if n.type == 'BSDF_PRINCIPLED')
    a_bsdf.inputs["Base Color"].default_value = (0.005, 0.004, 0.004, 1.0)
    a_bsdf.inputs["Roughness"].default_value = 1.0
    if "Specular IOR Level" in a_bsdf.inputs:
        a_bsdf.inputs["Specular IOR Level"].default_value = 0.0

    a_coord = a_nodes.new("ShaderNodeTexCoord")
    a_grad = a_nodes.new("ShaderNodeTexGradient")
    a_grad.gradient_type = 'QUADRATIC_SPHERE'
    a_map = a_nodes.new("ShaderNodeMapping")
    a_ramp = a_nodes.new("ShaderNodeValToRGB")
    a_ramp.color_ramp.interpolation = 'B_SPLINE'
    a_ramp.color_ramp.elements[0].position = 0.28
    a_ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    e_mid = a_ramp.color_ramp.elements.new(0.58)
    e_mid.color = (0.35, 0.35, 0.35, 1.0)
    a_ramp.color_ramp.elements[-1].position = 0.88
    a_ramp.color_ramp.elements[-1].color = (0.75, 0.75, 0.75, 1.0)

    a_links.new(a_coord.outputs["Object"], a_map.inputs["Vector"])
    a_links.new(a_map.outputs["Vector"], a_grad.inputs["Vector"])
    a_links.new(a_grad.outputs["Fac"], a_ramp.inputs["Fac"])
    a_links.new(a_ramp.outputs["Color"], a_bsdf.inputs["Alpha"])
    mats["aura"] = mat_aura

    return mats


# --- BMesh Hard-Surface Part Builders ---

def add_prism_to_bm(bm, pts_bot, pts_top, mat_idx, xform=Matrix.Identity(4)):
    v_bot = [bm.verts.new(xform @ Vector(p)) for p in pts_bot]
    v_top = [bm.verts.new(xform @ Vector(p)) for p in pts_top]
    n = len(v_bot)
    f_top = bm.faces.new(v_top)
    f_top.material_index = mat_idx
    f_bot = bm.faces.new(list(reversed(v_bot)))
    f_bot.material_index = mat_idx
    for i in range(n):
        j = (i + 1) % n
        f_side = bm.faces.new([v_bot[i], v_bot[j], v_top[j], v_top[i]])
        f_side.material_index = mat_idx


def add_beveled_box_to_bm(bm, size_xyz, taper_top=(0.88, 0.88), mat_idx=0, xform=Matrix.Identity(4)):
    sx, sy, sz = size_xyz[0] * 0.5, size_xyz[1] * 0.5, size_xyz[2] * 0.5
    tx, ty = sx * taper_top[0], sy * taper_top[1]
    cx = min(sx, sy) * 0.22
    ct = min(tx, ty) * 0.22

    pts_bot = [
        (-sx + cx, -sy, -sz), (sx - cx, -sy, -sz),
        (sx, -sy + cx, -sz), (sx, sy - cx, -sz),
        (sx - cx, sy, -sz), (-sx + cx, sy, -sz),
        (-sx, sy - cx, -sz), (-sx, -sy + cx, -sz),
    ]
    pts_top = [
        (-tx + ct, -ty, sz), (tx - ct, -ty, sz),
        (tx, -ty + ct, sz), (tx, ty - ct, sz),
        (tx - ct, ty, sz), (-tx + ct, ty, sz),
        (-tx, ty - ct, sz), (-tx, -ty + ct, sz),
    ]
    add_prism_to_bm(bm, pts_bot, pts_top, mat_idx, xform)


def add_cylinder_to_bm(bm, radius, length, segments, mat_idx, xform=Matrix.Identity(4)):
    half_l = length * 0.5
    v_left = []
    v_right = []
    for i in range(segments):
        ang = 2.0 * math.pi * i / segments
        ca, sa = math.cos(ang), math.sin(ang)
        v_left.append(bm.verts.new(xform @ Vector((-half_l, radius * ca, radius * sa))))
        v_right.append(bm.verts.new(xform @ Vector((half_l, radius * ca, radius * sa))))

    f_l = bm.faces.new(list(reversed(v_left)))
    f_l.material_index = mat_idx
    f_r = bm.faces.new(v_right)
    f_r.material_index = mat_idx
    for i in range(segments):
        j = (i + 1) % segments
        f_s = bm.faces.new([v_left[i], v_right[i], v_right[j], v_left[j]])
        f_s.material_index = mat_idx


def create_bone_mesh_object(name, bm, mats_list, armature_obj, bone_name, bevel_width=0.007):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for m in mats_list:
        obj.data.materials.append(m)

    obj.parent = armature_obj
    obj.parent_type = 'BONE'
    obj.parent_bone = bone_name

    bone = armature_obj.data.bones[bone_name]
    bone_len = (bone.tail_local - bone.head_local).length
    obj.matrix_parent_inverse = Matrix.Translation((0.0, -bone_len, 0.0))

    if bevel_width > 0:
        bev = obj.modifiers.new("Bevel", 'BEVEL')
        bev.width = bevel_width
        bev.segments = 2
        bev.limit_method = 'ANGLE'
        bev.angle_limit = math.radians(30)
        bev.harden_normals = True

    return obj


def build_mecha_gauntlet(mats):
    """
    Creates the articulated Hard-Surface Mecha Gauntlet Armature + Segmented Armor Meshes.
    Material slots on each piece:
      0: armor (#D8DCE2 ceramic-titanium)
      1: chassis (#1A1D24 dark gunmetal)
      2: seal (dark carbon bellows)
      3: bolt (micro-bolts & warm crevice accents)
      4: wrist_led (#FF5500 telemetry LED)
    """
    mat_list = [mats["armor"], mats["chassis"], mats["seal"], mats["bolt"], mats["wrist_led"]]

    arm_data = bpy.data.armatures.new("MechaGauntletArmature")
    arm_obj = bpy.data.objects.new("MechaGauntletRig", arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='EDIT')

    eb = arm_data.edit_bones

    b_root = eb.new("Root")
    b_root.head = (0.0, 0.0, 0.0)
    b_root.tail = (0.0, 0.2, 0.0)

    b_wrist = eb.new("Wrist")
    b_wrist.head = (0.0, -0.56, -0.02)
    b_wrist.tail = (0.0, -0.28, 0.00)
    b_wrist.parent = b_root

    b_hand = eb.new("Hand")
    b_hand.head = (0.0, -0.28, 0.00)
    b_hand.tail = (0.0, 0.18, 0.02)
    b_hand.parent = b_wrist

    # Finger specs: (name, x_offset, y_knuckle, z_knuckle, lengths=(L1, L2, L3), width, splay_z_deg)
    finger_specs = [
        ("Index",  -0.185, 0.18, 0.02, (0.25, 0.19, 0.16), 0.116,  5.0),
        ("Middle", -0.060, 0.20, 0.03, (0.26, 0.20, 0.16), 0.120,  0.0),
        ("Ring",    0.068, 0.17, 0.02, (0.24, 0.18, 0.15), 0.114, -4.0),
        ("Pinky",   0.185, 0.12, 0.00, (0.20, 0.15, 0.13), 0.104, -9.0),
    ]

    for fname, fx, fy, fz, flens, fwidth, splay_deg in finger_specs:
        splay_rad = math.radians(splay_deg)
        dir_vec = Vector((-math.sin(splay_rad), math.cos(splay_rad), 0.0)).normalized()
        cur_head = Vector((fx, fy, fz))
        parent_b = b_hand
        for idx, flen in enumerate(flens, start=1):
            b_f = eb.new(f"{fname}_0{idx}")
            b_f.head = cur_head
            b_f.tail = cur_head + dir_vec * flen
            b_f.roll = 0.0
            b_f.parent = parent_b
            cur_head = b_f.tail.copy()
            parent_b = b_f

    # Thumb bones (extending clearly out on the -X radial left side, roll = 0 so Z rotation bends in XY plane)
    b_th1 = eb.new("Thumb_01")
    b_th1.head = (-0.19, -0.16, 0.00)
    b_th1.tail = (-0.34, -0.02, 0.02)
    b_th1.roll = 0.0
    b_th1.parent = b_hand

    b_th2 = eb.new("Thumb_02")
    b_th2.head = b_th1.tail.copy()
    b_th2.tail = (-0.43, 0.14, 0.03)
    b_th2.roll = 0.0
    b_th2.parent = b_th1

    b_th3 = eb.new("Thumb_03")
    b_th3.head = b_th2.tail.copy()
    b_th3.tail = (-0.46, 0.28, 0.04)
    b_th3.roll = 0.0
    b_th3.parent = b_th2

    bpy.ops.object.mode_set(mode='OBJECT')

    # --- 2. Build Hard-Surface Geometry for Wrist Cuff ("Wrist" bone) ---
    bm_wrist = bmesh.new()
    rot_z90 = Matrix.Rotation(math.radians(90), 4, 'Z')

    # Inner dark ribbed wrist neck/bellows
    for ry in (0.17, 0.21, 0.25):
        add_cylinder_to_bm(bm_wrist, radius=0.225, length=0.028, segments=24, mat_idx=1,
                           xform=Matrix.Translation((0.0, ry, -0.01)) @ rot_z90)
    add_cylinder_to_bm(bm_wrist, radius=0.208, length=0.28, segments=24, mat_idx=2,
                       xform=Matrix.Translation((0.0, 0.15, -0.01)) @ rot_z90)

    # Heavy cylindrical ceramic-titanium cuff band wrapping around lower wrist (matching reference)
    add_cylinder_to_bm(bm_wrist, radius=0.252, length=0.115, segments=28, mat_idx=0,
                       xform=Matrix.Translation((0.0, 0.075, -0.005)) @ rot_z90)

    # Dark gunmetal recessed mechanical slots & vertical ribs on the titanium cuff band
    for ang_deg in (-42, 0, 42):
        ang = math.radians(ang_deg)
        ca, sa = math.sin(ang), math.cos(ang)
        xform_slot = (
            Matrix.Translation((ca * 0.246, 0.075, sa * 0.246 - 0.005))
            @ Matrix.Rotation(-ang, 4, 'Y')
        )
        add_beveled_box_to_bm(bm_wrist, (0.032, 0.075, 0.035), taper_top=(0.9, 0.9), mat_idx=1, xform=xform_slot)

    # Lower dark gunmetal bevel rim at the bottom of the wrist cuff
    add_cylinder_to_bm(bm_wrist, radius=0.242, length=0.038, segments=28, mat_idx=1,
                       xform=Matrix.Translation((0.0, 0.00, -0.005)) @ rot_z90)

    # Thin recessed horizontal Orange LED strip on the wrist collar
    led_w_bot = [
        (-0.11, 0.228, 0.195), (-0.06, 0.222, 0.212), (0.06, 0.222, 0.212), (0.11, 0.228, 0.195),
        (0.10, 0.242, 0.198), (-0.10, 0.242, 0.198)
    ]
    led_w_top = [(p[0], p[1], p[2] + 0.022) for p in led_w_bot]
    add_prism_to_bm(bm_wrist, led_w_bot, led_w_top, mat_idx=4)

    create_bone_mesh_object("Gauntlet_WristCuff", bm_wrist, mat_list, arm_obj, "Wrist", bevel_width=0.006)

    # --- 3. Build Hard-Surface Geometry for Dorsal Hand & Metacarpals ("Hand" bone) ---
    bm_hand = bmesh.new()

    # Under-chassis palm block (dark gunmetal #1A1D24)
    palm_bot = [
        (-0.21, 0.02, -0.09), (-0.24, 0.43, -0.08), (0.23, 0.39, -0.08), (0.21, 0.02, -0.09)
    ]
    palm_top = [
        (-0.22, 0.00, 0.06), (-0.25, 0.45, 0.06), (0.24, 0.41, 0.06), (0.22, 0.00, 0.06)
    ]
    add_prism_to_bm(bm_hand, palm_bot, palm_top, mat_idx=1)

    # Central Dorsal Ceramic-Titanium Armor Plate (broad sculpted shield plate)
    center_bot = [
        (0.0, 0.05, 0.055),
        (-0.135, 0.14, 0.055),
        (-0.155, 0.42, 0.055),
        (0.0, 0.46, 0.055),
        (0.145, 0.40, 0.055),
        (0.135, 0.14, 0.055),
    ]
    center_top = [
        (0.0, 0.08, 0.138),
        (-0.120, 0.16, 0.134),
        (-0.140, 0.40, 0.125),
        (0.0, 0.44, 0.128),
        (0.130, 0.38, 0.125),
        (0.120, 0.16, 0.134),
    ]
    add_prism_to_bm(bm_hand, center_bot, center_top, mat_idx=0)

    # Left (Radial / Index-Thumb side) Angled Flank Armor Plate
    left_bot = [
        (-0.142, 0.13, 0.050),
        (-0.245, 0.16, 0.025),
        (-0.260, 0.43, 0.025),
        (-0.162, 0.42, 0.050),
    ]
    left_top = [
        (-0.128, 0.15, 0.126),
        (-0.225, 0.18, 0.095),
        (-0.240, 0.41, 0.092),
        (-0.148, 0.40, 0.118),
    ]
    add_prism_to_bm(bm_hand, left_bot, left_top, mat_idx=0)

    # Right (Ulnar / Pinky side) Segmented Flank Armor Plates
    right_upper_bot = [
        (0.142, 0.25, 0.050),
        (0.155, 0.40, 0.050),
        (0.245, 0.38, 0.022),
        (0.238, 0.22, 0.022),
    ]
    right_upper_top = [
        (0.128, 0.26, 0.120),
        (0.140, 0.38, 0.115),
        (0.228, 0.36, 0.088),
        (0.220, 0.23, 0.090),
    ]
    add_prism_to_bm(bm_hand, right_upper_bot, right_upper_top, mat_idx=0)

    right_lower_bot = [
        (0.138, 0.11, 0.048),
        (0.142, 0.23, 0.048),
        (0.238, 0.20, 0.020),
        (0.220, 0.06, 0.020),
    ]
    right_lower_top = [
        (0.122, 0.13, 0.118),
        (0.128, 0.22, 0.118),
        (0.220, 0.19, 0.086),
        (0.202, 0.08, 0.084),
    ]
    add_prism_to_bm(bm_hand, right_lower_bot, right_lower_top, mat_idx=0)

    # Lower Dorsal Collar + Thin Precision Recessed Orange LED Telemetry Strip (#FF5500)
    collar_bot = [
        (0.0, -0.01, 0.045),
        (-0.15, 0.08, 0.040),
        (-0.13, 0.13, 0.045),
        (0.0, 0.04, 0.048),
        (0.13, 0.13, 0.045),
        (0.15, 0.08, 0.040),
    ]
    collar_top = [
        (0.0, 0.00, 0.098),
        (-0.14, 0.08, 0.088),
        (-0.12, 0.12, 0.098),
        (0.0, 0.045, 0.102),
        (0.12, 0.12, 0.098),
        (0.14, 0.08, 0.088),
    ]
    add_prism_to_bm(bm_hand, collar_bot, collar_top, mat_idx=1)

    # Thin glowing orange telemetry strip at base of dorsal armor plate
    dorsal_led_bot = [
        (0.0, 0.025, 0.092),
        (-0.095, 0.082, 0.088),
        (-0.085, 0.098, 0.092),
        (0.0, 0.044, 0.095),
        (0.085, 0.098, 0.092),
        (0.095, 0.082, 0.088),
    ]
    dorsal_led_top = [(p[0], p[1], p[2] + 0.022) for p in dorsal_led_bot]
    add_prism_to_bm(bm_hand, dorsal_led_bot, dorsal_led_top, mat_idx=4)

    # 4 Knuckle Mechanical Cylinders & Micro-Bolts across the MCP row
    knuckle_coords = [
        (-0.185, 0.46, 0.04),
        (-0.060, 0.48, 0.05),
        (0.068, 0.45, 0.04),
        (0.185, 0.40, 0.02),
    ]
    for kx, ky, kz in knuckle_coords:
        add_cylinder_to_bm(
            bm_hand, radius=0.050, length=0.104, segments=16, mat_idx=1,
            xform=Matrix.Translation((kx, ky, kz))
        )
        add_cylinder_to_bm(
            bm_hand, radius=0.022, length=0.116, segments=12, mat_idx=3,
            xform=Matrix.Translation((kx, ky, kz))
        )
        # Micro-bolt indentation on dorsal armor behind each knuckle
        add_cylinder_to_bm(
            bm_hand, radius=0.013, length=0.018, segments=10, mat_idx=3,
            xform=Matrix.Translation((kx * 0.82, ky - 0.10, kz + 0.086)) @ Matrix.Rotation(math.radians(90), 4, 'Y')
        )

    for bx, by in [(-0.075, 0.16), (0.075, 0.16)]:
        add_cylinder_to_bm(
            bm_hand, radius=0.013, length=0.018, segments=10, mat_idx=3,
            xform=Matrix.Translation((bx, by, 0.132)) @ Matrix.Rotation(math.radians(90), 4, 'Y')
        )

    create_bone_mesh_object("Gauntlet_DorsalHand", bm_hand, mat_list, arm_obj, "Hand", bevel_width=0.007)

    # --- 4. Build Articulated Finger Phalanges (Index, Middle, Ring, Pinky) ---
    for fname, fx, fy, fz, flens, fwidth, splay_deg in finger_specs:
        for idx, flen in enumerate(flens, start=1):
            bname = f"{fname}_0{idx}"
            bm_f = bmesh.new()

            w_scale = 1.0 if idx == 1 else (0.91 if idx == 2 else 0.82)
            w = fwidth * w_scale
            h = w * 0.84

            # 1. Mechanical Joint Cylinder at the base pivot (0, 0, 0)
            add_cylinder_to_bm(
                bm_f, radius=h * 0.45, length=w * 0.96, segments=16, mat_idx=1,
                xform=Matrix.Translation((0.0, 0.0, 0.0))
            )
            add_cylinder_to_bm(
                bm_f, radius=h * 0.20, length=w * 1.04, segments=10, mat_idx=3,
                xform=Matrix.Translation((0.0, 0.0, 0.0))
            )

            # 2. Dark Gunmetal Inner Phalanx Chassis Core (#1A1D24)
            add_beveled_box_to_bm(
                bm_f,
                (w * 0.82, flen * 0.86, h * 0.78),
                taper_top=(0.90, 0.92),
                mat_idx=1,
                xform=Matrix.Translation((0.0, flen * 0.48, -h * 0.08))
            )

            # 3. Full-Coverage Dorsal & Lateral Ceramic-Titanium Armor Shell (#D8DCE2)
            #    Wraps over the top (+Z) and sides (+/-X) so the armor stays prominent even when curled!
            if idx < 3:
                shell_bot = [
                    (-w * 0.50, flen * 0.06, -h * 0.16),
                    (-w * 0.46, flen * 0.90, -h * 0.16),
                    (w * 0.46, flen * 0.90, -h * 0.16),
                    (w * 0.50, flen * 0.06, -h * 0.16),
                ]
                shell_top = [
                    (-w * 0.40, flen * 0.10, h * 0.54),
                    (-w * 0.36, flen * 0.86, h * 0.50),
                    (w * 0.36, flen * 0.86, h * 0.50),
                    (w * 0.40, flen * 0.10, h * 0.54),
                ]
                add_prism_to_bm(bm_f, shell_bot, shell_top, mat_idx=0)

                add_cylinder_to_bm(
                    bm_f, radius=0.010, length=0.015, segments=10, mat_idx=3,
                    xform=Matrix.Translation((0.0, flen * 0.48, h * 0.51)) @ Matrix.Rotation(math.radians(90), 4, 'Y')
                )
            else:
                tip_bot = [
                    (-w * 0.48, flen * 0.05, -h * 0.16),
                    (-w * 0.38, flen * 0.74, -h * 0.12),
                    (0.0, flen * 1.00, -h * 0.04),
                    (w * 0.38, flen * 0.74, -h * 0.12),
                    (w * 0.48, flen * 0.05, -h * 0.16),
                ]
                tip_top = [
                    (-w * 0.38, flen * 0.10, h * 0.50),
                    (-w * 0.28, flen * 0.70, h * 0.44),
                    (0.0, flen * 0.95, h * 0.28),
                    (w * 0.28, flen * 0.70, h * 0.44),
                    (w * 0.38, flen * 0.10, h * 0.50),
                ]
                add_prism_to_bm(bm_f, tip_bot, tip_top, mat_idx=0)

            create_bone_mesh_object(f"Gauntlet_{bname}", bm_f, mat_list, arm_obj, bname, bevel_width=0.005)

    # --- 5. Build Articulated Thumb Segments (Thumb_01, Thumb_02, Thumb_03) ---
    thumb_specs = [
        ("Thumb_01", 0.21, 0.150, False),
        ("Thumb_02", 0.19, 0.132, False),
        ("Thumb_03", 0.16, 0.116, True),
    ]
    for tbname, tlen, tw, is_tip in thumb_specs:
        bm_t = bmesh.new()
        th = tw * 0.86

        add_cylinder_to_bm(bm_t, radius=th * 0.46, length=tw * 0.96, segments=14, mat_idx=1)
        add_cylinder_to_bm(bm_t, radius=th * 0.22, length=tw * 1.05, segments=10, mat_idx=3)

        add_beveled_box_to_bm(
            bm_t, (tw * 0.84, tlen * 0.86, th * 0.78), taper_top=(0.88, 0.90), mat_idx=1,
            xform=Matrix.Translation((0.0, tlen * 0.48, -th * 0.08))
        )

        # Wrap white ceramic-titanium armor generously around dorsal (+Z) and outer radial (-X) sides
        if not is_tip:
            t_bot = [
                (-tw * 0.54, tlen * 0.05, -th * 0.22),
                (-tw * 0.48, tlen * 0.90, -th * 0.22),
                (tw * 0.46, tlen * 0.90, -th * 0.10),
                (tw * 0.50, tlen * 0.05, -th * 0.10),
            ]
            t_top = [
                (-tw * 0.42, tlen * 0.10, th * 0.54),
                (-tw * 0.38, tlen * 0.85, th * 0.50),
                (tw * 0.36, tlen * 0.85, th * 0.50),
                (tw * 0.40, tlen * 0.10, th * 0.54),
            ]
            add_prism_to_bm(bm_t, t_bot, t_top, mat_idx=0)
        else:
            t_bot = [
                (-tw * 0.50, tlen * 0.05, -th * 0.20),
                (-tw * 0.38, tlen * 0.72, -th * 0.14),
                (0.0, tlen * 0.98, -th * 0.04),
                (tw * 0.38, tlen * 0.72, -th * 0.10),
                (tw * 0.48, tlen * 0.05, -th * 0.12),
            ]
            t_top = [
                (-tw * 0.38, tlen * 0.10, th * 0.48),
                (-tw * 0.28, tlen * 0.68, th * 0.42),
                (0.0, tlen * 0.92, th * 0.26),
                (tw * 0.28, tlen * 0.68, th * 0.42),
                (tw * 0.38, tlen * 0.10, th * 0.48),
            ]
            add_prism_to_bm(bm_t, t_bot, t_top, mat_idx=0)

        create_bone_mesh_object(f"Gauntlet_{tbname}", bm_t, mat_list, arm_obj, tbname, bevel_width=0.005)

    return arm_obj


# --- HUD Emissive Overlays for Frames 1, 2, 4 ---

def create_arc_mesh(name, center, radius, thickness, z_height, start_deg, end_deg, segments, mat, parent=None):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    r_in = radius - thickness * 0.5
    r_out = radius + thickness * 0.5
    z_bot = -z_height * 0.5
    z_top = z_height * 0.5

    verts_in_bot, verts_out_bot, verts_in_top, verts_out_top = [], [], [], []
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
    obj.visible_glossy = False
    if parent:
        obj.parent = parent
    return obj


def keyframe_gauntlet_poses(arm_obj, mats):
    """
    Keyframes the 4 poses across timeline frames 1 to 4:
      Frame 1 (Hand Pointer): -18 deg ergonomic tilt, index extended straight up, middle/ring/pinky curled, thumb tucked.
      Frame 2 (Clickable Hand): Same pose as Frame 1, index pressed down (-8 deg X), wrist LED emission doubled.
      Frame 3 (Grab Hand): Open C-shaped claw grip, all 4 fingers & thumb semi-curled at 45 deg.
      Frame 4 (Grabbing Hand): Tighter clenched claw grip, fingers curled at 70 deg, wrist LED glowing intensely.
    """
    pb = arm_obj.pose.bones
    for b in pb:
        b.rotation_mode = 'XYZ'

    def reset_bones():
        for b in pb:
            b.location = (0.0, 0.0, 0.0)
            b.rotation_euler = (0.0, 0.0, 0.0)
            b.scale = (1.0, 1.0, 1.0)

    def insert_all_bones(frame):
        for b in pb:
            b.keyframe_insert(data_path="location", frame=frame)
            b.keyframe_insert(data_path="rotation_euler", frame=frame)
            b.keyframe_insert(data_path="scale", frame=frame)

    def curl_finger(fname, mcp_deg, pip_deg, dip_deg, splay_z_deg=0.0):
        pb[f"{fname}_01"].rotation_euler = (
            math.radians(-mcp_deg), 0.0, math.radians(splay_z_deg)
        )
        pb[f"{fname}_02"].rotation_euler = (math.radians(-pip_deg), 0.0, 0.0)
        pb[f"{fname}_03"].rotation_euler = (math.radians(-dip_deg), 0.0, 0.0)

    led_bsdf = next(n for n in mats["wrist_led"].node_tree.nodes if n.type == 'BSDF_PRINCIPLED')

    # --- FRAME 1: Hand Pointer ---
    bpy.context.scene.frame_set(1)
    reset_bones()
    # -18 deg ergonomic dorsal tilt (hand points up-left, thumb clearly visible on left)
    pb["Root"].location = (0.08, -0.08, 0.0)
    pb["Root"].rotation_euler = (math.radians(6.0), math.radians(10.0), math.radians(18.0))
    # Index fully extended straight up
    curl_finger("Index", mcp_deg=-2.0, pip_deg=0.0, dip_deg=0.0, splay_z_deg=1.0)
    # Middle, Ring, Pinky curled into palm
    curl_finger("Middle", mcp_deg=66.0, pip_deg=76.0, dip_deg=55.0, splay_z_deg=0.0)
    curl_finger("Ring",   mcp_deg=70.0, pip_deg=80.0, dip_deg=58.0, splay_z_deg=-2.0)
    curl_finger("Pinky",  mcp_deg=74.0, pip_deg=84.0, dip_deg=60.0, splay_z_deg=-4.0)
    # Thumb tucked neatly against radial side while clearly showing its 2 segmented white plates
    pb["Thumb_01"].rotation_euler = (math.radians(4.0), math.radians(-10.0), math.radians(12.0))
    pb["Thumb_02"].rotation_euler = (math.radians(-8.0), math.radians(0.0), math.radians(-24.0))
    pb["Thumb_03"].rotation_euler = (math.radians(-6.0), math.radians(0.0), math.radians(-18.0))
    insert_all_bones(1)
    led_bsdf.inputs["Emission Strength"].default_value = 15.0
    led_bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=1)

    # --- FRAME 2: Clickable Hand ---
    bpy.context.scene.frame_set(2)
    reset_bones()
    pb["Root"].location = (0.08, -0.10, 0.0)
    pb["Root"].rotation_euler = (math.radians(6.0), math.radians(10.0), math.radians(18.0))
    # Index finger pressed slightly down (-8 deg X rotation)
    curl_finger("Index", mcp_deg=8.0, pip_deg=5.0, dip_deg=4.0, splay_z_deg=1.0)
    curl_finger("Middle", mcp_deg=66.0, pip_deg=76.0, dip_deg=55.0, splay_z_deg=0.0)
    curl_finger("Ring",   mcp_deg=70.0, pip_deg=80.0, dip_deg=58.0, splay_z_deg=-2.0)
    curl_finger("Pinky",  mcp_deg=74.0, pip_deg=84.0, dip_deg=60.0, splay_z_deg=-4.0)
    pb["Thumb_01"].rotation_euler = (math.radians(4.0), math.radians(-10.0), math.radians(12.0))
    pb["Thumb_02"].rotation_euler = (math.radians(-8.0), math.radians(0.0), math.radians(-24.0))
    pb["Thumb_03"].rotation_euler = (math.radians(-6.0), math.radians(0.0), math.radians(-18.0))
    insert_all_bones(2)
    # Wrist LED emission doubled (30.0)
    led_bsdf.inputs["Emission Strength"].default_value = 30.0
    led_bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=2)

    # --- FRAME 3: Grab Hand (Open C-shaped claw grip, fingers semi-curled at 45 degrees) ---
    bpy.context.scene.frame_set(3)
    reset_bones()
    # Turn dorsal plate so the curled fingers arch over the top-left and the thumb arches out
    # on the bottom-left, forming an unmistakable open C-shaped claw hovering over an orb!
    pb["Root"].location = (0.10, -0.04, 0.0)
    pb["Root"].rotation_euler = (math.radians(12.0), math.radians(38.0), math.radians(32.0))
    curl_finger("Index",  mcp_deg=42.0, pip_deg=48.0, dip_deg=40.0, splay_z_deg=12.0)
    curl_finger("Middle", mcp_deg=45.0, pip_deg=50.0, dip_deg=42.0, splay_z_deg=6.0)
    curl_finger("Ring",   mcp_deg=48.0, pip_deg=52.0, dip_deg=44.0, splay_z_deg=0.0)
    curl_finger("Pinky",  mcp_deg=52.0, pip_deg=55.0, dip_deg=46.0, splay_z_deg=-5.0)
    # Thumb abducted wide to the left (+Z rotation opens thumb away from palm), tip curved inward (-Z)
    pb["Thumb_01"].rotation_euler = (math.radians(8.0), math.radians(-16.0), math.radians(36.0))
    pb["Thumb_02"].rotation_euler = (math.radians(-10.0), math.radians(0.0), math.radians(-12.0))
    pb["Thumb_03"].rotation_euler = (math.radians(-14.0), math.radians(0.0), math.radians(-42.0))
    insert_all_bones(3)
    led_bsdf.inputs["Emission Strength"].default_value = 15.0
    led_bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=3)

    # --- FRAME 4: Grabbing Hand (Tighter clenched claw grip, fingers curled at 70 degrees) ---
    bpy.context.scene.frame_set(4)
    reset_bones()
    pb["Root"].location = (0.08, -0.04, 0.0)
    pb["Root"].rotation_euler = (math.radians(10.0), math.radians(28.0), math.radians(24.0))
    pb["Root"].scale = (0.95, 0.95, 0.95)
    curl_finger("Index",  mcp_deg=64.0, pip_deg=70.0, dip_deg=55.0, splay_z_deg=10.0)
    curl_finger("Middle", mcp_deg=68.0, pip_deg=72.0, dip_deg=58.0, splay_z_deg=4.0)
    curl_finger("Ring",   mcp_deg=70.0, pip_deg=74.0, dip_deg=60.0, splay_z_deg=-1.0)
    curl_finger("Pinky",  mcp_deg=74.0, pip_deg=76.0, dip_deg=62.0, splay_z_deg=-6.0)
    # Thumb clenched inward into a tight power claw while keeping the C-opening visible
    pb["Thumb_01"].rotation_euler = (math.radians(10.0), math.radians(-14.0), math.radians(28.0))
    pb["Thumb_02"].rotation_euler = (math.radians(-14.0), math.radians(0.0), math.radians(-22.0))
    pb["Thumb_03"].rotation_euler = (math.radians(-18.0), math.radians(0.0), math.radians(-48.0))
    insert_all_bones(4)
    led_bsdf.inputs["Emission Strength"].default_value = 36.0
    led_bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=4)


def build_hud_effects(arm_obj, mats):
    """Builds HUD emissive overlays using exact world-space bone positions for each frame."""
    hud_groups = {}
    scene = bpy.context.scene

    # Evaluate Frame 1 fingertip position
    scene.frame_set(1)
    bpy.context.view_layer.update()
    tip_f1 = arm_obj.matrix_world @ arm_obj.pose.bones["Index_03"].tail
    f1_root = bpy.data.objects.new("HUD_Frame1_Point", None)
    scene.collection.objects.link(f1_root)
    c1 = (tip_f1.x, tip_f1.y - 0.04, -0.05)
    for idx, (a0, a1) in enumerate([(48, 82), (90, 126), (134, 166)]):
        create_arc_mesh(
            f"HUD_F1_Arc_{idx}",
            center=c1,
            radius=0.14,
            thickness=0.011,
            z_height=0.01,
            start_deg=a0,
            end_deg=a1,
            segments=16,
            mat=mats["hud_arc"],
            parent=f1_root
        )
    hud_groups[1] = f1_root

    # Evaluate Frame 2 fingertip position
    scene.frame_set(2)
    bpy.context.view_layer.update()
    tip_f2 = arm_obj.matrix_world @ arm_obj.pose.bones["Index_03"].tail
    f2_root = bpy.data.objects.new("HUD_Frame2_Click", None)
    scene.collection.objects.link(f2_root)
    c2 = (tip_f2.x, tip_f2.y - 0.03, -0.08)
    # Inner bright continuous shockwave ring around index tip
    create_arc_mesh(
        "HUD_F2_InnerRing",
        center=c2,
        radius=0.135,
        thickness=0.018,
        z_height=0.012,
        start_deg=0,
        end_deg=360,
        segments=48,
        mat=mats["hud_hot"],
        parent=f2_root
    )
    create_arc_mesh(
        "HUD_F2_InnerRingGlow",
        center=c2,
        radius=0.135,
        thickness=0.028,
        z_height=0.008,
        start_deg=0,
        end_deg=360,
        segments=48,
        mat=mats["hud_arc"],
        parent=f2_root
    )
    # Outer segmented shockwave ring
    for idx, (a0, a1) in enumerate([(8, 82), (98, 172), (188, 262), (278, 352)]):
        create_arc_mesh(
            f"HUD_F2_OuterRing_{idx}",
            center=c2,
            radius=0.235,
            thickness=0.012,
            z_height=0.010,
            start_deg=a0,
            end_deg=a1,
            segments=24,
            mat=mats["hud_arc"],
            parent=f2_root
        )
    hud_groups[2] = f2_root

    # Frame 3 (Grab Hand): Clean open C-claw
    f3_root = bpy.data.objects.new("HUD_Frame3_Grab", None)
    scene.collection.objects.link(f3_root)
    hud_groups[3] = f3_root

    # Frame 4 (Grabbing Hand): Segmented top and bottom orange containment arcs
    f4_root = bpy.data.objects.new("HUD_Frame4_Grabbing", None)
    scene.collection.objects.link(f4_root)
    grab_center = (-0.01, -0.02, -0.08)
    create_arc_mesh(
        "HUD_F4_TopArc_Main",
        center=grab_center,
        radius=0.47,
        thickness=0.018,
        z_height=0.012,
        start_deg=8,
        end_deg=116,
        segments=40,
        mat=mats["hud_arc"],
        parent=f4_root
    )
    create_arc_mesh(
        "HUD_F4_TopArc_Core",
        center=grab_center,
        radius=0.47,
        thickness=0.008,
        z_height=0.016,
        start_deg=14,
        end_deg=110,
        segments=40,
        mat=mats["hud_hot"],
        parent=f4_root
    )
    create_arc_mesh(
        "HUD_F4_BotArc_Main",
        center=grab_center,
        radius=0.47,
        thickness=0.015,
        z_height=0.012,
        start_deg=214,
        end_deg=284,
        segments=32,
        mat=mats["hud_arc"],
        parent=f4_root
    )
    hud_groups[4] = f4_root

    return hud_groups


def setup_camera_and_lights(scene):
    # Orthographic Camera looking straight down Z-axis, framed tightly on the gauntlet
    cam_data = bpy.data.cameras.new("OrthoCam")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 1.62
    cam_obj = bpy.data.objects.new("OrthoCam", cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.location = (-0.03, 0.04, 5.0)
    cam_obj.rotation_euler = (0.0, 0.0, 0.0)
    scene.camera = cam_obj

    # 1. Key Light (Bright Studio Light from Upper-Left/Front so #D8DCE2 armor plates have sculpted 3D bevels)
    key_data = bpy.data.lights.new("KeyLight", type='AREA')
    key_data.energy = 135.0
    key_data.size = 2.2
    key_data.color = (0.97, 0.98, 1.0)
    key_obj = bpy.data.objects.new("KeyLight", key_data)
    scene.collection.objects.link(key_obj)
    key_obj.location = (-1.9, 1.6, 3.1)
    key_obj.rotation_euler = (math.radians(-26), math.radians(-28), 0.0)

    # 2. Subtle Front-Dorsal Fill Light (preserves 3D contrast across the segmented dorsal plates)
    fill_data = bpy.data.lights.new("DorsalFillLight", type='AREA')
    fill_data.energy = 32.0
    fill_data.size = 3.0
    fill_data.color = (0.90, 0.94, 1.0)
    fill_obj = bpy.data.objects.new("DorsalFillLight", fill_data)
    scene.collection.objects.link(fill_obj)
    fill_obj.location = (0.3, -0.4, 3.8)
    fill_obj.rotation_euler = (math.radians(6), math.radians(6), 0.0)

    # 3. Warm Fiery Orange Rim Light on the Right (Ulnar) Side
    orange_rim_data = bpy.data.lights.new("OrangeRimLight", type='AREA')
    orange_rim_data.energy = 95.0
    orange_rim_data.size = 1.8
    orange_rim_data.color = (1.0, 0.34, 0.04)
    orange_rim_obj = bpy.data.objects.new("OrangeRimLight", orange_rim_data)
    scene.collection.objects.link(orange_rim_obj)
    orange_rim_obj.location = (2.0, -0.4, 1.5)
    orange_rim_obj.rotation_euler = (math.radians(12), math.radians(55), 0.0)


def setup_compositor(scene):
    scene.use_nodes = True
    tree = getattr(scene, 'compositing_node_group', None)
    if tree is None:
        tree = bpy.data.node_groups.new("GauntletCompositor", "CompositorNodeTree")
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
    glare.inputs["Tint"].default_value = (1.0, 0.52, 0.14, 1.0)

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

    scene.frame_start = 1
    scene.frame_end = 4

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

    # Bright studio reflection environment (invisible to camera because film_transparent = True,
    # so Metallic 0.6 ceramic-titanium armor reflects clean bright studio light!)
    world = bpy.data.worlds.new("GauntletStudioWorld")
    scene.world = world
    bg = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs[0].default_value = (0.28, 0.30, 0.34, 1.0)
    bg.inputs[1].default_value = 1.0

    mats = create_materials()
    setup_camera_and_lights(scene)
    setup_compositor(scene)

    # Soft dark smoky backing aura disc behind the gauntlet
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=32, y_subdivisions=32, size=2.0, location=(-0.04, 0.04, -0.35))
    aura_disc = bpy.context.active_object
    aura_disc.name = "Gauntlet_ShadowAura"
    aura_disc.scale = (0.72, 0.80, 1.0)
    aura_disc.data.materials.append(mats["aura"])
    aura_disc.visible_diffuse = False
    aura_disc.visible_glossy = False
    aura_disc.visible_shadow = False

    arm_obj = build_mecha_gauntlet(mats)
    keyframe_gauntlet_poses(arm_obj, mats)
    hud_groups = build_hud_effects(arm_obj, mats)

    frame_outputs = [
        (1, "hand-point.png"),
        (2, "hand-click.png"),
        (3, "hand-grab.png"),
        (4, "hand-grabbing.png"),
    ]

    for frame_num, filename in frame_outputs:
        scene.frame_set(frame_num)
        for f_idx, h_root in hud_groups.items():
            set_hierarchy_visibility(h_root, f_idx == frame_num)

        scene.render.filepath = os.path.join(OUTPUT_DIR, filename)
        bpy.ops.render.render(write_still=True)
        print(f"Rendered Frame {frame_num}: {scene.render.filepath}")

    scene.frame_set(1)
    for f_idx, h_root in hud_groups.items():
        set_hierarchy_visibility(h_root, f_idx == 1)


if __name__ == "__main__":
    main()
