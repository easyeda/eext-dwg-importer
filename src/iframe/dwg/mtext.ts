/**
 * MTEXT 清理与分行。
 *
 * 背景（实测 case/example_2018.dwg，handle 179）：
 *   MTEXT 的 `text` 字段里既有硬换行 `\P`，也混着大量格式码
 *   （`\fArial|b0;`、`\H2.5x;`、`\C1;`、`\S1/2;` 之类）。
 *   而 EDA 的文本图元是**单行**的（`pcb_PrimitiveString` 一次只画一行），
 *   此前把整串（含 `\P`）直接交给一个文本图元，画布上就是一行里带着 "\P"，
 *   用户表现为「多行文本没有准确换行显示」。
 *
 * 处理链：
 *   1. 拆成逻辑行：`\P` / `\X` / 真实换行；
 *   2. 逐行清理格式码与转义（`\~`→空格、`\\`→`\`、`\{`→`{`、`%%d`→°…）；
 *   3. 按 rectWidth 做贪心折行——**CAD 里这段折行是 AutoCAD 自己做的**，
 *      解析库返回的是未折行原文，不折就与 CAD 少了几行；
 *   4. 行距 = 5/3 × 字高 × lineSpacing（AutoCAD 单倍行距的标准值 1.667）。
 *
 * 折行宽度是**估算**：真实折行取决于字体度量（图形里的字体我们并不加载），
 * 故按「半角 0.6 字高 / 全角 1.0 字高」近似。宁可略保守（早折一点），
 * 也不要让文字整行溢出参照矩形。
 */

/** 半角字符的宽度 / 字高 估算值（依据：常见 CAD 字体的平均字符步进）。 */
const HALF_WIDTH_RATIO = 0.6;
/** 全角（CJK 等）字符的宽度 / 字高 估算值。 */
const FULL_WIDTH_RATIO = 1.0;

/** MTEXT 单倍行距系数：AutoCAD 的 5/3。 */
const SINGLE_LINE_SPACING = 5 / 3;

/**
 * 判断是否全角字符（东亚宽字符）。
 * 覆盖 CJK 统一表意文字、假名、谚文、全角标点/字母数字。
 */
function isFullWidth(code: number): boolean {
	return (
		(code >= 0x1100 && code <= 0x115F)
		|| (code >= 0x2E80 && code <= 0xA4CF)
		|| (code >= 0xAC00 && code <= 0xD7A3)
		|| (code >= 0xF900 && code <= 0xFAFF)
		|| (code >= 0xFE30 && code <= 0xFE6F)
		|| (code >= 0xFF00 && code <= 0xFF60)
		|| (code >= 0xFFE0 && code <= 0xFFE6)
	);
}

/** 估算一行文本的显示宽度（图纸单位）。 */
export function estimateTextWidth(text: string, height: number): number {
	let w = 0;
	for (const ch of text) {
		const code = ch.codePointAt(0) ?? 0;
		w += height * (isFullWidth(code) ? FULL_WIDTH_RATIO : HALF_WIDTH_RATIO);
	}
	return w;
}

/**
 * 清理一行 MTEXT 内容。
 *
 * 顺序有讲究：
 *   - 先处理 `\S`（堆叠分数，形如 `\S1/2;` 或 `\S1^2;`）——它内部的 `/`、`^`
 *     属于分隔符，必须在通用格式码清理之前把外壳去掉、保留分子分母；
 *   - 再删通用格式码 `\Xxx...;`（字体/颜色/字高/宽度/对齐/倾斜…）；
 *   - 最后处理单字符转义与 `%%` 控制码。
 */
