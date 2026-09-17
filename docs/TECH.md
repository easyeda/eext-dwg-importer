# 技术文档 — DWG Importer for EasyEDA Pro

> 版本：v1.0 (与 PRD v0.3 对齐)
> 范围：在 PRD 已确认的产品决策之上，给出可实施的技术设计。文档写完后进入编码阶段。
> 受众：项目作者本人 + 未来可能的协作者；按文档能 1:1 落地代码。

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
                                  │ opens iframe via
                                  ▼
                ┌─────────────────────────────────┐
                │      src/iframe/                │
                │  ┌───────────┬────────────────┐ │
                │  │index.html │ src/iframe/    │ │
                │  │           │ index.ts│
                │  │           ├─ ui/*         │ │
                │  │           ├─ dwg/*        │ │
                │  │           ├─ storage.ts   │ │
                │  │           └─ protocol.ts  │ │
                │  └────────────────────────────┘ │
                └────────────────┬────────────────┘
                                 │ postMessage 'apply-import'
                                 ▼
                       ┌──────────────────────┐
                       │     src/write/       │
                       │  pcb-writer.ts       │
                       │  sch-writer.ts       │
                       │  fp-writer.ts        │
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
| `src/iframe/index.html` | 弹窗静态壳；只引用 `index.ts` 编译产物 |
| `src/iframe/index.ts` | 弹窗启动；初始化状态机；建立 MessageBus；分发 UI 事件 |
| `src/iframe/ui/file-section.ts` | 文件选择/拖拽/解析进度/已选文件信息 |
| `src/iframe/ui/layer-mapping.ts` | 图层列表 + 映射下拉 + 智能建议工具栏 |
| `src/iframe/ui/options-section.ts` | 实体类型开关 + 线宽 + 单位 + 跳过空图层 |
| `src/iframe/ui/preview-section.ts` | 实体计数 + 包围盒 + BLOCK 摘要 + warnings |
| `src/iframe/ui/styles.css` | 弹窗样式，CSS 变量驱动的浅/深色主题 |
| `src/iframe/dwg/parser.ts` | wasm 加载与生命周期；调用 libredwg 解析入口；进度上报 |
| `src/iframe/dwg/block-expander.ts` | INSERT → 几何副本（含仿射变换） |
| `src/iframe/dwg/ir.ts` | IR 类型定义；从 libredwg 输出构造 IR |
| `src/iframe/dwg/layer-suggest.ts` | 智能建议：颜色查表 + 名字归一化 |
| `src/iframe/dwg/spline-sampler.ts` | 自适应采样（区间 16–128） |
| `src/iframe/storage.ts` | `sys_Storage` 封装：lastDir / lineWidth / unit |
| `src/iframe/protocol.ts` | MessageBus 双向类型 |
| `src/write/pcb-writer.ts` | IR + mapping + options → PCB Primitive API（PCB / Footprint 共用） |
| `src/write/sch-writer.ts` | IR + mapping + options → SCH Primitive API |
| `src/shared/units.ts` | mm/inch ↔ mil；DWG 单位 → mil |
| `src/shared/types.ts` | 跨进程共享类型（IR 子集、mapping、options） |
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

### 3.3 协议消息（iframe ↔ 主进程）

```ts
// src/iframe/protocol.ts

export type HostToIframe =
  | { type: 'init'; documentType: ImportDocumentType; theme: 'light' | 'dark' }
  | { type: 'apply-result'; result: ApplyImportResult };

export type IframeToHost =
  | { type: 'ready' }
  | { type: 'parse-progress'; percent: number }
  | { type: 'apply-import'; payload: ApplyImportPayload }
  | { type: 'cancel' };

export interface ProtocolMessageMap {
  host: HostToIframe;
  iframe: IframeToHost;
}
```

实现说明：
- 主进程 → iframe：通过 `eda.sys_IFrame.sendMessageToIframe(json)`；iframe 用 `window.addEventListener('message', ...)` 接收，校验 `event.data.type` 命中 `HostToIframe`。
- iframe → 主进程：经 `eda.sys_IFrame.onIframeMessage((data) => ...)` 接收；iframe 内部用 `window.parent.postMessage(json, '*')`。
- 大载荷（`apply-import`）通过**结构化克隆**序列化（postMessage 原生支持），无需手动 `JSON.stringify`；主进程收到后立即冻结（避免污染）。

### 3.4 共享层 API 关键签名

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

```
User              Iframe                Host (src/menu.ts)              EDA
 │                  │                            │                        │
 │ open menu        │                            │                        │
 │                  │                            │ sys_IFrame.showIFrame ─→│
 │                  │ ◄──────────── init ────────│ ───────────────────────│
 │                  │── ready ──────────────────→│                        │
 │ drag/select file │                            │                        │
 │                  │ parse-file (in iframe)     │                        │
 │                  │── parse-progress (×N) ─────→│ (ignored; for log)     │
 │                  │                            │                        │
 │ edit mapping     │                            │                        │
 │ click 导入       │                            │                        │
 │                  │── apply-import ───────────→│                        │
 │                  │                            │ pcb_Primitive*.create →│
 │                  │                            │ (批量，Promise.all)    │
 │                  │ ◄────── apply-result ──────│ ◄─── result ───────────│
 │ toast/close      │                            │                        │
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

---

## 11. ADR 摘要（关键决策记录）

| ID | 决策 | 备选 | 拒绝理由 |
|---|---|---|---|
| ADR-1 | wasm 随 eext 打包，不走 CDN | 动态从 CDN 加载 | 易受网络/CDN 故障影响；首次进入弹窗体验差；离线不可用 |
| ADR-2 | 解析在 iframe 内完成，主进程只写图元 | 解析在主进程 | 主进程包体积膨胀；iframe 沙箱已能加载 wasm |
| ADR-3 | SPLINE 自适应采样，区间 16–128 段 | 固定 64 段 | 自适应在低曲率处更省、在高曲率处更准 |
| ADR-4 | BLOCK 二次遍历作为 fallback（若库不支持原生展开） | 仅依赖库原生展开 | 部分 libredwg 版本不支持；二次遍历保证跨版本稳定 |
| ADR-5 | 仓库协议升级为 GPL-2.0-or-later | 保持 Apache-2.0 | libredwg 是 GPLv2，分发 wasm 时整体需兼容 |
| ADR-6 | 弹窗内原生 DOM + CSS，无框架 | 引入 React/Vue | 包体敏感；交互简单无需框架 |
| ADR-7 | 菜单静态注册（`extension.json.headerMenus`），无运行时切换 | `sys_HeaderMenu.insertHeaderMenus` 动态 | EDA 框架已自动按环境显隐；运行时切换引入不必要复杂性 |
| ADR-8 | 菜单项在三种编辑器分别用独立 ID（`dwg-importer.pcb / .schematic / .footprint`） | 三套 ID 一致 | EDA 不允许 ID 跨扩展冲突，独立 ID 更安全 |
| ADR-9 | 不注册快捷键 | 注册 Ctrl+Shift+I 等 | DWG 导入是低频操作；占用通用快捷键得不偿失 |
| ADR-10 | POLYLINE 按实际顶点数输出 | 固定 32 点上限分拆 | 减少代码复杂度；EDA 实际是否有上限在 §9.4 实测验证 |
| ADR-11 | lastDir 仅作 toast 提示，不主动改变 defaultPath | 用 chrome.downloads 等扩展 API | EDA 沙箱不支持；toast 是稳妥降级 |

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

### 12.3 `src/internal/import-dwg.ts`（核心编排）

```ts
import { showIframe, sendToIframe, onIframeMessage } from '../iframe/transport.ts';
import { applyPcbImport, applySchImport, applyFootprintImport } from '../write/index.ts';
import type { ImportDocumentType, ApplyImportPayload, ApplyImportResult } from '../shared/types.ts';

export async function importDwg(documentType: ImportDocumentType): Promise<void> {
  const theme = await getTheme();
  const iframeId = await eda.sys_IFrame.showIFrame({ /* opts */ });

  const readyPromise = new Promise<void>((resolve) => {
    onIframeMessage((data) => {
      if (data.type === 'ready') resolve();
    });
  });
  await readyPromise;

  sendToIframe(iframeId, { type: 'init', documentType, theme });

  const applyPromise = new Promise<ApplyImportResult>((resolve, reject) => {
    onIframeMessage((data) => {
      if (data.type === 'apply-import') {
        applyImport(data.payload as ApplyImportPayload).then(resolve, reject);
      }
      if (data.type === 'cancel') {
        resolve({ successCount: 0, failedCount: 0, errors: [] });
      }
    });
  });

  const result = await applyPromise;
  sendToIframe(iframeId, { type: 'apply-result', result });
  await eda.sys_IFrame.closeIFrame(iframeId);
}

