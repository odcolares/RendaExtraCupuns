import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type MetricAccent = "primary" | "teal" | "amber" | "violet"

type MetricCardProps = {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  accent?: MetricAccent
}

const ACCENT_CLASSES: Record<MetricAccent, { card: string; chip: string }> = {
  primary: {
    card: "border-l-brand-primary bg-brand-primary/5",
    chip: "bg-brand-primary/10 text-brand-primary",
  },
  teal: {
    card: "border-l-teal-500 bg-teal-500/5",
    chip: "bg-teal-500/10 text-teal-600",
  },
  amber: {
    card: "border-l-amber-500 bg-amber-500/5",
    chip: "bg-amber-500/10 text-amber-600",
  },
  violet: {
    card: "border-l-violet-500 bg-violet-500/5",
    chip: "bg-violet-500/10 text-violet-600",
  },
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "primary",
}: MetricCardProps) {
  const accentClasses = ACCENT_CLASSES[accent]

  return (
    <Card className={cn("border-l-4", accentClasses.card)}>
      <CardContent className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl",
            accentClasses.chip
          )}
        >
          <Icon className="size-6" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-semibold tracking-tight">
            {value}
          </p>
          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
