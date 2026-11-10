export const TIPO_AFECTACION_VALUES = [
  "inundacion",
  "huaico",
  "colapso_vivienda",
  "aislamiento_vial",
  "corte_servicios",
  "desborde_rio",
  "otro",
] as const;

export type TipoAfectacion = (typeof TIPO_AFECTACION_VALUES)[number];

export const NECESIDAD_VALUES = [
  "agua_potable",
  "alimentos",
  "carpas_abrigo",
  "atencion_medica",
  "maquinaria_limpieza",
  "evacuacion_rescate",
  "kits_higiene",
  "otro",
] as const;

export type NecesidadPrincipal = (typeof NECESIDAD_VALUES)[number];

export interface Incidencia {
  id: string;
  codigoAuditoria: string;
  centroPobladoId: string;
  tipoAfectacion: TipoAfectacion;
  hogaresAfectados: number;
  necesidadPrincipal: NecesidadPrincipal;
  ocurrioHoy: boolean;
  /** YYYY-MM-DD in America/Lima. */
  fechaSuceso: string;
  gpsCoords: string | null;
  notaReferencia: string | null;
  verificado: boolean;
  creadoPor: string;
  /** ISO timestamp. */
  createdAt: string;
}

export type IncidenciaDraft = Omit<
  Incidencia,
  "id" | "codigoAuditoria" | "verificado" | "createdAt"
>;

export const TIPO_AFECTACION_OPTIONS: ReadonlyArray<{
  value: TipoAfectacion;
  label: string;
}> = [
  { value: "inundacion", label: "Inundación" },
  { value: "huaico", label: "Huaico / Deslizamiento" },
  { value: "colapso_vivienda", label: "Colapso de vivienda" },
  { value: "aislamiento_vial", label: "Aislamiento vial" },
  { value: "corte_servicios", label: "Corte de servicios básicos" },
  { value: "desborde_rio", label: "Desborde de río/quebrada" },
  { value: "otro", label: "Otro" },
];

export const NECESIDAD_OPTIONS: ReadonlyArray<{
  value: NecesidadPrincipal;
  label: string;
}> = [
  { value: "agua_potable", label: "Agua potable" },
  { value: "alimentos", label: "Alimentos no perecibles" },
  { value: "carpas_abrigo", label: "Carpas / Abrigo" },
  { value: "atencion_medica", label: "Atención médica" },
  { value: "maquinaria_limpieza", label: "Maquinaria de limpieza" },
  { value: "evacuacion_rescate", label: "Evacuación / Rescate" },
  { value: "kits_higiene", label: "Kits de higiene" },
  { value: "otro", label: "Otro" },
];

export function labelForTipoAfectacion(value: TipoAfectacion): string {
  return TIPO_AFECTACION_OPTIONS.find((option) => option.value === value)?.label ?? "Otro";
}

export function labelForNecesidad(value: NecesidadPrincipal): string {
  return NECESIDAD_OPTIONS.find((option) => option.value === value)?.label ?? "Otro";
}
