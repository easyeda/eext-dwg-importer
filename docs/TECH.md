# 技术文档 — DWG Importer for EasyEDA Pro

> 版本：v1.1 (与 PRD v0.3 对齐；已按实测结果修正 iframe 架构与层 id)
> 范围：在 PRD 已确认的产品决策之上，给出可实施的技术设计。
> 受众：项目作者本人 + 未来可能的协作者；按文档能 1:1 落地代码。

> **v1.1 重要修正（务必先读）**
>
> 初版设计中的若干 API 属于臆测，实测后已推翻，本文档已同步修正：
>
> 1. **不存在跨帧消息 API**。`sys_IFrame` 只有 `openIFrame` / `closeIFrame` / `hideIFrame` /
>    `showIFrame` / `isIFrameAlreadyExist`；初版假设的 `sendMessageToIframe` /
>    `onIframeMessage` 均不存在（运行时表现为
>    `Uncaught Error: sys_IFrame.showIFrame is unavailable`）。
> 2. **iframe 内可直接使用全局 `eda`**，无需 `window.parent`。因此 `transport.ts` /
>    `protocol.ts` / `messagebus.ts` 已删除，改为 iframe 自包含（见 §3.3、ADR-12）。
> 3. **`sys_Storage` 是「同步读 / 异步写」**，方法名为 `getExtensionUserConfig` /
>    `setExtensionUserConfig`，并非 `getItem` / `setItem`。
> 4. **`sys_Environment.getTheme()` 不存在**（该类只有 `isWeb()` / `isClient()` 等判定）。
> 5. **层 id 初版全部写错**（例如把 `BOARD_OUTLINE` 写成 2，实际是 11）。
>    现统一集中在 `src/shared/eda-api.ts` 的 `LAYER` 常量，并对照 `pro-api-types` 核实。
> 6. **解析库实际是 `@mlightcad/libredwg-web`（GPL-3.0）**，不是初版写的
>    `@mlightcad/libredwg-bab`（该包在 npm 上不存在）；协议随之改为 GPL-3.0-or-later。
> 7. **包内资源必须用完整路径**（`/iframe/index.js`），相对路径会加载失败。
>
> 教训：凡涉及 `eda.*` 的调用，一律先对照 `node_modules/@jlceda/pro-api-types/index.d.ts`
> 核实签名，不要凭印象书写。

---

## 1. 目标与约束

### 1.1 目标

把 PRD 中描述的"在 PCB / 原理图 / 封装编辑器中一键导入 DWG"功能，做成可维护、可调试、包体可控、协议合规的实现。文档需覆盖：

1. 模块划分与每个模块的对外契约（入参/出参/错误）。
2. 关键算法（BLOCK 仿射展开、SPLINE 自适应采样、LAYER 智能建议）。
3. 状态机与时序（弹窗五态 × 协议消息 × 进度上报）。
4. 错误码与降级路径。
5. 构建链调整（esbuild 配置、wasm asset 加载、vendor 目录）。
6. 依赖锁定（package.json devDependencies 精确版本）。
7. 调试 / 联调流程（`npm run debug` + iframe 独立调试 + 控制台验证）。
8. CI 校验（lint / tsc / eext 包大小 / 协议合规）。
9. ADR 记录关键决策与拒绝的备选方案。
10. 关键代码骨架（TS），不替代实现，但作为编码起点。

### 1.2 约束

- 全 TypeScript，`strict: true` 全套（项目已开启），禁用 `any`。
- 解析库：`@mlightcad/libredwg-bab`（v1）；wasm 随 eext 打包。
- 协议：仓库整体 GPL-2.0-or-later。
- 弹窗内禁止引入 React/Vue/Tailwind 等重框架，原生 DOM + CSS 变量。
- 代码无死代码、无过度抽象；模块单一职责。
- eext 包大小目标：wasm + JS + CSS gzip 后 ≤ 1.2 MB。

---

## 2. 模块划分与依赖图

```
                       ┌──────────────────────┐
                       │      src/index.ts    │
                       │   (pro entry / SDK)  │
                       └──────────┬───────────┘
                                  │ delegates to
                                  ▼
                       ┌──────────────────────┐
                       │      src/menu.ts     │
                       │ importDwg(documentType) │
                       └──────────┬───────────┘
                                  │ delegates to
                                  ▼
                       ┌──────────────────────────────────┐
                       │   src/internal/import-dwg.ts     │
                       │  探测文档类型 → 写启动参数        │
                       │  → sys_IFrame.openIFrame(...)    │
                       └──────────┬───────────────────────┘
                                  │ 打开内联框架（无跨帧消息）
                                  ▼
                ┌─────────────────────────────────┐
                │      src/iframe/  （自包含）     │
                │  ┌───────────┬────────────────┐ │
                │  │index.html │ index.ts       │ │
                │  │           ├─ ui/*          │ │
                │  │           ├─ dwg/*         │ │
                │  │           └─ storage.ts    │ │
                │  └────────────────────────────┘ │
                │  直接调用全局 eda 对象            │
                └────────────────┬────────────────┘
                                 │ 直接调用（同一 JS 上下文）
                                 ▼
                       ┌──────────────────────┐
                       │     src/write/       │
                       │  pcb-writer.ts       │
                       │  sch-writer.ts       │
                       │  fp-writer.ts        │
                       │  （由 iframe 内调用）  │
                       └──────────┬───────────┘
                                  │ uses
                                  ▼
                       ┌──────────────────────┐
                       │    src/shared/       │
                       │  units.ts / types.ts │
                       │  i18n.ts             │
                       └──────────────────────┘

 外部依赖：
  vendor/libredwg/{libredwg.js, libredwg.wasm}   ←  @mlightcad/libredwg-bab/dist 拷贝
 EDA API：eda.sys_HeaderMenu / eda.sys_IFrame / eda.sys_FileSystem / eda.sys_Storage
          eda.pcb_Primitive* / eda.sch_Primitive* / eda.pcb_Layer
```

每个模块的具体职责：

