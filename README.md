# 中国纯净日历 · webcal 订阅

仅含单一内容、互不干扰的两份 iCalendar 日历，可订阅到苹果日历（及支持 webcal 的客户端），按周期自动更新。

## 订阅链接（webcal）

- **24 节气（纯净版）**：`webcal://477910067.github.io/calendar-webcal/solar-terms.ics`
  - 2024–2050，共 648 条，完整 24 节气（含清明），无节假日 / 农历 / 黄历
- **法定节假日及调休（纯净版）**：`webcal://477910067.github.io/calendar-webcal/holidays.ics`
  - 2024–2026，共 41 条事件（放假区间 22 + 调休补班 19），无节气 / 农历 / 黄历
  - 显示规则：连续法定节假日合并为**单条区间事件**（如中秋显示为 9/25–9/27）；调休补班显示为 **「XX(班)」**（如国庆节(班)）

## 如何订阅

- **Mac 日历**：文件 → 新建日历订阅 → 粘贴上面的 `webcal://` 链接；或直接打开 `index.html` 点链接。
- **iPhone / iPad**：设置 → 日历 → 账户 → 添加账户 → 其他 → 添加已订阅的日历 → 粘贴链接（⚠️ 复制链接后用 Safari 打开，微信 / QQ 内置浏览器会拦截）。

订阅后客户端会定期自动拉取；更新 `.ics` 后无需手动重导。

## 文件说明

| 文件 | 作用 |
|---|---|
| `solar-terms.ics` | 24 节气，天文算法按北京时间交节，覆盖至 2050 年 |
| `holidays.ics` | 法定节假日 + 调休补班，数据来自 chinese-days（同步国务院公布安排）；连续节假日合并为区间、补班标注「(班)」 |
| `gen_holidays.cjs` | 节假日 `.ics` 生成脚本（依赖 `chinese-days`）。更新数据时：`npm i chinese-days` 后 `NODE_PATH=node_modules node gen_holidays.cjs holidays.ics` |
| `server.py` | 零依赖本地 webcal 服务（仅绑定 `127.0.0.1:8123`）。需内网 / 离线使用时，在目录下 `python3 server.py`，再订阅 `webcal://127.0.0.1:8123/xxx.ics`（仅本机可见） |
| `index.html` | 订阅说明页 |

## 更新

- 节假日数据依赖国务院年度安排，2027 年及以后待发布后更新 `holidays.ics` 并重新推送。
- 24 节气已覆盖至 2050 年，一般无需更新。

## 数据来源与免责

- 节气：天文公式推算（北京时间）。
- 节假日：`chinese-days` 项目（国务院公布数据）。
- 仅供参考，请以官方发布为准。
