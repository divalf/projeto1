"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateEmail } from "@/lib/utils/strings";

export async function createCustomer(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Nome é obrigatório");

  const { error } = await supabase.from("customers").insert({
    name,
    company: (formData.get("company") as string)?.trim() || null,
    email: validateEmail(formData.get("email") as string),
    phone: (formData.get("phone") as string)?.trim() || null,
    notes: (formData.get("notes") as string)?.trim() || null,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/customers");
  redirect("/customers");
}

export async function updateCustomer(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Nome é obrigatório");

  const { error } = await supabase
    .from("customers")
    .update({
      name,
      company: (formData.get("company") as string)?.trim() || null,
      email: validateEmail(formData.get("email") as string),
      phone: (formData.get("phone") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verificar se usuário tem permissão (RLS também protege, mas queremos mensagem clara)
  const role = (user.app_metadata?.role as string) ?? "vendedor";
  const { data: customer } = await supabase
    .from("customers")
    .select("created_by")
    .eq("id", id)
    .single();

  if (!customer) throw new Error("Cliente não encontrado");
  if (customer.created_by !== user.id && role !== "admin") {
    throw new Error("Sem permissão para excluir este cliente");
  }

  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/customers");
  redirect("/customers");
}
