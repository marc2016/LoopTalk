import { expect, type Page, test } from "@playwright/test";
import { addCard, closeSheet, createBoard, login, startAndEnd } from "./helpers";

const sheet = (page: Page) => page.locator("[data-card-sheet]");
const focusSheet = (page: Page) => page.locator('[data-card-sheet="focus"]');
const openCard = (page: Page, title: string) => page.getByTestId("topic-card").filter({ hasText: title }).click();
const editTitle = (page: Page) => sheet(page).getByRole("button", { name: /^Titel bearbeiten/ });
const editDescription = (page: Page) => sheet(page).getByRole("button", { name: /^Beschreibung bearbeiten/ });
const titleBox = (page: Page) => sheet(page).getByRole("textbox", { name: "Titel" });
const descriptionBox = (page: Page) => sheet(page).getByRole("textbox", { name: "Beschreibung" });

async function showToAll(page: Page, title: string) {
  await openCard(page, title);
  await sheet(page).getByRole("button", { name: "Allen zeigen" }).click();
  await expect(focusSheet(page)).toBeVisible();
}

test("Detailansicht: direkt auf dem Zettel bearbeiten, verwerfen, Konflikt am Feld, löschen", async ({ browser }) => {
  const anna = await login(browser, "anna@example.com");
  const path = await createBoard(anna, `E2E-Detail ${Date.now()}`);
  const ben = await login(browser, "ben@example.com", path);
  await expect(ben.getByRole("heading", { level: 1 })).toBeVisible();
  await addCard(anna, "Release");

  // Groß öffnen (wächst aus der Karte), ohne offene Eingabefelder, ohne „Bearbeiten“, mit „Löschen“; nur bei Anna
  const grows = anna.waitForFunction(
    () => document.querySelector("[data-card-sheet]")?.getAnimations().length,
    undefined,
    { polling: "raf", timeout: 5_000 },
  );
  await openCard(anna, "Release");
  await grows;
  await expect(sheet(anna).getByRole("heading", { name: "Release" })).toBeVisible();
  await expect(sheet(anna).getByRole("textbox")).toHaveCount(0);
  await expect(sheet(anna).getByRole("button", { name: "Bearbeiten", exact: true })).toHaveCount(0);
  await expect(sheet(anna).getByRole("button", { name: "Löschen" })).toBeVisible();
  await expect(sheet(ben)).toHaveCount(0);

  // Ben ergänzt die Beschreibung; Verlassen des Felds speichert, Anna sieht es live
  await openCard(ben, "Release");
  await editDescription(ben).click();
  await descriptionBox(ben).fill("Erste Fassung");
  await ben.keyboard.press("Tab");
  await expect(descriptionBox(ben)).toHaveCount(0);
  await expect(sheet(anna).getByTestId("card-description")).toContainText("Erste Fassung");

  // Escape verwirft nur die Eingabe, der Zettel bleibt offen
  await editTitle(anna).click();
  await titleBox(anna).fill("Verworfen");
  await anna.keyboard.press("Escape");
  await expect(sheet(anna)).toBeVisible();
  await expect(titleBox(anna)).toHaveCount(0);
  await expect(sheet(anna).getByRole("heading", { name: "Release" })).toBeVisible();

  // Leerer Titel wird nicht gespeichert, das Feld zeigt den Fehler
  await editTitle(anna).click();
  await titleBox(anna).fill("");
  await anna.keyboard.press("Enter");
  await expect(sheet(anna).getByText("Bitte einen Titel angeben.")).toBeVisible();
  await expect(titleBox(anna)).toBeVisible();
  await anna.keyboard.press("Escape");

  // Gleichzeitig am Titel: Anna bekommt am Titel einen Hinweis, ihre Eingabe bleibt;
  // die Beschreibung, die Ben ebenfalls ändert, aktualisiert sich bei ihr trotzdem live
  await editTitle(anna).click();
  await titleBox(anna).fill("Release-Planung");
  await editTitle(ben).click();
  await titleBox(ben).fill("Release 2027");
  await ben.keyboard.press("Enter");
  await editDescription(ben).click();
  await descriptionBox(ben).fill("Zweite Fassung");
  await ben.keyboard.press("Tab");
  await expect(anna.getByTestId("edit-conflict")).toContainText("Ben hat dieses Thema gerade geändert.");
  await expect(titleBox(anna)).toHaveValue("Release-Planung");
  await expect(sheet(anna).getByTestId("card-description")).toContainText("Zweite Fassung");

  // Neuen Stand übernehmen, dann doch die eigene Fassung speichern
  await anna.getByRole("button", { name: "Neuen Stand übernehmen" }).click();
  await expect(titleBox(anna)).toHaveValue("Release 2027");
  await expect(anna.getByTestId("edit-conflict")).toHaveCount(0);
  await titleBox(anna).fill("Release-Planung");
  await anna.keyboard.press("Enter");
  await expect(sheet(ben).getByRole("heading", { name: "Release-Planung" })).toBeVisible();

  // Schließen mit offener Eingabe speichert sie
  await editDescription(anna).click();
  await descriptionBox(anna).fill("Beim Schließen gespeichert");
  await closeSheet(anna);
  await expect(sheet(ben).getByTestId("card-description")).toContainText("Beim Schließen gespeichert");

  // Löschen direkt auf dem Zettel, mit Bestätigung; Bens Ansicht schließt sich
  await openCard(anna, "Release-Planung");
  await sheet(anna).getByRole("button", { name: "Löschen" }).click();
  await anna.getByRole("alertdialog").getByRole("button", { name: "Löschen" }).click();
  await expect(sheet(anna)).toBeHidden();
  await expect(sheet(ben)).toBeHidden();
  await expect(ben.getByTestId("topic-card").filter({ hasText: "Release-Planung" })).toHaveCount(0);
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

  // Im Fokus bearbeiten alle: Ben ergänzt die Beschreibung und färbt den Zettel grün
  await editDescription(ben).click();
  await descriptionBox(ben).fill("Kosten für Q1");
  await ben.keyboard.press("Tab");
  await expect(focusSheet(anna).getByTestId("card-description")).toContainText("Kosten für Q1");
  await focusSheet(ben).getByRole("radio", { name: "Grün" }).check({ force: true });
  await expect(focusSheet(anna)).toHaveAttribute("data-color", "green");
  await expect(focusSheet(ben)).toHaveAttribute("data-color", "green");

  // Fokuswechsel während Bens Eingabe: Sie wird gespeichert, Ben folgt dem Fokus
  await editDescription(ben).click();
  await descriptionBox(ben).fill("Kosten für Q1 und Q2");
  await closeSheet(anna);
  await showToAll(anna, "Release-Planung");
  await expect(focusSheet(ben).getByRole("heading", { name: "Release-Planung" })).toBeVisible();
  await expect(ben.getByTestId("topic-card").filter({ hasText: "Budget" })).toContainText("Kosten für Q1 und Q2");

  // Ohne laufende Eingabe übernimmt der Fokus die eigene Ansicht
  await closeSheet(ben);
  await openCard(ben, "Budget");
  await closeSheet(anna);
  await showToAll(anna, "Budget");
  await expect(focusSheet(ben).getByRole("heading", { name: "Budget" })).toBeVisible();

  // Ben schreibt gerade in seiner eigenen Ansicht: keine Unterbrechung, nur die Leiste;
  // sobald er das Feld verlässt, öffnet sich der Fokus
  await closeSheet(ben);
  await openCard(ben, "Release-Planung");
  await editTitle(ben).click();
  await closeSheet(anna);
  await showToAll(anna, "Release-Planung");
  await expect(titleBox(ben)).toBeVisible();
  await expect(ben.getByTestId("focus-bar")).toContainText("Anna zeigt: Release-Planung");
  await ben.keyboard.press("Escape");
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
