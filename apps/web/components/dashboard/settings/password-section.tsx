"use client";

import type { KeyboardEventHandler } from "react";
import Key from "lucide-react/dist/esm/icons/key";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  PasswordInput,
  PasswordRequirementsList,
} from "@/components/ui/password-input";
import { usePasswordForm } from "@/hooks/use-password-form";

export function PasswordSection() {
  const { form, fieldErrors } = usePasswordForm();

  const submitOnEnter: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    void form.handleSubmit();
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Key className="size-4" />
        Change Password
      </Label>
      <div className="space-y-3">
        <form.Field name="currentPassword">
          {(field) => (
            <div className="space-y-2">
              <PasswordInput
                placeholder="Current password"
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
                onKeyDown={submitOnEnter}
                error={
                  field.state.meta.errors.length > 0 ||
                  !!fieldErrors.currentPassword
                }
              />
              {fieldErrors.currentPassword && (
                <p className="text-sm text-red-500">
                  {fieldErrors.currentPassword}
                </p>
              )}
              {field.state.meta.errors.length > 0 &&
                !fieldErrors.currentPassword && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
            </div>
          )}
        </form.Field>
        <form.Field name="newPassword">
          {(field) => (
            <div className="space-y-2">
              <PasswordInput
                placeholder="New password"
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
                onKeyDown={submitOnEnter}
                error={
                  field.state.meta.errors.length > 0 ||
                  !!fieldErrors.newPassword
                }
              />
              {fieldErrors.newPassword && (
                <p className="text-sm text-red-500">
                  {fieldErrors.newPassword}
                </p>
              )}
              <PasswordRequirementsList password={field.state.value} />
            </div>
          )}
        </form.Field>
        <form.Field name="confirmPassword">
          {(field) => (
            <div className="space-y-2">
              <PasswordInput
                placeholder="Confirm new password"
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
                onKeyDown={submitOnEnter}
                error={
                  field.state.meta.errors.length > 0 ||
                  !!fieldErrors.confirmPassword
                }
              />
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {fieldErrors.confirmPassword}
                </p>
              )}
              {field.state.meta.errors.length > 0 &&
                !fieldErrors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
            </div>
          )}
        </form.Field>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting] as const}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!canSubmit}
              onClick={() => void form.handleSubmit()}
            >
              {isSubmitting ? "Updating…" : "Update Password"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </div>
  );
}
