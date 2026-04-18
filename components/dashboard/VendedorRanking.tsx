interface OwnerStat {
  owner_id: string;
  full_name: string | null;
  email: string;
  count: number;
  total_value: number;
}

interface VendedorRankingProps {
  stats: OwnerStat[];
}

export default function VendedorRanking({ stats }: VendedorRankingProps) {
  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(v);

  const maxValue = Math.max(...stats.map((s) => s.total_value), 1);

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
        Ranking por vendedor
      </h2>
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {stats.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">
            Nenhuma oportunidade aberta no momento.
          </p>
        )}
        {stats.map((s, i) => {
          const name = s.full_name ?? s.email;
          const initials = name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          const pct = Math.round((s.total_value / maxValue) * 100);

          return (
            <div key={s.owner_id} className="px-4 py-3 flex items-center gap-3">
              <span className="text-sm font-bold text-gray-400 w-5 shrink-0">
                {i + 1}
              </span>
              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">
                  {s.total_value > 0 ? fmt(s.total_value) : "—"}
                </p>
                <p className="text-xs text-gray-500">{s.count} oport.</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
