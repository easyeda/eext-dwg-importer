# DWG Importer for EasyEDA Pro — 产品需求文档 (PRD)

> 版本：v0.2 (评审中，已根据一轮反馈更新)
> 范围：基于当前 `eext-dwg-importer` 项目，将原本的 `About…` 占位扩展替换为一款真正可在 EasyEDA Pro 中使用的 DWG 导入扩展。
> 评审通过后将产出《技术文档》，再行编码。
>
> **本轮决策（已与用户确认）**：
> 1. DWG 解析库：`@mlightcad/libredwg-bab`（API 更友好）。
> 2. wasm 包随 eext 一起打包，不走 CDN。
> 3. 支持 DWG 中 BLOCK 引用展开（v1 含此功能）。
> 4. 弹窗支持"记住上次选中的文件夹"。
> 5. **调整仓库协议**：因 libredwg 是 GPLv2，本扩展若分发 libredwg 衍生 wasm，需要仓库整体协议兼容 GPLv2。具体协议方案见 §3.14。

---

## 1. 背景与目标

### 1.1 现状

- 项目名为 `dwg-importer`（`extension.json`），但 `src/index.ts` 仅暴露一个 `about()`，功能未实现。
- 仓库采用 `pro-api-sdk`（基于 esbuild 的 IIFE 打包），通过 `npm run compile / build / debug` 输出 `.eext` 安装包。
- EasyEDA Pro **原生支持 DXF 导入**，但 **不原生支持 DWG**。用户的 DXF 工作流已被 EDA 覆盖，本扩展的唯一使命是 **DWG**。

### 1.2 目标

为 EasyEDA Pro 用户提供一条 **“打开 PCB / 原理图 / 封装编辑器 → 顶部菜单一键 → 弹窗选 DWG → 选择图层与 PCB 层映射 → 预览并导入”** 的完整链路，把机械 CAD (AutoCAD / BricsCAD / ZWCAD / GstarCAD 等输出的 DWG) 里的板框、外形、丝印、装配参考线等导入到 EDA 中成为可编辑图元。

### 1.3 非目标

- 不支持 DXF（EDA 原生支持，引导用户直接用 EDA 的导入功能）。
- 不重写机械图纸的尺寸标注语义（标注会按实体几何导入到指定层，但不解析标注的尺寸数值含义）。
- 不替代 EDA 原生的“导入变更/网表同步”流程，仅在画布上生成图元。
- 不在本扩展中实现 BOM 解析、3D 模型提取。
- v1 **不嵌套展开**：BLOCK 内的属性定义（ATTDEF / ATTRIB）作为 TEXT 实体一次性导入；不维护属性的双向绑定。XREF（外部引用）按 INSERT 等价处理（v1 仅展开同文件 BLOCK，跨文件 XREF 给警告并跳过）。

---

## 2. 用户与场景

### 2.1 目标用户

| 角色 | 典型诉求 |
|---|---|
| 硬件工程师 | 把机械工程师给的板框 DWG 直接作为 PCB BoardOutline，避免手抄坐标 |
| 兼职画板的设计师 | 把结构示意图导入到 Keepout / 文档层当参考 |
| 封装库维护者 | 把器件机械图导入 Footprint 编辑器的 Mechanical 层 / 文档层 |
| 教学/竞赛用户 | 在原理图页导入结构参考图，辅助讲解 |

### 2.2 典型场景

1. **PCB 场景**：机械工程师发了 `Outline-A.dwg`，硬件工程师在 EDA 的 PCB 编辑器 → 顶部菜单 → `导入 DWG…` → 选文件 → 把 `BOARD_OUTLINE` 图层映射到 `BoardOutline`，把 `DIM_LINE` 映射到 `Mechanical5`，点击导入，弹窗关闭，板框/参考尺寸已落到画布。
2. **Footprint 场景**：器件 3D 机械图为 `Package-A.dwg`，封装维护者把它导入 Footprint 编辑器的 `Mechanical1`，并把标注尺寸导入到 `Document` 层。
3. **原理图场景**：项目需要机械装配示意图，原理图页导入到 `Document` 图层，仅作背景参考。
4. **协作场景**：用户勾选了“不要导入空图层”，避免大量 0 长度图元拖慢画布。

---

## 3. 功能需求

### 3.1 功能总览

| 编号 | 名称 | 优先级 |
|---|---|---|
| F1 | 顶部菜单注册（PCB/SCH/Footprint 三域） | P0 |
| F2 | 现代化弹窗 UI（IFrame + MessageBus） | P0 |
| F3 | 选文件 + 解析 DWG（wasm，含 BLOCK 展开） | P0 |
| F4 | 图层列表展示（含 BLOCK 摘要） | P0 |
| F5 | 图层 ↔ PCB 层映射（手动 + 智能建议） | P0 |
| F6 | 实体类型开关与导入选项 | P0 |
| F7 | 预览（实体计数 + 包围盒 + BLOCK 摘要） | P1 |
| F8 | 批量创建图元 + 错误回滚 | P0 |
| F9 | 缩放到所有图元 | P1 |
| F10 | 多语言（zh-Hans/en） | P1 |
| F11 | 失败提示与取消 | P1 |
| F12 | 记住上次选中的文件夹（`sys_Storage`） | P2 |
| F13 | 仓库协议升级为 GPL-2.0-or-later（兼容 libredwg） | P0 |

