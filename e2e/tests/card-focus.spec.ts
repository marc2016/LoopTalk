import { expect, type Page, test } from "@playwright/test";
import { addCard, closeSheet, createBoard, login, startAndEnd } from "./helpers";

const sheet = (page: Page) => page.locator("[data-card-sheet]");
const focusSheet = (page: Page) => page.locator('[data-card-sheet="focus"]');
const openCard = (page: Page, title: string) => page.getByTestId("topic-card").filter({ hasText: title }).click();

async function showToAll(page: Page, title: string) {
  await openCard(page, title);
  await sheet(page).getByRole("button", { name: "Allen zeigen" }).click();
  await expect(focusSheet(page)).toBeVisible();
}

test("Detailansicht: lesen, bearbeiten, abbrechen, Hinweis bei gleichzeitigem Bearbeiten", async ({ browser }) => {
  const anna = await login(browser, "anna@example.com");
  const path = await createBoard(anna, `E2E-Detail ${Date.now()}`);
  const ben = await login(browser, "ben@example.com", path);
  await expect(ben.getByRole("heading", { level: 1 })).toBeVisible();
  await addCard(anna, "Release");

  // Groß öffnen (wächst aus der Karte), ohne Eingabefelder, mit „Bearbeiten“, ohne „Löschen“; nur bei Anna
  const grows = anna.waitForFunction(
    () => document.querySelector("[data-card-sheet]")?.getAnimations().length,
    undefined,
    { polling: "raf", timeout: 5_000 },
  );
  await openCard(anna, "Release");
  await grows;
  await expect(sheet(anna).getByRole("heading", { name: "Release" })).toBeVisible();
  await expect(sheet(anna).getByRole("textbox")).toHaveCount(0);
  await expect(sheet(anna).getByRole("button", { name: "Bearbeiten" })).toBeVisible();
  await expect(sheet(anna).getByRole("button", { name: "Löschen" })).toHaveCount(0);
  await expect(sheet(ben)).toHaveCount(0);

  // Änderung durch Ben erscheint live in Annas Detailansicht
  await openCard(ben, "Release");
  await sheet(ben).getByRole("button", { name: "Bearbeiten" }).click();
  await ben.getByLabel("Beschreibung (optional)").fill("Erste Fassung");
  await ben.getByRole("button", { name: "Speichern" }).click();
  await expect(sheet(anna).getByTestId("card-description")).toHaveText("Erste Fassung");

  // Abbrechen verwirft, Löschen nur im Bearbeiten-Modus
  await sheet(anna).getByRole("button", { name: "Bearbeiten" }).click();
  await expect(sheet(anna).getByRole("button", { name: "Löschen" })).toBeVisible();
  await anna.getByLabel("Titel").fill("Verworfen");
  await sheet(anna).getByRole("button", { name: "Abbrechen" }).click();
  await expect(sheet(anna).getByRole("heading", { name: "Release" })).toBeVisible();

  // Gleichzeitig bearbeiten: Anna bekommt einen Hinweis, ihre Eingabe bleibt
  await sheet(anna).getByRole("button", { name: "Bearbeiten" }).click();
  await anna.getByLabel("Titel").fill("Release-Planung");
  await sheet(ben).getByRole("button", { name: "Bearbeiten" }).click();
  await ben.getByLabel("Beschreibung (optional)").fill("Zweite Fassung");
  await ben.getByRole("button", { name: "Speichern" }).click();
  await expect(anna.getByTestId("edit-conflict")).toContainText("Ben hat dieses Thema gerade geändert.");
  await expect(anna.getByLabel("Titel")).toHaveValue("Release-Planung");
  await anna.getByRole("button", { name: "Speichern" }).click();
  await expect(sheet(anna).getByRole("heading", { name: "Release-Planung" })).toBeVisible();
});

