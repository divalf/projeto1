"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateUserProfile } from "@/app/(auth)/settings/actions";
import type { Profile } from "@/types";

interface MyProfileProps {
  profile: Profile;
}

export default function MyProfile({ profile }: MyProfileProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const fd = new FormData();
      fd.append("full_name", fullName);
      await updateUserProfile(profile.id, fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (err) {
      alert(`Erro ao salvar: ${err instanceof Error ? err.message : "Tente novamente."}`);
    } finally {
      setPending(false);
    }
  }

  const initials = (profile.full_name ?? profile.email)
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-4 mb-4">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name ?? profile.email}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-900">{profile.full_name ?? profile.email}</p>
          <p className="text-xs text-gray-500">{profile.email}</p>
          <p className="text-xs text-gray-400 capitalize mt-0.5">{profile.role}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nome de exibição</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome completo"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">E-mail</label>
          <input
            value={profile.email}
            disabled
            className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`}
          />
          <p className="text-xs text-gray-400 mt-1">
            E-mail gerenciado pelo Google — altere via conta Google.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar alterações"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check size={14} /> Salvo
          </span>
        )}
      </div>
    </form>
  );
}
