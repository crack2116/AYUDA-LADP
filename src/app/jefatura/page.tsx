import type { Metadata } from "next";

import { RoleGate } from "@/presentation/components/layout/RoleShell";
import { JefaturaDashboardView } from "@/presentation/views/JefaturaDashboardView";

export const metadata: Metadata = {
  title: "Panel Nacional — AYUDA LADP",
};

const ALLOWED_ROLES = ["jefatura"] as const;

export default function JefaturaPage() {
  return (
    <RoleGate allowedRoles={ALLOWED_ROLES}>
      <JefaturaDashboardView />
    </RoleGate>
  );
}
