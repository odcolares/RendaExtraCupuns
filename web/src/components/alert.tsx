"use client";

import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

const alertVariants = cva(
  "relative flex items-start gap-3 rounded-lg border p-3 text-sm transition-all",
  {
    variants: {
      variant: {
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400",
        error:
          "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400",
        info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-400",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-400",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const alertIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

interface AlertProps extends VariantProps<typeof alertVariants> {
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({
  variant = "info",
  title,
  children,
  dismissible = false,
  onDismiss,
}: AlertProps) {
  const resolvedVariant = variant ?? "info";
  const Icon = alertIcons[resolvedVariant];

  return (
    <div className={cn(alertVariants({ variant: resolvedVariant }))}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? "mt-1" : ""}>{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 text-current opacity-50 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}
