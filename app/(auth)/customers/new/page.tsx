import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import CustomerForm from "@/components/customers/CustomerForm";
import { createCustomer } from "@/app/(auth)/customers/actions";

export default function NewCustomerPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/customers"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ChevronLeft size={15} />
        Voltar para clientes
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Novo cliente
      </h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CustomerForm action={createCustomer} submitLabel="Criar cliente" />
      </div>
    </div>
  );
}
