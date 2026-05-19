import type { Metadata } from "next";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import LabUsersManager from "@/components/lab-users/LabUsersManager";

export const metadata: Metadata = {
  title: "Usuarios de laboratorio | Dashboard",
  description: "Gestión de usuarios rol 3 por administrador de laboratorio (rol 2)",
};

export default function LabUsersPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Usuarios de laboratorio" />
      <LabUsersManager />
    </div>
  );
}
