import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Board from "@/components/kanban/Board";
import type { Opportunity, PipelineStage, Customer, Profile } from "@/types";

export default async function PipelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Carregar etapas ordenadas
  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("*")
    .order("position", { ascending: true });

  // Carregar oportunidades abertas com joins
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(`
      *,
      customer:customers(id, name, company),
      owner:profiles(id, full_name, email)
    `)
    .eq("status", "open")
    .order("created_at", { ascending: true });

  // Clientes e usuários para o modal
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, company")
    .order("name", { ascending: true });

  const { data: owners } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .order("full_name", { ascending: true });

  const totalOpen = opportunities?.length ?? 0;
  const totalValue = opportunities?.reduce((sum, o) => sum + (o.value ?? 0), 0) ?? 0;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pipeline</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {totalOpen} oportunidade{totalOpen !== 1 ? "s" : ""} abertas
            {totalValue > 0
              ? ` · ${new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  notation: "compact",
                }).format(totalValue)} no funil`
              : ""}
          </p>
        </div>
        <Link
          href="/pipeline/archive"
          className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
        >
          Ver arquivo →
        </Link>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-auto p-6">
        <Board
          stages={(stages ?? []) as PipelineStage[]}
          initialOpportunities={(opportunities ?? []) as unknown as Opportunity[]}
          customers={(customers ?? []) as Customer[]}
          owners={(owners ?? []) as Profile[]}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
