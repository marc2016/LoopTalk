import { describe, expect, it } from "vitest";
import { commitField } from "./inline-edit";

describe("commitField", () => {
  it("speichert nichts, wenn sich nichts geändert hat", () => {
    expect(commitField("title", "Budget", "Budget")).toEqual({ kind: "skip" });
  });

  it("speichert nichts, wenn nur Leerzeichen dazugekommen sind", () => {
    expect(commitField("title", "Budget", "  Budget  ")).toEqual({ kind: "skip" });
    expect(commitField("description", "Text", "Text\n")).toEqual({ kind: "skip" });
  });

  it("lehnt einen leeren Titel ab", () => {
    expect(commitField("title", "Budget", "   ")).toEqual({ kind: "error", message: "Bitte einen Titel angeben." });
  });

  it("lehnt einen zu langen Titel ab", () => {
    expect(commitField("title", "Budget", "x".repeat(201))).toEqual({
      kind: "error",
      message: "Der Titel darf höchstens 200 Zeichen lang sein.",
    });
  });

  it("erlaubt eine leere Beschreibung", () => {
    expect(commitField("description", "Alter Text", "  ")).toEqual({ kind: "save", value: "" });
  });

  it("speichert eine gültige Änderung getrimmt", () => {
    expect(commitField("title", "Release", " Release-Planung ")).toEqual({ kind: "save", value: "Release-Planung" });
  });
});
