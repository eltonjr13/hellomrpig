#!/usr/bin/env python3
import json
from datetime import date
from pathlib import Path
from typing import Any


def require_freecad():
    try:
        import FreeCAD as App  # type: ignore
        import Part  # type: ignore
        import Mesh  # type: ignore
        try:
            import Import as StepExport  # type: ignore
        except Exception:
            import ImportGui as StepExport  # type: ignore
    except Exception as exc:
        raise RuntimeError(
            "Run this script with FreeCADCmd/freecadcmd, for example: FreeCADCmd scripts/generate_freecad_base.py"
        ) from exc
    return App, Part, StepExport, Mesh


def load_spec(root: Path) -> dict[str, Any]:
    spec_path = root / "specs" / "product-spec.json"
    if not spec_path.exists():
        template_path = root / ".agents" / "skills" / "freecad-product-engineering" / "assets" / "product-spec.template.json"
        if not template_path.exists():
            raise FileNotFoundError("Missing specs/product-spec.json and product-spec.template.json.")
        spec_path.parent.mkdir(parents=True, exist_ok=True)
        spec_path.write_text(template_path.read_text(encoding="utf-8"), encoding="utf-8")
    return json.loads(spec_path.read_text(encoding="utf-8"))


def rounded_box_xy(App, Part, length: float, width: float, height: float, radius: float):
    radius = max(0.0, min(radius, length / 2 - 0.01, width / 2 - 0.01))
    if radius <= 0:
        return Part.makeBox(length, width, height)

    points = [
        App.Vector(radius, 0, 0),
        App.Vector(length - radius, 0, 0),
        App.Vector(length, radius, 0),
        App.Vector(length, width - radius, 0),
        App.Vector(length - radius, width, 0),
        App.Vector(radius, width, 0),
        App.Vector(0, width - radius, 0),
        App.Vector(0, radius, 0),
    ]
    edges = [
        Part.makeLine(points[0], points[1]),
        Part.makeCircle(radius, App.Vector(length - radius, radius, 0), App.Vector(0, 0, 1), 270, 360),
        Part.makeLine(points[2], points[3]),
        Part.makeCircle(radius, App.Vector(length - radius, width - radius, 0), App.Vector(0, 0, 1), 0, 90),
        Part.makeLine(points[4], points[5]),
        Part.makeCircle(radius, App.Vector(radius, width - radius, 0), App.Vector(0, 0, 1), 90, 180),
        Part.makeLine(points[6], points[7]),
        Part.makeCircle(radius, App.Vector(radius, radius, 0), App.Vector(0, 0, 1), 180, 270),
    ]
    wire = Part.Wire(edges)
    face = Part.Face(wire)
    return face.extrude(App.Vector(0, 0, height))


def cut_magnet_pockets(App, Part, base_shape, dims: dict[str, Any]):
    length = float(dims["base_length_mm"])
    width = float(dims["base_width_mm"])
    pocket_diameter = float(dims["magnet_pocket_diameter_mm"])
    pocket_depth = float(dims["magnet_pocket_depth_mm"])
    count = int(dims.get("magnet_count", 4))
    radius = pocket_diameter / 2
    positions = []
    margin_x = max(14.0, radius + 4.0)
    margin_y = max(7.0, radius + 3.0)

    if count <= 2:
        xs = [margin_x, length - margin_x][:count]
        ys = [width / 2] * count
    else:
        xs = [margin_x, length - margin_x, margin_x, length - margin_x]
        ys = [margin_y, margin_y, width - margin_y, width - margin_y]

    for x, y in zip(xs[:count], ys[:count]):
        pocket = Part.makeCylinder(radius, pocket_depth + 0.05, App.Vector(x, y, -0.025), App.Vector(0, 0, 1))
        base_shape = base_shape.cut(pocket)
        positions.append({"x_mm": round(x, 3), "y_mm": round(y, 3), "diameter_mm": pocket_diameter, "depth_mm": pocket_depth})
    return base_shape, positions


def add_part(doc, name: str, shape, color: tuple[float, float, float, float]):
    obj = doc.addObject("Part::Feature", name)
    obj.Shape = shape
    obj.ViewObject.ShapeColor = color[:3]
    obj.ViewObject.Transparency = int((1 - color[3]) * 100)
    return obj


