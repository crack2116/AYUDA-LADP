import { z } from "zod";

import {
  NECESIDAD_VALUES,
  TIPO_AFECTACION_VALUES,
  type IncidenciaDraft,
} from "@/domain/entities/incidencia";

export interface IncidenciaSchemaOptions {
  /** Today's date in America/Lima, as YYYY-MM-DD. */
  today: string;
}

const hogaresAfectadosSchema = z
  .number({ message: "Ingresa el número de hogares afectados." })
  .int({ message: "El número de hogares debe ser un número entero." })
  .min(0, { message: "El número de hogares no puede ser negativo." })
  .max(100000, { message: "El número de hogares no puede superar 100000." });

const gpsCoordsSchema = z
  .string({ message: "Las coordenadas GPS deben ser texto." })
  .max(80, { message: "Las coordenadas GPS no pueden superar 80 caracteres." })
  .nullish()
  .transform((value) => {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
  });

const notaReferenciaSchema = z
  .string({ message: "La nota de referencia debe ser texto." })
  .max(280, { message: "La nota de referencia no puede superar 280 caracteres." })
  .nullish()
  .transform((value) => {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
  });

/**
 * Builds the incident form schema bound to a concrete "today" in America/Lima.
 * Injecting today keeps validation deterministic in tests and on the server.
 */
export function createIncidenciaSchema({ today }: IncidenciaSchemaOptions) {
  return z
    .object({
      centroPobladoId: z
        .string({ message: "Selecciona un centro poblado." })
        .trim()
        .min(1, { message: "Selecciona un centro poblado." }),
      tipoAfectacion: z.enum(TIPO_AFECTACION_VALUES, {
        message: "Selecciona un tipo de afectación válido.",
      }),
      hogaresAfectados: hogaresAfectadosSchema,
      necesidadPrincipal: z.enum(NECESIDAD_VALUES, {
        message: "Selecciona una necesidad principal válida.",
      }),
      ocurrioHoy: z.boolean({ message: "Indica si el suceso ocurrió hoy." }),
      fechaSuceso: z.iso.date({
        message: "Usa una fecha válida en formato AAAA-MM-DD.",
      }),
      gpsCoords: gpsCoordsSchema,
      notaReferencia: notaReferenciaSchema,
    })
    .superRefine((data, ctx) => {
      if (data.fechaSuceso > today) {
        ctx.addIssue({
          code: "custom",
          path: ["fechaSuceso"],
          message: "La fecha del suceso no puede ser futura.",
        });
      }
      if (data.ocurrioHoy && data.fechaSuceso !== today) {
        ctx.addIssue({
          code: "custom",
          path: ["fechaSuceso"],
          message: "Si el suceso ocurrió hoy, la fecha debe ser la de hoy.",
        });
      }
    });
}

export type IncidenciaSchema = ReturnType<typeof createIncidenciaSchema>;
export type IncidenciaFormValues = z.input<IncidenciaSchema>;
export type IncidenciaParsedValues = z.output<IncidenciaSchema>;

/**
 * Converts validated form values into the persisted draft shape.
 * The author is added here because it belongs to the session, not the form.
 */
export function mapFormValuesToDraft(
  values: IncidenciaParsedValues,
  creadoPor: string,
): IncidenciaDraft {
  return {
    centroPobladoId: values.centroPobladoId,
    tipoAfectacion: values.tipoAfectacion,
    hogaresAfectados: values.hogaresAfectados,
    necesidadPrincipal: values.necesidadPrincipal,
    ocurrioHoy: values.ocurrioHoy,
    fechaSuceso: values.fechaSuceso,
    gpsCoords: values.gpsCoords,
    notaReferencia: values.notaReferencia,
    creadoPor,
  };
}
