import type { Metadata } from "next";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SidebarPermissionsManager from "@/components/sidebar-permissions/SidebarPermissionsManager";

export const metadata: Metadata = {
  title: "Asignación del sidebar | Dashboard",
  description: "Activa o desactiva funciones del sidebar por laboratorio",
};

export default function SidebarPermissionsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Asignación de funciones" />
      <SidebarPermissionsManager />
    </div>
  );
}
