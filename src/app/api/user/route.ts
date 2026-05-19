import { NextRequest, NextResponse } from 'next/server';
import { query, ensureColumns } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

async function saveBase64File(base64: string, prefix: string): Promise<string> {
  // base64 may be like 'data:image/png;base64,AAA...'
  const matches = base64.match(/^data:(.+);base64,(.+)$/);
  let ext = 'png';
  let data = base64;
  if (matches) {
    const mime = matches[1];
    const payload = matches[2];
    data = payload;
    const mimeParts = mime.split('/');
    const rawExt = mimeParts[1] || ext;
    ext = rawExt.split('+')[0] || ext;
    if (ext === 'jpeg') ext = 'jpg';
  } else {
    // assume raw base64, keep png
  }

  const fileName = `${prefix}_${Date.now()}.${ext}`;
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, fileName);
  await fs.writeFile(filePath, Buffer.from(data, 'base64'));
  // return the public URL path
  return `/uploads/${fileName}`;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token no encontrado' }, { status: 401 });
    }

    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

    // If the DB is missing the optional user columns, try to add them automatically.
    // This is a best-effort migration: it will attempt to ALTER TABLE ADD COLUMN IF NOT EXISTS.
    await ensureColumns('users', {
      avatar_url: 'varchar(255)',
      lab_logo_url: 'varchar(255)',
      address: 'text',
      rfc: 'varchar(64)',
      phone: 'varchar(64)',
      role: 'integer DEFAULT 3',
      lab_id: 'integer'
    });

    // Build a SELECT dynamically based on existing columns to avoid
    // throwing errors when the DB schema hasn't been migrated yet.
    const desiredCols = [
      'id', 'email', 'first_name', 'last_name', 'role', 'lab_id', 'avatar_url', 'lab_logo_url', 'address', 'rfc', 'phone', 'created_at', 'updated_at'
    ];
    const colRes = await query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = ANY($1)`,
      [desiredCols]
    );
    const existing = new Set(colRes.rows.map((r: any) => r.column_name));
    const selectCols = desiredCols.filter(c => existing.has(c));
    if (selectCols.length === 0) {
      return NextResponse.json({ error: 'No user columns found in database' }, { status: 500 });
    }

    const sql = `SELECT ${selectCols.join(', ')} FROM users WHERE id = $1`;
    const result = await query(sql, [decoded.userId]);

    if (result.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error GET /api/user:', error);
    return NextResponse.json({ error: 'Error fetching user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token no encontrado' }, { status: 401 });
    }

    const decoded: any = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

    // Ensure optional columns exist before attempting to update them
    await ensureColumns('users', {
      avatar_url: 'varchar(255)',
      lab_logo_url: 'varchar(255)',
      address: 'text',
      rfc: 'varchar(64)',
      phone: 'varchar(64)',
      role: 'integer DEFAULT 3',
      lab_id: 'integer'
    });

    const body = await request.json();
    const {
      firstName,
      lastName,
      address,
      rfc,
      phone,
      avatarUrl: selectedAvatarUrl,
      avatarBase64,
      labLogoBase64,
    } = body;

    let avatarUrl: string | null = null;
    let labLogoUrl = null;

    if (avatarBase64) {
      try {
        avatarUrl = await saveBase64File(avatarBase64, `avatar_${decoded.userId}`);
      } catch (e) {
        console.error('Error saving avatar:', e);
      }
    } else if (selectedAvatarUrl && typeof selectedAvatarUrl === 'string') {
      const isPresetAvatar = selectedAvatarUrl.startsWith('/images/user/');
      const isUploadedAvatar = selectedAvatarUrl.startsWith('/uploads/');
      if (isPresetAvatar || isUploadedAvatar) {
        avatarUrl = selectedAvatarUrl;
      } else {
        avatarUrl = null;
      }
    }
    if (labLogoBase64) {
      try {
        labLogoUrl = await saveBase64File(labLogoBase64, `lablogo_${decoded.userId}`);
      } catch (e) {
        console.error('Error saving lab logo:', e);
      }
    }

    // Determine which columns exist so we only update existing columns.
    const possibleCols = ['first_name','last_name','address','rfc','phone','avatar_url','lab_logo_url','role','lab_id','updated_at'];
    const colRes = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = ANY($1)`, [possibleCols]);
    const existing = new Set(colRes.rows.map((r: any) => r.column_name));

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (firstName !== undefined && existing.has('first_name')) { fields.push(`first_name = $${idx++}`); values.push(firstName); }
    if (lastName !== undefined && existing.has('last_name')) { fields.push(`last_name = $${idx++}`); values.push(lastName); }
    if (address !== undefined && existing.has('address')) { fields.push(`address = $${idx++}`); values.push(address); }
    if (rfc !== undefined && existing.has('rfc')) { fields.push(`rfc = $${idx++}`); values.push(rfc); }
    if (phone !== undefined && existing.has('phone')) { fields.push(`phone = $${idx++}`); values.push(phone); }
    if (avatarUrl && existing.has('avatar_url')) { fields.push(`avatar_url = $${idx++}`); values.push(avatarUrl); }
    if (labLogoUrl && existing.has('lab_logo_url')) { fields.push(`lab_logo_url = $${idx++}`); values.push(labLogoUrl); }

    if (existing.has('updated_at')) {
      fields.push(`updated_at = NOW()`);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No updatable columns present in database' }, { status: 400 });
    }

    // Build RETURNING list based on existing columns
    const returningCols = ['id','email','first_name','last_name'].filter(c => existing.has(c) || ['id','email','first_name','last_name'].includes(c));
    if (existing.has('avatar_url')) returningCols.push('avatar_url');
    if (existing.has('lab_logo_url')) returningCols.push('lab_logo_url');
    if (existing.has('role')) returningCols.push('role');
    if (existing.has('lab_id')) returningCols.push('lab_id');
    if (existing.has('address')) returningCols.push('address');
    if (existing.has('rfc')) returningCols.push('rfc');
    if (existing.has('phone')) returningCols.push('phone');

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING ${returningCols.join(', ')}`;
    values.push(decoded.userId);

    const result = await query(sql, values);
    if (result.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error PUT /api/user:', error);
    return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
  }
}
