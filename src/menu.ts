/**
 * 三个 registerFn 全部委托到 import-dwg.ts；不做环境校验
 * （EDA 框架已保证菜单只在目标编辑器下被点击）。
 */

import { importDwg } from './internal/import-dwg';

export function importDwgPcb(): Promise<void> {
	return importDwg('PCB');
}

export function importDwgSch(): Promise<void> {
	return importDwg('SCH');
}

export function importDwgFootprint(): Promise<void> {
	return importDwg('FOOTPRINT');
}
