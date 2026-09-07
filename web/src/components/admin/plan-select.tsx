"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { changePlanAction } from "@/actions/admin";

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

  return (
    <select
      name="plan"
      value={value}
      disabled={isPending}
      onChange={(e) => {
        const newValue = e.target.value;
        if (!confirm(`Alterar plano para "${newValue}"?`)) {
          setValue(value);
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
      }}
      className={className}
    >
      <option value="free">Free</option>
      <option value="starter">Starter</option>
      <option value="professional">Professional</option>
    </select>
  );
}
