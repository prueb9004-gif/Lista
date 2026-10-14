import React from 'react';
import { ShieldCheck, BookOpenCheck, Sparkles, Github, ExternalLink } from 'lucide-react';

interface HeaderProps {
  onOpenGitHub?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGitHub }) => {
  return (
    <header className="no-print bg-[#00324D] text-white border-b-4 border-[#39A900] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Titles */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#39A900] to-[#2e8800] flex items-center justify-center shadow-inner text-white font-black text-xl tracking-tighter">
            <svg
              viewBox="0 0 100 100"
              className="w-8 h-8 fill-current text-white"
              aria-label="SENA Emblem"
            >
              <circle cx="50" cy="22" r="14" fill="currentColor" />
              <path
                d="M 28 42 L 72 42 L 80 54 L 62 54 L 62 90 L 38 90 L 38 54 L 20 54 Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                SENA <span className="text-[#39A900]">Registro de Asistencia Oficial</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-[#39A900]/25 text-emerald-300 border border-[#39A900]/40 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3 text-[#39A900]" />
                Formato Institucional 2026
              </span>
            </div>
            <p className="text-xs text-slate-300 font-light flex items-center gap-1.5 mt-0.5">
              <span>Automatización Documental y Normalización de Aprendices</span>
              <span className="text-slate-500">•</span>
              <span>Servicio Nacional de Aprendizaje</span>
            </p>
          </div>
        </div>

        {/* Institutional Pill, GitHub Connect Button, and Document Standard */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* GitHub Access Button */}
          <button
            type="button"
            onClick={onOpenGitHub}
            className="px-3 py-1.5 bg-slate-900/90 hover:bg-black text-white border border-slate-700 hover:border-slate-500 rounded-lg font-medium flex items-center gap-1.5 transition shadow-xs"
            title="Abrir o vincular cuenta de GitHub"
          >
            <Github className="w-3.5 h-3.5 text-white" />
            <span>Acceso GitHub</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 flex items-center gap-2.5">
            <BookOpenCheck className="w-4 h-4 text-[#39A900]" />
            <div className="text-left leading-tight">
              <div className="text-[10px] text-slate-400 font-medium">PLANTILLA OFICIAL</div>
              <div className="font-bold text-white tracking-wide">11 Columnas (2026)</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
