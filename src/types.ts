export interface Apprentice {
  item: number; // No
  fullName: string; // NOMBRES Y APELLIDOS
  docType?: string;
  docNumber?: string;
  noDocumento: string; // No. DOCUMENTO (ej: "CC 100234567" o "100234567")
  planta: boolean | string; // PLANTA
  contratista: boolean | string; // CONTRATISTA
  otroCual: string; // OTRO ¿CUAL? (ej: "Aprendiz")
  dependenciaEmpresa: string; // DEPENDENCIA/EMPRESA (ej: "Ficha 2678901 - ADSO")
  correoElectronico: string; // CORREO ELECTRÓNICO
  phone: string; // TELÉFONO/EXT.
  autorizaGrabacion: string; // AUTORIZA GRABACIÓN (ej: "SÍ" / "NO")
  signature: string; // FIRMA O PARTICIPACIÓN VIRTUAL
  status?: string;
}

export interface SessionMetadata {
  programName: string;
  ficha: string;
  objective: string;
  dia?: string;
  mes?: string;
  ano?: string;
  dayMonth: string;
  center?: string;
  regional?: string;
  instructor?: string;
  dependenciaEmpresa?: string;
}

export interface NormalizationResponse {
  success: boolean;
  engine: string;
  reasoning: string;
  markdown: string;
  parsedMetadata: SessionMetadata;
  apprentices: Apprentice[];
  warning?: string;
  stats?: {
    total: number;
    docTypesCount: Record<string, number>;
    phonesValidCount: number;
    emailsValidCount?: number;
  };
}

export interface PresetSample {
  id: string;
  name: string;
  description: string;
  metadata: SessionMetadata;
  rawList: string;
}
