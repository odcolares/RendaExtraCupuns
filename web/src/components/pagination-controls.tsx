"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  total?: number;
  searchParams?: Record<string, string | undefined>;
  basePath?: string;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function PaginationControls({
  page,
  totalPages,
  total,
  searchParams = {},
  basePath = "",
  onPageChange,
  className,
}: PaginationControlsProps) {
  const buildPageUrl = (targetPage: number) => {
    const clamped = Math.max(1, Math.min(targetPage, totalPages));
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("page", String(clamped));
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : `${basePath}?page=${clamped}`;
  };

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page <= 3) {
        for (let i = 2; i <= 4; i++) pages.push(i);
        pages.push("ellipsis");
      } else if (page >= totalPages - 2) {
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages - 1; i++) pages.push(i);
      } else {
        pages.push("ellipsis");
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push("ellipsis");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  const pages = getVisiblePages();
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-2 py-4 text-sm",
        className
      )}
    >
      <div className="text-muted-foreground">
        Página {page} de {totalPages}
        {total !== undefined && (
          <span className="hidden sm:inline"> ({total} resultados)</span>
        )}
      </div>

      {onPageChange ? (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={prevDisabled}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Button>

          {pages.map((p, i) =>
            p === "ellipsis" ? (
              <Button
                key={`ellipsis-${i}`}
                variant="ghost"
                size="sm"
                disabled
                className="pointer-events-none"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            ) : (
              <Button
                key={p as number}
                variant={page === p ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={nextDisabled}
          >
            Próximo
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <a
            href={buildPageUrl(page - 1)}
            className={cn(
              "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3",
              prevDisabled && "pointer-events-none opacity-50"
            )}
            aria-disabled={prevDisabled}
          >
            <ChevronLeft className="size-4 mr-1" />
            Anterior
          </a>

          {pages.map((p, i) =>
            p === "ellipsis" ? (
              <Button
                key={`ellipsis-${i}`}
                variant="ghost"
                size="sm"
                disabled
                className="pointer-events-none"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            ) : (
              <a
                key={p as number}
                href={buildPageUrl(p as number)}
                className={cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3",
                  page === p
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : ""
                )}
              >
                {p}
              </a>
            )
          )}

          <a
            href={buildPageUrl(page + 1)}
            className={cn(
              "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3",
              nextDisabled && "pointer-events-none opacity-50"
            )}
            aria-disabled={nextDisabled}
          >
            Próximo
            <ChevronRight className="size-4 ml-1" />
          </a>
        </div>
      )}
    </div>
  );
}
