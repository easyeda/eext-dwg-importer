/**
 * 弹窗持久化：基于 eda.sys_Storage 的薄封装。
 *
 * 用途：保存用户上次的打开目录、默认线宽、默认单位。弹窗下次打开时读取。
 * key 前缀 `dwg-importer.`，避免与其它扩展冲突。
 */

import type { DwgUnit } from '../shared/types';
import { edaApi } from '../shared/eda-api';

const NAMESPACE = 'dwg-importer.';
const KEY_LAST_DIR = `${NAMESPACE}lastDir`;
const KEY_LINE_WIDTH = `${NAMESPACE}defaultLineWidthMil`;
const KEY_UNIT = `${NAMESPACE}defaultUnit`;

function getStorage() {
	return edaApi()?.sys_Storage;
}

async function getString(key: string): Promise<string | null> {
	const api = getStorage();
	if (!api?.getItem)
		return null;
	const v = await api.getItem(key);
	return typeof v === 'string' && v.length > 0 ? v : null;
}

async function setString(key: string, value: string): Promise<void> {
	const api = getStorage();
	if (!api?.setItem)
		return;
	await api.setItem(key, value);
}

export interface IframeStorage {
	getLastDir: () => Promise<string | null>;
	setLastDir: (path: string) => Promise<void>;
	getDefaultLineWidth: () => Promise<number>;
	setDefaultLineWidth: (mil: number) => Promise<void>;
	getDefaultUnit: () => Promise<'auto' | DwgUnit>;
	setDefaultUnit: (unit: 'auto' | DwgUnit) => Promise<void>;
}

export function createIframeStorage(): IframeStorage {
	return {
		async getLastDir() {
			return await getString(KEY_LAST_DIR);
		},
		async setLastDir(path: string) {
			await setString(KEY_LAST_DIR, path);
		},
		async getDefaultLineWidth() {
			const v = await getString(KEY_LINE_WIDTH);
			if (!v)
				return 4;
			const n = Number.parseInt(v, 10);
			return Number.isFinite(n) && n > 0 ? n : 4;
		},
		async setDefaultLineWidth(mil: number) {
			await setString(KEY_LINE_WIDTH, String(Math.max(1, Math.floor(mil))));
		},
		async getDefaultUnit() {
			const v = await getString(KEY_UNIT);
			if (v === 'auto' || v === 'mm' || v === 'inch')
				return v;
			return 'auto';
		},
		async setDefaultUnit(unit: 'auto' | DwgUnit) {
			await setString(KEY_UNIT, unit);
		},
	};
}
