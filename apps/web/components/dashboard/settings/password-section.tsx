"use client";

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

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Key className="size-4" />
        Change Password
      </Label>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-3"
      >
        <form.Field
          name="currentPassword"
          children={(field) => (
            <div className="space-y-2">
              <PasswordInput
                placeholder="Current password"
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
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
        />
        <form.Field
          name="newPassword"
          children={(field) => (
            <div className="space-y-2">
              <PasswordInput
                placeholder="New password"
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
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
        />
        <form.Field
          name="confirmPassword"
          children={(field) => (
            <div className="space-y-2">
              <PasswordInput
                placeholder="Confirm new password"
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                onBlur={field.handleBlur}
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
        />
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={!canSubmit}
            >
              {isSubmitting ? "Updating…" : "Update Password"}
            </Button>
          )}
        />
      </form>
    </div>
  );
}
