import argparse
import json
import math
import re
from pathlib import Path

import bpy
from mathutils import Vector

PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUT = PROJECT_ROOT / 'public/assets/anatomy/mesh-plates'
WIDTH = 720
HEIGHT = 980

MUSCLES = {
    'brachioradialis': ['Brachioradialis muscle.r'],
    'anconeus': ['Anconeus muscle.r'],
    'supinator': ['Supinator.r'],
    'flexor-digitorum-superficialis': [
        'Flexor digitorum superficialis humero-ulnar head.r',
        'Flexor digitorum superficialis radial head.r',
    ],
    'flexor-digitorum-profundus': ['Flexor digitorum profundus.r'],
    'flexor-carpi-ulnaris': [
        'Humeral head of flexor carpi ulnaris.r',
        'Ulnar head of flexor carpi ulnaris.r',
    ],
    'flexor-carpi-radialis': ['Flexor carpi radialis.r'],
    'palmaris-longus': ['Palmaris longus muscle.r'],
    'flexor-pollicis-longus': ['Flexor pollicis longus.r'],
    'pronator-teres': ['Humeral head of pronator teres.r', 'Ulnar head of pronator teres.r'],
    'pronator-quadratus': ['Pronator quadratus.r'],
    'extensor-digitorum': ['Extensor digitorum.r'],
    'extensor-carpi-radialis-brevis': ['Extensor carpi radialis brevis.r'],
    'extensor-carpi-radialis-longus': ['Extensor carpi radialis longus.r'],
    'extensor-carpi-ulnaris': [
        'Humeral head of extensor carpi ulnaris.r',
        'Ulnar head of extensor carpi ulnaris.r',
    ],
    'extensor-digiti-minimi': ['Extensor digiti minimi.r'],
    'extensor-indicis': ['Extensor indicis.r'],
    'extensor-pollicis-longus': ['Extensor pollicis longus.r'],
    'extensor-pollicis-brevis': ['Extensor pollicis brevis.r'],
    'abductor-pollicis-longus': ['Abductor pollicis longus.r'],
}

PASSES = {
    'anterior-surface': {
        'title': 'Palmar · surface',
        'camera': 'anterior',
        'muscles': [
            'brachioradialis', 'flexor-digitorum-superficialis',
            'flexor-carpi-ulnaris', 'flexor-carpi-radialis',
            'palmaris-longus', 'pronator-teres',
        ],
    },
    'posterior-surface': {
        'title': 'Dorsal · surface',
        'camera': 'posterior',
        'muscles': [
            'brachioradialis', 'anconeus', 'extensor-digitorum',
            'extensor-carpi-radialis-brevis', 'extensor-carpi-radialis-longus',
            'extensor-carpi-ulnaris', 'extensor-digiti-minimi',
        ],
    },
    'anterior-deep': {
        'title': 'Palmar · deep',
        'camera': 'anterior',
        'muscles': [
            'flexor-digitorum-profundus', 'flexor-pollicis-longus',
            'pronator-quadratus',
        ],
    },
    'posterior-deep': {
        'title': 'Dorsal · deep',
        'camera': 'posterior',
        'muscles': [
            'supinator', 'abductor-pollicis-longus', 'extensor-pollicis-brevis',
            'extensor-pollicis-longus', 'extensor-indicis',
        ],
    },
    'lateral-surface': {
        'title': 'Thumb side · surface',
        'camera': 'lateral',
        'muscles': [
            'brachioradialis', 'flexor-carpi-radialis',
            'extensor-carpi-radialis-longus', 'extensor-carpi-radialis-brevis',
        ],
    },
    'lateral-deep': {
        'title': 'Thumb side · deep',
        'camera': 'lateral',
        'muscles': [
            'supinator', 'flexor-pollicis-longus', 'abductor-pollicis-longus',
            'extensor-pollicis-brevis', 'extensor-pollicis-longus',
        ],
    },
}


def norm(value: str) -> str:
    return re.sub(r'[^a-z0-9]+', '', value.lower())


def object_center(obj):
    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    return sum(corners, Vector()) / 8