| 模块 | 单一职责 |
|---|---|
| `src/index.ts` | pro-api-sdk 入口；导出 `activate / importDwgPcb / importDwgSch / importDwgFootprint / about` |
| `src/menu.ts` | 三个 `registerFn` 全部委托到 `importDwg(documentType)`，不做环境校验 |
| `src/iframe/index.html` | 弹窗静态壳；以**完整路径** `/iframe/index.js` 引用编译产物 |
| `src/iframe/index.ts` | 弹窗启动；初始化状态机；**直接在 iframe 内完成导入** |
| `src/iframe/ui/file-section.ts` | 文件选择/拖拽/解析进度/已选文件信息 |
| `src/iframe/ui/layer-mapping.ts` | 图层列表 + 映射下拉 + 智能建议工具栏 |
| `src/iframe/ui/options-section.ts` | 实体类型开关 + 线宽 + 单位 + 跳过空图层 |
| `src/iframe/ui/preview-section.ts` | 实体计数 + 包围盒 + BLOCK 摘要 + warnings |
| `src/iframe/ui/inject-styles.ts` | 运行时注入 CSS（esbuild 以 text 载入） |
| `src/iframe/ui/styles.css` | 弹窗样式，CSS 变量驱动的浅/深色主题 |
| `src/iframe/dwg/parser.ts` | wasm 加载与生命周期；调用 libredwg 解析入口；进度上报 |
| `src/iframe/dwg/block-expander.ts` | INSERT → 几何副本（含仿射变换） |
| `src/iframe/dwg/ir.ts` | IR 类型定义；从 libredwg 输出构造 IR |
| `src/iframe/dwg/layer-suggest.ts` | 智能建议：颜色查表 + 名字归一化 |
| `src/iframe/dwg/spline-sampler.ts` | 自适应采样（区间 16–128） |
| `src/iframe/storage.ts` | `sys_Storage` 封装：lastDir / lineWidth / unit / **启动参数** |
| `src/internal/import-dwg.ts` | 菜单入口：探测文档类型 → 写启动参数 → `openIFrame` |
| `src/write/pcb-writer.ts` | IR + mapping + options → PCB Primitive API（PCB / Footprint 共用） |
| `src/write/sch-writer.ts` | IR + mapping + options → SCH Primitive API |
| `src/shared/eda-api.ts` | **所有 `eda.*` 的类型契约与层 id 常量**（对照 pro-api-types 核实） |
| `src/shared/units.ts` | mm/inch ↔ mil；DWG 单位 → mil |
| `src/shared/types.ts` | 共享类型（IR、mapping、options） |
| `src/shared/i18n.ts` | 文案 key → 当前语言 |

---

## 3. 关键类型与接口签名

### 3.1 IR 类型（与 PRD §4 对齐，此处补全运行时用到的细节）

```ts
// src/shared/types.ts
export type DwgEntityKind =
  | 'LINE' | 'LWPOLYLINE' | 'POLYLINE' | 'CIRCLE' | 'ARC'
  | 'TEXT' | 'MTEXT' | 'SPLINE';

export type DwgUnit = 'mm' | 'inch' | 'unknown';

export interface DwgPoint { x: number; y: number; }

export interface DwgEntityBase {
  id: string;
  kind: DwgEntityKind;
  layer: string;
  color?: number;       // ACI 0..255
  lineWidth?: number;   // 1/100 mm
  fromBlock?: { blockName: string; insertId: string };
}

export interface DwgLineEntity   extends DwgEntityBase { kind: 'LINE'; start: DwgPoint; end: DwgPoint; }
export interface DwgCircleEntity extends DwgEntityBase { kind: 'CIRCLE'; center: DwgPoint; radius: number; }
export interface DwgArcEntity    extends DwgEntityBase { kind: 'ARC'; center: DwgPoint; radius: number; startAngle: number; endAngle: number; }
export interface DwgPolylineEntity extends DwgEntityBase {
  kind: 'LWPOLYLINE' | 'POLYLINE' | 'SPLINE';
  points: DwgPoint[];
  closed: boolean;
}
export interface DwgTextEntity   extends DwgEntityBase { kind: 'TEXT' | 'MTEXT'; position: DwgPoint; content: string; height: number; rotation: number; }

export type DwgEntity =
  | DwgLineEntity | DwgCircleEntity | DwgArcEntity
  | DwgPolylineEntity | DwgTextEntity;

export interface DwgLayer { name: string; color: number; entityCount: number; }
export interface DwgBlockSummary { name: string; entityCount: number; }
export interface DwgBoundingBox { minX: number; minY: number; maxX: number; maxY: number; }

export interface DwgIR {
  source: 'DWG';
  units: DwgUnit;
  layers: DwgLayer[];
  blocks: DwgBlockSummary[];
  entities: DwgEntity[];   // BLOCK 已展开；不含 INSERT
  bbox: DwgBoundingBox;
  parseWarnings: string[];
}
```

### 3.2 映射与选项

```ts
// src/shared/types.ts

export type ImportDocumentType = 'PCB' | 'SCH' | 'FOOTPRINT';

/** 文档类型 → 唯一字符串标识，与 EDA documentType 对应 */
export const DOCUMENT_TYPE_MAP: Record<ImportDocumentType, number> = {
  PCB: 3,
  SCH: 1,
  FOOTPRINT: 4,
};

/** DWG 图层 → 目标 PCB 层 ID（EDA EPCB_LayerId 枚举值）。null 表示不导入。 */
export type LayerMapping = Record<string, number | null>;

export interface ImportOptions {
  enabledKinds: ReadonlySet<DwgEntityKind>;   // 默认 7 类 + SPLINE
  defaultLineWidthMil: number;                // 1/2/4/6/8/10/20 mil
  units: DwgUnit | 'auto';                    // 默认 'auto'，从 IR 推断
  skipEmptyLayers: boolean;                   // 默认 true
  // 合并共线段 v1 仅占位 UI，不实现
}

export interface ApplyImportPayload {
  ir: DwgIR;
  mapping: LayerMapping;
  options: ImportOptions;
  documentType: ImportDocumentType;
}

export interface ApplyImportResult {
  successCount: number;
  failedCount: number;
  errors: Array<{ entityId: string; message: string }>;
}
```

### 3.3 弹窗启动参数（不使用跨帧消息）

