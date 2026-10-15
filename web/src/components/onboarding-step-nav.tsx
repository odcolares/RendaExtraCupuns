"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingStepNavProps {
  steps: { id: string }[];
  currentStepId: string;
}

export function OnboardingStepNav({
  steps,
  currentStepId,
}: OnboardingStepNavProps) {
  return (
    <div className="flex justify-between mt-6">
      <Button
        variant="outline"
        onClick={() => {
          const currentIndex = steps.findIndex((s) => s.id === currentStepId);
          if (currentIndex > 0) {
            // Navigate to previous step via URL or state
            window.history.back();
          }
        }}
        disabled={currentStepId === "whatsapp"}
      >
        Anterior
      </Button>
      <Button
        onClick={() => {
          const currentIndex = steps.findIndex((s) => s.id === currentStepId);
          if (currentIndex < steps.length - 1) {
            const nextStep = steps[currentIndex + 1];
            // Could use router.push or state management
            window.location.href = `#${nextStep.id}`;
          }
        }}
        disabled={currentStepId === "ready"}
      >
        Próximo
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
