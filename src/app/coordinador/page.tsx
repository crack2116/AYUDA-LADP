import type { Metadata } from "next";

import { RoleGate } from "@/presentation/components/layout/RoleShell";
import { CoordinadorAreaView } from "@/presentation/views/CoordinadorAreaView";

export const metadata: Metadata = {
  title: "Mi Área — AYUDA LADP",
};

const ALLOWED_ROLES = ["coordinador"] as const;

export default function CoordinadorPage() {
  return (
    <RoleGate allowedRoles={ALLOWED_ROLES}>
      <CoordinadorAreaView />
    </RoleGate>
  );
}
