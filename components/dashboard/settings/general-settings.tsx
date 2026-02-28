"use client";

import { useRef } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordSection } from "./password-section";
import type { UserSettingsUser } from "./types";

interface GeneralSettingsProps {
  user: UserSettingsUser;
  nameForm: ReturnType<typeof import("@/hooks/use-name-form").useNameForm>;
  hasPassword: boolean | undefined;
  onExportClick: () => void;
}

export function GeneralSettings({
  user,
  nameForm,
  hasPassword,
  onExportClick,
}: GeneralSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initial = user.name?.charAt(0)?.toUpperCase() ?? "U";

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info("Profile picture upload coming soon!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="space-y-3">
        <Label>Profile Picture</Label>
        <div className="flex items-center gap-3">
          {user.image ? (
            <Image
              width={48}
              height={48}
              src={user.image}
              alt={user.name}
              className="size-12 rounded-full object-cover"
            />
          ) : (
            <span className="flex items-center justify-center size-12 rounded-full bg-muted text-foreground text-lg font-bold">
              {initial}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            className="gap-2"
          >
            <Upload className="size-4" />
            Upload a photo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Name Field */}
      <nameForm.Field
        name="name"
        children={(field) => (
          <div className="space-y-3">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Your name"
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

      {/* Email Field (Read-only) */}
      <div className="space-y-3">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={user.email}
          disabled
          className="bg-muted"
        />
      </div>

      {/* Password Section */}
      {hasPassword && <PasswordSection />}

      {/* Data Section */}
      <div className="space-y-3">
        <Label>Data</Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportClick}
            className="gap-2"
          >
            Export Bookmarks
          </Button>
        </div>
      </div>
    </div>
  );
}
