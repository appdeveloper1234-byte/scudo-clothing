"""Create production-ready WebP catalogue images from the imported Drive files."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = PROJECT_ROOT / "public" / "products"
OUTPUT_ROOT = PROJECT_ROOT / "public" / "catalog"
RESPONSIVE_WIDTHS = (480, 960)

PRODUCT_FILES = {
    "argentina-champions-home": (
        "Argentina Home Jersey 2022_23 Champions Edition",
        [
            "Copy of 03_F_studio_white.png",
            "quality_restoration_20260730153339102.jpg",
            "quality_restoration_20260730153357732.jpg",
            "Copy of 03_D_side_profile (1).png",
            "Copy of 03_H_crest_macro.png",
            "rn-image_picker_lib_temp_9df97e78-f684-4469-b0cc-4e215d00423a.jpeg",
        ],
    ),
    "brazil-home": (
        "Brazil 2024_25 Home Jersey",
        [
            "Copy of 06_F_studio_white.png",
            "Copy of 06_D_side_profile.png",
            "Copy of 06_C_back_view.png",
            "Copy of IMG-20260727-WA0019.jpg",
            "Copy of 06_H_crest_macro.png",
            "Copy of rn-image_picker_lib_temp_e1916ffa-647d-41a1-8a72-e9f14c1394c5.png",
            "Copy of rn-image_picker_lib_temp_f76d800c-e2d4-447d-bba6-6f498e1f1a2d.png",
        ],
    ),
    "brazil-blue-away": (
        "Brazil Blue Away Football Kit",
        [
            "Copy of 8b14d5ef.jpeg",
            "Copy of FullSizeRender_ee9fd5fb-c951-48c3-8321-01805c530bfa.jpeg",
            "Copy of rn-image_picker_lib_temp_2a3398f6-82db-44ca-941b-abfaacd017ac.png",
            "Copy of rn-image_picker_lib_temp_2ce96ba1-298c-46d7-afa0-f5d9da7b106a_1024x1024.png",
            "Copy of rn-image_picker_lib_temp_69837d42-ae89-41bf-9dbc-b57dcdc31795_1024x1024.png",
            "Copy of rn-image_picker_lib_temp_c090c75a-0f7b-4349-af98-8e7ca6ed7273.png",
            "Copy of rn-image_picker_lib_temp_e790f749-1457-48f0-b11c-fff626111340.png",
        ],
    ),
    "barcelona-player-home": (
        "FC Barcelona Home Jersey 2024_25 Player Version",
        [
            "Copy of FZ1307-432_1.jpg",
            "Copy of FZ1307-432_2.jpg",
            "quality_restoration_20260730154243944.jpg",
            "quality_restoration_20260730154305220.jpg",
            "quality_restoration_20260730154820904.jpg",
            "Copy of IMG-20260727-WA0020.jpg",
        ],
    ),
    "france-away": (
        "France 2024 Away Jersey",
        [
            "Copy of 04_G_dramatic_lowangle.png",
            "quality_restoration_20260730155439188.jpg",
            "quality_restoration_20260730155523300.jpg",
            "Copy of rn-image_picker_lib_temp_22c33de4-aff1-4e01-a300-02fdc96e1e1b.jpg",
            "Copy of rn-image_picker_lib_temp_2cd534e3-c30f-4164-82b8-16a3a050306e.jpg",
        ],
    ),
    "france-home": (
        "France Home Jersey 2024_25",
        [
            "02_F_studio_white (1).png",
            "01_table_front (1).jpeg",
            "quality_restoration_20260730163335612.jpg",
            "quality_restoration_20260730163448172.jpg",
            "quality_restoration_20260730163617570.jpg",
            "quality_restoration_20260730163758889.jpg",
            "quality_restoration_20260730163846542.jpg",
        ],
    ),
    "portugal-away": (
        "Portugal Away Jersey 2026",
        [
            "quality_restoration_20260730151859724.jpg",
            "Portugal-2026-Men's-Authentic-Away-Jersey (2) (1).jpeg",
            "quality_restoration_20260730152002008.jpg",
            "quality_restoration_20260730155841699.jpg",
            "quality_restoration_20260730160014698.png",
        ],
    ),
    "portugal-black-special": (
        "Portugal Black Special Edition Jersey 2024_25",
        [
            "fc0e9891dd01a2514d8b6f6304658a19.jpg",
            "quality_restoration_20260727143736606.jpg",
            "quality_restoration_20260727143856234.jpg",
            "Shop_Portugal_60_Years_Anniversary_Special_Jersey_Player_Version_in_India.png",
            "Shop_Portugal_60_Years_Anniversary_Special_Jersey_Player_Version_India.png",
            "Buy_Portugal_60_Years_Anniversary_Special_Jersey_Player_Version_in_India_Now.png",
        ],
    ),
    "portugal-home-kit": (
        "Portugal Home Jersey Kit",
        [
            "quality_restoration_20260730160341967.png",
            "quality_restoration_20260730160458284.png",
            "quality_restoration_20260730160805510.png",
            "quality_restoration_20260730160859485.jpg",
            "quality_restoration_20260730161020137.jpg",
            "rn-image_picker_lib_temp_aeeadc34-d19d-4112-9190-18ab89a412ea.png",
        ],
    ),
    "real-madrid-home": (
        "Real Madrid 2024_25 Home Jersey",
        [
            "1054071_list.jpg",
            "Real_Madrid_26-27_Home_Authentic_Jersey_White_JZ7218_HM8.jpg",
            "01_G_dramatic_lowangle.png",
            "01_D_side_profile.png",
            "86821add.jpg",
        ],
    ),
    "spain-home": (
        "Spain Home Jersey 2024_25",
        [
            "spain_jersey_plain_minimal (1).png",
            "spain_jersey_colorful_backdrop (1).png",
            "spain_jersey_side_profile (1).png",
            "spain_jersey_back_white (1).png",
            "spain_jersey_crest_macro (1).png",
        ],
    ),
}


def prepare_image(source: Path, target: Path) -> None:
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        if image.mode in ("RGBA", "LA"):
            background = Image.new("RGB", image.size, "#f4f2ee")
            background.paste(image, mask=image.getchannel("A"))
            image = background
        else:
            image = image.convert("RGB")
        target.parent.mkdir(parents=True, exist_ok=True)
        image.save(target, "WEBP", quality=84, method=6)
        for width in RESPONSIVE_WIDTHS:
            variant = image.copy()
            variant.thumbnail((width, width * 2), Image.Resampling.LANCZOS)
            variant_target = target.with_name(f"{target.stem}-{width}{target.suffix}")
            variant.save(variant_target, "WEBP", quality=80, method=6)


def main() -> None:
    total = 0
    for slug, (folder, filenames) in PRODUCT_FILES.items():
        for index, filename in enumerate(filenames, start=1):
            source = SOURCE_ROOT / folder / filename
            if not source.exists():
                raise FileNotFoundError(source)
            prepare_image(source, OUTPUT_ROOT / slug / f"{index:02}.webp")
            total += 1
    print(f"Prepared {total} catalogue images in {OUTPUT_ROOT}")


if __name__ == "__main__":
    main()
