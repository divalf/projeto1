"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createOpportunity, updateOpportunity } from "@/app/(auth)/pipeline/actions";
import type { Customer, Opportunity, PipelineStage, Profile } from "@/types";

interface OpportunityModalProps {
  open: boolean;
  onClose: () => void;
  stages: PipelineStage[];
  customers: Customer[];
  owners: Profile[];
  currentUserId: string;
  opportunity?: Opportunity | null;   // null = criar novo
  defaultStageId?: string;
}

export default function OpportunityModal({
  open,
  onClose,
  stages,
  customers,
  owners,
  currentUserId,
  opportunity,
  defaultStageId,
}: OpportunityModalProps) {
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Fechar com Escape (bloqueado durante salvamento)
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, pending]);

  if (!open) return null;
  if (stages.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm text-center">
          <p className="text-gray-700 font-medium mb-3">Nenhuma etapa configurada</p>
          <p className="text-sm text-gray-500 mb-4">Peça ao administrador para criar etapas do funil em Configurações.</p>
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200">Fechar</button>
        </div>
      </div>
    );
  }

  const isEditing = !!opportunity;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    setPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (isEditing && opportunity) {
        await updateOpportunity(opportunity.id, formData);
      } else {
        await createOpportunity(formData);
      }
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao salvar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  const field =
    "w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
  const label = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal */}
      <div
        ref={dialogRef}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEditing ? "Editar oportunidade" : "Nova oportunidade"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Título */}
          <div>
            <label htmlFor="title" className={label}>
              Título <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              required
              defaultValue={opportunity?.title}
              className={field}
              placeholder="Ex: Proposta para Empresa X"
              autoFocus
            />
          </div>

          {/* Etapa */}
          <div>
            <label htmlFor="stage_id" className={label}>
              Etapa <span className="text-red-500">*</span>
            </label>
            <select
              id="stage_id"
              name="stage_id"
              required
              defaultValue={opportunity?.stage_id ?? defaultStageId ?? stages[0]?.id}
              className={field}
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Valor */}
          <div>
            <label htmlFor="value" className={label}>
              Valor (R$)
            </label>
            <input
              id="value"
              name="value"
              type="number"
              min="0"
              step="0.01"
              defaultValue={opportunity?.value ?? ""}
              className={field}
              placeholder="0,00"
            />
          </div>

          {/* Cliente */}
          <div>
            <label htmlFor="customer_id" className={label}>
              Cliente
            </label>
            <select
              id="customer_id"
              name="customer_id"
              defaultValue={opportunity?.customer_id ?? ""}
              className={field}
            >
              <option value="">— Nenhum —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.company ? ` (${c.company})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Responsável */}
          <div>
            <label htmlFor="owner_id" className={label}>
              Responsável <span className="text-red-500">*</span>
            </label>
            <select
              id="owner_id"
              name="owner_id"
              required
              defaultValue={opportunity?.owner_id ?? currentUserId}
              className={field}
            >
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.full_name ?? o.email}
                  {o.id === currentUserId ? " (você)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="notes" className={label}>
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={opportunity?.notes ?? ""}
              className={`${field} resize-none`}
              placeholder="Observações sobre a oportunidade..."
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {submitError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