### 3.2 F1 — 顶部菜单

**核心规则**：用户未打开 PCB / 原理图 / 封装编辑器时，`导入 DWG…` 菜单**不显示**；只有在 PCB、原理图、封装三种编辑环境内才出现。**这一规则完全由 EDA 框架根据 `extension.json.headerMenus` 的环境分组自动保证，不需要本扩展运行时做切换或额外校验。**

`extension.json` 静态注册三套菜单（每个环境独立 ID，避免 ID 跨环境冲突）：

```jsonc
{
  "headerMenus": {
    "pcb": [
      {
        "id": "dwg-importer.pcb",
        "title": "DWG Importer",
        "menuItems": [
          { "id": "dwg-importer.pcb.import", "title": "导入 DWG…", "registerFn": "importDwgPcb" }
        ]
      }
    ],
    "schematic": [
      {
        "id": "dwg-importer.schematic",
        "title": "DWG Importer",
        "menuItems": [
          { "id": "dwg-importer.schematic.import", "title": "导入 DWG…", "registerFn": "importDwgSch" }
        ]
      }
    ],
    "footprint": [
      {
        "id": "dwg-importer.footprint",
        "title": "DWG Importer",
        "menuItems": [
          { "id": "dwg-importer.footprint.import", "title": "导入 DWG…", "registerFn": "importDwgFootprint" }
        ]
      }
    ]
  }
}
```

补充说明：
- **不要在 `blank` / `home` / `symbol` / `panel` / `pcbView` 等环境中注册**，确保菜单只在三种目标编辑器出现。
- **`sch` 字段已弃用**，必须使用 `schematic`。
- 顶层 `title`（"DWG Importer"）作为一级菜单显示名；菜单项 `title`（"导入 DWG…"）作为二级菜单显示名。两者的多语言均在 `locales/extensionJson/{lang}.json` 中维护：
  ```jsonc
  // locales/extensionJson/zh-Hans.json
  { "DWG Importer": "DWG 导入器", "导入 DWG…": "导入 DWG…" }

  // locales/extensionJson/en.json
  { "DWG Importer": "DWG Importer", "导入 DWG…": "Import DWG…" }
  ```
  入口函数 `importDwgPcb / importDwgSch / importDwgFootprint` 统一在 `src/menu.ts` 内部委托到 `importDwg(documentType)`，**不再在每个函数里重复做环境校验**（EDA 已保证只有目标环境会触发菜单回调）。
- 不需要 `activate('onStartupFinished')` 中调用 `sys_HeaderMenu.insertHeaderMenus(...)` 运行时切换——静态注册即可，运行时切换会引入复杂性且 BETA 接口 `insertSystemHeaderMenuItem` 有 "需重启才能删除" 的副作用。
- **不设置快捷键**：DWG 导入是低频操作，快捷键占用 `Ctrl+I` / `Ctrl+Shift+I` 等常用键得不偿失；如未来用户反馈强需求再单独评估。
- ID 命名约定：所有 ID 加 `dwg-importer.` 前缀，保证跨扩展全局唯一（EDA 不允许 ID 冲突）。

### 3.3 F2 — 现代化弹窗 UI

弹窗承载 **"选文件 → 解析 → 配置 → 预览 → 确认导入"** 全流程。整体设计如下：

- **容器**：`sys_IFrame.showIFrame` 打开 `iframe/index.html`，通过 `sys_IFrame.setIFrameUrl` 加载扩展内的 HTML/CSS/JS。
- **通信**：
  - 主进程 ↔ iframe：`eda.sys_IFrame.sendMessageToIframe` / `eda.sys_IFrame.onIframeMessage`（postMessage 包装）。
  - 双向 payload 协议见 §6.1。
- **样式要求**（美观现代化，但与 EDA 整体风格协调，不喧宾夺主）：
  - 浅色/深色模式自适应（监听 `prefers-color-scheme`，亦可读 `eda.sys_Environment` 主题）。
  - 主色使用 EDA 蓝 `#2C7BE5`；圆角 8 px；卡片化布局；不要使用重阴影。
  - 字体 `-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif`。
  - 滚动条美化（webkit 内置属性即可，不要引入额外包）。
  - 严禁引入 React/Vue/Tailwind 等重框架；用原生 DOM + CSS，保持 eext 包体积可控。
- **弹窗布局**（桌面宽度 720 px，移动端响应式 ≤ 480 px 单列）：
  - 顶栏：标题 `导入 DWG` + 关闭按钮 + 当前文档上下文 chip。
  - 主区（三段式）：
    1. **文件段**：拖拽区 + “选择文件…”按钮 + 已选文件名 + 大小 + 解析状态徽章（待解析 / 解析中 N% / 完成 / 失败原因）。
    2. **图层映射段**（最核心）：
       - 左侧列表：DWG 中所有图层（显示颜色色块、实体计数）。
       - 右侧每行：勾选框（是否导入）+ PCB 层下拉 + 颜色预览 + “建议匹配”按钮。
       - 顶部一行工具栏：全选/全不选 / 一键按颜色匹配 / 一键按名字相似度建议 / 重置。
    3. **选项段**（折叠面板，默认展开）：实体类型开关（多选 LINE/LWPOLYLINE/POLYLINE/CIRCLE/ARC/TEXT/MTEXT/SPLINE）、线宽默认（如 4 mil）、单位（mm/inch，AutoCAD 单位）、跳过空图层、合并相邻共线段（v1 仅占位 UI，不实现）。
    4. **预览段**（可滚动）：解析结果摘要（实体总数、包围盒、图层数）、失败日志列表（折叠）。
  - 底栏：`取消` / `导入 (N 个图元)`，按钮禁用态取决于解析状态与有效映射数。
