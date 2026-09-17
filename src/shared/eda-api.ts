/**
 * EDA 全局 API 的类型声明，集中维护。
 *
 * @jlceda/pro-api-types 已声明 `var eda`，故此处不再 declare global，只 export 类型。
 * 所有签名均对照 node_modules/@jlceda/pro-api-types/index.d.ts 核实，
 * 不臆测 API 形状（历史上曾因臆测 showIFrame/sendMessageToIframe 导致运行时失败）。
 *
 * 使用方式：
 *   import { edaApi } from '../shared/eda-api';
 *   await edaApi()?.sys_IFrame?.openIFrame('/iframe/index.html', 720, 640, 'dwg-importer');
 */

import type { DwgPoint } from './types';

/** PCB 多边形源数据（与 EPCB 的 L/ARC/CARC/C/R/CIRCLE 指令数组一致）。 */
export type PcbPolygonSource = Array<'L' | 'ARC' | 'CARC' | 'C' | 'R' | 'CIRCLE' | number>;

/** IPCB_Polygon / IPCB_ComplexPolygon 的最小结构契约。 */
export interface PcbPolygonLike {
	readonly __pcbPolygon: unique symbol;
}

export interface PcbComplexPolygonLike {
	readonly __pcbComplexPolygon: unique symbol;
}

/** 打开内联框架的额外参数（对照 SYS_IFrame.openIFrame 的 props 核实：无 x/y）。 */
export interface OpenIFrameProps {
	maximizeButton?: boolean;
	minimizeButton?: boolean;
	minimizeStyle?: 'collapsed' | 'constricted';
	buttonCallbackFn?: (button: 'close' | 'minimize' | 'maximize') => void | Promise<void>;
	onBeforeCloseCallFn?: () => boolean | undefined | Promise<boolean | undefined>;
	grayscaleMask?: boolean;
	title?: string;
}

