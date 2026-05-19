import pool from '@/lib/db';

/**
 * Script para probar la conexión a Neon
 * Ejecutar con: npm run test-db
 */
async function testConnection() {
  try {
    console.log('🔌 Intentando conectar a la base de datos...');
    
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa!');
    console.log('📅 Hora del servidor:', result.rows[0].now);
    
    // Verificar tabla users
    const tableResult = await pool.query(
      "SELECT to_regclass('public.users')"
    );
    
    if (tableResult.rows[0].to_regclass) {
      console.log('✅ Tabla "users" existe!');
      
      // Contar usuarios
      const countResult = await pool.query('SELECT COUNT(*) as count FROM users');
      console.log(`📊 Total de usuarios: ${countResult.rows[0].count}`);
    } else {
      console.log('❌ Tabla "users" NO existe. Ejecuta el SQL de setup primero.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    process.exit(1);
  }
}

testConnection();
