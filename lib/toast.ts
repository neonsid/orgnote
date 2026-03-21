"use client";

import type { ReactNode } from "react";
import {
  anchoredToastManager,
  toastManager,
} from "@/components/ui/toast";

export { anchoredToastManager, toastManager };

export type ToastOptions = {
  description?: ReactNode;
  /** @deprecated use `timeout` — kept for Sonner-style call sites */
  duration?: number;
  timeout?: number;
};

const RATE_LIMIT_MS = 10_000;

function resolveTimeout(opts?: ToastOptions): number | undefined {
  if (opts?.timeout !== undefined) return opts.timeout;
  if (opts?.duration !== undefined) return opts.duration;
  return undefined;
}

function show(
  type: "success" | "error" | "info" | "warning" | "loading",
  title: ReactNode,
  opts?: ToastOptions,
) {
  const timeout = resolveTimeout(opts);
  return toastManager.add({
    type,
    title,
    description: opts?.description,
    ...(timeout !== undefined ? { timeout } : {}),
  });
}

/**
 * Use from Convex/action `catch` blocks when a mutation fails due to throttling
 * (e.g. `@convex-dev/rate-limiter`), so users see a warning rather than a hard error.
 */
export function toastRateLimited(
  title?: string,
  description?: ReactNode,
): string {
  return toastManager.add({
    type: "warning",
    title: title ?? "Slow down",
    description,
    timeout: RATE_LIMIT_MS,
  });
}

type PromiseToastOptions<T> = {
  loading?: ReactNode;
  success?: ReactNode | ((data: T) => ReactNode);
  error?: ReactNode | ((error: unknown) => ReactNode);
};

function promisePart(
  value: ReactNode | undefined,
  fallbackTitle: string,
): { title: ReactNode } {
  if (value === undefined || value === null) {
    return { title: fallbackTitle };
  }
  return { title: value };
}

function toastPromise<T>(
  promise: Promise<T>,
  opts: PromiseToastOptions<T>,
): Promise<T> {
  return toastManager.promise(promise, {
    loading: promisePart(opts.loading, "Loading…"),
    success: (data: T) =>
      promisePart(
        typeof opts.success === "function" ? opts.success(data) : opts.success,
        "Success",
      ),
    error: (error: unknown) =>
      promisePart(
        typeof opts.error === "function" ? opts.error(error) : opts.error,
        "Something went wrong",
      ),
  });
}

function toastFn(title: ReactNode, opts?: ToastOptions): string {
  return show("info", title, opts);
}

export const toast = Object.assign(toastFn, {
  success: (title: ReactNode, opts?: ToastOptions) =>
    show("success", title, opts),
  error: (title: ReactNode, opts?: ToastOptions) => show("error", title, opts),
  info: (title: ReactNode, opts?: ToastOptions) => show("info", title, opts),
  warning: (title: ReactNode, opts?: ToastOptions) =>
    show("warning", title, opts),
  promise: toastPromise,
});