def is_forearm_context(obj):
    if obj.type != 'MESH':
        return False
    lower = obj.name.lower()
    center = object_center(obj)
    if not 0.64 <= center.z <= 1.25:
        return False
    # Do not use generic terms such as "carpal" here: those also match the
    # source model's vascular and ligament meshes. Plates keep only hard-bone
    # orientation context; all soft tissue comes from the mapped muscle meshes.
    if any(token in lower for token in ['artery', 'vein', 'nerve', 'ligament', 'capsule', 'fascia', 'tendon', 'cart']):
        return False
    return 'bone' in lower or any(token in lower for token in [
        'radius.r', 'ulna.r', 'phalanx', 'metacarpal', 'scaphoid', 'trapezium',
        'trapezoid', 'capitate', 'hamate', 'lunate', 'pisiform', 'triquetrum',
    ])


def make_material(name, color, roughness=0.56, emission=None):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = 0.0
    if emission is not None:
        bsdf.inputs['Emission Color'].default_value = (*emission, 1)
        bsdf.inputs['Emission Strength'].default_value = 0.12
    return material


def material_for_id(muscle_id):
    palette = {
        'brachioradialis': (0.55, 0.16, 0.13),
        'anconeus': (0.49, 0.14, 0.12),
        'supinator': (0.45, 0.12, 0.10),
        'flexor-digitorum-superficialis': (0.58, 0.19, 0.16),
        'flexor-digitorum-profundus': (0.49, 0.13, 0.12),
        'flexor-carpi-ulnaris': (0.53, 0.15, 0.13),
        'flexor-carpi-radialis': (0.61, 0.19, 0.15),
        'palmaris-longus': (0.55, 0.18, 0.14),
        'flexor-pollicis-longus': (0.50, 0.14, 0.12),
        'pronator-teres': (0.64, 0.21, 0.17),
        'pronator-quadratus': (0.47, 0.12, 0.11),
        'extensor-digitorum': (0.55, 0.17, 0.15),
        'extensor-carpi-radialis-brevis': (0.59, 0.20, 0.17),
        'extensor-carpi-radialis-longus': (0.62, 0.21, 0.17),
        'extensor-carpi-ulnaris': (0.50, 0.14, 0.13),
        'extensor-digiti-minimi': (0.53, 0.16, 0.14),
        'extensor-indicis': (0.45, 0.12, 0.11),
        'extensor-pollicis-longus': (0.54, 0.17, 0.14),
        'extensor-pollicis-brevis': (0.50, 0.14, 0.12),
        'abductor-pollicis-longus': (0.57, 0.18, 0.15),
    }
    color = palette[muscle_id]
    return make_material(f'Plate muscle {muscle_id}', color, roughness=0.5, emission=tuple(component * 0.1 for component in color))


def set_material(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)


def aim(camera, target):
    camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()


