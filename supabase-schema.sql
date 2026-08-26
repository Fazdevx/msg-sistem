-- ============================================================
-- ESQUEMA BD - SISTEMA DE MENSAJERÍA INTERNA PARA GESTIÓN ESCOLAR
-- ============================================================

-- Drop existente (para poder re-ejecutar el script completo)
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS historial_estados CASCADE;
DROP TABLE IF EXISTS documentos CASCADE;
DROP TABLE IF EXISTS aprobaciones CASCADE;
DROP TABLE IF EXISTS destinatarios CASCADE;
DROP TABLE IF EXISTS mensajes CASCADE;
DROP TABLE IF EXISTS tipos_mensaje_personalizados CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS areas CASCADE;

DROP TYPE IF EXISTS estado_mensaje;
DROP TYPE IF EXISTS tipo_mensaje;
DROP TYPE IF EXISTS rol_usuario;

-- 1. ROLES (acceso al sistema, no áreas)
CREATE TYPE rol_usuario AS ENUM ('admin', 'directivo', 'personal');

-- 2. TIPOS DE MENSAJE
CREATE TYPE tipo_mensaje AS ENUM (
  'aprobacion',        -- Solicitud de aprobación (permisos, compras, etc.)
  'comunicado',        -- Comunicado interno (texto + opcional adjunto)
  'documento',         -- Documento formal (circular, resolución, memorándum)
  'notificacion'       -- Notificación del sistema
);

-- 3. ESTADOS
CREATE TYPE estado_mensaje AS ENUM (
  'pendiente',
  'aprobado',
  'rechazado',
  'enviado',
  'leido',
  'archivado'
);

-- ============================================================
-- TABLAS
-- ============================================================

-- 4. ÁREAS DE GESTIÓN (departamentos del colegio)
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,               -- ej: "Administración", "Logística", "Secretaría", "Dirección"
  descripcion TEXT,
  correo_institucional TEXT UNIQUE,          -- ej: administracion@colegio.edu.ar
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. USUARIOS (personal del colegio)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  rol rol_usuario NOT NULL DEFAULT 'personal',
  telefono TEXT,
  avatar_url TEXT,
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TIPOS DE MENSAJE PERSONALIZADOS (configurables por el admin)
CREATE TABLE tipos_mensaje_personalizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,                       -- ej: "Solicitud de compra", "Permiso personal"
  slug TEXT UNIQUE NOT NULL,                  -- ej: "solicitud-compra"
  tipo_base tipo_mensaje NOT NULL,            -- el tipo base (aprobacion, comunicado, etc.)
  requiere_aprobacion BOOLEAN DEFAULT false,
  requiere_documento BOOLEAN DEFAULT false,
  plazo_respuesta_horas INTEGER,             -- tiempo límite para responder
  roles_emisor rol_usuario[],                -- quiénes pueden enviar este tipo
  areas_emisor UUID[],                        -- qué áreas pueden enviarlo (opcional, sin FK por ser array)
  roles_receptor rol_usuario[],              -- quiénes pueden recibirlo
  areas_receptor UUID[],                      -- a qué áreas va dirigido (opcional, sin FK por ser array)
  plantilla_texto TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. MENSAJES
CREATE TABLE mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remitente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  area_remitente_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,  -- desde qué área se envía
  tipo_base tipo_mensaje NOT NULL,
  tipo_personalizado_id UUID REFERENCES tipos_mensaje_personalizados(id) ON DELETE SET NULL,
  asunto TEXT NOT NULL,
  cuerpo TEXT,
  estado estado_mensaje DEFAULT 'pendiente',
  prioridad INTEGER DEFAULT 0,              -- 0=normal, 1=importante, 2=urgente
  responder_hasta TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. DESTINATARIOS (puede ser a usuarios y/o áreas completas)
CREATE TABLE destinatarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensaje_id UUID NOT NULL REFERENCES mensajes(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  area_id UUID REFERENCES areas(id) ON DELETE CASCADE,     -- si se envía a toda un área
  leido BOOLEAN DEFAULT false,
  leido_en TIMESTAMPTZ,
  archivado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT destino_check CHECK (
    (usuario_id IS NOT NULL) OR (area_id IS NOT NULL)
  )
);

-- 9. APROBACIONES
CREATE TABLE aprobaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensaje_id UUID NOT NULL REFERENCES mensajes(id) ON DELETE CASCADE,
  aprobador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  estado estado_mensaje NOT NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (mensaje_id, aprobador_id)
);

-- 10. DOCUMENTOS ADJUNTOS (Supabase Storage)
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensaje_id UUID NOT NULL REFERENCES mensajes(id) ON DELETE CASCADE,
  nombre_original TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo_mime TEXT NOT NULL,
  tamano_bytes INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. HISTORIAL DE CAMBIOS DE ESTADO