- **交互细节**：
  - 文件支持拖拽，解析过程显示进度（wasm 内上报）。
  - 解析失败显示具体原因（不是文件 / 损坏 / 不支持版本 / 内存不足）。
  - ESC 关闭弹窗。
  - 第二次打开弹窗时记得上一次的单位/线宽选项（保存在 `eda.sys_Storage`，key 加扩展名命名空间）。

### 3.4 F3 — 选文件 + 解析 DWG

- 入口：`eda.sys_FileSystem.openReadFileDialog({ accept: '.dwg' })`，单选（**支持"记住上次选中的文件夹"，详见 F12**）。
- 文件流转：
  1. 用户在弹窗中选文件后，前端拿到 `File` 对象。
  2. wasm 解析在 iframe 内完成（主进程仅负责最终写图元），避免主进程包膨胀。
  3. **BLOCK 引用展开**：解析阶段把所有 `INSERT` 实体在 IR 层一次性展开为对应 BLOCK 的几何副本，并在展开时应用 INSERT 的变换矩阵（缩放、旋转、镜像）。展开后的实体继承引用方图层（除非 BLOCK 实体本身指定了图层）。BLOCK 内部的 `ATTDEF`/`ATTRIB` 作为普通 TEXT 实体一并展开。
  4. **XREF**：跨文件 XREF 在解析阶段产生一条警告（写入 `parseWarnings`），对应 INSERT 按"未知 BLOCK"处理并跳过。
- 解析库：**`@mlightcad/libredwg-bab`**（已确认，API 友好；底层仍是 libredwg，详见 §3.14 协议说明）。
- **wasm 打包策略**：随 eext 一起打包（不动态从 CDN 加载），通过 esbuild 的 `loader: { '.wasm': 'file' }` + `assetNames` 配置把 wasm 复制到 `dist/`，并在 iframe 内通过相对路径 `import.meta.url` 加载。理由：避免依赖外网、避免首次进入弹窗时等待 CDN、可离线使用。
- 解析进度通过 wasm 调用 `progressCallback` 推到 UI，进度条限速 30 fps（避免频繁 postMessage 阻塞）。

### 3.5 F4 — 图层列表展示

解析完成后，iframe 从 IR 抽取 `layers: Array<{ name, color, entityCount }>`，渲染左侧列表。

- 排序：默认按图层名升序，可切换按实体数降序。
- 色块：从 IR 颜色 (0–255) 转 CSS `rgb(r,g,b)`。
- 0 实体的图层灰色显示，工具栏的“跳过空图层”勾选后自动不勾选。

### 3.6 F5 — 图层 ↔ PCB 层映射

- PCB 层下拉数据来源：
  - PCB 编辑器：通过 `eda.pcb_Layer.getAllLayers()` 或基于 `EPCB_LayerId` 枚举静态构建一份常用层清单（顶层/底层/内层 1-30/Mechanical1-30/Document/Silk/BoardOutline 等）。
  - SCH 编辑器：固定为 `Document` 图层。
  - Footprint 编辑器：固定为 `Mechanical1..30` + `Document`。
- 智能默认建议（**纯前端启发式**，不联网）：
  - **按 DWG 图层颜色匹配 PCB 层的颜色**（EDA 各层有默认颜色，可硬编码查表）：相似度 ≥ 90% 自动绑定。
  - **按名字相似度匹配**：归一化后做包含/前缀匹配。示例：
    - `BOARD_OUTLINE` / `OUTLINE` / `WIREFRAME` → `BoardOutline`
    - `DIM*` / `DIMENSION` → `Mechanical5`
    - `SILK*` / `PLACE*` → `TopSilk`
    - `DOC*` / `NOTE*` / `TEXT` → `Document`
    - 其它层不强制建议，置空待用户选。
  - 建议规则集中维护在 `src/dwg/layer-suggest.ts`（一个纯函数 `suggestPcbLayer(dwgLayerName): EPCB_LayerId | null`）。
- 交互：
  - 用户修改下拉后，左侧对应行高亮显示“已自定义”。
  - 一键重置：把全部映射恢复到智能建议结果。
  - 关闭弹窗不持久化映射（避免误导，下次仍跑建议）；仅单位/线宽这种**全局选项**持久化。

### 3.7 F6 — 实体类型开关与导入选项

- 实体类型开关：默认全选（除 SPLINE 之外）；SPLINE v1 仅做"导入为多段折线"近似（控制点等距采样，段数 64）。
- 线宽默认 4 mil，UI 提供 1 / 2 / 4 / 6 / 8 / 10 / 20 mil 常用预设 + 自定义。
- 单位：
  - 通过 IR 携带的 `INSUNITS` 自动选择（DWG header），UI 显示当前判定结果。
  - 用户可手动覆盖 `mm` 或 `inch`，仅影响坐标缩放。
