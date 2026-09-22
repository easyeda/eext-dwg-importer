/**
 * 文件选择 / 拖拽 / 解析进度 section。
 *
 * 拖拽区在本 section 内（左栏）；文件名与解析状态显示在右栏顶部的
 * 文件状态条（file-status-section），由调用方把两个标签节点传入——
 * 两块 UI 分属不同卡片，DOM 上不是父子关系，无法用 need(root) 就近查找。
 */

import type { DwgIR } from '../../shared/types';
import { t } from '../../shared/i18n';
import { need } from './dom';
import { createDwgPreview } from './dwg-preview';

/** 文件状态条的标签节点（位于右栏顶部，由 index.ts 从 main 范围查找）。 */
export interface FileSectionLabels {
	name: HTMLElement;
	status: HTMLElement;
	/** 全部图元的整体 bbox 尺寸行（解析成功后显示，用于判断导入单位）。 */
	size: HTMLElement;
}

export interface FileSection {
	setDrawing: (ir: DwgIR | null) => void;
	setBusy: (busy: boolean) => void;
	setStatusIdle: () => void;
	setStatusParsing: (percent: number) => void;
	/**
	 * @param unitLabel 已解析出的图纸单位（显示出来便于核对换算是否正确）。
	 * @param size 全部图元的整体包围盒（图纸原始单位）——用户据此判断该用
	 *   哪个单位导入（如 297×210 大概率是 mm 的 A4 图框）。
	 */
	setStatusParsed: (
		entityCount: number,
		layerCount: number,
		unitLabel: string,
		size: { width: number; height: number },
	) => void;
	/**
	 * @param message **完整**文案（含「解析失败」等前缀，由调用方用 t() 组装）——
	 *   状态条是固定高度单行省略，三种失败场景的前缀各不相同，故不再由本节统一加前缀。
	 */
	setStatusError: (message: string) => void;
	onFileSelected: (cb: (file: File) => void) => void;
	destroy: () => void;
}

/**
 * @param root 文件区域：初始显示拖拽入口，解析后切换为预览画布。
 * @param labels 右栏顶部状态条的「文件名」「状态」节点。
 * @param onSelect 选中新文件时先于 onFileSelected 回调触发（可选）。
 *   可用于在通知解析流程之前清理调用方状态。
 */
export function createFileSection(
	root: HTMLElement,
	labels: FileSectionLabels,
	onSelect?: () => void,
): FileSection {
	const drop = need(root, 'dropzone') as HTMLDivElement;
	const fileInput = need(root, 'file-input') as HTMLInputElement;
	const nameLabel = labels.name;
	const statusLabel = labels.status;
	const sizeLabel = labels.size;
	const events = new AbortController();
	const previewRoot = document.createElement('div');
	previewRoot.className = 'dwg-preview';
	previewRoot.hidden = true;
	const preview = createDwgPreview(previewRoot);
	const changeButton = document.createElement('button');
	changeButton.type = 'button';
	changeButton.className = 'btn preview-change';
	changeButton.textContent = t('Choose another DWG');
	previewRoot.append(changeButton);
	root.append(previewRoot);
	let busy = false;

	/** 尺寸数字：最多两位小数并去掉尾随零（297.00 → 297，210.56 → 210.56）。 */
	const fmtNum = (n: number): string => Number(n.toFixed(2)).toString();

	/**
	 * 状态条三行都是固定高度的单行省略（见 styles.css 的 .file-status-card），
	 * 故同时写入 title：文本被省略号截断时，悬停仍能看全（错误原因尤其重要）。
	 */
	const setLine = (el: HTMLElement, text: string): void => {
		el.textContent = text;
		el.title = text;
	};

	// 拖拽区本身即点击入口（不再单独放「选择文件」按钮）。
	drop.textContent = t('Drop DWG file here or click to select');

	const handlers: Array<(file: File) => void> = [];

	drop.tabIndex = 0;
	drop.setAttribute('role', 'button');
	const choose = (): void => {
		if (!busy)
			fileInput.click();
	};
	drop.addEventListener('click', choose, { signal: events.signal });
	changeButton.addEventListener('click', choose, { signal: events.signal });
	drop.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			choose();
		}
	}, { signal: events.signal });

	root.addEventListener('dragover', (ev) => {
		ev.preventDefault();
		drop.classList.add('is-dragover');
	}, { signal: events.signal });
	root.addEventListener('dragleave', () => drop.classList.remove('is-dragover'), { signal: events.signal });
	root.addEventListener('drop', (ev) => {
		ev.preventDefault();
		drop.classList.remove('is-dragover');
		const file = ev.dataTransfer?.files?.[0];
		if (file && !busy)
			emitFile(file);
	}, { signal: events.signal });

	fileInput.addEventListener('change', () => {
		const file = fileInput.files?.[0];
		if (file && !busy)
			emitFile(file);
		fileInput.value = '';
	}, { signal: events.signal });

	function emitFile(file: File): void {
		const name = file.name;
		const sizeKb = (file.size / 1024).toFixed(1);
		setLine(nameLabel, `${name} · ${sizeKb} KB`);
		onSelect?.();
		for (const h of handlers) h(file);
	}

	const section: FileSection = {
		setDrawing(ir) {
			drop.hidden = ir !== null;
			previewRoot.hidden = ir === null;
			preview.setDrawing(ir);
		},
		setBusy(value) {
			busy = value;
			changeButton.disabled = value;
			fileInput.disabled = value;
			drop.setAttribute('aria-disabled', String(value));
		},
		setStatusIdle() {
			setLine(statusLabel, t('Status: idle'));
			setLine(sizeLabel, '');
		},
		setStatusParsing(percent: number) {
			setLine(statusLabel, t('Status: parsing {0}%', String(percent)));
			setLine(sizeLabel, '');
		},
		setStatusParsed(entityCount: number, layerCount: number, unitLabel: string, size: { width: number; height: number }) {
			setLine(statusLabel, t(
				'Status: parsed, {0} primitives, {1} layers, unit {2}',
				String(entityCount),
				String(layerCount),
				unitLabel,
			));
			// 整体 bbox 用图纸原始单位显示：数值的量级本身就是选单位的依据
			// （如 297×210 → mm 图框；11.7×8.3 → inch；×1000 量级 → 单位声明缺失）。
			setLine(sizeLabel, t(
				'Extents: {0} × {1} (drawing units)',
				fmtNum(size.width),
				fmtNum(size.height),
			));
		},
		setStatusError(message: string) {
			setLine(statusLabel, message);
			setLine(sizeLabel, '');
		},
		onFileSelected(cb) {
			handlers.push(cb);
		},
		destroy() {
			events.abort();
			preview.destroy();
			handlers.length = 0;
		},
	};

	return section;
}
