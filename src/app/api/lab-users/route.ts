import { NextRequest, NextResponse } from 'next/server';
import { ensureColumns, query } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token no encontrado' }, { status: 401 });
    }

    const decoded: any = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    await ensureColumns('users', {
      role: 'integer DEFAULT 3',
      lab_id: 'integer',
      created_by: 'integer'
    });

    const adminRes = await query('SELECT id, role, lab_id FROM users WHERE id = $1', [decoded.userId]);
    if (adminRes.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario administrador no encontrado' }, { status: 404 });
    }

    const adminUser = adminRes.rows[0];
    if (Number(adminUser.role) !== 2) {
      return NextResponse.json({ error: 'Solo el administrador de laboratorio puede crear usuarios' }, { status: 403 });
    }

    let labId = adminUser.lab_id as number | null;
    if (!labId) {
      await query('UPDATE users SET lab_id = $1 WHERE id = $1', [adminUser.id]);
      labId = adminUser.id;
    }

    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);

    const insert = await query(
      `INSERT INTO users (email, password, first_name, last_name, role, lab_id, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, email, first_name, last_name, role, lab_id, created_by`,
      [email, hashedPassword, firstName, lastName, 3, labId, adminUser.id]
    );

    return NextResponse.json(
      {
        message: 'Usuario de laboratorio creado exitosamente',
        user: insert.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error POST /api/lab-users:', error);
    return NextResponse.json({ error: 'Error al crear usuario de laboratorio' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token no encontrado' }, { status: 401 });
    }

    const decoded: any = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    await ensureColumns('users', {
      role: 'integer DEFAULT 3',
      lab_id: 'integer'
    });

    const adminRes = await query('SELECT id, role, lab_id FROM users WHERE id = $1', [decoded.userId]);
    if (adminRes.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const adminUser = adminRes.rows[0];
    if (Number(adminUser.role) !== 2) {
      return NextResponse.json({ error: 'Solo el administrador de laboratorio puede consultar usuarios' }, { status: 403 });
    }

    const labId = adminUser.lab_id || adminUser.id;
    const usersRes = await query(
      `SELECT id, email, first_name, last_name, role, lab_id, created_at
       FROM users
       WHERE role = 3 AND lab_id = $1
       ORDER BY created_at DESC`,
      [labId]
    );

    return NextResponse.json({ users: usersRes.rows });
  } catch (error) {
    console.error('Error GET /api/lab-users:', error);
    return NextResponse.json({ error: 'Error al listar usuarios de laboratorio' }, { status: 500 });
  }
}