- 跳过空图层：默认开。
- 合并相邻共线段：v1 仅占位 UI（disabled 状态 + tooltip "即将推出"），不实现。

### 3.8 F7 — 预览

- 显示：解析得到的图层数、实体数、包围盒（minX/maxX/minY/maxY，按当前单位制）。
- 实体计数按类型分项显示（line / polyline / circle / arc / text / spline）。
- 不画真实几何缩略图（成本过高），包围盒数值足够给用户判断。

### 3.9 F8 — 批量创建图元 + 错误回滚

- 主进程接收 IR + 映射 + 选项后，遍历实体逐个调用 `eda.pcb_Primitive*`：
  - LINE → `pcb_PrimitiveLine.create(net, layer, x1, y1, x2, y2, width, locked)`
  - LWPOLYLINE / POLYLINE（顶点 ≤ 32）→ `pcb_PrimitiveRegion.create(...)`（填充区域/轮廓，取决于闭合与图层）。
  - POLYLINE（顶点 > 32 或开放）→ `pcb_PrimitivePolyline.create(points, width, layer)`
  - CIRCLE → `pcb_PrimitivePolyline`（用 32 段折线近似）或在 PCB 上转成两个 `pcb_PrimitiveArc` 拼接（v1 选前者）。
  - ARC → `pcb_PrimitiveArc.create(layer, cx, cy, r, startAngle, endAngle, width)`
  - TEXT / MTEXT → `pcb_PrimitiveString.create(x, y, content, layer, height, rotation)`（EDA 文本高度约 = DWG 文本高度的 0.8 倍，需要做单位转换）。
  - SPLINE → 64 段折线近似。
- **性能**：单次导入 > 500 个图元时使用 `eda.sys_LoadingAndProgressBar.start(...)` 显示进度；批量请求用 `Promise.all` 切片（每批 50，避免栈/内存爆）。
- **错误回滚**：创建过程中任何一个失败，立即停止后续创建，**保留已创建的图元**（EDA 没有事务接口，无法回滚），UI 弹窗提示失败原因与已成功数量，由用户决定是否撤销（撤销通过 `pcb_SelectControl` + `pcb_Primitive*.delete`，但 v1 不做，仅提示）。
- **不在 SCH / Footprint 中创建 PCB 图元**：SCH/Footprint 走 SCH 对应 `sch_Primitive*` 或 footprint 编辑器下同样可用的 PCB 图元接口（EDA 中 Footprint 编辑器复用 PCB 图元 API）。

### 3.10 F9 — 保存 + 缩放

- 导入完成 → `eda.dmt_SelectControl.clearSelection()` → `eda.pcb_Document.zoomToAllPrimitives()`（PCB/Footprint）/ SCH 同理。
- 默认 **不自动保存**，由用户决定（避免误覆盖）。

### 3.11 F10 — 多语言

- `locales/zh-Hans.json` 与 `locales/en.json` 维护所有弹窗文案。
- 复用 `eda.sys_I18n.text(key, ...)`。
- 菜单标题复用 `locales/extensionJson/{lang}.json`。

### 3.12 F11 — 失败提示与取消

- 任何环节出错统一通过 `eda.sys_Dialog.showInformationMessage` / `sys_Message.showToastMessage` 反馈，不抛未处理异常。
- 解析 wasm 时如果 wasm 加载失败，弹窗显示"无法加载 DWG 解析引擎，请重试或联系作者"。
- 用户主动取消：弹窗关闭，iframe 销毁，已经创建的图元不撤销。
- BLOCK 解析失败（如某个 BLOCK 内部数据损坏）：仅跳过该 BLOCK，对应 INSERT 不展开，其它图元继续导入，并在 `parseWarnings` 中记录"BLOCK X 解析失败，已跳过"。

### 3.13 F12 — 记住上次选中的文件夹

- 用途：用户在弹窗里多次选 DWG 时，默认目录 = 上次成功打开的目录，提升体验。
- 实现：
  - key：`dwg-importer.lastDir`（带扩展名命名空间）。
  - 写入时机：用户点击"选择文件…"成功选中后，把 `file.webkitRelativePath` 的目录部分（或从 File path 提取）写入。
  - 读取时机：弹窗初始化阶段读取，若有值则把 `<input type="file">` 的 `webkitdirectory` 默认目录用 `chrome.downloads.setDirectory` 提示；常规方案是依赖 EDA 的 `openReadFileDialog` 行为，**约定通过配置传入 `defaultPath` 参数**（若 EDA 的 `sys_FileSystem.openReadFileDialog` 不支持该参数，则仅在 `lastDir` 非空时用 toast 提示用户"上次打开目录：xxx"，由用户手动导航）。
- 不上传任何文件名 / 路径信息到网络，仅本地存储。

### 3.14 F13 — 仓库协议升级为 GPL-2.0-or-later

