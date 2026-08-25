from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
LOGOS = ROOT / "logos"


def build_icon(size: int, output: Path) -> None:
    scale = 16
    canvas_size = size * scale
    image = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    def p(value: float) -> int:
        return round(value / 64 * canvas_size)

    draw.rounded_rectangle(
        (p(1), p(1), p(63), p(63)),
        radius=p(15),
        fill="#0b0d0c",
        outline="#343934",
        width=max(1, p(1.5)),
    )
    draw.polygon(
        [(p(x), p(y)) for x, y in [
            (12.5, 17.5), (22.7, 17.5), (31.1, 41), (40.6, 17.5),
            (50.8, 17.5), (36.2, 48), (26.7, 48),
        ]],
        fill="#f2efe7",
    )
    draw.ellipse((p(46), p(10), p(53), p(17)), fill="#dceb79")

    image = image.resize((size, size), Image.Resampling.LANCZOS)
    image.save(output, optimize=True)


build_icon(64, LOGOS / "favicon_logo.png")
build_icon(32, LOGOS / "favicon-32.png")
build_icon(180, LOGOS / "apple-touch-icon.png")
