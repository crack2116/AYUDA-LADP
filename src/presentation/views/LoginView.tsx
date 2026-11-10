"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  Contact,
  Eye,
  EyeOff,
  Headphones,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  MapPin,
  Scale,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import { loginSchema, type LoginFormValues } from "@/domain/schemas/login.schema";
import { getContainer } from "@/infrastructure/container";
import { DEMO_PASSWORD } from "@/infrastructure/seed/demo-data";
import { homeForRole } from "@/presentation/lib/format";
import { requestOpenSupportChat } from "@/presentation/support/support-bus";

const DEMO_ACCOUNTS: ReadonlyArray<{
  testId: string;
  label: string;
  identificadorOficial: string;
  jurisdiccion: LoginFormValues["jurisdiccion"];
  description: string;
}> = [
  {
    testId: "login-demo-jefatura",
    label: "JEF-001",
    identificadorOficial: "JEF-001",
    jurisdiccion: "nacional",
    description: "Jefatura nacional",
  },
  {
    testId: "login-demo-coordinador",
    label: "COO-PN-01",
    identificadorOficial: "COO-PN-01",
    jurisdiccion: "piura_norte",
    description: "Coordinación Piura / Norte",
  },
  {
    testId: "login-demo-asistente",
    label: "ASI-PN-01",
    identificadorOficial: "ASI-PN-01",
    jurisdiccion: "campo",
    description: "Brigada de campo",
  },
];

