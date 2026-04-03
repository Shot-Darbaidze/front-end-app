export function isExpectedAuthTransitionError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.trim().toLowerCase();

  return (
    message.includes("load failed") ||
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("networkerror") ||
    message.includes("signal is aborted") ||
    message.includes("the operation was aborted")
  );
}

export function hardRedirect(path: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.location.replace(path);
}