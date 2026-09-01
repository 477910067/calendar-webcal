// 生成「中国民俗节及纪念日-纯净版.ics」
// 规则：
//  1) 仅含民俗节日与纪念日，不含法定节假日、不含 24 节气（保持纯净、互不干扰）
//  2) 农历民俗节日由 lunar-javascript 推算（覆盖闰月、除夕等）
//  3) 公历固定纪念日 + 移动节日（母亲节/父亲节/感恩节）按规则计算
//  4) 所有事件标题加 ⭐ 星星图标前缀，区分类型
// 数据源：lunar-javascript（农历/公历互转 + 节日名）
// 用法：NODE_PATH=<node_modules> node gen_folk.cjs [输出路径]

const L = require("lunar-javascript");
const fs = require("fs");

const ICON = "⭐"; // 民俗节图标：星星

// ===== 农历民俗节日 =====
// 排除法定节假日：春节(正月初一)、端午节(五月初五)、中秋节(八月十五) —— 已在 holidays.ics
const LUNAR_EXCLUDE = new Set(["春节", "端午节", "中秋节"]);
// getFestivals() 未覆盖的节日，用「农历月-日」手动匹配（仅非闰月）
const LUNAR_MANUAL = {
  "7-15": "中元节",
  "10-1": "寒衣节",
  "12-23": "小年",
};
// 库返回名 → 常用展示名
const RENAME = { "龙头节": "龙抬头" };

// ===== 公历固定纪念日 =====
const FIXED = [
  { m: 2, d: 14, name: "情人节" },
  { m: 3, d: 8, name: "妇女节" },
  { m: 3, d: 12, name: "植树节" },
  { m: 4, d: 1, name: "愚人节" },
  { m: 5, d: 4, name: "青年节" },
  { m: 6, d: 1, name: "儿童节" },
  { m: 7, d: 1, name: "建党节" },
  { m: 7, d: 1, name: "香港回归纪念日" },
  { m: 8, d: 1, name: "建军节" },
  { m: 9, d: 10, name: "教师节" },
  { m: 10, d: 31, name: "万圣节" },
  { m: 11, d: 8, name: "记者节" },
  { m: 11, d: 11, name: "双十一" },
  { m: 12, d: 20, name: "澳门回归纪念日" },
  { m: 12, d: 24, name: "平安夜" },
  { m: 12, d: 25, name: "圣诞节" },
];

// 时区无关日期工具
function ymd(iso) {
  return iso.replace(/-/g, "");
}
function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
function nthWeekday(year, month, weekday, n) {
  // weekday: 0=周日 ... 6=周六；返回该月第 n 个 weekday 的 {y,m,d}
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return { y: year, m: month, d: day };
}

const START = "2024-01-01";
const STOP = "2036-01-01"; // 排他：覆盖 2024–2035

const events = []; // {start, name}
const seen = new Set(); // 防重复（同一年同名）

function addEvent(iso, name) {
  const key = iso + "|" + name;
  if (seen.has(key)) return;
  seen.add(key);
  events.push({ start: iso, name });
}

let iso = START;
while (iso < STOP) {
  const [y, m, d] = iso.split("-").map(Number);

  // 1) 农历民俗
  try {
    const lunar = L.Solar.fromYmd(y, m, d).getLunar();
    // 优先手动匹配（中元/寒衣/小年 等 getFestivals 未覆盖）
    const key = `${lunar.getMonth()}-${lunar.getDay()}`;
    if (LUNAR_MANUAL[key]) addEvent(iso, LUNAR_MANUAL[key]);
    // 库内置节日名
    const fests = lunar.getFestivals() || [];
    for (const f of fests) {
      if (LUNAR_EXCLUDE.has(f)) continue;
      addEvent(iso, RENAME[f] || f);
    }
  } catch (e) {
    // 个别极端日期 lunar 库不支持，跳过
  }

  iso = addDays(iso, 1);
}

// 2) 公历固定纪念日（按年）
for (let y = 2024; y <= 2035; y++) {
  for (const f of FIXED) {
    const dd = String(f.d).padStart(2, "0");
    const mm = String(f.m).padStart(2, "0");
    addEvent(`${y}-${mm}-${dd}`, f.name);
  }
  // 3) 移动节日
  const mothers = nthWeekday(y, 5, 0, 2); // 5月第2个周日
  addEvent(`${mothers.y}-${String(mothers.m).padStart(2, "0")}-${String(mothers.d).padStart(2, "0")}`, "母亲节");
  const fathers = nthWeekday(y, 6, 0, 3); // 6月第3个周日
  addEvent(`${fathers.y}-${String(fathers.m).padStart(2, "0")}-${String(fathers.d).padStart(2, "0")}`, "父亲节");
  const thanks = nthWeekday(y, 11, 4, 4); // 11月第4个周四
  addEvent(`${thanks.y}-${String(thanks.m).padStart(2, "0")}-${String(thanks.d).padStart(2, "0")}`, "感恩节");
}

// 输出 iCalendar
const lines = [];
lines.push("BEGIN:VCALENDAR");
lines.push("VERSION:2.0");
lines.push("PRODID:-//ShanXin//CN Folk Festivals//ZH");
lines.push("CALSCALE:GREGORIAN");
lines.push("METHOD:PUBLISH");
lines.push("X-WR-CALNAME:中国民俗节及纪念日（纯净版）");
lines.push("X-WR-CALDESC:仅含民俗节日与纪念日，无节气/无法定节假日。图标⭐。2024-2035。");
lines.push("X-WR-TIMEZONE:Asia/Shanghai");
lines.push("COLOR:#E9A800"); // 星星主题色：琥珀金

for (const ev of events) {
  lines.push("BEGIN:VEVENT");
  lines.push(`UID:folk-${ev.start}-${ev.name}@shanxin`);
  lines.push(`DTSTART;VALUE=DATE:${ymd(ev.start)}`);
  lines.push(`DTEND;VALUE=DATE:${ymd(addDays(ev.start, 1))}`);
  lines.push(`SUMMARY:${ICON} ${ev.name}`);
  lines.push(`DESCRIPTION:民俗节及纪念日`);
  lines.push("TRANSP:TRANSPARENT");
  lines.push("END:VEVENT");
}
lines.push("END:VCALENDAR");

const out = lines.join("\r\n") + "\r\n";
const target = process.argv[2] || "folk.ics";
fs.writeFileSync(target, out, "utf8");
console.log(`已生成 ${target}：共 ${events.length} 个事件（民俗+纪念日）`);
