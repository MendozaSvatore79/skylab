# 🏗️ Arquitectura del Sistema de Autenticación

## Diagrama general

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐        ┌──────────────────┐               │
│  │  /signin         │        │  /signup         │               │
│  │  SignInForm      │        │  SignUpForm      │               │
│  └────────┬─────────┘        └────────┬─────────┘               │
│           │                           │                         │
│           │   POST /api/auth/signin   │   POST /api/auth/signup │
│           └─────────┬─────────────────┴────────────┬────────────┘
│                     │                              │            │
│                     │                              │            │
│           ┌─────────▼──────────────────────────────▼──────┐     │
│           │         REACT CONTEXT (AuthContext)          │     │
│           │  - isAuthenticated                           │     │
│           │  - user                                      │     │
│           │  - token (localStorage)                      │     │
│           └──────────────────────────────────────────────┘     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests
                              │
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Next.js API Routes)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────┐  ┌──────────────────────┐  │
│  │  POST /api/auth/signin          │  │ POST /api/auth/signup│  │
│  │  ├─ Valida email/password       │  │ ├─ Valida datos      │  │
│  │  ├─ Busca usuario en BD         │  │ ├─ Verifica email    │  │
│  │  ├─ Verifica contraseña         │  │ ├─ Hashea password   │  │
│  │  ├─ Genera JWT                  │  │ ├─ Crea usuario      │  │
│  │  └─ Retorna {user, token}       │  │ └─ Genera JWT        │  │
│  └─────────────────────────────────┘  └──────────────────────┘  │
│           │                                      │               │
│           └──────────────────┬───────────────────┘               │
│                              │                                  │
│                    ┌─────────▼──────────┐                       │
│                    │   lib/auth.ts      │                       │
│                    │ - hashPassword()   │                       │
│                    │ - verifyPassword() │                       │
│                    │ - generateToken()  │                       │
│                    │ - verifyToken()    │                       │
│                    └──────────┬─────────┘                       │
│                               │                                 │
│                    ┌──────────▼──────────┐                      │
│                    │   lib/db.ts        │                      │
│                    │ Pool PostgreSQL    │                      │
│                    │ query()            │                      │
│                    └──────────┬─────────┘                       │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                │ TCP Connection
                                │ (SSL/TLS)
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    POSTGRESQL DATABASE (Neon)                    │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────┐   ┌────────────────────────┐   │
│  │     TABLE: users             │   │  TABLE: refresh_tokens │   │
│  ├──────────────────────────────┤   ├────────────────────────┤   │
│  │ id (PK)                      │   │ id (PK)                │   │
│  │ email (UNIQUE)               │   │ user_id (FK)           │   │
│  │ password (PBKDF2-HASHED)     │   │ token (UNIQUE)         │   │
│  │ first_name                   │   │ created_at             │   │
│  │ last_name                    │   │ expires_at             │   │
│  │ created_at                   │   └────────────────────────┘   │
│  │ updated_at                   │                                │
│  └──────────────────────────────┘                                │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Flujo de registro (Sign Up)

```
Usuario accede a /signup
    │
    ▼
┌─────────────────────┐
│ Completa formulario │
│ - firstName         │
│ - lastName          │
│ - email             │
│ - password          │
│ - confirmPassword   │
└────────────┬────────┘
             │
             │ Click "Sign Up"
             │
             ▼
    ┌────────────────┐
    │ Validaciones   │
    │ - No vacíos    │
    │ - Passwords OK │
    │ - Términos OK  │
    └────────┬───────┘
             │
             │ POST /api/auth/signup
             │ {email, password, firstName, lastName}
             │
             ▼
    ┌─────────────────────────┐
    │ Backend (Servidor)      │
    │ 1. Valida datos         │
    │ 2. Verifica email único │
    │ 3. Hashea password      │
    │ 4. Crea usuario en BD   │
    │ 5. Genera JWT           │
    └────────────┬────────────┘
                 │
                 ├─► DB INSERT usuarios ────┐
                 │                           │
                 ▼                           ▼
    ┌──────────────────────┐    ┌─────────────────┐
    │ Retorna respuesta:   │    │ Usuario guardado│
    │ {user, token}        │    │ en PostgreSQL   │
    └────────────┬─────────┘    └─────────────────┘
                 │
                 │ HTTP 201 Created
                 │
                 ▼
    ┌──────────────────────────┐
    │ Frontend recibe respuesta│
    │ - Guarda user en LS      │
    │ - Guarda token en LS     │
    │ - Actualiza AuthContext  │
    │ - Redirect a /           │
    └──────────────┬───────────┘
                   │
                   ▼
         ┌─────────────────┐
         │ Dashboard Home  │
         │ (Autenticado)   │
         └─────────────────┘
```

