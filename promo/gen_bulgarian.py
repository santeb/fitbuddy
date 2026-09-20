# -*- coding: utf-8 -*-
"""保加利亚分腿蹲静态配图（小红书图文不支持动图）：
1) bulgarian-storyboard.png  6 格动作分镜（起始 → 下沉 → 底部 → 起身）
2) bulgarian-compare.png     凳高正确 vs 后脚搭太高 纠错对比
沿用 gen_storyboard.py 的两点连杆 IK 火柴人画法，新增：后腿踩凳、哑铃、脚踝参考线。
"""
import math
from PIL import Image, ImageDraw, ImageFont

OUT = r"F:\workbuddy\fitness-app\promo"
GROUND = 500
L = 125.0          # 大腿 = 小腿 = 125px (≈42.5cm，全腿 85cm)
L_TORSO = 150.0    # 躯干
BENCH_X0, BENCH_X1 = -30, 168
FRONT_ANKLE = (250.0, 488.0)   # 前脚踝（三点踩地）

# 姿势参数：t=0 站直 → t=1 底部。数值由真实比例反推（凳 30cm、髋 87cm→52cm）
# rear_ankle = 后脚踝；bench_top = 凳面高度
STORY = dict(front_ankle=(258.0, 488.0), rear_ankle=(66.0, 404.0), bench_top=422,
             shin_lo=8.0, shin_max=17.0, thigh_lo=6.0, thigh_max=36.0,
             lean_lo=5.0, lean_max=28.0, arm=130.0, ref="#cbd5e1")
BAD = dict(front_ankle=(258.0, 488.0), rear_ankle=(66.0, 318.0), bench_top=336,
           shin_lo=8.0, shin_max=17.0, thigh_lo=6.0, thigh_max=34.0,
           lean_lo=5.0, lean_max=44.0, arm=118.0, ref=None)


def load_font(size, bold=False):
    paths = ([r"C:\Windows\Fonts\msyhbd.ttc"] if bold else [r"C:\Windows\Fonts\msyh.ttc"]) + \
            [r"C:\Windows\Fonts\simhei.ttf"]
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()


F_H1 = load_font(74, True)
F_H2 = load_font(38)
F_CHIP = load_font(36, True)
F_NOTE = load_font(30)
F_MID = load_font(34, True)
F_BODY = load_font(30)
F_MIN = load_font(26)

BG = "#f8fafc"
BORDER = "#e2e8f0"
BONE = "#1e293b"
BONE_L = "#334155"


def ease(t):
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


def rounded(d, box, r, **kw):
    try:
        d.rounded_rectangle(box, radius=r, **kw)
    except Exception:
        d.rectangle(box, **kw)


def ik2(a, b, l1, l2):
    """两点连杆求中间关节，取 y 较大的解（人形关节朝下）"""
    dx, dy = b[0] - a[0], b[1] - a[1]
    dd = math.hypot(dx, dy)
    dd = max(abs(l1 - l2) + 1e-3, min(l1 + l2 - 1e-3, dd))
    g = (l1 ** 2 - l2 ** 2 + dd * dd) / (2 * dd)
    hh = math.sqrt(max(0.0, l1 ** 2 - g * g))
    mx, my = a[0] + g * dx / dd, a[1] + g * dy / dd
    p1 = (mx + hh * (-dy) / dd, my + hh * dx / dd)
    p2 = (mx - hh * (-dy) / dd, my - hh * dx / dd)
    return p1 if p1[1] > p2[1] else p2


def dashed_line(d, x, y0, y1, col, wd, dash=16, gap=13):
    y = y0
    while y < y1:
        d.line([x, y, x, min(y + dash, y1)], fill=col, width=wd)
        y += dash + gap


def split_pose(t, p):
    """返回 前膝 / 髋 / 肩 / 后膝。

    髋沿「前脚踝 → 假想髋点」的近直线往后下方平移，让前腿保持近乎垂直的支撑；
    后膝由「髋—后踝」两点用真腿长解出，天然落在髋后下方。
    """
    s = ease(t)
    fa, ra = p["front_ankle"], p["rear_ankle"]
    # 前腿：髋落在脚踝斜前上方，下沉时髋往后下走
    shn = math.radians(lerp(p["shin_lo"], p["shin_max"], s))
    thr = math.radians(lerp(p["thigh_lo"], p["thigh_max"], s))
    knee_f = (fa[0] + L * math.sin(shn), fa[1] - L * math.cos(shn))
    hip = (knee_f[0] - L * math.sin(thr), knee_f[1] - L * math.cos(thr))
    # 后腿：膝由髋、后踝两点解出（后脚只搭在凳上、不发力）
    knee_r = ik2(hip, ra, L, L)
    lean = math.radians(lerp(p["lean_lo"], p["lean_max"], s))
    sh = (hip[0] + L_TORSO * math.sin(lean), hip[1] - L_TORSO * math.cos(lean))
    return knee_f, hip, sh, knee_r


