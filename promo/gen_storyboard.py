# -*- coding: utf-8 -*-
"""小红书图文不支持动图，把 GIF 方案转成静态配图：
1) squat-storyboard.png  6 格动作分镜（替代侧面示范 GIF）
2) squat-compare.png     正确 vs 膝盖内扣 大图对比（替代纠错 GIF）
复用 gen_squat_gif.py 的火柴人两点连杆 IK 绘制逻辑。
"""
import math
from PIL import Image, ImageDraw, ImageFont

OUT = r"F:\workbuddy\fitness-app\promo"


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
F_MIN = load_font(26)

BG = "#f8fafc"
BORDER = "#e2e8f0"


def ease(t):
    return t * t * (3 - 2 * t)


def rounded(d, box, r, **kw):
    try:
        d.rounded_rectangle(box, radius=r, **kw)
    except Exception:
        d.rectangle(box, **kw)


# ---------------------------------------------------------------- 侧面单帧
def render_side(t, knee_line=False, w=500, h=600):
    """t: 0 站直 -> 1 大腿平行；返回单帧侧面图"""
    GROUND = 500
    ankle = (218, GROUND - 12)
    L_shin = L_thigh = 125
    L_torso = 150

    def pose(tt):
        s = ease(tt)
        sh_x = 240.0
        sh_y = 102 + (224 - 102) * s
        lean = 0.10 + (0.58 - 0.10) * s
        hip = (sh_x - L_torso * math.sin(lean), sh_y + L_torso * math.cos(lean))
        dx, dy = hip[0] - ankle[0], hip[1] - ankle[1]
        dd = math.hypot(dx, dy)
        dd = max(abs(L_shin - L_thigh) + 1e-3, min(L_shin + L_thigh - 1e-3, dd))
        a = (L_shin ** 2 - L_thigh ** 2 + dd * dd) / (2 * dd)
        hh = math.sqrt(max(0, L_shin ** 2 - a * a))
        mx, my = ankle[0] + a * dx / dd, ankle[1] + a * dy / dd
        k1 = (mx + hh * (-dy) / dd, my + hh * dx / dd)
        k2 = (mx - hh * (-dy) / dd, my - hh * dx / dd)
        return sh_x, sh_y, lean, hip, (k1 if k1[0] > k2[0] else k2)

    img = Image.new("RGB", (w, h), "#ffffff")
    d = ImageDraw.Draw(img)
    d.rectangle([0, GROUND, w, h], fill="#eef2f7")
    d.line([20, GROUND, w - 20, GROUND], fill="#94a3b8", width=3)
    d.line([ankle[0], ankle[1], ankle[0] + 52, ankle[1]], fill="#334155", width=7)

    # 杠铃垂直参考线
    sx = int(pose(0)[0])
    d.line([sx, 80, sx, GROUND], fill="#cbd5e1", width=2)
    for yy in range(90, GROUND, 22):
        d.ellipse([sx - 2, yy, sx + 2, yy + 4], fill="#cbd5e1")

    # 完整轨迹(淡) + 当前位置(亮)
    ts = [ease(i / 18) for i in range(19)]
    pts = [pose(x)[:2] for x in ts]
    for p in pts:
        d.ellipse([p[0] - 3, p[1] - 3, p[0] + 3, p[1] + 3], fill="#fde68a")

    sh_x, sh_y, lean, hip, knee = pose(t)
    hx, hy = sh_x + 34, sh_y - 40
    d.line([hip, knee], fill="#1e293b", width=11)
    d.line([knee, ankle], fill="#1e293b", width=11)
    d.line([hip, (sh_x, sh_y)], fill="#1e293b", width=12)
    d.line([(sh_x, sh_y), (hx - 3, hy + 16)], fill="#1e293b", width=10)
    # 杠铃(侧视): 杆 + 两端窄边片
    d.line([sh_x - 58, sh_y, sh_x + 58, sh_y], fill="#475569", width=6)
    for px in (-58, 58):
        rounded(d, [sh_x + px - 10, sh_y - 40, sh_x + px + 10, sh_y + 40], 5,
                fill="#94a3b8", outline="#475569", width=4)
    d.ellipse([sh_x - 8, sh_y - 8, sh_x + 8, sh_y + 8], fill="#fbbf24")
    # 头(空心圆, 最后画)
    d.ellipse([hx - 21, hy - 21, hx + 21, hy + 21], fill="#ffffff",
              outline="#1e293b", width=9)

    if knee_line:
        ky = knee[1]
        x0, x1 = int(knee[0] - 90), int(knee[0] + 90)
        for xx in range(x0, x1, 14):
            d.line([xx, ky, min(xx + 8, x1), ky], fill="#ef4444", width=4)
    return img


