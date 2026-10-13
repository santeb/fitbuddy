# -*- coding: utf-8 -*-
"""
小红书封面合成器 1080x1440
用法: python make_cover.py <底图路径> <输出路径> [方案号]
"""
import sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1080, 1440
OUT_DIR = os.path.dirname(os.path.abspath(__file__))
COVER_DIR = os.path.join(OUT_DIR, 'covers')
FONT_BOLD = r'C:\Windows\Fonts\msyhbd.ttc'
FONT_REG  = r'C:\Windows\Fonts\msyh.ttc'


def font(size, bold=True):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def prepare_bg(path):
    """等比放大铺满并裁掉底部水印区"""
    im = Image.open(path).convert('RGB')
    scale = max(W / im.width, (H + 200) / im.height)  # 多留 200px 备裁
    nw, nh = int(im.width * scale), int(im.height * scale)
    im = im.resize((nw, nh), Image.LANCZOS)
    left = (nw - W) // 2
    top = max(0, nh - H - 200) if nh > H + 200 else 0
    # 优先保留人物：从偏上位置裁
    top = int((nh - H) * 0.42)
    return im.crop((left, top, left + W, top + H))


def v_gradient(size, top_alpha, bottom_alpha):
    """竖向黑透明渐变遮罩"""
    w, h = size
    grad = Image.new('L', (1, h))
    for y in range(h):
        t = y / (h - 1)
        grad.putpixel((0, y), int(top_alpha + (bottom_alpha - top_alpha) * t))
    return grad.resize((w, h))