test("Gemeinsamer Fokus: zeigen, lokal schließen, wechseln, nicht unterbrechen, später dazukommen, beenden", async ({
  browser,
}) => {
  const anna = await login(browser, "anna@example.com");
  const path = await createBoard(anna, `E2E-Fokus ${Date.now()}`);
  const ben = await login(browser, "ben@example.com", path);
  await expect(ben.getByRole("heading", { level: 1 })).toBeVisible();
  await addCard(anna, "Release-Planung");
  await addCard(anna, "Budget");

  // Ohne laufenden Termin gibt es kein „Allen zeigen“
  await openCard(anna, "Budget");
  await expect(sheet(anna).getByRole("button", { name: "Allen zeigen" })).toHaveCount(0);
  await closeSheet(anna);

  await anna.getByRole("button", { name: "Termin starten" }).click();
  await showToAll(anna, "Release-Planung");
  await expect(focusSheet(ben)).toBeVisible();
  await expect(focusSheet(ben).getByTestId("focus-by")).toHaveText(/Anna zeigt$/);
  await expect(focusSheet(ben).getByRole("heading", { name: "Release-Planung" })).toBeVisible();

  // Ben schließt nur für sich und sieht die Leiste
  await closeSheet(ben);
  await expect(focusSheet(anna)).toBeVisible();
  await expect(ben.getByTestId("focus-bar")).toContainText("Anna zeigt: Release-Planung");
  await ben.getByRole("button", { name: "Zurück zum Fokus" }).click();
  await expect(focusSheet(ben)).toBeVisible();

  // Anderes Thema: wechselt bei allen
  await closeSheet(anna);
  await showToAll(anna, "Budget");
  await expect(focusSheet(ben).getByRole("heading", { name: "Budget" })).toBeVisible();

  // Ben bearbeitet gerade: keine Unterbrechung, nur Hinweis; danach öffnet sich der Fokus
  await closeSheet(ben);
  await openCard(ben, "Release-Planung");
  await sheet(ben).getByRole("button", { name: "Bearbeiten" }).click();
  await closeSheet(anna);
  await showToAll(anna, "Release-Planung");
  await expect(ben.getByLabel("Titel")).toBeVisible();
  await expect(ben.getByTestId("focus-waiting")).toContainText("Anna zeigt gerade dieses Thema („Release-Planung“) allen.");
  await sheet(ben).getByRole("button", { name: "Abbrechen" }).click();
  await expect(focusSheet(ben).getByRole("heading", { name: "Release-Planung" })).toBeVisible();

  // Später dazukommen: Carla sieht den Fokus sofort
  const carla = await login(browser, "carla@example.com", path);
  await expect(focusSheet(carla).getByTestId("focus-by")).toHaveText(/Anna zeigt$/);

  // Anderer Dialog offen (Board umbenennen): keine Unterbrechung, danach öffnet sich der Fokus
  await closeSheet(ben);
  await ben.getByRole("button", { name: "Board umbenennen" }).click();
  await closeSheet(anna);
  await showToAll(anna, "Budget");
  await expect(ben.getByRole("dialog", { name: "Board umbenennen" })).toBeVisible();
  await expect(focusSheet(ben)).toHaveCount(0);
  await ben.keyboard.press("Escape");
  await expect(focusSheet(ben).getByRole("heading", { name: "Budget" })).toBeVisible();

  // Fokus beenden schließt bei allen
  await focusSheet(anna).getByRole("button", { name: "Fokus beenden" }).click();
  await expect(focusSheet(ben)).toBeHidden();
  await expect(focusSheet(carla)).toBeHidden();
  await expect(ben.getByTestId("focus-bar")).toBeHidden();
});

test("Besprochen: durch Zeigen und per Schalter, Warnung beim Beenden, Historie", async ({ browser }) => {
  const anna = await login(browser, "anna@example.com");
  const path = await createBoard(anna, `E2E-Besprochen ${Date.now()}`);
  const ben = await login(browser, "ben@example.com", path);
  await expect(ben.getByRole("heading", { level: 1 })).toBeVisible();
  await addCard(anna, "Hiring");
  await addCard(anna, "Budget");
  await startAndEnd(anna);
  await startAndEnd(anna);

  // Termin 3: beide Themen in der letzten Runde
  await anna.getByRole("button", { name: "Termin starten" }).click();
  await showToAll(anna, "Budget");
  await focusSheet(anna).getByRole("button", { name: "Fokus beenden" }).click();
  const benBudget = ben.getByTestId("topic-card").filter({ hasText: "Budget" });
  await expect(benBudget.getByTestId("card-discussed")).toHaveText("heute besprochen");

  // Schalter: Hiring an und wieder aus
  await openCard(ben, "Hiring");
  const toggle = sheet(ben).getByRole("switch", { name: "Besprochen" });
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(anna.getByTestId("topic-card").filter({ hasText: "Hiring" }).getByTestId("card-discussed")).toBeVisible();
  await toggle.click();
  await expect(toggle).not.toBeChecked();
  await expect(anna.getByTestId("topic-card").filter({ hasText: "Hiring" }).getByTestId("card-discussed")).toHaveCount(0);
  await closeSheet(ben);

  // Warnung nennt das nicht besprochene Thema der letzten Runde, Beenden bleibt möglich
  await anna.getByRole("button", { name: "Termin beenden" }).click();
  await expect(anna.getByTestId("end-not-discussed")).toHaveText("Nicht besprochen und wird archiviert: Hiring");
  await anna.getByRole("alertdialog").getByRole("button", { name: "Termin beenden" }).click();
  await expect(anna.getByRole("button", { name: "Termin starten" })).toBeVisible();

  // Historie: Termin 3 kennzeichnet besprochen und nicht besprochen
  await anna.getByRole("link", { name: "Historie" }).click();
  const meeting3 = anna.getByRole("row").filter({ hasText: "Budget" }).first();
  await expect(meeting3.locator('[data-discussed="true"]')).toContainText("Budget");
  await expect(meeting3.locator('[data-discussed="false"]')).toContainText("Hiring");
});
