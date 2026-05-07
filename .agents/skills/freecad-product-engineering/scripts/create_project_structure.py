#!/usr/bin/env python3
from pathlib import Path


PROJECT_DIRS = [
    ".agents/skills/freecad-product-engineering/assets",
    ".agents/skills/freecad-product-engineering/scripts",
    ".codex",
    "input/sketches",
    "input/references",
    "specs",
    "output/cad",
    "output/print",
    "output/reports",
]


def main() -> None:
    root = Path.cwd()
    for directory in PROJECT_DIRS:
        path = root / directory
        path.mkdir(parents=True, exist_ok=True)
        print(f"ok: {path}")


if __name__ == "__main__":
    main()
