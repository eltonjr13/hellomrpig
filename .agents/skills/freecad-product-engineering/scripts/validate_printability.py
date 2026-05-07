#!/usr/bin/env python3
import json
from datetime import date
from pathlib import Path
from typing import Any


REQUIRED_MODULES = {
    "magnetic_base_core",
    "straight_cable_guide",
    "snap_cover",
    "angled_redirection_module",
    "multi_cable_channel_module",
    "modular_snap_interface",
    "internal_magnet_slots",
}


def load_spec(root: Path) -> dict[str, Any]:
    spec_path = root / "specs" / "product-spec.json"
    if not spec_path.exists():
        raise FileNotFoundError(f"Missing spec file: {spec_path}")
    return json.loads(spec_path.read_text(encoding="utf-8"))


def module_names(spec: dict[str, Any]) -> set[str]:
    return {str(module.get("name", "")) for module in spec.get("modules", [])}


def validate(spec: dict[str, Any]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    dims = spec.get("dimensions", {})
    rules = spec.get("print_rules", {})

    minimum_wall = float(rules.get("minimum_wall_thickness_mm", 0))
    recommended_wall = float(rules.get("recommended_wall_thickness_mm", 0))
    if minimum_wall < 1.6:
        errors.append(f"minimum_wall_thickness_mm is {minimum_wall}; required minimum is 1.6 mm.")
    if recommended_wall < 2.4:
        warnings.append(f"recommended_wall_thickness_mm is {recommended_wall}; recommended value is 2.4 mm.")

    snap_clearance = float(dims.get("snap_fit_clearance_mm", rules.get("snap_fit_clearance_default_mm", 0)))
    if not 0.25 <= snap_clearance <= 0.45:
        errors.append(f"snap_fit_clearance_mm is {snap_clearance}; required range is 0.25 mm to 0.45 mm.")

    magnet_diameter = float(dims.get("magnet_diameter_mm", 0))
    magnet_pocket_diameter = float(dims.get("magnet_pocket_diameter_mm", 0))
    magnet_clearance = round(magnet_pocket_diameter - magnet_diameter, 3)
    if abs(magnet_clearance - 0.2) > 0.05:
        warnings.append(f"magnet diameter clearance is {magnet_clearance} mm; target is 0.20 mm.")

    magnet_height = float(dims.get("magnet_height_mm", 0))
    magnet_pocket_depth = float(dims.get("magnet_pocket_depth_mm", 0))
    depth_clearance = round(magnet_pocket_depth - magnet_height, 3)
    if abs(depth_clearance - 0.2) > 0.05:
        warnings.append(f"magnet depth clearance is {depth_clearance} mm; target is 0.20 mm.")

    missing_modules = sorted(REQUIRED_MODULES - module_names(spec))
    if missing_modules:
        errors.append("missing required modules: " + ", ".join(missing_modules))

    base_width = float(dims.get("base_width_mm", 0))
    channel_width = float(dims.get("cable_channel_width_mm", 0))
    side_wall = (base_width - channel_width) / 2
    if side_wall < minimum_wall:
        errors.append(f"calculated side wall is {side_wall:.2f} mm; minimum is {minimum_wall:.2f} mm.")

    return errors, warnings


def write_report(root: Path, spec: dict[str, Any], errors: list[str], warnings: list[str]) -> Path:
    reports_dir = root / "output" / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    path = reports_dir / "print_report.md"
    status = "PASS" if not errors else "FAIL"
    dims = spec.get("dimensions", {})
    modules = sorted(module_names(spec))

    lines = [
        f"# Printability Report - {spec.get('product', {}).get('name', 'Unnamed Product')}",
        "",
        f"- Date: {date.today().isoformat()}",
        f"- Status: {status}",
        "- Unit: mm",
        "- Recommended materials: PETG or PLA+",
        "",
        "## Checked Dimensions",
        "",
        f"- Base: {dims.get('base_length_mm')} x {dims.get('base_width_mm')} x {dims.get('base_height_mm')} mm",
        f"- Cable channel: {dims.get('cable_channel_width_mm')} x {dims.get('cable_channel_height_mm')} mm",
        f"- Magnet pocket: {dims.get('magnet_pocket_diameter_mm')} x {dims.get('magnet_pocket_depth_mm')} mm",
        f"- Snap-fit clearance: {dims.get('snap_fit_clearance_mm')} mm",
        "",
        "## Required Modules",
        "",
    ]
    lines.extend(f"- {name}" for name in modules)
    lines.extend(["", "## Errors", ""])
    lines.extend(f"- {item}" for item in errors) if errors else lines.append("- None")
    lines.extend(["", "## Warnings", ""])
    lines.extend(f"- {item}" for item in warnings) if warnings else lines.append("- None")
    lines.extend([
        "",
        "## Suggested Print Orientation",
        "",
        "- magnetic_base_core: flat on bottom face.",
        "- straight_cable_guide: flat on base contact face.",
        "- snap_cover: flat underside on bed.",
        "",
        "## Notes",
        "",
        "- Avoid unsupported overhangs greater than 45 degrees.",
        "- Exported STL files must be checked in the slicer at real scale before printing.",
    ])
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def main() -> None:
    root = Path.cwd()
    spec = load_spec(root)
    errors, warnings = validate(spec)
    report_path = write_report(root, spec, errors, warnings)
    print(f"report: {report_path}")
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