- 现状：`extension.json` 声明 `"license": "Apache-2.0"`，与 libredwg (GPL-2.0) **不兼容**。
- 本仓库**非 libredwg 上游代码**（我们仅在产物里分发 wasm），但 wasm 是 libredwg 衍生作品，按 GPL 的观点分发时整个软件包须兼容 GPL。
- 决策：
  1. 仓库根 `LICENSE` 改为 **GPL-2.0-or-later**（仓库内源码 + 打包产物整体以此协议发布）。
  3. `extension.json` 的 `license` 字段同步改为 `"GPL-2.0-or-later"`。
  4. `README.md` 与 `package.json` 的 `license` 字段同步更新。
  5. `CHANGELOG.md` 增加"协议变更"条目。
  6. 在弹窗的"关于"项（替代原 `about()`）里说明：本扩展使用 libredwg wasm，按 GPLv2 分发。
- 注意：JLCEDA 扩展商店上架时是否会拒绝 GPL 协议——本点不在 PRD 解决范围，提交前需与上游运营确认。

---

## 4. 数据模型 (IR)

`DwgIR` 由 iframe 端解析 wasm 之后产出，结构（TypeScript 描述）：

```ts
export type DwgEntityKind = 'LINE' | 'LWPOLYLINE' | 'POLYLINE' | 'CIRCLE' | 'ARC' | 'TEXT' | 'MTEXT' | 'SPLINE';

export interface DwgPoint { x: number; y: number; }

export interface DwgEntityBase {
  id: string;            // 解析器生成的稳定 ID（uuid 即可）
  kind: DwgEntityKind;
  layer: string;         // DWG 图层名
  color?: number;        // ACI 0..255，可选
  lineWidth?: number;    // 1/100 mm
  // BLOCK 展开溯源（可空）。展开后保留原 INSERT 与 BLOCK 名，
  // 便于将来在调试/报告里给用户反馈"哪些图元来自哪个块"。
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

export type DwgEntity = DwgLineEntity | DwgCircleEntity | DwgArcEntity | DwgPolylineEntity | DwgTextEntity;

export interface DwgLayer { name: string; color: number; entityCount: number; }
export interface DwgBoundingBox { minX: number; minY: number; maxX: number; maxY: number; }

export interface DwgBlockSummary {
  name: string;
  entityCount: number;   // 展开前 BLOCK 内部实体数
}

export interface DwgIR {
  source: 'DWG';
  units: 'mm' | 'inch' | 'unknown';
  layers: DwgLayer[];
  blocks: DwgBlockSummary[];       // 同文件 BLOCK 清单（用于预览）
  entities: DwgEntity[];           // **BLOCK 已展开**：不包含 INSERT 本身，全部是展开后的几何实体
  bbox: DwgBoundingBox;
  parseWarnings: string[];         // 非致命警告（含跨文件 XREF 跳过、未识别实体等）
}
```

> **BLOCK 展开策略（与解析器约定）**：
> - `parser.ts` 调用 wasm 时传入 `expandBlocks: true`，要求库在输出阶段把所有 INSERT 实体的几何展开为 `DwgEntity` 副本，并把原 INSERT 的 `blockName / insertId` 透传到每个副本的 `fromBlock`。
> - 若库不直接支持 `expandBlocks`，则在 `parser.ts` 内做二次遍历：维护 `blockDefs: Map<string, DwgEntity[]>`，先收集所有 BLOCK 内部实体，再对每个 INSERT 应用变换矩阵（scale / rotation / mirror）后展开副本。
> - 展开时使用二维仿射变换：`p' = T + R(theta) * M(mirror) * S(scale) * p`。变换后写入 `fromBlock`，便于溯源。

---

## 5. UI/UX 详细说明

### 5.1 弹窗整体线框

