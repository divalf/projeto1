"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const VALID_ROLES = ["admin", "gestor", "vendedor"];
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const role = user.app_metadata?.role ?? "vendedor";
  if (role !== "admin") redirect("/dashboard");
  return user;
}

export async function updateUserProfile(userId: string, formData: FormData) {
  await assertAdmin();
  const fullName = (formData.get("full_name") as string)?.trim() || null;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function deleteUser(userId: string) {
  await assertAdmin();

  const { count } = await supabaseAdmin
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("status", "open");

  if ((count ?? 0) > 0) {
    throw new Error(
      `Este usuário possui ${count} oportunidade(s) em aberto. Reatribua-as antes de remover.`
    );
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updateUserRole(userId: string, newRole: string) {
  await assertAdmin();
  if (!VALID_ROLES.includes(newRole)) throw new Error("Role inválido");

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function createStage(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Nome da etapa é obrigatório");

  const color = (formData.get("color") as string)?.trim() ?? "#6366f1";
  if (!HEX_COLOR.test(color)) throw new Error("Cor inválida — use formato #rrggbb");

  const { data: last } = await supabase
    .from("pipeline_stages")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (last?.position ?? 0) + 1;

  const { error } = await supabase.from("pipeline_stages").insert({
    name,
    position: nextPosition,
    color,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/pipeline");
}

export async function updateStage(id: string, formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Nome da etapa é obrigatório");

  const color = (formData.get("color") as string)?.trim() ?? "#6366f1";
  if (!HEX_COLOR.test(color)) throw new Error("Cor inválida — use formato #rrggbb");

  const { error } = await supabase
    .from("pipeline_stages")
    .update({ name, color })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/pipeline");
}

export async function deleteStage(id: string) {
  await assertAdmin();
  const supabase = await createClient();

  // Impede deletar a última etapa (archive/page depende de firstStage)
  const { count } = await supabase
    .from("pipeline_stages")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) <= 1) {
    throw new Error("Não é possível deletar a única etapa do pipeline");
  }

  const { error } = await supabase
    .from("pipeline_stages")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/pipeline");
}
