/**
 * ui/layer-mapping.ts 与 dwg/layer-suggest.ts 之间的桥：
 * 避免循环依赖（layer-mapping.ts → suggest.ts → shared/types.ts，路径无循环，
 * 但 ui 不能直接 import dwg/，以保持 UI 与 Dwg 解析的解耦）。
 */
export { suggestAllByColor, suggestAllByName, suggestPcbLayer } from '../dwg/layer-suggest';
