"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { updateUserRole, updateUserProfile, deleteUser } from "@/app/(auth)/settings/actions";
import type { Profile, Role } from "@/types";

const ROLES: { value: Role; label: string }[] = [
  { value: "vendedor", label: "Vendedor" },
  { value: "gestor", label: "Gestor" },
  { value: "admin", label: "Admin" },
];

interface UserListProps {
  users: Profile[];
  currentUserId: string;
}

export default function UserList({ users, currentUserId }: UserListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  function startEdit(user: Profile) {
    setEditingId(user.id);
    setEditName(user.full_name ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function handleSaveName(userId: string) {
    setLoading(userId);
    try {
      const fd = new FormData();
      fd.append("full_name", editName);
      await updateUserProfile(userId, fd);
      setSavedId(userId);
      setTimeout(() => setSavedId(null), 2000);
      setEditingId(null);
      router.refresh();
    } catch (err) {
      alert(`Erro ao salvar: ${err instanceof Error ? err.message : "Tente novamente."}`);
    } finally {
      setLoading(null);
    }
  }

  async function handleRoleChange(userId: string, newRole: string, currentRole: string) {
    const roleLabel: Record<string, string> = { admin: "Admin", gestor: "Gestor", vendedor: "Vendedor" };
    if (!confirm(`Trocar role de "${roleLabel[currentRole]}" para "${roleLabel[newRole]}"?`)) return;
    setLoading(userId);
    try {
      await updateUserRole(userId, newRole);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(user: Profile) {
    if (!confirm(`Remover "${user.full_name ?? user.email}"? Esta ação é irreversível.`)) return;
    setLoading(user.id);
    try {
      await deleteUser(user.id);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao remover usuário.");
    } finally {
      setLoading(null);
    }
  }

  const inputCls = "px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
      {users.map((user) => {
        const isSelf = user.id === currentUserId;
        const isEditing = editingId === user.id;
        const isLoading = loading === user.id;
        const initials = (user.full_name ?? user.email)
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

        return (
          <div key={user.id} className="flex items-center gap-3 px-4 py-3">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>

            {/* Nome + email */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`${inputCls} flex-1`}
                    placeholder="Nome completo"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName(user.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                  />
                  <button
                    onClick={() => handleSaveName(user.id)}
                    disabled={isLoading}
                    className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                    title="Salvar"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-gray-400 hover:text-gray-600"
                    title="Cancelar"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.full_name ?? user.email}
                    {isSelf && <span className="ml-1.5 text-xs text-gray-400">(você)</span>}
                    {savedId === user.id && <span className="ml-1.5 text-xs text-green-600">Salvo</span>}
                  </p>
                  {!isSelf && (
                    <button
                      onClick={() => startEdit(user)}
                      className="text-gray-400 hover:text-gray-700 shrink-0"
                      title="Editar nome"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>

            {/* Role */}
            <select
              value={user.role}
              disabled={isSelf || isLoading}
              onChange={(e) => handleRoleChange(user.id, e.target.value, user.role)}
              className={`text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isSelf || isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            {/* Remover */}
            {!isSelf && (
              <button
                onClick={() => handleDelete(user)}
                disabled={isLoading}
                title="Remover usuário"
                className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
