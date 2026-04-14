"use client";

import { useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  id?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function PasswordInput({
  value,
  onChange,
  onBlur,
  placeholder,
  id,
  disabled,
  error,
  className,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={error}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>
    </div>
  );
}

interface PasswordRequirementProps {
  met: boolean;
  text: string;
}

export function PasswordRequirement({ met, text }: PasswordRequirementProps) {
  return (
    <div
      className={`flex items-center gap-2 text-sm ${met ? "text-green-600" : "text-muted-foreground"}`}
    >
      {met ? <Check className="size-4" /> : <X className="size-4" />}
      <span>{text}</span>
    </div>
  );
}

interface PasswordRequirementsListProps {
  password: string;
}

export function PasswordRequirementsList({
  password,
}: PasswordRequirementsListProps) {
  if (!password || password.length === 0) return null;

  const requirements = [
    { met: password.length >= 8, text: "At least 8 characters" },
    { met: password.length <= 128, text: "At most 128 characters" },
    { met: /[A-Z]/.test(password), text: "One uppercase letter (A-Z)" },
    { met: /[a-z]/.test(password), text: "One lowercase letter (a-z)" },
    { met: /[0-9]/.test(password), text: "One number (0-9)" },
    {
      met: /[^A-Za-z0-9]/.test(password),
      text: "One special character (!@#$%^&*)",
    },
  ];

  return (
    <div className="space-y-1 mt-2 p-3 bg-muted rounded-md">
      <p className="text-sm font-medium mb-2">Password requirements:</p>
      {requirements.map((req) => (
        <PasswordRequirement key={req.text} met={req.met} text={req.text} />
      ))}
    </div>
  );
}
