/**
 * iframe 构建脚本：
 * 1. esbuild 打包 src/iframe/index → dist/iframe/index.js
 * 2. 拷贝 src/iframe/index.html → dist/iframe/index.html
 * 3. 拷贝 vendor/libredwg-web/* → dist/vendor/libredwg-web/（若存在）
 *
 * 注意：vendor 保持 dist/ 与 wasm/ 两层结构，因为上游以
 * `new URL("libredwg-web.wasm", import.meta.url)` 相对定位 wasm。
 */

import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import fs from 'fs-extra';

import iframeConfig from '../config/esbuild.iframe.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const DIST_IFRAME = path.join(ROOT, 'dist', 'iframe');
const VENDOR_LIBREDWG = path.join(ROOT, 'vendor', 'libredwg-web');
const DIST_VENDOR = path.join(ROOT, 'dist', 'vendor', 'libredwg-web');

async function main(): Promise<void> {
	fs.ensureDirSync(DIST_IFRAME);

	// 1. esbuild build
	await esbuild.build(iframeConfig);
	console.log('[iframe] esbuild OK');

	// 2. 拷贝 index.html
	const htmlSrc = path.join(ROOT, 'src', 'iframe', 'index.html');
	const htmlDst = path.join(DIST_IFRAME, 'index.html');
	await fs.copyFile(htmlSrc, htmlDst);
	console.log('[iframe] html copied');

	// 2b. 一致性校验：HTML 里的绝对路径必须指向产物真实位置。
	// 这一层校验是为了拦住「路径写错 → openIFrame 静默返回 false → 菜单点了没反应」这类问题，
	// 该问题在浏览器里没有任何报错，极难定位。
	await assertHtmlPaths(htmlSrc);

	// 2c. 一致性校验：TS 里引用的 data-role 必须都在 HTML 中定义。
	// 对应「HTML 漏写 data-role，TS 用非空断言 '!' 取值，运行时 null 崩溃」这类问题：
	// 编译期断言不报错，运行时整个初始化中断，表现为弹窗只有静态骨架、按钮无文字。
	await assertDataRoles(htmlSrc);

	// 3. 拷贝 vendor/libredwg-web（若存在）
	if (await fs.pathExists(VENDOR_LIBREDWG)) {
		await fs.ensureDir(DIST_VENDOR);
		await fs.copy(VENDOR_LIBREDWG, DIST_VENDOR, { overwrite: true });
		console.log('[iframe] vendor copied → dist/vendor/libredwg-web/');
	}
	else {
		console.warn('[iframe] vendor/libredwg-web not found — run `npm run sync:vendor` for real DWG parsing');
	}

	// 3b. 一致性校验：解析引擎资源必须在 HTML 中登记，且指向真实存在的文件。
	// 对应「JS 内部 import() 拿不到扩展包内资源」的问题：弹窗是 blob URL，
	// import.meta.url 无法用于相对解析，必须由 HTML 登记后取回 blob URL。
	// 放在 vendor 拷贝之后，以便同时校验文件确实就位。
	await assertVendorLinks(htmlSrc);
}

/**
 * 校验 HTML 中所有以 / 开头的绝对路径，在 dist/ 下确实存在。
 * 同时校验 import-dwg.ts 里的 IFRAME_HTML 与产物一致。
 */
