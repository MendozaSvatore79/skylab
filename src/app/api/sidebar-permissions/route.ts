import { NextRequest, NextResponse } from 'next/server';
import { ensureColumns, query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { SIDEBAR_PERMISSION_KEYS } from '@/config/sidebarNavigation';

async function ensurePermissionsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS sidebar_permissions (
      id SERIAL PRIMARY KEY,
      lab_id INTEGER NOT NULL,
      permission_key VARCHAR(100) NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (lab_id, permission_key)
    )
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_sidebar_permissions_lab_id ON sidebar_permissions(lab_id)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_sidebar_permissions_permission_key ON sidebar_permissions(permission_key)`);
}

async function getCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return null;

  const decoded: any = verifyToken(token);
  if (!decoded) return null;

  await ensureColumns('users', {
    role: 'integer DEFAULT 3',
    lab_id: 'integer'
  });

  const result = await query('SELECT id, role, lab_id FROM users WHERE id = $1', [decoded.userId]);
  if (result.rows.length === 0) return null;

  return result.rows[0];
}

async function seedDefaults(labId: number) {
  for (const permissionKey of SIDEBAR_PERMISSION_KEYS) {
    await query(
      `INSERT INTO sidebar_permissions (lab_id, permission_key, enabled)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (lab_id, permission_key) DO NOTHING`,
      [labId, permissionKey]
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensurePermissionsTable();

    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    if (![2, 3].includes(Number(currentUser.role))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const labId = Number(currentUser.lab_id || currentUser.id);
    await seedDefaults(labId);

    const permissionsResult = await query(
      `SELECT permission_key, enabled
       FROM sidebar_permissions
       WHERE lab_id = $1
       ORDER BY permission_key ASC`,
      [labId]
    );

    const permissions = permissionsResult.rows.map((row: any) => ({
      key: row.permission_key,
      enabled: row.enabled,
    }));

    return NextResponse.json({
      labId,
      permissions,
      enabledKeys: permissions.filter((permission: any) => permission.enabled).map((permission: any) => permission.key),
    });
  } catch (error) {
    console.error('Error GET /api/sidebar-permissions:', error);
    return NextResponse.json({ error: 'Error al obtener permisos del sidebar' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensurePermissionsTable();

    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    if (Number(currentUser.role) !== 2) {
      return NextResponse.json({ error: 'Solo el administrador de laboratorio puede modificar permisos' }, { status: 403 });
    }

    const labId = Number(currentUser.lab_id || currentUser.id);
    await seedDefaults(labId);

    const body = await request.json();
    const enabledKeys = Array.isArray(body.enabledKeys) ? body.enabledKeys : [];
    const normalizedEnabledKeys = new Set(
      enabledKeys.filter((key: string) => SIDEBAR_PERMISSION_KEYS.includes(key))
    );

    for (const permissionKey of SIDEBAR_PERMISSION_KEYS) {
      await query(
        `UPDATE sidebar_permissions
         SET enabled = $1, updated_at = NOW()
         WHERE lab_id = $2 AND permission_key = $3`,
        [normalizedEnabledKeys.has(permissionKey), labId, permissionKey]
      );
    }

    const permissionsResult = await query(
      `SELECT permission_key, enabled
       FROM sidebar_permissions
       WHERE lab_id = $1
       ORDER BY permission_key ASC`,
      [labId]
    );

    return NextResponse.json({
      message: 'Permisos actualizados',
      permissions: permissionsResult.rows.map((row: any) => ({
        key: row.permission_key,
        enabled: row.enabled,
      })),
      enabledKeys: permissionsResult.rows.filter((row: any) => row.enabled).map((row: any) => row.permission_key),
    });
  } catch (error) {
    console.error('Error PUT /api/sidebar-permissions:', error);
    return NextResponse.json({ error: 'Error al actualizar permisos del sidebar' }, { status: 500 });
  }
}
