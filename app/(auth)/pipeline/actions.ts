"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function moveOpportunity(id: string, newStageId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunities")
    .update({ stage_id: newStageId })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}

export async function closeOpportunity(id: string, status: "won" | "lost") {
  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunities")
    .update({ status, closed_at: new Date().toISOString(), archived_at: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
  revalidatePath("/pipeline/archive");
}

export async function archiveOpportunity(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunities")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
      closed_at: null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
  revalidatePath("/pipeline/archive");
}

export async function createOpportunity(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Título é obrigatório");

  const stageId = (formData.get("stage_id") as string)?.trim();
  if (!stageId) throw new Error("Etapa é obrigatória");

  // CREATE: owner_id é sempre o usuário atual — evita privilege escalation
  // Admin/gestor podem reatribuir via UPDATE após criação
  const ownerId = user.id;

  const rawValue = formData.get("value") as string;
  const value = rawValue ? Number(rawValue) : null;
  if (value !== null && (isNaN(value) || value < 0)) throw new Error("Valor inválido");

  const { error } = await supabase.from("opportunities").insert({
    title,
    value,
    customer_id: (formData.get("customer_id") as string)?.trim() || null,
    stage_id: stageId,
    owner_id: ownerId,
    notes: (formData.get("notes") as string)?.trim() || null,
    status: "open",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}

export async function updateOpportunity(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("Título é obrigatório");

  const ownerId = (formData.get("owner_id") as string)?.trim();
  if (!ownerId) throw new Error("Responsável é obrigatório");

  // Somente admin/gestor podem reatribuir para outro usuário
  const role = (user.app_metadata?.role as string) ?? "vendedor";
  if (ownerId !== user.id && role !== "admin" && role !== "gestor") {
    throw new Error("Apenas admin ou gestor pode reatribuir oportunidades");
  }

  const rawValue = formData.get("value") as string;
  const value = rawValue ? Number(rawValue) : null;
  if (value !== null && (isNaN(value) || value < 0)) throw new Error("Valor inválido");

  const { error } = await supabase
    .from("opportunities")
    .update({
      title,
      value,
      customer_id: (formData.get("customer_id") as string)?.trim() || null,
      owner_id: ownerId,
      notes: (formData.get("notes") as string)?.trim() || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
}

export async function reopenOpportunity(id: string, stageId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("opportunities")
    .update({
      status: "open",
      stage_id: stageId,
      closed_at: null,
      archived_at: null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/pipeline");
  revalidatePath("/pipeline/archive");
}
