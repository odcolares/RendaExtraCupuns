"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { changePlanAction } from "@/actions/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PlanSelect({
  tenantId,
  defaultValue,
  className,
}: {
  tenantId: string;
  defaultValue: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  const handleChange = (newValue: string | null) => {
    if (!newValue) return;
    if (!confirm(`Alterar plano para "${newValue}"?`)) {
      return;
    }
    setValue(newValue);
    startTransition(async () => {
      await changePlanAction(
        tenantId,
        newValue as "free" | "starter" | "professional"
      );
      router.refresh();
    });
  };

  return (
    <Select
      value={value}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="free">Free</SelectItem>
        <SelectItem value="starter">Starter</SelectItem>
        <SelectItem value="professional">Professional</SelectItem>
      </SelectContent>
    </Select>
  );
}
