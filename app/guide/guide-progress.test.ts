import { beforeEach, describe, expect, it, vi } from "vitest";

describe("saved guide completion", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("does not grant completion for malformed data or unknown lessons", async () => {
    const { validateProgress } =
      await import("../../components/information/guide-progress");
    expect(validateProgress("{broken", ["account"])).toEqual([]);
    expect(validateProgress('{"account":true}', ["account"])).toEqual([]);
    expect(
      validateProgress('["account","account","unknown",7,null]', [
        "account",
        "vessel",
      ]),
    ).toEqual(["account"]);
  });

  it("preserves the existing storage key and notifies mounted readers", async () => {
    const saved = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => saved.set(key, value),
    });
    vi.stubGlobal("window", new EventTarget());
    const { saveProgress, readProgress, subscribeProgress } =
      await import("../../components/information/guide-progress");
    const listener = vi.fn();
    const unsubscribe = subscribeProgress(listener);
    expect(saveProgress(["account"])).toBe(true);
    expect(saved.get("parola_completed_guide_steps")).toBe('["account"]');
    expect(readProgress()).toBe('["account"]');
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    saveProgress([]);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("keeps controls functional when storage is blocked", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    vi.stubGlobal("window", new EventTarget());
    const { saveProgress, readProgress } =
      await import("../../components/information/guide-progress");
    expect(readProgress()).toBe("");
    expect(saveProgress(["account", "vessel"])).toBe(false);
    expect(readProgress()).toBe('["account","vessel"]');
    saveProgress(["vessel"]);
    expect(readProgress()).toBe('["vessel"]');
  });
});
