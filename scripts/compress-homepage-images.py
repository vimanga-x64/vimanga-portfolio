"""Compress above-the-fold and homepage images to WebP for GitHub Pages."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]

JOBS = [
    ("images/hero-sky-collage-v2.png", "images/hero-sky-collage-v2.webp", 1920, 80),
    ("images/hero-night-collage-v3.png", "images/hero-night-collage-v3.webp", 1920, 80),
    ("images/Hail_Mary.jpg", "images/Hail_Mary.webp", 1400, 78),
    ("images/Profile_Pic.jpg", "images/Profile_Pic.webp", 900, 78),
    ("images/Matcha.JPG", "images/Matcha.webp", 900, 78),
    ("images/portal-arch-generated-v2.png", "images/portal-arch-generated-v2.webp", 1000, 78),
    ("images/etutor-hand-phone-v1.png", "images/etutor-hand-phone-v1.webp", 900, 78),
    ("images/experience-cloud-card-v1.png", "images/experience-cloud-card-v1.webp", 1200, 78),
    ("images/Space_Apps_Screenshot.png", "images/Space_Apps_Screenshot.webp", 1400, 76),
    ("images/movie-app.png", "images/movie-app.webp", 1400, 76),
    ("images/LandingPage-winhacks.jpg", "images/LandingPage-winhacks.webp", 1400, 78),
    ("images/free-games.png", "images/free-games.webp", 1400, 76),
    ("images/paper_texture.png", "images/paper_texture.webp", 640, 72),
    ("images/paper_texture_dark.png", "images/paper_texture_dark.webp", 640, 72),
]


def convert(src_rel: str, dest_rel: str, max_w: int, quality: int) -> None:
    src = ROOT / src_rel
    dest = ROOT / dest_rel
    image = Image.open(src)
    image = ImageOps.exif_transpose(image) or image
    has_alpha = image.mode in {"RGBA", "LA"} or (image.mode == "P" and "transparency" in image.info)
    image = image.convert("RGBA" if has_alpha else "RGB")
    width, height = image.size
    if width > max_w:
        image = image.resize((max_w, max(1, round(height * max_w / width))), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, "WEBP", quality=quality, method=6)
    before = src.stat().st_size
    after = dest.stat().st_size
    print(f"{src_rel:48} {before/1e6:5.2f}MB -> {after/1e6:5.2f}MB  {image.size[0]}x{image.size[1]}")


if __name__ == "__main__":
    for job in JOBS:
        convert(*job)
