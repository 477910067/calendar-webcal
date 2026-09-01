// 生成「中国法定节假日及调休-纯净版.ics」
// 规则：
//  1) 调休补班日显示为「XX(班)」，如 国庆节(班)
//  2) 连续同名的法定节假日合并为单条区间事件（如 中秋 9/25~9/27）
// 数据源：chinese-days（每日同步国务院安排）
// 用法：NODE_PATH=<node_modules> node gen_holidays.cjs [输出路径]

const cd = require("chinese-days");
const fs = require("fs");

// 从 "English,中文,类型" 中提取中文节日名
function cnName(det) {
  if (!det || !det.name) return null;
  const parts = det.name.split(",");
  if (parts.length < 2) return null;
  const n = parts[1].trim();
  return n || null;
}

// 时区无关的日期加减（避免 toISOString 在 UTC+8 下偏移）
function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
const nextDay = (iso) => addDays(iso, 1);
const ymd = (iso) => iso.replace(/-/g, "");

const START = "2024-01-01";
const STOP = "2027-01-01"; // 排他：覆盖到 2026-12-31

const events = [];
let run = null; // 当前连续放假区间 {name, start, last}

function flush() {
  if (!run) return;
  events.push({
    start: run.start,
    endExclusive: nextDay(run.last), // 全天事件 DTEND 排他，取末日+1
    summary: run.name,
    makeup: false,
  });
  run = null;
}

let iso = START;
while (iso < STOP) {
  const det = cd.getDayDetail(iso);
  const name = cnName(det);
  const work = det ? det.work : null;

  if (!name) {
    flush(); // 普通日，结束任何区间
  } else if (work === true) {
    flush(); // 补班：单日事件
    events.push({
      start: iso,
      endExclusive: nextDay(iso),
      summary: name + "(班)",
      makeup: true,
    });
  } else {
    // work === false，法定节假日
    if (run && run.name === name) {
      run.last = iso; // 延展区间
    } else {
      flush();
      run = { name, start: iso, last: iso };
    }
  }
  iso = addDays(iso, 1);
}
flush();

// 输出 iCalendar
const lines = [];
lines.push("BEGIN:VCALENDAR");
lines.push("VERSION:2.0");
lines.push("PRODID:-//ShanXin//CN Holidays//ZH");
lines.push("CALSCALE:GREGORIAN");
lines.push("METHOD:PUBLISH");
lines.push("X-WR-CALNAME:中国法定节假日及调休（纯净版）");
lines.push("X-WR-CALDESC:仅含法定节假日与调休补班，无节气/农历/黄历。节假日按区间合并显示，补班标注(班)。2024-2026。");
lines.push("X-WR-TIMEZONE:Asia/Shanghai");

for (const ev of events) {
  lines.push("BEGIN:VEVENT");
  lines.push(`UID:${ev.makeup ? "makeup" : "holiday"}-${ev.start}@shanxin`);
  lines.push(`DTSTART;VALUE=DATE:${ymd(ev.start)}`);
  lines.push(`DTEND;VALUE=DATE:${ymd(ev.endExclusive)}`);
  lines.push(`SUMMARY:${ev.summary}`);
  lines.push(`DESCRIPTION:${ev.makeup ? "调休补班（需上班）" : "法定节假日"}`);
  lines.push("TRANSP:TRANSPARENT");
  lines.push("END:VEVENT");
}
lines.push("END:VCALENDAR");

const out = lines.join("\r\n") + "\r\n";
const target = process.argv[2] || "holidays.ics";
fs.writeFileSync(target, out, "utf8");
console.log(`已生成 ${target}：共 ${events.length} 个事件（放假区间合并 + 补班单日）`);
console.log("其中补班：", events.filter((e) => e.makeup).length, "个");
