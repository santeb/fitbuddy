# -*- coding: utf-8 -*-
"""生成杠铃深蹲教学 GIF：
1) squat-demo.gif  侧面示范（含杠铃垂直轨迹 + 平行线标注）
2) squat-error.gif 正面对比（正确 vs 膝盖内扣）
"""
import math
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = r"F:\workbuddy\fitness-app\promo"

def load_font(size, bold=False):
    paths = [
        r"C:\Windows\Fonts\msyhbd.ttc" if bold else r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
    ]
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()

F_TITLE = load_font(26, True)
F_SUB   = load_font(20)
F_SMALL = load_font(16)

def lerp(a, b, t):
    return a + (b - a) * t

def ease(t):  # smoothstep
    return t * t * (3 - 2 * t)

# ---------------------------------------------------------------- GIF 1: 侧面示范
def make_demo_gif(path):
    W, H = 500, 600
    GROUND = 500
    ankle = (160, GROUND - 12)
    L_shin, L_thigh, L_torso = 125, 125, 150

    def pose(t):
        """t: 0 站直 -> 1 大腿平行"""
        s = ease(t)
        # 肩(杠)位置: x 固定在脚掌中点上方, y 下降 —— 保证杠铃垂直轨迹
        sh_x = 182.0
        sh_y = lerp(102, 224, s)
        lean = lerp(0.10, 0.58, s)  # 躯干前倾角
        hip = (sh_x - L_torso * math.sin(lean),
               sh_y + L_torso * math.cos(lean))
        # 两连杆 IK 求膝(取 x 较大的解, 膝盖朝前)
        dx, dy = hip[0] - ankle[0], hip[1] - ankle[1]
        d = math.hypot(dx, dy)
        d = max(abs(L_shin - L_thigh) + 1e-3, min(L_shin + L_thigh - 1e-3, d))
        a = (L_shin**2 - L_thigh**2 + d*d) / (2*d)
        h = math.sqrt(max(0, L_shin**2 - a*a))
        mx, my = ankle[0] + a*dx/d, ankle[1] + a*dy/d
        k1 = (mx + h*(-dy)/d, my + h*dx/d)
        k2 = (mx - h*(-dy)/d, my - h*dx/d)
        knee = k1 if k1[0] > k2[0] else k2
        return sh_x, sh_y, lean, hip, knee

    # 帧序列: 下蹲18帧 + 底部停6帧 + 起身18帧 + 顶部停6帧
    ts = [ease(i/18) for i in range(19)] + [1.0]*6 + [ease(1 - i/18) for i in range(1, 19)] + [0.0]*6

    # 预计算杠铃轨迹点
    trail = []
    for i, t in enumerate(ts):
        sh_x, sh_y, _, _, _ = pose(t)
        trail.append((sh_x, sh_y))

    frames = []
    for i, t in enumerate(ts):
        img = Image.new("RGB", (W, H), "#ffffff")
        d = ImageDraw.Draw(img)
        # 地面
        d.rectangle([0, GROUND, W, H], fill="#eef2f7")
        d.line([20, GROUND, W-20, GROUND], fill="#94a3b8", width=3)
        # 脚
        d.line([ankle[0], ankle[1], ankle[0]+52, ankle[1]], fill="#334155", width=7)
        # 杠铃垂直参考线(脚掌中点上方)
        d.line([182, 80, 182, GROUND], fill="#cbd5e1", width=2)
        for yy in range(90, GROUND, 22):
            d.ellipse([180, yy, 184, yy+4], fill="#cbd5e1")
        # 杠铃轨迹残留
        for p in trail[:i+1]:
            d.ellipse([p[0]-3, p[1]-3, p[0]+3, p[1]+3], fill="#fbbf24")

        sh_x, sh_y, lean, hip, knee = pose(t)
        # 头: 位于杠前上方(正视前方), 不压住杠铃片
        hx = sh_x + 46; hy = sh_y - 18
        # 躯干/腿
        d.line([hip, knee], fill="#1e293b", width=11)      # 大腿
        d.line([knee, ankle], fill="#1e293b", width=11)    # 小腿
        d.line([hip, (sh_x, sh_y)], fill="#1e293b", width=12)  # 躯干
        # 颈部连接(到头的圆)
        d.line([(sh_x, sh_y), (hx - 2, hy + 12)], fill="#1e293b", width=10)
        d.ellipse([hx-19, hy-19, hx+19, hy+19], outline="#1e293b", width=9)
        # 手臂到杠(侧视一条)
        d.line([(sh_x, sh_y), (sh_x+12, sh_y+24)], fill="#1e293b", width=8)
        # 杠铃杆 + 片
        d.line([sh_x-72, sh_y, sh_x+72, sh_y], fill="#475569", width=6)
        d.ellipse([sh_x-22, sh_y-22, sh_x+22, sh_y+22], fill="#94a3b8", outline="#475569", width=4)
        # 平行标注(接近底部时)
        if t > 0.85:
            ky = knee[1]
            d.line([knee[0]-78, ky, knee[0]+96, ky], fill="#ef4444", width=3)
            d.text((knee[0]+102, ky-10), "大腿平行", font=F_SMALL, fill="#ef4444")
        # 阶段标签
        if i < 19:   label, col = "① 下蹲", "#2563eb"
        elif i < 25: label, col = "② 底部停顿", "#dc2626"
        elif i < 43: label, col = "③ 起身", "#059669"
        else:        label, col = "④ 站直 · 换气", "#475569"
        d.text((24, 548), label, font=F_SUB, fill=col)
        # 标题(用 bbox 居中)
        t1 = "杠铃深蹲 · 动作示范"
        bb1 = d.textbbox((0, 0), t1, font=F_TITLE)
        d.text((W//2 - (bb1[2]-bb1[0])//2, 24), t1, font=F_TITLE, fill="#0f172a")
        t2 = "杠铃轨迹 ≈ 垂直线"
        bb2 = d.textbbox((0, 0), t2, font=F_SMALL)
        d.text((W//2 - (bb2[2]-bb2[0])//2, 64), t2, font=F_SMALL, fill="#b45309")
        frames.append(img)

    frames[0].save(path, save_all=True, append_images=frames[1:], duration=90, loop=0)
    print("saved:", path, len(frames), "frames")

# ---------------------------------------------------------------- GIF 2: 膝盖内扣对比(正面)
def make_error_gif(path):
    W, H = 960, 600
    GROUND = 500
    CX = (240, 720)  # 两个人物中心

    def draw_figure(d, cx, t, correct):
        s = ease(t)
        head_y = lerp(140, 240, s)
        hip_y  = lerp(250, 355, s)
        foot_dx = 72
        # 头 + 躯干
        d.ellipse([cx-24, head_y-24, cx+24, head_y+24], outline="#1e293b", width=8)
        d.line([cx, head_y+24, cx, hip_y], fill="#1e293b", width=10)
        # 肩上杠铃
        sh_y = head_y + 62
        d.line([cx-92, sh_y, cx+92, sh_y], fill="#475569", width=6)
        for px in (-92, 92):
            d.ellipse([cx+px-20, sh_y-20, cx+px+20, sh_y+20], fill="#94a3b8", outline="#475569", width=4)
        # 双腿
        for side in (-1, 1):
            fx = cx + side*foot_dx
            d.line([fx-16, GROUND-8, fx+16, GROUND-8], fill="#334155", width=7)  # 脚
            hx = cx + side*16
            mid_x = (hx + fx) / 2
            if correct:
                kx = mid_x + side*26*s   # 膝盖对准脚尖方向
                col = "#059669"
            else:
                kx = mid_x - side*16*s   # 膝内扣
                col = "#dc2626"
            ky = (hip_y + GROUND) / 2 + 6
            d.line([(hx, hip_y), (kx, ky)], fill="#1e293b", width=9)
            d.line([(kx, ky), (fx, GROUND-8)], fill="#1e293b", width=9)
            d.ellipse([kx-8, ky-8, kx+8, ky+8], fill=col)
            # 内扣箭头提示(错误侧, 底部)
            if not correct and t > 0.6 and side == 1:
                d.line([(kx+42, ky-26), (kx+10, ky-6)], fill="#dc2626", width=4)
                d.polygon([(kx+10, ky-6), (kx+26, ky-8), (kx+18, ky+6)], fill="#dc2626")
        return ky

    ts = [ease(i/16) for i in range(17)] + [1.0]*5 + [ease(1 - i/16) for i in range(1, 17)] + [0.0]*5

    frames = []
    for i, t in enumerate(ts):
        img = Image.new("RGB", (W, H), "#ffffff")
        d = ImageDraw.Draw(img)
        d.rectangle([0, GROUND, W, H], fill="#eef2f7")
        d.line([20, GROUND, W-20, GROUND], fill="#94a3b8", width=3)
        # 分隔线
        d.line([W//2, 30, W//2, H-20], fill="#e2e8f0", width=3)
        draw_figure(d, CX[0], t, True)
        draw_figure(d, CX[1], t, False)
        for cx, txt, col in [(CX[0], "正确 · 膝盖对准脚尖", "#059669"),
                             (CX[1], "错误 · 膝盖内扣", "#dc2626")]:
            bb = d.textbbox((0, 0), txt, font=F_SUB)
            d.text((cx - (bb[2]-bb[0])//2, 52), txt, font=F_SUB, fill=col)
        if t > 0.6:
            d.ellipse([CX[1]+6, 352, CX[1]+150, 468], outline="#dc2626", width=4)
        t3 = "起身时膝盖往外顶 别往里夹"
        bb3 = d.textbbox((0, 0), t3, font=F_TITLE)
        d.text((W//2 - (bb3[2]-bb3[0])//2, 548), t3, font=F_TITLE, fill="#0f172a")
        frames.append(img)

    frames[0].save(path, save_all=True, append_images=frames[1:], duration=100, loop=0)
    print("saved:", path, len(frames), "frames")

if __name__ == "__main__":
    make_demo_gif(OUT_DIR + r"\squat-demo.gif")
    make_error_gif(OUT_DIR + r"\squat-error.gif")
