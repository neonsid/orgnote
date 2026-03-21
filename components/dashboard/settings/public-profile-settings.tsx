"use client";

import Copy from "lucide-react/dist/esm/icons/copy";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import Check from "lucide-react/dist/esm/icons/check";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { ReturnValue } from "@/hooks/use-public-profile-form";

interface PublicProfileSettingsProps {
  profileForm: ReturnValue;
}

export function PublicProfileSettings({
  profileForm,
}: PublicProfileSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Public Profile Toggle */}
      <profileForm.Field
        name="isPublic"
        children={(field) => (
          <div className="flex items-center justify-between">
            <Label htmlFor="public-profile-toggle" className="font-medium">
              Public Profile
            </Label>
            <Switch
              id="public-profile-toggle"
              checked={field.state.value}
              onCheckedChange={(checked) => field.handleChange(checked)}
            />
          </div>
        )}
      />

      {/* Username Field */}
      <profileForm.Field
        name="username"
        children={(field) => (
          <div className="space-y-3">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="username"
                className="pr-10"
                aria-invalid={field.state.meta.errors.length > 0}
              />
              {field.state.value &&
                field.state.value.length > 0 &&
                field.state.meta.errors.length === 0 && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-green-500" />
                )}
            </div>
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-500">
                {field.state.meta.errors[0]?.message}
              </p>
            )}
          </div>
        )}
      />

      {/* Bio Field */}
      <profileForm.Field
        name="bio"
        children={(field) => (
          <div className="space-y-3">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Building cool things on the web"
              rows={3}
              aria-invalid={field.state.meta.errors.length > 0}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-500">
                {field.state.meta.errors[0]?.message}
              </p>
            )}
          </div>
        )}
      />

      {/* GitHub Field */}
      <profileForm.Field
        name="github"
        children={(field) => (
          <div className="space-y-3">
            <Label htmlFor="github">GitHub</Label>
            <Input
              id="github"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="https://github.com/username"
              aria-invalid={field.state.meta.errors.length > 0}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-500">
                {field.state.meta.errors[0]?.message}
              </p>
            )}
          </div>
        )}
      />

      {/* Twitter Field */}
      <profileForm.Field
        name="twitter"
        children={(field) => (
          <div className="space-y-3">
            <Label htmlFor="twitter">X (Twitter)</Label>
            <Input
              id="twitter"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="username"
              aria-invalid={field.state.meta.errors.length > 0}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-500">
                {field.state.meta.errors[0]?.message}
              </p>
            )}
          </div>
        )}
      />

      {/* Website Field */}
      <profileForm.Field
        name="website"
        children={(field) => (
          <div className="space-y-3">
            <Label htmlFor="website">Website</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                https://
              </span>
              <Input
                id="website"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="example.com"
                className="rounded-l-none"
                aria-invalid={field.state.meta.errors.length > 0}
              />
            </div>
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-500">
                {field.state.meta.errors[0]?.message}
              </p>
            )}
          </div>
        )}
      />

      {/* Action Buttons */}
      <profileForm.Subscribe
        selector={(state) => [state.values.username]}
        children={([username]) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const profileUrl = `${window.location.origin}/u/${username}`;
                navigator.clipboard.writeText(profileUrl);
                toast.success("Profile link copied!");
              }}
              disabled={!username}
              className="gap-2"
            >
              <Copy className="size-4" />
              Copy Profile Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(`/u/${username}`, "_blank");
              }}
              disabled={!username}
              className="gap-2"
            >
              <ExternalLink className="size-4" />
              Preview Profile
            </Button>
          </div>
        )}
      />
    </div>
  );
}