def configure_camera(scene, direction, target):
    camera_data = bpy.data.cameras.new('Heatmap Orthographic Camera')
    camera = bpy.data.objects.new('Heatmap Orthographic Camera', camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera_data.type = 'ORTHO'
    camera_data.ortho_scale = 0.68
    # The imported atlas is vertically aligned on Z and presents its palmar/
    # dorsal faces along X. Looking along Y produced a lateral view.
    if direction == 'anterior':
        offset = Vector((3.2, 0.0, 0.0))
    elif direction == 'posterior':
        offset = Vector((-3.2, 0.0, 0.0))
    else:
        offset = Vector((0.0, 3.2, 0.0))
    camera.location = target + offset
    aim(camera, target)
    return camera


def set_visibility(objects, muscle_objects, active_ids, show_context=True):
    active_objects = {obj for muscle_id in active_ids for obj in muscle_objects[muscle_id]}
    for obj in objects:
        if obj.type != 'MESH':
            continue
        obj.hide_render = not (obj in active_objects or (show_context and is_forearm_context(obj)))
        obj.hide_viewport = obj.hide_render


def render(scene, path):
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    global OUT
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', type=Path, required=True, help='Path to the separately named source GLB.')
    parser.add_argument('--out', type=Path, default=OUT, help='Output folder for plate and mask PNG files.')
    parser.add_argument('--pass', dest='pass_key', choices=list(PASSES))
    parser.add_argument('--plate-only', action='store_true')
    parser.add_argument('--debug-visibility', action='store_true')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])

    model = args.model.expanduser().resolve()
    if not model.is_file():
        raise FileNotFoundError(f'Source GLB not found: {model}')
    OUT = args.out.expanduser().resolve()
    OUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(model))
    scene = bpy.context.scene
    # Blender 4.0.2 in this environment exposes the legacy enum name for Eevee.
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = WIDTH
    scene.render.resolution_y = HEIGHT
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.render.image_settings.compression = 18
    scene.render.film_transparent = True
    scene.render.image_settings.color_mode = 'RGBA'

    # A neutral, directional studio light exposes real mesh curvature without inventing anatomy.
    if scene.world is None:
        scene.world = bpy.data.worlds.new('Heatmap render world')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.01, 0.02, 0.04, 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.18
    def light(name, loc, energy, size, color):
        data = bpy.data.lights.new(name, 'AREA')
        data.energy = energy
        data.shape = 'DISK'
        data.size = size
        data.color = color
        obj = bpy.data.objects.new(name, data)
        scene.collection.objects.link(obj)
        obj.location = loc
        return obj
    light('Key', (-1.2, 2.4, 1.35), 550, 1.8, (1.0, 0.78, 0.68))
    light('Fill', (1.8, -1.5, 1.1), 420, 2.4, (0.42, 0.64, 1.0))
    light('Top', (0.0, 0.0, 3.0), 280, 1.6, (1.0, 0.92, 0.82))

    objects = list(scene.objects)
    lookup = {norm(obj.name): obj for obj in objects if obj.type == 'MESH'}
    muscle_objects = {}
    for muscle_id, names in MUSCLES.items():
        matched = []
        for name in names:
            obj = lookup.get(norm(name))
            if obj is None:
                raise RuntimeError(f'Missing mesh: {name} for {muscle_id}')
            matched.append(obj)
        muscle_objects[muscle_id] = matched

    bone_material = make_material('Plate bone', (0.63, 0.69, 0.70), roughness=0.6)
    for obj in objects:
        if is_forearm_context(obj):
            set_material(obj, bone_material)
    for muscle_id, meshes in muscle_objects.items():
        for obj in meshes:
            set_material(obj, material_for_id(muscle_id))

    all_pts = []
    for obj in objects:
        if is_forearm_context(obj) or obj in {mesh for meshes in muscle_objects.values() for mesh in meshes}:
            all_pts.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    center = Vector((
        (min(p.x for p in all_pts) + max(p.x for p in all_pts)) / 2,
        (min(p.y for p in all_pts) + max(p.y for p in all_pts)) / 2,
        (min(p.z for p in all_pts) + max(p.z for p in all_pts)) / 2,
    ))

    manifest = {'width': WIDTH, 'height': HEIGHT, 'passes': {}}
    selected_passes = [args.pass_key] if args.pass_key else list(PASSES)
    for pass_key in selected_passes:
        definition = PASSES[pass_key]
        set_visibility(objects, muscle_objects, definition['muscles'], show_context=True)
        if args.debug_visibility:
            print(f'VISIBLE OBJECTS {pass_key}')
            for obj in objects:
                if obj.type == 'MESH' and not obj.hide_render:
                    corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
                    extent = Vector((
                        max(point.x for point in corners) - min(point.x for point in corners),
                        max(point.y for point in corners) - min(point.y for point in corners),
                        max(point.z for point in corners) - min(point.z for point in corners),
                    ))
                    print(f'  {obj.name}\textent={tuple(round(value, 3) for value in extent)}')
        camera = configure_camera(scene, definition['camera'], center)
        render(scene, OUT / f'{pass_key}.png')
        bpy.data.objects.remove(camera, do_unlink=True)
        manifest['passes'][pass_key] = {'title': definition['title'], 'muscles': definition['muscles']}
        if args.plate_only:
            continue
        mask_material = make_material('Mask white', (1, 1, 1), roughness=0.5)
        bsdf = mask_material.node_tree.nodes['Principled BSDF']
        bsdf.inputs['Emission Color'].default_value = (1, 1, 1, 1)
        bsdf.inputs['Emission Strength'].default_value = 1.0
        for muscle_id in definition['muscles']:
            set_visibility(objects, muscle_objects, [muscle_id], show_context=False)
            for obj in muscle_objects[muscle_id]:
                set_material(obj, mask_material)
            camera = configure_camera(scene, definition['camera'], center)
            render(scene, OUT / f'{pass_key}__{muscle_id}.png')
            bpy.data.objects.remove(camera, do_unlink=True)
            for obj in muscle_objects[muscle_id]:
                set_material(obj, material_for_id(muscle_id))

    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Wrote {len(selected_passes)} plate pass(es) to {OUT}')


if __name__ == '__main__':
    import sys
    main()
