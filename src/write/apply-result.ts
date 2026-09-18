/**
 * 写入结果辅助：统一「create 返回值检查」与错误收集。
 *
 * ⚠️ pro-api-types 中所有图元 create() 都返回 `Promise<IPCB_* | ISCH_* | undefined>`，
 * **undefined 表示 EDA 拒绝了这次创建**（层不合法、参数越界、环境缺失等）。
 * 必须检查返回值并计入 failedCount，否则失败会被静默吞掉——
 * 表现为「导入完成」但画布上什么都没有（本扩展曾因未检查返回值而出现此故障）。
 */

import type { ApplyImportResult, DwgEntity } from '../shared/types';

/** result.errors 最多保留的条数；超出后只计数不记录，避免大文件（10 万实体）时数组爆炸。 */
const ERRORS_CAP = 50;

/**
 * 按 create() 的返回值统计成败。
 *
 * created 非空 → successCount + 1；为空（undefined/null）→ failedCount + 1。
 * 可传 reason 覆盖默认失败原因（如「多边形数据不合法」）。
 */
export function countCreated(
	result: ApplyImportResult,
	e: DwgEntity,
	created: unknown,
	reason?: string,
): void {
	if (created !== undefined && created !== null) {
		result.successCount += 1;
		return;
	}
	result.failedCount += 1;
	pushError(result, e, reason ?? 'EDA 未创建图元（create 返回 undefined，层或参数被拒绝）');
}

/** 记录一条失败详情；带实体类型与图层便于定位。超过上限后丢弃详情但保留计数。 */
export function pushError(result: ApplyImportResult, e: DwgEntity, reason: string): void {
	if (result.errors.length >= ERRORS_CAP)
		return;
	result.errors.push({
		entityId: e.id,
		message: `${e.kind} @ 图层「${e.layer}」：${reason}`,
	});
}
