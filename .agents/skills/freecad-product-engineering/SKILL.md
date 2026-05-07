---
name: freecad-product-engineering
description: Use when transforming a technical engineering sketch concept into a mechanical, parametric FreeCAD product for 3D printing; creating CAD products, modular parts, supports, enclosures, cable guides, magnet features, snap-fit interfaces, STEP/STL exports, or printability reports. Do not use Blender for this workflow.
---

# FreeCAD Product Engineering

## Objective

Transform a technical engineering sketch concept into a real mechanical 3D product using FreeCAD as the source of truth for dimensions, CAD modeling, separated parts, native files, STEP, and STL exports.

This skill is for functional CAD intended for 3D printing. It is not for visual-only modeling.

## Activation

Use this skill when the user asks to:

- transform a technical sketch into a 3D product;
- create a mechanical part for 3D printing;
- create a parametric FreeCAD model;
- create a modular product;
- create a support, enclosure, cable guide, snap-fit, magnet feature, insert, bracket, jig, holder, fixture, or CAD product.

## Mandatory Workflow

1. Read `/input/concept.md`.
2. Read images from `/input/sketches/` when present.
3. Read `/specs/product-spec.json`.
4. If `/specs/product-spec.json` does not exist, create it from the concept using `/assets/product-spec.template.json` as the starting structure.
5. Generate `/output/reports/assumptions.md`.
6. Generate `/output/reports/cad_plan.md`.
7. Create a parametric model in FreeCAD.
8. Keep every physical printable part as its own body/object.
9. Validate 3D printability.
10. Export the native `.FCStd`, combined `.step`, and individual `.stl` files per part.
11. Generate `/output/reports/print_report.md`.

Use helper scripts in `scripts/` when possible:

- `scripts/create_project_structure.py`
- `scripts/generate_freecad_base.py`
- `scripts/validate_printability.py`
- `scripts/export_freecad_files.py`

## CAD Rules

- Units are always millimeters.
- Use parametric measurements from `/specs/product-spec.json`.
- Do not invent dimensions silently. Record assumptions in `/output/reports/assumptions.md`.
- Each printable part must be separated into its own FreeCAD object/body.
- Object and file names must use `lowercase_snake_case`.
- Make the model functional before making it beautiful.
- Avoid decorative details in the first version.
- Keep geometry clean, editable, and easy to revise.
- Prefer simple solids, pockets, fillets, chamfers, and named features over mesh-first modeling.
- Use FreeCAD as the source of truth. Do not use Blender in this phase.

## 3D Printing Rules

- Minimum wall thickness: `1.6 mm`.
- Recommended wall thickness: `2.4 mm`.
- Snap-fit clearance range: `0.25 mm` to `0.45 mm`.
- Default snap-fit clearance: `0.35 mm`.
- Magnet housing clearance: `0.20 mm`.
- Avoid unsupported overhangs greater than `45 degrees`.
- Export STL files at real scale in millimeters.
- Suggest print orientation for every exported part.
- Prefer PETG or PLA+ unless the user specifies another material.

## Export Rules

- Save the native FreeCAD file to `/output/cad/`.
- Export combined STEP to `/output/cad/`.
- Export individual STL files to `/output/print/`.
- Export individual STEP files when practical.
- Use one exported STL per printable physical part.
- Keep export names identical to object names where possible.

## Validation Rules

Before final response, validate:

- `/input/concept.md` exists or a clear placeholder was created.
- `/specs/product-spec.json` exists and is valid JSON.
- required modules are present in the spec.
- minimum wall thickness is at least `1.6 mm`.
- snap-fit clearance is between `0.25 mm` and `0.45 mm`.
- magnet pocket clearance is `0.20 mm` unless explicitly justified.
- exported files exist where expected.
- `/output/reports/assumptions.md`, `/output/reports/cad_plan.md`, and `/output/reports/print_report.md` exist.

## Fallback If MCP Fails

If the FreeCAD MCP server is unavailable:

1. Do not switch to Blender.
2. Try `FreeCADCmd` or `freecadcmd` with the Python scripts in `scripts/`.
3. If FreeCAD is not available in PATH, generate or update the spec, assumptions, CAD plan, and printability report.
4. Provide the exact command the user can run after installing or exposing FreeCAD in PATH.
5. Keep all output structure ready for the next run.

## Final Checklist

- [ ] Concept read from `/input/concept.md`.
- [ ] Sketches reviewed from `/input/sketches/` when present.
- [ ] Product spec created or updated at `/specs/product-spec.json`.
- [ ] Assumptions recorded at `/output/reports/assumptions.md`.
- [ ] CAD plan recorded at `/output/reports/cad_plan.md`.
- [ ] FreeCAD model created with separated printable parts.
- [ ] Native `.FCStd` exported.
- [ ] Combined `.step` exported.
- [ ] Individual `.stl` files exported.
- [ ] Printability report generated.
- [ ] Next steps and pending assumptions clearly listed.
