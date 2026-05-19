# 🔧 Guía de Configuración: Conexión a Neon con Next.js

## Paso 1: Configurar variables de entorno

Ya tienes el archivo `.env.local` creado. Ahora necesitas:

1. **Obtener tu connection string de Neon:**
   - Ve a https://console.neon.tech
   - Selecciona tu proyecto
   - En la sección "Connection string", copia la URL que dice "Connection string"
   - Debe verse algo como: `postgresql://user:password@ep-xxxx.neon.tech/dbname?sslmode=require`

2. **Edita `.env.local` y reemplaza:**
```
DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/dbname?sslmode=require
JWT_SECRET=tu_clave_secreta_aleatorios_aqui_12345
```

> **Importante:** El `JWT_SECRET` debe ser una cadena aleatoria y segura. Ejemplo: `abc123xyz!@#$%^&*`

## Paso 2: Crear la tabla en Neon

### Opción A: Usando SQL Editor de Neon (Recomendado)

1. Abre la consola Neon en https://console.neon.tech
2. Selecciona tu proyecto y base de datos
3. Abre la pestaña "SQL Editor"
4. Copia el contenido del archivo `database.sql` de este proyecto
5. Pega el SQL en el editor
6. Haz clic en "Execute"

### Opción B: Usando comando psql

Si tienes psql instalado en tu máquina:

```bash
psql "tu_connection_string" < database.sql
```

Reemplaza `tu_connection_string` con tu string de Neon.

## Paso 3: Verificar la tabla

En el SQL Editor de Neon, ejecuta:

```sql
SELECT * FROM users;
SELECT * FROM pg_tables WHERE tablename = 'users';
```

Deberías ver que la tabla `users` existe.

## Paso 4: Iniciar la aplicación

```bash
npm run dev
```

La app estará en `http://localhost:3000`

## Paso 5: Probar el registro y login

1. Ve a `http://localhost:3000/signup`
2. Completa el formulario con:
   - First Name: Juan
   - Last Name: Pérez
   - Email: test@example.com
   - Password: 123456
   - Confirm Password: 123456
   - Acepta términos

3. Haz clic en "Sign Up"
4. Si todo funciona, serás redirigido al dashboard

## Solución de problemas

### Error: "ECONNREFUSED"
- Verifica que tu `DATABASE_URL` esté correctamente en `.env.local`
- Asegúrate de copiar la URL completa incluyendo `?sslmode=require`

### Error: "relation 'users' does not exist"
- La tabla no fue creada. Ejecuta el SQL nuevamente en el editor de Neon

### Error: "password authentication failed"
- Verifica el usuario y contraseña en tu connection string
- En Neon, usa la contraseña que estableciste al crear la base de datos

### Error: "UNIQUE constraint violation"
- El email ya existe. Prueba con otro email

## Estructura de la BD

```
users
├── id (PRIMARY KEY, SERIAL)
├── email (VARCHAR, UNIQUE)
├── password (VARCHAR - hasheada)
├── first_name (VARCHAR)
├── last_name (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

refresh_tokens (opcional para sessiones más seguras)
├── id (PRIMARY KEY)
├── user_id (FOREIGN KEY -> users.id)
├── token (VARCHAR, UNIQUE)
├── created_at (TIMESTAMP)
└── expires_at (TIMESTAMP)
```

## Endpoints API disponibles

- **POST /api/auth/signin** - Login
  - Body: `{ email: string, password: string }`
  - Response: `{ user, token }`

- **POST /api/auth/signup** - Registro
  - Body: `{ email, password, confirmPassword, firstName, lastName }`
  - Response: `{ user, token }`

## Variables de entorno requeridas

```
DATABASE_URL=tu_string_neon
JWT_SECRET=tu_clave_secreta
```

## Seguridad

- Las contraseñas se hashean con PBKDF2 (1000 iteraciones)
- Los tokens JWT expiran en 7 días
- Las contraseñas se almacenan hasheadas en la BD (nunca en texto plano)
