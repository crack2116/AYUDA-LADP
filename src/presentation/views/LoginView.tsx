"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Flame,
  Loader2,
  RadioTower,
  Shield,
  ShieldCheck,
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

const FEATURES = [
  { icon: RadioTower, label: "Alertas en tiempo real" },
  { icon: Users, label: "Coordinación efectiva" },
  { icon: Shield, label: "Protección a la comunidad" },
] as const;

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
    <div className="min-h-screen bg-ladp-bg lg:grid lg:grid-cols-[1.05fr_1fr]">
      <section className="relative overflow-hidden bg-ladp-navy px-5 py-10 sm:px-10 lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:px-14 lg:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-ladp-cobalt-light/40"
        />

        <div className="relative mx-auto w-full max-w-lg">
          <div className="flex items-center gap-4">
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-ladp-cobalt shadow-lg shadow-black/30">
              <ShieldCheck className="h-9 w-9 text-white" aria-hidden={true} />
              <Flame
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-ladp-navy-dark p-1 text-ladp-orange"
                aria-hidden={true}
              />
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-ladp-amber">
              DINAPROS · Perú
            </p>
          </div>

          <h1 className="mt-8 text-5xl font-black leading-none tracking-tight text-white sm:text-6xl">
            AYUDA LADP
          </h1>
          <p className="mt-4 max-w-md text-lg font-semibold leading-snug text-white/85">
            Sistema de Alertas y Respuesta Humanitaria
          </p>
          <p className="mt-3 inline-block rounded-full border border-ladp-orange/50 bg-ladp-orange/10 px-4 py-1.5 text-sm font-bold text-ladp-amber">
            Juntos por una respuesta más rápida
          </p>

          <ul className="mt-10 space-y-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li
                  key={feature.label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ladp-cobalt text-white">
                    <Icon className="h-5 w-5" aria-hidden={true} />
                  </span>
                  <span className="text-sm font-semibold text-white">{feature.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:min-h-screen lg:py-16">
        <div className="w-full max-w-md">
          <div className="ladp-surface-card p-5 sm:p-7">
            <h2 className="text-2xl font-black tracking-tight text-ladp-navy-dark">
              Acceso Institucional
            </h2>
            <p className="mt-1 text-sm text-ladp-slate">
              Ingresa con tus credenciales oficiales de brigada.
            </p>

            <form className="mt-6 space-y-5" onSubmit={onSubmit} noValidate>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="login-identifier"
                    className="text-sm font-bold text-ladp-navy-dark"
                  >
                    Identificador Oficial
                  </label>
                  <button
                    type="button"
                    onClick={requestOpenSupportChat}
                    className="inline-flex min-h-11 items-center text-sm font-bold text-ladp-cobalt underline underline-offset-4 hover:text-ladp-orange"
                  >
                    ¿Crear Cuenta?
                  </button>
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
                  className="mt-2 min-h-12 w-full rounded-xl border border-ladp-navy/20 bg-white px-4 text-base text-ladp-navy-dark placeholder:text-ladp-slate-light aria-invalid:border-red-600"
                  {...register("identificadorOficial")}
                />
                {errors.identificadorOficial ? (
                  <p
                    id="login-identifier-error"
                    role="alert"
                    className="mt-1.5 text-sm font-semibold text-red-700"
                  >
                    {errors.identificadorOficial.message}
                  </p>
                ) : null}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="login-password"
                    className="text-sm font-bold text-ladp-navy-dark"
                  >
                    Clave Operacional
                  </label>
                  <button
                    type="button"
                    onClick={requestOpenSupportChat}
                    className="inline-flex min-h-11 items-center text-sm font-bold text-ladp-cobalt underline underline-offset-4 hover:text-ladp-orange"
                  >
                    ¿Olvidó su Contraseña?
                  </button>
                </div>
                <div className="relative mt-2">
                  <input
                    id="login-password"
                    data-testid="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.claveOperacional)}
                    aria-describedby={
                      errors.claveOperacional ? "login-password-error" : undefined
                    }
                    className="min-h-12 w-full rounded-xl border border-ladp-navy/20 bg-white px-4 pr-14 text-base text-ladp-navy-dark aria-invalid:border-red-600"
                    {...register("claveOperacional")}
                  />
                  <button
                    type="button"
                    data-testid="login-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Ocultar clave operacional" : "Mostrar clave operacional"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex min-h-11 min-w-11 items-center justify-center rounded-r-xl px-3 text-ladp-slate hover:text-ladp-cobalt"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden={true} />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden={true} />
                    )}
                  </button>
                </div>
                {errors.claveOperacional ? (
                  <p
                    id="login-password-error"
                    role="alert"
                    className="mt-1.5 text-sm font-semibold text-red-700"
                  >
                    {errors.claveOperacional.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="login-jurisdiction"
                  className="text-sm font-bold text-ladp-navy-dark"
                >
                  Jurisdicción / Teatro de Operaciones
                </label>
                <select
                  id="login-jurisdiction"
                  data-testid="login-jurisdiction"
                  aria-invalid={Boolean(errors.jurisdiccion)}
                  aria-describedby={
                    errors.jurisdiccion ? "login-jurisdiction-error" : undefined
                  }
                  className="mt-2 min-h-12 w-full rounded-xl border border-ladp-navy/20 bg-white px-3 text-base font-semibold text-ladp-navy-dark aria-invalid:border-red-600"
                  {...register("jurisdiccion")}
                >
                  <option value="nacional">Nivel Nacional - Jefatura</option>
                  <option value="piura_norte">Coordinación Regional - Piura / Norte</option>
                  <option value="sur_centro">Coordinación Regional - Sur / Centro</option>
                  <option value="campo">Brigada de Campo - Asistente</option>
                </select>
                {errors.jurisdiccion ? (
                  <p
                    id="login-jurisdiction-error"
                    role="alert"
                    className="mt-1.5 text-sm font-semibold text-red-700"
                  >
                    {errors.jurisdiccion.message}
                  </p>
                ) : null}
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="login-keep-session"
                  data-testid="login-keep-session"
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-ladp-navy/30 accent-ladp-orange"
                  {...register("mantenerSesion")}
                />
                <label
                  htmlFor="login-keep-session"
                  className="text-sm font-semibold leading-snug text-ladp-navy-dark"
                >
                  Mantener sesión iniciada (Caché local seguro)
                </label>
              </div>

              {serverError ? (
                <p
                  data-testid="login-error"
                  role="alert"
                  className="rounded-xl border border-red-600/30 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
                >
                  {serverError}
                </p>
              ) : null}

              <button
                type="submit"
                data-testid="login-submit"
                disabled={isSubmitting}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ladp-orange px-5 text-base font-black text-white shadow-lg shadow-orange-900/20 transition-colors hover:bg-ladp-orange-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden={true} />
                ) : (
                  <ArrowRight className="h-5 w-5" aria-hidden={true} />
                )}
                {isSubmitting ? "Ingresando…" : "Ingresar al Sistema"}
              </button>
            </form>

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={requestOpenSupportChat}
                className="min-h-11 rounded-lg border border-ladp-navy/15 px-3 text-sm font-bold text-ladp-navy-dark hover:border-ladp-cobalt hover:text-ladp-cobalt"
              >
                Crear Cuenta
              </button>
              <button
                type="button"
                onClick={requestOpenSupportChat}
                className="min-h-11 rounded-lg border border-ladp-navy/15 px-3 text-sm font-bold text-ladp-navy-dark hover:border-ladp-cobalt hover:text-ladp-cobalt"
              >
                Olvidé mi Contraseña
              </button>
              <button
                type="button"
                data-testid="login-support"
                onClick={requestOpenSupportChat}
                className="min-h-11 rounded-lg border border-ladp-orange/40 bg-orange-50 px-3 text-sm font-bold text-ladp-orange hover:bg-orange-100"
              >
                Soporte
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-ladp-navy/20 bg-white/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-ladp-slate">
              Acceso de demostración · clave {DEMO_PASSWORD}
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.identificadorOficial}
                  type="button"
                  data-testid={account.testId}
                  onClick={() => fillDemo(account)}
                  className="min-h-11 rounded-lg border border-ladp-navy/15 bg-ladp-surface px-3 py-2 text-left hover:border-ladp-cobalt"
                >
                  <span className="block font-mono text-sm font-bold text-ladp-navy-dark">
                    {account.label}
                  </span>
                  <span className="block text-[11px] font-medium text-ladp-slate">
                    {account.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-4 text-center text-xs font-medium text-ladp-slate">
            Uso oficial · Jefatura, coordinaciones regionales y brigadas de campo
          </p>
        </div>
      </section>
    </div>
  );
}
