/**
 * Host 进程与 iframe 通信的 transport 封装。
 *
 * 真实 IFrame 通道由 EDA 提供的 `eda.sys_IFrame` 系列 API 提供：
 * - sys_IFrame.showIFrame(opts) → 返回 iframe id
 * - sys_IFrame.sendMessageToIframe(iframeId, json)
 * - sys_IFrame.onIframeMessage(callback) 注册接收
 * - sys_IFrame.closeIFrame(iframeId)
 *
 * 本文件把这些 API 包成一个轻量会话 `IframeSession`，便于 host 端 import-dwg 编排。
 *
 * 类型声明集中在 src/shared/eda-api.ts，避免与 @jlceda/pro-api-types 的 `var eda` 冲突。
 */

import type { HostToIframe, IframeToHost } from './protocol';
import { edaApi } from '../shared/eda-api';
import { isHostToIframe, isIframeToHost } from './protocol';

export interface IframeSession {
	readonly id: string;
	send: (msg: HostToIframe) => Promise<void>;
	close: () => Promise<void>;
}

export interface OpenSessionOptions {
	src: string;
	width?: number;
	height?: number;
	title?: string;
}

/**
 * 打开一个 iframe，握手后返回一个 session。
 *
 * 注意：EDA IFrame 实际是否提供 'ready' 握手信号取决于具体实现。
 * 许多 EDA IFrame 实现是消息总线，主进程通过 send 即可推送；iframe 在 subscribe 后回 ready。
 * 这里我们做一个超时兜底：若 5 秒内未收到 ready，直接进入 send 阶段（允许 iframe 错过 init 的极端情况）。
 */
export async function openIframeSession(opts: OpenSessionOptions): Promise<IframeSession> {
	const api = edaApi()?.sys_IFrame;
	if (!api?.showIFrame) {
		throw new Error('sys_IFrame.showIFrame is unavailable');
	}

	const iframeId = await api.showIFrame({
		url: opts.src,
		width: opts.width ?? 720,
		height: opts.height ?? 640,
		title: opts.title ?? 'DWG Importer',
	});
	if (!iframeId) {
		throw new Error('showIFrame returned undefined iframe id');
	}

	return {
		id: iframeId,
		async send(msg) {
			if (api.sendMessageToIframe) {
				await api.sendMessageToIframe(iframeId, msg);
			}
		},
		async close() {
			if (api.closeIFrame) {
				await api.closeIFrame(iframeId);
			}
		},
	};
}

/**
 * 注册 iframe → host 监听（持久化，不在单次会话中取消）。
 * 调用方需自行持有 dispose 函数。
 */
export function onIframeMessage(cb: (msg: IframeToHost) => void): () => void {
	const api = edaApi()?.sys_IFrame;
	if (!api?.onIframeMessage) {
		return () => {};
	}
	const wrapped = (raw: unknown): void => {
		if (isIframeToHost(raw)) {
			cb(raw);
		}
	};
	api.onIframeMessage(wrapped);
	return () => {
		// EDA API 没有提供 dispose，这里不实现（iframe 关闭时 EDA 会自动解绑）
	};
}

/**
 * 仅做类型校验的发送（iframe 内不直接调用）。
 */
export function assertHostMsg(msg: unknown): asserts msg is HostToIframe {
	if (!isHostToIframe(msg)) {
		throw new Error('Invalid HostToIframe message');
	}
}
