import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, CheckCircle2 } from 'lucide-react';
import { copyToClipboard, downloadFile } from '../utils/exporters';

interface MarkdownViewProps {
  markdown: string;
  ficha?: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ markdown, ficha }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(markdown);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const cleanFicha = (ficha || 'SENA').replace(/[^\w-]/g, '');
    downloadFile(
      markdown,
      `GOR-F-085-V02_Ficha_${cleanFicha}.md`,
      'text/markdown;charset=utf-8'
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center">
            <FileCode className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#00324D] flex items-center gap-2">
              [RESULTADO FINAL] — Plantilla Markdown Normalizada
            </h3>
            <p className="text-xs text-slate-500">
              Estructura oficial para copiar y pegar directamente a Excel, Word o informes SENA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            type="button"
            className="text-xs font-semibold px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md shadow-2xs flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Descargar .md</span>
          </button>

          <button
            onClick={handleCopy}
            type="button"
            className="text-xs font-semibold px-3.5 py-1.5 bg-[#39A900] hover:bg-[#2e8800] text-white rounded-md shadow-2xs flex items-center gap-1.5 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>¡Markdown Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white" />
                <span>Copiar [RESULTADO FINAL]</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Markdown Content Box */}
      <div className="p-4 sm:p-5 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
        <pre className="leading-relaxed whitespace-pre font-mono text-emerald-400">
          {markdown}
        </pre>
      </div>

      <div className="bg-slate-50 border-t border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs text-slate-500">
        <span>Formato: Markdown estándar compatible con tablas GFM (GitHub Flavored Markdown)</span>
        <span className="font-semibold text-[#00324D]">Plantilla Oficial SENA (11 Columnas - Año 2026)</span>
      </div>
    </div>
  );
};
