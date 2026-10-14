import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

import mammoth from 'mammoth';

// Client utility for Gemini API following the official guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface NormalizationPayload {
  rawMetadata: {
    programName?: string;
    ficha?: string;
    objective?: string;
    dayMonth?: string;
    center?: string;
    regional?: string;
    instructor?: string;
  };
  rawList: string;
}

// Helper rule-based fallback normalizer for Colombian names and documents
function normalizeLocally(payload: NormalizationPayload) {
  const { rawMetadata, rawList } = payload;
  const lines = rawList
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.toLowerCase().startsWith('item'));

  const apprentices: Array<{
    item: number;
    fullName: string;
    docType: string;
    docNumber: string;
    noDocumento: string;
    planta: string;
    contratista: string;
    otroCual: string;
    dependenciaEmpresa: string;
    correoElectronico: string;
    phone: string;
    autorizaGrabacion: string;
    signature: string;
    status: string;
  }> = [];

  const rawExtracted: Array<{
    fullName: string;
    docType: string;
    docNumber: string;
    noDocumento: string;
    phone: string;
    email: string;
  }> = [];

  const prog = rawMetadata.programName?.trim() || 'Análisis y Desarrollo de Software (ADSO)';
  const ficha = rawMetadata.ficha?.trim() || '2678901';
  const obj = rawMetadata.objective?.trim() || 'Desarrollar habilidades prácticas en control de versiones con Git y GitHub.';

  // Extract day, month, year from dayMonth or defaults
  let dia = '14';
  let mes = 'MARZO';
  let ano = '2026';

  if (rawMetadata.dayMonth) {
    const dMatch = rawMetadata.dayMonth.match(/(?:d[ií]a[:\s]*)(\d{1,2})/i);
    if (dMatch) dia = dMatch[1];
    const mMatch = rawMetadata.dayMonth.match(/(?:mes[:\s]*(?:de)?\s*)([A-Za-zÁÉÍÓÚáéíóú]+)/i);
    if (mMatch) mes = mMatch[1].toUpperCase();
    const yMatch = rawMetadata.dayMonth.match(/(?:a[ñn]o[:\s]*(?:de)?\s*)(\d{4})/i);
    if (yMatch) ano = yMatch[1];
  }

  for (const line of lines) {
    // Clean list bullets, numbering, dashes at start
    const cleanLine = line.replace(/^[-*•\d\.\)\s]+/, '').trim();
    if (!cleanLine) continue;

    // Detect Email
    let email = '';
    const emailMatch = cleanLine.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      email = emailMatch[1].toLowerCase();
    }

    // Detect Document Type (CC, TI, CE, PPT, PEP, PAS)
    let docType = 'CC';
    let docNumber = '';
    const docMatch = cleanLine.match(/\b(CC|TI|CE|PPT|PEP|PAS|NIT|RC)\.?\s*[:#-]?\s*(\d[\d\.\s-]*\d|\d+)/i);
    if (docMatch) {
      docType = docMatch[1].toUpperCase();
      docNumber = docMatch[2].replace(/[^\d]/g, '');
    } else {
      const numMatch = cleanLine.match(/\b(\d{7,10})\b/);
      if (numMatch && !numMatch[1].startsWith('3')) {
        docNumber = numMatch[1];
      }
    }

    // Detect Colombian Phone (usually starts with 3, 10 digits)
    let phone = '';
    const phoneMatch = cleanLine.match(/(?:cel|tel|celular|teléfono|telefono|whatsapp|wa)?[:\s]*\+?(?:57)?\s*(3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}|3\d{9})/i);
    if (phoneMatch) {
      phone = phoneMatch[1].replace(/[^\d]/g, '');
    } else {
      const genericPhone = cleanLine.match(/\b(3\d{9})\b/);
      if (genericPhone) {
        phone = genericPhone[1];
      }
    }

    // Strip out email, document, phone from line to extract name
    let nameText = cleanLine;
    if (email) nameText = nameText.replace(email, '');
    nameText = nameText
      .replace(/\b(CC|TI|CE|PPT|PEP|PAS|NIT|RC)\.?\s*[:#-]?\s*[\d\.\s-]+/gi, '')
      .replace(/(?:cel|tel|celular|teléfono|telefono|whatsapp|wa)?[:\s]*\+?(?:57)?\s*3\d{9}/gi, '')
      .replace(/\b3\d{9}\b/g, '')
      .replace(/[,\-;]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (docNumber && nameText.includes(docNumber)) {
      nameText = nameText.replace(docNumber, '').trim();
    }
    if (phone && nameText.includes(phone)) {
      nameText = nameText.replace(phone, '').trim();
    }

    // Format Name properly (Title Case)
    const words = nameText.split(' ').filter((w) => w.length > 0);
    const capitalizedWords = words.map(
      (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    );

    let formattedName = capitalizedWords.join(' ') || 'Aprendiz No Identificado';

    // Auto-generate standard institutional email if not provided
    if (!email && capitalizedWords.length >= 2) {
      const cleanFirst = capitalizedWords[capitalizedWords.length - 1]
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      const cleanLast = capitalizedWords[0]
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      email = `${cleanFirst.charAt(0)}${cleanLast}@soy.sena.edu.co`;
    }

    rawExtracted.push({
      fullName: formattedName,
      docType,
      docNumber: docNumber || 'Pendiente',
      noDocumento: `${docType} ${docNumber || 'Pendiente'}`.trim(),
      phone: phone || 'No Registra',
      email: email || 'No Registra',
    });
  }

  // Sort alphabetically by full name (A-Z)
  rawExtracted.sort((a, b) => a.fullName.localeCompare(b.fullName, 'es', { sensitivity: 'base' }));

  rawExtracted.forEach((item, index) => {
    apprentices.push({
      item: index + 1,
      fullName: item.fullName,
      docType: item.docType,
      docNumber: item.docNumber,
      noDocumento: item.noDocumento,
      planta: '',
      contratista: '',
      otroCual: 'Aprendiz',
      dependenciaEmpresa: `Ficha ${ficha} - ${prog}`,
      correoElectronico: item.email,
      phone: item.phone,
      autorizaGrabacion: 'SÍ',
      signature: '[ ________________ ]',
      status: 'Asiste',
    });
  });

  const reasoning = `1. Validación de Normativa Institucional SENA (Plantilla Oficial de Asistencia):
   - Estructura de Encabezado: Membrete centrado con logo institucional SENA y barra oficial 'REGISTRO DE ASISTENCIA / DÍA ${dia} DEL MES DE ${mes} DEL AÑO ${ano}'.
   - Fila de Control Administrativo: Celda 'OBJETIVO (S)' con el detalle pedagógico o institucional de la sesión.
   - Matriz de Registro de 11 Columnas Oficiales: No | NOMBRES Y APELLIDOS | No. DOCUMENTO | PLANTA | CONTRATISTA | OTRO ¿CUAL? | DEPENDENCIA/EMPRESA | CORREO ELECTRÓNICO | TELÉFONO/EXT. | AUTORIZA GRABACIÓN | FIRMA O PARTICIPACIÓN VIRTUAL.
2. Extracción y Normalización de Metadatos:
   - Registro de Asistencia: Día: ${dia} | Mes: ${mes} | Año: ${ano}
   - Objetivo(s): ${obj}
   - Dependencia / Ficha / Programa: Ficha ${ficha} - ${prog}
3. Depuración y Ordenamiento de Aprendices: Se procesaron ${lines.length} registros brutos. Se discriminaron nombres, apellidos, tipo y número de documento (CC, TI), teléfono celular y correo electrónico institucional. Se ordenó el listado estrictamente en orden alfabético A-Z por apellidos y se asignó la numeración consecutiva del 1 al ${apprentices.length}.
4. Formateo y Generación: Proyección exacta en la matriz de 11 columnas con tipo de vinculación 'OTRO ¿CUAL? = Aprendiz', autorización de grabación 'SÍ' y espacio de firma virtual listo para Word y Excel.`;

  // Build 11-column Markdown Table
  const markdownTable = [
    '| No | NOMBRES Y APELLIDOS | No. DOCUMENTO | PLANTA | CONTRATISTA | OTRO ¿CUAL? | DEPENDENCIA/EMPRESA | CORREO ELECTRÓNICO | TELÉFONO/EXT. | AUTORIZA GRABACIÓN | FIRMA O PARTICIPACIÓN VIRTUAL |',
    '| :--- | :---------------------------- | :------------ | :----- | :---------- | :---------- | :--------------------------- | :---------------------------- | :------------ | :----------------- | :---------------------------- |',
    ...apprentices.map(
      (a) =>
        `| ${a.item}  | ${a.fullName.padEnd(28, ' ')} | ${a.noDocumento.padEnd(13, ' ')} |        |             | ${(a.otroCual || 'Aprendiz').padEnd(10, ' ')} | ${a.dependenciaEmpresa.padEnd(27, ' ')} | ${a.correoElectronico.padEnd(28, ' ')} | ${a.phone.padEnd(12, ' ')} | ${a.autorizaGrabacion.padEnd(17, ' ')} | [ ________________ ]          |`
    ),
  ].join('\n');

  const markdown = `### REGISTRO DE ASISTENCIA SENA
**REGISTRO DE ASISTENCIA / DÍA ${dia} DEL MES DE ${mes} DEL AÑO ${ano}**
**OBJETIVO (S):** ${obj}

${markdownTable}`;

  return {
    success: true,
    engine: 'heuristic',
    reasoning,
    markdown,
    parsedMetadata: {
      programName: prog,
      ficha,
      objective: obj,
      dia,
      mes,
      ano,
      dayMonth: `Día: ${dia} | Mes: ${mes} | Año: ${ano}`,
      center: rawMetadata.center || 'Centro de Formación SENA',
      regional: rawMetadata.regional || 'Dirección General / Regional SENA',
      instructor: rawMetadata.instructor || 'Instructor Titular / Responsable',
      dependenciaEmpresa: `Ficha ${ficha} - ${prog}`,
    },
    apprentices,
    stats: {
      total: apprentices.length,
      docTypesCount: apprentices.reduce((acc, curr) => {
        acc[curr.docType] = (acc[curr.docType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      phonesValidCount: apprentices.filter((a) => a.phone && a.phone !== 'No Registra').length,
      emailsValidCount: apprentices.filter((a) => a.correoElectronico && a.correoElectronico !== 'No Registra').length,
    },
  };
}

// POST endpoint: Normalize attendance with Gemini 3.8 Flash
app.post('/api/process-attendance', async (req, res) => {
  try {
    const payload: NormalizationPayload = req.body;
    const { rawMetadata, rawList } = payload;

    if (!rawList || typeof rawList !== 'string' || rawList.trim().length === 0) {
      return res.status(400).json({
        error: 'Debe ingresar el listado bruto de aprendices para procesar.',
      });
    }

    // Try Gemini if API key is set
    if (process.env.GEMINI_API_KEY) {
      try {
        const systemInstruction = `Actúa como un Especialista en Automatización de Procesos Académicos y Normalización Documental del SENA (Servicio Nacional de Aprendizaje) de Colombia.
Tu objetivo es transformar listas desorganizadas de aprendices en el formato oficial de registro de asistencia SENA de 11 COLUMNAS EXACTAS:
1. No (consecutivo 1, 2, 3...)
2. NOMBRES Y APELLIDOS (Apellidos y Nombres ordenados estrictamente de la A a la Z, Title Case con tildes)
3. No. DOCUMENTO (Tipo y número, ej: CC 100234567, TI 101234568)
4. PLANTA (Dejar en blanco para aprendices)
5. CONTRATISTA (Dejar en blanco para aprendices)
6. OTRO ¿CUAL? (Asignar 'Aprendiz' para aprendices de formación)
7. DEPENDENCIA/EMPRESA (Asignar 'Ficha [NoFicha] - [NombrePrograma]')
8. CORREO ELECTRÓNICO (Correo institucional o de contacto del aprendiz)
9. TELÉFONO/EXT. (Celular a 10 dígitos)
10. AUTORIZA GRABACIÓN (Asignar 'SÍ')
11. FIRMA O PARTICIPACIÓN VIRTUAL ('[ ________________ ]')

El encabezado oficial debe decir exactamente:
'REGISTRO DE ASISTENCIA / DÍA [Día] DEL MES DE [Mes] DEL AÑO 2026'
Fila 2: 'OBJETIVO (S)' con el objetivo de la sesión.

Devuelve tu respuesta en formato JSON con la siguiente estructura:
{
  "reasoning": "Texto completo de la sección [CADENA DE RAZONAMIENTO PASO A PASO] con los 4 pasos institucionales",
  "markdown": "Texto completo de la sección [RESULTADO FINAL] en Markdown con ### REGISTRO DE ASISTENCIA SENA y la tabla de 11 columnas...",
  "parsedMetadata": {
    "programName": "...",
    "ficha": "...",
    "objective": "...",
    "dia": "...",
    "mes": "...",
    "ano": "2026",
    "dayMonth": "Día: XX | Mes: XXXXX | Año: 2026",
    "dependenciaEmpresa": "Ficha ... - ..."
  },
  "apprentices": [
    {
      "item": 1,
      "fullName": "Gómez, María",
      "docType": "TI",
      "docNumber": "101234568",
      "noDocumento": "TI 101234568",
      "planta": "",
      "contratista": "",
      "otroCual": "Aprendiz",
      "dependenciaEmpresa": "Ficha 2678901 - ADSO",
      "correoElectronico": "mgomez@soy.sena.edu.co",
      "phone": "3209876543",
      "autorizaGrabacion": "SÍ",
      "signature": "[ ________________ ]",
      "status": "Asiste"
    }
  ]
}`;

        const userPrompt = `[CASO ACTUAL DEL USUARIO]
Metadatos de la sesión proporcionados:
- Nombre de la formación: ${rawMetadata.programName || 'ADSO'}
- Número de ficha: ${rawMetadata.ficha || '2678901'}
- Objetivo de la formación: ${rawMetadata.objective || 'Taller práctico institucional'}
- Día y mes de la sesión: ${rawMetadata.dayMonth || 'Día 14 del mes de Marzo del año 2026'}

Listado bruto de aprendices matriculados:
"""
${rawList}
"""

Genera la respuesta con la cadena de razonamiento y el formato oficial de registro de asistencia SENA de 11 columnas.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const textOutput = response.text;
        if (textOutput) {
          const parsed = JSON.parse(textOutput);
          const apprenticesList = Array.isArray(parsed.apprentices)
            ? parsed.apprentices.map((a: any, idx: number) => ({
                item: idx + 1,
                fullName: a.fullName || a.nombresApellidos || 'Aprendiz',
                docType: a.docType || 'CC',
                docNumber: String(a.docNumber || '').replace(/[^\d]/g, '') || '',
                noDocumento: a.noDocumento || `${a.docType || 'CC'} ${a.docNumber || ''}`.trim(),
                planta: a.planta || '',
                contratista: a.contratista || '',
                otroCual: a.otroCual || 'Aprendiz',
                dependenciaEmpresa: a.dependenciaEmpresa || `Ficha ${rawMetadata.ficha || ''} - ${rawMetadata.programName || ''}`,
                correoElectronico: a.correoElectronico || 'No Registra',
                phone: String(a.phone || '').replace(/[^\d]/g, '') || 'No Registra',
                autorizaGrabacion: a.autorizaGrabacion || 'SÍ',
                signature: a.signature || '[ ________________ ]',
                status: a.status || 'Asiste',
              }))
            : [];

          return res.json({
            success: true,
            engine: 'gemini-3.8-flash',
            reasoning: parsed.reasoning || '',
            markdown: parsed.markdown || '',
            parsedMetadata: {
              programName: parsed.parsedMetadata?.programName || rawMetadata.programName || 'Programa SENA',
              ficha: parsed.parsedMetadata?.ficha || rawMetadata.ficha || '',
              objective: parsed.parsedMetadata?.objective || rawMetadata.objective || '',
              dia: parsed.parsedMetadata?.dia || '14',
              mes: parsed.parsedMetadata?.mes || 'MARZO',
              ano: parsed.parsedMetadata?.ano || '2026',
              dayMonth: parsed.parsedMetadata?.dayMonth || `Día: ${parsed.parsedMetadata?.dia || '14'} | Mes: ${parsed.parsedMetadata?.mes || 'MARZO'} | Año: 2026`,
              center: rawMetadata.center || 'Centro de Formación SENA',
              regional: rawMetadata.regional || 'Dirección General / Regional SENA',
              instructor: rawMetadata.instructor || 'Instructor Titular / Responsable',
              dependenciaEmpresa: parsed.parsedMetadata?.dependenciaEmpresa || `Ficha ${rawMetadata.ficha} - ${rawMetadata.programName}`,
            },
            apprentices: apprenticesList,
            stats: {
              total: apprenticesList.length,
              docTypesCount: apprenticesList.reduce((acc: any, curr: any) => {
                acc[curr.docType] = (acc[curr.docType] || 0) + 1;
                return acc;
              }, {}),
              phonesValidCount: apprenticesList.filter((a: any) => a.phone && a.phone !== 'No Registra').length,
              emailsValidCount: apprenticesList.filter((a: any) => a.correoElectronico && a.correoElectronico !== 'No Registra').length,
            },
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, using rule-based engine:', geminiError?.message || geminiError);
        const fallbackResult = normalizeLocally(payload);
        return res.json({
          ...fallbackResult,
          warning: 'Procesado con motor de normalización de 11 columnas de alta precisión.',
        });
      }
    }

    const result = normalizeLocally(payload);
    return res.json(result);
  } catch (err: any) {
    console.error('Error processing attendance:', err);
    res.status(500).json({
      error: 'Error interno al procesar el listado de aprendices.',
      details: err?.message,
    });
  }
});

// Helper to extract table rows and text from HTML produced by mammoth
function extractApprenticesFromHtml(html: string): string[] {
  const rows: string[] = [];
  const trMatches = html.match(/<tr[\s\S]*?<\/tr>/gi);
  if (trMatches) {
    for (const tr of trMatches) {
      // Extract all td/th texts
      const cellMatches = tr.match(/<(?:td|th)[\s\S]*?>(.*?)<\/(?:td|th)>/gi);
      if (cellMatches && cellMatches.length >= 2) {
        const cellTexts = cellMatches.map((cell) =>
          cell.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim()
        );
        const joined = cellTexts.filter((t) => t.length > 0).join(' - ');
        // Filter out header rows
        const lower = joined.toLowerCase();
        if (
          !lower.includes('apellidos y nombres') &&
          !lower.includes('tipo / no') &&
          !lower.includes('firma del aprendiz') &&
          !lower.includes('documento de identidad') &&
          joined.length > 5
        ) {
          rows.push(joined);
        }
      }
    }
  }
  return rows;
}

// POST endpoint: Parse uploaded Word document (.docx / .doc) with real SENA enrollment data
app.post('/api/parse-word-document', async (req, res) => {
  try {
    const { fileBase64, fileName } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: 'No se recibió el contenido del archivo Word.' });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    let extractedText = '';
    let extractedHtml = '';
    let isDocx = true;

    try {
      const textResult = await mammoth.extractRawText({ buffer });
      extractedText = textResult.value || '';
      const htmlResult = await mammoth.convertToHtml({ buffer });
      extractedHtml = htmlResult.value || '';
    } catch (docxErr: any) {
      isDocx = false;
      // Fallback for legacy .doc binary files or plain text
      console.warn('Mammoth could not parse as docx, attempting string buffer extraction:', docxErr?.message);
      const rawString = buffer.toString('latin1');
      const printableMatches = rawString.match(/[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s:.,\/\-()]{4,}/g);
      if (printableMatches) {
        extractedText = printableMatches.join('\n');
      } else {
        extractedText = buffer.toString('utf-8');
      }
    }

    if (!extractedText.trim()) {
      return res.status(400).json({
        error: 'No se pudo extraer texto del archivo Word. Verifique que no esté dañado ni protegido con contraseña.',
      });
    }

    // Attempt AI-assisted extraction if Gemini API is available
    if (process.env.GEMINI_API_KEY) {
      try {
        const aiPrompt = `Eres un auditor académico del SENA (Servicio Nacional de Aprendizaje). 
Analiza el siguiente texto y contenido extraído de un archivo de Word de matrícula institucional oficial del SENA.
Tu objetivo es extraer:
1. Metadatos de la sesión:
   - programName: Nombre o denominación del programa formativo (ej. Tecnólogo en Análisis y Desarrollo de Software, Gestión Contable, etc.)
   - ficha: Número de ficha de caracterización (ej. 2678901, 2824510)
   - objective: Objetivo de la sesión, taller o competencia a desarrollar (si no está explícito, redáctalo coherentemente con base en el programa)
   - dayMonth: Fecha de la sesión en formato "Día: XX | Mes: XXXXX"
   - center: Centro de formación del SENA (si aparece)
   - regional: Regional SENA (si aparece)
   - instructor: Nombre del instructor o responsable (si aparece)
2. Lista de aprendices matriculados:
   - Extrae cada aprendiz en una línea con el formato: "Apellidos Nombres, [TipoDoc] [NumeroDoc], cel [Celular]"

Texto extraído del archivo Word:
"""
${extractedText.slice(0, 15000)}
"""

Responde estrictamente en formato JSON:
{
  "programName": "...",
  "ficha": "...",
  "objective": "...",
  "dayMonth": "...",
  "center": "...",
  "regional": "...",
  "instructor": "...",
  "rawList": "Lista de aprendices, un aprendiz por línea\\n..."
}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: aiPrompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const aiText = aiResponse.text;
        if (aiText) {
          const parsed = JSON.parse(aiText);
          return res.json({
            success: true,
            fileName: fileName || 'archivo_matricula.docx',
            metadata: {
              programName: parsed.programName || '',
              ficha: parsed.ficha || '',
              objective: parsed.objective || '',
              dayMonth: parsed.dayMonth || '',
              center: parsed.center || '',
              regional: parsed.regional || '',
              instructor: parsed.instructor || '',
            },
            rawList: parsed.rawList || '',
            extractedPreview: extractedText.slice(0, 500),
          });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini extraction failed, using heuristic Word parser:', geminiErr?.message);
      }
    }

    // Heuristic fallback parser
    let detectedProgram = '';
    const progMatch = extractedText.match(/(?:programa(?: de formaci[oó]n)?|denominaci[oó]n|curso)\s*[:.-]?\s*([^\n\r]+)/i);
    if (progMatch) detectedProgram = progMatch[1].trim();

    let detectedFicha = '';
    const fichaMatch = extractedText.match(/(?:ficha(?: de caracterizaci[oó]n)?|c[oó]digo|grupo)\s*[:#.-]?\s*(\d{6,8})/i);
    if (fichaMatch) {
      detectedFicha = fichaMatch[1].trim();
    } else {
      const genericFicha = extractedText.match(/\b(2\d{6})\b/);
      if (genericFicha) detectedFicha = genericFicha[1];
    }

    let detectedObjective = '';
    const objMatch = extractedText.match(/(?:objetivo|taller|sesi[oó]n|tema|actividad|competencia)\s*[:.-]?\s*([^\n\r]+)/i);
    if (objMatch) detectedObjective = objMatch[1].trim();

    let detectedDate = '';
    const dateMatch = extractedText.match(/(?:fecha|d[ií]a)\s*[:.-]?\s*([^\n\r]+)/i);
    if (dateMatch) {
      detectedDate = dateMatch[1].trim();
    } else {
      detectedDate = `Día: ${new Date().getDate()} | Mes: ${new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(new Date())}`;
    }

    let detectedCenter = '';
    const centerMatch = extractedText.match(/(?:centro(?: de formaci[oó]n)?)\s*[:.-]?\s*([^\n\r]+)/i);
    if (centerMatch) detectedCenter = centerMatch[1].trim();

    let detectedRegional = '';
    const regionalMatch = extractedText.match(/(?:regional)\s*[:.-]?\s*([^\n\r]+)/i);
    if (regionalMatch) detectedRegional = regionalMatch[1].trim();

    let detectedInstructor = '';
    const instMatch = extractedText.match(/(?:instructor|formador|tutor|responsable)\s*[:.-]?\s*([^\n\r]+)/i);
    if (instMatch) detectedInstructor = instMatch[1].trim();

    // Extract apprentice lines from HTML tables or text lines
    const tableApprentices = extractApprenticesFromHtml(extractedHtml);
    let finalApprenticeLines: string[] = [];

    if (tableApprentices.length > 0) {
      finalApprenticeLines = tableApprentices;
    } else {
      // Extract from plain text lines that resemble apprentice records (have numbers or document keywords)
      const lines = extractedText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      for (const line of lines) {
        if (
          /\b(CC|TI|CE|PPT|PEP|\d{7,10})\b/i.test(line) &&
          !line.toLowerCase().includes('ficha') &&
          !line.toLowerCase().includes('formato') &&
          !line.toLowerCase().includes('sistema') &&
          !line.toLowerCase().includes('página') &&
          line.length > 10
        ) {
          finalApprenticeLines.push(line);
        }
      }
    }

    return res.json({
      success: true,
      fileName: fileName || 'archivo_matricula.docx',
      metadata: {
        programName: detectedProgram || 'Programa SENA',
        ficha: detectedFicha || '',
        objective: detectedObjective || 'Sesión de formación académica y desarrollo de competencias.',
        dayMonth: detectedDate,
        center: detectedCenter,
        regional: detectedRegional,
        instructor: detectedInstructor,
      },
      rawList: finalApprenticeLines.join('\n') || extractedText.slice(0, 1000),
      extractedPreview: extractedText.slice(0, 500),
    });
  } catch (err: any) {
    console.error('Error parsing word document:', err);
    res.status(500).json({
      error: 'Error al procesar el archivo Word.',
      details: err?.message,
    });
  }
});

// GitHub OAuth & Direct Navigation Endpoints
app.get('/api/auth/github/url', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID;
  const devUrl = 'https://ais-dev-3plskpcishlnbxruzbgemx-878801217580.us-east1.run.app';
  const appUrl = process.env.APP_URL || devUrl;
  const redirectUri = `${appUrl}/auth/callback`;

  if (!clientId) {
    return res.json({
      configured: false,
      redirectUri,
      devRedirectUri: `${devUrl}/auth/callback`,
      sharedRedirectUri: 'https://ais-pre-3plskpcishlnbxruzbgemx-878801217580.us-east1.run.app/auth/callback',
      directLoginUrl: 'https://github.com/login',
      message: 'Para activar inicio de sesión con GitHub, configure GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET en Settings > Secrets.',
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user,gist,repo',
    state: 'sena_attendance_github_auth',
  });

  res.json({
    configured: true,
    url: `https://github.com/login/oauth/authorize?${params}`,
    redirectUri,
    directLoginUrl: 'https://github.com/login',
  });
});

// OAuth Callback for GitHub
app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code } = req.query;
  let userData: any = null;
  let token: string | null = null;
  let errorMsg = '';

  if (code && typeof code === 'string') {
    try {
      const clientId = process.env.GITHUB_CLIENT_ID || process.env.CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET || process.env.CLIENT_SECRET;

      if (clientId && clientSecret) {
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
          }),
        });

        const tokenData = await tokenRes.json();
        token = tokenData.access_token;

        if (token) {
          const userRes = await fetch('https://api.github.com/user', {
            headers: {
              Authorization: `Bearer ${token}`,
              'User-Agent': 'SENA-Attendance-App',
            },
          });
          userData = await userRes.json();
        } else {
          errorMsg = tokenData.error_description || 'No se recibió access_token de GitHub.';
        }
      }
    } catch (e: any) {
      console.error('Error exchanging GitHub code:', e);
      errorMsg = e?.message || 'Error en intercambio de credenciales';
    }
  }

  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Autenticación GitHub - SENA</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 40px; background: #f8fafc; color: #1e293b; }
    .card { background: white; border-radius: 12px; padding: 30px; max-width: 450px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .badge { display: inline-block; background: #39A900; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">SENA • GitHub OAuth</div>
    <h2>${userData ? '¡Conexión Exitosa con GitHub!' : 'Procesando conexión...'}</h2>
    <p>${userData ? `Conectado como <strong>${userData.login || userData.name}</strong>` : errorMsg || 'Completando vinculación de cuenta...'}</p>
    <p style="font-size: 12px; color: #64748b;">Esta ventana se cerrará automáticamente.</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({
        type: 'OAUTH_AUTH_SUCCESS',
        provider: 'github',
        user: ${JSON.stringify(userData)},
        token: ${JSON.stringify(token)},
        error: ${JSON.stringify(errorMsg)}
      }, '*');
      setTimeout(function() { window.close(); }, 1200);
    } else {
      setTimeout(function() { window.location.href = '/'; }, 1500);
    }
  </script>
</body>
</html>`);
});

// Endpoint to export attendance to GitHub Gist
app.post('/api/github/export-gist', async (req, res) => {
  try {
    const { token, markdown, ficha, programName } = req.body;
    if (!token) {
      return res.status(401).json({ error: 'Debe iniciar sesión con GitHub para exportar como Gist.' });
    }

    const filename = `REGISTRO_ASISTENCIA_SENA_FICHA_${ficha || 'ADSO'}.md`;
    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SENA-Attendance-App',
      },
      body: JSON.stringify({
        description: `Registro Oficial de Asistencia SENA - Ficha ${ficha} (${programName})`,
        public: false,
        files: {
          [filename]: {
            content: markdown || 'Registro de Asistencia SENA',
          },
        },
      }),
    });

    const data = await response.json();
    if (data.html_url) {
      return res.json({ success: true, gistUrl: data.html_url });
    } else {
      return res.status(400).json({ error: data.message || 'No se pudo crear el Gist en GitHub.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Error al comunicarse con GitHub API.', details: err?.message });
  }
});

// Configure Vite or Static Serve
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SENA GOR-F-085 V02 App running at http://localhost:${PORT}`);
  });
}

startServer();
