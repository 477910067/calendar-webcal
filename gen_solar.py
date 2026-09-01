#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成中国二十四节气纯净版 .ics（覆盖 2024-2050），含 🍃 树叶图标与绿色主题色。
节气时刻按天文算法计算太阳视黄经达到目标角度的时刻（UTC），
再换算为北京时间（UTC+8）取"交节日期"，符合中国日历习惯。
算法已用 KaitoHH 已验证数据对照（2026 年全部吻合）。
"""
import math, datetime

ICON = "🍃"  # 24节气图标：树叶

TERMS = [
    ("小寒", 285), ("大寒", 300),
    ("立春", 315), ("雨水", 330),
    ("惊蛰", 345), ("春分", 0),
    ("清明", 15),  ("谷雨", 30),
    ("立夏", 45),  ("小满", 60),
    ("芒种", 75),  ("夏至", 90),
    ("小暑", 105), ("大暑", 120),
    ("立秋", 135), ("处暑", 150),
    ("白露", 165), ("秋分", 180),
    ("寒露", 195), ("霜降", 210),
    ("立冬", 225), ("小雪", 240),
    ("大雪", 255), ("冬至", 270),
]
APPROX = {
    "小寒": (1,6), "大寒": (1,20), "立春": (2,4), "雨水": (2,19),
    "惊蛰": (3,6), "春分": (3,21), "清明": (4,5), "谷雨": (4,20),
    "立夏": (5,6), "小满": (5,21), "芒种": (6,6), "夏至": (6,21),
    "小暑": (7,7), "大暑": (7,23), "立秋": (8,8), "处暑": (8,23),
    "白露": (9,8), "秋分": (9,23), "寒露": (10,8), "霜降": (10,23),
    "立冬": (11,7), "小雪": (11,22), "大雪": (12,7), "冬至": (12,22),
}

def gregorian_to_jd(y, m, d, h=12):
    if m <= 2:
        y -= 1; m += 12
    a = y // 100
    b = 2 - a + a // 4
    jd = int(365.25 * (y + 4716)) + int(30.6001 * (m + 1)) + d + b - 1524.5
    return jd + (h - 12) / 24.0

def jd_to_utc_datetime(jd):
    return datetime.datetime(1970,1,1, tzinfo=datetime.timezone.utc) + datetime.timedelta(days=jd - 2440587.5)

def apparent_solar_longitude(jd):
    T = (jd - 2451545.0) / 36525.0
    L0 = 280.4664567 + 36000.76983*T + 0.00030374*T*T
    M = 357.52911 + 35999.05029*T - 0.0001537*T*T
    Mr = math.radians(M)
    C = (1.914602 - 0.004817*T - 0.000014*T*T)*math.sin(Mr) \
        + (0.019993 - 0.000101*T)*math.sin(2*Mr) \
        + 0.000289*math.sin(3*Mr)
    true_geom = L0 + C
    Omega = 125.04 - 1934.136*T
    app = true_geom - 0.00569 - 0.00478*math.sin(math.radians(Omega))
    return app % 360.0

def find_term_jd(target, y, m, d):
    jd = gregorian_to_jd(y, m, d)
    for _ in range(30):
        L = apparent_solar_longitude(jd)
        diff = (target - L) % 360.0
        if diff > 180: diff -= 360.0
        delta = diff / 0.985647
        jd += delta
        if abs(delta) < 1e-9:
            break
    return jd

def term_date(y, name, target):
    m, d = APPROX[name]
    jd = find_term_jd(target, y, m, d)
    utc = jd_to_utc_datetime(jd)
    bj = utc.astimezone(datetime.timezone(datetime.timedelta(hours=8)))
    return bj.date()

lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ShanXin//24 Solar Terms CN//ZH",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:中国二十四节气（纯净版）",
    "X-WR-CALDESC:仅含二十四节气，无节假日/农历/黄历。图标🍃。2024-2050。",
    "X-WR-TIMEZONE:Asia/Shanghai",
    "COLOR:#3CB371",  # 树叶主题色：绿
]
for y in range(2024, 2051):
    for name, target in TERMS:
        d = term_date(y, name, target)
        ds = d.strftime("%Y%m%d")
        de = (d + datetime.timedelta(days=1)).strftime("%Y%m%d")
        lines += [
            "BEGIN:VEVENT",
            f"UID:jieqi-{y}-{name}@shanxin",
            f"DTSTART;VALUE=DATE:{ds}",
            f"DTEND;VALUE=DATE:{de}",
            f"SUMMARY:{ICON} {name}",
            f"DESCRIPTION:二十四节气 · {name}（{y}年）",
            "TRANSP:TRANSPARENT",
            "END:VEVENT",
        ]
lines.append("END:VCALENDAR")

import sys
out = sys.argv[1] if len(sys.argv) > 1 else "solar-terms.ics"
with open(out, "w", encoding="utf-8") as f:
    f.write("\r\n".join(lines) + "\r\n")
print(f"已生成: {out}  (事件数={len([l for l in lines if l=='BEGIN:VEVENT'])} 条)")
