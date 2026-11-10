import { z } from "zod";

import { SUPPORT_PROBLEM_VALUES } from "@/domain/entities/support-ticket";

export const supportTicketSchema = z.object({
  opcionProblema: z.enum(SUPPORT_PROBLEM_VALUES, {
    message: "Selecciona el problema que estás reportando.",
  }),
  detalleOpcional: z
    .string({ message: "El detalle debe ser texto." })
    .max(200, { message: "El detalle no puede superar 200 caracteres." })
    .nullish()
    .transform((value) => {
      const trimmed = value?.trim() ?? "";
      return trimmed.length > 0 ? trimmed : null;
    }),
  rutaOrigen: z
    .string({ message: "La ruta de origen es obligatoria." })
    .trim()
    .min(1, { message: "La ruta de origen es obligatoria." }),
});

export type SupportTicketFormValues = z.input<typeof supportTicketSchema>;
export type SupportTicketParsedValues = z.output<typeof supportTicketSchema>;
