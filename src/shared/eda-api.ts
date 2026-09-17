/**
 * EDA 全局 API 的类型声明，集中维护。
 * @jlceda/pro-api-types 已声明 `var eda`，故此处不再 declare global，只 export 类型。
 *
 * 使用方式：
 *   import { edaApi } from '../shared/eda-api';
 *   const id = await edaApi()?.sys_IFrame?.showIFrame?.(...);
 */

import type {
	ApplyImportPayload,
	ApplyImportResult,
	DwgEntity,
	DwgPoint,
	ImportDocumentType,
} from './types';

/** 完整的 eda 全局对象形状（最小子集，按需扩展）。 */
export interface EdaGlobals {
	sys_IFrame?: {
		showIFrame?: (opts: Record<string, unknown>) => Promise<string | undefined>;
		sendMessageToIframe?: (iframeId: string, msg: unknown) => Promise<void>;
		onIframeMessage?: (cb: (msg: unknown) => void) => void;
		closeIFrame?: (iframeId: string) => Promise<void>;
	};
	sys_Dialog?: {
		showInformationMessage?: (message: string, title: string) => void;
		showWarningMessage?: (message: string, title: string) => void;
		showConfirmationMessage?: (message: string, title: string) => Promise<boolean>;
	};
	sys_I18n?: {
		text?: (key: string, ...args: unknown[]) => string;
	};
	sys_Storage?: {
		getItem?: (key: string) => Promise<unknown>;
		setItem?: (key: string, value: string) => Promise<void>;
		removeItem?: (key: string) => Promise<void>;
	};
	sys_Environment?: {
		getTheme?: () => Promise<string>;
	};
	sys_Log?: {
		info?: (...args: unknown[]) => void;
		warn?: (...args: unknown[]) => void;
		error?: (...args: unknown[]) => void;
	};
	sys_Message?: {
		showToastMessage?: (message: string, type?: string) => void;
	};
	sys_FileSystem?: {
		openReadFileDialog?: (opts: { accept?: string }) => Promise<File | undefined>;
	};
	pcb_PrimitiveLine?: {
		create?: (
			net: string,
			layer: number,
			x1: number,
			y1: number,
			x2: number,
			y2: number,
			width: number,
			locked: boolean,
		) => Promise<unknown>;
	};
	pcb_PrimitivePolyline?: {
		create?: (
			points: DwgPoint[],
			width: number,
			layer: number,
			locked: boolean,
		) => Promise<unknown>;
	};
	pcb_PrimitiveRegion?: {
		create?: (
			points: DwgPoint[],
			layer: number,
			locked: boolean,
		) => Promise<unknown>;
	};
	pcb_PrimitiveArc?: {
		create?: (
			layer: number,
			cx: number,
			cy: number,
			radius: number,
			startAngle: number,
			endAngle: number,
			width: number,
			net: string,
			locked: boolean,
		) => Promise<unknown>;
	};
	pcb_PrimitiveString?: {
		create?: (
			x: number,
			y: number,
			content: string,
			layer: number,
			height: number,
			rotation: number,
			locked: boolean,
		) => Promise<unknown>;
	};
	sch_PrimitiveWire?: {
		create?: (x1: number, y1: number, x2: number, y2: number) => Promise<unknown>;
	};
	sch_PrimitivePolygon?: {
		create?: (points: DwgPoint[]) => Promise<unknown>;
	};
	sch_PrimitiveArc?: {
		create?: (
			cx: number,
			cy: number,
			radius: number,
			startAngle: number,
			endAngle: number,
		) => Promise<unknown>;
	};
	sch_PrimitiveText?: {
		create?: (
			x: number,
			y: number,
			content: string,
			height: number,
			rotation: number,
		) => Promise<unknown>;
	};
}

/** 获取 eda 全局对象，类型安全。 */
export function edaApi(): EdaGlobals | undefined {
	return (globalThis as unknown as { eda?: EdaGlobals }).eda;
}

/** 协议消息类型 re-export。 */
export type { ApplyImportPayload, ApplyImportResult, DwgEntity, DwgPoint, ImportDocumentType };
