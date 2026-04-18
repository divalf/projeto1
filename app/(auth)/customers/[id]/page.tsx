import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CustomerForm from "@/components/customers/CustomerForm";
import { updateCustomer, deleteCustomer } from "@/app/(auth)/customers/actions";
import type { Customer } from "@/types";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;
  const isEditing = edit === "true";

  const supabase = await createClient();

  // Buscar cliente
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (!customer) notFound();

  // Buscar oportunidades vinculadas
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id, title, status, value, currency")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  const updateWithId = updateCustomer.bind(null, id);
  const deleteWithId = deleteCustomer.bind(null, id);

  const statusLabel: Record<string, string> = {
    open: "Aberta",
    won: "Ganha",
    lost: "Perdida",
    archived: "Arquivada",
  };

  const statusColor: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    won: "bg-green-100 text-green-700",
    lost: "bg-red-100 text-red-700",
    archived: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/customers"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ChevronLeft size={15} />
        Voltar para clientes
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {customer.name}
          </h1>
          {customer.company && (
            <p className="text-gray-500 mt-0.5">{customer.company}</p>
          )}
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            <Link
              href={`/customers/${id}?edit=true`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
            >
              <Pencil size={14} />
              Editar
            </Link>
            <form action={deleteWithId}>
              <button
                type="submit"
                onClick={(e) => {
                  if (!confirm("Excluir este cliente? Esta ação não pode ser desfeita.")) {
                    e.preventDefault();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 rounded-md hover:bg-red-50 text-red-600"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Formulário de edição */}
      {isEditing ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-medium text-gray-900 mb-4">
            Editar dados
          </h2>
          <CustomerForm
            customer={customer as Customer}
            action={updateWithId}
            submitLabel="Salvar alterações"
          />
        </div>
      ) : (
        /* Detalhes somente leitura */
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              { label: "E-mail", value: customer.email },
              { label: "Telefone", value: customer.phone },
              { label: "Empresa", value: customer.company },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="font-medium text-gray-500">{label}</dt>
                <dd className="text-gray-900 mt-0.5">{value || "—"}</dd>
              </div>
            ))}
            {customer.notes && (
              <div className="sm:col-span-2">
                <dt className="font-medium text-gray-500">Notas</dt>
                <dd className="text-gray-900 mt-0.5 whitespace-pre-wrap">
                  {customer.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Oportunidades vinculadas */}
      <div>
        <h2 className="text-base font-medium text-gray-900 mb-3">
          Oportunidades
        </h2>
        {opportunities && opportunities.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {opportunities.map((opp) => (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">
                  {opp.title}
                </span>
                <div className="flex items-center gap-3">
                  {opp.value != null && (
                    <span className="text-sm text-gray-500">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: opp.currency ?? "BRL",
                      }).format(opp.value)}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      statusColor[opp.status] ?? statusColor.archived
                    }`}
                  >
                    {statusLabel[opp.status] ?? opp.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 bg-white rounded-lg border border-gray-200 px-4 py-6 text-center">
            Nenhuma oportunidade vinculada a este cliente.
          </p>
        )}
      </div>
    </div>
  );
}
