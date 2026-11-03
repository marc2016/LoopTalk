import { describe, expect, it, vi } from "vitest";
import { waitForDatabase } from "./wait";

const noSleep = () => Promise.resolve();

describe("waitForDatabase", () => {
  it("wartet, bis die Datenbank antwortet", async () => {
    const query = vi
      .fn()
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockResolvedValue({ rows: [] });
    const log = vi.fn();
    await waitForDatabase({ query } as never, { sleep: noSleep, log });
    expect(query).toHaveBeenCalledTimes(3);
    expect(log).toHaveBeenCalledTimes(2);
  });

  it("bricht nach dem letzten Versuch ab", async () => {
    const query = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const sleep = vi.fn(noSleep);
    await expect(waitForDatabase({ query } as never, { attempts: 3, sleep, log: () => {} })).rejects.toThrow(
      "Datenbank nicht erreichbar nach 3 Versuchen.",
    );
    expect(query).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });
});
