# AGENTS.md

本文件面向在本仓库工作的 AI 代理与协作者，概述项目结构、构建命令与必须遵守的硬约束。深度设计文档见 `docs/PRD.md`（产品需求）与 `docs/TECH.md`（技术设计 + ADR + 实测陷阱），两者是本文件的上游，冲突时以源码与 TECH.md 为准。

## 项目是什么

**DWG 导入器**（`extension.json` → `name: dwg-importer`，当前 v1.1.0）：一个嘉立创EDA专业版（EasyEDA Pro）扩展，在 **PCB / 原理图 / 封装** 三种编辑器的顶部菜单中注册「导入 DWG…」，把机械 CAD 的 DWG 图纸（板框、外形、丝印参考等）解析后写入画布图元。

- 脚手架为 `pro-api-sdk`（`package.json` 里的 name 是 SDK 名，不是扩展名），基于 esbuild 打包出 `.eext` 安装包。
- 解析引擎：`@mlightcad/libredwg-web`（GPL-3.0，wasm），经 `npm run sync:vendor` 合并进 `vendor/libredwg-web/`。
- 协议：**GPL-3.0-or-later**（由 libredwg 传染，`npm run check:license` 强制校验，勿改回 Apache-2.0）。
- 不支持 DXF——EDA 原生已支持 DXF，本扩展只做 DWG。

## 常用命令

```bash
npm install
npm run sync:vendor   # 从 node_modules 合并 libredwg 三件套 → vendor/libredwg-web/（首次/升级解析库后必须跑）
npm run debug         # 构建 + 打包 .eext + WebSocket 推送到 EDA 客户端联调（端口 59394）
npm run build         # compile + packaged → dist/ 与 .eext 安装包
npm run lint          # eslint（antfu 配置：tab 缩进、单引号、分号）
npm run fix           # eslint --fix
npm run check:license # 协议自检（license 字段 + LICENSE 文本 + vendor 三件套齐全性）
npm run check:parser  # 解析器端到端自检（用 build/dist/Drawing*.dwg 样例跑完整 parseDwg 链路）
```

无单元测试框架；验证手段 = `lint` + `tsc --noEmit` + `check:parser` + 在 EDA 实机 `debug` 联调。Node 要求 ≥ 20.17。

## 目录结构

```
src/
  index.ts              入口：activate / about / importDwgPcb|Sch|Footprint（registerFn 必须是具名函数声明导出）
  internal/import-dwg.ts  菜单入口：写启动参数 → sys_IFrame.openIFrame（仅此而已，不参与解析）
  iframe/               弹窗（自包含，直接调用注入的 eda，无跨帧消息层）
    index.html / index.ts   静态壳 + 启动逻辑（state-machine.ts 六态：idle→parsing→parsed→importing→done/error）
    dwg/parser.ts           wasm 加载 + parseDwg(buffer) → IR（所有 libredwg 调用收敛在此一处）
    dwg/ir.ts               原始实体 → IR（含嵌套 BLOCK 递归展开 + 循环引用检测）
    dwg/block-expander.ts   INSERT 仿射展开（平移/缩放/旋转/镜像）
    dwg/spline-fit.ts      SPLINE（B 样条 / 拟合点型）求值 + 自适应采样
    dwg/mtext.ts           MTEXT 格式码清理、按 rectWidth 折行与行距
    dwg/infinite-line.ts   XLINE / RAY 假端点与 Liang-Barsky 裁剪
    dwg/layer-suggest.ts    图层智能建议（颜色距离 + 名字关键词）
    storage.ts              sys_Storage 封装（启动参数 KEY_LAUNCH + 用户偏好）
    ui/                     纯原生 DOM 组件（file / layer-mapping / options / styles.css）
    canvas-pick.ts          画布拾取原点坐标（EDA 无点击事件 API，用预选中图元 + selected/clearSelected 等价实现）
  write/                IR + mapping + options → EDA 图元（pcb-writer / sch-writer / fp-writer / index）
  shared/               eda-api.ts（全部 eda.* 类型契约 + LAYER 层 id 常量）/ types.ts（IR）/ units.ts / i18n.ts
build/                  构建脚本（dev / iframe / manifest / packaged / update / utils）+ 样例 DWG 在 build/dist/
config/                 esbuild 配置（common / iframe / prod）
scripts/                sync-vendor / check-license / check-parser-e2e / build-fallback
locales/                zh-Hans / en 文案（UI 用根目录两份；extensionJson/ 子目录供 extension.json 菜单文案）
vendor/libredwg-web/    由 sync:vendor 生成，勿手改（.edaignore 已把仓库根 vendor/ 排除出扩展包，运行时读 dist/vendor/）
docs/                   PRD.md / TECH.md
```

## 架构铁律（改代码前必读）

以下全部来自实机实测（TECH.md §9、§10.4 有完整依据），违反会得到「无报错但功能失效」或构建失败：

