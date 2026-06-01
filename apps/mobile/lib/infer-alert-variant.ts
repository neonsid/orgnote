export type AlertVariant = "success" | "error" | "warning" | "destructive" | "info";

export type AlertButtonLike = {
  text: string;
  style?: "default" | "cancel" | "destructive";
};

export function inferAlertVariant(title: string, buttons: AlertButtonLike[]): AlertVariant {
  const lower = title.toLowerCase();
  const isConfirm = buttons.length > 1;
  const hasDestructive = buttons.some((b) => b.style === "destructive");

  if (
    hasDestructive ||
    (isConfirm &&
      (lower.includes("delete") || lower.includes("remove") || lower.includes("sign out")))
  ) {
    return "destructive";
  }
  if (
    lower.includes("error") ||
    lower.includes("failed") ||
    lower.includes("could not") ||
    lower.includes("cannot") ||
    lower.includes("missing")
  ) {
    return "error";
  }
  if (
    lower.includes("complete") ||
    lower.includes("done") ||
    lower.includes("copied") ||
    lower.includes("success")
  ) {
    return "success";
  }
  if (lower.includes("some uploads") || lower.includes("warning") || lower.includes("required")) {
    return "warning";
  }
  return "info";
}
