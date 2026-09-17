/*
 * 解析器端到端自检。
 *
 * 对照 PRD §「支持的文件」用仓库自带的样例 DWG（build/dist/Drawing*.dwg）
 * 跑完整的 parseDwg 链路，验证：
 *   1. 引擎可加载、wasm 可实例化；
 *   2. 嵌套 BLOCK 能正确展开（v1.1.0 曾因块内 INSERT 直接抛错而整体解析失败）；
 *   3. IR 结构完整：实体类型合法、坐标全部为有限数；
 *   4. 图层智能建议能给出可用映射。
 *
 * 用法：npm run check:parser
 *
 * 实现说明：parser.ts 是 TypeScript，Node 无法直接 import，
 * 故先用 esbuild 的 CLI 把它打包成临时 ESM 再加载
 * （不用 esbuild 的 JS API —— 在某些受限环境下它会 spawn EPERM）。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const VENDOR = join(ROOT, 'vendor', 'libredwg-web');
const SAMPLES_DIR = join(ROOT, 'build', 'dist');
const SAMPLES = ['Drawing1.dwg', 'Drawing2.dwg', 'Drawing3.dwg', 'Drawing4.dwg'];

/*
 * esbuild 可执行文件。
 *
 * 直接指向 @esbuild/<platform> 下的原生二进制，而不用 node_modules/.bin/esbuild.cmd：
 * 后者是 shell 包装脚本，用 execFileSync 调用会 EINVAL（Windows 上 .cmd 需要 shell）。
 */
function resolveEsbuildBin() {
	const pkg = `@esbuild/${process.platform}-${process.arch}`;
	const name = process.platform === 'win32' ? 'esbuild.exe' : 'bin/esbuild';
	const bin = join(ROOT, 'node_modules', pkg, name);
	if (!existsSync(bin))
		throw new Error(`未找到 esbuild 原生二进制：${bin}`);
	return bin;
}

const esbuildBin = resolveEsbuildBin();

function bundle(entry, outfile) {
	/*
	 * stdio: 'inherit' 而非 'pipe'。
	 *
	 * 受限沙箱下，通过管道捕获子进程输出会被拒绝（EPERM）；
	 * 继承父进程 stdio 不需要管道，可正常工作。
	 * esbuild 失败时会以非零码退出，execFileSync 依然会抛错，错误语义不受影响。
	 */
	execFileSync(esbuildBin, [
		entry,
		'--bundle',
		'--format=esm',
		'--platform=node',
		`--outfile=${outfile}`,
		'--external:@mlightcad/libredwg-web',
		'--log-level=warning',
	], { stdio: 'inherit' });
}

const missing = SAMPLES.filter(f => !existsSync(join(SAMPLES_DIR, f)));
if (missing.length > 0) {
	console.error(`[check:parser] 缺少样例 DWG：${missing.join(', ')}（应位于 build/dist/）`);
	process.exit(1);
}
if (!existsSync(join(VENDOR, 'libredwg-web.js'))) {
	console.error('[check:parser] 未找到解析引擎，请先执行 npm run sync:vendor');
	process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), 'dwg-check-'));
let failures = 0;

try {
	bundle(join(ROOT, 'src', 'iframe', 'dwg', 'parser.ts'), join(tmp, 'parser.mjs'));
	bundle(join(ROOT, 'src', 'iframe', 'dwg', 'layer-suggest.ts'), join(tmp, 'suggest.mjs'));

	// 引擎经 globalThis 注入，绕过 blob URL 资源发现（parser.ts 的宿主预挂载分支）。
	const engine = await import(pathToFileURL(join(VENDOR, 'libredwg-web.js')).href);
	const wasmInstance = await engine.createModule({
		locateFile: f => (f.endsWith('.wasm') ? join(VENDOR, 'libredwg-web.wasm') : f),
	});
	globalThis.__dwg_libredwg__ = engine.LibreDwg.createByWasmInstance(wasmInstance);

	const { parseDwg } = await import(pathToFileURL(join(tmp, 'parser.mjs')).href);
	const { suggestAllByName, suggestAllByColor } = await import(pathToFileURL(join(tmp, 'suggest.mjs')).href);

	// 目标 PCB 层（含颜色，供颜色匹配分支使用）。
	const pcbLayers = [
		{ name: 'Top Layer', id: 1, color: { r: 255, g: 0, b: 0 } },
		{ name: 'Bottom Layer', id: 2, color: { r: 0, g: 0, b: 255 } },
		{ name: 'Top Silkscreen Layer', id: 3, color: { r: 255, g: 255, b: 255 } },
		{ name: 'Board Outline Layer', id: 11, color: { r: 255, g: 255, b: 0 } },
		{ name: 'Mechanical Layer', id: 14, color: { r: 128, g: 128, b: 128 } },
	];

	/** 提取实体的全部数值坐标，用于非有限数检查。 */
	function coordsOf(e) {
		switch (e.kind) {
			case 'LINE': return [e.start.x, e.start.y, e.end.x, e.end.y];
			case 'CIRCLE':
			case 'ARC': return [e.center.x, e.center.y, e.radius];
			default: return (e.points ?? []).flatMap(p => [p.x, p.y]);
		}
	}

	for (const name of SAMPLES) {
		const buf = readFileSync(join(SAMPLES_DIR, name));
		try {
			const ir = await parseDwg(new File([buf], name), { maxEntities: 100_000, maxBytes: 50 * 1024 * 1024 });

			const problems = [];
			if (ir.entities.length === 0)
				problems.push('解析出 0 个实体');
			if (ir.entities.some(e => !e.kind || typeof e.layer !== 'string'))
				problems.push('存在缺少 kind/layer 的实体');
			if (ir.entities.some(e => coordsOf(e).some(n => !Number.isFinite(n))))
				problems.push('存在非有限坐标');
			if (ir.bbox && ![ir.bbox.minX, ir.bbox.minY, ir.bbox.maxX, ir.bbox.maxY].every(Number.isFinite))
				problems.push('包围盒含非有限值');

			// 图层建议：至少一层应能自动映射，否则用户每次都要全手工指定。
			const nameMap = suggestAllByName(ir.layers.map(l => ({ name: l.name })));
			const colorMap = suggestAllByColor(ir.layers.map(l => ({ name: l.name, color: l.color })), pcbLayers);
			const mapped = ir.layers.filter(l => (nameMap[l.name] ?? colorMap[l.name] ?? null) !== null);
			if (mapped.length === 0)
				problems.push('没有任何图层能自动建议映射');

			if (problems.length > 0) {
				console.error(`✗ ${name}：${problems.join('；')}`);
				failures++;
				continue;
			}

			const kinds = {};
			for (const e of ir.entities) kinds[e.kind] = (kinds[e.kind] ?? 0) + 1;
			console.log(`✓ ${name}：实体 ${ir.entities.length}，图层 ${ir.layers.length}，图块 ${ir.blocks.length}，单位 ${ir.units}`);
			console.log(`    类型分布 ${JSON.stringify(kinds)}`);
		}
		catch (err) {
			console.error(`✗ ${name}：${err.message}`);
			failures++;
		}
	}
}
finally {
	rmSync(tmp, { recursive: true, force: true });
}

if (failures > 0) {
	console.error(`\n[check:parser] ${failures} 个样例失败`);
	process.exit(1);
}
console.log('\n[check:parser] 全部通过');
