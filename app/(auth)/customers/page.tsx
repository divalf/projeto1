import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SearchInput from "@/components/customers/SearchInput";
import { escapeIlike } from "@/lib/utils/strings";
import { UserPlus, Building2, Mail, Phone } from "lucide-react";

const PAGE_SIZE = 50;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const supabase = await createClient();

  // Primeiro busca total para limitar página máxima
  let countQuery = supabase
    .from("customers")
    .select("id", { count: "exact", head: true });

  if (q) {
    const safe = escapeIlike(q);
    countQuery = countQuery.or(
      `name.ilike.%${safe}%,company.ilike.%${safe}%,email.ilike.%${safe}%`
    );
  }

  const { count: totalCount } = await countQuery;
  const totalPages = Math.max(1, Math.ceil((totalCount ?? 0) / PAGE_SIZE));
  const page = Math.max(1, Math.min(totalPages, parseInt(pageParam ?? "1", 10)));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("customers")
    .select("id, name, company, email, phone, created_at", { count: "exact" })
    .order("name", { ascending: true })
    .range(from, to);

  if (q) {
    const safe = escapeIlike(q);
    query = query.or(
      `name.ilike.%${safe}%,company.ilike.%${safe}%,email.ilike.%${safe}%`
    );
  }

  const { data: customers } = await query;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount ?? 0} cliente{totalCount !== 1 ? "s" : ""} cadastrado
            {totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput defaultValue={q} />
          <Link
            href="/customers/new"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            <UserPlus size={15} />
            Novo cliente
          </Link>
        </div>
      </div>

      {/* Tabela */}
      {customers && customers.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Empresa</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">E-mail</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Telefone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/customers/${c.id}`}
                      className="font-medium text-gray-900 hover:text-indigo-600"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {c.company ? (
                      <span className="flex items-center gap-1">
                        <Building2 size={13} className="shrink-0" />
                        {c.company}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {c.email ? (
                      <a
                        href={`mailto:${c.email}`}
                        className="flex items-center gap-1 hover:text-indigo-600"
                      >
                        <Mail size={13} className="shrink-0" />
                        {c.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                    {c.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone size={13} className="shrink-0" />
                        {c.phone}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 py-16 text-center">
          <p className="text-gray-500">
            {q ? `Nenhum cliente encontrado para "${q}".` : "Nenhum cliente cadastrado ainda."}
          </p>
          {!q && (
            <Link
              href="/customers/new"
              className="inline-block mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Cadastrar primeiro cliente
            </Link>
          )}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/customers?page=${p}${q ? `&q=${q}` : ""}`}
              className={`px-3 py-1 rounded text-sm border ${
                p === page
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