async function assertHtmlPaths(htmlPath: string): Promise<void> {
	const raw = await fs.readFile(htmlPath, 'utf-8');
	// 先剥离 HTML 注释，避免注释里的示例（如 href="/xxx"）被当成真实引用。
	const html = raw.replace(/<!--[\s\S]*?-->/g, '');
	const refs = [...html.matchAll(/(?:src|href)\s*=\s*"(\/[^"]+)"/g)].map(m => m[1]!);
	if (refs.length === 0) {
		throw new Error('iframe/index.html 中没有任何绝对路径引用（应以 /dist/iframe/ 开头）');
	}
	for (const ref of refs) {
		// vendor 资源在拷贝之前尚不存在，由后面的 assertVendorLinks() 专门校验。
		if (ref.startsWith('/dist/vendor/'))
			continue;
		// 包内绝对路径 → 仓库内实际文件
		const onDisk = path.join(ROOT, ref.replace(/^\//, ''));
		if (!(await fs.pathExists(onDisk))) {
			throw new Error(
				`iframe/index.html 引用了不存在的文件：${ref}\n`
				+ `  期望位于仓库内：${path.relative(ROOT, onDisk)}\n`
				+ '  提示：扩展包内路径以 .eext 根目录为基准，本扩展产物在 dist/ 下。',
			);
		}
	}

	// 校验 import-dwg.ts 的 IFRAME_HTML 与产物位置一致
	const importDwg = await fs.readFile(path.join(ROOT, 'src', 'internal', 'import-dwg.ts'), 'utf-8');
	const m = importDwg.match(/const IFRAME_HTML = '([^']+)'/);
	if (!m) {
		throw new Error('src/internal/import-dwg.ts 中未找到 IFRAME_HTML 常量');
	}
	const declared = m[1]!;
	const expected = `/${path.relative(ROOT, path.join(DIST_IFRAME, 'index.html')).replace(/\\/g, '/')}`;
	if (declared !== expected) {
		throw new Error(
			`IFRAME_HTML 与实际产物不一致：\n`
			+ `  import-dwg.ts 声明：${declared}\n`
			+ `  构建产物实际路径：${expected}`,
		);
	}

	console.log(`[iframe] path check OK (${declared}, ${refs.length} ref)`);
}

/**
 * 校验 TS 中引用的所有 data-role 都在 HTML 里定义。
 *
 * 背景：代码大量使用 `querySelector('[data-role="x"]')!` 这种非空断言。
 * 断言只在编译期有效，若 HTML 缺少该属性，运行时得到 null，
 * 紧接着的属性访问会抛 TypeError 并中断整个初始化流程，
 * 而弹窗仍会显示静态骨架，看起来「打开了但不可用」，极难定位。
 */
async function assertDataRoles(htmlPath: string): Promise<void> {
	const html = await fs.readFile(htmlPath, 'utf-8');
	const defined = new Set(
		[...html.matchAll(/data-role\s*=\s*"([^"]+)"/g)].map(m => m[1]!),
	);

	// 扫描 src/iframe 下所有 TS，收集引用的 data-role
	const tsFiles = await collectTsFiles(path.join(ROOT, 'src', 'iframe'));
	const referenced = new Map<string, string>(); // role -> 文件路径
	const add = (role: string, file: string): void => {
		if (!referenced.has(role))
			referenced.set(role, path.relative(ROOT, file));
	};

	for (const f of tsFiles) {
		const src = await fs.readFile(f, 'utf-8');

		// ① 直接选择器：[data-role="x"]
		for (const m of src.matchAll(/\[data-role="([^"]+)"\]/g)) {
			const role = m[1]!;
			// 跳过模板变量（如 need() 内部动态构造的 `[data-role="${role}"]`）
			if (!role.includes('$'))
				add(role, f);
		}

		// ② 辅助函数调用：need(xxx, 'role') / need<HTMLButtonElement>(xxx, 'role')
		for (const m of src.matchAll(/\bneed(?:<[^>]*>)?\([^,)]+,\s*'([^']+)'\s*\)/g)) {
			add(m[1]!, f);
		}
	}

	const missing = [...referenced.entries()].filter(([role]) => !defined.has(role));
	if (missing.length > 0) {
		const lines = missing.map(([role, file]) => `  - "${role}"  （被 ${file} 引用）`).join('\n');
		throw new Error(
			`以下 data-role 在 iframe/index.html 中不存在：\n${lines}\n`
			+ '  请在 HTML 中补上对应的 data-role 属性，否则运行时 querySelector 返回 null 会中断初始化。',
		);
	}

	console.log(`[iframe] data-role check OK (引用 ${referenced.size} 个，HTML 定义 ${defined.size} 个)`);
}

/**
 * 校验解析引擎资源已在 HTML 中登记，且指向真实存在的文件。
 *
 * 资源 ID 必须与 src/iframe/dwg/resources.ts 中的 SQL 常量一致。
 * 校验不通过说明：要么 HTML 漏了 <link>，要么路径写错，
 * 两种情况都会导致运行时「解析引擎资源缺失」而无法导入 DWG。
 */
async function assertVendorLinks(htmlPath: string): Promise<void> {
	const html = await fs.readFile(htmlPath, 'utf-8');
	// 资源 id → 期望的包内路径
	const expected: Array<[string, string]> = [
		['vendor-libredwg', '/dist/vendor/libredwg-web/dist/libredwg-web.js'],
		['vendor-libredwg-wasm', '/dist/vendor/libredwg-web/wasm/libredwg-web.wasm'],
	];

	for (const [id, wantPath] of expected) {
		// HTML 里需存在 id="<id>" 且 href="<wantPath>" 的 link
		const re = new RegExp(`<link[^>]*id="${id}"[^>]*href="([^"]+)"`);
		const m = html.match(re);
		if (!m) {
			throw new Error(
				`iframe/index.html 中缺少资源声明：id="${id}"\n`
				+ `  期望：<link rel="preload" ... id="${id}" href="${wantPath}" />`,
			);
		}
		if (m[1] !== wantPath) {
			throw new Error(
				`资源 id="${id}" 的 href 与预期不符：\n`
				+ `  HTML 实际：${m[1]}\n`
				+ `  预期：    ${wantPath}`,
			);
		}
		// 对应文件必须真实存在（构建产物里）
		const onDisk = path.join(ROOT, wantPath.replace(/^\//, ''));
		if (!(await fs.pathExists(onDisk))) {
			throw new Error(
				`资源文件不存在：${wantPath}\n`
				+ `  期望位于：${path.relative(ROOT, onDisk)}\n`
				+ '  提示：先执行 `npm run sync:vendor`，再由 build/iframe.ts 拷贝到 dist/vendor/。',
			);
		}
	}

	console.log(`[iframe] vendor link check OK (${expected.length} 个资源)`);
}

/** 递归收集目录下的 .ts 文件。 */
async function collectTsFiles(dir: string): Promise<string[]> {
	const out: string[] = [];
	for (const entry of await fs.readdir(dir)) {
		const full = path.join(dir, entry);
		const stat = await fs.stat(full);
		if (stat.isDirectory())
			out.push(...await collectTsFiles(full));
		else if (entry.endsWith('.ts'))
			out.push(full);
	}
	return out;
}

main().catch((err) => {
	console.error('[iframe] build failed:', err);
	process.exit(1);
});
