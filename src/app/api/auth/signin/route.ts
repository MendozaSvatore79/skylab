import { NextRequest, NextResponse } from 'next/server';
import { ensureColumns, query } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await ensureColumns('users', {
      role: 'integer DEFAULT 3',
      lab_id: 'integer'
    });

    const body = await request.json();
    const { email, password } = body;

    // Validaciones
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario
    const result = await query(
      'SELECT id, email, password, first_name, last_name, role, lab_id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isPasswordValid = verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Generar token
    const token = generateToken(user.id, user.email, user.role, user.lab_id);

    return NextResponse.json(
      {
        message: 'Login exitoso',
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
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en signin:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
