-- Añadir campos al usuario para avatar, logo, dirección, rfc y teléfono
-- y campos de control de roles/laboratorio
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1024),
  ADD COLUMN IF NOT EXISTS lab_logo_url VARCHAR(1024),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS rfc VARCHAR(100),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS role INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS lab_id INTEGER,
  ADD COLUMN IF NOT EXISTS created_by INTEGER;

-- Normalizar datos existentes sin rol
UPDATE users
SET role = 2,
    lab_id = COALESCE(lab_id, id)
WHERE role IS NULL;

-- Normalizar cualquier rol fuera de rango antes de crear el CHECK
UPDATE users
SET role = 3
WHERE role NOT IN (1, 2, 3);

-- Asegurar valor por defecto y NOT NULL para role
ALTER TABLE users
  ALTER COLUMN role SET DEFAULT 3,
  ALTER COLUMN role SET NOT NULL;

-- Normalizar role/lab_id para cumplir regla de negocio
-- role=1 (admin global) => lab_id debe ser NULL
UPDATE users
SET lab_id = NULL
WHERE role = 1;

-- role=2 o role=3 => lab_id obligatorio (si falta, se asigna su propio id para no romper datos históricos)
UPDATE users
SET lab_id = id
WHERE role IN (2, 3) AND lab_id IS NULL;

-- Restringir roles válidos a 1, 2, 3 (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_check CHECK (role IN (1, 2, 3));
  END IF;
END $$;

-- Restringir coherencia role/lab_id (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_role_lab_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_lab_check CHECK (
        (role = 1 AND lab_id IS NULL)
        OR
        (role IN (2, 3) AND lab_id IS NOT NULL)
      );
  END IF;
END $$;

-- Verificación
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';

SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname IN ('users_role_check', 'users_role_lab_check');