> **重要修正**：本节早期版本设计了 `sendMessageToIframe` / `onIframeMessage` 双向协议。
> 经对照 `@jlceda/pro-api-types` 与官方 `iframe_custom_ui` 文档核实，**这两个 API 并不存在**，
> `SYS_IFrame` 仅有 `openIFrame` / `closeIFrame` / `hideIFrame` / `showIFrame` / `isIFrameAlreadyExist`。
> 同时官方文档明确：**iframe 内可直接访问全局 `eda` 对象，无需 `window.parent`**。
> 因此现在的设计是「iframe 自包含」，没有消息层。

```ts
// src/iframe/storage.ts
export const KEY_LAUNCH = 'dwg-importer.launch';

export interface LaunchParams {
  documentType: 'PCB' | 'SCH' | 'FOOTPRINT';
}
```

数据传递方式：
- **host → iframe**：`openIFrame` **不支持 query 参数**，故启动参数经
  `eda.sys_Storage.setExtensionUserConfig(KEY_LAUNCH, { documentType })` 写入，
  iframe 启动时用 `getExtensionUserConfig(KEY_LAUNCH)`（**同步**）读取。
- **iframe → host**：**不需要**。iframe 自行完成解析与写图元，结束后调用
  `eda.sys_IFrame.closeIFrame('dwg-importer-window')` 关闭自身。
- 失败与结果反馈直接用 `eda.sys_Message.showToastMessage` / `eda.sys_Log`。

### 3.4 弹窗打开与关闭（host 侧）

```ts
// src/internal/import-dwg.ts
const IFRAME_HTML = '/iframe/index.html';   // 扩展包内完整路径
const IFRAME_ID = 'dwg-importer-window';    // 固定 id，便于重复打开时先关闭旧窗口

// 1. 探测真实文档类型（菜单传入值可能与当前文档不一致）
const info = await eda.dmt_SelectControl.getCurrentDocumentInfo();
//    documentType: PCB=3 / SCHEMATIC_PAGE=1 / FOOTPRINT=4

// 2. 写启动参数
await eda.sys_Storage.setExtensionUserConfig(KEY_LAUNCH, { documentType });

// 3. 打开窗口
await eda.sys_IFrame.openIFrame(IFRAME_HTML, 760, 660, IFRAME_ID, {
  title: 'DWG 导入器',
  maximizeButton: false,
  minimizeButton: false,
});
```

注意：
- `openIFrame` 返回 `Promise<boolean>`，`false` 表示打开失败。
- 重复点击菜单时先 `isIFrameAlreadyExist(id)` → `closeIFrame(id)`，避免多开。
- **HTML 内的资源路径必须写成包内完整路径**（如 `/iframe/index.js`），相对路径会加载失败。

### 3.5 共享层 API 关键签名

```ts
// src/iframe/storage.ts
export interface IframeStorage {
  getLastDir(): Promise<string | null>;
  setLastDir(path: string): Promise<void>;
  getDefaultLineWidth(): Promise<number>;   // 默认 4
  setDefaultLineWidth(mil: number): Promise<void>;
  getDefaultUnit(): Promise<'auto' | DwgUnit>;
  setDefaultUnit(unit: 'auto' | DwgUnit): Promise<void>;
}

// src/shared/units.ts
export const MM_PER_MIL = 0.0254;            // 1 mil = 0.0254 mm
export const INCH_PER_MIL = 0.001;           // 1 mil = 0.001 inch
export function mmToMil(mm: number): number;
export function inchToMil(inch: number): number;
export function dwgToMil(valueInDwgUnit: number, units: DwgUnit): number;
```

---

## 4. 关键算法

### 4.1 BLOCK 仿射展开

**输入**：原始 `DwgEntity[]`（含 INSERT）+ `blockDefs: Map<blockName, DwgEntity[]>`。
**输出**：`DwgEntity[]`（INSERT 已展开为几何副本，每个副本带 `fromBlock`）。

**变换**（二维仿射）：`p' = T + R(θ) · M(mirror) · S(s) · p`

```ts
// src/iframe/dwg/block-expander.ts
export interface InsertTransform {
  tx: number; ty: number;
  sx: number; sy: number;          // 缩放
  rotation: number;                // rad
  mirror: boolean;                 // X 轴镜像
  blockName: string;
  insertId: string;
}

export function expandInserts(
  rawEntities: DwgEntity[],
  blockDefs: Map<string, DwgEntity[]>,
): DwgEntity[] {
  const out: DwgEntity[] = [];
  for (const e of rawEntities) {
    if (e.kind !== 'INSERT' as any) {        // INSERT 不进 IR
      out.push(e);
      continue;
    }
    const ins = e as DwgInsertEntity;
    const block = blockDefs.get(ins.blockName);
    if (!block) { /* skip + warning */ continue; }
    const t = { ...ins } as InsertTransform;
    for (const child of block) {
      out.push(transformEntity(child, t));
    }
  }
  return out;
}

function transformPoint(p: DwgPoint, t: InsertTransform): DwgPoint {
  let x = p.x * t.sx;
  let y = p.y * t.sy;
  if (t.mirror) y = -y;
  const c = Math.cos(t.rotation), s = Math.sin(t.rotation);
  return { x: x * c - y * s + t.tx, y: x * s + y * c + t.ty };
}
```

**说明**：若 `@mlightcad/libredwg-bab` 原生支持 `expandBlocks: true`，则 `parser.ts` 调用时直接传入；本模块作为 fallback，在 `parser.ts` 检测到不支持时启用二次遍历（详见 §5.2）。

### 4.2 SPLINE 自适应采样

**目标**：将 B 样条曲线转成 16–128 段折线，控制最大视觉偏差 < 0.1 mm（数据层单位）。

```ts
// src/iframe/dwg/spline-sampler.ts
export function sampleSpline(
  controlPoints: DwgPoint[],
  closed: boolean,
  maxDeviationMm = 0.1,
  minSegments = 16,
  maxSegments = 128,
): DwgPoint[] {
  // 1. 用包围盒估算初始段数：
  //    segments = clamp(
  //      Math.ceil(bezierLength / (2 * maxDeviationMm)),
  //      minSegments, maxSegments,
  //    )
  // 2. 用 De Casteljau 在每段中点二分细判断偏差：
  //    若 |mid - linear_interp(p_i, p_{i+1})| > maxDeviationMm，
  //    则把当前段再分两段；递归直到全部偏差合格。
  // 3. 返回新点序列；闭合时首尾相等。
}
```

