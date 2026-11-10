import { z } from "zod";

export const JURISDICCION_VALUES = [
  "nacional",
  "piura_norte",
  "sur_centro",
  "campo",
] as const;

export type Jurisdiccion = (typeof JURISDICCION_VALUES)[number];

export const JURISDICCION_OPTIONS: ReadonlyArray<{ value: Jurisdiccion; label: string }> = [
  { value: "nacional", label: "Nacional" },
  { value: "piura_norte", label: "Piura / Norte" },
  { value: "sur_centro", label: "Sur / Centro" },
  { value: "campo", label: "Campo" },
];

export const loginSchema = z.object({
  identificadorOficial: z
    .string({ message: "Ingresa tu identificador oficial." })
    .trim()
    .min(3, { message: "El identificador debe tener al menos 3 caracteres." }),
  claveOperacional: z
    .string({ message: "Ingresa tu clave operacional." })
    .min(6, { message: "La clave debe tener al menos 6 caracteres." }),
  jurisdiccion: z.enum(JURISDICCION_VALUES, {
    message: "Selecciona una jurisdicción válida.",
  }),
  mantenerSesion: z.boolean({ message: "Indica si deseas mantener la sesión." }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
