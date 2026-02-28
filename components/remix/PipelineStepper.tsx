"use client";

import { Check, Circle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStep = "source" | "remix" | "approve" | "generate" | "review";

interface StepConfig {
  id: PipelineStep;
  label: string;
  description: string;
}

const STEPS: StepConfig[] = [
  { id: "source", label: "Source", description: "Select content from Library" },
  { id: "remix", label: "Remix", description: "AI title, thumbnail, script" },
  { id: "approve", label: "Approve", description: "Review and approve remix" },
  { id: "generate", label: "Generate", description: "Voice, avatar, B-roll" },
  { id: "review", label: "Review", description: "Final video review" },
];

interface PipelineStepperProps {
  currentStep: PipelineStep;
  projectStatus: string;
  onStepClick?: (step: PipelineStep) => void;
  className?: string;
}

function getStepState(
  step: PipelineStep,
  currentStep: PipelineStep,
  projectStatus: string
): "complete" | "active" | "upcoming" | "error" {
  const stepOrder = STEPS.map((s) => s.id);
  const currentIdx = stepOrder.indexOf(currentStep);
  const stepIdx = stepOrder.indexOf(step);

  if (projectStatus === "error") {
    if (stepIdx === currentIdx) return "error";
    if (stepIdx < currentIdx) return "complete";
    return "upcoming";
  }

  if (projectStatus === "complete" || stepIdx < currentIdx) return "complete";
  if (stepIdx === currentIdx) return "active";
  return "upcoming";
}

export function PipelineStepper({ currentStep, projectStatus, onStepClick, className }: PipelineStepperProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {STEPS.map((step, i) => {
        const state = getStepState(step.id, currentStep, projectStatus);
        const isClickable = onStepClick && state === "complete";

        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            {/* Step indicator */}
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors min-w-0 w-full",
                state === "active" && "bg-primary/10 border border-primary/30",
                state === "complete" && "bg-muted/50 hover:bg-muted cursor-pointer",
                state === "upcoming" && "opacity-40",
                state === "error" && "bg-destructive/10 border border-destructive/30",
              )}
            >
              {/* Icon */}
              <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full shrink-0 text-xs font-medium",
                state === "complete" && "bg-primary text-primary-foreground",
                state === "active" && "bg-primary text-primary-foreground",
                state === "upcoming" && "bg-muted text-muted-foreground",
                state === "error" && "bg-destructive text-destructive-foreground",
              )}>
                {state === "complete" && <Check className="h-3.5 w-3.5" />}
                {state === "active" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {state === "upcoming" && <Circle className="h-3 w-3" />}
                {state === "error" && <AlertCircle className="h-3.5 w-3.5" />}
              </div>

              {/* Label */}
              <div className="min-w-0">
                <p className={cn(
                  "text-xs font-medium truncate",
                  state === "active" && "text-foreground",
                  state === "complete" && "text-foreground",
                  state === "upcoming" && "text-muted-foreground",
                  state === "error" && "text-destructive",
                )}>
                  {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground truncate hidden sm:block">{step.description}</p>
              </div>
            </button>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div className={cn(
                "h-px w-4 shrink-0 mx-0.5",
                state === "complete" ? "bg-primary" : "bg-border",
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
