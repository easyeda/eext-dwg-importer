/**
 * 跨进程共享类型。
 * IR 实体类型与 PRD §4 / TECH §3.1 严格对齐。
 */

export type DwgEntityKind
	= | 'LINE'
		| 'LWPOLYLINE'
		| 'POLYLINE'
		| 'CIRCLE'
		| 'ARC'
		| 'TEXT'
		| 'MTEXT'
		| 'SPLINE';

export const ALL_ENTITY_KINDS: ReadonlyArray<DwgEntityKind> = [
	'LINE',
	'LWPOLYLINE',
	'POLYLINE',
	'CIRCLE',
	'ARC',
	'TEXT',
	'MTEXT',
	'SPLINE',
];

/**
 * DWG 图纸单位（来自 INSUNITS 检测或用户手选）。
 * 'unknown' = 无单位/未声明，按 mm 解释（见 units.ts dwgToMil）。
 */
export type DwgUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft' | 'mil' | 'unknown';

export interface DwgPoint {
	x: number;
	y: number;
}

export interface DwgEntityBase {
	/** 稳定 ID，uuid v4。 */
	id: string;
	kind: DwgEntityKind;
	/** DWG 图层名。 */
	layer: string;
	/** ACI 颜色索引，0..255。 */
	color?: number;
	/** 自定义线宽，1/100 mm。 */
	lineWidth?: number;
	/** BLOCK 展开溯源。 */
	fromBlock?: {
		blockName: string;
		insertId: string;
	};
}

export interface DwgLineEntity extends DwgEntityBase {
	kind: 'LINE';
	start: DwgPoint;
	end: DwgPoint;
	/**
	 * 无限长构造线（DWG 的 XLINE / RAY）标记。
	 *
	 * 这类实体只有「基点 + 单位方向」，没有端点，而 EDA 没有无限长图元。
	 * 解析时先按 ±1e6 图纸单位生成假端点，使其能正常走 BLOCK 仿射变换，
	 * 待全部实体就位后按图纸范围裁剪（parser.ts 的 clipInfiniteLines）。
	 * 裁剪后该字段被清除，**不会出现在最终 IR 里**。
	 */
	infinite?: boolean;
}

export interface DwgCircleEntity extends DwgEntityBase {
	kind: 'CIRCLE';
	center: DwgPoint;
	radius: number;
}

export interface DwgArcEntity extends DwgEntityBase {
	kind: 'ARC';
	center: DwgPoint;
	radius: number;
	/** 弧度。 */
	startAngle: number;
	/** 弧度。 */
	endAngle: number;
}

export interface DwgPolylineEntity extends DwgEntityBase {
	kind: 'LWPOLYLINE' | 'POLYLINE' | 'SPLINE';
	points: DwgPoint[];
	closed: boolean;
}

export interface DwgTextEntity extends DwgEntityBase {
	kind: 'TEXT' | 'MTEXT';
	position: DwgPoint;
	content: string;
	height: number;
	/** 弧度。 */
	rotation: number;
	/**
	 * 以下三个字段只用于 MTEXT 折行，**展开后由 parser 的 MTEXT 分行处理消费**，
	 * 最终 IR 里的文本实体不再带它们（EDA 文本图元是单行的，一行一个实体）。
	 * 保留在类型上是因为「展开成多行」必须发生在 BLOCK 变换之后（位置才是最终坐标），
	 * 而变换发生在 RawDwgEntity → DwgEntity 之后，故需要随实体携带到那一步。
	 */
	/** MTEXT 参照矩形宽度（图纸单位）；折行用，0/undefined 表示不折行。 */
	rectWidth?: number;
	/** MTEXT 附着点（1..9：1..3 上、4..6 中、7..9 下）。 */
	attachmentPoint?: number;
	/** MTEXT 行距系数（1 = 单倍）。 */
	lineSpacing?: number;
}

export type DwgEntity
	= | DwgLineEntity
		| DwgCircleEntity
		| DwgArcEntity
		| DwgPolylineEntity
		| DwgTextEntity;

export interface DwgLayer {
	name: string;
	/** ACI 颜色索引，0..255。 */
	color: number;
	entityCount: number;
}

export interface DwgBlockSummary {
	name: string;
	entityCount: number;
}

export interface DwgBoundingBox {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

/**
 * 跨进程传输的 IR。BLOCK 已展开，entities 中不含 INSERT。
 */
export interface DwgIR {
	source: 'DWG';
	units: DwgUnit;
	layers: DwgLayer[];
	blocks: DwgBlockSummary[];
	entities: DwgEntity[];
	bbox: DwgBoundingBox;
	parseWarnings: string[];
}

/**
 * import-dwg 编排用文档类型。
 * EDA documentType: PCB=3, SCH=1, FOOTPRINT=4。
 */
export type ImportDocumentType = 'PCB' | 'SCH' | 'FOOTPRINT';

export const DOCUMENT_TYPE_MAP: Record<ImportDocumentType, number> = {
	PCB: 3,
	SCH: 1,
	FOOTPRINT: 4,
};

/**
 * DWG 图层名 → EDA PCB 层 ID。null = 不导入。
 */
export type LayerMapping = Record<string, number | null>;

/**
 * 原点偏移（画布数据层坐标，PCB/封装为 mil；选项里统一以 mil 存放，SCH 写入时换算）。
 * 语义：DWG 的 (0,0) 被放置到画布的该坐标上；默认 0,0 = 两原点重合。
 */
export interface OriginOffset {
	x: number;
	y: number;
}

export interface ImportOptions {
	enabledKinds: ReadonlySet<DwgEntityKind>;
	defaultLineWidthMil: number;
	units: DwgUnit | 'auto';
	skipEmptyLayers: boolean;
	/** 原点偏移（mil）。 */
	originOffsetMil: OriginOffset;
}

export const DEFAULT_OPTIONS: ImportOptions = {
	enabledKinds: new Set(ALL_ENTITY_KINDS),
	/*
	 * 默认线宽 8 mil（用户反馈：4 mil 在画布上过细，DWG 线条看不清）。
	 * 这是所有默认值的唯一来源——storage 的兜底与选项面板初值都引用它。
	 */
	defaultLineWidthMil: 8,
	units: 'auto',
	skipEmptyLayers: true,
	originOffsetMil: { x: 0, y: 0 },
};

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

/**
 * parser → block-expander 之间的临时 INSERT 类型；不出现在对外 IR 中。
 */
export interface DwgInsertEntity {
	id: string;
	kind: 'INSERT';
	layer: string;
	blockName: string;
	tx: number;
	ty: number;
	sx: number;
	sy: number;
	rotation: number;
	mirror: boolean;
}

export interface Rgb {
	r: number;
	g: number;
	b: number;
}

export interface PcbLayerInfo {
	id: number;
	name: string;
	color?: Rgb;
}
