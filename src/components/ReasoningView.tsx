import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  Copy,
  Check,
  ListOrdered,
  FileCheck,
  Phone,
  CreditCard,
  Users,
} from 'lucide-react';
import { copyToClipboard } from '../utils/exporters';

interface ReasoningViewProps {
  reasoning: string;
  stats?: {
    total: number;
    docTypesCount: Record<string, number>;
    phonesValidCount: number;
  };
}

export const ReasoningView: React.FC<ReasoningViewProps> = ({ reasoning, stats }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(
      `[CADENA DE RAZONAMIENTO PASO A PASO]\n${reasoning}`
    );
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Split reasoning into 4 numbered steps if available
  const steps = reasoning.split(/(?=\d+\.\s+)/).filter((s) => s.trim().length > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
            <Brain className="w-4 h-4 text-emerald-200" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#00324D] flex items-center gap-2">
              [CADENA DE RAZONAMIENTO PASO A PASO]
            </h3>
            <p className="text-xs text-slate-500">
              Deducción metódica, validación de lineamientos y auditoría de datos
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          type="button"
          className="text-xs font-semibold px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md shadow-2xs flex items-center gap-1.5 transition"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">¡Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copiar Razonamiento</span>
            </>
          )}
        </button>
      </div>

      {/* Metrics Bar if stats available */}
      {stats && (
        <div className="bg-emerald-50/50 border-b border-emerald-100 px-5 py-2.5 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
            <Users className="w-3.5 h-3.5 text-[#39A900]" />
            <span>Total Aprendices:</span>
            <span className="bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold text-slate-800">
              {stats.total}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
            <span>Documentos:</span>
            <div className="flex items-center gap-1">
              {Object.entries(stats.docTypesCount).map(([type, count]) => (
                <span
                  key={type}
                  className="bg-white text-[11px] font-mono px-1.5 py-0.5 rounded border border-slate-200 text-slate-700"
                >
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span>Celulares Validados:</span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-800">
              {stats.phonesValidCount} / {stats.total}
            </span>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="p-5 space-y-4 font-sans text-xs sm:text-sm leading-relaxed text-slate-700">
        {steps.length > 0 ? (
          <div className="space-y-3.5">
            {steps.map((step, idx) => {
              // Extract step title and content
              const firstColon = step.indexOf(':');
              const title = firstColon !== -1 ? step.substring(0, firstColon) : `Paso ${idx + 1}`;
              const body = firstColon !== -1 ? step.substring(firstColon + 1).trim() : step;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center gap-2 font-bold text-[#00324D] mb-1.5 text-xs sm:text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#00324D] text-[#39A900] text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span>{title.replace(/^\d+\.\s*/, '')}</span>
                  </div>
                  <div className="pl-7 text-slate-600 whitespace-pre-line text-xs sm:text-sm font-sans">
                    {body}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <pre className="p-4 bg-slate-50 rounded-lg text-slate-800 font-mono text-xs whitespace-pre-wrap">
            {reasoning}
          </pre>
        )}
      </div>
    </div>
  );
};