```
┌──────────────────────────────────────────────────────────────┐
│  导入 DWG                                  [PCB • Untitled] × │
├──────────────────────────────────────────────────────────────┤
│  [拖拽 DWG 文件到此处  /  选择文件…]   layout.dwg · 1.2 MB     │
│  状态：已解析 · 1284 个图元 · 7 个图层                        │
├────────────────────────┬─────────────────────────────────────┤
│  DWG 图层             │  PCB 层                              │
│  ▣ BOARD_OUTLINE   5  │  [✓]  BoardOutline                  │
│  ▣ DIM            18   │  [✓]  Mechanical5                   │
│  ▣ SILK_TOP      42   │  [✓]  TopSilkLayer                  │
│  ▣ SILK_BOT      42   │  [✓]  BottomSilkLayer               │
│  ▣ PLACE        320   │  [ ]  — 不导入 —                    │
│  ▣ TEXT          12   │  [✓]  Document                      │
│  ▣ OTHER        845   │  [ ]  — 不导入 —                    │
│                        │                                      │
│  [全选] [重置] [按颜色匹配] [按名字建议]                     │
├──────────────────────────────────────────────────────────────┤
│  选项 ▾                                                      │
│   实体： ☑ LINE ☑ LWPOLYLINE ☑ POLYLINE ☑ CIRCLE ☑ ARC      │
│         ☑ TEXT  ☑ MTEXT  ☑ SPLINE                            │
│   线宽：[ 4 mil ▾ ]   单位：( AutoCAD: mm ▾ )                │
│   ☑ 跳过空图层     ☐ 合并共线段（即将推出）                  │
├──────────────────────────────────────────────────────────────┤
│  预览                                                         │
│   包围盒：X 0–120 mm，Y 0–80 mm                               │
│   实体：line 720 / polyline 320 / circle 88 / arc 64 /        │
│         text 12 / spline 80                                   │
│   警告：1 项（展开 ▾）                                        │
├──────────────────────────────────────────────────────────────┤
│                                          [ 取消 ]  [ 导入 ]  │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 状态机

弹窗有 5 个主状态：`idle → file-selected → parsing → parsed → importing → done | error`。

| 状态 | 允许操作 |
|---|---|
| `idle` | 选择文件 / 拖拽 |
| `file-selected` | 解析（自动）/ 取消 / 重选 |
| `parsing` | 仅取消（解析按钮禁用） |
| `parsed` | 编辑映射、修改选项、开始导入、重新解析 |
| `importing` | 仅关闭（不可编辑配置） |
| `done` | 关闭（弹窗自动关闭，回到 EDA 主视图） |
| `error` | 重试 / 取消 |

### 5.3 视觉令牌（CSS 变量）

```
--bg-primary:    #FFFFFF / #1F2330  (dark)
--bg-secondary:  #F4F6FA / #2A2F3D
--border:        #E1E5EE / #3A4150
--text-primary:  #1A1F2C / #E6EAF3
--text-secondary:#5A6478 / #9BA3B4
--accent:        #2C7BE5
--accent-hover:  #1F66CC
--success:       #2BB673
--warn:          #F5A623
--error:         #E94B4B
--radius:        8px
--shadow:        0 1px 3px rgba(0,0,0,0.06) / 0 1px 3px rgba(0,0,0,0.4)
```

---

## 6. 架构与通信

### 6.1 进程模型

```
┌───────────────────────────────────────┐
│          EasyEDA Pro 主进程           │
│                                       │
│  src/index.ts                         │
│   ├─ importDwgPcb() / importDwgSch()  │
│   │  / importDwgFootprint()           │
│   │   └─ 委托给 importDwg(documentType)│
│   │       ├─ sys_IFrame.showIFrame(...)│
│   │       ├─ 等待 iframe ready        │
│   │       ├─ 透传 sys_IFrame.sendMessage│
│   │       └─ 接收到 'apply-import' 时 │
│   │           按 documentType 调用   │
│   │           pcb/sch/fp_Primitive*.create│
│   └─ about()                          │
│                                       │
└───────────────────────────────────────┘
                ▲ ▲
                │ │  MessageBus (postMessage)
                ▼ ▼
