import { PresetSample } from '../types';

export const SAMPLE_PRESETS: PresetSample[] = [
  {
    id: 'adso-git',
    name: 'Ficha 2678901 — ADSO (Taller Git y GitHub)',
    description: 'Ejemplo oficial del lineamiento: 2 aprendices brutos con Pérez y Gómez.',
    metadata: {
      programName: 'Análisis y Desarrollo de Software (ADSO)',
      ficha: '2678901',
      objective: 'Desarrollar habilidades prácticas en control de versiones con Git y GitHub.',
      dayMonth: 'Día: 14 | Mes: Marzo',
      center: 'Centro de Servicios y Gestión Empresarial',
      regional: 'Regional Antioquia',
      instructor: 'Ing. Carlos Mendoza (Instructor Líder)',
    },
    rawList: `- Perez Juan, CC 100234567, cel 3105551234
- Gomez Maria, TI 101234568, cel 3209876543`,
  },
  {
    id: 'adso-completo',
    name: 'Ficha 2824510 — ADSO Grupo Ampliado (WhatsApp paste)',
    description: 'Lista típica desordenada copiada de chat de WhatsApp con errores de tipeo y formatos mezclados.',
    metadata: {
      programName: 'Tecnólogo en Análisis y Desarrollo de Software',
      ficha: '2824510',
      objective: 'Diseñar la arquitectura de base de datos relacional y construir el modelo entidad-relación.',
      dayMonth: 'Día: 22 | Mes: Octubre',
      center: 'Centro de Teleinformática y Producción Industrial',
      regional: 'Regional Cauca',
      instructor: 'Sonia Esperanza Valderrama',
    },
    rawList: `1. Rodriguez Suarez Luis Fernando - CC: 1061789456 - Cel: 3127894561
2. alvarez quintero ana maria cel: 3004561234 ti 1089234567
3. VARGAS LOPEZ SANTIAGO 1061987654 celular 3189998877
4. Zuñiga Castro Valentina; TI: 1098456123 - 3154567890
5. Castro Mejia Andrés Felipe cc 1061234987 tel: 3112233445
6. Benavides Morales Jhon Jairo, CC 1061456789, cel 3217654321
7. Ospina Herrera Laura Sofia, TI 1098123789, Celular 3145671234`,
  },
  {
    id: 'gestion-contable',
    name: 'Ficha 2712390 — Gestión Contable y Tributaria',
    description: 'Nombres en mayúsculas sostenidas, cédulas con puntos y celulares sin prefijo.',
    metadata: {
      programName: 'Tecnólogo en Gestión Contable y de Información Financiera',
      ficha: '2712390',
      objective: 'Liquidar nómina y provisiones de prestaciones sociales conforme al marco legal laboral vigente.',
      dayMonth: 'Día: 05 | Mes: Noviembre',
      center: 'Centro de Servicios Financieros',
      regional: 'Regional Distrito Capital',
      instructor: 'Dra. Martha Lucia Restrepo',
    },
    rawList: `MARTINEZ DUQUE DANIELA / CC 1.015.489.123 / CEL 3167890123
BEDOYA ZAPATA CRISTIAN CAMILO C.C 1020456890 TELEFONO: 3178901234
RAMIREZ VELEZ KATHERINE TI 1.030.456.789 - 3012345678
ARIAS MONTOYA JUAN DAVID cc 1018234901 cel 3134567890
HERNANDEZ PINEDA SOFIA CC 1022345671 cel: 3198765432`,
  },
];
