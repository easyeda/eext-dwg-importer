/**
 * host 端核心编排：打开 iframe、握手、初始化、收 apply-import、写图元、回执、关闭。
 */

import type {
	ApplyImportPayload,
	ApplyImportResult,
	ImportDocumentType,
} from '../shared/types';
import { onIframeMessage, openIframeSession } from '../iframe/transport';
import { edaApi } from '../shared/eda-api';
import { applyFootprintImport, applyPcbImport, applySchImport } from '../write/index';

const IFRAME_SRC = './iframe/index.html';
const READY_TIMEOUT_MS = 5000;

/**
 * 入口：被 src/menu.ts 的三个 registerFn 调用。
 *
 * 注意：EDA 框架已保证菜单只在目标编辑器环境下被点击；本函数不再做环境校验。
 */
export async function importDwg(documentType: ImportDocumentType): Promise<void> {
	const session = await openIframeSession({
		src: IFRAME_SRC,
		width: 720,
		height: 640,
		title: 'DWG Importer',
	});

	const theme = await detectTheme();

	try {
		await waitForReady(READY_TIMEOUT_MS);
		await session.send({ type: 'init', documentType, theme });
		const result = await waitForApply();
		await session.send({ type: 'apply-result', result });
		// 关闭 iframe：让弹窗收到结果后再短暂展示
		setTimeout(() => {
			void session.close();
		}, 100);
	}
	catch (err) {
		edaApi()?.sys_Log?.error?.('[DwgImporter]', (err as Error).message);
		await session.close();
	}
}

/**
 * 等待 iframe 的 ready 信号。
 *
 * 超时兜底：部分 EDA IFrame 实现不发 ready，此时也放行，避免卡死。
 */
function waitForReady(timeoutMs: number): Promise<void> {
	return new Promise((resolve) => {
		let timer: ReturnType<typeof setTimeout> | undefined;
		const dispose = onIframeMessage((msg) => {
			if (msg.type === 'ready') {
				if (timer !== undefined)
					clearTimeout(timer);
				dispose();
				resolve();
			}
		});
		timer = setTimeout(() => {
			dispose();
			resolve();
		}, timeoutMs);
	});
}

/** 等待用户点击“导入”后发来的 apply-import；或 cancel。 */
function waitForApply(): Promise<ApplyImportResult> {
	return new Promise<ApplyImportResult>((resolve, reject) => {
		const dispose = onIframeMessage((msg) => {
			if (msg.type === 'apply-import') {
				dispose();
				applyImport(msg.payload as ApplyImportPayload)
					.then(resolve)
					.catch(reject);
			}
			else if (msg.type === 'cancel') {
				dispose();
				resolve({ successCount: 0, failedCount: 0, errors: [] });
			}
		});
	});
}

async function applyImport(payload: ApplyImportPayload): Promise<ApplyImportResult> {
	const onProgress = (done: number, total: number): void => {
		edaApi()?.sys_Log?.info?.(`[DwgImporter] importing ${done}/${total}`);
	};
	switch (payload.documentType) {
		case 'PCB':
			return await applyPcbImport(payload, onProgress);
		case 'FOOTPRINT':
			return await applyFootprintImport(payload, onProgress);
		case 'SCH':
			return await applySchImport(payload, onProgress);
	}
}

async function detectTheme(): Promise<'light' | 'dark'> {
	const t = await edaApi()?.sys_Environment?.getTheme?.();
	if (t === 'dark')
		return 'dark';
	return 'light';
}