# ---------------------------------------------------------------- 正面单人
def render_front(t, correct, w=400, h=600):
    GROUND = 500
    cx = w // 2

    img = Image.new("RGB", (w, h), "#ffffff")
    d = ImageDraw.Draw(img)
    d.rectangle([0, GROUND, w, h], fill="#eef2f7")
    d.line([20, GROUND, w - 20, GROUND], fill="#94a3b8", width=3)

    s = ease(t)
    head_y = 132 + (250 - 132) * s
    hip_y = 246 + (378 - 246) * s
    d.ellipse([cx - 24, head_y - 24, cx + 24, head_y + 24], outline="#1e293b", width=8)
    d.line([cx, head_y + 24, cx, hip_y], fill="#1e293b", width=10)
    # 杠铃压在斜方肌上沿(肩位)
    sh_y = head_y + 52
    d.line([cx - 86, sh_y, cx + 86, sh_y], fill="#475569", width=6)
    for px in (-86, 86):
        d.ellipse([cx + px - 18, sh_y - 18, cx + px + 18, sh_y + 18],
                  fill="#94a3b8", outline="#475569", width=4)

    foot_dx = 72
    for side in (-1, 1):
        fx = cx + side * foot_dx
        d.line([fx - 16, GROUND - 8, fx + 16, GROUND - 8], fill="#334155", width=7)
        hx = cx + side * 16
        mid_x = (hx + fx) / 2
        if correct:
            kx, col = mid_x + side * 26 * s, "#059669"
        else:
            kx, col = mid_x - side * 16 * s, "#dc2626"
        ky = (hip_y + GROUND) / 2 + 6
        d.line([(hx, hip_y), (kx, ky)], fill="#1e293b", width=9)
        d.line([(kx, ky), (fx, GROUND - 8)], fill="#1e293b", width=9)
        d.ellipse([kx - 8, ky - 8, kx + 8, ky + 8], fill=col)
        if not correct and t > 0.6 and side == 1:
            d.line([(kx + 42, ky - 26), (kx + 10, ky - 6)], fill="#dc2626", width=4)
            d.polygon([(kx + 10, ky - 6), (kx + 26, ky - 8), (kx + 18, ky + 6)],
                      fill="#dc2626")
    return img


def paste_scaled(canvas, src, crop, box_w, box_h, px, py):
    """把 src 按 crop 裁切后等比缩放塞进 (box_w, box_h)，左上角放在 (px, py)（居中）"""
    c = src.crop(crop)
    k = min(box_w / c.width, box_h / c.height)
    nw, nh = int(c.width * k), int(c.height * k)
    c = c.resize((nw, nh), Image.LANCZOS)
    ox, oy = px + (box_w - nw) // 2, py + (box_h - nh) // 2
    canvas.paste(c, (ox, oy))
    return ox, oy, k