**误差度量**：用控制多边形长度近似弧长初估；实际细判断用 De Casteljau 中点 vs 线性插值的距离。

### 4.3 图层智能建议

```ts
// src/iframe/dwg/layer-suggest.ts
export function suggestPcbLayer(
  dwgLayerName: string,
  pcbLayers: ReadonlyArray<{ id: number; color: Rgb; name: string }>,
): number | null {
  // 1. 颜色匹配：归一化 RGB 后算欧氏距离，< 阈值返回
  // 2. 名字归一化：uppercase + 去 '_-' + 关键词命中
  //    BOARD_OUTLINE / OUTLINE / WIREFRAME  → BoardOutline
  //    DIM* / DIMENSION                     → Mechanical5
  //    SILK* / PLACE*                       → TopSilkLayer
  //    DOC* / NOTE* / TEXT                  → Document
  // 3. 都没命中 → null（让用户手动选）
}
```

**颜色查表**：`pcbLayers` 来自 `eda.pcb_Layer.getAllLayers()`（运行时取）或 `EPCB_LayerId` 枚举静态映射的默认颜色。

---

## 5. 状态机与时序

### 5.1 弹窗主状态机

```
                    ┌────────┐
       open menu →  │ idle   │
                    └───┬────┘
              select file (drag/click)
                        │
                        ▼
                ┌───────────────┐
                │ file-selected │
                └───┬───────┬───┘
                    │       │ cancel → idle
       (auto parse)│       │
                    ▼       │
                ┌───────────┐
                │  parsing  │ ───── progress 0..100
                └───┬───┬───┘
                    │   │
       success      │   │ parse error
                    ▼   ▼
            ┌───────────┐  ┌──────┐
            │  parsed   │  │error │
            └───┬───┬───┘  └───┬──┘
                │   │           │ retry → file-selected
                │   │ (re-parse on file change)
                │   ▼
                │ parsed (re-entered)
                │
   user clicks  │
   "导入"       ▼
            ┌───────────┐
            │ importing │ ─── progress 0..100（write 端进度）
            └───┬───┬───┘
                │   │
       done     │   │ fail mid-way（部分图元已创建）
                ▼   ▼
        ┌─────────┐  ┌────────────────┐
        │  done   │  │ done(partial)  │
        └─────────┘  └────────────────┘
        (close)        (toast + close)
```

### 5.2 时序图：完整导入一次

> 无跨帧消息：host 只负责打开窗口，之后全部由 iframe 直接调用 `eda` 完成。

```
User            Host (import-dwg.ts)        EDA / iframe (共享同一 JS 上下文)
 │                    │                              │
 │ click 菜单         │                              │
 │                    │ dmt_SelectControl            │
 │                    │   .getCurrentDocumentInfo() →│
 │                    │◄──── documentType ───────────│
 │                    │ setExtensionUserConfig(      │
 │                    │   KEY_LAUNCH, {...})        →│
 │                    │ openIFrame('/iframe/index   →│
 │                    │   .html', 760, 660, id, {})  │
 │                    │◄──── true/false ─────────────│
 │                    │  (host 职责结束，返回)         │
 │                    │                              │
 │                    │        iframe 启动            │
 │                    │        getExtensionUserConfig│
 │                    │          (KEY_LAUNCH) 同步读  │
 │ drag/select DWG    │        parseDwg() (wasm)     │
 │ edit mapping       │        applyPcb/SchImport()  │
 │ click 导入         │            │                 │
 │                    │            │ pcb_Primitive*  │
 │                    │            │  .create() ────→│
 │                    │            │◄── result ──────│
 │                    │        showToastMessage(结果) │
 │                    │        closeIFrame(自身)      │
 │◄─── 弹窗关闭，画布显示导入结果 ──────────────────────│
```

### 5.3 关键约束

- 弹窗内**所有 wasm / 解析 / IR 构造都在 iframe 内部完成**，主进程**不参与解析**。
- 主进程收到 `apply-import` 后**只读不修改** IR；任何校验失败立即拒收（fail fast）。
- `apply-import` 是最重的载荷；上限 100k 实体（与 PRD §7 一致），否则拒收并提示。
- 进度消息 `parse-progress` 限频 30 fps（在 iframe 内部节流）。

---

## 6. Writer 实现要点

### 6.1 实体映射表

| IR 类型 | EDA API | 备注 |
|---|---|---|
| LINE | `pcb_PrimitiveLine.create(net, layer, x1, y1, x2, y2, width, locked)` | net = '' |
| POLYLINE / LWPOLYLINE（闭合、≤32 点） | `pcb_PrimitiveRegion.create(points, layer, locked)` | 视为填充轮廓 |
| POLYLINE / LWPOLYLINE（开放） | `pcb_PrimitivePolyline.create(points, width, layer, locked)` | 不闭合 |
| POLYLINE / LWPOLYLINE（>32 点） | **TODO 实测**：若 EDA 接受，则单次 create；否则拆为多段 `[i*32, (i+1)*32]` | 见 §9.4 |
| SPLINE | `pcb_PrimitivePolyline.create(sampled, width, layer, locked)` | 先 §4.2 采样 |
| CIRCLE | `pcb_PrimitivePolyline.create(sampled, width, layer, locked)` | 32 段折线近似 |
| ARC | `pcb_PrimitiveArc.create(layer, cx, cy, r, startAngle, endAngle, width, net, locked)` | 注意角度单位：EDA 用角度，DWG 用弧度 |
| TEXT / MTEXT | `pcb_PrimitiveString.create(x, y, content, layer, height, rotation, locked)` | height = dwgTextHeight * 0.8（视觉对齐） |

### 6.2 通用骨架

