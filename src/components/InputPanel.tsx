import React, { useRef, useState } from 'react';
import {
  FileText,
  Upload,
  RotateCcw,
  Sparkles,
  ClipboardPaste,
  HelpCircle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  FileType,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileCheck2,
} from 'lucide-react';
import { SessionMetadata } from '../types';
import { SAMPLE_PRESETS } from '../data/presets';
import { downloadSampleEnrollmentWord } from '../utils/exporters';
import { parseExcelWorkbook, downloadSampleEnrollmentExcel } from '../utils/excelParser';

interface InputPanelProps {
  metadata: SessionMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<SessionMetadata>>;
  rawList: string;
  setRawList: (val: string) => void;
  onProcess: () => void;
  isLoading: boolean;
  onLoadPreset: (presetId: string) => void;
}

const COMMON_PROGRAMS = [
  'ADSO (Análisis y Desarrollo de Software)',
  'Gestión Contable y de Información Financiera',
  'Animación Digital',
  'Sistemas de Información y Bases de Datos',
  'Mantenimiento de Equipos de Cómputo',
];

export const InputPanel: React.FC<InputPanelProps> = ({
  metadata,
  setMetadata,
  rawList,
  setRawList,
  onProcess,
  isLoading,
  onLoadPreset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wordFileInputRef = useRef<HTMLInputElement>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  const [isParsingWord, setIsParsingWord] = useState<boolean>(false);
  const [isParsingExcel, setIsParsingExcel] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<{
    type: 'excel' | 'word';
    fileName: string;
    apprenticesCount: number;
    ficha?: string;
    programName?: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleMetadataChange = (field: keyof SessionMetadata, value: string) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  };

  // Plain text / CSV handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawList(text);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Excel (.xlsx / .xls) upload and parser handler
  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setUploadError(null);
    setUploadSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const result = parseExcelWorkbook(arrayBuffer, file.name);

        if (result.apprentices.length === 0 && result.rawLines.length === 0) {
          throw new Error(
            'No se encontraron filas con aprendices en el archivo Excel. Verifique que contenga columnas de nombres y documentos.'
          );
        }

        // Auto-fill metadata
        if (result.metadata) {
          setMetadata((prev) => ({
            ...prev,
            programName: result.metadata.programName || prev.programName,
            ficha: result.metadata.ficha || prev.ficha,
            objective: result.metadata.objective || prev.objective,
            dia: result.metadata.dia || prev.dia,
            mes: result.metadata.mes || prev.mes,
            ano: result.metadata.ano || prev.ano,
            dayMonth: result.metadata.dayMonth || prev.dayMonth,
            center: result.metadata.center || prev.center,
            regional: result.metadata.regional || prev.regional,
            instructor: result.metadata.instructor || prev.instructor,
            dependenciaEmpresa:
              result.metadata.dependenciaEmpresa ||
              (result.metadata.ficha
                ? `Ficha ${result.metadata.ficha} - ${result.metadata.programName || prev.programName}`
                : prev.dependenciaEmpresa),
          }));
        }

        // Auto-fill rawList
        setRawList(result.rawLines.join('\n'));

        setUploadSuccess({
          type: 'excel',
          fileName: file.name,
          apprenticesCount: result.totalLearners,
          ficha: result.metadata?.ficha,
          programName: result.metadata?.programName,
        });
      } catch (err: any) {
        console.error('Excel parse error:', err);
        setUploadError(err?.message || 'Error al procesar el archivo Excel.');
      } finally {
        setIsParsingExcel(false);
        if (excelFileInputRef.current) {
          excelFileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setUploadError('Error al leer el archivo Excel en el navegador.');
      setIsParsingExcel(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Word (.docx / .doc) upload and parser handler
  const handleWordFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingWord(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          const response = await fetch('/api/parse-word-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64,
              fileName: file.name,
            }),
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Error al procesar el archivo Word.');
          }

          const data = await response.json();

          if (data.metadata) {
            setMetadata((prev) => ({
              ...prev,
              programName: data.metadata.programName || prev.programName,
              ficha: data.metadata.ficha || prev.ficha,
              objective: data.metadata.objective || prev.objective,
              dia: data.metadata.dia || prev.dia,
              mes: data.metadata.mes || prev.mes,
              ano: data.metadata.ano || prev.ano,
              dayMonth: data.metadata.dayMonth || prev.dayMonth,
              center: data.metadata.center || prev.center,
              regional: data.metadata.regional || prev.regional,
              instructor: data.metadata.instructor || prev.instructor,
              dependenciaEmpresa:
                data.metadata.dependenciaEmpresa ||
                (data.metadata.ficha
                  ? `Ficha ${data.metadata.ficha} - ${data.metadata.programName || prev.programName}`
                  : prev.dependenciaEmpresa),
            }));
          }

          if (data.rawList) {
            setRawList(data.rawList);
            const count = data.rawList.split('\n').filter((l: string) => l.trim().length > 0).length;
            setUploadSuccess({
              type: 'word',
              fileName: file.name,
              apprenticesCount: count,
              ficha: data.metadata?.ficha,
              programName: data.metadata?.programName,
            });
          }
        } catch (postErr: any) {
          console.error('Word parsing error:', postErr);
          setUploadError(postErr.message || 'Error al extraer la información del archivo Word.');
        } finally {
          setIsParsingWord(false);
          if (wordFileInputRef.current) {
            wordFileInputRef.current.value = '';
          }
        }
      };

      reader.onerror = () => {
        setUploadError('Error al leer el archivo en el navegador.');
        setIsParsingWord(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setUploadError('Error inesperado al cargar el documento.');
      setIsParsingWord(false);
    }
  };

  const lineCount = rawList
    .split('\n')
    .filter((l) => l.trim().length > 0 && !l.startsWith('#')).length;

  return (
    <div className="no-print bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Panel Banner */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00324D] text-white flex items-center justify-center">
            <Layers className="w-4 h-4 text-[#39A900]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#00324D]">
              Entrada de Datos & Normalización — Registro de Asistencia SENA
            </h2>
            <p className="text-xs text-slate-500">
              Importe desde Excel (.xlsx/.xls) o Word (.docx/.doc) con datos reales de matrícula, o digite los campos
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1">Casos precargados:</span>
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setUploadSuccess(null);
                setUploadError(null);
                onLoadPreset(preset.id);
              }}
              type="button"
              className="text-xs px-2.5 py-1 bg-white border border-slate-200 hover:border-[#39A900] hover:text-[#39A900] text-slate-700 font-medium rounded-md transition-colors shadow-2xs"
            >
              {preset.id === 'adso-git' ? '⚡ Caso Guía ADSO 2678901' : preset.name.split('—')[0].trim()}
            </button>
          ))}
          <button
            onClick={() => {
              setMetadata({
                programName: '',
                ficha: '',
                objective: '',
                dia: '14',
                mes: 'MARZO',
                ano: '2026',
                dayMonth: 'Día 14 del mes de Marzo del año 2026',
                center: '',
                regional: '',
                instructor: '',
                dependenciaEmpresa: '',
              });
              setRawList('');
              setUploadSuccess(null);
              setUploadError(null);
            }}
            type="button"
            className="text-xs px-2 py-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-1"
            title="Limpiar campos"
          >
            <RotateCcw className="w-3 h-3" />
            Limpiar
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Dual Import Dropzone: EXCEL & WORD */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Importar desde Excel (.xlsx / .xls) */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-green-50/50 border-2 border-dashed border-emerald-300 hover:border-[#39A900] rounded-xl p-4 transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <FileSpreadsheet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-emerald-950">
                      Importar desde Archivo Excel (.xlsx / .xls)
                    </h3>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                      SofiaPlus
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Lee reportes de aprendices matriculados, mapeando automáticamente las 11 columnas.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <input
                  ref={excelFileInputRef}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleExcelFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={isParsingExcel}
                  onClick={() => excelFileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  {isParsingExcel ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Leyendo Excel...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-white" />
                      <span>Subir Excel (.xlsx / .xls)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={downloadSampleEnrollmentExcel}
                  className="px-2.5 py-2 bg-white hover:bg-slate-50 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition"
                  title="Descargar plantilla de prueba oficial SENA en formato Excel (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Plantilla Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Importar desde Archivo Word (.docx / .doc) */}
          <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-sky-50/50 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl p-4 transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <FileType className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-blue-950">
                      Importar desde Archivo Word (.docx / .doc)
                    </h3>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                      Actas / Word
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Extrae tablas y textos institucionales con datos de matrícula y encabezados.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <input
                  ref={wordFileInputRef}
                  type="file"
                  accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                  onChange={handleWordFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={isParsingWord}
                  onClick={() => wordFileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  {isParsingWord ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Leyendo Word...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-white" />
                      <span>Subir Word (.docx / .doc)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={downloadSampleEnrollmentWord}
                  className="px-2.5 py-2 bg-white hover:bg-slate-50 text-blue-800 border border-blue-300 text-xs font-semibold rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition"
                  title="Descargar formato de asistencia oficial SENA en formato Word (.doc)"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Plantilla Word</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Banner if parsed */}
        {uploadSuccess && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#39A900] shrink-0" />
              <span>
                <strong>Archivo {uploadSuccess.type === 'excel' ? 'Excel' : 'Word'} procesado con éxito:</strong>{' '}
                {uploadSuccess.fileName} — Se extrajeron{' '}
                <strong className="text-emerald-800">{uploadSuccess.apprenticesCount} aprendices</strong>
                {uploadSuccess.ficha ? ` (Ficha: ${uploadSuccess.ficha})` : ''}
                {uploadSuccess.programName ? ` para ${uploadSuccess.programName}` : ''}.
              </span>
            </div>
            <button
              type="button"
              onClick={onProcess}
              className="px-3 py-1 bg-[#39A900] hover:bg-[#2e8800] text-white font-bold rounded shadow-xs text-xs flex items-center gap-1 transition"
            >
              <Sparkles className="w-3 h-3 text-white" />
              Normalizar Ahora a Plantilla SENA
            </button>
          </div>
        )}

        {/* Error Banner if parse failed */}
        {uploadError && (
          <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-3 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Section 1: Metadatos Administrativos */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#00324D] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#39A900]"></span>
              1. Encabezado Oficial: REGISTRO DE ASISTENCIA
            </label>
            <span className="text-[11px] text-slate-400">Campos del membrete institucional</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5">
            {/* Día */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Día <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={metadata.dia || '14'}
                onChange={(e) => {
                  const val = e.target.value;
                  setMetadata((prev) => ({
                    ...prev,
                    dia: val,
                    dayMonth: `Día: ${val} | Mes: ${prev.mes || 'MARZO'} | Año: ${prev.ano || '2026'}`,
                  }));
                }}
                placeholder="Ej: 14"
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39A900]/40 focus:border-[#39A900] text-center font-bold font-mono transition"
              />
            </div>

            {/* Mes */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mes <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={metadata.mes || 'MARZO'}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setMetadata((prev) => ({
                    ...prev,
                    mes: val,
                    dayMonth: `Día: ${prev.dia || '14'} | Mes: ${val} | Año: ${prev.ano || '2026'}`,
                  }));
                }}
                placeholder="Ej: MARZO"
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39A900]/40 focus:border-[#39A900] font-bold uppercase transition"
              />
            </div>

            {/* Año */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Año <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={metadata.ano || '2026'}
                onChange={(e) => {
                  const val = e.target.value;
                  setMetadata((prev) => ({
                    ...prev,
                    ano: val,
                    dayMonth: `Día: ${prev.dia || '14'} | Mes: ${prev.mes || 'MARZO'} | Año: ${val}`,
                  }));
                }}
                placeholder="2026"
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39A900]/40 focus:border-[#39A900] text-center font-bold font-mono transition"
              />
            </div>

            {/* Número de Ficha */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número de Ficha <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={metadata.ficha}
                onChange={(e) => handleMetadataChange('ficha', e.target.value)}
                placeholder="Ej: 2678901"
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39A900]/40 focus:border-[#39A900] font-mono transition"
              />
            </div>

            {/* Objetivo(s) */}
            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-xs font-bold text-slate-800 mb-1 uppercase">
                OBJETIVO (S) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={metadata.objective}
                onChange={(e) => handleMetadataChange('objective', e.target.value)}
                placeholder="Ej: Desarrollar habilidades prácticas en control de versiones con Git y GitHub."
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39A900]/40 focus:border-[#39A900] transition"
              />
            </div>

            {/* Programa de Formación */}
            <div className="md:col-span-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Programa de Formación
              </label>
              <input
                type="text"
                value={metadata.programName}
                onChange={(e) => handleMetadataChange('programName', e.target.value)}
                placeholder="Ej: Análisis y Desarrollo de Software (ADSO)"
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39A900]/40 focus:border-[#39A900] transition"
              />
            </div>

            {/* Dependencia / Empresa */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dependencia / Empresa (Columna 7)
              </label>
              <input
                type="text"
                value={metadata.dependenciaEmpresa || `Ficha ${metadata.ficha || ''} - ${metadata.programName || ''}`}
                onChange={(e) => handleMetadataChange('dependenciaEmpresa', e.target.value)}
                placeholder="Ej: Ficha 2678901 - ADSO"
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39A900]/40 focus:border-[#39A900] transition"
              />
            </div>

            {/* Instructor / Responsable */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instructor / Responsable de la Sesión
              </label>
              <input
                type="text"
                value={metadata.instructor || ''}
                onChange={(e) => handleMetadataChange('instructor', e.target.value)}
                placeholder="Nombre del instructor"
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39A900]/40 focus:border-[#39A900] transition"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Listado Bruto de Aprendices */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#00324D] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#39A900]"></span>
                2. Listado de Aprendices Matriculados (Extraído o Pegado)
              </label>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                {lineCount} {lineCount === 1 ? 'aprendiz detectado' : 'aprendices detectados'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.log"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-slate-600 hover:text-[#00324D] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                Cargar Texto / CSV
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={6}
              value={rawList}
              onChange={(e) => setRawList(e.target.value)}
              placeholder={`Copie y pegue aquí el listado desorganizado o suba el archivo Excel o Word arriba:
- Perez Juan, CC 100234567, cel 3105551234
- Gomez Maria, TI 101234568, cel 3209876543
(Acepta mayúsculas, minúsculas, mensajes de WhatsApp, SofiaPlus, teléfonos con o sin +57, tablas de Excel o Word, etc.)`}
              className="w-full text-xs sm:text-sm font-mono px-3.5 py-3 bg-slate-900 text-emerald-400 placeholder-slate-500 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-[#39A900] leading-relaxed transition"
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-1.5 text-slate-500">
              <HelpCircle className="w-3.5 h-3.5 text-[#39A900]" />
              <span>
                El motor analiza documento (CC/TI/CE/PPT), celular (10 dígitos), correo y genera las 11 columnas oficiales.
              </span>
            </div>

            <div className="text-[11px] text-slate-400">
              Compatible con copiado directo a Excel y Word
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isLoading || !rawList.trim()}
            onClick={onProcess}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all ${
              isLoading || !rawList.trim()
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-[#39A900] hover:bg-[#2e8800] active:scale-[0.99] shadow-emerald-700/20 hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Normalizando bajo plantilla oficial SENA (11 Columnas)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Normalizar y Generar Registro de Asistencia</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