export function cleanMTextLine(line: string): string {
	let s = line;
	// 堆叠分数：\S上/下; → 上/下（保留可读的线性形式）
	s = s.replace(/\\S([^;]*);/g, (_m, body: string) => body.replace(/[\^#]/g, '/'));
	// 通用格式码：反斜杠 + 字母 + 到分号为止
	s = s.replace(/\\[A-Z][^;]*;/gi, '');
	// 单字符转义
	s = s.replace(/\\~/g, ' ');
	s = s.replace(/\\\\/g, '\\');
	s = s.replace(/\\\{/g, '{');
	s = s.replace(/\\\}/g, '}');
	// 花括号只是分组，不显示
	s = s.replace(/[{}]/g, '');
	// %% 控制码（DWG 文本里通用）
	s = s.replace(/%%d/gi, '°');
	s = s.replace(/%%p/gi, '±');
	s = s.replace(/%%c/gi, '⌀');
	s = s.replace(/%%%/g, '%');
	return s.trim();
}

/**
 * 按参照矩形宽度折行（贪心，尽量在空格处断）。
 *
 * @param line 已清理的单行文本
 * @param width 参照矩形宽度（图纸单位）；<= 0 表示不折行
 * @param height 字高
 */
export function wrapTextLine(line: string, width: number, height: number): string[] {
	if (!(width > 0) || !(height > 0) || line.length === 0)
		return [line];
	if (estimateTextWidth(line, height) <= width)
		return [line];

	const out: string[] = [];
	let cur = '';
	let curWidth = 0;
	// 以「词 + 空格」为单位推进；含 CJK 时按字符推进（CJK 无词边界）
	const tokens = line.match(/\s+|\S+/g) ?? [];
	for (const token of tokens) {
		const tokenWidth = estimateTextWidth(token, height);
		if (curWidth + tokenWidth <= width || cur.length === 0) {
			cur += token;
			curWidth += tokenWidth;
			continue;
		}
		out.push(cur.replace(/\s+$/, ''));
		cur = token.replace(/^\s+/, '');
		curWidth = estimateTextWidth(cur, height);
		// 单个 token 本身就超宽（长串无空格 / 长 CJK 串）：按字符硬切
		while (curWidth > width && cur.length > 1) {
			let cut = 0;
			let w = 0;
			for (const ch of cur) {
				const cw = height * (isFullWidth(ch.codePointAt(0) ?? 0) ? FULL_WIDTH_RATIO : HALF_WIDTH_RATIO);
				if (w + cw > width)
					break;
				w += cw;
				cut += ch.length;
			}
			if (cut <= 0)
				break;
			out.push(cur.slice(0, cut));
			cur = cur.slice(cut);
			curWidth = estimateTextWidth(cur, height);
		}
	}
	out.push(cur.replace(/\s+$/, ''));
	return out.filter(l => l.length > 0 || out.length === 1);
}

/**
 * MTEXT → 若干行（已清理 + 已折行）。
 *
 * @param text 原始 MTEXT 内容
 * @param height 字高
 * @param rectWidth 参照矩形宽度（0/undefined 表示不折行）
 */
export function splitMTextLines(text: string, height: number, rectWidth?: number): string[] {
	if (typeof text !== 'string' || text.length === 0)
		return [];
	/*
	 * 只有大写 `\P` / `\X` 是硬换行；小写 `\p...;`（如 `\pxt1;`）是段落属性组。
	 * 原先带 i 标志会把小写一起拆开——实测 MLeader 文字 `xx\P\pxt1;xx` 被拆成
	 * 4 条（多出空行与 `xt1;xx`）；属性组交给 cleanMTextLine 清理。此外库有时给真实换行。
	 */
	const paragraphs = text.split(/\\[PX]|\r\n|\n|\r/);
	const lines: string[] = [];
	for (const p of paragraphs) {
		const cleaned = cleanMTextLine(p);
		if (cleaned.length === 0) {
			// 空段落要在视觉上保留一个空行位，否则行距会错
			lines.push('');
			continue;
		}
		lines.push(...wrapTextLine(cleaned, rectWidth ?? 0, height));
	}
	// 去掉尾部空行（多为文本末尾的 \P 造成）
	while (lines.length > 1 && lines[lines.length - 1] === '')
		lines.pop();
	return lines;
}

/** 行距（图纸单位）：5/3 × 字高 × lineSpacing 系数。 */
export function mtextLinePitch(height: number, lineSpacing?: number): number {
	const factor = typeof lineSpacing === 'number' && lineSpacing > 0 ? lineSpacing : 1;
	return height * SINGLE_LINE_SPACING * factor;
}

/**
 * 首行相对插入点的垂直偏移（图纸单位，Y 向上为正）。
 *
 * MTEXT 的插入点 = 附着点（attachmentPoint：1..3 上、4..6 中、7..9 下）。
 * 文本块整体从插入点向下排，故按附着方式把首行推回去：
 *   上对齐（1..3）：首行就在插入点；
 *   中对齐（4..6）：首行上移半个块高；
 *   下对齐（7..9）：首行上移整个块高（块底与插入点齐平）。
 */
export function mtextFirstLineOffsetY(attachmentPoint: number, lineCount: number, pitch: number): number {
	const blockHeight = Math.max(0, lineCount - 1) * pitch;
	if (attachmentPoint >= 4 && attachmentPoint <= 6)
		return blockHeight / 2;
	if (attachmentPoint >= 7 && attachmentPoint <= 9)
		return blockHeight;
	return 0;
}