def rounded_rect_mask(size, radius):
    m = Image.new('L', size, 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return m


def pill(canvas, xy, text, fnt, pad_x=34, pad_y=16, bg=(255, 255, 255), fg=(20, 20, 20)):
    """画药丸标签，xy 为左上角，返回整体尺寸"""
    d = ImageDraw.Draw(canvas)
    bbox = d.textbbox((0, 0), text, font=fnt)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    w, h = tw + pad_x * 2, th + pad_y * 2
    layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.rounded_rectangle([0, 0, w - 1, h - 1], radius=h // 2, fill=bg + (255,))
    ld.text((pad_x - bbox[0], pad_y - bbox[1]), text, font=fnt, fill=fg)
    canvas.alpha_composite(layer, xy)
    return w, h


def shadow_text(canvas, xy, text, fnt, fill=(255, 255, 255), shadow=(0, 0, 0, 170), off=4):
    layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.text((xy[0] + off, xy[1] + off), text, font=fnt, fill=shadow)
    canvas.alpha_composite(layer)
    d = ImageDraw.Draw(canvas)
    d.text(xy, text, font=fnt, fill=fill)


def make(bg_path, out_path, lines=None, subline='髋胯宽腿粗',
         tag='梨形身材 · 14天计划', foot='收藏起来 明天开练',
         brand='FitBuddy', highlights=None, hero_idx=1):
    """方案A(大字堆叠): 多行主标题 + 痛点副字 + 顶部痛点标签 + 底部钩子条
    lines: 主标题分行, 例 ['梨形身材必练', '7动作', '14天对比图', '看最后1张']
    highlights: 与 lines 等长的列表, 标记哪些行用黄色高亮
    hero_idx: 哪一行用最大字号(数字行)
    """
    if lines is None:
        lines = ['梨形身材必练', '7 动作', '最后1张：完整周计划']
    if highlights is None:
        highlights = [False, True, True]

    canvas = prepare_bg(bg_path).convert('RGBA')
    # 1. 上下渐变压暗
    dark = Image.new('RGBA', (W, H), (0, 0, 0, 255))
    dark.putalpha(v_gradient((W, H), 110, 220))
    canvas.alpha_composite(dark)

    d = ImageDraw.Draw(canvas)
    YELLOW = (255, 214, 10)

    # 2. 顶部黄色标签(痛点入口)
    pill(canvas, (64, 86), tag, font(38, True), bg=YELLOW, fg=(24, 18, 0))

    # 3. 痛点副字(半透明黑底胶囊, 保证压亮背景也读得清)
    f_sub = font(56, True)
    sb = d.textbbox((0, 0), subline, font=f_sub)
    sw_, sh_ = sb[2] - sb[0], sb[3] - sb[1]
    d.rounded_rectangle([58, 168, 58 + sw_ + 52, 168 + sh_ + 34],
                        radius=(sh_ + 34) // 2, fill=(0, 0, 0, 165))
    d.text((84 - sb[0], 185 - sb[1]), subline, font=f_sub, fill=(235, 235, 235))

    # 4. 主标题: 固定 Y 坐标铺满中下部(留出底部钩子条)
    layouts = {
        3: ([460, 640, 1010], [130, 250, 110]),    # 三行版: hero 数字 + 钩子
        4: ([400, 570, 880, 1010], [132, 218, 98, 92]),
    }
    n = len(lines)
    ys, sizes = layouts.get(n, layouts[4])
    MAXW = W - 58 * 2 - 18   # 左右各留 58 边距 + 18 描边余量, 防出血
    for i, line in enumerate(lines):
        size = sizes[i] if i < len(sizes) else 90
        f = font(size, True)
        bbox = d.textbbox((0, 0), line, font=f)
        tw = bbox[2] - bbox[0]
        if tw > MAXW:                      # 超宽则等比缩字号, 保证不出画面
            f = font(max(int(size * MAXW / tw), 48), True)
        color = YELLOW if highlights[i] else (255, 255, 255)
        shadow_text(canvas, (58, ys[i] if i < len(ys) else 400 + i * 150),
                    line, f, fill=color, off=4)

    # 5. 底部钩子条(白底黑字)
    f_foot = font(44, True)
    pill(canvas, (64, H - 190), foot, f_foot, bg=(255, 255, 255), fg=(24, 18, 0))

    # 6. 右下品牌
    f_brand = font(54, True)
    bb = d.textbbox((0, 0), brand, font=f_brand)
    shadow_text(canvas, (W - (bb[2] - bb[0]) - 64, H - 124), brand, f_brand,
                fill=(255, 255, 255), off=3)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    canvas.convert('RGB').save(out_path, quality=95)
    return out_path


def make_b(bg_path, out_path, title='7个动作', sub='专治\n梨形身材',
           foot='14天对比图 · 看最后1张', brand='FitBuddy'):
    """变体B: 左侧黄色色块大字竖排, 右侧露人物"""
    canvas = prepare_bg(bg_path).convert('RGBA')

    # 左侧黄色块(占 58% 宽, 满高)
    band_w = int(W * 0.635)
    band = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(band)
    bd.rectangle([0, 0, band_w, H], fill=(255, 214, 10, 255))
    canvas.alpha_composite(band)

    # 黄色块右侧轻微投影, 制造层叠感
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    sd.rectangle([band_w, 0, band_w + 18, H], fill=(0, 0, 0, 90))
    sh = sh.filter(ImageFilter.GaussianBlur(12))
    canvas.alpha_composite(sh)

    # 顶部小字
    d = ImageDraw.Draw(canvas)
    d.text((64, 96), 'LIXING  SHAPE', font=font(36, True), fill=(60, 44, 0))

    # 主标题(黑字竖排两行)
    f_title = font(168, True)
    y = 300
    for ch in [title[i:i + 4] for i in range(0, len(title), 4)]:
        d.text((60, y), ch, font=f_title, fill=(24, 18, 0))
        y += 200

    # 副标题(黄块上用深色)
    f_sub = font(78, True)
    y += 30
    for line in sub.split('\n'):
        d.text((64, y), line, font=f_sub, fill=(24, 18, 0))
        y += 96

    # 底部提示条(深色底)
    f_foot = font(40, True)
    fb = d.textbbox((0, 0), foot, font=f_foot)
    fw, fh = fb[2] - fb[0], fb[3] - fb[1]
    d.rounded_rectangle([60, H - 200, 60 + fw + 60, H - 200 + fh + 44],
                        radius=34, fill=(24, 18, 0, 235))
    d.text((90, H - 200 + 22 - fb[1]), foot, font=f_foot, fill=(255, 214, 10))

    # 右下品牌
    f_brand = font(56, True)
    bb = d.textbbox((0, 0), brand, font=f_brand)
    d.text((W - (bb[2] - bb[0]) - 56, H - 120), brand, font=f_brand, fill=(255, 255, 255))

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    canvas.convert('RGB').save(out_path, quality=95)
    return out_path


def make_summary(out_path, brand='FitBuddy',
                  cta='主页回复 【梨形】  领完整周计划',
                  moves=None, week=None):
    """信息图: 7 动作清单 + 4 周训练安排 (兑现封面钩子: 最后1张)
    风格: 暖米白底 + 黄/黑 主色, 信息密度高, 用户能直接收藏
    """
    BG = (248, 244, 237)
    YELLOW = (255, 214, 10)
    BLACK = (24, 18, 0)
    GREY = (139, 126, 96)

    if moves is None:
        moves = [
            ('01', '宽距深蹲', '紧肤胯',     '4 × 15'),
            ('02', '侧弓步',   '内收大腿',   '4 × 12/腿'),
            ('03', '跪姿后踢', '激活臀瓣',   '4 × 15/腿'),
            ('04', '单腿臀桥', '练胯臀',     '4 × 12/腿'),
            ('05', '侧卧抬腿', '瘦大腿外侧', '4 × 20/腿'),
            ('06', '跨坐侧蹲', '胯+内侧',    '4 × 12/侧'),
            ('07', '青蛙趴',   '拉伸收工',   '2 分钟'),
        ]
    if week is None:
        week = [
            ('第 1 周', '基础入门', '1 + 2 + 3'),
            ('第 2 周', '逐步加量', '1 + 4 + 5'),
            ('第 3 周', '组合训练', '6 + 2 + 4'),
            ('第 4 周', '全部上场', '全选+青蛙趴'),
        ]

    canvas = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(canvas)

    # ===== 顶部黄条 =====
    d.rectangle([0, 0, W, 184], fill=YELLOW)
    title = '梨形身材 · 完整周计划'
    f_top = font(72, True)
    tb = d.textbbox((0, 0), title, font=f_top)
    tx = (W - (tb[2] - tb[0])) // 2
    d.text((tx - tb[0], 56 - tb[1]), title, font=f_top, fill=BLACK)
    f_brand_top = font(32, True)
    bb = d.textbbox((0, 0), brand, font=f_brand_top)
    d.text((W - (bb[2] - bb[0]) - 36, 22 - bb[1]),
           brand, font=f_brand_top, fill=(60, 50, 0))

    # ===== 章节 1: 7 动作 =====
    d.text((60, 216), '7 个动作 · 一次练全',
           font=font(58, True), fill=BLACK)
    d.line([(60, 288), (180, 288)], fill=YELLOW, width=10)
    d.line([(60, 288), (W - 60, 288)], fill=BLACK, width=2)

    f_num = font(46, True)
    f_name = font(50, True)
    f_part = font(34, False)
    f_sets = font(36, True)

    y0 = 324
    row_h = 72
    for i, (n, name, part, sets) in enumerate(moves):
        y = y0 + i * row_h
        d.rounded_rectangle([56, y, 56 + 96, y + 62],
                            radius=14, fill=YELLOW)
        nb = d.textbbox((0, 0), n, font=f_num)
        nx = 56 + 48 - (nb[2] - nb[0]) // 2 - nb[0]
        d.text((nx, y + 8 - nb[1]), n, font=f_num, fill=BLACK)
        d.text((176, y + 4), name, font=f_name, fill=BLACK)
        d.text((460, y + 16), part, font=f_part, fill=GREY)
        sb = d.textbbox((0, 0), sets, font=f_sets)
        sx = W - 60 - (sb[2] - sb[0])
        d.text((sx, y + 12), sets, font=f_sets, fill=BLACK)
        if i < len(moves) - 1:
            d.line([(150, y + row_h - 12), (W - 60, y + row_h - 12)],
                   fill=(228, 218, 198), width=2)

    # ===== 章节 2: 4 周安排 =====
    sec2_y = y0 + len(moves) * row_h + 30
    d.text((60, sec2_y), '四周安排 · 一周三练',
           font=font(58, True), fill=BLACK)
    # 右侧提示: 帮用户建立"数字=动作编号"的对应关系
    f_hint = font(28, False)
    hint = '数字 = 上面动作编号'
    hb = d.textbbox((0, 0), hint, font=f_hint)
    d.text((W - 60 - (hb[2] - hb[0]), sec2_y + 34), hint,
           font=f_hint, fill=GREY)
    d.line([(60, sec2_y + 72), (180, sec2_y + 72)],
           fill=YELLOW, width=10)
    d.line([(60, sec2_y + 72), (W - 60, sec2_y + 72)],
           fill=BLACK, width=2)

    f_wk = font(44, True)
    f_tag = font(30, False)
    f_combo = font(56, True)

    y0_w = sec2_y + 108
    row_h_w = 68
    for i, (wk, tag, combo) in enumerate(week):
        y = y0_w + i * row_h_w
        wb = d.textbbox((0, 0), wk, font=f_wk)
        ww = wb[2] - wb[0]
        d.rounded_rectangle([56, y, 56 + ww + 56, y + 60],
                            radius=30, fill=YELLOW)
        d.text((56 + 28 - wb[0], y + 8 - wb[1]),
               wk, font=f_wk, fill=BLACK)
        d.text((56 + ww + 82, y + 16), tag, font=f_tag, fill=GREY)
        cb = d.textbbox((0, 0), combo, font=f_combo)
        cx = W - 60 - (cb[2] - cb[0])
        d.text((cx, y - 2), combo, font=f_combo, fill=BLACK)

    # ===== 底部 CTA =====
    cta_y = H - 152
    d.rectangle([0, cta_y, W, H], fill=BLACK)
    f_cta = font(46, True)
    cb = d.textbbox((0, 0), cta, font=f_cta)
    if cb[2] - cb[0] > W - 120:  # 兜底缩字号
        f_cta = font(36, True)
        cb = d.textbbox((0, 0), cta, font=f_cta)
    cx = (W - (cb[2] - cb[0])) // 2
    d.text((cx - cb[0], cta_y + 56 - cb[1]),
           cta, font=f_cta, fill=YELLOW)

    os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
    canvas.save(out_path, quality=95)
    return out_path


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args or args[0] == 'cover':
        bg = sys.argv[1] if sys.argv[1:] else os.path.join(
            os.path.dirname(OUT_DIR), 'shots',
            'Modern_minimalist_fitness_phot_2026-10-13T02-58-12.png')
        out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(COVER_DIR, 'cover_lixing.png')
        layout = sys.argv[3] if len(sys.argv) > 3 else 'a'
        if layout.startswith('tag:'):
            print(make(bg, out, tag=layout[4:]))
        else:
            print(make(bg, out) if layout == 'a' else make_b(bg, out))
    elif args[0] == 's' or args[0] == 'summary':
        out = args[1] if len(args) > 1 else os.path.join(COVER_DIR, 'summary_lixing.png')
        print(make_summary(out))
    elif args[0] == 'b':
        bg = args[1]
        out = args[2] if len(args) > 2 else os.path.join(COVER_DIR, 'cover_b.png')
        print(make_b(bg, out))
    else:  # 旧用法兼容
        bg = args[0]
        out = args[1] if len(args) > 1 else os.path.join(COVER_DIR, 'cover_lixing.png')
        layout = args[2] if len(args) > 2 else 'a'
        if layout.startswith('tag:'):
            print(make(bg, out, tag=layout[4:]))
        else:
            print(make(bg, out) if layout == 'a' else make_b(bg, out))
