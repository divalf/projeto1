import type { PipelineStage } from "@/types";

interface StageStats {
  stage_id: string;
  count: number;
  total_value: number;
}

interface PipelineStatsProps {
  stages: PipelineStage[];
  stageStats: StageStats[];
  totalOpen: number;
  totalValue: number;
}

export default function PipelineStats({
  stages,
  stageStats,
  totalOpen,
  totalValue,
}: PipelineStatsProps) {
  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(v);

  return (
    <div className="space-y-6">
      {/* Totais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Oportunidades abertas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalOpen}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Valor total do pipeline</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {totalValue > 0 ? fmt(totalValue) : "—"}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5 col-span-2 sm:col-span-1">
          <p className="text-sm text-gray-500">Etapas ativas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stages.length}
          </p>
        </div>
      </div>

      {/* Por etapa */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Distribuição por etapa
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {stages.map((stage) => {
            const stat = stageStats.find((s) => s.stage_id === stage.id);
            const count = stat?.count ?? 0;
            const value = stat?.total_value ?? 0;
            const pct = totalOpen > 0 ? Math.round((count / totalOpen) * 100) : 0;

            return (
              <div key={stage.id} className="px-4 py-3 flex items-center gap-4">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: stage.color ?? "#9ca3af" }}
                />
                <span className="text-sm font-medium text-gray-800 w-28 shrink-0">
                  {stage.name}
                </span>
                {/* Barra de progresso */}
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: stage.color ?? "#6366f1",
                    }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8 text-right shrink-0">
                  {count}
                </span>
                <span className="text-sm font-medium text-gray-700 w-20 text-right shrink-0 hidden sm:block">
                  {value > 0 ? fmt(value) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
