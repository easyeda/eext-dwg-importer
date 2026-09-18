/**
 * 弹窗持久化：基于 eda.sys_Storage 的薄封装。
 *
 * 注意：EDA 的 Storage 接口与浏览器 localStorage 不同——
 *   getExtensionUserConfig(key)  → 同步返回
 *   setExtensionUserConfig(k, v) → 返回 Promise<boolean>
 * 因此读取路径不 await，写入路径 await。
 *
 * key 前缀 `dwg-importer.`，避免与其它扩展冲突。
 */

import type { DwgUnit } from '../shared/types';
import { edaApi } from '../shared/eda-api';
import { DEFAULT_OPTIONS } from '../shared/types';

const NS = 'dwg-importer.';
const KEY_LAST_DIR = `${NS}lastDir`;
/*
 * 线宽 key 带版本号（v2）：默认线宽从 4mil 改为 8mil 后（用户反馈线条过细），
 * 老 key 里存着历史默认值 4——若沿用同一 key，该改动对老用户完全不可见。
 * 提高版本 = 一次性作废旧默认值；用户之后手动选定的线宽（写在新 key）照常保留。
 */
const KEY_LINE_WIDTH = `${NS}defaultLineWidthMil2`;
const KEY_UNIT = `${NS}defaultUnit`;
/** host 在打开 iframe 前写入的启动参数（openIFrame 不支持 query 参数）。 */
export const KEY_LAUNCH = `${NS}launch`;

export interface LaunchParams {
	documentType: 'PCB' | 'SCH' | 'FOOTPRINT';
}

export interface IframeStorage {
	getLastDir: () => string | null;
	setLastDir: (path: string) => Promise<void>;
	getDefaultLineWidth: () => number;
	setDefaultLineWidth: (mil: number) => Promise<void>;
	getDefaultUnit: () => 'auto' | DwgUnit;
	setDefaultUnit: (unit: 'auto' | DwgUnit) => Promise<void>;
	getLaunchParams: () => LaunchParams | null;
	setLaunchParams: (p: LaunchParams) => Promise<void>;
}

function readValue(key: string): unknown {
	return edaApi()?.sys_Storage?.getExtensionUserConfig?.(key);
}

function readString(key: string): string | null {
	const v = readValue(key);
	return typeof v === 'string' && v.length > 0 ? v : null;
}

async function writeValue(key: string, value: unknown): Promise<void> {
	const api = edaApi()?.sys_Storage;
	if (!api?.setExtensionUserConfig)
		return;
	await api.setExtensionUserConfig(key, value);
}

export function createIframeStorage(): IframeStorage {
	return {
		getLastDir() {
			return readString(KEY_LAST_DIR);
		},
		async setLastDir(path) {
			await writeValue(KEY_LAST_DIR, path);
		},
		getDefaultLineWidth() {
			const v = readString(KEY_LINE_WIDTH);
			if (!v)
				return DEFAULT_OPTIONS.defaultLineWidthMil;
			const n = Number.parseInt(v, 10);
			return Number.isFinite(n) && n > 0 ? n : DEFAULT_OPTIONS.defaultLineWidthMil;
		},
		async setDefaultLineWidth(mil) {
			await writeValue(KEY_LINE_WIDTH, String(Math.max(1, Math.floor(mil))));
		},
		getDefaultUnit() {
			const v = readString(KEY_UNIT);
			if (v === 'auto' || v === 'mm' || v === 'inch')
				return v;
			return 'auto';
		},
		async setDefaultUnit(unit) {
			await writeValue(KEY_UNIT, unit);
		},
		getLaunchParams() {
			const v = readValue(KEY_LAUNCH);
			if (v && typeof v === 'object' && 'documentType' in v) {
				return v as LaunchParams;
			}
			return null;
		},
		async setLaunchParams(p) {
			await writeValue(KEY_LAUNCH, p);
		},
	};
}