1. **`eda` 是注入的函数参数，不是全局对象**。`globalThis.eda` 恒为 `undefined`。一律经 `src/shared/eda-api.ts` 的 `edaApi()` 访问，且调用链用可选链兜底。新的 `eda.*` 调用必须先对照 `node_modules/@jlceda/pro-api-types/index.d.ts` 核实签名，禁止臆测。
2. **没有跨帧消息 API**。`sys_IFrame` 只有 openIFrame / closeIFrame / hideIFrame / showIFrame / isIFrameAlreadyExist。iframe 内可直接用 `eda`，所以解析与写图元全部在 iframe 内完成；不要引入 transport/protocol/messagebus 之类的东西。
3. **弹窗路径是包根基准**：`src/internal/import-dwg.ts` 的 `IFRAME_HTML = '/dist/iframe/index.html'`；HTML 内资源也用 `/dist/...` 绝对路径。`build/iframe.ts` 的 `assertHtmlPaths()` / `assertDataRoles()` / `assertVendorLinks()` 会在构建期校验路径与 `data-role` 一致性，改 HTML 或路径时以构建报错为准。
4. **PCB 层 id 一律用 `src/shared/eda-api.ts` 的 `LAYER` 常量**，禁止内联魔数（初版把 BOARD_OUTLINE 写成 2，实际是 11）。
5. **i18n 插值**：`sys_I18n.text()` 只查表不插值；插值必须用 `src/shared/i18n.ts` 的 `format()`，占位符统一 `{0}` 风格。任何用户可见的错误信息必须带具体原因。
6. **扩展 uuid 必须以字母开头**（EDA 用 `#<uuid>.<id>` 做 querySelector，数字开头必然抛 SyntaxError）。当前 uuid 以 `d` 开头，勿改；换 uuid 等于换新扩展，用户配置会丢。
7. **解析入口**：读整个 DWG 必须用 `libredwg.convertEx(ptr).database`，不是 `convert()`；`dwg_read_data(buffer, fileType)` 的 fileType `0`=DWG / `1`=DXF，传错**静默返回 undefined**（不抛错），调用处必须判空。控制台出现 `Open dwg file with error code: 64` 是上游 warn，表示版本较新但解析成功。
8. **新增块内实体类型时**，`ir.ts` 的 `rawToEntity()` 与 `block-expander.ts` 的 `transformEntity()` 必须同时支持（v1.1.0 曾因块内 INSERT 未处理导致整个文件解析失败）。
9. **多边形源数组**：首坐标点在 `'L'` 指令**之前**（`[x1, y1, 'L', x2, y2, ...]`）；闭合多段线需补回首点；`PrimitivePolyline.create` 需要 `IPCB_Polygon` 对象（经 `pcb_MathPolygon.createPolygon` 构造），不接受裸点数组。
10. **菜单入口用函数声明导出**（`export function foo()`），不要 re-export 形式，否则部分加载器下点击菜单无反应。

## 代码风格

- antfu eslint 配置：**tab 缩进、单引号、分号**；`no-console` 仅允许 log/warn/error。
- TypeScript `strict` 全套 + `isolatedModules`，禁用 `any`（用 unknown + 收窄）；`skipLibCheck: true` 是因为上游 libredwg-web 的 .d.ts 有缺陷，勿移除（自有源码仍全量检查）。
- 注释与用户可见文案以**简体中文**为主（与现有代码一致），并倾向记录「为什么」与实测依据，而非复述代码。
- 弹窗 UI 禁止引入 React/Vue 等框架：原生 DOM + CSS 变量（ADR-6，包体敏感）。
- 提交钩子：pre-commit 跑 lint-staged（eslint --fix）。

## 构建链要点

- 产物：`dist/index.js`（IIFE，globalName `edaEsbuildExportName`，minify=false——这两个是 SDK 约束勿改）+ `dist/iframe/index.js|html` + `dist/vendor/libredwg-web/*`。
- `build/dev.ts`（`npm run debug`）：构建 → 打包 .eext → base64 经 WebSocket(59394) 推给 EDA 客户端热更新。
- `.edaignore` 决定 .eext 包内容：src/build/config/docs/case/vendor 等全部排除，只带 dist/ 与 locales；仓库根 `vendor/` 排除是为了避免 wasm 打两份（包体 2.29 MB → 4.52 MB）。`case/` 是本地解析诊断用的测试图纸；`*.lck`/`*.bak`（wasm 引擎读 DWG 留下的锁/备份文件）被全局排除——打包时流式读到被占用的文件会让 zip 断流，产出没有中央目录的损坏 .eext（EDA 导入报 Corrupted zip）。
- `build/dev.ts` 启动时会用 `fixUuid()` 修复非法 uuid——若被触发，需人工确认 `extension.json` 的 uuid 仍以字母开头（见铁律 6）。

## 已知环境噪声（不是本扩展的 bug）

在 EDA 实机 console 看到 `SyntaxError: ... is not a valid selector`（EDA 4.1.48 iframeDialog 用 `#<uuid>.<id> .lc_modal_dialog_box_*` 做选择器，点号是类选择符）、`Script error. 0 0 null`、`jlc-apm-sdk.js 405`——均为 EDA 自身缺陷/埋点问题，发生在弹窗渲染之后，不影响功能，排查时不要被带偏。

## 变更后验证清单

1. `npm run lint` 与 `npx tsc --noEmit` 干净通过。
2. 涉及解析/BLOCK/图层建议：`npm run check:parser`（需先 `sync:vendor`，样例 DWG 在 `build/dist/`）。
3. 涉及 license/vendor：`npm run check:license`。
4. 涉及 UI/HTML/路径：`npm run build` 必须通过（含 assertHtmlPaths / assertDataRoles / assertVendorLinks 三道校验），然后 `npm run debug` 实机走通「菜单 → 选文件 → 解析 → 映射 → 导入」。
5. 新增用户可见文案：同步更新 `locales/zh-Hans.json` 与 `locales/en.json`（extension.json 菜单文案在 `locales/extensionJson/`）。
