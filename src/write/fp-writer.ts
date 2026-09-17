/**
 * Footprint 写入器：Footprint 编辑器复用 pcb_Primitive* API，
 * 本文件只是文档类型上的薄包装。
 */

import type { ApplyImportPayload, ApplyImportResult } from '../shared/types';
import { applyPcbImport } from './pcb-writer';

export async function applyFootprintImport(
	payload: ApplyImportPayload,
	onProgress: (done: number, total: number) => void,
): Promise<ApplyImportResult> {
	return await applyPcbImport(payload, onProgress);
}
