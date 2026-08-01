from PIL import Image
import numpy as np

img = Image.open('muscle-body.png')
arr = np.array(img)
alpha = arr[:, :, 3]
H, W = arr.shape[:2]

# Binary mask: body pixels (alpha >= 128)
mask = alpha >= 128

# Flood-fill from borders to find external background
external = np.zeros((H, W), dtype=bool)
queue = []

# Add border background pixels to queue
for y in range(H):
    if not mask[y, 0]:
        queue.append((y, 0))
        external[y, 0] = True
    if not mask[y, W - 1]:
        queue.append((y, W - 1))
        external[y, W - 1] = True
for x in range(W):
    if not mask[0, x]:
        queue.append((0, x))
        external[0, x] = True
    if not mask[H - 1, x]:
        queue.append((H - 1, x))
        external[H - 1, x] = True

# BFS flood fill through background pixels
head = 0
while head < len(queue):
    y, x = queue[head]
    head += 1
    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and not mask[ny, nx] and not external[ny, nx]:
            external[ny, nx] = True
            queue.append((ny, nx))

# Fill holes: background pixels that are not external
filled = mask.copy()
filled[~mask & ~external] = True

# Extract segments from filled mask
segments = {}
for y in range(H):
    row = filled[y]
    if not row.any():
        continue
    segs = []
    in_seg = False
    start = 0
    for x in range(W):
        if row[x] and not in_seg:
            start = x
            in_seg = True
        elif not row[x] and in_seg:
            segs.append((start, x - 1))
            in_seg = False
    if in_seg:
        segs.append((start, W - 1))
    segments[y] = segs

# Build compact JS
parts = []
for y, segs in segments.items():
    flat = []
    for s in segs:
        flat.append(str(s[0]))
        flat.append(str(s[1]))
    inner = ",".join(flat)
    parts.append(str(y) + ":[" + inner + "]")

js = "var BODY_CONTOUR={" + ",".join(parts) + "};"
with open('body-contour.js', 'w', encoding='utf-8') as f:
    f.write(js)

# Stats
total_segs = sum(len(segs) for segs in segments.values())
holes_filled = int((~mask & ~external).sum())
print("Rows:", len(segments), "Total segments:", total_segs, "Holes filled:", holes_filled)
print("JS size:", len(js), "chars")