```ts
// src/write/pcb-writer.ts
export async function applyPcbImport(
  payload: ApplyImportPayload,
  onProgress: (done: number, total: number) => void,
): Promise<ApplyImportResult> {
  const layerByName = new Map(payload.ir.layers.map(l => [l.name, l.color] as const));
  const result: ApplyImportResult = { successCount: 0, failedCount: 0, errors: [] };
  const total = payload.ir.entities.length;
  const BATCH = 50;
  for (let i = 0; i < total; i += BATCH) {
    const slice = payload.ir.entities.slice(i, i + BATCH);
    await Promise.all(slice.map(async (e) => {
      try {
        const targetLayer = payload.mapping[e.layer];
        if (targetLayer === null || targetLayer === undefined) return;
        if (payload.options.skipEmptyLayers && (layerByName.get(e.layer)?.count ?? 0) === 0) return;
        if (!payload.options.enabledKinds.has(e.kind)) return;
        await createOne(e, targetLayer, payload.options);
        result.successCount++;
      } catch (err) {
        result.failedCount++;
        result.errors.push({ entityId: e.id, message: (err as Error).message });
      }
    }));
    onProgress(Math.min(i + BATCH, total), total);
  }
  return result;
}
```

### 6.3 SCH / Footprint 适配

- Footprint 编辑器复用 `pcb_Primitive*` API（EDA 同源），故 `src/write/fp-writer.ts` 可复用 `pcb-writer.ts` 的实体创建分支；差异仅在 `mapping` 取值（`Mechanical1..30` + `Document`）。
- SCH 编辑器用 `sch_Primitive*`：SCH 文档单位是 0.01inch (= 10 mil)，写图元前做单位换算。
- 三个 writer 共享 `applyImportCore`，差异通过 `writerAdapter` 注入。

---

## 7. 构建与依赖

### 7.1 esbuild 配置调整

在 `config/esbuild.common.ts` 增加：

```ts
{
  // 已有
  entryPoints: {
    index: './src/index',
    'iframe/index': './src/iframe/index',   // 新增 iframe 入口
  },
  loader: { '.wasm': 'file', '.css': 'text' },  // 新增
  assetNames: 'assets/[name]-[hash]',           // 资源命名
  // ...
}
```

产物结构（`dist/`）：
```
dist/
├─ index.js                      # 主进程入口（globalName: edaEsbuildExportName）
├─ iframe/index.js               # iframe 入口
├─ iframe/index.html             # 弹窗静态壳（拷贝自 src/iframe/index.html）
├─ assets/libredwg-XXXX.wasm     # 来自 vendor/libredwg/libredwg.wasm
├─ assets/libredwg-XXXX.js       # 来自 vendor/libredwg/libredwg.js
└─ assets/index-XXXX.css         # 弹窗样式
```

iframe 内加载 wasm：
```ts
const wasmUrl = new URL('../assets/libredwg-XXXX.wasm', import.meta.url).href;
```

### 7.2 vendor 同步脚本

`scripts/sync-vendor.mjs`（新增，`npm run sync:vendor`）：
- 从 `node_modules/@mlightcad/libredwg-bab/dist/` 拷贝 `libredwg.js` 与 `libredwg.wasm` 到 `vendor/libredwg/`。
- CI 校验：确保 `vendor/libredwg/` 不为空，且 `libredwg.wasm` SHA256 与上游一致（防篡改）。

### 7.3 .edaignore 与 .gitignore

`.edaignore` 加入 `vendor/libredwg/` 排除（eext 包从仓库根构建，会顺带把 vendor/ 打进去是预期；排除 vendor/ 不需要）。
`.gitignore` 加入 `vendor/libredwg/*` 之外的开发产物（如 `.cache/`）。

### 7.4 package.json devDependencies 新增

精确锁定（截至当前稳定版）：
- `@mlightcad/libredwg-bab`: `^0.x.y`（待 PR 阶段实测后填）
- `@types/node`: `^20.x`
- 其它保持不变。

---

## 8. 协议与合规

### 8.1 LICENSE 与扩展元数据

- `LICENSE` 文件全文替换为 GPL-2.0-or-later 标准文本（FSF 官方版）。
- `extension.json.license`: `"GPL-2.0-or-later"`
- `package.json.license`: `"GPL-2.0-or-later"`
- `README.md` 顶部加协议说明段落；说明分发包含 libredwg wasm。
- `CHANGELOG.md` v1.0.0 条目里加 "协议变更：从 Apache-2.0 升级到 GPL-2.0-or-later（兼容 libredwg）"。

### 8.2 自检脚本

`scripts/check-license.mjs`（可选，P2）：
- 校验 `vendor/libredwg/` 内文件 SHA256 与上游一致。
- 校验 `package.json.license` / `extension.json.license` 与 `LICENSE` 头注释一致。

---

## 9. 风险与待验证点

### 9.1 libredwg-bab 的 BLOCK 展开能力

**风险**：未实测。
**验证**：写最小测试脚本（`scripts/test-block-expansion.mjs`），读一个含 BLOCK 的样例 DWG，查看 API 输出是否原生含 INSERT。
**降级**：若不原生支持，按 §4.1 的二次遍历实现 `block-expander.ts`。

### 9.2 库 API 形态

**风险**：`@mlightcad/libredwg-bab` 的导出 API 可能在不同小版本变化。
**验证**：在 `src/iframe/dwg/parser.ts` 里封装一层 `parseDwg(buffer): Promise<DwgIR>`，**所有 wasm 调用收敛到这一处**；API 变动只需改此文件。
**降级**：parser.ts 单元测试覆盖度 ≥ 80%。

### 9.3 wasm 在 EDA IFrame 沙箱的加载路径

**风险**：EDA 的 iframe 沙箱可能禁用某些路径加载方式。
**验证**：在 EDA 里跑 `npm run debug`，打开弹窗，console 检查 wasm 加载是否成功。
**降级**：若 `new URL(...).href` 失败，改用 `fetch` 加载 ArrayBuffer 后 `WebAssembly.instantiate`。

### 9.4 EDA PrimitivePolyline 顶点数上限

**风险**：未知是否存在 32 点上限。
**验证**：在 EDA 里用一个 64 点的 polyline 测试。
**降级**：若超限，按 32 点为段拆分（§6.1 TODO）。
**TODO**：编码前先写一个 50 行的 `scripts/test-polyline-limit.mjs` 在 EDA 里实测。

### 9.5 4.1 中 INSERT 实体不进 IR 的 type 安全

`rawEntities` 来自 wasm 输出，可能含 INSERT 但 IR 类型不包含。处理方式：在 `ir.ts` 引入 `DwgInsertEntity` 作为 IR 内部临时类型，**只在 parser.ts → block-expander.ts 之间流转**，对外（iframe → 主进程）的 IR 类型中**不暴露 INSERT**。

