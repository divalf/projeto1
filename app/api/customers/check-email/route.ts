import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Requer sessão ativa — evita enumeração de emails por não autenticados
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const email = request.nextUrl.searchParams.get("email");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ count: 0 });
  }

  const { count, error } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .ilike("email", email);

  if (error) {
    console.error("check-email error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ count: count ?? 0 });
}
