import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PipelineStats from "@/components/dashboard/PipelineStats";
import VendedorRanking from "@/components/dashboard/VendedorRanking";
import type { PipelineStage } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = (user.app_metadata?.role as string) ?? "vendedor";
  const isManager = role === "admin" || role === "gestor";
  const name = user.user_metadata?.full_name ?? user.email ?? "Usuário";

  // Etapas do funil
  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("*")
    .order("position", { ascending: true });

  // Oportunidades abertas — vendedor vê só as suas (RLS garante isso)
  const { data: openOpportunities } = await supabase
    .from("opportunities")
    .select("id, value, stage_id, owner_id, owner:profiles(id, full_name, email)")
    .eq("status", "open");

  const opps = openOpportunities ?? [];
  const totalOpen = opps.length;
  const totalValue = opps.reduce((sum, o) => sum + (o.value ?? 0), 0);

  // Estatísticas por etapa
  const stageStats = (stages ?? []).map((stage) => {
    const inStage = opps.filter((o) => o.stage_id === stage.id);
    return {
      stage_id: stage.id,
      count: inStage.length,
      total_value: inStage.reduce((sum, o) => sum + (o.value ?? 0), 0),
    };
  });

  // Ranking por vendedor (somente para gestor/admin)
  const ownerStats = isManager
    ? Object.values(
        opps.reduce(
          (acc, opp) => {
            type OwnerShape = { id: string; full_name: string | null; email: string };
            const raw = opp.owner;
            const owner: OwnerShape | null =
              raw && typeof raw === "object" && !Array.isArray(raw) && "id" in raw && "email" in raw
                ? (raw as unknown as OwnerShape)
                : null;
            if (!owner) return acc;
            if (!acc[owner.id]) {
              acc[owner.id] = {
                owner_id: owner.id,
                full_name: owner.full_name,
                email: owner.email,
                count: 0,
                total_value: 0,
              };
            }
            acc[owner.id].count += 1;
            acc[owner.id].total_value += opp.value ?? 0;
            return acc;
          },
          {} as Record<
            string,
            {
              owner_id: string;
              full_name: string | null;
              email: string;
              count: number;
              total_value: number;
            }
          >
        )
      ).sort((a, b) => b.total_value - a.total_value)
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Saudação */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Olá, {name.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {role === "admin"
            ? "Visão geral da equipe — oportunidades abertas no funil."
            : role === "gestor"
            ? "Visão de vendedores — oportunidades abertas no funil."
            : "Seu pipeline de oportunidades abertas."}
        </p>
      </div>

      {/* KPIs do pipeline */}
      <PipelineStats
        stages={(stages ?? []) as PipelineStage[]}
        stageStats={stageStats}
        totalOpen={totalOpen}
        totalValue={totalValue}
      />

      {/* Ranking (apenas gestor/admin) */}
      {isManager && ownerStats.length > 0 && (
        <div className="mt-8">
          <VendedorRanking stats={ownerStats} />
        </div>
      )}

      {/* Link rápido para o pipeline */}
      {totalOpen === 0 && (
        <div className="mt-8 bg-white rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-gray-500 mb-4">
            Nenhuma oportunidade aberta ainda.
          </p>
          <Link
            href="/pipeline"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Ir para o Pipeline
          </Link>
        </div>
      )}
    </div>
  );
}
