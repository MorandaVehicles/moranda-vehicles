// app/dashboard/layout.tsx

import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "./sidebar";
import { TransicionPagina } from "./transicionpagina";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let perfil = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("nombre, avatar_url")
      .eq("id", user.id)
      .single();
    perfil = data;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar nombre={perfil?.nombre ?? null} avatarUrl={perfil?.avatar_url ?? null} />
      <div className="md:pl-64">
        <TransicionPagina>{children}</TransicionPagina>
      </div>
    </div>
  );
}