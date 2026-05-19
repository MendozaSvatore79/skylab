import crypto from 'crypto';
import jwt from 'jsonwebtoken';

type TokenPayload = {
  userId: number;
  email: string;
  role?: number;
  labId?: number | null;
};

// Hash de contraseña
export function hashPassword(password: string): string {
  return crypto
    .pbkdf2Sync(password, process.env.JWT_SECRET || 'secret', 1000, 64, 'sha512')
    .toString('hex');
}

// Verificar contraseña
export function verifyPassword(password: string, hash: string): boolean {
  const hashFromPassword = crypto
    .pbkdf2Sync(password, process.env.JWT_SECRET || 'secret', 1000, 64, 'sha512')
    .toString('hex');
  return hash === hashFromPassword;
}

// Generar JWT
export function generateToken(userId: number, email: string, role?: number, labId?: number | null): string {
  const payload: TokenPayload = { userId, email };
  if (role !== undefined) payload.role = role;
  if (labId !== undefined) payload.labId = labId;
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
}

// Verificar JWT
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch (error) {
    return null;
  }
}
