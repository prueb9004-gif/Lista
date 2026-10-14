import React, { useState } from 'react';
import {
  Printer,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit2,
  Download,
} from 'lucide-react';
import { Apprentice, SessionMetadata } from '../types';
import { exportToCSV, exportToWord, copyTableAsTSV } from '../utils/exporters';

interface DocumentSheetProps {
  metadata: SessionMetadata;
  apprentices: Apprentice[];
  setApprentices: React.Dispatch<React.SetStateAction<Apprentice[]>>;
  reasoning?: string;
}

export const DocumentSheet: React.FC<DocumentSheetProps> = ({
  metadata,
  apprentices,
  setApprentices,
  reasoning,
}) => {
  const [copiedTsv, setCopiedTsv] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleCopyTSV = async () => {
    const success = await copyTableAsTSV(apprentices);
    if (success) {
      setCopiedTsv(true);
      setTimeout(() => setCopiedTsv(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateApprentice = (
    index: number,
    field: keyof Apprentice,
    value: any
  ) => {
    setApprentices((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeleteApprentice = (index: number) => {
    setApprentices((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((item, idx) => ({ ...item, item: idx + 1 }));
    });
  };

  const handleAddApprentice = () => {
    setApprentices((prev) => [
      ...prev,
      {
        item: prev.length + 1,
        fullName: '',
        noDocumento: '',
        planta: '',
        contratista: '',
        otroCual: 'Aprendiz',
        dependenciaEmpresa: metadata.dependenciaEmpresa || `Ficha ${metadata.ficha || ''} - ${metadata.programName || ''}`,
        correoElectronico: '',
        phone: '',
        autorizaGrabacion: 'SÍ',
        signature: '[ ________________ ]',
      },
    ]);
  };

  // Determine Dia, Mes, Ano
  const diaDisplay = metadata.dia || metadata.dayMonth?.match(/\d{1,2}/)?.[0] || '_____';
  const mesDisplay =
    metadata.mes ||
    metadata.dayMonth?.match(/mes[:\s]*(?:de)?\s*([a-zA-ZáéíóúÁÉÍÓÚ]+)/i)?.[1]?.toUpperCase() ||
    '____________';
  const anoDisplay = metadata.ano || '2026';

  // Ensure at least 8 rows are rendered to mirror the institutional paper format
  const minRows = Math.max(apprentices.length, 8);
  const displayRows = Array.from({ length: minRows }).map((_, idx) => apprentices[idx] || null);

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="no-print bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#00324D] uppercase tracking-wider">
            Plantilla Oficial de Asistencia SENA
          </span>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Formato Institucional 2026 (11 Columnas)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`text-xs px-3 py-1.5 rounded-md border font-medium flex items-center gap-1.5 transition ${
              isEditing
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-600" />
            {isEditing ? 'Finalizar Edición' : 'Editar en Tabla'}
          </button>

          <button
            type="button"
            onClick={handleCopyTSV}
            className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md font-medium flex items-center gap-1.5 transition"
          >
            {copiedTsv ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">¡Copiado para Excel!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copiar Tabla</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => exportToCSV(metadata, apprentices)}
            className="text-xs px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-md font-medium flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Descargar Excel (.csv)</span>
          </button>

          <button
            type="button"
            onClick={() => exportToWord(metadata, apprentices, reasoning)}
            className="text-xs px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 rounded-md font-medium flex items-center gap-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5 text-blue-700" />
            <span>Descargar Word (.doc)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="text-xs px-3.5 py-1.5 bg-[#00324D] hover:bg-[#002233] text-white rounded-md font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5 text-[#39A900]" />
            <span>Imprimir / Guardar PDF</span>
          </button>
        </div>
      </div>

      {/* Official SENA Attendance Sheet (Strictly matching the user's template image) */}
      <div className="sena-sheet bg-white rounded-xl shadow-md border border-slate-300 p-6 sm:p-10 max-w-[1240px] mx-auto print:border-none print:shadow-none print:p-0 print:max-w-full">
        {/* Centered SENA Green Logo */}
        <div className="flex flex-col items-center justify-center mb-4">
          <div className="flex flex-col items-center">
            {/* SENA Logo Typography */}
            <span className="text-[#39A900] font-black tracking-widest text-lg sm:text-xl uppercase border-b-2 border-[#39A900] pb-0.5 leading-none px-1">
              SENA
            </span>
            {/* Stylized SENA Symbol */}
            <svg
              viewBox="0 0 100 80"
              className="w-12 h-10 text-[#39A900] fill-current mt-1"
              aria-label="Logo SENA"
            >
              <circle cx="50" cy="14" r="10" />
              <path d="M 28 32 L 72 32 L 80 44 L 62 44 L 62 76 L 38 76 L 38 44 L 20 44 Z" />
            </svg>
          </div>
        </div>

        {/* Institutional Table Container with 1px black borders matching screenshot */}
        <div className="overflow-x-auto border border-black text-black font-sans text-[11px] sm:text-xs">
          <table className="w-full border-collapse">
            <thead>
              {/* Row 1: Document Title Bar */}
              <tr>
                <th
                  colSpan={isEditing ? 12 : 11}
                  className="border border-black py-2 px-3 text-center font-bold tracking-wider uppercase text-xs sm:text-sm bg-white"
                >
                  REGISTRO DE ASISTENCIA / DÍA{' '}
                  <span className="font-bold underline px-2">{diaDisplay}</span> DEL MES DE{' '}
                  <span className="font-bold underline px-3">{mesDisplay}</span> DEL AÑO{' '}
                  <span className="font-bold underline px-1">{anoDisplay}</span>
                </th>
              </tr>

              {/* Row 2: Objetivo(s) Bar */}
              <tr>
                <th className="border border-black py-2 px-2.5 font-bold uppercase text-left w-24 bg-white align-top">
                  OBJETIVO (S)
                </th>
                <td
                  colSpan={isEditing ? 11 : 10}
                  className="border border-black py-2 px-3 font-normal text-left text-slate-800 bg-white"
                >
                  {metadata.objective || 'Desarrollar actividades prácticas de aprendizaje y evaluación formativa.'}
                </td>
              </tr>

              {/* Row 3: Official 11 Columns */}
              <tr className="bg-white text-center font-bold uppercase text-[10px] sm:text-[11px] leading-tight">
                <th className="border border-black py-2 px-1 w-9 text-center">No</th>
                <th className="border border-black py-2 px-2 text-left min-w-[180px]">
                  NOMBRES Y APELLIDOS
                </th>
                <th className="border border-black py-2 px-1.5 w-28 text-center">
                  No. DOCUMENTO
                </th>
                <th className="border border-black py-2 px-1 w-14 text-center">
                  PLANTA
                </th>
                <th className="border border-black py-2 px-1 w-20 text-center">
                  CONTRATISTA
                </th>
                <th className="border border-black py-2 px-1.5 w-20 text-center">
                  OTRO<br />¿CUAL?
                </th>
                <th className="border border-black py-2 px-2 min-w-[140px] text-center">
                  DEPENDENCIA/<br />EMPRESA
                </th>
                <th className="border border-black py-2 px-2 min-w-[160px] text-center">
                  CORREO ELECTRÓNICO
                </th>
                <th className="border border-black py-2 px-1.5 w-24 text-center">
                  TELÉFONO/EXT.
                </th>
                <th className="border border-black py-2 px-1.5 w-20 text-center">
                  AUTORIZA<br />GRABACIÓN
                </th>
                <th className="border border-black py-2 px-2 min-w-[140px] text-center">
                  FIRMA O PARTICIPACIÓN<br />VIRTUAL
                </th>
                {isEditing && (
                  <th className="no-print border border-black py-2 px-1 w-10 text-center bg-red-100 text-red-800">
                    Borrar
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {displayRows.map((apprentice, index) => {
                const rowNo = index + 1;
                const isEmpty = !apprentice;

                return (
                  <tr
                    key={index}
                    className="h-9 hover:bg-slate-50/70 transition-colors bg-white"
                  >
                    {/* 1. No */}
                    <td className="border border-black py-1.5 px-1 text-center font-semibold text-slate-800">
                      {rowNo}
                    </td>

                    {/* 2. NOMBRES Y APELLIDOS */}
                    <td className="border border-black py-1.5 px-2 text-left font-medium text-slate-900">
                      {isEditing && !isEmpty ? (
                        <input
                          type="text"
                          value={apprentice.fullName}
                          onChange={(e) =>
                            handleUpdateApprentice(index, 'fullName', e.target.value)
                          }
                          className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-[11px]"
                        />
                      ) : (
                        apprentice?.fullName || ''
                      )}
                    </td>

                    {/* 3. No. DOCUMENTO */}
                    <td className="border border-black py-1.5 px-1.5 text-center font-mono text-[11px] whitespace-nowrap">
                      {isEditing && !isEmpty ? (
                        <input
                          type="text"
                          value={apprentice.noDocumento || `${apprentice.docType || ''} ${apprentice.docNumber || ''}`}
                          onChange={(e) =>
                            handleUpdateApprentice(index, 'noDocumento', e.target.value)
                          }
                          className="w-full px-1 py-0.5 border border-slate-300 rounded text-[11px] text-center"
                        />
                      ) : (
                        apprentice?.noDocumento ||
                        (apprentice ? `${apprentice.docType || 'CC'} ${apprentice.docNumber || ''}`.trim() : '')
                      )}
                    </td>

                    {/* 4. PLANTA */}
                    <td className="border border-black py-1.5 px-1 text-center font-bold">
                      {isEditing && !isEmpty ? (
                        <input
                          type="checkbox"
                          checked={Boolean(apprentice.planta)}
                          onChange={(e) =>
                            handleUpdateApprentice(index, 'planta', e.target.checked ? 'X' : '')
                          }
                          className="w-3.5 h-3.5 cursor-pointer"
                        />
                      ) : (
                        apprentice?.planta || ''
                      )}
                    </td>

                    {/* 5. CONTRATISTA */}
                    <td className="border border-black py-1.5 px-1 text-center font-bold">
                      {isEditing && !isEmpty ? (
                        <input
                          type="checkbox"
                          checked={Boolean(apprentice.contratista)}
                          onChange={(e) =>
                            handleUpdateApprentice(index, 'contratista', e.target.checked ? 'X' : '')
                          }
                          className="w-3.5 h-3.5 cursor-pointer"
                        />
                      ) : (
                        apprentice?.contratista || ''
                      )}
                    </td>

                    {/* 6. OTRO ¿CUAL? */}
                    <td className="border border-black py-1.5 px-1.5 text-center font-medium">
                      {isEditing && !isEmpty ? (
                        <input
                          type="text"
                          value={apprentice.otroCual || 'Aprendiz'}
                          onChange={(e) =>
                            handleUpdateApprentice(index, 'otroCual', e.target.value)
                          }
                          className="w-full px-1 py-0.5 border border-slate-300 rounded text-[11px] text-center"
                        />
                      ) : (
                        apprentice?.otroCual || (apprentice ? 'Aprendiz' : '')
                      )}
                    </td>

                    {/* 7. DEPENDENCIA/EMPRESA */}
                    <td className="border border-black py-1.5 px-2 text-center text-[10.5px]">
                      {isEditing && !isEmpty ? (
                        <input
                          type="text"
                          value={apprentice.dependenciaEmpresa}
                          onChange={(e) =>
                            handleUpdateApprentice(index, 'dependenciaEmpresa', e.target.value)
                          }
                          className="w-full px-1 py-0.5 border border-slate-300 rounded text-[10.5px]"
                        />
                      ) : (
                        apprentice?.dependenciaEmpresa ||
                        (apprentice
                          ? metadata.dependenciaEmpresa || `Ficha ${metadata.ficha} - ${metadata.programName}`
                          : '')
                      )}
                    </td>

                    {/* 8. CORREO ELECTRÓNICO */}
                    <td className="border border-black py-1.5 px-2 text-left font-mono text-[10px] text-slate-700">
                      {isEditing && !isEmpty ? (
                        <input
                          type="email"
                          value={apprentice.correoElectronico}
                          onChange={(e) =>
                            handleUpdateApprentice(index, 'correoElectronico', e.target.value)
                          }
                          className="w-full px-1 py-0.5 border border-slate-300 rounded text-[10px]"
                        />
                      ) : (
                        apprentice?.correoElectronico || ''
                      )}
                    </td>

                    {/* 9. TELÉFONO/EXT. */}
                    <td className="border border-black py-1.5 px-1.5 text-center font-mono text-[11px] whitespace-nowrap">
                      {isEditing && !isEmpty ? (
                        <input
                          type="text"
                          value={apprentice.phone}
                          onChange={(e) =>
                            handleUpdateApprentice(index, 'phone', e.target.value)
                          }
                          className="w-full px-1 py-0.5 border border-slate-300 rounded text-[11px] text-center"
                        />
                      ) : (
                        apprentice?.phone || ''
                      )}
                    </td>

                    {/* 10. AUTORIZA GRABACIÓN */}
                    <td className="border border-black py-1.5 px-1.5 text-center font-semibold text-[11px]">
                      {isEditing && !isEmpty ? (
                        <select
                          value={apprentice.autorizaGrabacion || 'SÍ'}
                          onChange={(e) =>
                            handleUpdateApprentice(index, 'autorizaGrabacion', e.target.value)
                          }
                          className="px-1 py-0.5 border border-slate-300 rounded text-[10px]"
                        >
                          <option value="SÍ">SÍ</option>
                          <option value="NO">NO</option>
                        </select>
                      ) : (
                        apprentice?.autorizaGrabacion || (apprentice ? 'SÍ' : '')
                      )}
                    </td>

                    {/* 11. FIRMA O PARTICIPACIÓN VIRTUAL */}
                    <td className="border border-black py-1 px-2 text-center font-mono text-[10px] text-slate-400">
                      {apprentice ? (
                        <div className="h-6 flex items-end justify-center border-b border-dashed border-slate-300 pb-0.5">
                          [ ________________ ]
                        </div>
                      ) : (
                        <div className="h-6"></div>
                      )}
                    </td>

                    {/* Delete action row (edit mode only) */}
                    {isEditing && (
                      <td className="no-print border border-black py-1 text-center">
                        {apprentice && (
                          <button
                            type="button"
                            onClick={() => handleDeleteApprentice(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add Row Button (Editing only) */}
        {isEditing && (
          <div className="no-print mt-3 flex justify-start">
            <button
              type="button"
              onClick={handleAddApprentice}
              className="text-xs px-3 py-1.5 bg-[#39A900]/10 hover:bg-[#39A900]/20 text-[#39A900] border border-[#39A900]/30 font-semibold rounded-md flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Fila al Registro de Asistencia</span>
            </button>
          </div>
        )}

        {/* Institutional Sign-off footer */}
        <div className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 border-t border-slate-200">
          <div>
            <strong>Responsable de la Sesión:</strong>{' '}
            {metadata.instructor || 'Instructor Titular / Formador SENA'}
          </div>
          <div>
            <strong>Dependencia:</strong>{' '}
            {metadata.center || 'Centro de Formación SENA'} - {metadata.regional || 'Regional SENA'}
          </div>
          <div className="font-mono text-[10px]">
            SENA | Formato Institucional de Registro de Asistencia
          </div>
        </div>
      </div>
    </div>
  );
};
