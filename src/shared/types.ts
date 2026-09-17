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

export type DwgUnit = 'mm' | 'inch' | 'unknown';

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

export interface ImportOptions {
	enabledKinds: ReadonlySet<DwgEntityKind>;
	defaultLineWidthMil: number;
	units: DwgUnit | 'auto';
	skipEmptyLayers: boolean;
}

export const DEFAULT_OPTIONS: ImportOptions = {
	enabledKinds: new Set(ALL_ENTITY_KINDS),
	defaultLineWidthMil: 4,
	units: 'auto',
	skipEmptyLayers: true,
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
