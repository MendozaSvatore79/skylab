# 🔑 Ejemplos de uso - Login & Signup

## 1️⃣ Usar AuthContext en componentes

```tsx
"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function MyComponent() {
  const { isAuthenticated, user, login, logout, isLoading, error } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/signin");
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <div>No estás autenticado</div>;
  }

  return (
    <div>
      <h1>Bienvenido, {user?.firstName}!</h1>
      <p>Email: {user?.email}</p>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

## 2️⃣ Proteger rutas (Server Components)

```tsx
// src/app/(admin)/layout.tsx
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = typeof window === 'undefined' 
    ? null 
    : localStorage.getItem("authToken");

  if (!token) {
    redirect("/signin");
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    redirect("/signin");
  }

  return <>{children}</>;
}
```

## 3️⃣ Hacer peticiones autenticadas a APIs privadas

```tsx
const response = await fetch("/api/protected", {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${localStorage.getItem("authToken")}`
  }
});
```

## 4️⃣ Crear una API protegida

```tsx
// src/app/api/protected/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json(
        { error: "Token no encontrado" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    // Token válido, puedes proceder
    return NextResponse.json({ 
      message: "Acceso permitido",
      user: decoded 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al verificar token" },
      { status: 500 }
    );
  }
}
```

## 5️⃣ Obtener usuario actual desde BD

```tsx
// src/app/api/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    
    const decoded = verifyToken(token) as any;
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener usuario de la BD
    const result = await query(
      "SELECT id, email, first_name, last_name FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching user" },
      { status: 500 }
    );
  }
}
```

## 6️⃣ Actualizar perfil de usuario

```tsx
// src/app/api/user/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token) as any;

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { firstName, lastName } = await request.json();

    const result = await query(
      "UPDATE users SET first_name = $1, last_name = $2, updated_at = NOW() WHERE id = $3 RETURNING id, email, first_name, last_name",
      [firstName, lastName, decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating user" },
      { status: 500 }
    );
  }
}
```

## 7️⃣ Verificar token en Cliente

```tsx
"use client";
import { useEffect, useState } from "react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("/api/user", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await response.json();
        setUser(data.user);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (!user) return <div>No hay usuario</div>;

  return (
    <div>
      <h1>{user.first_name} {user.last_name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

## 8️⃣ Cerrar sesión completa

```tsx
const handleLogout = () => {
  // Limpiar localStorage
  localStorage.removeItem("user");
  localStorage.removeItem("authToken");
  
  // Redirigir a login
  window.location.href = "/signin";
};
```

## 🔐 Mejores prácticas

1. **Nunca guardes tokens sensibles en localStorage** (usa httpOnly cookies para producción)
2. **Siempre verifica tokens en el servidor**, no confíes en el cliente
3. **Usa HTTPS** en producción (Neon requiere SSL)
4. **Implementa refresh tokens** para mayor seguridad
5. **Hashea siempre las contraseñas** (ya está implementado)
6. **Valida en cliente y servidor**
7. **Manejo de errores apropiado** en ambos lados

---

¡Listo para usar en tu aplicación! 🚀
