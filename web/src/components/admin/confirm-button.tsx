"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelTenantAction } from "@/actions/admin";

export function ConfirmButton({
  tenantId,
  message,
  children,
  ...props
}: {
  tenantId: string;
  message: string;
  children: ReactNode;
} & React.ComponentProps<typeof Button>) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      {...props}
      disabled={isPending}
      onClick={() => {
        if (!confirm(message)) return;
        startTransition(async () => {
          await cancelTenantAction(tenantId);
          router.refresh();
        });
      }}
    >
      {children}
    </Button>
  );
}