/** 完整的 eda 全局对象形状（最小子集，按需扩展）。 */
export interface EdaGlobals {
	/** 当前执行上下文所属扩展的 UUID（实测存在，用于日志排查）。 */
	extensionUuid?: string;
	sys_IFrame?: {
		/** 打开内联框架。htmlFileName 为扩展包内路径（如 '/iframe/index.html'）。 */
		openIFrame?: (
			htmlFileName: string,
			width?: number,
			height?: number,
			id?: string,
			props?: OpenIFrameProps,
		) => Promise<boolean>;
		closeIFrame?: (id?: string) => Promise<boolean>;
		hideIFrame?: (id?: string) => Promise<boolean>;
		showIFrame?: (id?: string) => Promise<boolean>;
		isIFrameAlreadyExist?: (id: string) => Promise<boolean>;
	};
	sys_Dialog?: {
		showInformationMessage?: (content: string, title?: string, buttonTitle?: string) => void;
		showConfirmationMessage?: (
			content: string,
			title?: string,
			mainButtonTitle?: string,
			buttonTitle?: string,
			callbackFn?: (mainButtonClicked: boolean) => void,
		) => void;
	};
	sys_I18n?: {
		text?: (key: string, ...args: unknown[]) => string;
	};
	sys_Storage?: {
		/** 同步读取；不存在返回 undefined。 */
		getExtensionUserConfig?: (key: string) => unknown;
		setExtensionUserConfig?: (key: string, value: unknown) => Promise<boolean>;
		deleteExtensionUserConfig?: (key: string) => Promise<boolean>;
		getExtensionAllUserConfigs?: () => Record<string, unknown>;
		setExtensionAllUserConfigs?: (configs: Record<string, unknown>) => Promise<boolean>;
		clearExtensionAllUserConfigs?: () => Promise<boolean>;
	};
	sys_Environment?: {
		isWeb?: () => boolean;
		isClient?: () => boolean;
		isEasyEDAProEdition?: () => boolean;
		isJLCEDAProEdition?: () => boolean;
	};
	sys_Log?: {
		info?: (...args: unknown[]) => void;
		warn?: (...args: unknown[]) => void;
		error?: (...args: unknown[]) => void;
	};
	sys_Message?: {
		showToastMessage?: (message: string, messageType?: string, timer?: number) => void;
	};
	dmt_SelectControl?: {
		getCurrentDocumentInfo?: () => Promise<{ documentType: number; uuid: string; tabId: string } | undefined>;
	};
	pcb_MathPolygon?: {
		createPolygon?: (polygon: PcbPolygonSource) => PcbPolygonLike | undefined;
		createComplexPolygon?: (
			complexPolygon: PcbPolygonSource | Array<PcbPolygonSource>,
		) => PcbComplexPolygonLike | undefined;
	};
	pcb_PrimitiveLine?: {
		create?: (
			net: string,
			layer: number,
			startX: number,
			startY: number,
			endX: number,
			endY: number,
			lineWidth?: number,
			primitiveLock?: boolean,
		) => Promise<unknown>;
	};
	pcb_PrimitivePolyline?: {
		create?: (
			net: string,
			layer: number,
			polygon: PcbPolygonLike,
			lineWidth?: number,
			primitiveLock?: boolean,
		) => Promise<unknown>;
	};
	pcb_PrimitiveRegion?: {
		create?: (
			layer: number,
			complexPolygon: PcbPolygonLike,
			ruleType?: Array<number>,
			regionName?: string,
			lineWidth?: number,
			primitiveLock?: boolean,
		) => Promise<unknown>;
	};
	pcb_PrimitiveArc?: {
		create?: (
			net: string,
			layer: number,
			startX: number,
			startY: number,
			endX: number,
			endY: number,
			arcAngle: number,
			lineWidth?: number,
			interactiveMode?: number,
			primitiveLock?: boolean,
		) => Promise<unknown>;
	};
	pcb_PrimitiveString?: {
		create?: (
			layer: number,
			x: number,
			y: number,
			text: string,
			fontFamily: string,
			fontSize: number,
			lineWidth: number,
			alignMode: number,
			rotation: number,
			reverse: boolean,
			expansion: number,
			mirror: boolean,
			primitiveLock: boolean,
		) => Promise<unknown>;
	};
	pcb_Document?: {
		save?: (uuid?: string) => Promise<boolean>;
	};
	sch_PrimitiveWire?: {
		create?: (
			line: Array<number> | Array<Array<number>>,
			net?: string,
			color?: string | null,
			lineWidth?: number | null,
			lineType?: number | null,
		) => Promise<unknown>;
	};
	sch_PrimitivePolygon?: {
		create?: (
			line: Array<number>,
			color?: string | null,
			fillColor?: string | null,
			lineWidth?: number | null,
			lineType?: number | null,
		) => Promise<unknown>;
	};
	sch_PrimitiveCircle?: {
		create?: (
			centerX: number,
			centerY: number,
			radius: number,
			color?: string | null,
			fillColor?: string | null,
			lineWidth?: number | null,
			lineType?: number | null,
			fillStyle?: number | null,
		) => Promise<unknown>;
	};
	sch_PrimitiveArc?: {
		create?: (
			startX: number,
			startY: number,
			referenceX: number,
			referenceY: number,
			endX: number,
			endY: number,
			color?: string | null,
			fillColor?: string | null,
			lineWidth?: number | null,
			lineType?: number | null,
		) => Promise<unknown>;
	};
	sch_PrimitiveText?: {
		create?: (
			x: number,
			y: number,
			content: string,
			rotation?: number,
			textColor?: string | null,
			fontName?: string | null,
			fontSize?: number | null,
			bold?: boolean,
			italic?: boolean,
			underLine?: boolean,
			alignMode?: number,
		) => Promise<unknown>;
	};
}

/** 获取 eda 全局对象，类型安全。 */
export function edaApi(): EdaGlobals | undefined {
	return (globalThis as unknown as { eda?: EdaGlobals }).eda;
}

/** EPCB_LayerId 真实取值（对照 pro-api-types 核实；不要臆测）。 */
export const LAYER = {
	TOP: 1,
	BOTTOM: 2,
	TOP_SILKSCREEN: 3,
	BOTTOM_SILKSCREEN: 4,
	TOP_SOLDER_MASK: 5,
	BOTTOM_SOLDER_MASK: 6,
	TOP_PASTE_MASK: 7,
	BOTTOM_PASTE_MASK: 8,
	TOP_ASSEMBLY: 9,
	BOTTOM_ASSEMBLY: 10,
	BOARD_OUTLINE: 11,
	MULTI: 12,
	DOCUMENT: 13,
	MECHANICAL: 14,
	INNER_1: 15,
} as const;

/** EDMT_EditorDocumentType 关键取值。 */
export const DOC_TYPE = {
	SCHEMATIC_PAGE: 1,
	PCB: 3,
	FOOTPRINT: 4,
} as const;

/** EPCB_PrimitiveStringAlignMode：左对齐。 */
export const STRING_ALIGN_LEFT = 0;

export type { DwgPoint };