---

## Flujo de login (Sign In)

```
Usuario accede a /signin
    │
    ▼
┌──────────────────┐
│ Ingresa datos    │
│ - email          │
│ - password       │
└────────┬─────────┘
         │
         │ Click "Sign In"
         │
         ▼
┌────────────────────────┐
│ Validaciones cliente   │
│ - Email no vacío       │
│ - Password no vacío    │
└────────┬───────────────┘
         │
         │ POST /api/auth/signin
         │ {email, password}
         │
         ▼
┌─────────────────────────────┐
│ Backend (API Route)         │
│ 1. Busca usuario por email  │
│ 2. Verifica contraseña      │
│ 3. Genera JWT               │
└────────────┬────────────────┘
             │
             ├─► DB SELECT usuarios ──┐
             │   WHERE email = $1     │
             │                        │
             ▼                        ▼
   ┌─────────────────┐    ┌──────────────────┐
   │ Password match? │    │ Usuario encontrado
   │ PBKDF2 verify   │    │ en PostgreSQL     │
   │ ✅ SÍ / ❌ NO   │    └──────────────────┘
   └────────┬────────┘
            │
      ✅ SÍ │ ❌ NO
            │  │
            │  ▼
            │ HTTP 401
            │ "Email o contraseña incorrectos"
            │
            ▼
   ┌──────────────────────┐
   │ Genera JWT token     │
   │ {userId, email}      │
   │ expires: +7 días     │
   └────────┬─────────────┘
            │
            ▼
   ┌──────────────────────┐
   │ Retorna respuesta:   │
   │ {user, token}        │
   │ HTTP 200 OK          │
   └────────┬─────────────┘
            │
            │
            ▼
   ┌──────────────────────────┐
   │ Frontend recibe respuesta│
   │ - Guarda user en LS      │
   │ - Guarda token en LS     │
   │ - Actualiza AuthContext  │
   │ - isAuthenticated = true │
   │ - Redirect a /           │
   └──────────────┬───────────┘
                  │
                  ▼
        ┌─────────────────┐
        │ Dashboard Home  │
        │ (Autenticado)   │
        └─────────────────┘
```

---

## Flujo de verificación de token

```
Usuario abre aplicación
    │
    ▼
┌──────────────────────────────┐
│ AuthContext useEffect        │
│ - Lee localStorage           │
│ - Busca token guardado       │
└────────┬─────────────────────┘
         │
         ▼
┌─────────────────┐
│ Token existe?   │
└────────┬────┬───┘
         │    │
      ✅ │    │ ❌
         │    │
         ▼    ▼
    ┌─────┐ ┌─────────────────┐
    │Token│ │ isAuthenticated │
    │verify│ │ = false         │
    └──┬──┘ │ user = null     │
       │    └─────────────────┘
       │
   ✅ Válido │ ❌ Inválido
       │       │
       ▼       ▼
    ┌──────┐ ┌──────────────┐
    │ USER │ │ DESAUTENTICAR
    │ACTIVO│ │ - Limpiar LS │
    └──────┘ └──────────────┘
       │
       ▼
    Acceso a dashboard permitido
```

---

## Seguridad en capas