async function applyImport(payload: ApplyImportPayload): Promise<ApplyImportResult> {
  switch (payload.documentType) {
    case 'PCB':       return applyPcbImport(payload, () => {});
    case 'FOOTPRINT': return applyFootprintImport(payload, () => {});
    case 'SCH':       return applySchImport(payload, () => {});
  }
}
```

### 12.4 `src/iframe/index.ts`（入口骨架）

```ts
import { createStateMachine } from './state-machine.ts';
import { createFileSection } from './ui/file-section.ts';
import { createLayerMapping } from './ui/layer-mapping.ts';
import { createOptionsSection } from './ui/options-section.ts';
import { createPreviewSection } from './ui/preview-section.ts';
import { parseDwg } from './dwg/parser.ts';
import { createStorage } from './storage.ts';
import { sendToHost, onHostMessage, type ProtocolMessage } from './protocol.ts';
import { suggestPcbLayer } from './dwg/layer-suggest.ts';

const root = document.getElementById('app')!;
const fileSec   = createFileSection(root.querySelector('#file-section')!);
const layerMap  = createLayerMapping(root.querySelector('#layer-mapping')!);
const options   = createOptionsSection(root.querySelector('#options-section')!);
const preview   = createPreviewSection(root.querySelector('#preview-section')!);
const importBtn = root.querySelector<HTMLButtonElement>('#import-btn')!;

const sm = createStateMachine({ idle: {}, parsed: {}, importing: {}, done: {}, error: {} });
const storage = createStorage();

// 监听 host 消息
onHostMessage((msg) => {
  if (msg.type === 'init') {
    // 设置主题、documentType，影响 layer-mapping 可选 PCB 层列表
  }
  if (msg.type === 'apply-result') {
    sm.transition('done');
    eda.sys_Message.showToastMessage(`导入完成：${msg.result.successCount} 个图元`);
  }
});

// 通知 host ready
sendToHost({ type: 'ready' });

fileSec.onFileSelected(async (file) => {
  sm.transition('parsing');
  const ir = await parseDwg(file, (p) => sendToHost({ type: 'parse-progress', percent: p }));
  layerMap.setIr(ir, suggestPcbLayer);
  preview.setIr(ir);
  sm.transition('parsed');
});

importBtn.addEventListener('click', () => {
  sm.transition('importing');
  sendToHost({
    type: 'apply-import',
    payload: {
      ir: layerMap.getIr(),
      mapping: layerMap.getMapping(),
      options: options.getOptions(),
      documentType: /* from init msg */,
    },
  });
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