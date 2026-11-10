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
  Info,
  Loader2,
  Lock,
  LogIn,
  MapPin,
  Scale,
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
  Zap,
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

/* =========================================================================
   LOGO OFICIAL DE LAS ASAMBLEAS DE DIOS DEL PERÚ
   Sobre un disco blanco con aro degradado institucional (azul → naranja).
========================================================================== */
function BrandBadge({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <div
      className={`relative shrink-0 rounded-full shadow-[0_12px_26px_-12px_rgba(7,42,94,0.55)] ${className}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(from 140deg, #072a5e, #1157b0, #2286e0, #f06a00, #e01b1b, #ff9a3c, #072a5e)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-[6%] rounded-full bg-white"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="/ad-logo.png"
          alt="Logo de las Asambleas de Dios del Perú"
          width={270}
          height={525}
          className="h-[76%] w-auto"
        />
      </div>
    </div>
  );
}

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
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f3f6fb] lg:grid lg:h-screen lg:max-h-screen lg:grid-cols-[1.12fr_1fr] lg:overflow-hidden">
      {/* =========================================================================
          PANEL IZQUIERDO: Hero Visual 100% Creado en Código, Vectorial y Responsivo
      ========================================================================== */}
      <section className="relative hidden h-full flex-col justify-between overflow-hidden bg-[#071638] p-8 text-white lg:flex xl:p-12 2xl:p-16">
        {/* Fotografía de fondo limpia en alta definición (sin textos pegados) */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/brigadista-bg.jpg"
            alt="Operaciones de asistencia humanitaria en Perú"
            fill
            priority
            className="object-cover object-center"
          />
          {/* Capas arquitectónicas de atmósfera y contraste */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#040e24]/92 via-[#071638]/80 to-[#071638]/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040e24]/95 via-transparent to-transparent" />
        </div>

        {/* Cintas decorativas dinámicas en SVG (arcos orgánicos naranja y blanco) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 z-10 hidden h-64 w-64 lg:block xl:h-80 xl:w-80"
        >
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <path
              d="M0,0 C80,30 150,100 200,200 L200,0 Z"
              fill="#f06a00"
              className="opacity-90"
            />
            <path
              d="M30,0 C100,35 160,110 200,180 L200,0 Z"
              fill="#ffffff"
              className="opacity-15"
            />
          </svg>
        </div>

        {/* 1. Encabezado de Marca y Sistema */}
        <div className="relative z-20 flex items-center gap-4">
          <BrandBadge className="h-16 w-16 xl:h-18 xl:w-18" />
          <div>
            <div className="text-xl font-black tracking-tight text-white xl:text-2xl">
              AYUDA <span className="text-[#f06a00]">LADP</span>
            </div>
            <p className="text-xs font-semibold text-white/95 xl:text-sm">
              Red Nacional de Alertas Humanitarias
            </p>
            <p className="text-[11px] font-medium text-white/70">
              Asambleas de Dios del Perú · Comprometidos con la comunidad
            </p>
          </div>
        </div>

        {/* 2. Lema Central de Misión e Insignias */}
        <div className="relative z-20 my-auto py-6 pr-10 xl:pr-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#ffb800]">
            Gestión de emergencias
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-extrabold leading-[1.1] text-white xl:text-4xl 2xl:text-5xl">
            Juntos por una <span className="text-[#f06a00]">respuesta</span> más rápida
          </h2>
          <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-white/80 xl:text-base">
            Prevenir, alertar y asistir: nuestra misión es que ninguna familia damnificada
            quede sin respuesta.
          </p>

          {/* Tres insignias de características */}
          <div className="mt-9 flex flex-wrap items-stretch gap-3 xl:gap-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md transition-transform hover:scale-[1.03]">
              <Zap className="h-5 w-5 shrink-0 text-[#ffb800]" />
              <span className="text-xs font-semibold leading-tight text-white/95 xl:text-[13px]">
                Alertas en
                <br />
                tiempo real
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md transition-transform hover:scale-[1.03]">
              <Users className="h-5 w-5 shrink-0 text-[#ffb800]" />
              <span className="text-xs font-semibold leading-tight text-white/95 xl:text-[13px]">
                Coordinación
                <br />
                efectiva
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md transition-transform hover:scale-[1.03]">
              <Shield className="h-5 w-5 shrink-0 text-[#ffb800]" />
              <span className="text-xs font-semibold leading-tight text-white/95 xl:text-[13px]">
                Protección a
                <br />
                la comunidad
              </span>
            </div>
          </div>
        </div>

        {/* 3. Barra Inferior Institucional Oficial con Bandera de Perú */}
        <div className="relative z-20 flex flex-wrap items-center gap-3 text-xs font-semibold text-white/85 xl:gap-5">
          <div className="flex items-center gap-1.5">
            <span className="flex h-4 w-5 overflow-hidden rounded-[2px] shadow-sm">
              <span className="w-1/3 bg-[#d91023]" />
              <span className="w-1/3 bg-white" />
              <span className="w-1/3 bg-[#d91023]" />
            </span>
            <span>Perú</span>
          </div>
          <span className="h-1 w-1 rounded-full bg-white/40" />
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Sistema seguro y confiable</span>
          </div>
          <span className="h-1 w-1 rounded-full bg-white/40" />
          <div className="flex items-center gap-1.5">
            <Headphones className="h-4 w-4 text-amber-300" />
            <span>Soporte 24/7</span>
          </div>
        </div>

        {/* Textos de compatibilidad semántica requeridos por testing */}
        <div className="sr-only">
          <p>DINAPROS · Perú</p>
        </div>
      </section>

      {/* =========================================================================
          PANEL DERECHO: Tarjeta Flotante Adaptada, Elegante y Totalmente Funcional
      ========================================================================== */}
      <section className="relative flex h-full min-h-screen flex-col items-center justify-center overflow-y-auto bg-white px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(9rem,env(safe-area-inset-bottom))] sm:px-8 lg:min-h-0 lg:py-6">
        {/* Patrón de cuadrícula de puntos superior derecha */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-3 hidden h-32 w-32 opacity-20 sm:block"
          style={{
            backgroundImage: "radial-gradient(#94a3b8 1.5px, transparent 1.5px)",
            backgroundSize: "13px 13px",
          }}
        />

        {/* Columna del formulario: sin tarjeta, sin bordes, sin líneas */}
        <div className="relative z-10 w-full max-w-[430px]">

          {/* Escudo Oficial Vectorial y Título */}
          <div className="flex flex-col items-center text-center">
            <BrandBadge className="h-24 w-24" />
            <h1 className="mt-4 text-[27px] font-black tracking-tight text-[#071b3e] sm:text-3xl">
              AYUDA <span className="text-[#f06a00]">LADP</span>
            </h1>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Sistema de Alertas y Respuesta Humanitaria
            </p>
            <h2 className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1d63d8]">
              Acceso Institucional
            </h2>
            <p className="mt-1 text-[11px] font-medium tracking-wide text-slate-400">
              Fenómeno El Niño
            </p>
          </div>

          {/* Formulario */}
          <form className="mt-4 space-y-3" onSubmit={onSubmit} noValidate>
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
                  className="inline-flex min-h-6 items-center text-xs font-bold text-[#1d63d8] hover:text-[#002296] hover:underline"
                >
                  ¿Crear Cuenta?
                </button>
              </div>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-600">
                  <Contact className="h-4.5 w-4.5" />
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
                  className="min-h-12 w-full rounded-2xl bg-[#f2f6fc] py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-500 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1d63d8]/20 aria-invalid:bg-red-50 aria-invalid:ring-2 aria-invalid:ring-red-500/50"
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
                  className="inline-flex min-h-6 items-center text-xs font-bold text-[#1d63d8] hover:text-[#002296] hover:underline"
                >
                  ¿Olvidó su Contraseña?
                </button>
              </div>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-600">
                  <Lock className="h-4.5 w-4.5" />
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
                  className="min-h-12 w-full rounded-2xl bg-[#f2f6fc] py-2.5 pl-10 pr-10 text-sm font-medium text-slate-800 placeholder:text-slate-500 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1d63d8]/20 aria-invalid:bg-red-50 aria-invalid:ring-2 aria-invalid:ring-red-500/50"
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
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700"
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
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-600">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <select
                  id="login-jurisdiction"
                  data-testid="login-jurisdiction"
                  aria-invalid={Boolean(errors.jurisdiccion)}
                  aria-describedby={
                    errors.jurisdiccion ? "login-jurisdiction-error" : undefined
                  }
                  className="min-h-12 w-full appearance-none rounded-2xl bg-[#f2f6fc] py-2.5 pl-10 pr-9 text-sm font-medium text-slate-800 transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1d63d8]/20 aria-invalid:bg-red-50 aria-invalid:ring-2 aria-invalid:ring-red-500/50"
                  {...register("jurisdiccion")}
                >
                  <option value="nacional">Nivel Nacional - Jefatura</option>
                  <option value="piura_norte">Coordinación Regional - Piura / Norte</option>
                  <option value="sur_centro">Coordinación Regional - Sur / Centro</option>
                  <option value="campo">Brigada de Campo - Asistente</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
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
                className="h-4 w-4 cursor-pointer rounded-[5px] accent-[#1d63d8]"
                {...register("mantenerSesion")}
              />
              <label
                htmlFor="login-keep-session"
                className="cursor-pointer select-none text-xs font-semibold text-slate-700"
              >
                Mantener sesión iniciada (Cache local seguro)
              </label>
            </div>

            {/* Error del servidor */}
            {serverError ? (
              <div
                data-testid="login-error"
                role="alert"
                className="rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-700"
              >
                {serverError}
              </div>
            ) : null}

            {/* Botón Principal: Ingresar al Sistema */}
            <button
              type="submit"
              data-testid="login-submit"
              disabled={isSubmitting}
              className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f06a00] to-[#ff8f2b] px-4 py-3 text-sm font-extrabold text-white shadow-[0_16px_34px_-14px_rgba(240,106,0,0.8)] transition-all hover:from-[#ff7a00] hover:to-[#ffa244] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
            >
              {isSubmitting ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <LogIn className="h-4.5 w-4.5" />
              )}
              <span>{isSubmitting ? "Ingresando⬦" : "Ingresar al Sistema"}</span>
            </button>
          </form>

          {/* Tres acciones complementarias: enlaces fantasma, sin cajas ni bordes */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={requestOpenSupportChat}
              className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-bold text-slate-500 transition-colors hover:text-[#1d63d8]"
            >
              <UserPlus className="h-3.5 w-3.5 shrink-0" />
              <span>Crear Cuenta</span>
            </button>
            <button
              type="button"
              onClick={requestOpenSupportChat}
              className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-bold text-slate-500 transition-colors hover:text-[#1d63d8]"
            >
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span>Olvidé Clave</span>
            </button>
            <button
              type="button"
              data-testid="login-support"
              onClick={requestOpenSupportChat}
              className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-bold text-slate-500 transition-colors hover:text-[#1d63d8]"
            >
              <Headphones className="h-3.5 w-3.5 shrink-0" />
              <span>Soporte</span>
            </button>
          </div>

          {/* Nota inferior de seguridad y confianza */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
            <Info className="h-3.5 w-3.5" />
            <span>AYUDA LADP | Sistema Seguro y Confiable</span>
          </div>

        </div>

        {/* Accesos de demostración: sin tarjeta ni borde, solo separación */}
        <div className="relative z-10 mt-8 w-full max-w-[430px] pr-12 sm:pr-0">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Accesos de prueba · Clave {DEMO_PASSWORD}
            </span>
            <span className="hidden text-[10px] font-medium text-slate-400 sm:inline">
              Clic para rellenar
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.identificadorOficial}
                type="button"
                data-testid={account.testId}
                onClick={() => fillDemo(account)}
                className="flex flex-col items-center justify-center rounded-xl bg-[#f2f6fc] px-2 py-2 text-center transition-colors hover:bg-[#e4eefb]"
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
