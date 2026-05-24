"use client";

import React, { useEffect, useMemo, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Checkbox from "@/components/form/input/Checkbox";
import { useAuth } from "@/context/AuthContext";
import { SIDEBAR_LEAF_ITEMS, type SidebarLeafItem } from "@/config/sidebarNavigation";

type GroupedItems = Record<string, Record<string, SidebarLeafItem[]>>;

export default function SidebarPermissionsManager() {
  const { user, sidebarPermissions, permissionsLoading, fetchSidebarPermissions } = useAuth();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const groupedItems = useMemo(() => {
    return SIDEBAR_LEAF_ITEMS.reduce<GroupedItems>((acc, item) => {
      if (!acc[item.section]) acc[item.section] = {};
      if (!acc[item.section][item.group]) acc[item.section][item.group] = [];
      acc[item.section][item.group].push(item);
      return acc;
    }, {} as GroupedItems);
  }, []);

  useEffect(() => {
    if (!permissionsLoading) {
      setSelectedPermissions(sidebarPermissions);
    }
  }, [sidebarPermissions, permissionsLoading]);

  if (Number(user?.role) !== 2) {
    return (
      <ComponentCard title="Asignación de funciones" desc="Solo administradores de laboratorio (rol 2).">
        <p className="text-sm text-gray-600 dark:text-gray-400">No tienes permisos para administrar funciones del sidebar.</p>
      </ComponentCard>
    );
  }

  const togglePermission = (key: string, checked: boolean) => {
    setSelectedPermissions((prev) => {
      if (checked) return Array.from(new Set([...prev, key]));
      return prev.filter((permissionKey) => permissionKey !== key);
    });
  };

  const setGroup = (keys: string[], checked: boolean) => {
    setSelectedPermissions((prev) => {
      const current = new Set(prev);
      keys.forEach((key) => {
        if (checked) current.add(key);
        else current.delete(key);
      });
      return Array.from(current);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/sidebar-permissions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabledKeys: selectedPermissions }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudieron guardar los permisos");
      }

      setSuccess("Permisos del sidebar guardados correctamente.");
      setSelectedPermissions(Array.isArray(data.enabledKeys) ? data.enabledKeys : []);
      await fetchSidebarPermissions();
    } catch (err: any) {
      setError(err.message || "Error al guardar permisos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ComponentCard
      title="Asignación de funciones del sidebar"
      desc="Activa o desactiva qué módulos puede ver el usuario rol 3 de tu laboratorio."
    >
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

      {permissionsLoading ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">Cargando permisos...</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedItems).map(([sectionKey, groups]) => (
            <div key={sectionKey} className="space-y-5">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {sectionKey === "main" ? "Menú principal" : "Otros módulos"}
              </h4>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {Object.entries(groups).map(([groupName, items]) => {
                  const groupKeys = items.map((item: any) => item.key);
                  const allChecked = groupKeys.every((key) => selectedPermissions.includes(key));
                  const someChecked = groupKeys.some((key) => selectedPermissions.includes(key));

                  return (
                    <div key={groupName} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h5 className="text-base font-semibold text-gray-800 dark:text-white/90">{groupName}</h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{items.length} función(es)</p>
                        </div>
                        <Checkbox
                          id={`${sectionKey}-${groupName}-toggle`}
                          checked={allChecked}
                          onChange={(checked) => setGroup(groupKeys, checked)}
                          label={someChecked && !allChecked ? "Parcial" : allChecked ? "Todo" : "Ninguno"}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {items.map((item: any) => (
                          <Checkbox
                            key={item.key}
                            id={item.key}
                            checked={selectedPermissions.includes(item.key)}
                            onChange={(checked) => togglePermission(item.key, checked)}
                            label={item.label}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSelectedPermissions(SIDEBAR_LEAF_ITEMS.map((item) => item.key))}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Habilitar todo
            </button>
            <button
              type="button"
              onClick={() => setSelectedPermissions([])}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Deshabilitar todo
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar permisos"}
            </button>
          </div>
        </div>
      )}
    </ComponentCard>
  );
}