### 9.6 libredwg-bab 是否随包体积超 1.2 MB

**验证**：`npm run build` 后查 `dist/assets/libredwg-*.wasm` 大小。
**降级**：wasm gzip；仍超则拆分非关键路径（如颜色提取走 js 实现，wasm 只负责几何）。

---

## 10. 调试 / 联调 / CI

### 10.1 联调流程

1. `npm install`
2. `npm run sync:vendor`（首次需要）
3. `npm run debug`：现有 dev server + WebSocket 推送机制（已就绪）。
4. EDA 端加载 dev 扩展（已有 run-api-gateway）。
5. 打开 PCB / SCH / Footprint 文档，菜单 → 导入 DWG → 选 samples/sample.dwg。
6. iframe 内 console 可看到 `[DwgImporter]` 前缀日志；EDA 主进程 console 不可见，但 `eda.sys_Log` 会在 EDA 底部"日志"面板显示。
7. 主进程错误通过 `eda.sys_Dialog.showInformationMessage` / `eda.sys_Message.showToastMessage` 反馈。

### 10.2 iframe 独立调试

- 直接用 Chrome 打开 `dist/iframe/index.html`，通过 query string 模拟：
  - `?debug=1&documentType=PCB`：iframe 内置 mock 数据，绕过 wasm。
  - `?debug=1&wireshark=...`：抓包协议消息。
- `src/iframe/dev-mock.ts` 仅在 `import.meta.env.DEV` 或 `?debug=1` 启用，**不进入 prod 构建**。

### 10.3 CI 校验（GitHub Actions 草案）

`.github/workflows/ci.yml`：
1. `npm ci`
2. `npm run sync:vendor`
3. `npm run lint`
4. `tsc --noEmit`
5. `npm run build`
6. 检查 `dist/` 大小：gzip 后总和 ≤ 1.2 MB，超出则 fail。
7. 检查 `package.json.license` / `extension.json.license` 与 `LICENSE` 头一致。
8. 协议自检：`scripts/check-license.mjs`。

### 10.4 EDA API 使用审计（v1.1 复核）

以下为逐条对照 `@jlceda/pro-api-types` 与 easyeda-api skill 参考手册后的结论。

**已核实正确：**

| 调用 | 核对结果 |
|---|---|
| `sys_IFrame.openIFrame(html, w, h, id, props)` | ✅ 签名与 `props` 字段一致（无 `x`/`y`，标题取自 HTML `<title>`） |
| `sys_IFrame.closeIFrame(id?)` | ✅ |
| `sys_IFrame.isIFrameAlreadyExist(id)` | ✅ 存在于类型定义（skill 参考手册漏列，但 pro-api-types 有） |
| `sys_Storage.getExtensionUserConfig(k)` | ✅ 同步返回 |
| `sys_Storage.setExtensionUserConfig(k, v)` | ✅ 返回 `Promise<boolean>` |
| `sys_Message.showToastMessage(msg, type?, timer?)` | ✅ |
| `sys_Dialog.showInformationMessage(content, title?, btn?)` | ✅ |
| `dmt_SelectControl.getCurrentDocumentInfo()` | ✅ |
| `EDMT_EditorDocumentType` | ✅ PCB=3 / SCHEMATIC_PAGE=1 / FOOTPRINT=4 |
| `EPCB_LayerId` | ✅ 全部取值核对无误（见 `LAYER` 常量） |
| `PCB_PrimitiveLine.create` | ✅ 8 参数，`net, layer, x1, y1, x2, y2, lineWidth?, locked?` |
| `PCB_PrimitivePolyline.create` | ✅ 需要 `IPCB_Polygon` 对象，非裸点数组 |
| `PCB_PrimitiveArc.create` | ✅ 两端点 + `arcAngle` + `interactiveMode?` |
| `PCB_PrimitiveString.create` | ✅ 13 参数，`layer` 在首位 |
| `PCB_MathPolygon.createPolygon` | ✅ |
| `SCH_PrimitiveWire/Circle/Arc/Text/Polygon.create` | ✅ 全部一致 |

**本次审计发现并修复的错误：**

| 问题 | 原写法 | 修正 |
|---|---|---|
| 文本对齐枚举无 `0` 值 | `STRING_ALIGN_LEFT = 0` | `LEFT_BOTTOM = 3`（枚举从 1 开始；3 与 DWG 文本左下基点一致） |
| 多边形源数组顺序错误 | `['L', x1, y1, x2, y2, ...]` | `[x1, y1, 'L', x2, y2, ...]`——**首坐标点在 `'L'` 之前** |
| 多段线未闭合 | 直接输出原点列 | 闭合时补回首点，保证单多边形首尾重合 |
| `PCB_PrimitiveRegion.create` 参数类型 | 写成 `IPCB_ComplexPolygon` | 实为 `IPCB_Polygon`（本项目未使用 Region，仅修正类型） |
| `OpenIFrameProps` 含不存在的 `x`/`y` | 有 | 移除 |
| `DEFAULT_FONT` | `'Arial'` | `'default'`（与官方示例一致） |

**待运行时确认（无法静态验证）：**

1. `PCB_PrimitiveArc` 的 `arcAngle` 正负号是否与 DWG 逆时针为正一致（DWG 逆时针为正，EDA 负值表示顺时针，代码已按此换算）。
2. 图元目标层合法性：`TPCB_LayersOfLine` 允许 BoardOutline/Document/Mechanical/Silk 等；
   但 `TPCB_LayersOfRegion` **仅允许铜层与 MULTI**。本项目统一用 Polyline 输出，
   未使用 Region，故不受该限制影响。
3. `PCB_PrimitiveString` 的 `fontSize` 与 DWG 文本高度的比例（当前取 0.8，需实测微调）。

---

## 11. ADR 摘要（关键决策记录）

