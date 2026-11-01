#!/usr/bin/env python3
"""Regenerate committed WebP assets with Pillow/libwebp. PNG sources stay intact."""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "public/assets/landing"
# Preserve the source dimensions. UI text gets a higher RGB quality than photos;
# alpha is always lossless, independently of RGB compression.
QUALITIES = {"phone": 90, "screen": 95, "cockpit-desktop": 90, "cockpit-mobile": 90}


def main():
    results = []
    for name, quality in QUALITIES.items():
        source = ASSETS / f"{name}.png"
        target = ASSETS / f"{name}.webp"
        with Image.open(source) as image:
            rgba = image.convert("RGBA")
            rgba.save(
                target,
                format="WEBP",
                quality=quality,
                alpha_quality=100,
                method=6,
                exact=True,
                icc_profile=image.info.get("icc_profile", b""),
            )
        with Image.open(target) as image:
            decoded = image.convert("RGBA")
            if decoded.size != rgba.size or decoded.getchannel("A").tobytes() != rgba.getchannel("A").tobytes():
                raise ValueError(f"Dimensions or transparency changed: {target.name}")
        if target.stat().st_size >= source.stat().st_size:
            raise ValueError(f"WebP is not smaller: {target.name}")
        results.append({"file": target.name, "dimensions": rgba.size, "pngBytes": source.stat().st_size,
                        "webpBytes": target.stat().st_size, "quality": quality, "alphaExact": True})
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
