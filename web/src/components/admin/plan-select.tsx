"use client";

import { useTransition } from "react";
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

  return (
    <select
      name="plan"
      defaultValue={defaultValue}
      disabled={isPending}
      onChange={(e) => {
        const value = e.target.value;
        startTransition(async () => {
          await changePlanAction(
            tenantId,
            value as "free" | "starter" | "professional"
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
