/**
 * iframe 内 MessageBus 封装：window.postMessage / window.addEventListener('message')。
 *
 * 协议与 src/iframe/protocol.ts 对齐：
 * - iframe → host: window.parent.postMessage(..., '*')
 * - host → iframe: window.addEventListener('message', ...) 过滤 source === window.parent
 */

import type { HostToIframe, IframeToHost } from './protocol';
import { isHostToIframe, isIframeToHost } from './protocol';

const TARGET_ORIGIN = '*';

export function sendToHost(msg: IframeToHost): void {
	if (typeof window === 'undefined')
		return;
	window.parent.postMessage(msg, TARGET_ORIGIN);
}

export function onHostMessage(cb: (msg: HostToIframe) => void): () => void {
	if (typeof window === 'undefined')
		return () => {};
	const handler = (ev: MessageEvent): void => {
		if (ev.source !== window.parent)
			return;
		if (isHostToIframe(ev.data)) {
			cb(ev.data);
		}
	};
	window.addEventListener('message', handler);
	return () => window.removeEventListener('message', handler);
}

/**
 * 监听 host → iframe 的 ready 信号；通常 host 不会主动发 ready，
 * 这里只是为了在 dev-mock 时模拟 host 推送 init。
 */
export function onReady(cb: () => void): void {
	onHostMessage((msg) => {
		if (msg.type === 'init')
			cb();
	});
}

/**
 * Dev-time helper：让独立打开的 iframe 也可工作（mock parent）。
 */
export function mockParentTransport(): void {
	if (typeof window === 'undefined')
		return;
	(window as unknown as { __dwg_mock_parent__?: boolean }).__dwg_mock_parent__ = true;
	// 拦截 sendToHost：在 mock 模式下写入 console 即可，便于独立调试。
	const original = sendToHost;
	(globalThis as unknown as { sendToHost: typeof sendToHost }).sendToHost = (msg) => {
		console.warn('[DwgImporter:mock] iframe → host', msg);
		original(msg);
	};
}

/**
 * Type-only re-exports for convenience.
 */
export type { HostToIframe, IframeToHost };

/**
 * 仅用于 ts 类型守卫（与 protocol 同义，避免本文件引用散落）。
 */
export const _guards = { isIframeToHost };