# ---------------------------------------------------------------- 侧面单帧
def render_side(t, p=STORY, w=500, h=600, knee_mark=False):
    fa, ra, btop = p["front_ankle"], p["rear_ankle"], p["bench_top"]
    knee_f, hip, sh, knee_r = split_pose(t, p)
    heel_up = p.get("heel_up", False)

    img = Image.new("RGB", (w, h), "#ffffff")
    d = ImageDraw.Draw(img)
    d.rectangle([0, GROUND, w, h], fill="#eef2f7")
    d.line([-10, GROUND, w + 10, GROUND], fill="#94a3b8", width=3)

    # ---- 凳子（限制在画布内，避免裁切时带进黑边）
    bx0 = max(BENCH_X0, 0)
    for sx in (bx0 + 46, BENCH_X1 - 32):
        if bx0 <= sx <= w:
            d.rectangle([sx, btop + 4, sx + 14, GROUND], fill="#cbd5e1")
    d.rectangle([bx0, btop, min(BENCH_X1, w), btop + 14], fill="#94a3b8")
    d.line([bx0, btop + 2, min(BENCH_X1, w), btop + 2], fill="#64748b", width=3)

    # ---- 前脚踝垂线（看膝盖相对脚踝的位置）
    if p.get("ref"):
        dashed_line(d, int(fa[0]), 66, GROUND - 6, p["ref"], 3)

    # ---- 后腿（脚背搭凳：脚尖朝下压在凳面上）
    d.line([hip, knee_r], fill=BONE, width=11)
    d.line([knee_r, ra], fill=BONE, width=11)
    d.line([ra, (ra[0] + 26, btop + 2)], fill=BONE_L, width=9)
    d.line([ra, (ra[0] + 6, btop + 2)], fill=BONE_L, width=9)
    # ---- 前腿
    d.line([hip, knee_f], fill=BONE, width=12)
    d.line([knee_f, fa], fill=BONE, width=12)
    if heel_up:
        d.line([(fa[0] - 2, fa[1] + 10), (fa[0] + 34, GROUND - 8)], fill=BONE_L, width=8)
    else:
        d.line([(fa[0] - 18, GROUND - 10), (fa[0] + 30, GROUND - 10)], fill=BONE_L, width=8)
    # ---- 躯干 + 颈
    d.line([hip, sh], fill=BONE, width=13)
    hx, hy = sh[0] + 12, sh[1] - 44
    d.line([sh, (hx - 2, hy + 15)], fill=BONE, width=10)
    # ---- 手臂 + 哑铃（自然垂在身体两侧，侧视只见一片；先垫白描边）
    hd = (sh[0] + 14, sh[1] + p["arm"])
    d.line([sh, hd], fill=BONE, width=9)
    rounded(d, [hd[0] - 22, hd[1] - 46, hd[0] + 22, hd[1] + 46], 12, fill="#ffffff")
    rounded(d, [hd[0] - 22, hd[1] - 46, hd[0] + 22, hd[1] + 46], 12,
            fill="#94a3b8", outline="#475569", width=4)
    d.line([hd[0] - 22, hd[1], hd[0] + 22, hd[1]], fill="#475569", width=4)
    # ---- 头
    d.ellipse([hx - 22, hy - 22, hx + 22, hy + 22], fill="#ffffff",
              outline=BONE, width=9)

    if knee_mark:   # 底部：标出「后膝不许再往下」
        ky = int(knee_r[1])
        for xx in range(-60, 46, 24):
            d.line([knee_r[0] + xx, ky, knee_r[0] + xx + 15, ky],
                   fill="#dc2626", width=4)
    return img


def paste_scaled(canvas, src, crop, box_w, box_h, px, py):
    c = src.crop(crop)
    k = min(box_w / c.width, box_h / c.height)
    nw, nh = int(c.width * k), int(c.height * k)
    c = c.resize((nw, nh), Image.LANCZOS)
    ox, oy = px + (box_w - nw) // 2, py + (box_h - nh) // 2
    canvas.paste(c, (ox, oy))
    return ox, oy, k


CROP = (0, 14, 340, 520)   # 340 x 506


