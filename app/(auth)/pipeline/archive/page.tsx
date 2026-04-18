import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, ThumbsDown, Archive, RotateCcw } from "lucide-react";
import { reopenOpportunity } from "@/app/(auth)/pipeline/actions";

const STATUS_CONFIG = {
  won: { label: "Ganho", icon: Trophy, color: "text-green-700 bg-green-100" },
  lost: { label: "Perdido", icon: ThumbsDown, color: "text-red-700 bg-red-100" },
  archived: { label: "Arquivado", icon: Archive, color: "text-gray-600 bg-gray-100" },
} as const;

export default async function PipelineArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filterStatus } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Buscar primeira etapa para reabrir oportunidades
  // maybeSingle() retorna null se não houver etapas (em vez de lançar exceção)
  const { data: firstStage, error: stageError } = await supabase
    .from("pipeline_stages")
    .select("id")
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (stageError) {
    console.error("Erro ao buscar etapa inicial:", stageError);
  }

  let query = supabase
    .from("opportunities")
    .select(`
      id, title, value, currency, status, closed_at, archived_at, created_at,
      customer:customers(name),
      owner:profiles(full_name, email)
    `)
    .in("status", ["won", "lost", "archived"])
    .order("created_at", { ascending: false });

  if (filterStatus && ["won", "lost", "archived"].includes(filterStatus)) {
    query = query.eq("status", filterStatus);
  }

  const { data: opportunities } = await query;

  const tabs = [
    { key: "", label: "Todos" },
    { key: "won", label: "Ganhos" },
    { key: "lost", label: "Perdidos" },
    { key: "archived", label: "Arquivados" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pipeline" className="text-sm text-gray-500 hover:text-gray-900">
          ← Pipeline
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">Arquivo</h1>
      </div>

      {/* Filtros de status */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key ? `/pipeline/archive?status=${tab.key}` : "/pipeline/archive"}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              filterStatus === tab.key || (!filterStatus && !tab.key)
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Lista */}
      {opportunities && opportunities.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {opportunities.map((opp) => {
            const config = STATUS_CONFIG[opp.status as keyof typeof STATUS_CONFIG];
            const Icon = config?.icon ?? Archive;
            const reopenWithStage = firstStage
              ? reopenOpportunity.bind(null, opp.id, firstStage.id)
              : null;

            return (
              <div key={opp.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Badge de status */}
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${config?.color}`}>
                    <Icon size={11} />
                    {config?.label}
                  </span>

                  {/* Informações */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {opp.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(opp.customer as { name?: string } | null)?.name ?? "—"}
                      {" · "}
                      {(opp.owner as { full_name?: string; email?: string } | null)?.full_name ??
                        (opp.owner as { full_name?: string; email?: string } | null)?.email ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {opp.value != null && (
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: opp.currency ?? "BRL",
                      }).format(opp.value)}
                    </span>
                  )}

                  {/* Reabrir */}
                  {reopenWithStage && (
                    <form action={reopenWithStage}>
                      <button
                        type="submit"
                        title="Reabrir no pipeline"
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 py-16 text-center">
          <p className="text-gray-500">Nenhuma oportunidade arquivada.</p>
        </div>
      )}
    </div>
  );
}
