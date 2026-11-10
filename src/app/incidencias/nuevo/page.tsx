import type { Metadata } from "next";

import { RoleGate } from "@/presentation/components/layout/RoleShell";
import { AsistenteNuevaIncidenciaView } from "@/presentation/views/AsistenteNuevaIncidenciaView";

export const metadata: Metadata = {
  title: "Nueva Incidencia — AYUDA LADP",
};

const ALLOWED_ROLES = ["jefatura", "coordinador", "asistente"] as const;

export default function NuevaIncidenciaPage() {
  return (
    <RoleGate allowedRoles={ALLOWED_ROLES}>
      <AsistenteNuevaIncidenciaView />
    </RoleGate>
  );
}
