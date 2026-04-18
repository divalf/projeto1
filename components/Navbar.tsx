"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, KanbanSquare, Users, Settings, LogOut } from "lucide-react";

interface NavbarProps {
  role: string;
  name: string;
  avatarUrl?: string;
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/customers", label: "Clientes", icon: Users },
  { href: "/settings", label: "Configurações", icon: Settings, requiredRole: "admin" },
];

export default function Navbar({ role, name, avatarUrl }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Erro ao sair:", err);
      alert("Erro ao sair. Tente novamente.");
    }
  }

  const initials =
    (name || "?")
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

        {/* Logo */}
        <Link href="/dashboard" aria-label="FlowCRM — início" className="text-base font-bold text-gray-900 shrink-0">
          FlowCRM
        </Link>

        {/* Links de navegação */}
        <nav className="hidden sm:flex items-center gap-1">
          {navLinks
            .filter(({ requiredRole }) => !requiredRole || role === requiredRole)
            .map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href ||
                (href !== "/" && pathname.startsWith(href + "/"));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
        </nav>

        {/* Avatar + logout */}
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="flex items-center gap-2">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                {initials}
              </div>
            )}
            <span className="hidden md:block text-sm text-gray-700 max-w-[140px] truncate">
              {name}
            </span>
          </div>

          {/* Botão logout */}
          <button
            onClick={handleLogout}
            title="Sair"
            aria-label="Sair do sistema"
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>

      </div>
    </header>
  );
}
