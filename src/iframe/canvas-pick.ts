/**
 * 画布拾取原点坐标。
 *
 * EDA 没有通用的「点击画布取点」API——鼠标事件只有
 * selected / clearSelected（PCB 另有 move），没有 click。
 * 因此用以下等价流程实现「隐藏弹窗 → 提示 → 点击画布 → 回填坐标」：
 *
 * 1. hideIFrame 隐藏弹窗，showFollowMouseTip 显示跟随鼠标的提示；
 * 2. 预先选中一个图元（优先复用文档已有图元；文档为空时在原点创建一个
 *    1mil 的临时图元并选中）。目的：保证「点击空白处」也会触发
 *    clearSelected——否则空白点击不产生任何事件，拾取无法完成；
 * 3. 监听 'all' 鼠标事件：selected（点到图元）或 clearSelected（点到空白）
 *    任一触发即视为用户完成了点击，此刻读取 getCurrentMousePosition()
 *    作为拾取坐标；我们自己程序化选中产生的临时图元命中事件会被忽略；
 *    move 事件直接忽略；
 * 4. 清理：移除监听、删除临时图元、移除提示、showIFrame 恢复弹窗。
 *
 * 返回坐标为当前文档数据层坐标（PCB/封装：mil；原理图：0.01 inch），
 * 由调用方负责换算成选项里统一使用的 mil。
 *
 * 已知限制：EDA 未暴露键盘/右键事件，没有「取消」手势，
 * 以 60s 超时兜底（超时后恢复弹窗并提示）。
 */

import type { EdaGlobals, PrimitiveLike } from '../shared/eda-api';
import type { ImportDocumentType } from '../shared/types';
import { edaApi, LAYER } from '../shared/eda-api';
import { t } from '../shared/i18n';

/** 拾取结果：文档数据层坐标。 */
export interface CanvasPickResult {
	x: number;
	y: number;
}

const LISTENER_ID = 'dwg-importer-pick-origin';
/** 超时兜底：弹窗已隐藏，用户始终不点击时自动恢复，避免弹窗「消失」。 */
const PICK_TIMEOUT_MS = 60_000;

/** pcb/sch 两套事件监听的统一签名（枚举取值收窄为 string，便于联合调用）。 */
type AddMouseEventListenerFn = (
	id: string,
	eventType: string,
	callFn: (eventType: string, props?: Array<{ primitiveId: string }>) => void | Promise<void>,
	onlyOnce?: boolean,
) => void;

type GetMousePositionFn = () => Promise<{ x: number; y: number } | undefined>;

