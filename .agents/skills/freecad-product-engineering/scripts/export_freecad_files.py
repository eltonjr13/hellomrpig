#!/usr/bin/env python3
from pathlib import Path


def require_freecad():
    try:
        import FreeCAD as App  # type: ignore
        import Mesh  # type: ignore
        try:
            import Import as StepExport  # type: ignore
        except Exception:
            import ImportGui as StepExport  # type: ignore
    except Exception as exc:
        raise RuntimeError(
            "This script must run inside FreeCADCmd/freecadcmd or a Python environment with FreeCAD modules."
        ) from exc
    return App, StepExport, Mesh


def printable_objects(doc):
    return [
        obj for obj in doc.Objects
        if hasattr(obj, "Shape") and not obj.Shape.isNull() and obj.Name.startswith(("magnetic_", "straight_", "snap_", "angled_", "multi_"))
    ]


def export_document(doc_path: str | None = None) -> None:
    App, StepExport, Mesh = require_freecad()
    root = Path.cwd()
    cad_dir = root / "output" / "cad"
    print_dir = root / "output" / "print"
    cad_dir.mkdir(parents=True, exist_ok=True)
    print_dir.mkdir(parents=True, exist_ok=True)

    if doc_path:
        doc = App.openDocument(str(Path(doc_path).resolve()))
    else:
        doc = App.ActiveDocument
    if doc is None:
        raise RuntimeError("No active FreeCAD document and no document path provided.")

    doc.recompute()
    product_slug = doc.Name.lower().replace(" ", "_")
    native_path = cad_dir / f"{product_slug}.FCStd"
    step_path = cad_dir / f"{product_slug}.step"
    doc.saveAs(str(native_path))

    parts = printable_objects(doc)
    if not parts:
        raise RuntimeError("No printable objects found for export.")

    StepExport.export(parts, str(step_path))
    for obj in parts:
        safe_name = obj.Name.lower()
        StepExport.export([obj], str(cad_dir / f"{safe_name}.step"))
        Mesh.export([obj], str(print_dir / f"{safe_name}.stl"))

    print(f"native: {native_path}")
    print(f"step: {step_path}")
    print(f"stl_parts: {len(parts)}")


if __name__ == "__main__":
    import sys

    export_document(sys.argv[1] if len(sys.argv) > 1 else None)
