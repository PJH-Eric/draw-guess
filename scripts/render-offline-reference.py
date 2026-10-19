"""Turn a Wikimedia Commons reference thumbnail into three offline sketch stages."""

import argparse
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


def render(source, destination):
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
    image.thumbnail((480, 480), Image.Resampling.LANCZOS)
    gray = ImageOps.grayscale(image).filter(ImageFilter.MedianFilter(size=5))
    softened = gray.filter(ImageFilter.GaussianBlur(radius=2.2))
    edges = ImageOps.autocontrast(softened.filter(ImageFilter.FIND_EDGES), cutoff=2)
    edges = ImageEnhance.Contrast(edges).enhance(1.8)

    destination.mkdir(parents=True, exist_ok=True)
    for stage, threshold in enumerate((90, 70, 52), start=1):
        sketch = edges.point(lambda value: 25 if value > threshold else 255, mode="L")
        canvas = Image.new("L", (640, 640), 255)
        sketch.thumbnail((600, 560), Image.Resampling.LANCZOS)
        canvas.paste(sketch, ((640 - sketch.width) // 2, (600 - sketch.height) // 2))
        canvas.save(destination / f"{stage}.png", optimize=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    render(args.source, args.destination)


if __name__ == "__main__":
    main()
