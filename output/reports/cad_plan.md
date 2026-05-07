# CAD Plan - KAZENTO Cable Vector

- Date: 2026-05-07
- CAD source of truth: FreeCAD
- Units: mm
- Manufacturing target: FDM 3D printing

## Inputs

- Concept: `input/concept.md`
- Specification: `specs/product-spec.json`
- Sketches: `input/sketches/`
- References: `input/references/`

## Printable Objects

1. `magnetic_base_core`
   - Rounded rectangular base: 120 x 28 x 7 mm.
   - Four blind magnet pockets: 6.2 x 2.2 mm.
   - Print orientation: flat on bottom face.
2. `straight_cable_guide`
   - Straight centered cable guide.
   - Cable channel: 18 x 9 mm.
   - Guide height: 16 mm.
   - Print orientation: flat on base contact face.
3. `snap_cover`
   - Removable cover with snap tabs.
   - Default snap-fit clearance: 0.35 mm.
   - Print orientation: flat underside on print bed.

## Modular Interfaces

- `modular_snap_interface` defines the reusable snap-fit connection logic.
- `internal_magnet_slots` defines the shared magnet pocket feature set.
- `angled_redirection_module` and `multi_cable_channel_module` should reuse the same base and snap interface dimensions.

## Export Plan

- Native file: `output/cad/kazento_cable_vector.FCStd`
- Combined STEP: `output/cad/kazento_cable_vector.step`
- Individual STEP files: `output/cad/{part_name}.step`
- Individual STL files: `output/print/{part_name}.stl`

## Validation Plan

- Validate wall thickness >= 1.6 mm.
- Validate recommended wall thickness target of 2.4 mm.
- Validate snap-fit clearance between 0.25 mm and 0.45 mm.
- Validate magnet housing clearance of 0.20 mm.
- Verify real-scale STL exports in slicer before printing.