```
┌───────────────────────────────────────────────────────┐
│ CAPA 1: CLIENTE (Navegador)                           │
│ - Validación de formularios                          │
│ - Errores claros al usuario                          │
│ - localStorage para guardar token                    │
└───────────────────────────────────────────────────────┘
                        ▼
┌───────────────────────────────────────────────────────┐
│ CAPA 2: TRANSPORTE (HTTP)                             │
│ - HTTPS (SSL/TLS) - Neon requiere                    │
│ - Token en header Authorization                      │
│ - No exponer datos sensibles en URL                  │
└───────────────────────────────────────────────────────┘
                        ▼
┌───────────────────────────────────────────────────────┐
│ CAPA 3: SERVIDOR (Next.js API)                        │
│ - Validación de datos                                │
│ - Verificación de token JWT                          │
│ - Rate limiting (opcional)                           │
│ - Logging de accesos                                 │
└───────────────────────────────────────────────────────┘
                        ▼
┌───────────────────────────────────────────────────────┐
│ CAPA 4: APLICACIÓN (Auth Functions)                   │
│ - Hash PBKDF2 (1000 iteraciones)                     │
│ - Comparación segura de contraseñas                  │
│ - Generación segura de JWT                          │
│ - Manejo de errores sin revelar info                │
└───────────────────────────────────────────────────────┘
                        ▼
┌───────────────────────────────────────────────────────┐
│ CAPA 5: BASE DE DATOS (PostgreSQL)                    │
│ - Contraseñas hasheadas (nunca en texto plano)       │
│ - Índices para búsquedas rápidas                     │
│ - Foreign keys para integridad referencial           │
│ - SSL/TLS con Neon                                   │
└───────────────────────────────────────────────────────┘
```

---

## Tabla de usuarios - Esquema

```
┌─────────────────────────────────────────────┐
│ users (Tabla principal)                      │
├────────────┬──────────┬──────────┬──────────┤
│ Column     │ Type     │ Null     │ Key      │
├────────────┼──────────┼──────────┼──────────┤
│ id         │ SERIAL   │ NO       │ PRIMARY  │
│ email      │ VARCHAR  │ NO       │ UNIQUE   │
│ password   │ VARCHAR  │ NO       │ -        │
│ first_name │ VARCHAR  │ YES      │ -        │
│ last_name  │ VARCHAR  │ YES      │ -        │
│ created_at │ TIMESTAMP│ NO (def) │ -        │
│ updated_at │ TIMESTAMP│ NO (def) │ -        │
└────────────┴──────────┴──────────┴──────────┘

┌─────────────────────────────────────────────┐
│ refresh_tokens (Para sesiones largas)        │
├────────────┬──────────┬──────────┬──────────┤
│ Column     │ Type     │ Null     │ Key      │
├────────────┼──────────┼──────────┼──────────┤
│ id         │ SERIAL   │ NO       │ PRIMARY  │
│ user_id    │ INTEGER  │ NO       │ FOREIGN  │
│ token      │ VARCHAR  │ NO       │ UNIQUE   │
│ created_at │ TIMESTAMP│ NO (def) │ -        │
│ expires_at │ TIMESTAMP│ NO       │ -        │
└────────────┴──────────┴──────────┴──────────┘
```

---

## Archivo vs. Responsabilidad

```
auth/SignInForm.tsx
├─ Renderiza formulario
├─ Valida datos
└─ Llama a login() del AuthContext

auth/SignUpForm.tsx
├─ Renderiza formulario
├─ Valida datos
└─ Llama a /api/auth/signup

AuthContext.tsx
├─ Maneja estado global (user, token)
├─ Proporciona login() y logout()
├─ Persiste en localStorage
└─ Notifica cambios a componentes

api/auth/signin/route.ts
├─ Recibe {email, password}
├─ Busca usuario en BD
├─ Verifica contraseña
├─ Genera JWT
└─ Retorna {user, token}

api/auth/signup/route.ts
├─ Recibe datos de registro
├─ Valida datos
├─ Hashea contraseña
├─ Crea usuario en BD
├─ Genera JWT
└─ Retorna {user, token}

lib/auth.ts
├─ hashPassword()      → PBKDF2
├─ verifyPassword()    → comparación segura
├─ generateToken()     → JWT sign
└─ verifyToken()       → JWT verify

lib/db.ts
├─ Pool de conexiones PostgreSQL
├─ Función query() para SQL
└─ Manejo de errores de conexión
```

---

## Donde van almacenados los datos

```
CLIENTE (Navegador)
└─ localStorage
   ├─ user = {id, email, firstName, lastName}
   └─ authToken = "eyJhbGc..."

SERVIDOR (Next.js)
└─ En memoria (durante la petición)
   ├─ decoded JWT
   └─ datos de la petición

BASE DE DATOS (PostgreSQL - Neon)
└─ Tabla: users
   ├─ id, email, password (hashed)
   ├─ first_name, last_name
   └─ timestamps
└─ Tabla: refresh_tokens (opcional)
   ├─ user_id (FK)
   ├─ token
   └─ expires_at
```

---

¡Arquitectura lista! 🏗️