# ---------------------------------------------------------------- 分镜长图
def make_storyboard(path):
    W, H = 1500, 2000
    M = 60
    PW, PH, GAP = 441, 796, 28
    TOP = 280
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    d.text((M, 74), "保加利亚分腿蹲 · 动作分镜", font=F_H1, fill="#0f172a")
    d.text((M, 168), "后脚搭凳、前脚踩地，六格看懂「髋向后下 → 底部 → 起身」",
           font=F_H2, fill="#475569")
    d.line([M, 236, W - M, 236], fill="#e2e8f0", width=3)

    steps = [
        (0.00, "① 起始 · 站直", "#475569", "后脚脚背搭凳，前脚踩实", False),
        (0.33, "② 下沉 1/3", "#2563eb", "髋向后下方沉", False),
        (0.67, "③ 下沉 2/3", "#2563eb", "前膝落在脚尖以内", False),
        (1.00, "④ 底部", "#dc2626", "后膝降到最低，别顶地", True),
        (0.45, "⑤ 起身 · 蹬地", "#059669", "前脚掌三点蹬地", False),
        (0.00, "⑥ 回顶 · 换气", "#475569", "起身膝盖不锁死", False),
    ]

    for i, (t, chip, col, note, mark) in enumerate(steps):
        r, c = divmod(i, 3)
        x = M + c * (PW + GAP)
        y = TOP + r * (PH + GAP)
        rounded(d, [x, y, x + PW, y + PH], 18, fill="#ffffff", outline=BORDER, width=3)
        bb = d.textbbox((0, 0), chip, font=F_CHIP)
        cw, ch = bb[2] - bb[0], bb[3] - bb[1]
        rounded(d, [x + 20, y + 18, x + 40 + cw, y + 30 + ch], 10, fill=col)
        d.text((x + 30 - bb[0], y + 24 - bb[1]), chip, font=F_CHIP, fill="#ffffff")
        src = render_side(t, STORY, knee_mark=mark)
        paste_scaled(img, src, CROP, PW, PH - 140, x, y + 68)
        bb2 = d.textbbox((0, 0), note, font=F_NOTE)
        d.text((x + (PW - (bb2[2] - bb2[0])) // 2, y + PH - 52), note,
               font=F_NOTE, fill="#475569")

    d.text((M, H - 74), "灰虚线 = 前脚踝垂线 · 前膝落在脚尖以内 · 后腿只负责平衡，不发力",
           font=F_MIN, fill="#94a3b8")
    img.save(path)
    print("saved:", path)


# ---------------------------------------------------------------- 纠错对比图
def make_compare(path):
    W, M = 1500, 60
    img = Image.new("RGB", (W, 1460), BG)
    H = img.height
    d = ImageDraw.Draw(img)

    d.text((M, 74), "后脚搭多高 · 纠错对比", font=F_H1, fill="#0f172a")
    d.text((M, 168), "凳面高度决定这是练腿，还是「跪着抬臀」", font=F_H2, fill="#475569")
    d.line([M, 236, W - M, 236], fill="#e2e8f0", width=3)

    PW, GAP = 670, 40
    TOP, PH = 260, 860
    CROP2 = (10, 8, 352, 508)     # 342 x 500

    panels = [
        (STORY, 1.0, "正确 · 凳高 ≤ 膝", "#059669", "上身能挺住，前腿蹲得到底"),
        (BAD, 1.0, "错误 · 凳高过膝", "#dc2626", "上半身被迫前趴，前腿几乎没受力"),
    ]
    for idx, (p, t, chip, col, note) in enumerate(panels):
        x = M + idx * (PW + GAP)
        rounded(d, [x, TOP, x + PW, TOP + PH], 18, fill="#ffffff",
                outline=BORDER, width=3)
        bb = d.textbbox((0, 0), chip, font=F_CHIP)
        cw, ch = bb[2] - bb[0], bb[3] - bb[1]
        rounded(d, [x + (PW - cw) // 2 - 22, TOP + 26,
                    x + (PW + cw) // 2 + 22, TOP + 38 + ch], 10, fill=col)
        d.text((x + (PW - cw) // 2 - bb[0], TOP + 32 - bb[1]), chip,
               font=F_CHIP, fill="#ffffff")
        src = render_side(t, p)
        paste_scaled(img, src, CROP2, PW - 70, PH - 240, x + 35, TOP + 96)
        bb2 = d.textbbox((0, 0), note, font=F_NOTE)
        d.text((x + (PW - (bb2[2] - bb2[0])) // 2, TOP + PH - 120), note,
               font=F_NOTE, fill=col)

    # ---- 底部自查条
    BY = TOP + PH + 34
    rounded(d, [M, BY, W - M, BY + 260], 18, fill="#ffffff", outline=BORDER, width=3)
    d.text((M + 40, BY + 30), "两个自查点", font=F_MID, fill="#0f172a")
    tips = [
        "① 凳面 30-40cm，别超过膝盖高度；凳子越矮，反而越能蹲到底",
        "② 起身时上身被迫往前趴、前腿没感觉 → 换矮凳，前脚再往外挪半个脚掌",
    ]
    for i, t in enumerate(tips):
        d.text((M + 40, BY + 92 + i * 50), t, font=F_BODY, fill="#475569")
    img.save(path)
    print("saved:", path)


if __name__ == "__main__":
    make_storyboard(OUT + r"\bulgarian-storyboard.png")
    make_compare(OUT + r"\bulgarian-compare.png")
