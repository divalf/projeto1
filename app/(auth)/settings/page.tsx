import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UserList from "@/components/settings/UserList";
import StageManager from "@/components/settings/StageManager";
import MyProfile from "@/components/settings/MyProfile";
import type { Profile, PipelineStage } from "@/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let role = user.app_metadata?.role as string | undefined;
  if (!role) {
    const { data: p } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = p?.role ?? "vendedor";
  }
  if (role !== "admin") redirect("/dashboard");

  const [{ data: profiles }, { data: stages }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_url, created_at, updated_at")
      .order("full_name", { ascending: true }),
    supabase
      .from("pipeline_stages")
      .select("*")
      .order("position", { ascending: true }),
  ]);

  const myProfile = (profiles ?? []).find((p) => p.id === user.id) as Profile | undefined;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <h1 className="text-2xl font-semibold text-gray-900">Configurações</h1>

      {/* Meu Perfil */}
      {myProfile && (
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">Meu perfil</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Atualize seu nome de exibição. O e-mail é gerenciado pelo Google.
            </p>
          </div>
          <MyProfile profile={myProfile} />
        </section>
      )}

      {/* Usuários */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Usuários</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Gerencie perfis e permissões da equipe. Novos usuários são adicionados
            via convite no painel do Supabase.
          </p>
        </div>
        <UserList
          users={(profiles ?? []) as Profile[]}
          currentUserId={user.id}
        />
      </section>

      {/* Etapas do funil */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Etapas do funil</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Customize as etapas do pipeline de vendas. Etapas com oportunidades
            ativas não podem ser excluídas.
          </p>
        </div>
        <StageManager stages={(stages ?? []) as PipelineStage[]} />
      </section>
    </div>
  );
}