export function LoginView() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identificadorOficial: "",
      claveOperacional: "",
      jurisdiccion: "nacional",
      mantenerSesion: true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await getContainer().useCases.login.execute(values);
    if (!result.ok) {
      setServerError(result.error.message);
      return;
    }
    router.replace(homeForRole(result.value.rol));
  });

  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setServerError(null);
    setValue("identificadorOficial", account.identificadorOficial, {
      shouldValidate: false,
    });
    setValue("claveOperacional", DEMO_PASSWORD, { shouldValidate: false });
    setValue("jurisdiccion", account.jurisdiccion, { shouldValidate: false });
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#eef3f9] lg:grid lg:grid-cols-[1fr_1.18fr]">
      {/* =========================================================================
          PANEL IZQUIERDO: Hero Visual con Brigadista, Logos y Acentos Gráficos
      ========================================================================== */}
      <section className="relative hidden min-h-screen overflow-hidden bg-[#07183e] lg:block">
        <div className="absolute inset-0">
          <Image
            src="/login-hero-clean.jpg"
            alt="Brigadista humanitario AYUDA LADP en campo"
            fill
            priority
            className="object-cover object-center"
          />
        </div>

        {/* Textos semánticos accesibles para lectores de pantalla y testing */}
        <div className="sr-only">
          <p>AYUDA LADP</p>
          <p>Sistema de Alertas y Respuesta Humanitaria</p>
          <p>Fenómeno El Niño 2025</p>
          <span>DINAPROS · Perú</span>
          <p>Juntos por una respuesta más rápida</p>
          <p>&ldquo;Prevenir, alertar y asistir, nuestra misión&rdquo;</p>
          <p>Alertas en tiempo real</p>
          <p>Coordinación efectiva</p>
          <p>Protección a la comunidad</p>
        </div>
      </section>

      {/* =========================================================================
          PANEL DERECHO: Tarjeta Flotante de Acceso Institucional
      ========================================================================== */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8 pb-28 sm:px-6 lg:px-10">
        {/* Patrón de puntos decorativo en la esquina superior derecha */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-4 h-44 w-44 opacity-40"
          style={{
            backgroundImage: "radial-gradient(#94a3b8 1.5px, transparent 1.5px)",
            backgroundSize: "14px 14px",
          }}
        />

        {/* Franjas geométricas naranja y azul en la esquina inferior derecha */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed -bottom-6 -right-6 z-0 h-32 w-32 sm:h-40 sm:w-40"
        >
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <polygon points="100,0 100,100 0,100" fill="#071b3e" />
            <polygon points="100,25 100,100 25,100" fill="#f06a00" />
            <polygon points="100,55 100,100 55,100" fill="#030b38" />
          </svg>
        </div>

        {/* Tarjeta de Login Principal */}
        <div className="relative z-10 w-full max-w-[490px] rounded-[2rem] border border-slate-200/80 bg-white p-7 shadow-2xl shadow-blue-950/10 sm:p-9">
          {/* Encabezado accesible requerido por specs de testing */}
          <h2 className="sr-only">Acceso Institucional</h2>

          {/* Logo, Título y Línea Naranja Central */}
          <div className="flex flex-col items-center text-center">
            <div className="relative h-18 w-20">
              <Image
                src="/ayuda-ladp-shield-logo.png"
                alt="Escudo Oficial AYUDA LADP"
                width={80}
                height={72}
                priority
                className="h-full w-auto object-contain"
              />
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#071b3e] sm:text-4xl">
              AYUDA <span className="text-[#f06a00]">LADP</span>
            </h1>
            <div className="mt-2 h-[2.5px] w-full max-w-[340px] rounded-full bg-[#f06a00]" />
            <p className="mt-2 text-xs font-semibold text-slate-700 sm:text-[13px]">
              Sistema de Alertas y Respuesta Humanitaria - Fenómeno El Niño 2025
            </p>
          </div>

          {/* Formulario */}
          <form className="mt-6 space-y-4 sm:space-y-5" onSubmit={onSubmit} noValidate>
            {/* Campo 1: Identificador Oficial */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-identifier"
                  className="flex items-center gap-1.5 text-xs font-bold text-[#071b3e] sm:text-sm"
                >
                  <Contact className="h-4 w-4 text-[#071b3e]" />
                  <span>Identificador Oficial</span>
                </label>
                <button
                  type="button"
                  onClick={requestOpenSupportChat}
                  className="inline-flex min-h-8 items-center gap-1 text-xs font-bold text-[#1d63d8] hover:text-[#002296] hover:underline sm:text-sm"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>¿Crear Cuenta?</span>
                </button>
              </div>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-700">
                  <Contact className="h-5 w-5 text-[#071b3e]" />
                </div>
                <input
                  id="login-identifier"
                  data-testid="login-identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="DNI / Correo / Código"
                  aria-invalid={Boolean(errors.identificadorOficial)}
                  aria-describedby={
                    errors.identificadorOficial ? "login-identifier-error" : undefined
                  }
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-[#1d63d8] focus:outline-none focus:ring-2 focus:ring-[#1d63d8]/20 aria-invalid:border-red-600"
                  {...register("identificadorOficial")}
                />
              </div>
              {errors.identificadorOficial ? (
                <p
                  id="login-identifier-error"
                  role="alert"
                  className="mt-1 text-xs font-semibold text-red-600"
                >
                  {errors.identificadorOficial.message}
                </p>
              ) : null}
            </div>

            {/* Campo 2: Clave Operacional */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="flex items-center gap-1.5 text-xs font-bold text-[#071b3e] sm:text-sm"
                >
                  <Lock className="h-4 w-4 text-[#071b3e]" />
                  <span>Clave Operacional</span>
                </label>
                <button
                  type="button"
                  onClick={requestOpenSupportChat}
                  className="inline-flex min-h-8 items-center gap-1 text-xs font-bold text-[#1d63d8] hover:text-[#002296] hover:underline sm:text-sm"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>¿Olvidó su Contraseña?</span>
                </button>
              </div>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-700">
                  <Lock className="h-5 w-5 text-[#071b3e]" />
                </div>
                <input
                  id="login-password"
                  data-testid="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Ingrese su contraseña"
                  aria-invalid={Boolean(errors.claveOperacional)}
                  aria-describedby={
                    errors.claveOperacional ? "login-password-error" : undefined
                  }
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm font-medium text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-[#1d63d8] focus:outline-none focus:ring-2 focus:ring-[#1d63d8]/20 aria-invalid:border-red-600"
                  {...register("claveOperacional")}
                />
                <button
                  type="button"
                  data-testid="login-password-toggle"
                  onClick={() => setShowPassword((curr) => !curr)}
                  aria-label={
                    showPassword
                      ? "Ocultar clave operacional"
                      : "Mostrar clave operacional"
                  }
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.claveOperacional ? (
                <p
                  id="login-password-error"
                  role="alert"
                  className="mt-1 text-xs font-semibold text-red-600"
                >
                  {errors.claveOperacional.message}
                </p>
              ) : null}
            </div>

            {/* Campo 3: Jurisdicción / Teatro de Operaciones */}
            <div>
              <label
                htmlFor="login-jurisdiction"
                className="flex items-center gap-1.5 text-xs font-bold text-[#071b3e] sm:text-sm"
              >
                <Scale className="h-4 w-4 text-[#071b3e]" />
                <span>Jurisdicción / Teatro de Operaciones</span>
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-700">
                  <MapPin className="h-5 w-5 text-[#071b3e]" />
                </div>
                <select
                  id="login-jurisdiction"
                  data-testid="login-jurisdiction"
                  aria-invalid={Boolean(errors.jurisdiccion)}
                  aria-describedby={
                    errors.jurisdiccion ? "login-jurisdiction-error" : undefined
                  }
                  className="min-h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm font-medium text-slate-800 shadow-sm transition-all focus:border-[#1d63d8] focus:outline-none focus:ring-2 focus:ring-[#1d63d8]/20 aria-invalid:border-red-600"
                  {...register("jurisdiccion")}
                >
                  <option value="nacional">Nivel Nacional - Jefatura</option>
                  <option value="piura_norte">Coordinación Regional - Piura / Norte</option>
                  <option value="sur_centro">Coordinación Regional - Sur / Centro</option>
                  <option value="campo">Brigada de Campo - Asistente</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500">
                  <ChevronDown className="h-5 w-5" />
                </div>
              </div>
              {errors.jurisdiccion ? (
                <p
                  id="login-jurisdiction-error"
                  role="alert"
                  className="mt-1 text-xs font-semibold text-red-600"
                >
                  {errors.jurisdiccion.message}
                </p>
              ) : null}
            </div>

            {/* Checkbox: Mantener sesión iniciada */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="login-keep-session"
                data-testid="login-keep-session"
                type="checkbox"
                className="h-4.5 w-4.5 rounded border-slate-300 text-[#1d63d8] accent-[#1d63d8] focus:ring-[#1d63d8]"
                {...register("mantenerSesion")}
              />
              <label
                htmlFor="login-keep-session"
                className="cursor-pointer select-none text-xs font-semibold text-slate-700 sm:text-sm"
              >
                Mantener sesión iniciada ( Caché local seguro )
              </label>
            </div>

            {/* Error del servidor / credenciales incorrectas */}
            {serverError ? (
              <div
                data-testid="login-error"
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-50 p-3 text-xs font-semibold text-red-700 sm:text-sm"
              >
                {serverError}
              </div>
            ) : null}

            {/* Botón Principal: Ingresar al Sistema */}
            <button
              type="submit"
              data-testid="login-submit"
              disabled={isSubmitting}
              className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f06a00] to-[#e65c00] px-4 py-3.5 text-base font-extrabold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-[#ff7a00] hover:to-[#f06a00] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
              <span>{isSubmitting ? "Ingresando…" : "Ingresar al Sistema"}</span>
            </button>
          </form>

          {/* Separador de opciones adicionales */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-xs font-semibold text-slate-400">
              Opciones adicionales
            </span>
          </div>

          {/* Tres botones de acción complementaria */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={requestOpenSupportChat}
              className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50/70 px-2 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
            >
              <UserPlus className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              <span className="truncate">Crear Cuenta</span>
            </button>
            <button
              type="button"
              onClick={requestOpenSupportChat}
              className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50/70 px-2 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
            >
              <Lock className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              <span className="truncate">Olvidé mi Contraseña</span>
            </button>
            <button
              type="button"
              data-testid="login-support"
              onClick={requestOpenSupportChat}
              className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50/70 px-2 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
            >
              <Headphones className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              <span className="truncate">Soporte</span>
            </button>
          </div>

          {/* Pie de confianza y seguridad institucional */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs font-medium text-slate-500">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            <span>AYUDA LADP | Sistema Seguro y Confiable</span>
          </div>
        </div>

        {/* =========================================================================
            BARRA DE ACCESOS DIRECTOS DEMO
        ========================================================================== */}
        <div className="relative z-10 mt-4 w-full max-w-[490px] rounded-2xl border border-dashed border-slate-300 bg-white/80 p-3 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Accesos de prueba · Clave {DEMO_PASSWORD}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">Clic para rellenar</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.identificadorOficial}
                type="button"
                data-testid={account.testId}
                onClick={() => fillDemo(account)}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center transition-all hover:border-[#1d63d8] hover:bg-blue-50/40"
              >
                <span className="font-mono text-xs font-extrabold text-[#071b3e]">
                  {account.label}
                </span>
                <span className="max-w-full truncate text-[10px] font-medium text-slate-500">
                  {account.jurisdiccion === "nacional"
                    ? "Jefatura"
                    : account.jurisdiccion === "campo"
                      ? "Asistente"
                      : "Coordinador"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
