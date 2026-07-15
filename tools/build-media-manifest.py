from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEDIA_ROOT = ROOT / "assets" / "images" / "projects"
OUTPUT = ROOT / "assets" / "js" / "media-manifest.js"
ALLOWED = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"}


def natural_key(path: Path) -> list[object]:
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", path.name)]


def humanize(filename: str) -> str:
    stem = Path(filename).stem
    stem = re.sub(r"^\d+[\s._-]*", "", stem)
    stem = re.sub(r"[_-]+", " ", stem).strip()
    return stem[:1].upper() + stem[1:] if stem else ""


def main() -> None:
    manifest: dict[str, list[dict[str, str]]] = {}

    if MEDIA_ROOT.exists():
        for project_dir in sorted(path for path in MEDIA_ROOT.iterdir() if path.is_dir()):
            files = sorted(
                (path for path in project_dir.iterdir() if path.is_file() and path.suffix.lower() in ALLOWED),
                key=natural_key,
            )
            if not files:
                continue

            items: list[dict[str, str]] = []
            for index, file in enumerate(files, start=1):
                relative = file.relative_to(ROOT).as_posix()
                caption = humanize(file.name)
                items.append({
                    "src": relative,
                    "alt": f"{project_dir.name} — изображение {index}",
                    "caption": caption,
                })
            manifest[project_dir.name] = items

    content = "/* Файл создан автоматически. Не редактируйте вручную. */\n"
    content += "window.PROJECT_MEDIA = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n"
    OUTPUT.write_text(content, encoding="utf-8")
    print(f"Галерея обновлена: {sum(len(items) for items in manifest.values())} изображений.")


if __name__ == "__main__":
    main()
