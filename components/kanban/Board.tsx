"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import Column from "./Column";
import OpportunityModal from "./OpportunityModal";
import { moveOpportunity } from "@/app/(auth)/pipeline/actions";
import type { Customer, Opportunity, PipelineStage, Profile } from "@/types";

interface BoardProps {
  stages: PipelineStage[];
  initialOpportunities: Opportunity[];
  customers: Customer[];
  owners: Profile[];
  currentUserId: string;
}

export default function Board({
  stages,
  initialOpportunities,
  customers,
  owners,
  currentUserId,
}: BoardProps) {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [defaultStageId, setDefaultStageId] = useState<string | undefined>();
  // Flag para evitar race condition: bloqueia novo drag enquanto move está em curso
  const isMoving = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || isMoving.current) return;

      const oppId = active.id as string;
      const newStageId = over.id as string;

      const opp = opportunities.find((o) => o.id === oppId);
      if (!opp || opp.stage_id === newStageId) return;

      isMoving.current = true;

      // Atualização otimista
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? { ...o, stage_id: newStageId } : o))
      );

      try {
        await moveOpportunity(oppId, newStageId);
        router.refresh(); // sincroniza com estado real do servidor
      } catch {
        // Reverter em caso de erro
        setOpportunities((prev) =>
          prev.map((o) => (o.id === oppId ? { ...o, stage_id: opp.stage_id } : o))
        );
      } finally {
        isMoving.current = false;
      }
    },
    [opportunities]
  );

  function openNewModal(stageId: string) {
    setEditingOpp(null);
    setDefaultStageId(stageId);
    setModalOpen(true);
  }

  function openEditModal(opp: Opportunity) {
    setEditingOpp(opp);
    setDefaultStageId(opp.stage_id);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingOpp(null);
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <Column
              key={stage.id}
              stage={stage}
              opportunities={opportunities.filter((o) => o.stage_id === stage.id)}
              onNewOpportunity={openNewModal}
              onEditOpportunity={openEditModal}
            />
          ))}
        </div>
      </DndContext>

      <OpportunityModal
        open={modalOpen}
        onClose={handleModalClose}
        stages={stages}
        customers={customers}
        owners={owners}
        currentUserId={currentUserId}
        opportunity={editingOpp}
        defaultStageId={defaultStageId}
      />
    </>
  );
}
