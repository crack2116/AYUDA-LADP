"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bell,
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
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
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
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#eef3f9] lg:grid lg:h-screen lg:max-h-screen lg:grid-cols-[1.08fr_1.12fr] lg:overflow-hidden">
      {/* =========================================================================
          PANEL IZQUIERDO: Hero Visual 100% Responsivo con Fotografía y SVG Puro
      ========================================================================== */}
      <section className="relative hidden h-full flex-col justify-between overflow-hidden bg-[#07183e] p-8 text-white lg:flex xl:p-12 2xl:p-16">
        {/* Fotografía de fondo limpia en alta resolución (sin textos incrustados) */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/brigadista-bg.jpg"
            alt="Brigadista humanitario en operaciones de campo en Perú"
            fill
            priority
            className="object-cover object-center"
          />
          {/* Gradientes arquitectónicos para contraste y legibilidad impecable */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#040e24]/90 via-[#07183e]/75 to-[#07183e]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040e24]/95 via-[#040e24]/30 to-transparent" />
        </div>

        {/* Divisor de onda orgánico que conecta fluidamente con el panel derecho */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-16 overflow-hidden xl:w-24 lg:block"
        >
          <svg
            viewBox="0 0 100 1000"
            preserveAspectRatio="none"
            className="h-full w-full text-[#eef3f9]"
            fill="currentColor"
          >
            <path d="M0,0 Q60,300 20,550 T40,1000 L100,1000 L100,0 Z" />
          </svg>
        </div>

        {/* Encabezado Institucional Superior */}
        <div className="relative z-20 flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#002296]/90 p-2 shadow-xl shadow-black/30 backdrop-blur-md xl:h-14 xl:w-14">
            <ShieldCheck className="h-7 w-7 text-white xl:h-8 xl:w-8" aria-hidden={true} />
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-white xl:text-2xl">
              AYUDA <span className="text-[#f06a00]">LADP</span>
            </div>
            <p className="text-xs font-semibold text-white/95 xl:text-sm">
              Sistema de Alertas y Respuesta Humanitaria
            </p>
            <p className="text-[11px] text-white/70">Fenómeno El Niño 2025</p>
            <span className="mt-1 inline-block rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 backdrop-blur-sm">
              DINAPROS · Perú
            </span>
          </div>
        </div>

        {/* Mensaje Central y Lema de Operaciones */}
        <div className="relative z-20 my-auto py-6 pr-14 xl:pr-24">
          <h2 className="max-w-lg text-3xl font-extrabold leading-tight text-white xl:text-4xl 2xl:text-5xl">
            Juntos por una{" "}
            <span className="text-[#f06a00]">respuesta</span> más rápida
          </h2>
          <p className="mt-3 max-w-md text-sm font-medium italic text-white/85 xl:text-base">
            &ldquo;Prevenir, alertar y asistir, nuestra misión&rdquo;
          </p>

          {/* Tres insignias de características con diseño responsivo */}
          <div className="mt-8 flex flex-wrap items-center gap-6 xl:gap-8">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 shadow-lg backdrop-blur-md transition-transform hover:scale-105 xl:h-12 xl:w-12">
                <Bell className="h-5 w-5 text-white" />
              </span>
              <span className="mt-2 text-[11px] font-medium leading-tight text-white/90 xl:text-xs">
                Alertas<br />en tiempo real
              </span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 shadow-lg backdrop-blur-md transition-transform hover:scale-105 xl:h-12 xl:w-12">
                <Users className="h-5 w-5 text-white" />
              </span>
              <span className="mt-2 text-[11px] font-medium leading-tight text-white/90 xl:text-xs">
                Coordinación<br />efectiva
              </span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 shadow-lg backdrop-blur-md transition-transform hover:scale-105 xl:h-12 xl:w-12">
                <Shield className="h-5 w-5 text-white" />
              </span>
              <span className="mt-2 text-[11px] font-medium leading-tight text-white/90 xl:text-xs">
                Protección<br />a la comunidad
              </span>
            </div>
          </div>
        </div>

        {/* Pie del Hero */}
        <div className="relative z-20 text-xs text-white/60">
          Uso operacional autorizado · Brigadas DINAPROS
        </div>
      </section>

      {/* =========================================================================
          PANEL DERECHO: Tarjeta Flotante Adaptable a la Altura de Pantalla
      ========================================================================== */}
      <section className="relative flex h-full min-h-screen flex-col items-center justify-center overflow-y-auto px-4 py-6 pb-24 sm:px-6 lg:min-h-0 lg:py-6">
        {/* Decoración de puntos en la esquina superior derecha */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-4 h-36 w-36 opacity-35"
          style={{
            backgroundImage: "radial-gradient(#94a3b8 1.5px, transparent 1.5px)",
            backgroundSize: "14px 14px",
          }}
        />

        {/* Franjas geométricas inferiores */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed -bottom-6 -right-6 z-0 h-32 w-32 sm:h-36 sm:w-36"
        >
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <polygon points="100,0 100,100 0,100" fill="#071b3e" />
            <polygon points="100,25 100,100 25,100" fill="#f06a00" />
            <polygon points="100,55 100,100 55,100" fill="#030b38" />
          </svg>
        </div>

        {/* Tarjeta de Inicio de Sesión */}
        <div className="relative z-10 w-full max-w-[470px] rounded-[1.75rem] border border-slate-200/90 bg-white p-5 shadow-2xl shadow-blue-950/10 sm:p-7 xl:p-8">
          <h2 className="sr-only">Acceso Institucional</h2>

          {/* Logo y Encabezado de la Tarjeta */}
          <div className="flex flex-col items-center text-center">
            <div className="relative h-14 w-16 xl:h-16 xl:w-18">
              <Image
                src="/ayuda-ladp-shield-logo.png"
                alt="Escudo Oficial AYUDA LADP"
                width={72}
                height={64}
                priority
                className="h-full w-auto object-contain"
              />
            </div>
            <h1 className="mt-1.5 text-2xl font-black tracking-tight text-[#071b3e] sm:text-3xl">
              AYUDA <span className="text-[#f06a00]">LADP</span>
            </h1>
            <div className="mt-1.5 h-[2px] w-48 rounded-full bg-[#f06a00]" />
            <p className="mt-1.5 text-[11px] font-semibold text-slate-700 sm:text-xs">
              Sistema de Alertas y Respuesta Humanitaria - Fenómeno El Niño 2025
            </p>
          </div>

          {/* Formulario */}
          <form className="mt-4 space-y-3 sm:space-y-3.5" onSubmit={onSubmit} noValidate>
            {/* Campo 1: Identificador Oficial */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-identifier"
                  className="flex items-center gap-1.5 text-xs font-bold text-[#071b3e]"
                >
                  <Contact className="h-4 w-4 text-[#071b3e]" />
                  <span>Identificador Oficial</span>
                </label>
                <button
                  type="button"
                  onClick={requestOpenSupportChat}
                  className="inline-flex min-h-7 items-center gap-1 text-xs font-bold text-[#1d63d8] hover:text-[#002296] hover:underline"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>¿Crear Cuenta?</span>
                </button>
              </div>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-700">
                  <Contact className="h-4.5 w-4.5 text-[#071b3e]" />
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
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-[#1d63d8] focus:outline-none focus:ring-4 focus:ring-[#1d63d8]/15 aria-invalid:border-red-600"
                  {...register("identificadorOficial")}
                />
              </div>
              {errors.identificadorOficial ? (
                <p
                  id="login-identifier-error"
                  role="alert"
                  className="mt-1 text-[11px] font-semibold text-red-600"
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
                  className="flex items-center gap-1.5 text-xs font-bold text-[#071b3e]"
                >
                  <Lock className="h-4 w-4 text-[#071b3e]" />
                  <span>Clave Operacional</span>
                </label>
                <button
                  type="button"
                  onClick={requestOpenSupportChat}
                  className="inline-flex min-h-7 items-center gap-1 text-xs font-bold text-[#1d63d8] hover:text-[#002296] hover:underline"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>¿Olvidó su Contraseña?</span>
                </button>
              </div>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-700">
                  <Lock className="h-4.5 w-4.5 text-[#071b3e]" />
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
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-slate-800 placeholder:text-slate-400 shadow-sm transition-all focus:border-[#1d63d8] focus:outline-none focus:ring-4 focus:ring-[#1d63d8]/15 aria-invalid:border-red-600"
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
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
              {errors.claveOperacional ? (
                <p
                  id="login-password-error"
                  role="alert"
                  className="mt-1 text-[11px] font-semibold text-red-600"
                >
                  {errors.claveOperacional.message}
                </p>
              ) : null}
            </div>

            {/* Campo 3: Jurisdicción / Teatro de Operaciones */}
            <div>
              <label
                htmlFor="login-jurisdiction"
                className="flex items-center gap-1.5 text-xs font-bold text-[#071b3e]"
              >
                <Scale className="h-4 w-4 text-[#071b3e]" />
                <span>Jurisdicción / Teatro de Operaciones</span>
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-700">
                  <MapPin className="h-4.5 w-4.5 text-[#071b3e]" />
                </div>
                <select
                  id="login-jurisdiction"
                  data-testid="login-jurisdiction"
                  aria-invalid={Boolean(errors.jurisdiccion)}
                  aria-describedby={
                    errors.jurisdiccion ? "login-jurisdiction-error" : undefined
                  }
                  className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm font-medium text-slate-800 shadow-sm transition-all focus:border-[#1d63d8] focus:outline-none focus:ring-4 focus:ring-[#1d63d8]/15 aria-invalid:border-red-600"
                  {...register("jurisdiccion")}
                >
                  <option value="nacional">Nivel Nacional - Jefatura</option>
                  <option value="piura_norte">Coordinación Regional - Piura / Norte</option>
                  <option value="sur_centro">Coordinación Regional - Sur / Centro</option>
                  <option value="campo">Brigada de Campo - Asistente</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                  <ChevronDown className="h-4.5 w-4.5" />
                </div>
              </div>
              {errors.jurisdiccion ? (
                <p
                  id="login-jurisdiction-error"
                  role="alert"
                  className="mt-1 text-[11px] font-semibold text-red-600"
                >
                  {errors.jurisdiccion.message}
                </p>
              ) : null}
            </div>

            {/* Checkbox: Mantener sesión iniciada */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                id="login-keep-session"
                data-testid="login-keep-session"
                type="checkbox"
                defaultChecked={true}
                className="h-4 w-4 rounded border-slate-300 text-[#1d63d8] accent-[#1d63d8] focus:ring-[#1d63d8]"
                {...register("mantenerSesion")}
              />
              <label
                htmlFor="login-keep-session"
                className="cursor-pointer select-none text-xs font-semibold text-slate-700"
              >
                Mantener sesión iniciada ( Caché local seguro )
              </label>
            </div>

            {/* Mensaje de error de validación del servidor */}
            {serverError ? (
              <div
                data-testid="login-error"
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-50 p-2.5 text-xs font-semibold text-red-700"
              >
                {serverError}
              </div>
            ) : null}

            {/* Botón Principal de Envío */}
            <button
              type="submit"
              data-testid="login-submit"
              disabled={isSubmitting}
              className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f06a00] to-[#e65c00] px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-[#ff7a00] hover:to-[#f06a00] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
            >
              {isSubmitting ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <LogIn className="h-4.5 w-4.5" />
              )}
              <span>{isSubmitting ? "Ingresando…" : "Ingresar al Sistema"}</span>
            </button>
          </form>

          {/* Separador de opciones secundarias */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-2.5 text-[11px] font-semibold text-slate-400">
              Opciones adicionales
            </span>
          </div>

          {/* Tres botones de acciones complementarias */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={requestOpenSupportChat}
              className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50/70 px-1.5 py-1.5 text-[11px] font-bold text-slate-700 transition-colors hover:bg-slate-100"
            >
              <UserPlus className="h-3 w-3 shrink-0 text-slate-600 sm:h-3.5 sm:w-3.5" />
              <span className="truncate">Crear Cuenta</span>
            </button>
            <button
              type="button"
              onClick={requestOpenSupportChat}
              className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50/70 px-1.5 py-1.5 text-[11px] font-bold text-slate-700 transition-colors hover:bg-slate-100"
            >
              <Lock className="h-3 w-3 shrink-0 text-slate-600 sm:h-3.5 sm:w-3.5" />
              <span className="truncate">Olvidé Clave</span>
            </button>
            <button
              type="button"
              data-testid="login-support"
              onClick={requestOpenSupportChat}
              className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50/70 px-1.5 py-1.5 text-[11px] font-bold text-slate-700 transition-colors hover:bg-slate-100"
            >
              <Headphones className="h-3 w-3 shrink-0 text-slate-600 sm:h-3.5 sm:w-3.5" />
              <span className="truncate">Soporte</span>
            </button>
          </div>

          {/* Sello institucional de seguridad */}
          <div className="mt-3.5 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            <span>AYUDA LADP | Sistema Seguro y Confiable</span>
          </div>
        </div>

        {/* Barra de accesos directos de demostración */}
        <div className="relative z-10 mt-3 w-full max-w-[470px] rounded-xl border border-dashed border-slate-300 bg-white/85 px-3 py-2 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Accesos de prueba · Clave {DEMO_PASSWORD}
            </span>
            <span className="text-[9px] font-semibold text-slate-400">Clic para rellenar</span>
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.identificadorOficial}
                type="button"
                data-testid={account.testId}
                onClick={() => fillDemo(account)}
                className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-1 text-center transition-all hover:border-[#1d63d8] hover:bg-blue-50/40"
              >
                <span className="font-mono text-xs font-extrabold text-[#071b3e]">
                  {account.label}
                </span>
                <span className="max-w-full truncate text-[9px] font-medium text-slate-500">
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