┌───────────────────────────────────────┐
│  iframe (扩展内 .html + .css + .ts)   │
│                                       │
│  弹窗 UI 原生 DOM                      │
│   ├─ 文件选择 / 拖拽                  │
│   ├─ 解析 wasm（@mlightcad/libredwg-bab）│
│   │   └─ BLOCK 展开                   │
│   ├─ 渲染图层列表 + 映射表单          │
│   ├─ 应用智能建议                     │
│   └─ 发送 'apply-import' payload      │
└───────────────────────────────────────┘
```

> **wasm 打包位置**：`vendor/libredwg/*.wasm` 与 `vendor/libredwg/*.js` 复制到 eext 内部。iframe 内通过相对路径 `new URL('../vendor/libredwg/libredwg.wasm', import.meta.url).href` 加载，**不走 CDN**。

### 6.2 协议（MessageBus Payload）

| 方向 | type | 必填字段 | 说明 |
|---|---|---|---|
| H→I | `init` | `documentType`, `theme`, `pcbLayers` | 主进程通知 iframe 当前环境 |
| I→H | `ready` | — | iframe 准备好后回执 |
| H→I | `parse-progress` | `percent` | wasm 进度（主进程收到 iframe 上报后透传给 UI？v1 不需要，主进程不参与解析） |
| I→H | `parse-file` | `fileName`, `buffer`（ArrayBuffer） | 用户在 iframe 内直接选文件并解析，无需回主进程 |
| I→H | `apply-import` | `ir`, `mapping`, `options`, `documentType` | 用户点击"导入"，主进程据此创建图元 |
| H→I | `apply-result` | `successCount`, `failedCount`, `errors` | 主进程写图元完毕回报 |
| I→H | `cancel` | — | 用户关闭弹窗 |

> **决策**：为了减少序列化体积，**文件解析全部在 iframe 内完成**；`parse-file` 不再走主进程，仅 `apply-import` 是 H→I→H 链路关键 payload。IR 在 iframe 内组装完整后随 `apply-import` 发送给主进程，IR 中实体数 1k~100k，序列化采用结构化克隆（postMessage 默认），主进程收到后只读不修改。

### 6.3 代码结构（PRD 阶段，最终以技术文档为准）

```
src/
├─ index.ts                 # 入口：activate / importDwgPcb / importDwgSch / importDwgFootprint / about
├─ menu.ts                  # 三个 registerFn 全部委托到 importDwg(documentType)，不做环境校验
├─ iframe/
│  ├─ index.html
│  ├─ index.ts              # iframe 入口（init / state machine / messagebus 派发）
│  ├─ ui/                   # UI 组件（纯函数式渲染）
│  │  ├─ file-section.ts
│  │  ├─ layer-mapping.ts
│  │  ├─ options-section.ts
│  │  ├─ preview-section.ts
│  │  └─ styles.css
│  ├─ dwg/
│  │  ├─ parser.ts          # wasm 加载 + 调 libredwg 入口
│  │  ├─ block-expander.ts  # INSERT 展开为几何副本（若库不原生支持）
│  │  ├─ ir.ts              # IR 类型 + 从 wasm 输出构造 IR
│  │  └─ layer-suggest.ts   # 智能建议（颜色 + 名字）
│  ├─ storage.ts            # lastDir 等持久化（sys_Storage 封装）
│  └─ protocol.ts           # MessageBus 类型
├─ write/
│  ├─ pcb-writer.ts         # IR + mapping → PCB_Primitive*
│  ├─ sch-writer.ts         # IR + mapping → SCH_Primitive*
│  └─ fp-writer.ts          # IR + mapping → Footprint_Primitive*
└─ shared/
   ├─ units.ts              # mm/inch ↔ mil
   ├─ types.ts              # 共享类型
   └─ i18n.ts               # 文案 key

vendor/
└─ libredwg/                # wasm + js（从 node_modules/@mlightcad/libredwg-bab/dist 复制）
   ├─ libredwg.js
   └─ libredwg.wasm

locales/
├─ zh-Hans.json             # 弹窗 + i18n 文案
├─ en.json
├─ extensionJson/zh-Hans.json  # 菜单标题
└─ extensionJson/en.json

docs/
├─ PRD.md                   # 本文档
└─ TECH.md                  # 技术文档（评审通过后写）
```

### 6.4 选型基线（PRD 阶段确认）

- **DWG 解析库**：`@mlightcad/libredwg-bab`（API 友好；底层 libredwg wasm）。
- **wasm 打包**：随 eext 一起打包到 `vendor/libredwg/`，通过 esbuild `loader: { '.wasm': 'file' }` 复制。
- **构建**：`esbuild` 现有配置 + 把 iframe 产物作为额外 entryPoints；CSS 作为 `loader: 'css'` 内联或通过 `assetNames` 复制。
- **状态管理**：单页面单状态机，无须外部库。
- **协议**：仓库整体升级为 GPL-2.0-or-later。

---

## 7. 边界与异常

| 场景 | 处理 |
|---|---|
| 用户未打开 PCB / 原理图 / 封装编辑器 | EDA 框架**自动不显示**菜单（由 `extension.json.headerMenus` 的环境分组静态保证），无需扩展侧处理 |
| 当前文档为游离文档 / Home / Symbol / Panel | 同上，菜单不会出现 |
| 文件不是 DWG | 文件选择对话框限制 `accept: '.dwg'`，拖拽时校验 magic header `AC1015` 等 |
| DWG 文件损坏 | 解析器抛错 → 弹窗内显示错误文案 |
| DWG 版本过新 libredwg 不支持 | 弹窗显示 "DWG 版本 X 不受支持（支持的最高版本：Y）" |
| wasm 加载失败 | 弹窗显示 "无法加载 DWG 解析引擎"，给"重试"按钮 |
| 实体数 > 100,000 | 弹窗显示 "实体过多（>100k），请在源文件中精简或拆分为多个图层分批导入"，并禁用"导入" |
| 用户取消 | 关闭弹窗，已创建的图元不撤销 |
| 没有选中任何映射（即所有层都选"不导入"） | "导入"按钮 disabled |
| PCB 板框已有内容 | 仍允许导入，但提示 "导入的板框将作为额外轮廓，不会替换现有板框" |
| 字体缺失（TEXT/MTEXT） | 使用 EDA 默认字体，文字宽度用 height 等比例，提示 "字体可能与原 DWG 不同" |

---

## 8. 验收标准 (Acceptance Criteria)

### 8.1 功能验收

1. ✅ 仅在 PCB / 原理图 / 封装三种编辑器中，顶部菜单出现 `DWG Importer → 导入 DWG…`；其它环境（Home / Blank / Project / Symbol / Panel / PCB 预览等）**菜单不出现**。
2. ✅ 点击菜单弹出符合 §5 设计要求的现代化弹窗。
3. ✅ 弹窗可以选 / 拖拽 `.dwg` 文件，文件大小 ≤ 50 MB 解析成功。
4. ✅ 解析完成后弹出"图层映射"段，自动填充智能建议。
5. ✅ 用户修改映射后点击"导入"，画布出现对应图元。
6. ✅ 缩放到所有图元能框住所有导入对象。
7. ✅ 重新打开弹窗，**单位/线宽**保持上次的值；**上次目录**通过 toast 提示；映射每次重新计算。
8. ✅ 切换文档类型（PCB ↔ Footprint ↔ 原理图），弹窗的 PCB 层下拉自动变化。
9. ✅ 含 BLOCK 的 DWG：解析后 IR 中已展开所有 INSERT，几何副本与原图视觉一致；预览段显示 BLOCK 摘要列表。
10. ✅ 跨文件 XREF：产生 warning，不导入对应 INSERT，其它图元继续导入。

### 8.2 体验验收

1. ✅ 弹窗浅色 / 深色主题与 EDA 主题保持一致。
2. ✅ 弹窗在 1024×768 视口下不溢出，主区可滚动。
3. ✅ 解析期间 UI 不卡顿，进度条平滑推进。
4. ✅ 任何错误以 EDA 原生 toast / dialog 反馈，不抛未处理异常。
5. ✅ 移动端 480px 以下布局可用（虽然 EDA 主要是 PC，但仍属现代化 UI 的应有要求）。
6. ✅ BLOCK 展开发生在解析阶段，用户**无感知延迟**（不需要等点击"展开"）。

### 8.3 代码质量验收

1. ✅ 全 TS，无 `any`，开启 `strict` 全套（已开）。
2. ✅ `tsc --noEmit` 0 错误。
3. ✅ `npm run lint` 0 错误。
4. ✅ `npm run build` 生成 `<name>_v<version>.eext`，包大小（wasm + JS + CSS）≤ 1.2 MB gzip。
5. ✅ 无死代码、无冗余抽象。每个模块职责单一。
6. ✅ `iframe/index.html` 不依赖 CDN，所有静态资源（含 wasm）走相对路径打进包。
7. ✅ 仓库协议升级到 GPL-2.0-or-later；`LICENSE` / `extension.json.license` / `package.json.license` / `README.md` 同步更新。
8. ✅ 自检脚本 `scripts/check-license.mjs`（可选）确认 vendor/libredwg 不被错误地二次修改。

### 8.4 测试 / 调试

1. ✅ 通过 `npm run debug` 可以在本地 EDA 中联调。
2. ✅ 自测样本：随仓库附带 `samples/sample.dwg`（含 BLOCK 的样本 + 不含 BLOCK 的样本，授权情况在 README 说明；优先使用 MIT/CC0 样本）。
3. ✅ README 中包含"如何联调"、"协议说明"、"已知问题"段落。

---

## 9. 风险与开放问题

| 风险 | 影响 | 应对 |
|---|---|---|
| libredwg-bab（底层 libredwg）对最新 DWG 版本（≥ R2018+）支持不完整 | 真实工程文件可能打不开 | 解析失败时给出版本号提示；技术文档阶段实测主流 AutoCAD 版本 R14-R2018；超新版本列入 v2 roadmap |
| wasm 包体积影响 eext 安装包 | 用户下载慢 | 已确认随包打包；gzip 后目标 ≤ 600 KB；超出则技术文档阶段评估 wasm 分包 / 懒加载 |
| DWG 中 BLOCK/INSERT 大量使用 | IR 体积爆炸（每个引用展开） | 已确认 v1 支持展开；超大引用数量（>1000 个同 INSERT）在解析时打 warning 并继续，UI 提示用户 |
| EDA IFrame 沙箱不能加载 wasm | 解析无法运行 | 在技术文档中验证；备选：解析放主进程（`src/index.ts` 引入 wasm），但会增加主进程包体积 |
| 不同文档域（PCB/SCH/FP）的 Primitive API 差异 | 写图元分支多 | 在 writer 层做适配，写一个统一抽象 |
| 智能建议匹配错误率高 | 用户频繁手动改 | 文档 / 弹窗说明 "建议仅供参考"，默认选中但不锁死 |
| GPLv2 协议影响 JLCEDA 扩展商店上架 | 上架被拒 | 上架前先与 JLCEDA 运营/法务沟通，必要时保留源码开放下载，由用户自行安装 |

---

## 10. 待用户确认问题（v0.2 已清空）

> 之前列出的 5 个待确认问题已在本轮全部确认并写入 PRD：
> 1. ✅ 解析库 = `@mlightcad/libredwg-bab`
> 2. ✅ wasm 随 eext 打包
> 3. ✅ 支持 BLOCK 展开
> 4. ✅ 记住上次文件夹
> 5. ✅ 协议改为 GPL-2.0-or-later

---

## 11. 文档与后续

- 本 PRD 通过后，进入《技术文档》(docs/TECH.md) 阶段：
  - 模块详细设计、接口签名、错误码定义、状态机时序、依赖锁定、调试步骤、CI 步骤。
- 技术文档通过后才进入编码。
- 编码完成后更新：
  - `README.md`：功能介绍、使用说明、调试指引、已知问题。
  - `CHANGELOG.md`：v1.0.0 初始版本条目。
  - `images/`：补 1–2 张弹窗截图（可选）。

---

**附录 A：参考链接**

- 项目仓库：https://github.com/easyeda/eext-dwg-importer
- pro-api-sdk：https://github.com/easyeda/pro-api-sdk
- pro-api-types：https://www.npmjs.com/package/@jlceda/pro-api-types
- EDA Pro 用户指南：https://prodocs.easyeda.com/cn/api/guide/
- EDA Pro 内联框架（IFrame）：https://prodocs.easyeda.com/cn/api/guide/inline-frame.html
- PCB Primitive API（参考实现）：https://github.com/easyeda/extension-dev-skill/blob/main/recipes/pcb_primitives_bindraw.md
- libredwg：https://www.gnu.org/software/libredwg/
- @mlightcad/libredwg-bab（候选 npm 包）：https://www.npmjs.com/package/@mlightcad/libredwg-bab
- libredwg GPLv2 协议原文：https://www.gnu.org/licenses/old-licenses/gpl-2.0.html