"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import OpportunityCard from "./OpportunityCard";
import type { Opportunity, PipelineStage } from "@/types";

interface ColumnProps {
  stage: PipelineStage;
  opportunities: Opportunity[];
  onNewOpportunity: (stageId: string) => void;
  onEditOpportunity: (opp: Opportunity) => void;
}

export default function Column({
  stage,
  opportunities,
  onNewOpportunity,
  onEditOpportunity,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const totalValue = opportunities.reduce(
    (sum, o) => sum + (o.value ?? 0),
    0
  );

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Header da coluna */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-t-lg mb-1"
        style={{ backgroundColor: stage.color ? `${stage.color}20` : "#f3f4f6" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: stage.color ?? "#9ca3af" }}
          />
          <span className="text-sm font-semibold text-gray-800">
            {stage.name}
          </span>
          <span className="text-xs text-gray-500 bg-white rounded-full px-1.5 py-0.5">
            {opportunities.length}
          </span>
        </div>
        <button
          onClick={() => onNewOpportunity(stage.id)}
          title="Nova oportunidade nesta etapa"
          className="text-gray-500 hover:text-gray-900 hover:bg-white rounded p-0.5 transition-colors"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Valor total da coluna */}
      {totalValue > 0 && (
        <p className="text-xs text-gray-500 px-3 mb-2">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            notation: "compact",
          }).format(totalValue)}
        </p>
      )}

      {/* Área droppable */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[120px] rounded-lg p-2 space-y-2 transition-colors ${
          isOver ? "bg-indigo-50 ring-2 ring-indigo-300" : "bg-gray-100/60"
        }`}
      >
        {opportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            onEdit={onEditOpportunity}
          />
        ))}

        {opportunities.length === 0 && !isOver && (
          <button
            onClick={() => onNewOpportunity(stage.id)}
            className="w-full py-3 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-lg hover:border-indigo-300 hover:text-indigo-500 transition-colors"
          >
            + Adicionar oportunidade
          </button>
        )}
      </div>
    </div>
  );
}
