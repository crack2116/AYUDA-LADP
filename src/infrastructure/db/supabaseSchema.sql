-- AYUDA LADP - Supabase-ready schema (PostgreSQL 15)
-- Local runtime uses the localStorage adapter; this DDL is the cloud target.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Roles mirror the three product views.
CREATE TYPE user_role AS ENUM ('jefatura', 'coordinador', 'asistente');

-- ---------------------------------------------------------------- centros poblados
CREATE TABLE public.centros_poblados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  sector text NOT NULL,
  region text NOT NULL,
  coordinador_zona_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_centros_poblados_region ON public.centros_poblados (region);
CREATE INDEX idx_centros_poblados_nombre_trgm
  ON public.centros_poblados USING gin (nombre gin_trgm_ops);
CREATE INDEX idx_centros_poblados_sector_trgm
  ON public.centros_poblados USING gin (sector gin_trgm_ops);

-- ---------------------------------------------------------------- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  identificador_oficial text NOT NULL UNIQUE,
  nombre text NOT NULL,
  rol user_role NOT NULL,
  -- null means national scope (jefatura)
  teatro_operaciones_region text
);

-- ---------------------------------------------------------------- audit code
CREATE SEQUENCE public.incidencia_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generar_codigo_incidencia()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.codigo_auditoria IS NULL THEN
    NEW.codigo_auditoria :=
      'INC-' || EXTRACT(YEAR FROM CURRENT_DATE)::int || '-' ||
      LPAD(nextval('public.incidencia_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------- incidencias
CREATE TABLE public.incidencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_auditoria text UNIQUE NOT NULL,
  centro_poblado_id uuid NOT NULL REFERENCES public.centros_poblados (id) ON DELETE RESTRICT,
  tipo_afectacion text NOT NULL CHECK (
    tipo_afectacion IN (
      'inundacion',
      'huaico',
      'colapso_vivienda',
      'aislamiento_vial',
      'corte_servicios',
      'desborde_rio',
      'otro'
    )
  ),
  hogares_afectados integer NOT NULL CHECK (hogares_afectados >= 0),
  necesidad_principal text NOT NULL CHECK (
    necesidad_principal IN (
      'agua_potable',
      'alimentos',
      'carpas_abrigo',
      'atencion_medica',
      'maquinaria_limpieza',
      'evacuacion_rescate',
      'kits_higiene',
      'otro'
    )
  ),
  ocurrio_hoy boolean NOT NULL DEFAULT true,
  fecha_suceso date NOT NULL CHECK (fecha_suceso <= CURRENT_DATE),
  gps_coords text,
  nota_referencia text CHECK (char_length(nota_referencia) <= 280),
  verificado boolean NOT NULL DEFAULT false,
  creado_por uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_incidencias_codigo
BEFORE INSERT ON public.incidencias
FOR EACH ROW
EXECUTE FUNCTION public.generar_codigo_incidencia();

CREATE INDEX idx_incidencias_centro ON public.incidencias (centro_poblado_id);
CREATE INDEX idx_incidencias_created_at ON public.incidencias (created_at);
CREATE INDEX idx_incidencias_verificado ON public.incidencias (verificado);
-- Trigram GIN keeps "necesidad principal" searches fast in dashboards.
CREATE INDEX idx_incidencias_necesidad_trgm
  ON public.incidencias USING gin (necesidad_principal gin_trgm_ops);

-- ---------------------------------------------------------------- support tickets
CREATE TABLE public.tickets_soporte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  opcion_problema text NOT NULL CHECK (
    opcion_problema IN (
      'datos_no_cargan',
      'centro_no_aparece',
      'error_codigo_inc',
      'error_validar_existencia'
    )
  ),
  detalle_opcional text CHECK (char_length(detalle_opcional) <= 200),
  ruta_origen text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_soporte_usuario ON public.tickets_soporte (usuario_id);
CREATE INDEX idx_tickets_soporte_created_at ON public.tickets_soporte (created_at);

-- ---------------------------------------------------------------- role helpers
CREATE OR REPLACE FUNCTION public.current_rol()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_region()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT teatro_operaciones_region FROM public.profiles WHERE id = auth.uid();
$$;

-- ---------------------------------------------------------------- RLS
ALTER TABLE public.centros_poblados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets_soporte ENABLE ROW LEVEL SECURITY;

-- centros_poblados: everyone signed in can search; only jefatura can change the catalog.
CREATE POLICY centros_select_authenticated ON public.centros_poblados
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY centros_insert_jefatura ON public.centros_poblados
  FOR INSERT TO authenticated
  WITH CHECK (public.current_rol() = 'jefatura');

CREATE POLICY centros_update_jefatura ON public.centros_poblados
  FOR UPDATE TO authenticated
  USING (public.current_rol() = 'jefatura')
  WITH CHECK (public.current_rol() = 'jefatura');

-- profiles: own row, national jefatura, or a coordinator's own region.
CREATE POLICY profiles_select_own_or_jefatura ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.current_rol() = 'jefatura');

CREATE POLICY profiles_select_coordinador_region ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.current_rol() = 'coordinador'
    AND teatro_operaciones_region = public.current_region()
  );