def write_reports(root: Path, spec: dict[str, Any], magnet_positions: list[dict[str, float]]) -> None:
    reports_dir = root / "output" / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    dims = spec["dimensions"]
    assumptions = spec.get("assumptions", [])
    assumptions_path = reports_dir / "assumptions.md"
    cad_plan_path = reports_dir / "cad_plan.md"

    assumptions_lines = [
        f"# Assumptions - {spec['product']['name']}",
        "",
        f"- Date: {date.today().isoformat()}",
        "- Unit: millimeters",
        "",
        "## Registered Assumptions",
        "",
    ]
    assumptions_lines.extend(f"- {item}" for item in assumptions)
    assumptions_lines.extend([
        "- First generated CAD pass includes magnetic_base_core, straight_cable_guide, and snap_cover as printable parts.",
        "- Angled and multi-cable modules remain specified for the modular product roadmap unless explicitly modeled in this pass.",
        "",
        "## Magnet Pocket Positions",
        "",
    ])
    assumptions_lines.extend(
        f"- x={p['x_mm']} mm, y={p['y_mm']} mm, diameter={p['diameter_mm']} mm, depth={p['depth_mm']} mm"
        for p in magnet_positions
    )
    assumptions_path.write_text("\n".join(assumptions_lines) + "\n", encoding="utf-8")

    cad_plan_lines = [
        f"# CAD Plan - {spec['product']['name']}",
        "",
        f"- Date: {date.today().isoformat()}",
        "- CAD source of truth: FreeCAD",
        "- Units: mm",
        "",
        "## Printable Objects",
        "",
        "1. magnetic_base_core",
        f"   - Rounded rectangular base {dims['base_length_mm']} x {dims['base_width_mm']} x {dims['base_height_mm']} mm.",
        "   - Blind magnet pockets cut from underside.",
        "2. straight_cable_guide",
        f"   - Centered guide walls around an {dims['cable_channel_width_mm']} x {dims['cable_channel_height_mm']} mm cable channel.",
        "3. snap_cover",
        "   - Removable top cover with simple snap tabs.",
        "",
        "## Export Plan",
        "",
        "- Save native FCStd in output/cad.",
        "- Export combined STEP in output/cad.",
        "- Export individual STEP files in output/cad.",
        "- Export individual STL files in output/print.",
    ]
    cad_plan_path.write_text("\n".join(cad_plan_lines) + "\n", encoding="utf-8")


def main() -> None:
    App, Part, StepExport, Mesh = require_freecad()
    root = Path.cwd()
    spec = load_spec(root)
    dims = spec["dimensions"]
    cad_dir = root / "output" / "cad"
    print_dir = root / "output" / "print"
    cad_dir.mkdir(parents=True, exist_ok=True)
    print_dir.mkdir(parents=True, exist_ok=True)

    App.newDocument("kazento_cable_vector")
    doc = App.ActiveDocument

    length = float(dims["base_length_mm"])
    width = float(dims["base_width_mm"])
    base_height = float(dims["base_height_mm"])
    guide_height = float(dims["guide_height_mm"])
    channel_width = float(dims["cable_channel_width_mm"])
    channel_height = float(dims["cable_channel_height_mm"])
    corner_radius = float(dims["corner_radius_mm"])
    cover_thickness = float(dims.get("cover_thickness_mm", 2.4))
    snap_clearance = float(dims.get("snap_fit_clearance_mm", 0.35))

    base_shape = rounded_box_xy(App, Part, length, width, base_height, corner_radius)
    base_shape, magnet_positions = cut_magnet_pockets(App, Part, base_shape, dims)
    base = add_part(doc, "magnetic_base_core", base_shape, (0.18, 0.18, 0.18, 1.0))

    wall = (width - channel_width) / 2
    left_wall = Part.makeBox(length, wall, guide_height, App.Vector(0, 0, base_height))
    right_wall = Part.makeBox(length, wall, guide_height, App.Vector(0, width - wall, base_height))
    guide_floor = Part.makeBox(length, width, max(1.6, base_height / 2), App.Vector(0, 0, base_height))
    guide_shape = left_wall.fuse(right_wall).fuse(guide_floor)
    guide = add_part(doc, "straight_cable_guide", guide_shape, (0.05, 0.38, 0.65, 1.0))

    cover_width = channel_width + (2 * snap_clearance)
    cover_y = (width - cover_width) / 2
    cover_z = base_height + channel_height + cover_thickness
    cover_plate = Part.makeBox(length, cover_width, cover_thickness, App.Vector(0, cover_y, cover_z))
    tab_width = float(dims.get("snap_tab_width_mm", 8))
    tab_height = float(dims.get("snap_tab_height_mm", 2))
    tab_depth = float(dims.get("snap_tab_depth_mm", 3))
    tab_1 = Part.makeBox(tab_width, tab_depth, tab_height, App.Vector(length * 0.22, cover_y - tab_depth, cover_z - tab_height))
    tab_2 = Part.makeBox(tab_width, tab_depth, tab_height, App.Vector(length * 0.68, cover_y + cover_width, cover_z - tab_height))
    cover_shape = cover_plate.fuse(tab_1).fuse(tab_2)
    cover = add_part(doc, "snap_cover", cover_shape, (0.85, 0.72, 0.18, 1.0))

    for obj in (base, guide, cover):
        obj.Label = obj.Name

    doc.recompute()
    write_reports(root, spec, magnet_positions)

    native_path = cad_dir / "kazento_cable_vector.FCStd"
    combined_step = cad_dir / "kazento_cable_vector.step"
    doc.saveAs(str(native_path))
    StepExport.export([base, guide, cover], str(combined_step))
    for obj in (base, guide, cover):
        StepExport.export([obj], str(cad_dir / f"{obj.Name}.step"))
        Mesh.export([obj], str(print_dir / f"{obj.Name}.stl"))

    print(f"saved: {native_path}")
    print(f"exported: {combined_step}")
    print(f"parts: {', '.join(obj.Name for obj in (base, guide, cover))}")


if __name__ == "__main__":
    main()
