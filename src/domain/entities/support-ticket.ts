export const SUPPORT_PROBLEM_VALUES = [
  "datos_no_cargan",
  "centro_no_aparece",
  "error_codigo_inc",
  "error_validar_existencia",
] as const;

export type SupportProblem = (typeof SUPPORT_PROBLEM_VALUES)[number];

export interface SupportTicket {
  id: string;
  usuarioId: string | null;
  opcionProblema: SupportProblem;
  detalleOpcional: string | null;
  rutaOrigen: string;
  createdAt: string;
}

export const SUPPORT_PROBLEM_OPTIONS: ReadonlyArray<{
  value: SupportProblem;
  label: string;
}> = [
  { value: "datos_no_cargan", label: "No carga algún dato en pantalla" },
  { value: "centro_no_aparece", label: "No aparece mi Centro Poblado en el buscador" },
  { value: "error_codigo_inc", label: "Error al guardar o generar código INC" },
  { value: "error_validar_existencia", label: "Problema al validar si existe un reporte" },
];
