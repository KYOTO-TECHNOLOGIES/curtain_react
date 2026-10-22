#!/usr/bin/env python3
"""
Simple Vespa-style scooter keychain STL for Bambu Lab A1 Mini.
Width ~100 mm. Customize MESSAGE and PLATE below, then re-run.
"""

import cadquery as cq
from cadquery import exporters
import math

# ========== CUSTOMIZE THESE ==========
MESSAGE = "Your message here*"   # short text on the body (keep under ~18 chars)
PLATE   = "RJ 09 XX 0001"       # vehicle number
THICKNESS = 2.5                 # mm
SCALE   = 1.0                   # 1.0 ≈ 100 mm wide
# =====================================

# Simplified outline – rear left, front right
pts = [
    (0, 20),
    (8, 5),
    (22, 3),
    (30, 15),
    (35, 35),
    (40, 48),
    (50, 55),
    (58, 50),
    (65, 40),
    (80, 35),
    (92, 42),
    (100, 50),
    (108, 42),
    (110, 28),
    (105, 15),
    (95, 10),
    (85, 14),
    (70, 20),
    (50, 18),
    (30, 12),
    (12, 15),
    (0, 20),
]

pts = [(x * SCALE, y * SCALE) for x, y in pts]

body = (
    cq.Workplane("XY")
    .polyline(pts)
    .close()
    .extrude(THICKNESS)
)

# Rear wheel
rx, ry, rr = 16 * SCALE, 18 * SCALE, 12 * SCALE
body = body.cut(cq.Workplane("XY").center(rx, ry).circle(rr).extrude(THICKNESS + 0.5))

# Front wheel
fx, fy, fr = 96 * SCALE, 25 * SCALE, 10 * SCALE
body = body.cut(cq.Workplane("XY").center(fx, fy).circle(fr).extrude(THICKNESS + 0.5))

# Headlight
body = body.cut(cq.Workplane("XY").center(90 * SCALE, 40 * SCALE).circle(3.5 * SCALE).extrude(THICKNESS + 0.5))

# Keyring hole
body = body.cut(cq.Workplane("XY").center(48 * SCALE, 52 * SCALE).circle(2.2 * SCALE).extrude(THICKNESS + 0.5))

# Decorative spoke holes – rear
for a in range(0, 360, 60):
    rad = math.radians(a)
    hx = rx + (rr * 0.6) * math.cos(rad)
    hy = ry + (rr * 0.6) * math.sin(rad)
    body = body.cut(cq.Workplane("XY").center(hx, hy).circle(1.5 * SCALE).extrude(THICKNESS + 0.5))

# Decorative spoke holes – front
for a in range(0, 360, 60):
    rad = math.radians(a)
    hx = fx + (fr * 0.55) * math.cos(rad)
    hy = fy + (fr * 0.55) * math.sin(rad)
    body = body.cut(cq.Workplane("XY").center(hx, hy).circle(1.2 * SCALE).extrude(THICKNESS + 0.5))

# Text – MESSAGE (cut through)
msg = (
    cq.Workplane("XY")
    .center(58 * SCALE, 45 * SCALE)
    .text(MESSAGE, fontsize=5.0 * SCALE, distance=THICKNESS + 0.5,
          font="DejaVu Sans", halign="center", valign="center")
)
body = body.cut(msg)

# Vespa logo
logo = (
    cq.Workplane("XY")
    .center(75 * SCALE, 38 * SCALE)
    .text("vespa", fontsize=6.0 * SCALE, distance=THICKNESS + 0.5,
          font="DejaVu Sans", halign="center", valign="center")
)
body = body.cut(logo)

# Plate number (below rear wheel area)
plate = (
    cq.Workplane("XY")
    .center(16 * SCALE, 5 * SCALE)
    .text(PLATE, fontsize=3.8 * SCALE, distance=THICKNESS + 0.5,
          font="DejaVu Sans", halign="center", valign="center")
)
body = body.cut(plate)

exporters.export(body, "/home/workdir/artifacts/vespa_keychain.stl")
print("OK: vespa_keychain.stl")
print(f"Message: {MESSAGE}")
print(f"Plate:   {PLATE}")
print(f"Width ≈ {110 * SCALE:.0f} mm, thickness {THICKNESS} mm")