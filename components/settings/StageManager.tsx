"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createStage,
  updateStage,
  deleteStage,
} from "@/app/(auth)/settings/actions";
import type { PipelineStage } from "@/types";

interface StageManagerProps {
  stages: PipelineStage[];
}

export default function StageManager({ stages }: StageManagerProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  // pending por operação: 'create' | stageId | null
  const [pending, setPending] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending("create");
    try {
      await createStage(new FormData(e.currentTarget));
      setShowForm(false);
      router.refresh(); // sincroniza lista com servidor
    } catch (err) {
      alert(`Erro ao criar etapa: ${err instanceof Error ? err.message : "Tente novamente."}`);
    } finally {
      setPending(null);
    }
  }

  async function handleUpdate(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(id);
    try {
      await updateStage(id, new FormData(e.currentTarget));
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000); // feedback temporário
      router.refresh();
    } catch (err) {
      alert(`Erro ao salvar: ${err instanceof Error ? err.message : "Tente novamente."}`);
    } finally {
      setPending(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir a etapa "${name}"? Só é possível se não houver oportunidades vinculadas.`)) return;
    setPending(id);
    try {
      await deleteStage(id);
      router.refresh();
    } catch (err) {
      alert(`Não foi possível excluir: ${err instanceof Error ? err.message : "Tente novamente."}`);
    } finally {
      setPending(null);
    }
  }

  const field = "px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {stages.map((stage) => (
          <form
            key={stage.id}
            onSubmit={(e) => handleUpdate(stage.id, e)}
            className="flex items-center gap-3 px-4 py-3"
          >
            <input
              name="color"
              type="color"
              defaultValue={stage.color ?? "#6366f1"}
              className="w-7 h-7 rounded cursor-pointer border border-gray-300"
            />
            <input
              name="name"
              defaultValue={stage.name}
              required
              className={`${field} flex-1`}
            />
            <span className="text-xs text-gray-400 w-6 text-center">
              #{stage.position}
            </span>
            <button
              type="submit"
              disabled={pending === stage.id}
              className="text-xs text-indigo-600 hover:underline shrink-0 disabled:opacity-50 flex items-center gap-1"
            >
              {savedId === stage.id ? (
                <><Check size={12} className="text-green-600" /> Salvo</>
              ) : pending === stage.id ? "..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(stage.id, stage.name)}
              disabled={pending === stage.id}
              aria-label={`Excluir etapa ${stage.name}`}
              className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          </form>
        ))}
      </div>

      {showForm ? (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
          <input
            name="color"
            type="color"
            defaultValue="#6366f1"
            className="w-7 h-7 rounded cursor-pointer border border-gray-300"
          />
          <input
            name="name"
            required
            placeholder="Nome da etapa"
            className={`${field} flex-1`}
            autoFocus
          />
          <Button type="submit" disabled={pending === "create"}>
            {pending === "create" ? "..." : "Adicionar"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
            Cancelar
          </Button>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <Plus size={15} />
          Adicionar etapa
        </button>
      )}
    </div>
  );
}
