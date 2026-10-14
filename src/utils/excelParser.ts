import * as XLSX from 'xlsx';
import { Apprentice, SessionMetadata } from '../types';

export interface ParsedExcelResult {
  metadata: Partial<SessionMetadata>;
  apprentices: Apprentice[];
  rawLines: string[];
  totalLearners: number;
  fileName: string;
}

export function parseExcelWorkbook(data: ArrayBuffer, fileName: string): ParsedExcelResult {
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to 2D array of rows
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  const metadata: Partial<SessionMetadata> = {};
  let headerRowIndex = -1;
  let colMap: Record<string, number> = {};

  // 1. Scan the first few rows (up to 15) for metadata labels
  for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
    const row = rawRows[r];
    const rowText = row.map((c) => String(c || '').trim()).join(' ');

    if (!metadata.programName) {
      const progMatch = rowText.match(/(?:programa(?: de formaci[oó]n)?|denominaci[oó]n|curso)\s*[:.-]?\s*([^\n\r,;|]+)/i);
      if (progMatch) metadata.programName = progMatch[1].trim();
    }

    if (!metadata.ficha) {
      const fichaMatch = rowText.match(/(?:ficha(?: de caracterizaci[oó]n)?|c[oó]digo ficha|grupo)\s*[:#.-]?\s*(\d{6,8})/i);
      if (fichaMatch) {
        metadata.ficha = fichaMatch[1].trim();
      } else {
        const genFicha = rowText.match(/\b(2\d{6})\b/);
        if (genFicha) metadata.ficha = genFicha[1];
      }
    }

    if (!metadata.objective) {
      const objMatch = rowText.match(/(?:objetivo(?:s)?|taller|competencia|resultado)\s*[:.-]?\s*([^\n\r;|]+)/i);
      if (objMatch) metadata.objective = objMatch[1].trim();
    }

    if (!metadata.dia || !metadata.mes) {
      const dateMatch = rowText.match(/(?:fecha|d[ií]a)\s*[:.-]?\s*([^\n\r;|]+)/i);
      if (dateMatch) {
        metadata.dayMonth = dateMatch[1].trim();
      }
    }

    if (!metadata.center) {
      const centerMatch = rowText.match(/(?:centro(?: de formaci[oó]n)?)\s*[:.-]?\s*([^\n\r;|]+)/i);
      if (centerMatch) metadata.center = centerMatch[1].trim();
    }

    if (!metadata.regional) {
      const regionalMatch = rowText.match(/(?:regional)\s*[:.-]?\s*([^\n\r;|]+)/i);
      if (regionalMatch) metadata.regional = regionalMatch[1].trim();
    }

    if (!metadata.instructor) {
      const instMatch = rowText.match(/(?:instructor|formador|tutor|responsable)\s*[:.-]?\s*([^\n\r;|]+)/i);
      if (instMatch) metadata.instructor = instMatch[1].trim();
    }

    // 2. Look for table headers row
    const normalizedCols = row.map((cell) =>
      String(cell || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    );

    const hasNameCol = normalizedCols.some(
      (c) =>
        c.includes('nombre') ||
        c.includes('apellido') ||
        c.includes('aprendiz') ||
        c === 'nombre completo'
    );
    const hasDocCol = normalizedCols.some(
      (c) =>
        c.includes('documento') ||
        c.includes('identificacion') ||
        c.includes('cedula') ||
        c === 'no. doc' ||
        c === 'numero documento'
    );

    if (hasNameCol && hasDocCol) {
      headerRowIndex = r;
      normalizedCols.forEach((col, idx) => {
        if (col.includes('primer apellido') || col === 'apellido 1') colMap['primerApellido'] = idx;
        else if (col.includes('segundo apellido') || col === 'apellido 2') colMap['segundoApellido'] = idx;
        else if (col.includes('primer nombre') || col === 'nombre 1') colMap['primerNombre'] = idx;
        else if (col.includes('segundo nombre') || col === 'nombre 2') colMap['segundoNombre'] = idx;
        else if (col.includes('apellido') && col.includes('nombre')) colMap['nombreCompleto'] = idx;
        else if (col.includes('nombre') || col.includes('aprendiz')) colMap['nombre'] = idx;
        else if (col.includes('apellido')) colMap['apellido'] = idx;

        if (col.includes('tipo') && (col.includes('doc') || col.includes('identifica'))) colMap['tipoDoc'] = idx;
        if (
          (col.includes('documento') || col.includes('identificacion') || col.includes('numero')) &&
          !col.includes('tipo')
        )
          colMap['numeroDoc'] = idx;

        if (col.includes('telefono') || col.includes('celular') || col.includes('movil') || col.includes('tel'))
          colMap['telefono'] = idx;

        if (col.includes('correo') || col.includes('email') || col.includes('mail')) colMap['correo'] = idx;

        if (col.includes('dependencia') || col.includes('empresa') || col.includes('ficha') || col.includes('programa'))
          colMap['dependencia'] = idx;

        if (col.includes('autoriza') || col.includes('grabacion')) colMap['autoriza'] = idx;
        if (col.includes('vinculacion') || col.includes('planta') || col.includes('rol')) colMap['vinculacion'] = idx;
      });
      break;
    }
  }

  const apprentices: Apprentice[] = [];
  const rawLines: string[] = [];
  const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    // Check if row has any content
    const nonEmptyCells = row.filter((c) => String(c || '').trim().length > 0);
    if (nonEmptyCells.length === 0) continue;

    let fullName = '';
    let docType = 'CC';
    let docNumber = '';
    let phone = '';
    let email = '';
    let dependencia = metadata.dependenciaEmpresa || `Ficha ${metadata.ficha || ''} - ${metadata.programName || ''}`;
    let autoriza = 'SÍ';
    let planta = '';
    let contratista = '';
    let otroCual = 'Aprendiz';

    if (headerRowIndex !== -1) {
      // Extract using mapped columns
      if (colMap['primerApellido'] !== undefined && colMap['primerNombre'] !== undefined) {
        const pAp = String(row[colMap['primerApellido']] || '').trim();
        const sAp = colMap['segundoApellido'] !== undefined ? String(row[colMap['segundoApellido']] || '').trim() : '';
        const pNom = String(row[colMap['primerNombre']] || '').trim();
        const sNom = colMap['segundoNombre'] !== undefined ? String(row[colMap['segundoNombre']] || '').trim() : '';

        const apellidos = [pAp, sAp].filter(Boolean).join(' ');
        const nombres = [pNom, sNom].filter(Boolean).join(' ');
        fullName = `${apellidos}, ${nombres}`.trim();
      } else if (colMap['nombreCompleto'] !== undefined) {
        fullName = String(row[colMap['nombreCompleto']] || '').trim();
      } else if (colMap['apellido'] !== undefined && colMap['nombre'] !== undefined) {
        const ap = String(row[colMap['apellido']] || '').trim();
        const nom = String(row[colMap['nombre']] || '').trim();
        fullName = `${ap}, ${nom}`.trim();
      } else if (colMap['nombre'] !== undefined) {
        fullName = String(row[colMap['nombre']] || '').trim();
      }

      if (colMap['tipoDoc'] !== undefined) {
        const val = String(row[colMap['tipoDoc']] || '').trim().toUpperCase();
        if (val) docType = val;
      }

      if (colMap['numeroDoc'] !== undefined) {
        docNumber = String(row[colMap['numeroDoc']] || '').replace(/[^\d]/g, '');
      }

      if (colMap['telefono'] !== undefined) {
        phone = String(row[colMap['telefono']] || '').replace(/[^\d]/g, '');
      }

      if (colMap['correo'] !== undefined) {
        email = String(row[colMap['correo']] || '').trim().toLowerCase();
      }

      if (colMap['dependencia'] !== undefined && row[colMap['dependencia']]) {
        dependencia = String(row[colMap['dependencia']]).trim();
      }

      if (colMap['autoriza'] !== undefined && row[colMap['autoriza']]) {
        autoriza = String(row[colMap['autoriza']]).trim().toUpperCase();
      }

      if (colMap['vinculacion'] !== undefined) {
        const vinc = String(row[colMap['vinculacion']] || '').toLowerCase();
        if (vinc.includes('planta')) planta = 'X';
        else if (vinc.includes('contratista')) contratista = 'X';
        else if (vinc) otroCual = String(row[colMap['vinculacion']]).trim();
      }
    } else {
      // Fallback row parser: inspect each cell by pattern
      for (const cell of row) {
        const str = String(cell || '').trim();
        if (!str) continue;

        if (/@/.test(str)) {
          email = str.toLowerCase();
        } else if (/^(?:CC|TI|CE|PPT|PEP|PAS)$/i.test(str)) {
          docType = str.toUpperCase();
        } else if (/^\d{7,10}$/.test(str)) {
          if (str.startsWith('3') && !phone) {
            phone = str;
          } else if (!docNumber) {
            docNumber = str;
          }
        } else if (/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s,.-]{4,}$/.test(str) && !fullName) {
          fullName = str;
        }
      }
    }

    // Clean and validate
    if (!fullName && !docNumber) continue;

    // Title case for name
    const nameWords = (fullName || 'Aprendiz')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

    const cleanFullName = nameWords.join(' ');

    // Generate standard institutional email if missing
    if (!email && nameWords.length >= 2) {
      const cleanFirst = nameWords[nameWords.length - 1]
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      const cleanLast = nameWords[0]
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      email = `${cleanFirst.charAt(0)}${cleanLast}@soy.sena.edu.co`;
    }

    const noDoc = `${docType} ${docNumber || ''}`.trim();

    apprentices.push({
      item: apprentices.length + 1,
      fullName: cleanFullName,
      docType,
      docNumber,
      noDocumento: noDoc || 'Pendiente',
      planta,
      contratista,
      otroCual: otroCual || 'Aprendiz',
      dependenciaEmpresa: dependencia,
      correoElectronico: email || 'No Registra',
      phone: phone || 'No Registra',
      autorizaGrabacion: autoriza || 'SÍ',
      signature: '[ ________________ ]',
      status: 'Asiste',
    });

    rawLines.push(
      `${cleanFullName}, ${noDoc || 'CC 000'}, cel ${phone || '3000000000'}${email ? `, email: ${email}` : ''}`
    );
  }

  // Sort apprentices alphabetically A-Z by full name
  apprentices.sort((a, b) => a.fullName.localeCompare(b.fullName, 'es', { sensitivity: 'base' }));
  apprentices.forEach((app, idx) => {
    app.item = idx + 1;
  });

  return {
    metadata,
    apprentices,
    rawLines,
    totalLearners: apprentices.length,
    fileName,
  };
}