# ---------------------------------------------------------------- 分镜长图
def make_storyboard(path):
    W, H = 1500, 2000
    M = 60
    PW, PH, GAP = 441, 796, 28
    TOP = 280
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    d.text((M, 74), "杠铃深蹲 · 动作分镜", font=F_H1, fill="#0f172a")
    d.text((M, 168), "六格看懂「下蹲 → 底部 → 起身」，虚线是杠铃的垂直轨迹",
           font=F_H2, fill="#475569")
    d.line([M, 236, W - M, 236], fill="#e2e8f0", width=3)

    steps = [
        (0.00, "① 起始 · 站直", "#475569", "杠铃压在斜方肌上沿"),
        (0.33, "② 下蹲 1/3", "#2563eb", "髋膝同时启动"),
        (0.67, "③ 下蹲 2/3", "#2563eb", "膝盖全程对准脚尖"),
        (1.00, "④ 底部 · 平行", "#dc2626", "大腿与地面平行"),
        (0.60, "⑤ 起身 · 蹬地", "#059669", "胸口与髋一起上升"),
        (0.00, "⑥ 站直 · 换气", "#475569", "站直之后再换气"),
    ]
    crop = (78, 42, 402, 525)  # 324 x 483

    for i, (t, chip, col, note) in enumerate(steps):
        r, c = divmod(i, 3)
        x = M + c * (PW + GAP)
        y = TOP + r * (PH + GAP)
        rounded(d, [x, y, x + PW, y + PH], 18, fill="#ffffff", outline=BORDER, width=3)
        # 编号芯片
        bb = d.textbbox((0, 0), chip, font=F_CHIP)
        cw, ch = bb[2] - bb[0], bb[3] - bb[1]
        rounded(d, [x + 20, y + 18, x + 40 + cw, y + 30 + ch], 10, fill=col)
        d.text((x + 30 - bb[0], y + 24 - bb[1]), chip, font=F_CHIP, fill="#ffffff")
        # 图
        src = render_side(t, knee_line=(i == 3))
        paste_scaled(img, src, crop, PW, PH - 140, x, y + 68)
        # 说明
        bb2 = d.textbbox((0, 0), note, font=F_NOTE)
        d.text((x + (PW - (bb2[2] - bb2[0])) // 2, y + PH - 52), note,
               font=F_NOTE, fill="#475569")

    d.text((M, H - 74), "杠铃轨迹全程压在脚掌正中上方 · 膝盖始终对准脚尖方向",
           font=F_MIN, fill="#94a3b8")
    img.save(path)
    print("saved:", path)


# ---------------------------------------------------------------- 正面对比图
def make_compare(path):
    W, H = 1500, 2000
    M = 60
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    d.text((M, 74), "膝盖内扣 · 正面纠错", font=F_H1, fill="#0f172a")
    d.text((M, 168), "起身时膝盖往外顶，别往里夹", font=F_H2, fill="#475569")
    d.line([M, 236, W - M, 236], fill="#e2e8f0", width=3)

    PW, GAP = 670, 40
    TOP, PH = 280, 1500
    crop = (72, 100, 328, 522)  # 256 x 422（单人正面）

    for idx, (correct, chip, col, note) in enumerate([
            (True, "正确 · 膝盖对准脚尖", "#059669", "力线顺，膝盖压力分散"),
            (False, "错误 · 膝盖内扣", "#dc2626", "膝盖内侧压力骤增，最容易伤")]):
        x = M + idx * (PW + GAP)
        rounded(d, [x, TOP, x + PW, TOP + PH], 18, fill="#ffffff",
                outline=BORDER, width=3)
        bb = d.textbbox((0, 0), chip, font=F_CHIP)
        cw, ch = bb[2] - bb[0], bb[3] - bb[1]
        rounded(d, [x + (PW - cw) // 2 - 20, TOP + 26,
                    x + (PW + cw) // 2 + 20, TOP + 38 + ch], 10, fill=col)
        d.text((x + (PW - cw) // 2 - bb[0], TOP + 32 - bb[1]), chip,
               font=F_CHIP, fill="#ffffff")
        src = render_front(1.0, correct)
        paste_scaled(img, src, crop, PW - 60, PH - 320, x + 30, TOP + 120)
        bb2 = d.textbbox((0, 0), note, font=F_NOTE)
        d.text((x + (PW - (bb2[2] - bb2[0])) // 2, TOP + PH - 130), note,
               font=F_NOTE, fill=col)

    d.text((M, H - 74), "两个自查点：膝盖方向对准脚尖 · 脚掌三点均匀受力",
           font=F_MIN, fill="#94a3b8")
    img.save(path)
    print("saved:", path)


if __name__ == "__main__":
    make_storyboard(OUT + r"\squat-storyboard.png")
    make_compare(OUT + r"\squat-compare.png")
