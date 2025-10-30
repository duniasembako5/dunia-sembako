import { toast } from "sonner";

// Base config
const defaultOptions = {
  duration: 3000,
  position: "top-right" as const,
  invert: true,
};

const successOptions = {
  ...defaultOptions,
  style: {
    background: "oklch(72.3% 0.219 149.579)",
  },
};

const errorOptions = {
  ...defaultOptions,
  style: {
    background: "#e7000b",
  },
};

// Simple wrappers
export const showToast = (message: string) => toast(message, defaultOptions);

export const showSuccess = (message: string) =>
  toast.success(message, successOptions);

export const showInfo = (message: string) =>
  toast.info(message, defaultOptions);

export const showWarning = (message: string) =>
  toast.warning(message, defaultOptions);

export const showError = (message: string) =>
  toast.error(message, errorOptions);

export const showPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: (data: T) => string;
    error: string;
  },
) =>
  toast.promise(promise, {
    ...messages,
    ...defaultOptions,
  });
