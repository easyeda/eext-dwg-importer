import type { DwgIR, DwgTextEntity } from '../../shared/types';
import { t } from '../../shared/i18n';
import { aciToCss } from './layer-mapping';

/** 只消费已展开的 IR，预览与导入共用同一次解析，不重新解码 DWG。 */
export function createDwgPreview(root: HTMLElement) {
	const canvas = document.createElement('canvas');
	canvas.className = 'dwg-preview-canvas';
	canvas.tabIndex = 0;
	canvas.setAttribute('aria-label', t('DWG preview: wheel to zoom, drag to pan'));
	const toolbar = document.createElement('div');
	toolbar.className = 'preview-toolbar';
	const hint = document.createElement('span');
	hint.textContent = t('Wheel to zoom · Drag to pan');
	toolbar.append(hint);
	const fitButton = document.createElement('button');
	fitButton.type = 'button';
	fitButton.className = 'btn';
	fitButton.textContent = t('Fit drawing');
	toolbar.append(fitButton);
	root.append(canvas, toolbar);
	const ctx = canvas.getContext('2d');
	const events = new AbortController();
	const opts = { signal: events.signal };
	let ir: DwgIR | null = null;
	let paths = new Map<string, Path2D>();
	let texts: Array<{ entity: DwgTextEntity; color: string }> = [];
	let width = 1;
	let height = 1;
	let scale = 1;
	let fitScale = 1;
	let x = 0;
	let y = 0;
	let frame = 0;
	let drag: { id: number; x: number; y: number } | null = null;

	function draw(): void {
		frame = 0;
		if (!ctx)
			return;
		const dpr = window.devicePixelRatio || 1;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.fillStyle = '#10151c';
		ctx.fillRect(0, 0, width, height);
		ctx.translate(x, y);
		ctx.scale(scale, -scale);
		ctx.lineWidth = 1 / scale;
		for (const [color, path] of paths) {
			ctx.strokeStyle = color;
			ctx.stroke(path);
		}
		for (const { entity: e, color } of texts) {
			if (e.height * scale < 2)
				continue;
			ctx.save();
			ctx.translate(e.position.x, e.position.y);
			ctx.rotate(e.rotation);
			ctx.scale(1, -1);
			ctx.font = `${Math.max(e.height, 0.001)}px sans-serif`;
			ctx.fillStyle = color;
			ctx.fillText(e.content, 0, 0);
			ctx.restore();
		}
	}
	function schedule(): void {
		if (!frame)
			frame = requestAnimationFrame(draw);
	}
	function fit(): void {
		if (!ir)
			return;
		const b = ir.bbox;
		const spanX = Math.max(b.maxX - b.minX, 1e-6);
		const spanY = Math.max(b.maxY - b.minY, 1e-6);
		scale = Math.max(1e-10, Math.min(width / spanX, height / spanY) * 0.85);
		fitScale = scale;
		x = width / 2 - (b.minX + spanX / 2) * scale;
		y = height / 2 + (b.minY + spanY / 2) * scale;
		schedule();
	}
	function zoom(factor: number, px: number, py: number): void {
		const next = Math.max(fitScale / 100, Math.min(fitScale * 1000, scale * factor));
		x = px - (px - x) * next / scale;
		y = py - (py - y) * next / scale;
		scale = next;
		schedule();
	}
	canvas.addEventListener('wheel', (e) => {
		e.preventDefault();
		const r = canvas.getBoundingClientRect();
		const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? height : 1);
		zoom(Math.exp(-Math.max(-200, Math.min(200, delta)) * 0.002), e.clientX - r.left, e.clientY - r.top);
	}, { ...opts, passive: false });
	canvas.addEventListener('pointerdown', (e) => {
		if (e.button !== 0)
			return;
		drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
		canvas.setPointerCapture(e.pointerId);
		canvas.classList.add('is-panning');
	}, opts);
	canvas.addEventListener('pointermove', (e) => {
		if (!drag || drag.id !== e.pointerId)
			return;
		x += e.clientX - drag.x;
		y += e.clientY - drag.y;
		drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
		schedule();
	}, opts);
	const endDrag = (): void => {
		drag = null;
		canvas.classList.remove('is-panning');
	};
	canvas.addEventListener('pointerup', endDrag, opts);
	canvas.addEventListener('pointercancel', endDrag, opts);
	canvas.addEventListener('lostpointercapture', endDrag, opts);
	canvas.addEventListener('dblclick', fit, opts);
	fitButton.addEventListener('click', fit, opts);
	canvas.addEventListener('keydown', (e) => {
		if (e.key === '+' || e.key === '=')
			zoom(1.25, width / 2, height / 2);
		else if (e.key === '-')
			zoom(0.8, width / 2, height / 2);
		else if (e.key === '0')
			fit();
		else
			return;
		e.preventDefault();
	}, opts);
	const observer = new ResizeObserver(() => {
		const rect = canvas.getBoundingClientRect();
		if (rect.width > 0 && rect.height > 0) {
			width = rect.width;
			height = rect.height;
			fit();
		}
	});
	observer.observe(canvas);
	return {
		setDrawing(drawing: DwgIR | null) {
			ir = drawing;
			paths = new Map();
			texts = [];
			if (!ir) {
				schedule();
				return;
			}
			const layers = new Map(ir.layers.map(l => [l.name, l.color]));
			for (const e of ir.entities) {
				const aci = e.color && e.color !== 256 ? e.color : layers.get(e.layer) ?? 7;
				const color = aciToCss(aci);
				if (e.kind === 'TEXT' || e.kind === 'MTEXT') {
					texts.push({ entity: e, color });
					continue;
				}
				let path = paths.get(color);
				if (!path) {
					path = new Path2D();
					paths.set(color, path);
				}
				switch (e.kind) {
					case 'LINE':
						path.moveTo(e.start.x, e.start.y);
						path.lineTo(e.end.x, e.end.y);
						break;
					case 'CIRCLE':
					case 'ARC': {
						const start = e.kind === 'ARC' ? e.startAngle : 0;
						const end = e.kind === 'ARC' ? e.endAngle : Math.PI * 2;
						if (!(e.radius > 0))
							break;
						path.moveTo(e.center.x + e.radius * Math.cos(start), e.center.y + e.radius * Math.sin(start));
						path.arc(e.center.x, e.center.y, e.radius, start, end, end < start);
						break;
					}
					case 'LWPOLYLINE':
					case 'POLYLINE':
					case 'SPLINE':
						for (const [i, p] of e.points.entries()) {
							if (i === 0)
								path.moveTo(p.x, p.y);
							else
								path.lineTo(p.x, p.y);
						}
						if (e.closed)
							path.closePath();
				}
			}
			fit();
		},
		destroy() {
			events.abort();
			observer.disconnect();
			cancelAnimationFrame(frame);
		},
	};
}
