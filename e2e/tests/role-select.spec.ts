import { expect, test } from "@playwright/test";
import { createBoard, login, onlyActive } from "./helpers";

test("Rollen-Auswahl: suchen, gesperrte Rolle, kein Treffer, Protokoll leeren – live bei allen", async ({ browser }) => {
  // Carla muss LoopTalk kennen, damit sie zur Auswahl steht
  const carla = await login(browser, "carla@example.com");
  await carla.context().close();

  const anna = await login(browser, "anna@example.com");
  const path = await createBoard(anna, `E2E-Rollen ${Date.now()}`);
  const ben = await login(browser, "ben@example.com", path);
  await onlyActive(anna, path, ["Anna", "Ben", "Carla"]);
  const moderation = (page = anna) => page.getByRole("combobox", { name: "Moderation" });
  const protocol = (page = anna) => page.getByRole("combobox", { name: "Protokoll" });

  // Suche trifft auch mitten im Namen, Enter wählt, die Auswahl schließt
  await moderation().click();
  await expect(anna.getByPlaceholder("Person suchen …")).toBeFocused();
  await anna.keyboard.type("arl");
  await expect(anna.getByRole("option")).toHaveCount(1);
  await anna.keyboard.press("Enter");
  await expect(anna.getByRole("listbox")).toBeHidden();
  await expect(moderation(ben)).toContainText("Carla");

  // Protokoll: Carla moderiert und ist gesperrt; ohne Treffer bleibt alles, wie es ist
  await protocol().click();
  await expect(anna.getByRole("option", { name: /Carla/ })).toHaveAttribute("aria-disabled", "true");
  await expect(anna.getByRole("option", { name: /Carla/ })).toContainText("Moderation");
  await anna.keyboard.type("niemand-heißt-so");
  await expect(anna.getByText("Niemand gefunden")).toBeVisible();
  await anna.keyboard.press("Escape");
  await expect(anna.getByRole("listbox")).toBeHidden();
  await expect(protocol(ben)).toContainText("nicht festgelegt");

  // Ben eintragen und wieder auf „nicht festgelegt“ setzen
  await protocol().click();
  await anna.getByRole("option", { name: "Ben", exact: true }).click();
  await expect(protocol(ben)).toContainText("Ben");
  await protocol().click();
  await anna.getByRole("option", { name: "nicht festgelegt" }).click();
  await expect(protocol(ben)).toContainText("nicht festgelegt");
});