CREATE POLICY profiles_update_own_or_jefatura ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.current_rol() = 'jefatura')
  WITH CHECK (id = auth.uid() OR public.current_rol() = 'jefatura');

-- incidencias: jefatura sees the whole country.
CREATE POLICY incidencias_select_jefatura ON public.incidencias
  FOR SELECT TO authenticated
  USING (public.current_rol() = 'jefatura');

-- incidencias: coordinators see their region through the centro poblado join.
CREATE POLICY incidencias_select_coordinador ON public.incidencias
  FOR SELECT TO authenticated
  USING (
    public.current_rol() = 'coordinador'
    AND EXISTS (
      SELECT 1
      FROM public.centros_poblados centro
      WHERE centro.id = incidencias.centro_poblado_id
        AND centro.region = public.current_region()
    )
  );

-- incidencias: assistants see only their own reports.
CREATE POLICY incidencias_select_asistente ON public.incidencias
  FOR SELECT TO authenticated
  USING (public.current_rol() = 'asistente' AND creado_por = auth.uid());

CREATE POLICY incidencias_insert_jefatura ON public.incidencias
  FOR INSERT TO authenticated
  WITH CHECK (public.current_rol() = 'jefatura');

CREATE POLICY incidencias_insert_coordinador ON public.incidencias
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_rol() = 'coordinador'
    AND EXISTS (
      SELECT 1
      FROM public.centros_poblados centro
      WHERE centro.id = centro_poblado_id
        AND centro.region = public.current_region()
    )
  );

CREATE POLICY incidencias_insert_asistente ON public.incidencias
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_rol() = 'asistente'
    AND creado_por = auth.uid()
  );

CREATE POLICY incidencias_update_jefatura ON public.incidencias
  FOR UPDATE TO authenticated
  USING (public.current_rol() = 'jefatura')
  WITH CHECK (public.current_rol() = 'jefatura');

CREATE POLICY incidencias_update_coordinador ON public.incidencias
  FOR UPDATE TO authenticated
  USING (
    public.current_rol() = 'coordinador'
    AND EXISTS (
      SELECT 1
      FROM public.centros_poblados centro
      WHERE centro.id = incidencias.centro_poblado_id
        AND centro.region = public.current_region()
    )
  )
  WITH CHECK (
    public.current_rol() = 'coordinador'
    AND EXISTS (
      SELECT 1
      FROM public.centros_poblados centro
      WHERE centro.id = centro_poblado_id
        AND centro.region = public.current_region()
    )
  );

-- tickets_soporte: any signed-in user opens a ticket; only the owner or jefatura reads it.
CREATE POLICY tickets_insert_authenticated ON public.tickets_soporte
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (usuario_id IS NULL OR usuario_id = auth.uid()));

CREATE POLICY tickets_select_jefatura ON public.tickets_soporte
  FOR SELECT TO authenticated
  USING (public.current_rol() = 'jefatura');

CREATE POLICY tickets_select_own ON public.tickets_soporte
  FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());

-- ---------------------------------------------------------------- grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.centros_poblados TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.incidencias TO authenticated;
GRANT SELECT, INSERT ON public.tickets_soporte TO authenticated;
GRANT USAGE ON SEQUENCE public.incidencia_seq TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_rol() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_region() TO authenticated;
