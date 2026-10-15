"use client";

import { ReactNode, useState } from "react";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthInputProps {
  label: string;
  htmlFor: string;
  type?: string;
  placeholder?: string;
  icon?: ReactNode;
  error?: string;
}

export function AuthInput({
  label,
  htmlFor,
  type = "text",
  placeholder,
  icon,
  error,
}: AuthInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
            {icon}
          </div>
        )}
        <Input
          id={htmlFor}
          type={type}
          placeholder={placeholder}
          className={cn(
            "focus-visible:ring-brand-primary placeholder:text-muted-foreground/50",
            icon && "pl-10"
          )}
        />
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

export function EmailInput({ error, ...props }: { error?: string } & React.ComponentProps<typeof Input>) {
  return (
    <AuthInput
      label="Email"
      htmlFor={props.id || "email"}
      type="email"
      placeholder="seu@email.com"
      icon={<Mail className="size-4" />}
      error={error}
    />
  );
}

export function PasswordInput({
  error,
  showToggle = true,
  ...props
}: { error?: string; showToggle?: boolean; } & React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={props.id || "password"}>Senha</Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
          <Lock className="size-4" />
        </div>
        <Input
          id={props.id || "password"}
          type={show ? "text" : "password"}
          placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
          className={cn(
            "focus-visible:ring-brand-primary placeholder:text-muted-foreground/50 pr-10",
            true && "pl-10"
          )}
          {...props}
        />
        {showToggle && (
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground"
            onClick={() => setShow(!show)}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
