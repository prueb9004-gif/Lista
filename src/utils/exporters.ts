import { Apprentice, SessionMetadata } from '../types';

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch((err) => {
      console.error('Clipboard copy failed:', err);
      return false;
    });
}

export function copyTableAsTSV(apprentices: Apprentice[]): Promise<boolean> {
  const headers = [
    'No',
    'NOMBRES Y APELLIDOS',
    'No. DOCUMENTO',
    'PLANTA',
    'CONTRATISTA',
    'OTRO ¿CUAL?',
    'DEPENDENCIA/EMPRESA',
    'CORREO ELECTRÓNICO',
    'TELÉFONO/EXT.',
    'AUTORIZA GRABACIÓN',
    'FIRMA O PARTICIPACIÓN VIRTUAL',
  ];

  const rows = apprentices.map((a) => [
    a.item,
    a.fullName,
    a.noDocumento || `${a.docType || 'CC'} ${a.docNumber || ''}`.trim(),
    a.planta ? 'X' : '',
    a.contratista ? 'X' : '',
    a.otroCual || 'Aprendiz',
    a.dependenciaEmpresa,
    a.correoElectronico || '',
    a.phone,
    a.autorizaGrabacion || 'SÍ',
    a.signature || '[ ________________ ]',
  ]);

  const tsv = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
  return copyToClipboard(tsv);
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV(metadata: SessionMetadata, apprentices: Apprentice[]) {
  const cleanFicha = metadata.ficha.replace(/[^\w-]/g, '') || 'SENA';
  const filename = `REGISTRO_ASISTENCIA_SENA_Ficha_${cleanFicha}.csv`;

  const dia = metadata.dia || metadata.dayMonth?.match(/\d{1,2}/)?.[0] || '14';
  const mes =
    metadata.mes ||
    metadata.dayMonth?.match(/mes[:\s]*(?:de)?\s*([a-zA-ZáéíóúÁÉÍÓÚ]+)/i)?.[1]?.toUpperCase() ||
    'MARZO';
  const ano = metadata.ano || '2026';

  const headerMeta = [
    `"REGISTRO DE ASISTENCIA / DÍA ${dia} DEL MES DE ${mes} DEL AÑO ${ano}"`,
    `"OBJETIVO (S)","${(metadata.objective || '').replace(/"/g, '""')}"`,
    '',
    `"No","NOMBRES Y APELLIDOS","No. DOCUMENTO","PLANTA","CONTRATISTA","OTRO ¿CUAL?","DEPENDENCIA/EMPRESA","CORREO ELECTRÓNICO","TELÉFONO/EXT.","AUTORIZA GRABACIÓN","FIRMA O PARTICIPACIÓN VIRTUAL"`,
  ];

  const dataRows = apprentices.map(
    (a) =>
      `"${a.item}","${a.fullName.replace(/"/g, '""')}","${(
        a.noDocumento || `${a.docType || ''} ${a.docNumber || ''}`
      ).trim()}","${a.planta ? 'X' : ''}","${a.contratista ? 'X' : ''}","${(
        a.otroCual || 'Aprendiz'
      ).replace(/"/g, '""')}","${(a.dependenciaEmpresa || '').replace(
        /"/g,
        '""'
      )}","${a.correoElectronico || ''}","${a.phone}","${
        a.autorizaGrabacion || 'SÍ'
      }","${a.signature || '[ ________________ ]'}"`
  );

  const fullContent = '\uFEFF' + [...headerMeta, ...dataRows].join('\r\n');
  downloadFile(fullContent, filename, 'text/csv;charset=utf-8;');
}

export function exportToWord(metadata: SessionMetadata, apprentices: Apprentice[], reasoning?: string) {
  const cleanFicha = metadata.ficha.replace(/[^\w-]/g, '') || 'SENA';
  const filename = `REGISTRO_ASISTENCIA_SENA_Ficha_${cleanFicha}.doc`;

  const dia = metadata.dia || metadata.dayMonth?.match(/\d{1,2}/)?.[0] || '_____';
  const mes =
    metadata.mes ||
    metadata.dayMonth?.match(/mes[:\s]*(?:de)?\s*([a-zA-ZáéíóúÁÉÍÓÚ]+)/i)?.[1]?.toUpperCase() ||
    '____________';
  const ano = metadata.ano || '2026';

  const minRows = Math.max(apprentices.length, 8);
  const rowsToRender = Array.from({ length: minRows }).map((_, i) => apprentices[i] || null);

  const html = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>REGISTRO DE ASISTENCIA SENA</title>
  <style>
    body { font-family: 'Arial', sans-serif; font-size: 9.5pt; color: #000; margin: 20px; }
    .logo-container { text-align: center; margin-bottom: 15px; }
    .logo-text { font-size: 16pt; font-weight: bold; color: #39A900; letter-spacing: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1.5pt solid black; }
    th, td { border: 1pt solid black; padding: 4.5pt 3pt; font-size: 8.5pt; }
    .title-row { font-size: 10.5pt; font-weight: bold; text-align: center; padding: 6pt; letter-spacing: 0.5px; }
    .header-col { font-weight: bold; text-align: center; font-size: 8pt; vertical-align: middle; }
    .align-center { text-align: center; }
    .align-left { text-align: left; }
    .signature-cell { text-align: center; color: #555; font-family: monospace; font-size: 7.5pt; }
  </style>
</head>
<body>
  <div class="logo-container">
    <div class="logo-text">SENA</div>
    <div style="font-size: 18pt; color: #39A900; font-weight: bold; line-height: 0.8;">▲</div>
  </div>

  <table>
    <!-- Titulo del Registro -->
    <tr>
      <th colspan="11" class="title-row">
        REGISTRO DE ASISTENCIA / DÍA <u>&nbsp; ${dia} &nbsp;</u> DEL MES DE <u>&nbsp; ${mes} &nbsp;</u> DEL AÑO <u>&nbsp; ${ano} &nbsp;</u>
      </th>
    </tr>

    <!-- Fila Objetivo -->
    <tr>
      <th style="width: 80pt; text-align: left; vertical-align: top; font-weight: bold;">
        OBJETIVO (S)
      </th>
      <td colspan="10" style="text-align: left;">
        ${metadata.objective || 'Desarrollar actividades de formación pedagógica y técnica de aprendizaje.'}
      </td>
    </tr>

    <!-- Encabezados de las 11 Columnas Oficiales -->
    <tr style="background-color: #fcfcfc;">
      <th class="header-col" style="width: 20pt;">No</th>
      <th class="header-col" style="width: 140pt; text-align: left;">NOMBRES Y APELLIDOS</th>
      <th class="header-col" style="width: 75pt;">No. DOCUMENTO</th>
      <th class="header-col" style="width: 35pt;">PLANTA</th>
      <th class="header-col" style="width: 45pt;">CONTRATISTA</th>
      <th class="header-col" style="width: 45pt;">OTRO<br>¿CUAL?</th>
      <th class="header-col" style="width: 90pt;">DEPENDENCIA/<br>EMPRESA</th>
      <th class="header-col" style="width: 110pt;">CORREO ELECTRÓNICO</th>
      <th class="header-col" style="width: 65pt;">TELÉFONO/EXT.</th>
      <th class="header-col" style="width: 50pt;">AUTORIZA<br>GRABACIÓN</th>
      <th class="header-col" style="width: 95pt;">FIRMA O PARTICIPACIÓN<br>VIRTUAL</th>
    </tr>

    <!-- Filas de Aprendices -->
    ${rowsToRender
      .map((apprentice, idx) => {
        const no = idx + 1;
        if (!apprentice) {
          return `
          <tr style="height: 22pt;">
            <td class="align-center font-bold">${no}</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>`;
        }

        return `
        <tr style="height: 22pt;">
          <td class="align-center font-bold">${no}</td>
          <td class="align-left">${apprentice.fullName}</td>
          <td class="align-center font-mono">${apprentice.noDocumento || `${apprentice.docType || ''} ${apprentice.docNumber || ''}`.trim()}</td>
          <td class="align-center font-bold">${apprentice.planta ? 'X' : ''}</td>
          <td class="align-center font-bold">${apprentice.contratista ? 'X' : ''}</td>
          <td class="align-center">${apprentice.otroCual || 'Aprendiz'}</td>
          <td class="align-center" style="font-size: 7.5pt;">${apprentice.dependenciaEmpresa || `Ficha ${metadata.ficha} - ${metadata.programName}`}</td>
          <td class="align-left" style="font-size: 7.5pt; font-family: monospace;">${apprentice.correoElectronico || ''}</td>
          <td class="align-center font-mono">${apprentice.phone || ''}</td>
          <td class="align-center font-bold">${apprentice.autorizaGrabacion || 'SÍ'}</td>
          <td class="signature-cell">[ ________________ ]</td>
        </tr>`;
      })
      .join('')}
  </table>

  <br>
  <div style="font-size: 8.5pt; color: #444; margin-top: 20px;">
    <strong>Responsable:</strong> ${metadata.instructor || 'Instructor Técnico Titular'}&nbsp;&nbsp;|&nbsp;&nbsp;
    <strong>Centro:</strong> ${metadata.center || 'Centro de Formación SENA'}&nbsp;&nbsp;|&nbsp;&nbsp;
    <strong>Regional:</strong> ${metadata.regional || 'SENA'}
  </div>
</body>
</html>`;

  downloadFile(html, filename, 'application/msword;charset=utf-8');
}

export function downloadSampleEnrollmentWord() {
  const filename = 'plantilla_asistencia_sena_11_columnas.doc';
  const html = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>REGISTRO DE ASISTENCIA SENA</title>
  <style>
    body { font-family: 'Arial', sans-serif; font-size: 9.5pt; color: #000; margin: 20px; }
    .logo-container { text-align: center; margin-bottom: 15px; }
    .logo-text { font-size: 16pt; font-weight: bold; color: #39A900; letter-spacing: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1.5pt solid black; }
    th, td { border: 1pt solid black; padding: 4.5pt 3pt; font-size: 8.5pt; }
    .title-row { font-size: 10.5pt; font-weight: bold; text-align: center; padding: 6pt; }
    .header-col { font-weight: bold; text-align: center; font-size: 8pt; vertical-align: middle; }
    .align-center { text-align: center; }
    .align-left { text-align: left; }
    .signature-cell { text-align: center; color: #555; font-family: monospace; font-size: 7.5pt; }
  </style>
</head>
<body>
  <div class="logo-container">
    <div class="logo-text">SENA</div>
    <div style="font-size: 18pt; color: #39A900; font-weight: bold; line-height: 0.8;">▲</div>
  </div>

  <table>
    <tr>
      <th colspan="11" class="title-row">
        REGISTRO DE ASISTENCIA / DÍA <u>&nbsp; 14 &nbsp;</u> DEL MES DE <u>&nbsp; MARZO &nbsp;</u> DEL AÑO <u>&nbsp; 2026 &nbsp;</u>
      </th>
    </tr>
    <tr>
      <th style="width: 80pt; text-align: left; vertical-align: top; font-weight: bold;">
        OBJETIVO (S)
      </th>
      <td colspan="10" style="text-align: left;">
        Desarrollar habilidades prácticas en control de versiones con Git y GitHub en entornos colaborativos.
      </td>
    </tr>
    <tr style="background-color: #fcfcfc;">
      <th class="header-col" style="width: 20pt;">No</th>
      <th class="header-col" style="width: 140pt; text-align: left;">NOMBRES Y APELLIDOS</th>
      <th class="header-col" style="width: 75pt;">No. DOCUMENTO</th>
      <th class="header-col" style="width: 35pt;">PLANTA</th>
      <th class="header-col" style="width: 45pt;">CONTRATISTA</th>
      <th class="header-col" style="width: 45pt;">OTRO<br>¿CUAL?</th>
      <th class="header-col" style="width: 90pt;">DEPENDENCIA/<br>EMPRESA</th>
      <th class="header-col" style="width: 110pt;">CORREO ELECTRÓNICO</th>
      <th class="header-col" style="width: 65pt;">TELÉFONO/EXT.</th>
      <th class="header-col" style="width: 50pt;">AUTORIZA<br>GRABACIÓN</th>
      <th class="header-col" style="width: 95pt;">FIRMA O PARTICIPACIÓN<br>VIRTUAL</th>
    </tr>
    <tr>
      <td class="align-center font-bold">1</td>
      <td class="align-left">Gómez, María</td>
      <td class="align-center font-mono">TI 101234568</td>
      <td class="align-center"></td>
      <td class="align-center"></td>
      <td class="align-center">Aprendiz</td>
      <td class="align-center" style="font-size: 7.5pt;">Ficha 2678901 - ADSO</td>
      <td class="align-left" style="font-size: 7.5pt; font-family: monospace;">mgomez@soy.sena.edu.co</td>
      <td class="align-center font-mono">3209876543</td>
      <td class="align-center font-bold">SÍ</td>
      <td class="signature-cell">[ ________________ ]</td>
    </tr>
    <tr>
      <td class="align-center font-bold">2</td>
      <td class="align-left">Pérez, Juan</td>
      <td class="align-center font-mono">CC 100234567</td>
      <td class="align-center"></td>
      <td class="align-center"></td>
      <td class="align-center">Aprendiz</td>
      <td class="align-center" style="font-size: 7.5pt;">Ficha 2678901 - ADSO</td>
      <td class="align-left" style="font-size: 7.5pt; font-family: monospace;">jperez@soy.sena.edu.co</td>
      <td class="align-center font-mono">3105551234</td>
      <td class="align-center font-bold">SÍ</td>
      <td class="signature-cell">[ ________________ ]</td>
    </tr>
    <tr><td class="align-center font-bold">3</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    <tr><td class="align-center font-bold">4</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    <tr><td class="align-center font-bold">5</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    <tr><td class="align-center font-bold">6</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    <tr><td class="align-center font-bold">7</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    <tr><td class="align-center font-bold">8</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  </table>
</body>
</html>`;

  downloadFile(html, filename, 'application/msword;charset=utf-8');
}
