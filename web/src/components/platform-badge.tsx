import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";

interface PlatformBadgeProps {
  platform: string;
  showIcon?: boolean;
  className?: string;
}

const platformConfig: Record<string, { label: string; className: string }> = {
  amazon: {
    label: "Amazon",
    className: "bg-[#FF9900]/15 text-[#FF9900] border-[#FF9900]/30",
  },
  shopee: {
    label: "Shopee",
    className: "bg-[#EE4D2D]/15 text-[#EE4D2D] border-[#EE4D2D]/30",
  },
  mercadolivre: {
    label: "Mercado Livre",
    className: "bg-[#FFE600]/20 text-[#B8960F] border-[#FFE600]/40",
  },
  aliexpress: {
    label: "AliExpress",
    className: "bg-[#FF4747]/15 text-[#FF4747] border-[#FF4747]/30",
  },
  outros: {
    label: "Outros",
    className: "bg-gray-500/15 text-gray-600 border-gray-500/30",
  },
};

export function PlatformBadge({ platform, showIcon = false, className }: PlatformBadgeProps) {
  const config = platformConfig[platform] ?? {
    label: platform,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge variant="outline" className={cn("text-xs", config.className, className)}>
      {showIcon && <ShoppingCart className="mr-1 size-3" />}
      {config.label}
    </Badge>
  );
}
