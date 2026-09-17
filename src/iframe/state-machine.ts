/**
 * 弹窗主状态机。
 *
 * 状态：
 * - idle          初始 / 无文件
 * - parsing       解析中
 * - parsed        已解析
 * - importing     写入中
 * - done          写入完成
 * - error         出错
 */

export type State = 'idle' | 'parsing' | 'parsed' | 'importing' | 'done' | 'error';

const TRANSITIONS: Record<State, ReadonlyArray<State>> = {
	idle: ['parsing'],
	parsing: ['parsed', 'error', 'idle'],
	parsed: ['parsing', 'importing'],
	importing: ['done', 'error'],
	done: ['idle'],
	error: ['parsing', 'idle'],
};

export interface StateMachine {
	readonly state: State;
	transition: (next: State) => void;
	subscribe: (fn: (s: State, prev: State) => void) => () => void;
}

export function createStateMachine(): StateMachine {
	let cur: State = 'idle';
	const subs = new Set<(s: State, prev: State) => void>();

	return {
		get state() {
			return cur;
		},
		transition(next: State) {
			if (cur === next)
				return;
			if (!TRANSITIONS[cur].includes(next)) {
				throw new Error(`Invalid transition: ${cur} → ${next}`);
			}
			const prev = cur;
			cur = next;
			for (const fn of subs) fn(cur, prev);
		},
		subscribe(fn) {
			subs.add(fn);
			return () => subs.delete(fn);
		},
	};
}
