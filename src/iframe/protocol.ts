/**
 * iframe ↔ host 双向协议消息类型。
 *
 * - host → iframe: `init` (环境) / `apply-result` (写入结果)
 * - iframe → host: `ready` / `parse-progress` / `apply-import` / `cancel`
 */

import type { ApplyImportPayload, ApplyImportResult, ImportDocumentType } from '../shared/types';

export type HostToIframe
	= | { type: 'init'; documentType: ImportDocumentType; theme: 'light' | 'dark' }
		| { type: 'apply-result'; result: ApplyImportResult };

export type IframeToHost
	= | { type: 'ready' }
		| { type: 'parse-progress'; percent: number }
		| { type: 'apply-import'; payload: ApplyImportPayload }
		| { type: 'cancel' };

export type ProtocolMessage = HostToIframe | IframeToHost;

export function isHostToIframe(m: unknown): m is HostToIframe {
	if (typeof m !== 'object' || m === null)
		return false;
	const t = (m as { type?: unknown }).type;
	return t === 'init' || t === 'apply-result';
}

export function isIframeToHost(m: unknown): m is IframeToHost {
	if (typeof m !== 'object' || m === null)
		return false;
	const t = (m as { type?: unknown }).type;
	return t === 'ready' || t === 'parse-progress' || t === 'apply-import' || t === 'cancel';
}
