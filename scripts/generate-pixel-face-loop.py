"""Render the CRT pixel-face loop that plays on the hero television.

The face lives on a 32x24 logical pixel grid, is upscaled with nearest-neighbour
sampling so the blocks stay crisp, and then gets a light CRT treatment
(scanlines, vignette, a rolling brightness band, mains flicker). Every motion
cycle divides the clip length so the encoded WebM loops seamlessly.

Usage: python scripts/generate-pixel-face-loop.py
"""

from __future__ import annotations

import math
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

GRID_W, GRID_H = 32, 24
SCALE = 16
FPS = 24
DURATION = 12.0
FRAMES = int(FPS * DURATION)
OUT_W, OUT_H = GRID_W * SCALE, GRID_H * SCALE

SCREEN_RGB = np.array([228, 226, 212], dtype=np.float32)
INK_RGB = np.array([8, 10, 14], dtype=np.float32)

OUTPUT = Path(__file__).resolve().parent.parent / 'videos' / 'pixel-face-tv-loop.webm'

EYE_SPRITE = (
    '.###.',
    '#####',
    '#####',
    '#####',
    '#####',
    '.###.',
)
EYE_W = len(EYE_SPRITE[0])
EYE_TOP = 5
LEFT_EYE_X = 5
RIGHT_EYE_X = GRID_W - LEFT_EYE_X - EYE_W

NOSE_TOP = 12
MOUTH_CX = (GRID_W - 1) / 2
MOUTH_X0, MOUTH_X1 = 6, 25
MOUTH_BASE = 19
MOUTH_CURVE = 4 / ((MOUTH_X1 - MOUTH_CX) ** 2)

# Saccades: the frame the face starts looking somewhere, and where it looks.
LOOK_KEYS = [(0.0, 0, 0), (2.1, -1, 0), (3.4, 1, 0), (4.4, 1, -1), (5.3, 0, 0),
             (6.6, 0, -1), (7.6, -1, 1), (8.4, 0, 0), (9.2, 1, 0), (9.9, -1, 0),
             (10.6, 0, 0)]
BLINK_TIMES = [1.25, 3.35, 6.45, 7.55, 8.0, 11.4]
WINK_WINDOW = (4.45, 5.05)
# Mouth shape per stretch of the loop; 'talk' alternates open and closed.
MOUTH_KEYS = [(0.0, 'smile'), (4.45, 'smirk'), (5.15, 'talk'), (6.55, 'o'),
              (7.5, 'smile'), (9.1, 'talk'), (10.5, 'smile')]


def keyed(keys, t):
    """Value of a step-keyframed track at time t."""
    current = keys[0][1:]
    for key in keys:
        if t + 1e-6 < key[0]:
            break
        current = key[1:]
    return current


def blink_phase(t):
    """0 = open, 1 = half closed, 2 = shut."""
    for start in BLINK_TIMES:
        offset = t - start
        if 0 <= offset < 5 / FPS:
            return (1, 2, 2, 2, 1)[int(offset * FPS)]
    return 0


def draw_eye(grid, x, y, phase):
    if phase == 2:
        grid[y + 3:y + 5, x - 1:x + EYE_W + 1] = True
        return
    rows = EYE_SPRITE if phase == 0 else ('#####', '#####', '#####')
    top = y if phase == 0 else y + 2
    for row, pattern in enumerate(rows):
        for col, cell in enumerate(pattern):
            if cell == '#':
                grid[top + row, x + col] = True


def smile_row(x):
    return MOUTH_BASE - round(MOUTH_CURVE * (x - MOUTH_CX) ** 2)