export async function pickOriginOnCanvas(
	docType: ImportDocumentType,
	iframeId: string,
): Promise<CanvasPickResult | null> {
	const eda = edaApi();
	if (!eda)
		return null;

	const isSch = docType === 'SCH';
	const eventNs = isSch ? eda.sch_Event : eda.pcb_Event;
	const selectNs = isSch ? eda.sch_SelectControl : eda.pcb_SelectControl;
	const iframe = eda.sys_IFrame;
	const msg = eda.sys_Message;

	// 能力预检：把用到的方法先取出来（收窄 undefined），缺任一环就放弃拾取
	// （弹窗保持可见，不影响手输坐标）。
	const addListener = eventNs?.addMouseEventListener as AddMouseEventListenerFn | undefined;
	const removeListener = eventNs?.removeEventListener as ((id: string) => boolean) | undefined;
	const getMousePos = selectNs?.getCurrentMousePosition as GetMousePositionFn | undefined;
	const hideIFrame = iframe?.hideIFrame;
	const showIFrame = iframe?.showIFrame;
	if (!addListener || !removeListener || !getMousePos || !hideIFrame || !showIFrame
		|| !msg?.showFollowMouseTip) {
		msg?.showToastMessage?.(t('Canvas pick is unavailable in this environment'));
		return null;
	}

	const hidden = await hideIFrame(iframeId);
	if (hidden === false) {
		msg?.showToastMessage?.(t('Canvas pick is unavailable in this environment'));
		return null;
	}

	try {
		// 跟随鼠标的提示：不传超时 → 持续显示，直到 removeFollowMouseTip。
		await msg.showFollowMouseTip(t('Click on the canvas to pick the origin position'));
	}
	catch {
		// 提示失败不阻断拾取。
	}

	return await new Promise<CanvasPickResult | null>((resolve) => {
		let settled = false;
		let tempId: string | null = null;
		let timer: ReturnType<typeof setTimeout> | undefined;

		const stopTimer = (): void => {
			if (timer !== undefined) {
				clearTimeout(timer);
				timer = undefined;
			}
		};

		const cleanup = async (): Promise<void> => {
			try {
				removeListener(LISTENER_ID);
			}
			catch { /* 清理失败不影响结果 */ }
			if (tempId !== null) {
				try {
					if (isSch)
						await eda.sch_PrimitiveRectangle?.delete?.([tempId]);
					else
						await eda.pcb_PrimitiveLine?.delete?.([tempId]);
				}
				catch { /* 删除失败不影响结果 */ }
				tempId = null;
			}
			try {
				await msg.removeFollowMouseTip?.();
			}
			catch { /* 清理失败不影响结果 */ }
			try {
				await showIFrame(iframeId);
			}
			catch { /* 恢复失败不影响结果 */ }
		};

		const settle = (value: CanvasPickResult | null): void => {
			if (settled)
				return;
			settled = true;
			stopTimer();
			void cleanup().finally(() => resolve(value));
		};

		// 超时兜底：自动取消并恢复弹窗。
		timer = setTimeout(() => {
			settle(null);
			msg.showToastMessage?.(t('Pick timed out. The dialog has been restored.'));
		}, PICK_TIMEOUT_MS);

		// 事件回调：selected / clearSelected = 用户完成了一次点击。
		const onMouse = (eventType: string, props?: Array<{ primitiveId: string }>): void => {
			if (settled)
				return;
			// 高频 move 事件直接忽略。
			if (eventType !== 'selected' && eventType !== 'clearSelected')
				return;
			// 忽略我们自己对临时图元的程序化选中。
			if (eventType === 'selected' && props?.some(p => p?.primitiveId === tempId))
				return;

			void (async () => {
				const pos = await getMousePos();
				if (!pos) {
					settle(null);
					msg.showToastMessage?.(t('Failed to read the canvas position. Please try again.'));
					return;
				}
				settle({ x: pos.x, y: pos.y });
			})();
		};

		void (async () => {
			// 预选中一个图元，保证「点击空白 → clearSelected」路径成立。
			tempId = await ensureSelectedPrimitive(eda, isSch);

			try {
				addListener(LISTENER_ID, 'all', onMouse, false);
			}
			catch (err) {
				eda.sys_Log?.warn?.('[DwgImporter] 拾取监听注册失败:', (err as Error)?.message);
				settle(null);
			}
		})();
	});
}

function getSelectNs(eda: EdaGlobals, isSch: boolean): EdaGlobals['pcb_SelectControl'] {
	return isSch ? eda.sch_SelectControl : eda.pcb_SelectControl;
}

/**
 * 保证画布上有一个「已选中」的图元，返回被选中的图元 ID（用于过滤自身事件）。
 *
 * 优先复用文档已有图元（不改文档）；文档为空时创建临时图元：
 * PCB/封装用 1mil 的 Document 层短线，原理图用 1x1（0.01inch）小矩形。
 * 都失败则返回 null——此时拾取退化为「只能点击图元完成」。
 */
async function ensureSelectedPrimitive(eda: EdaGlobals, isSch: boolean): Promise<string | null> {
	// ① 复用已有图元。
	try {
		const existing = isSch
			? await eda.sch_PrimitiveWire?.getAllPrimitiveId?.()
			: await eda.pcb_PrimitiveLine?.getAllPrimitiveId?.()
				?? await eda.pcb_PrimitivePolyline?.getAllPrimitiveId?.()
				?? await eda.pcb_PrimitiveArc?.getAllPrimitiveId?.();
		const firstId = existing?.[0];
		if (firstId) {
			const ok = await getSelectNs(eda, isSch)?.doSelectPrimitives?.([firstId]);
			if (ok !== false)
				return firstId;
		}
	}
	catch { /* 复用失败则走临时图元 */ }

	// ② 文档为空：创建并选中临时图元（拾取结束由调用方删除）。
	try {
		const temp = isSch
			? await eda.sch_PrimitiveRectangle?.create?.(0, 0, 1, 1)
			: await eda.pcb_PrimitiveLine?.create?.('', LAYER.DOCUMENT, 0, 0, 1, 0, 1, false);
		const id = (temp as PrimitiveLike | undefined)?.getState_PrimitiveId?.() ?? null;
		if (!id)
			return null;
		const ok = await getSelectNs(eda, isSch)?.doSelectPrimitives?.([id]);
		return ok === false ? null : id;
	}
	catch {
		return null;
	}
}
