"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Trophy, ThumbsDown, Archive } from "lucide-react";
import { useState } from "react";
import { closeOpportunity, archiveOpportunity } from "@/app/(auth)/pipeline/actions";
import type { Opportunity } from "@/types";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onEdit: (opp: Opportunity) => void;
}

export default function OpportunityCard({ opportunity, onEdit }: OpportunityCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: opportunity.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  async function handleAction(action: "won" | "lost" | "archived") {
    if (loading) return;
    setMenuOpen(false);
    setLoading(true);
    try {
      if (action === "archived") {
        await archiveOpportunity(opportunity.id);
      } else {
        await closeOpportunity(opportunity.id, action);
      }
    } catch (err) {
      const labels = { won: "ganhar", lost: "perder", archived: "arquivar" };
      alert(`Erro ao ${labels[action]}: ${err instanceof Error ? err.message : "Tente novamente."}`);
      setMenuOpen(true); // reabre menu para o usuário tentar novamente
    } finally {
      setLoading(false);
    }
  }

  const daysSince = Math.floor(
    (Date.now() - new Date(opportunity.created_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const ownerInitials = (
    opportunity.owner?.full_name ?? opportunity.owner?.email ?? "?"
  )
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm select-none relative ${
        loading ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {/* Área arrastável */}
      <div {...listeners} {...attributes}>
        {/* Título */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(opportunity);
          }}
          className="text-sm font-medium text-gray-900 text-left hover:text-indigo-600 w-full line-clamp-2 mb-2"
          onPointerDown={(e) => e.stopPropagation()} // não iniciar drag ao clicar
        >
          {opportunity.title}
        </button>

        {/* Cliente */}
        <p className="text-xs mb-2 truncate">
          {opportunity.customer
            ? <span className="text-gray-500">{opportunity.customer.name}</span>
            : <span className="text-gray-300 italic">Sem cliente</span>
          }
        </p>

        {/* Footer: valor + avatar + dias */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">
            {opportunity.value != null
              ? new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: opportunity.currency ?? "BRL",
                  notation: "compact",
                }).format(opportunity.value)
              : "—"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{daysSince}d</span>
            <div
              title={opportunity.owner?.full_name ?? opportunity.owner?.email ?? ""}
              className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-bold"
            >
              {ownerInitials}
            </div>
          </div>
        </div>
      </div>

      {/* Menu de ações */}
      <div className="absolute top-2 right-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Mais ações"
          title="Mais ações"
          className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        >
          <MoreHorizontal size={14} />
        </button>

        {menuOpen && (
          <>
            {/* Backdrop invisível para fechar o menu */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-6 z-20 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 text-sm">
              <button
                onClick={() => handleAction("won")}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-green-700 hover:bg-green-50"
              >
                <Trophy size={13} /> Ganho
              </button>
              <button
                onClick={() => handleAction("lost")}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-red-700 hover:bg-red-50"
              >
                <ThumbsDown size={13} /> Perdido
              </button>
              <button
                onClick={() => handleAction("archived")}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-gray-600 hover:bg-gray-50"
              >
                <Archive size={13} /> Arquivar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