| ID | 决策 | 备选 | 拒绝理由 |
|---|---|---|---|
| ADR-1 | wasm 随 eext 打包，不走 CDN | 动态从 CDN 加载 | 易受网络/CDN 故障影响；首次进入弹窗体验差；离线不可用 |
| ADR-2 | **解析与写图元全部在 iframe 内完成，无跨帧通信** | 主进程与 iframe 分工 + 消息层 | 见 ADR-12：EDA 无跨帧消息 API，且 iframe 可直接用 `eda` |
| ADR-3 | SPLINE 自适应采样，区间 16–128 段 | 固定 64 段 | 自适应在低曲率处更省、在高曲率处更准 |
| ADR-4 | BLOCK 二次遍历作为 fallback（若库不支持原生展开） | 仅依赖库原生展开 | 部分 libredwg 版本不支持；二次遍历保证跨版本稳定 |
| ADR-5 | 仓库协议为 **GPL-3.0-or-later** | 保持 Apache-2.0；或 GPL-2.0 | 实际解析库 `@mlightcad/libredwg-web` 为 **GPL-3.0**，GPL-2.0 与之不兼容 |
| ADR-6 | 弹窗内原生 DOM + CSS，无框架 | 引入 React/Vue | 包体敏感；交互简单无需框架 |
| ADR-7 | 菜单静态注册（`extension.json.headerMenus`），无运行时切换 | `sys_HeaderMenu.insertHeaderMenus` 动态 | EDA 框架已自动按环境显隐；运行时切换引入不必要复杂性 |
| ADR-8 | 菜单项在三种编辑器分别用独立 ID（`dwg-importer.pcb / .schematic / .footprint`） | 三套 ID 一致 | EDA 不允许 ID 跨扩展冲突，独立 ID 更安全 |
| ADR-9 | 不注册快捷键 | 注册 Ctrl+Shift+I 等 | DWG 导入是低频操作；占用通用快捷键得不偿失 |
| ADR-10 | POLYLINE 转 `['L', x, y, ...]` 源数组后经 `pcb_MathPolygon.createPolygon` 构造 | 直接传点数组 | `PrimitivePolyline.create` 要求 `IPCB_Polygon` 对象，不接受裸点数组 |
| ADR-11 | lastDir 仅作 toast 提示，不主动改变 defaultPath | 用 chrome.downloads 等扩展 API | EDA 沙箱不支持；toast 是稳妥降级 |
| ADR-12 | **iframe 内直接调用 `eda`，不引入跨帧消息层** | 自定义 `sendMessageToIframe` / `onIframeMessage` 桥接 | 这两个 API 经核实**不存在**；官方文档明确 iframe 可直接使用 `eda`，无需要 `window.parent`。移除 `transport.ts` / `protocol.ts` / `messagebus.ts` 三个模块 |
| ADR-13 | 启动参数经 `sys_Storage` 传递 | URL query 参数 / postMessage | `openIFrame` 明确不支持 query 参数，且无消息通道 |
| ADR-14 | 包内资源使用完整路径（`/iframe/index.js`） | 相对路径 `./index.js` | 官方文档明确要求完整路径；相对路径会加载失败 |
| ADR-15 | 层 id 全部对照 `pro-api-types` 核实并集中到 `shared/eda-api.ts` | 在各模块内联魔数 | 早期硬编码的层 id 全部错误（如把 `BOARD_OUTLINE` 写成 2，实为 11），集中管理便于核对 |
| ADR-16 | 仓库根 `vendor/` 通过 `.edaignore` 排除出扩展包 | 一并打包 | 运行时有 `dist/vendor/` 一份即可；两份会让 wasm 重复，包体从 2.29 MB 涨到 4.52 MB |

---

## 12. 关键代码骨架（落地起点）

### 12.1 `src/index.ts`

```ts
import extensionConfig from '../extension.json' with { type: 'json' };

export function activate(status?: 'onStartupFinished', arg?: string): void {
  // 静态注册已在 extension.json 中完成；此处可留作未来运行时初始化
}

export function about(): void {
  eda.sys_Dialog.showInformationMessage(
    eda.sys_I18n.text('DWG Importer v', undefined, undefined, extensionConfig.version),
    eda.sys_I18n.text('About'),
  );
}

// 三个 registerFn 全部委托到 src/menu.ts
export { importDwgPcb, importDwgSch, importDwgFootprint } from './menu.ts';
```

### 12.2 `src/menu.ts`

```ts
import { importDwg } from './internal/import-dwg.ts';
import type { ImportDocumentType } from './shared/types.ts';

export function importDwgPcb(): Promise<void> {
  return importDwg('PCB');
}
export function importDwgSch(): Promise<void> {
  return importDwg('SCH');
}
export function importDwgFootprint(): Promise<void> {
  return importDwg('FOOTPRINT');
}

// 仅供单元测试导出，主进程不直接调用
export const __test__ = { importDwg };
```

### 12.3 `src/internal/import-dwg.ts`（菜单入口，已实现）

```ts
import { DOC_TYPE, edaApi } from '../shared/eda-api';
import { KEY_LAUNCH } from '../iframe/storage';

const IFRAME_HTML = '/iframe/index.html';   // 扩展包内完整路径
const IFRAME_ID = 'dwg-importer-window';

export async function importDwg(documentType: ImportDocumentType): Promise<void> {
  const eda = edaApi();
  const iframeApi = eda?.sys_IFrame;
  if (!iframeApi?.openIFrame) {
    eda?.sys_Dialog?.showInformationMessage?.('当前环境不支持内联框架', 'DWG 导入器');
    return;
  }

  // 用真实文档类型覆盖菜单传入值
  const effective = (await detectDocumentType()) ?? documentType;

  // 重复点击时先关旧窗口，避免多开
  if (await iframeApi.isIFrameAlreadyExist?.(IFRAME_ID)) {
    await iframeApi.closeIFrame?.(IFRAME_ID);
  }

  // openIFrame 不支持 query 参数，启动参数经 Storage 传递
  await eda?.sys_Storage?.setExtensionUserConfig?.(KEY_LAUNCH, { documentType: effective });

  const opened = await iframeApi.openIFrame(IFRAME_HTML, 760, 660, IFRAME_ID, {
    title: 'DWG 导入器',
  });
  if (!opened) {
    eda?.sys_Dialog?.showInformationMessage?.(`无法打开弹窗（${IFRAME_HTML}）`, 'DWG 导入器');
  }
}
// 之后无任何 host↔iframe 交互：导入由 iframe 自行完成。
```

