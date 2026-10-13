const key = "parola_completed_guide_steps";
const event = "parola-guide-progress";
let memory: string | undefined;
export const serverProgress = () => null;
export function readProgress(): string {
  if (memory !== undefined) return memory;
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}
export function subscribeProgress(listener: () => void) {
  const onStorage = (change: StorageEvent) => {
    if (change.key === key || change.key === null) {
      memory = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(event, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(event, listener);
  };
}
export function saveProgress(ids: string[]): boolean {
  const value = JSON.stringify(ids);
  let persisted = true;
  try {
    localStorage.setItem(key, value);
    memory = undefined;
  } catch {
    memory = value;
    persisted = false;
  }
  window.dispatchEvent(new Event(event));
  return persisted;
}
export function validateProgress(
  raw: string | null,
  validIds: string[],
): string[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    return Array.isArray(value)
      ? Array.from(
          new Set(
            value.filter(
              (id): id is string =>
                typeof id === "string" && validIds.includes(id),
            ),
          ),
        )
      : [];
  } catch {
    return [];
  }
}
