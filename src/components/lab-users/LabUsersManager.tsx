"use client";

import React, { useEffect, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useAuth } from "@/context/AuthContext";

type LabUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: number;
  lab_id: number;
  created_at?: string;
};

export default function LabUsersManager() {
  const { user } = useAuth();
  const [users, setUsers] = useState<LabUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const fetchLabUsers = async () => {
    setLoadingUsers(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/lab-users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo obtener la lista de usuarios");
      }

      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar usuarios del laboratorio");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (Number(user?.role) === 2) {
      fetchLabUsers();
    }
  }, [user?.role]);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError("Completa nombre, apellidos, email y contraseña.");
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/lab-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear el usuario");
      }

      setSuccess("Usuario rol 3 creado correctamente.");
      setForm({ firstName: "", lastName: "", email: "", password: "" });
      await fetchLabUsers();
    } catch (err: any) {
      setError(err.message || "Error al crear usuario");
    } finally {
      setCreating(false);
    }
  };

  if (Number(user?.role) !== 2) {
    return (
      <ComponentCard title="Usuarios de laboratorio" desc="Solo administradores de laboratorio (rol 2).">
        <p className="text-sm text-gray-600 dark:text-gray-400">No tienes permisos para gestionar usuarios de laboratorio.</p>
      </ComponentCard>
    );
  }

  return (
    <div className="space-y-6">
      <ComponentCard
        title="Alta de usuario de laboratorio"
        desc="Crea usuarios rol 3 ligados automáticamente a tu laboratorio."
      >
        <form onSubmit={onCreate} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="firstName">Nombre</Label>
              <Input id="firstName" name="firstName" value={form.firstName} onChange={onChange} placeholder="Nombre" disabled={creating} />
            </div>
            <div>
              <Label htmlFor="lastName">Apellidos</Label>
              <Input id="lastName" name="lastName" value={form.lastName} onChange={onChange} placeholder="Apellidos" disabled={creating} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={onChange} placeholder="usuario@laboratorio.com" disabled={creating} />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" value={form.password} onChange={onChange} placeholder="********" disabled={creating} />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Creando..." : "Crear usuario rol 3"}
          </button>
        </form>
      </ComponentCard>

      <ComponentCard title="Usuarios de tu laboratorio" desc="Listado de usuarios rol 3 creados en tu laboratorio.">
        {loadingUsers ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Aún no hay usuarios rol 3 en tu laboratorio.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Nombre</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Rol</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Laboratorio</th>
                </tr>
              </thead>
              <tbody>
                {users.map((labUser) => (
                  <tr key={labUser.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200">{labUser.first_name} {labUser.last_name}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{labUser.email}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{labUser.role}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{labUser.lab_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
