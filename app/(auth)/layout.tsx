import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let role = user.app_metadata?.role as string | undefined;
  if (!role) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? "vendedor";
  }
  const name = user.user_metadata?.full_name ?? user.email ?? "";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar role={role ?? "vendedor"} name={name} avatarUrl={avatarUrl} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