CREATE TABLE historial_estados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensaje_id UUID NOT NULL REFERENCES mensajes(id) ON DELETE CASCADE,
  estado_anterior estado_mensaje,
  estado_nuevo estado_mensaje NOT NULL,
  cambiado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. LOGS DE ACCIÓN DEL ADMIN
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  accion TEXT NOT NULL,                     -- ej: "crear_usuario", "asignar_area", "desactivar_usuario"
  detalle JSONB,                            -- datos adicionales de la acción
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_usuarios_area ON usuarios(area_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_mensajes_remitente ON mensajes(remitente_id);
CREATE INDEX idx_mensajes_area ON mensajes(area_remitente_id);
CREATE INDEX idx_mensajes_tipo ON mensajes(tipo_base);
CREATE INDEX idx_mensajes_estado ON mensajes(estado);
CREATE INDEX idx_mensajes_created ON mensajes(created_at DESC);
CREATE INDEX idx_destinatarios_usuario ON destinatarios(usuario_id);
CREATE INDEX idx_destinatarios_area ON destinatarios(area_id);
CREATE INDEX idx_destinatarios_no_leidos ON destinatarios(usuario_id, leido) WHERE leido = false;
CREATE INDEX idx_aprobaciones_mensaje ON aprobaciones(mensaje_id);
CREATE INDEX idx_documentos_mensaje ON documentos(mensaje_id);
CREATE INDEX idx_historial_mensaje ON historial_estados(mensaje_id);
CREATE INDEX idx_tipos_activos ON tipos_mensaje_personalizados(activo) WHERE activo = true;

-- ============================================================
-- FUNCIONES
-- ============================================================

-- Mensajes no leídos de un usuario (incluye los de su área)
CREATE OR REPLACE FUNCTION mensajes_no_leidos(p_usuario_id UUID)
RETURNS TABLE (total BIGINT) AS $$
  SELECT COUNT(*)
  FROM destinatarios d
  WHERE (
    d.usuario_id = p_usuario_id
    OR d.area_id IN (SELECT u.area_id FROM usuarios u WHERE u.id = p_usuario_id)
  )
  AND d.leido = false AND d.archivado = false;
$$ LANGUAGE SQL STABLE;

-- Marcar como leído
CREATE OR REPLACE FUNCTION marcar_leido(p_destinatario_id UUID)
RETURNS VOID AS $$
  UPDATE destinatarios
  SET leido = true, leido_en = now()
  WHERE id = p_destinatario_id AND leido = false;
$$ LANGUAGE SQL;

-- ============================================================
-- TRIGGER: HISTORIAL AUTOMÁTICO DE ESTADOS
-- ============================================================
CREATE OR REPLACE FUNCTION fn_historial_estados()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO historial_estados (mensaje_id, estado_anterior, estado_nuevo)
    VALUES (NEW.id, OLD.estado, NEW.estado);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_historial_estados
  AFTER UPDATE OF estado ON mensajes
  FOR EACH ROW
  EXECUTE FUNCTION fn_historial_estados();

-- ============================================================
-- FUNCIÓN HELPER: obtiene el rol del usuario autenticado
-- ============================================================
CREATE OR REPLACE FUNCTION public.rol_usuario()
RETURNS rol_usuario
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  SELECT rol FROM public.usuarios WHERE id = auth.uid();
$$;

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE aprobaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_mensaje_personalizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY admin_todo ON usuarios FOR ALL USING (rol_usuario() = 'admin');
CREATE POLICY admin_todo_areas ON areas FOR ALL USING (rol_usuario() = 'admin');
CREATE POLICY admin_todo_mensajes ON mensajes FOR ALL USING (rol_usuario() = 'admin');
CREATE POLICY admin_todo_logs ON admin_logs FOR ALL USING (rol_usuario() = 'admin');

-- Personal: solo lectura de su propio perfil
CREATE POLICY personal_self ON usuarios
  FOR SELECT
  USING (id = auth.uid());

-- Mensajes: visible si eres remitente, destinatario, o perteneces al área destino
CREATE POLICY mensajes_visible ON mensajes
  FOR SELECT
  USING (
    remitente_id = auth.uid()
    OR id IN (SELECT mensaje_id FROM destinatarios WHERE usuario_id = auth.uid())
    OR id IN (SELECT mensaje_id FROM destinatarios WHERE area_id IN (
      SELECT area_id FROM usuarios WHERE id = auth.uid()
    ))
  );

-- Destinatarios: solo los propios o de tu área
CREATE POLICY destinatarios_visible ON destinatarios
  FOR SELECT
  USING (
    usuario_id = auth.uid()
    OR area_id IN (SELECT area_id FROM usuarios WHERE id = auth.uid())
  );

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Áreas de gestión
INSERT INTO areas (nombre, descripcion, correo_institucional) VALUES
  ('Dirección', 'Dirección general del colegio', 'direccion@colegio.edu.ar'),
  ('Administración', 'Gestión administrativa y financiera', 'administracion@colegio.edu.ar'),
  ('Logística', 'Mantenimiento, transporte y recursos', 'logistica@colegio.edu.ar'),
  ('Secretaría', 'Gestión documental y atención', 'secretaria@colegio.edu.ar'),
  ('Recursos Humanos', 'Personal y legajos', 'rrhh@colegio.edu.ar'),
  ('Informática', 'Soporte técnico y sistemas', 'informatica@colegio.edu.ar');

-- Tipos de mensaje personalizados
INSERT INTO tipos_mensaje_personalizados (nombre, slug, tipo_base, requiere_aprobacion, roles_emisor, roles_receptor, areas_emisor, areas_receptor) VALUES
  ('Solicitud de compra', 'solicitud-compra', 'aprobacion', true,
   '{personal}', '{admin,directivo}',
   NULL, NULL),

  ('Permiso personal', 'permiso-personal', 'aprobacion', true,
   '{personal}', '{admin,directivo}',
   NULL, NULL),

  ('Comunicado general', 'comunicado-general', 'comunicado', false,
   '{admin,directivo}', '{personal}',
   NULL, NULL),

  ('Memorándum interno', 'memorandum', 'documento', false,
   '{admin,directivo}', '{personal}',
   NULL, NULL),

  ('Solicitud de soporte técnico', 'solicitud-soporte', 'aprobacion', false,
   '{personal}', '{personal}',
   NULL, NULL),

  ('Notificación de pago', 'notificacion-pago', 'notificacion', false,
   '{admin}', '{personal}',
   NULL, NULL);