### 12.4 `src/iframe/index.ts`（弹窗入口，已实现）

```ts
import { DOC_TYPE, LAYER, edaApi } from '../shared/eda-api';
import { parseDwg } from './dwg/parser';
import { applyPcbImport, applySchImport, applyFootprintImport } from '../write/index';
import { createIframeStorage } from './storage';

// 1) 读启动参数（同步）→ 决定目标层清单；读不到则自行探测
const docType = storage.getLaunchParams()?.documentType
  ?? await detectDocumentType() ?? 'PCB';

// 2) 文件选择 → 解析 → 智能建议
fileSec.onFileSelected(async (file) => {
  sm.transition('parsing');
  const ir = await parseDwg(file, { onProgress: p => fileSec.setStatusParsing(p) });
  layerMap.setLayers(ir.layers, targetLayers);
  layerMap.setMapping(suggest(ir));          // 名字优先，回退颜色
  previewSec.setIr(ir);
  sm.transition('parsed');
});

// 3) 点击导入 → 直接在 iframe 内写图元（无跨帧调用）
importBtn.addEventListener('click', async () => {
  sm.transition('importing');
  const payload = {
    ir: currentIr!,
    mapping: layerMap.getMapping(),
    options: optionsSec.getOptions(),
    documentType: docType,
  };
  const result = docType === 'SCH'
    ? await applySchImport(payload, onProgress)
    : docType === 'FOOTPRINT'
      ? await applyFootprintImport(payload, onProgress)
      : await applyPcbImport(payload, onProgress);

  edaApi()?.sys_Message?.showToastMessage?.(`导入完成：${result.successCount} 个图元`);
  setTimeout(() => void edaApi()?.sys_IFrame?.closeIFrame?.('dwg-importer-window'), 600);
});
```

### 12.5 `src/iframe/state-machine.ts`

```ts
type State = 'idle' | 'parsing' | 'parsed' | 'importing' | 'done' | 'error';
const TRANSITIONS: Record<State, ReadonlyArray<State>> = {
  idle:     ['parsing'],
  parsing:  ['parsed', 'error'],
  parsed:   ['parsing', 'importing'],
  importing:['done', 'error'],
  done:     [],
  error:    ['parsing'],
};

export function createStateMachine(initial: Record<State, unknown>) {
  let cur: State = 'idle';
  return {
    get state() { return cur; },
    transition(next: State) {
      if (!TRANSITIONS[cur].includes(next)) {
        throw new Error(`Invalid transition ${cur} -> ${next}`);
      }
      cur = next;
    },
  };
}
```

---

## 13. 与 PRD 的映射表

| PRD 条目 | TECH 落地位置 |
|---|---|
| §3.2 F1 菜单 | §12.1 / §12.2 + `extension.json` |
| §3.4 F3 解析 | §4 + §12.4 + §5.2 |
| §3.5–§3.7 图层 / 选项 | §4.3 + §12.4 |
| §3.8 预览 | §12.4 preview-section |
| §3.9 批量创建 + 错误 | §6.2 |
| §3.10 缩放 | 由 host 调用 `pcb_Document.zoomToAllPrimitives()`，非 writer 职责 |
| §3.12 F11 失败 | §6.2 result.errors |
| §3.13 F12 记住文件夹 | §3.4 storage |
| §3.14 F13 协议 | §8 |
| §4 IR 数据模型 | §3.1 |
| §6 架构 | §2 + §12 |
| §7 边界 | §9 |
| §8 验收 | §10 + §11 |

---

## 14. 落地 Checklist（编码前自检）

- [ ] `npm install` 后 `node_modules/@mlightcad/libredwg-bab/dist/` 内含 `libredwg.js` + `libredwg.wasm`。
- [ ] 实测 libredwg-bab 的导出 API（§9.1 / §9.2）。
- [ ] 实测 EDA IFrame 沙箱能否加载 wasm（§9.3）。
- [ ] 实测 EDA PrimitivePolyline 顶点数上限（§9.4）。
- [ ] 决定 BLOCK 走原生展开还是二次遍历（§4.1 / §9.1）。
- [ ] 拷贝 LICENSE / 改 `package.json` / `extension.json`（§8）。
- [ ] 写 `scripts/sync-vendor.mjs`（§7）。
- [ ] 改 `config/esbuild.common.ts` 加 iframe entry 与 wasm loader（§7.1）。
- [ ] 改 `locales/extensionJson/{lang}.json` 加 "DWG Importer" / "导入 DWG…" 文案（§3.2 PRD）。
- [ ] 改 `extension.json.headerMenus` 三套注册（§3.2 PRD）。
- [ ] 实现 §12 列出的关键模块骨架。
- [ ] 跑 `npm run debug` 在 EDA 里走通最小链路。

---

## 15. 附录 A — 参考

- 项目仓库：`eext-dwg-importer`（当前）
- pro-api-sdk：https://github.com/easyeda/pro-api-sdk
- pro-api-types：https://www.npmjs.com/package/@jlceda/pro-api-types
- EDA API：https://prodocs.easyeda.com/cn/api/guide/
- IFrame：https://prodocs.easyeda.com/cn/api/guide/inline-frame.html
- PCB Primitive 写法示例：https://github.com/easyeda/extension-dev-skill/blob/main/recipes/pcb_primitives_bindraw.md
- 菜单/快捷键 recipe：https://github.com/easyeda/extension-dev-skill/blob/main/recipes/sys_menu_shortcut.md
- libredwg：https://www.gnu.org/software/libredwg/
- @mlightcad/libredwg-bab：https://www.npmjs.com/package/@mlightcad/libredwg-bab
- libredwg GPLv2 原文：https://www.gnu.org/licenses/old-licenses/gpl-2.0.html

---

**附录 B — 与 PRD 的对齐差异**

| 项 | PRD | TECH 决策 |
|---|---|---|
| SPLINE 采样 | 64 段固定 | 自适应 16–128（§4.2） |
| POLYLINE 拆分 | 顶点 ≤32 → Region / Polyline；>32 拆段 | **按实际顶点数输出**（§6.1）；TODO 实测 EDA 上限（§9.4） |
| lastDir 降级 | toast 提示 | 保留 toast（PRD 方案） |