export function downloadSampleEnrollmentExcel() {
  const data = [
    ['SERVICIO NACIONAL DE APRENDIZAJE - SENA'],
    ['REPORTE OFICIAL DE APRENDICES MATRICULADOS - SOFIAPLUS'],
    ['Programa de Formación:', 'Tecnólogo en Análisis y Desarrollo de Software (ADSO)'],
    ['Número de Ficha:', '2824510'],
    ['Objetivo de la Formación:', 'Desarrollar componentes backend seguros y bases de datos relacionales.'],
    ['Fecha:', 'Día 14 del mes de Octubre del año 2026'],
    ['Centro de Formación:', 'Centro de Servicios y Gestión Empresarial'],
    ['Regional:', 'Regional Antioquia'],
    ['Instructor:', 'Ing. Carlos Mendoza'],
    [],
    [
      'No',
      'Primer Apellido',
      'Segundo Apellido',
      'Primer Nombre',
      'Segundo Nombre',
      'Tipo Doc',
      'No. Documento',
      'Celular / Teléfono',
      'Correo Institucional',
      'Vinculación',
      'Dependencia / Ficha',
      'Autoriza Grabación',
    ],
    ['1', 'Gómez', 'Restrepo', 'María', 'Camila', 'TI', '101234568', '3209876543', 'mgomez@soy.sena.edu.co', 'Aprendiz', 'Ficha 2824510 - ADSO', 'SÍ'],
    ['2', 'Pérez', 'Sánchez', 'Juan', 'David', 'CC', '100234567', '3105551234', 'jperez@soy.sena.edu.co', 'Aprendiz', 'Ficha 2824510 - ADSO', 'SÍ'],
    ['3', 'Rodríguez', 'Castro', 'Andrés', 'Felipe', 'CC', '1035678912', '3157894561', 'rodriguez.a@soy.sena.edu.co', 'Aprendiz', 'Ficha 2824510 - ADSO', 'SÍ'],
    ['4', 'Valencia', 'Cardona', 'Alejandro', '', 'CC', '1098456120', '3184567890', 'avalencia@soy.sena.edu.co', 'Aprendiz', 'Ficha 2824510 - ADSO', 'SÍ'],
    ['5', 'Castaño', 'Ríos', 'Valentina', '', 'TI', '1099456789', '3123456789', 'vcastano@soy.sena.edu.co', 'Aprendiz', 'Ficha 2824510 - ADSO', 'SÍ'],
    ['6', 'Guerrero', 'Rentería', 'Juan', 'Camilo', 'CC', '1144567891', '3209871234', 'jguerrero@soy.sena.edu.co', 'Aprendiz', 'Ficha 2824510 - ADSO', 'SÍ'],
    ['7', 'Solarte', 'Muñoz', 'Luisa', 'Fernanda', 'TI', '1099234567', '3176543210', 'lsolarte@soy.sena.edu.co', 'Aprendiz', 'Ficha 2824510 - ADSO', 'SÍ'],
    ['8', 'Hernández', 'Pineda', 'Sofía', '', 'CC', '1022345671', '3198765432', 'shernandez@soy.sena.edu.co', 'Aprendiz', 'Ficha 2824510 - ADSO', 'SÍ'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set nice column widths
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 16 }, // Primer Apellido
    { wch: 16 }, // Segundo Apellido
    { wch: 16 }, // Primer Nombre
    { wch: 16 }, // Segundo Nombre
    { wch: 10 }, // Tipo Doc
    { wch: 16 }, // No. Documento
    { wch: 18 }, // Celular
    { wch: 28 }, // Correo
    { wch: 12 }, // Vinculacion
    { wch: 26 }, // Dependencia
    { wch: 18 }, // Autoriza Grabacion
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Matricula_SENA');
  XLSX.writeFile(wb, 'plantilla_matricula_sena_ejemplo.xlsx');
}
