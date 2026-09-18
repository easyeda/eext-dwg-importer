/**
 * 画布拾取原点坐标。
 *
 * EDA 没有通用的「点击画布取点」API——鼠标事件只有
 * selected / clearSelected（PCB 另有 move），没有 click。
 * 因此用以下等价流程实现「隐藏弹窗 → 提示 → 点击画布 → 回填坐标」：
 *
 * 1. hideIFrame 隐藏弹窗，showFollowMouseTip 显示跟随鼠标的提示
 *   （该 API 缺失时降级为 toast 提示，不阻断拾取）；
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
 * 可观测性：全流程写 sys_Log（能力缺失会点名缺哪个 API），
 * 实机排查「点击拾取没反应」时先看日志面板。
 *
 * 已知限制：EDA 未暴露键盘/右键事件，没有「取消」手势，
 * 以 60s 超时兜底——超时定时器在隐藏弹窗**之前**启动，
 * 覆盖 hide/tip/注册 的全过程，任何一步卡住弹窗都能恢复。
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
	const log = (message: string, ...args: unknown[]): void => {
		eda?.sys_Log?.info?.(`[DwgImporter][拾取] ${message}`, ...args);
	};

	if (!eda) {
		// 连 eda 都没有：静默返回（日志都无处可写）。
		return null;
	}

	log('开始画布拾取', `docType=${docType}`);

	const isSch = docType === 'SCH';
	const eventNs = isSch ? eda.sch_Event : eda.pcb_Event;
	const selectNs = isSch ? eda.sch_SelectControl : eda.pcb_SelectControl;
	const iframe = eda.sys_IFrame;
	const msg = eda.sys_Message;

	// 能力预检：把用到的方法取出来（收窄 undefined），缺失时点名记录。
	const addListener = eventNs?.addMouseEventListener as AddMouseEventListenerFn | undefined;
	const removeListener = eventNs?.removeEventListener as ((id: string) => boolean) | undefined;
	const getMousePos = selectNs?.getCurrentMousePosition as GetMousePositionFn | undefined;
	const hideIFrame = iframe?.hideIFrame;
	const showIFrame = iframe?.showIFrame;
	const missing: string[] = [];
	if (!addListener)
		missing.push(`${isSch ? 'sch' : 'pcb'}_Event.addMouseEventListener`);
	if (!getMousePos)
		missing.push(`${isSch ? 'sch' : 'pcb'}_SelectControl.getCurrentMousePosition`);
	if (!hideIFrame)
		missing.push('sys_IFrame.hideIFrame');
	if (!showIFrame)
		missing.push('sys_IFrame.showIFrame');
	if (missing.length > 0) {
		// 缺关键能力：拾取无法进行。明确告知（日志点名 + toast）。
		eda.sys_Log?.warn?.('[DwgImporter][拾取] 环境缺少必需 API:', missing.join(', '));
		msg?.showToastMessage?.(t('Canvas pick is unavailable in this environment'));
		return null;
	}
	/*
	 * 显式收窄：上面的 missing 数组检查 TS 无法推导为非空保证，
	 * 而后续全部在闭包里使用这些 const，必须在进入闭包前收窄完成。
	 */
	if (!addListener || !getMousePos || !hideIFrame || !showIFrame)
		return null;
	// showFollowMouseTip 是可选体验：缺失时降级为 toast，不作为预检失败条件。
	const hasFollowTip = typeof msg?.showFollowMouseTip === 'function';
	log('能力检查通过', hasFollowTip ? '含跟随提示' : '无跟随提示（降级 toast）');

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
				removeListener?.(LISTENER_ID);
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
				await msg?.removeFollowMouseTip?.();
			}
			catch { /* 清理失败不影响结果 */ }
			try {
				await showIFrame(iframeId);
				log('弹窗已恢复');
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

		// 超时兜底必须在隐藏弹窗之前启动：hide/tip/注册任一步卡住都能恢复。
		timer = setTimeout(() => {
			log('超时未完成拾取，自动取消');
			settle(null);
			msg?.showToastMessage?.(t('Pick timed out. The dialog has been restored.'));
		}, PICK_TIMEOUT_MS);

		// 事件回调：selected / clearSelected = 用户完成了一次点击。
		const onMouse = (eventType: string, props?: Array<{ primitiveId: string }>): void => {
			if (settled)
				return;
			// 高频 move 事件直接忽略。
			if (eventType !== 'selected' && eventType !== 'clearSelected')
				return;
			// 忽略我们自己对临时图元的程序化选中。
			if (eventType === 'selected' && props?.some(p => p?.primitiveId === tempId)) {
				log(`忽略程序化选中事件（tempId=${tempId}）`);
				return;
			}

			log('收到点击事件', eventType);
			void (async () => {
				const pos = await getMousePos();
				if (!pos) {
					settle(null);
					msg?.showToastMessage?.(t('Failed to read the canvas position. Please try again.'));
					return;
				}
				log('拾取到坐标', pos.x, pos.y);
				settle({ x: pos.x, y: pos.y });
			})();
		};

		void (async () => {
			const hidden = await hideIFrame(iframeId);
			if (hidden === false) {
				log('hideIFrame 返回 false，放弃拾取');
				settle(null);
				msg?.showToastMessage?.(t('Canvas pick is unavailable in this environment'));
				return;
			}
			log('弹窗已隐藏，等待画布点击');

			const tip = t('Click on the canvas to pick the origin position');
			if (hasFollowTip) {
				try {
					await msg?.showFollowMouseTip?.(tip);
				}
				catch {
					// 跟随提示失败：降级 toast，不阻断拾取。
					msg?.showToastMessage?.(tip);
				}
			}
			else {
				msg?.showToastMessage?.(tip);
			}

			// 预选中一个图元，保证「点击空白 → clearSelected」路径成立。
			tempId = await ensureSelectedPrimitive(eda, isSch);
			log('预选中图元', tempId ?? '(无，拾取退化为仅可点击图元)');

			try {
				// 防重复注册：同 id 的旧监听先移除（首次为 no-op）。
				removeListener?.(LISTENER_ID);
				addListener(LISTENER_ID, 'all', onMouse, false);
			}
			catch (err) {
				eda.sys_Log?.error?.('[DwgImporter][拾取] 监听注册失败:', (err as Error)?.message);
				settle(null);
				msg?.showToastMessage?.(t('Canvas pick is unavailable in this environment'));
			}
		})().catch((err: Error) => {
			// 流程中任何未预期异常：恢复弹窗，绝不静默。
			eda.sys_Log?.error?.('[DwgImporter][拾取] 流程异常:', err?.message);
			settle(null);
			msg?.showToastMessage?.(t('Canvas pick is unavailable in this environment'));
		});
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
