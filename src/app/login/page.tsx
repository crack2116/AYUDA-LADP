import type { Metadata } from "next";

import { LoginView } from "@/presentation/views/LoginView";

export const metadata: Metadata = {
  title: "Ingreso institucional — AYUDA LADP",
};

export default function LoginPage() {
  return <LoginView />;
}
