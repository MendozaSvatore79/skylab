import { NextRequest, NextResponse } from 'next/server';
import { ensureColumns, query } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await ensureColumns('users', {
      role: 'integer DEFAULT 3',
      lab_id: 'integer'
    });

    const body = await request.json();
    const { email, password, firstName, lastName, confirmPassword, role, globalAdminKey } = body;

    const requestedRole = Number(role || 2);
    if (![1, 2].includes(requestedRole)) {
      return NextResponse.json(
        { error: 'Rol inválido. Solo se permite 1 (admin global) o 2 (admin laboratorio)' },
        { status: 400 }
      );
    }

    // Validaciones
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas no coinciden' },
        { status: 400 }
      );
    }

    if (requestedRole === 1) {
      const configuredKey = process.env.GLOBAL_ADMIN_KEY;
      if (!configuredKey) {
        return NextResponse.json(
          { error: 'GLOBAL_ADMIN_KEY no está configurada en el servidor' },
          { status: 500 }
        );
      }
      if (!globalAdminKey || globalAdminKey !== configuredKey) {
        return NextResponse.json(
          { error: 'Clave de administrador global inválida' },
          { status: 403 }
        );
      }
    }

    // Verificar si el usuario ya existe
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hash de contraseña
    const hashedPassword = hashPassword(password);

    // Signup permite role=2 por defecto y role=1 con clave GLOBAL_ADMIN_KEY
    const result = await query(
      'INSERT INTO users (email, password, first_name, last_name, role, lab_id, created_at) VALUES ($1, $2, $3, $4, $5, NULL, NOW()) RETURNING id, email, first_name, last_name, role, lab_id',
      [email, hashedPassword, firstName, lastName, requestedRole]
    );

    const user = result.rows[0];

    // El admin de laboratorio (rol 2) queda ligado a su propio laboratorio (lab_id = id)
    if (Number(user.role) === 2) {
      await query('UPDATE users SET lab_id = $1 WHERE id = $1', [user.id]);
      user.lab_id = user.id;
    }

    const token = generateToken(user.id, user.email, user.role, user.lab_id);

    return NextResponse.json(
      {
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          lab_id: user.lab_id,
        },
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en signup:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}
