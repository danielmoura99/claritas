"use client";

import { useParams } from "next/navigation";
import { AdminUserDetail } from "./AdminUserDetail";

/** O id vem da URL só para buscar; a API valida o acesso de admin e a existência do usuário. */
export function AdminUserRoute() {
  const { id } = useParams<{ id: string }>();
  return <AdminUserDetail id={id} />;
}