def draw_mouth(grid, shape, dx, dy, t):
    if shape == 'talk':
        shape = 'grin' if int(t * FPS) % 6 < 3 else 'smile'

    if shape in ('smile', 'grin'):
        for x in range(MOUTH_X0, MOUTH_X1 + 1):
            bottom = smile_row(x) + dy
            top = (MOUTH_BASE - 4 + dy) if shape == 'grin' else bottom - 2
            grid[min(top, bottom - 2):bottom + 1, x + dx] = True
    elif shape == 'o':
        grid[MOUTH_BASE - 3 + dy:MOUTH_BASE + 1 + dy, 12 + dx:20 + dx] = True
        grid[MOUTH_BASE - 4 + dy, 13 + dx:19 + dx] = True
        grid[MOUTH_BASE + 1 + dy, 13 + dx:19 + dx] = True
    elif shape == 'smirk':
        start, end = MOUTH_X0 + 2, MOUTH_X1 - 1
        for x in range(start, end + 1):
            lift = min(2, int((x - start) * 3 / (end - start + 1)))
            grid[MOUTH_BASE - lift + dy:MOUTH_BASE + 2 - lift + dy, x + dx] = True


def face_grid(t):
    grid = np.zeros((GRID_H, GRID_W), dtype=bool)

    # The whole face sways so the portrait never sits perfectly still.
    dx = round(1.4 * math.sin(2 * math.pi * t / DURATION))
    dy = round(0.9 * math.sin(4 * math.pi * t / DURATION))
    look_x, look_y = keyed(LOOK_KEYS, t)

    phase = blink_phase(t)
    winking = WINK_WINDOW[0] <= t < WINK_WINDOW[1]
    eye_y = EYE_TOP + dy + look_y
    draw_eye(grid, LEFT_EYE_X + dx + look_x, eye_y, 2 if winking else phase)
    draw_eye(grid, RIGHT_EYE_X + dx + look_x, eye_y, phase)

    # Nose.
    grid[NOSE_TOP + dy:NOSE_TOP + 2 + dy, 15 + dx:17 + dx] = True

    draw_mouth(grid, keyed(MOUTH_KEYS, t)[0], dx, dy, t)
    return grid


def crt_frame(grid, t, scanlines, vignette):
    pixels = np.repeat(np.repeat(grid, SCALE, axis=0), SCALE, axis=1)
    frame = np.where(pixels[..., None], INK_RGB, SCREEN_RGB)

    band = np.exp(-(((np.arange(OUT_H) - (t / 4 % 1) * OUT_H) / 46) ** 2))
    flicker = 1 + 0.015 * math.sin(2 * math.pi * t / 1.5)
    frame *= (scanlines * (1 + 0.05 * band))[:, None, None] * vignette[..., None] * flicker

    image = Image.fromarray(np.clip(frame, 0, 255).astype(np.uint8))
    return image.filter(ImageFilter.GaussianBlur(0.7))


def main():
    scanlines = np.where(np.arange(OUT_H) % 3 == 0, 0.9, 1.0).astype(np.float32)
    yy, xx = np.mgrid[0:OUT_H, 0:OUT_W].astype(np.float32)
    radius = np.hypot((xx / (OUT_W - 1) - 0.5) * 1.05, yy / (OUT_H - 1) - 0.5)
    vignette = np.clip(1 - 0.9 * np.maximum(radius - 0.28, 0) ** 1.6, 0.72, 1)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    encoder = subprocess.Popen([
        'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
        '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OUT_W}x{OUT_H}',
        '-r', str(FPS), '-i', '-',
        '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-b:v', '0', '-crf', '30',
        '-g', str(FPS * 2), '-row-mt', '1', '-an', str(OUTPUT),
    ], stdin=subprocess.PIPE)

    for index in range(FRAMES):
        t = index / FPS
        frame = crt_frame(face_grid(t), t, scanlines, vignette)
        encoder.stdin.write(frame.tobytes())

    encoder.stdin.close()
    code = encoder.wait()
    if code:
        sys.exit(code)
    print(f'{OUTPUT.name}: {FRAMES} frames, {OUTPUT.stat().st_size / 1024:.0f} KB')


if __name__ == '__main__':
    main()
