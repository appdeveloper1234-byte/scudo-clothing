"""Import the Scudo product image library from its shared Google Drive folder."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlsplit


SHOP_ALL_FOLDER = "https://drive.google.com/drive/folders/1n8q8Dkxn-2EVe2DwwMWZM5xI_xqYZYj8"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = PROJECT_ROOT / "public" / "products"


def list_files() -> list[dict[str, str]]:
    result = subprocess.run(
        [sys.executable, "-m", "gdown", "--folder", "--json", SHOP_ALL_FOLDER],
        check=True,
        capture_output=True,
        text=True,
    )
    start = result.stdout.find("[")
    if start < 0:
        raise RuntimeError("Google Drive did not return a file listing.")
    return json.loads(result.stdout[start:])


def download_file(url: str, target: Path) -> bool:
    if target.exists() and target.stat().st_size > 0:
        return True

    target.parent.mkdir(parents=True, exist_ok=True)
    file_id = parse_qs(urlsplit(url).query).get("id", [None])[0]
    if not file_id:
        return False

    thumbnail_url = f"https://drive.google.com/thumbnail?id={file_id}&sz=w1600"
    try:
        result = subprocess.run(
            [
                "curl.exe",
                "-sS",
                "-L",
                "--fail",
                "--retry",
                "2",
                thumbnail_url,
                "-o",
                str(target),
            ],
            check=False,
            timeout=90,
        )
        return result.returncode == 0 and target.exists() and target.stat().st_size > 0
    except (OSError, subprocess.TimeoutExpired):
        if target.exists():
            target.unlink()
        return False


def main() -> int:
    files = list_files()
    downloaded = 0
    skipped: list[str] = []

    for item in files:
        relative_path = Path(item["path"])
        target = OUTPUT_ROOT / relative_path
        if download_file(item["url"], target):
            downloaded += 1
        else:
            skipped.append(item["path"])

    print(f"Available files: {downloaded}/{len(files)}")
    if skipped:
        print("Skipped inaccessible files:")
        for path in skipped:
            print(f"  - {path}")
    return 0 if downloaded else 1


if __name__ == "__main__":
    raise SystemExit(main())
