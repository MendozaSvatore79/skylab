-- Tabla para permisos de sidebar por laboratorio
CREATE TABLE IF NOT EXISTS sidebar_permissions (
  id SERIAL PRIMARY KEY,
  lab_id INTEGER NOT NULL,
  permission_key VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (lab_id, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_sidebar_permissions_lab_id ON sidebar_permissions(lab_id);
CREATE INDEX IF NOT EXISTS idx_sidebar_permissions_permission_key ON sidebar_permissions(permission_key);
