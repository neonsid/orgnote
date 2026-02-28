"use client";

import { useRef, useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Image from "next/image";
import {
  Upload,
  Key,
  Check,
  X,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { ExportBookmarksDialog } from "@/components/dashboard/export-bookmarks-dialog";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  updateNameSchema,
  changePasswordSchema,
  publicProfileSchema,
  type UpdateNameFormData,
  type ChangePasswordFormData,
  type PublicProfileFormData,
} from "@/lib/validation";

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

interface PasswordRequirementProps {
  met: boolean;
  text: string;
}

function PasswordRequirement({ met, text }: PasswordRequirementProps) {
  return (
    <div
      className={`flex items-center gap-2 text-sm ${met ? "text-green-600" : "text-muted-foreground"}`}
    >
      {met ? <Check className="size-4" /> : <X className="size-4" />}
      <span>{text}</span>
    </div>
  );
}

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  id?: string;
  disabled?: boolean;
  error?: boolean;
}

function PasswordInput({
  value,
  onChange,
  onBlur,
  placeholder,
  id,
  disabled,
  error,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
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

export function UserSettingsDialog({
  open,
  onOpenChange,
  user,
}: UserSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<"general" | "public-profile">(
    "general",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initial = user.name?.charAt(0)?.toUpperCase() ?? "U";

  const upsertProfile = useMutation(api.profile.upsertProfile);
  const existingProfile = useQuery(api.profile.getProfile, { userId: user.id });

  // Name form
  const nameForm = useForm({
    defaultValues: {
      name: user.name,
    } as UpdateNameFormData,
    validators: {
      onChange: updateNameSchema,
      onSubmit: updateNameSchema,
    },
    onSubmit: async ({ value }) => {
      if (value.name !== user.name) {
        await authClient.updateUser({ name: value.name });
      }
    },
  });

  // Password form
  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    } as ChangePasswordFormData,
    validators: {
      onChange: changePasswordSchema,
      onSubmit: changePasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setPasswordFieldErrors({});

      const result = await authClient.changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
        revokeOtherSessions: true,
      });

      if (result.error) {
        const errorMessage = result.error.message || "";
        let userMessage = "Failed to change password.";

        if (
          errorMessage.toLowerCase().includes("invalid password") ||
          errorMessage.toLowerCase().includes("incorrect password")
        ) {
          userMessage =
            "Current password is incorrect. Please check and try again.";
          setPasswordFieldErrors({ currentPassword: userMessage });
        } else if (errorMessage.toLowerCase().includes("new password")) {
          userMessage =
            "New password doesn't meet requirements. Please check the requirements below.";
          setPasswordFieldErrors({ newPassword: userMessage });
        } else if (errorMessage.toLowerCase().includes("same password")) {
          userMessage =
            "New password cannot be the same as your current password.";
          setPasswordFieldErrors({ newPassword: userMessage });
        } else {
          setPasswordFieldErrors({
            currentPassword: userMessage,
          });
        }

        toast.error(userMessage);
        throw new Error(userMessage);
      }

      toast.success("Password changed successfully!");
      passwordForm.reset();
    },
  });

  // Public profile form
  const profileForm = useForm({
    defaultValues: {
      isPublic: false,
      username: "",
      bio: "",
      github: "",
      twitter: "",
      website: "",
    } as PublicProfileFormData,
    validators: {
      onChange: publicProfileSchema,
      onSubmit: publicProfileSchema,
    },
    onSubmit: async ({ value }) => {
      // Only save if user has entered something
      if (
        value.username ||
        value.bio ||
        value.github ||
        value.twitter ||
        value.website
      ) {
        const links = [] as Array<{
          label: "GitHub" | "Twitter" | "Portfolio";
          url: string;
        }>;
        if (value.github) links.push({ label: "GitHub", url: value.github });
        if (value.twitter)
          links.push({
            label: "Twitter",
            url: `https://x.com/${value.twitter}`,
          });
        if (value.website)
          links.push({
            label: "Portfolio",
            url: `https://${value.website}`,
          });

        await upsertProfile({
          userId: user.id,
          username: value.username || undefined,
          bio: value.bio || undefined,
          links: links[0],
          isPublic: value.isPublic,
        });
      }
    },
  });

  useEffect(() => {
    if (open) {
      authClient.listAccounts().then((result) => {
        if (result.data) {
          const credentialAccount = result.data.find(
            (account) => account.providerId === "credential",
          );
          setHasPassword(!!credentialAccount);
        }
      });
    }
  }, [open]);

  // Load existing profile data when dialog opens
  useEffect(() => {
    if (open && existingProfile) {
      profileForm.setFieldValue("isPublic", existingProfile.isPublic);
      if (existingProfile.username) {
        profileForm.setFieldValue("username", existingProfile.username);
      }
      if (existingProfile.bio) {
        profileForm.setFieldValue("bio", existingProfile.bio);
      }
      if (existingProfile.links) {
        const link = existingProfile.links;
        if (link.label === "GitHub") {
          profileForm.setFieldValue("github", link.url);
        } else if (link.label === "Twitter") {
          // Extract username from https://x.com/username
          const match = link.url.match(/https:\/\/x\.com\/(\w+)/);
          if (match) {
            profileForm.setFieldValue("twitter", match[1]);
          }
        } else if (link.label === "Portfolio") {
          // Extract domain from https://domain.com
          const match = link.url.match(/https:\/\/(.+)/);
          if (match) {
            profileForm.setFieldValue("website", match[1]);
          }
        }
      }
    }
  }, [open, existingProfile, profileForm]);

  // Reset name form when user prop changes
  useEffect(() => {
    nameForm.setFieldValue("name", user.name);
  }, [user.name, nameForm]);

  const handleClose = () => {
    nameForm.reset();
    passwordForm.reset();
    profileForm.reset();
    onOpenChange(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Submit name form
      await nameForm.handleSubmit();

      // Submit profile form
      await profileForm.handleSubmit();

      toast.success("Profile saved successfully!");
      handleClose();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Manage your account settings.
          </p>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === "general"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab("public-profile")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === "public-profile"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Public Profile
            </button>
          </div>

          {activeTab === "general" && (
            <div className="mt-6 space-y-6">
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

              {hasPassword && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Key className="size-4" />
                    Change Password
                  </Label>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      passwordForm.handleSubmit();
                    }}
                    className="space-y-3"
                  >
                    <passwordForm.Field
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
                              !!passwordFieldErrors.currentPassword
                            }
                          />
                          {passwordFieldErrors.currentPassword && (
                            <p className="text-sm text-red-500">
                              {passwordFieldErrors.currentPassword}
                            </p>
                          )}
                          {field.state.meta.errors.length > 0 &&
                            !passwordFieldErrors.currentPassword && (
                              <p className="text-sm text-red-500">
                                {field.state.meta.errors[0]?.message}
                              </p>
                            )}
                        </div>
                      )}
                    />
                    <passwordForm.Field
                      name="newPassword"
                      children={(field) => {
                        const password = field.state.value;
                        const hasMinLength = password.length >= 8;
                        const hasMaxLength = password.length <= 128;
                        const hasUppercase = /[A-Z]/.test(password);
                        const hasLowercase = /[a-z]/.test(password);
                        const hasNumber = /[0-9]/.test(password);
                        const hasSpecial = /[^A-Za-z0-9]/.test(password);

                        return (
                          <div className="space-y-2">
                            <PasswordInput
                              placeholder="New password"
                              value={field.state.value}
                              onChange={(value) => field.handleChange(value)}
                              onBlur={field.handleBlur}
                              error={
                                field.state.meta.errors.length > 0 ||
                                !!passwordFieldErrors.newPassword
                              }
                            />
                            {passwordFieldErrors.newPassword && (
                              <p className="text-sm text-red-500">
                                {passwordFieldErrors.newPassword}
                              </p>
                            )}
                            {password.length > 0 && (
                              <div className="space-y-1 mt-2 p-3 bg-muted rounded-md">
                                <p className="text-sm font-medium mb-2">
                                  Password requirements:
                                </p>
                                <PasswordRequirement
                                  met={hasMinLength}
                                  text="At least 8 characters"
                                />
                                <PasswordRequirement
                                  met={hasMaxLength}
                                  text="At most 128 characters"
                                />
                                <PasswordRequirement
                                  met={hasUppercase}
                                  text="One uppercase letter (A-Z)"
                                />
                                <PasswordRequirement
                                  met={hasLowercase}
                                  text="One lowercase letter (a-z)"
                                />
                                <PasswordRequirement
                                  met={hasNumber}
                                  text="One number (0-9)"
                                />
                                <PasswordRequirement
                                  met={hasSpecial}
                                  text="One special character (!@#$%^&*)"
                                />
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <passwordForm.Field
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
                              !!passwordFieldErrors.confirmPassword
                            }
                          />
                          {passwordFieldErrors.confirmPassword && (
                            <p className="text-sm text-red-500">
                              {passwordFieldErrors.confirmPassword}
                            </p>
                          )}
                          {field.state.meta.errors.length > 0 &&
                            !passwordFieldErrors.confirmPassword && (
                              <p className="text-sm text-red-500">
                                {field.state.meta.errors[0]?.message}
                              </p>
                            )}
                        </div>
                      )}
                    />
                    <passwordForm.Subscribe
                      selector={(state) => [
                        state.canSubmit,
                        state.isSubmitting,
                      ]}
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
              )}

              <div className="space-y-3">
                <Label>Data</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExportOpen(true)}
                    className="gap-2"
                  >
                    Export Bookmarks
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "public-profile" && (
            <div className="mt-6 space-y-6">
              <profileForm.Field
                name="isPublic"
                children={(field) => (
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="public-profile-toggle"
                      className="font-medium"
                    >
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
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>

      <ExportBookmarksDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        userId={user.id}
      />
    </Dialog>
  );
}
