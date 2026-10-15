import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

export type OfferStatus = "published" | "pending" | "failed";
export type TenantStatus = "active" | "suspended" | "cancelled";
export type FonteStatus = "active" | "inactive";

interface StatusBadgeProps {
  status: OfferStatus | TenantStatus | FonteStatus | string;
  type?: "offer" | "tenant" | "fonte";
  showIcon?: boolean;
  className?: string;
}

const offerVariants: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  published: {
    label: "Publicado",
    className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    icon: CheckCircle,
  },
  pending: {
    label: "Pendente",
    className: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    icon: Clock,
  },
  failed: {
    label: "Falhou",
    className: "bg-red-500/15 text-red-600 border-red-500/30",
    icon: AlertCircle,
  },
};

const tenantVariants: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  active: {
    label: "Ativo",
    className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    icon: CheckCircle,
  },
  suspended: {
    label: "Suspenso",
    className: "bg-red-500/15 text-red-600 border-red-500/30",
    icon: AlertCircle,
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-gray-500/15 text-gray-600 border-gray-500/30",
    icon: AlertCircle,
  },
};

const fonteVariants: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  active: {
    label: "Ativa",
    className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    icon: CheckCircle,
  },
  inactive: {
    label: "Inativa",
    className: "bg-gray-500/15 text-gray-600 border-gray-500/30",
    icon: Clock,
  },
};

export function StatusBadge({ status, type = "offer", showIcon = true, className }: StatusBadgeProps) {
  const variants = type === "tenant" ? tenantVariants : type === "fonte" ? fonteVariants : offerVariants;
  const config = variants[status as string] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
    icon: AlertCircle,
  };

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        "transition-all",
        status === "pending" && "animate-pulse-subtle",
        className
      )}
    >
      {showIcon && <Icon className="mr-1 size-3" />}
      {config.label}
    </Badge>
  );
}
