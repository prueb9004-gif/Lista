/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { DocumentSheet } from './components/DocumentSheet';
import { ReasoningView } from './components/ReasoningView';
import { MarkdownView } from './components/MarkdownView';
import { GitHubModal } from './components/GitHubModal';
import { Apprentice, SessionMetadata, NormalizationResponse } from './types';
import { SAMPLE_PRESETS } from './data/presets';
import {
  FileText,
  Brain,
  FileCode,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export default function App() {
  const initialPreset = SAMPLE_PRESETS[0];

  const [metadata, setMetadata] = useState<SessionMetadata>({
    ...initialPreset.metadata,
    dia: '14',
    mes: 'MARZO',
    ano: '2026',
    dayMonth: 'Día 14 del mes de Marzo del año 2026',
    dependenciaEmpresa: 'Ficha 2678901 - Análisis y Desarrollo de Software (ADSO)',
  });

  const [rawList, setRawList] = useState<string>(initialPreset.rawList);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sheet' | 'reasoning' | 'markdown'>('sheet');
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);

  const [apprentices, setApprentices] = useState<Apprentice[]>([
    {
      item: 1,
      fullName: 'Gómez, María',
      docType: 'TI',
      docNumber: '101234568',
      noDocumento: 'TI 101234568',
      planta: '',
      contratista: '',
      otroCual: 'Aprendiz',
      dependenciaEmpresa: 'Ficha 2678901 - ADSO',
      correoElectronico: 'mgomez@soy.sena.edu.co',
      phone: '3209876543',
      autorizaGrabacion: 'SÍ',
      signature: '[ ________________ ]',
      status: 'Asiste',
    },
    {
      item: 2,
      fullName: 'Pérez, Juan',
      docType: 'CC',
      docNumber: '100234567',
      noDocumento: 'CC 100234567',
      planta: '',
      contratista: '',
      otroCual: 'Aprendiz',
      dependenciaEmpresa: 'Ficha 2678901 - ADSO',
      correoElectronico: 'jperez@soy.sena.edu.co',
      phone: '3105551234',
      autorizaGrabacion: 'SÍ',
      signature: '[ ________________ ]',
      status: 'Asiste',
    },
  ]);

  const [reasoning, setReasoning] = useState<string>(
    `1. Validación de Normativa Institucional SENA (Plantilla Oficial de Asistencia):
   - Membrete: Logo oficial verde SENA centrado superior.
   - Encabezado: 'REGISTRO DE ASISTENCIA / DÍA 14 DEL MES DE MARZO DEL AÑO 2026'.
   - Fila de Control: 'OBJETIVO (S): Desarrollar habilidades prácticas en control de versiones con Git y GitHub.'
   - Matriz de 11 Columnas Oficiales: No | NOMBRES Y APELLIDOS | No. DOCUMENTO | PLANTA | CONTRATISTA | OTRO ¿CUAL? | DEPENDENCIA/EMPRESA | CORREO ELECTRÓNICO | TELÉFONO/EXT. | AUTORIZA GRABACIÓN | FIRMA O PARTICIPACIÓN VIRTUAL.
2. Extracción y Normalización de Metadatos:
   - Sesión: Día 14 | Mes de Marzo | Año 2026
   - Objetivo: Desarrollar habilidades prácticas en control de versiones con Git y GitHub.
   - Dependencia / Ficha: Ficha 2678901 - Análisis y Desarrollo de Software (ADSO)
3. Depuración y Ordenamiento de Aprendices: Se ordenó alfabéticamente por apellidos A-Z (Gómez María antes que Pérez Juan), se asignó numeración consecutiva (1, 2), se validó documento (TI, CC) y celular (10 dígitos), asignando correo institucional.
4. Formateo y Generación: Generación tabular fiel al diseño oficial de la plantilla con vinculación 'Aprendiz', autorización de grabación 'SÍ' y firma virtual lista para procesador de texto o Excel.`
  );

  const [markdown, setMarkdown] = useState<string>(
    `### REGISTRO DE ASISTENCIA SENA
**REGISTRO DE ASISTENCIA / DÍA 14 DEL MES DE MARZO DEL AÑO 2026**
**OBJETIVO (S):** Desarrollar habilidades prácticas en control de versiones con Git y GitHub.

| No | NOMBRES Y APELLIDOS | No. DOCUMENTO | PLANTA | CONTRATISTA | OTRO ¿CUAL? | DEPENDENCIA/EMPRESA | CORREO ELECTRÓNICO | TELÉFONO/EXT. | AUTORIZA GRABACIÓN | FIRMA O PARTICIPACIÓN VIRTUAL |
| :--- | :---------------------------- | :------------ | :----- | :---------- | :---------- | :--------------------------- | :---------------------------- | :------------ | :----------------- | :---------------------------- |
| 1    | Gómez, María                  | TI 101234568  |        |             | Aprendiz    | Ficha 2678901 - ADSO         | mgomez@soy.sena.edu.co        | 3209876543    | SÍ                 | [ ________________ ]          |
| 2    | Pérez, Juan                   | CC 100234567  |        |             | Aprendiz    | Ficha 2678901 - ADSO         | jperez@soy.sena.edu.co        | 3105551234    | SÍ                 | [ ________________ ]          |`
  );

  const [stats, setStats] = useState<{
    total: number;
    docTypesCount: Record<string, number>;
    phonesValidCount: number;
    emailsValidCount?: number;
  }>({
    total: 2,
    docTypesCount: { TI: 1, CC: 1 },
    phonesValidCount: 2,
    emailsValidCount: 2,
  });

  const [engineUsed, setEngineUsed] = useState<string>('gemini-3.8-flash');

  const handleLoadPreset = (presetId: string) => {
    const found = SAMPLE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setMetadata({
        ...found.metadata,
        dia: '14',
        mes: 'MARZO',
        ano: '2026',
        dependenciaEmpresa: `Ficha ${found.metadata.ficha} - ${found.metadata.programName}`,
      });
      setRawList(found.rawList);
    }
  };

  const handleProcess = async () => {
    if (!rawList.trim()) {
      setError('Por favor pegue o escriba un listado de aprendices para procesar.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/process-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawMetadata: metadata,
          rawList,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar los datos de asistencia.');
      }

      const data: NormalizationResponse = await response.json();

      if (data.apprentices && data.apprentices.length > 0) {
        setApprentices(data.apprentices);
      }
      if (data.reasoning) {
        setReasoning(data.reasoning);
      }
      if (data.markdown) {
        setMarkdown(data.markdown);
      }
      if (data.parsedMetadata) {
        setMetadata((prev) => ({
          ...prev,
          programName: data.parsedMetadata.programName || prev.programName,
          ficha: data.parsedMetadata.ficha || prev.ficha,
          objective: data.parsedMetadata.objective || prev.objective,
          dia: data.parsedMetadata.dia || prev.dia,
          mes: data.parsedMetadata.mes || prev.mes,
          ano: data.parsedMetadata.ano || prev.ano,
          dayMonth: data.parsedMetadata.dayMonth || prev.dayMonth,
          dependenciaEmpresa: data.parsedMetadata.dependenciaEmpresa || prev.dependenciaEmpresa,
        }));
      }
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.engine) {
        setEngineUsed(data.engine);
      }

      setActiveTab('sheet');
    } catch (err: any) {
      console.error('Normalization error:', err);
      setError(err?.message || 'Ocurrió un error al contactar al motor de normalización.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-[#39A900]/20 selection:text-[#00324D]">
      <Header onOpenGitHub={() => setIsGitHubModalOpen(true)} />

      <main className="max-w-[1300px] mx-auto px-3 sm:px-6 lg:px-8 py-6 w-full space-y-6 flex-1">
        {error && (
          <div className="no-print bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-xs flex items-center justify-between text-red-700 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="font-bold text-red-600 hover:text-red-800 text-xs"
            >
              Cerrar
            </button>
          </div>
        )}

        <InputPanel
          metadata={metadata}
          setMetadata={setMetadata}
          rawList={rawList}
          setRawList={setRawList}
          onProcess={handleProcess}
          isLoading={isLoading}
          onLoadPreset={handleLoadPreset}
        />

        {/* Result Tabs Navigation */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('sheet')}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'sheet'
                  ? 'bg-[#00324D] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <FileText
                className={`w-4 h-4 ${activeTab === 'sheet' ? 'text-[#39A900]' : 'text-slate-400'}`}
              />
              <span>1. Formato Oficial SENA (11 Columnas)</span>
            </button>

            <button
              onClick={() => setActiveTab('reasoning')}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'reasoning'
                  ? 'bg-[#00324D] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Brain
                className={`w-4 h-4 ${
                  activeTab === 'reasoning' ? 'text-emerald-400' : 'text-slate-400'
                }`}
              />
              <span>2. [CADENA DE RAZONAMIENTO PASO A PASO]</span>
            </button>

            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'markdown'
                  ? 'bg-[#00324D] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <FileCode
                className={`w-4 h-4 ${
                  activeTab === 'markdown' ? 'text-emerald-400' : 'text-slate-400'
                }`}
              />
              <span>3. [RESULTADO FINAL] (Markdown Puro)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              Motor Activo:{' '}
              <strong className="text-slate-700">
                {engineUsed === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash AI' : 'Heurístico SENA'}
              </strong>
            </span>
          </div>
        </div>

        {/* Tab Content Display */}
        <div>
          {activeTab === 'sheet' && (
            <DocumentSheet
              metadata={metadata}
              apprentices={apprentices}
              setApprentices={setApprentices}
              reasoning={reasoning}
            />
          )}

          {activeTab === 'reasoning' && (
            <ReasoningView reasoning={reasoning} stats={stats} />
          )}

          {activeTab === 'markdown' && (
            <MarkdownView markdown={markdown} ficha={metadata.ficha} />
          )}
        </div>
      </main>

      <footer className="no-print mt-auto bg-slate-900 text-slate-400 text-xs py-5 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#39A900] text-white flex items-center justify-center font-bold text-[10px]">
              S
            </div>
            <span>
              Servicio Nacional de Aprendizaje SENA — Plantilla Oficial de Registro de Asistencia 2026
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            11 Columnas Oficiales: No | Nombres y Apellidos | No. Documento | Planta | Contratista | Otro | Dependencia | Correo | Teléfono | Autoriza Grabación | Firma
          </div>
        </div>
      </footer>
      <GitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        markdown={markdown}
        ficha={metadata.ficha}
        programName={metadata.programName}
      />
    </div>
  );
}
