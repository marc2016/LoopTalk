import { expect, test } from "@playwright/test";
import { addCard, cardAnimations, closeSheet, createBoard, login, onlyActive, startAndEnd } from "./helpers";

test("zwei Personen arbeiten live auf einem Board und schließen einen Termin ab", async ({ browser }) => {
  const boardName = `E2E-Board ${Date.now()}`;

  // Anna erstellt ein Board
  const anna = await login(browser, "anna@example.com");
  const boardPath = await createBoard(anna, boardName);

  // Ben öffnet den Link, landet nach dem Login auf dem Board und erscheint bei Anna als anwesend
  const ben = await login(browser, "ben@example.com", boardPath);
  await expect(ben).toHaveURL(new RegExp(`${boardPath}$`));
  await expect(ben.getByRole("heading", { name: boardName })).toBeVisible();
  await expect(anna.getByLabel("Gerade auf dem Board").getByLabel("Ben")).toBeVisible();

  // Alle Benutzer sind Teilnehmer; nur Anna aktiv ergibt live die Warnung, mit Ben verschwindet sie
  const warning = "Für die Rotation werden mindestens zwei aktive Teilnehmer benötigt";
  await onlyActive(anna, boardPath, ["Anna"]);
  await expect(ben.getByText(warning)).toBeVisible();
  await onlyActive(anna, boardPath, ["Anna", "Ben"]);
  await expect(ben.getByText(warning)).toBeHidden();

  // Anna legt ein Thema an, Ben sieht es live
  await anna.getByRole("button", { name: "Thema" }).click();
  await anna.getByLabel("Titel").fill("Release-Planung");
  await anna.getByRole("button", { name: "Anlegen" }).click();
  const benColumn1 = ben.getByTestId("column-1");
  await expect(benColumn1.getByText("Release-Planung")).toBeVisible();
  expect(await cardAnimations(ben)).toBe(0);
  await expect(benColumn1.getByTestId("card-life")).toHaveText("noch 3 Termine");
  await expect(ben.getByTestId("column-until")).toHaveText(["bis Termin 3", "bis Termin 2", "nur noch Termin 1"]);

  // Ben öffnet das fremde Thema, hängt in der Detailansicht einen Namen an und bearbeitet es
  await benColumn1.getByText("Release-Planung").click();
  await ben.getByRole("button", { name: "Name hinzufügen" }).click();
  await ben.getByPlaceholder("Name eingeben …").fill("Carla");
  await ben.getByRole("option", { name: "„Carla“ hinzufügen" }).click();
  await expect(ben.getByRole("region", { name: "Namen" }).getByText("Carla")).toBeVisible();
  await ben.getByRole("button", { name: /^Beschreibung bearbeiten/ }).click();
  await ben.getByRole("textbox", { name: "Beschreibung" }).fill("Was steht für Q1 an?");
  await ben.keyboard.press("Control+Enter");
  await expect(ben.getByTestId("card-description")).toContainText("Was steht für Q1 an?");
  await closeSheet(ben);
  const annaCard = anna.getByTestId("column-1").getByTestId("topic-card").filter({ hasText: "Release-Planung" });
  await expect(annaCard.getByText("Was steht für Q1 an?")).toBeVisible();
  await expect(annaCard.getByText("Carla")).toBeVisible();

  // Anna legt ein zweites Thema an und löscht es direkt auf dem Zettel wieder
  await addCard(anna, "Weg damit");
  await anna.getByTestId("column-1").getByText("Weg damit").click();
  await anna.getByRole("dialog").getByRole("button", { name: "Löschen" }).click();
  await anna.getByRole("alertdialog").getByRole("button", { name: "Löschen" }).click();
  await expect(ben.getByText("Weg damit")).toBeHidden();

  // Termin starten: Ben sieht live, dass er läuft
  await anna.getByRole("button", { name: "Termin starten" }).click();
  await expect(ben.getByText(/Läuft seit/)).toBeVisible();
  await expect(anna.getByTestId("next-protocol-hint")).toHaveText(/Anna protokolliert beim nächsten Termin/);

  // Ben übernimmt manuell die Moderation
  await ben.getByRole("combobox", { name: "Moderation" }).click();
  await ben.getByRole("option", { name: "Ben", exact: true }).click();
  await expect(anna.getByRole("combobox", { name: "Moderation" })).toContainText("Ben");
  await expect(anna.getByTestId("next-protocol-hint")).toHaveText(/Ben protokolliert beim nächsten Termin/);

  // Anna beendet den Termin: Thema rückt weiter, Ben protokolliert, Anna wird gezogen
  // Andeutung beim Darüberfahren: Karte rutscht ein Stück Richtung nächste Spalte
  await anna.getByRole("button", { name: "Termin beenden" }).hover();
  await expect(annaCard).toHaveAttribute("data-preview", "advance");
  await expect
    .poll(() => annaCard.evaluate((el) => getComputedStyle(el).translate))
    .not.toBe("none");
  await anna.mouse.move(0, 0);
  await expect(anna.locator("[data-preview]")).toHaveCount(0);

  // Vorschau: nur bei Anna, das Board bleibt sichtbar, Abbrechen ändert nichts
  await anna.getByRole("button", { name: "Termin beenden" }).click();
  const confirm = anna.getByRole("alertdialog");
  await expect(confirm).toContainText("1 Thema rückt weiter, 0 werden archiviert");
  await expect(confirm).toContainText("Ben protokolliert beim nächsten Termin");
  await expect(annaCard).toHaveAttribute("data-preview", "advance");
  await expect(annaCard).toContainText("Zweite Runde");
  await expect(ben.locator("[data-preview]")).toHaveCount(0);
  await confirm.getByRole("button", { name: "Abbrechen" }).click();
  await expect(anna.locator("[data-preview]")).toHaveCount(0);
  await expect(anna.getByText(/Läuft seit/)).toBeVisible();

  // Beenden: bei Ben gleitet die Karte in die nächste Spalte
  await anna.getByRole("button", { name: "Termin beenden" }).click();
  const benSaw = ben.waitForFunction(
    () => document.getAnimations().some((a) => ((a.effect as KeyframeEffect | null)?.target as HTMLElement | null)?.dataset?.cardId),
    undefined,
    { polling: "raf", timeout: 10_000 },
  );
  await confirm.getByRole("button", { name: "Termin beenden" }).click();
  await benSaw;
  await expect(ben.getByTestId("column-2").getByText("Release-Planung")).toBeVisible();
  await expect(ben.getByText("Termin 2", { exact: true })).toBeVisible();
  await expect(ben.getByTestId("column-until")).toHaveText(["bis Termin 4", "bis Termin 3", "nur noch Termin 2"]);
  await expect(ben.getByTestId("column-2").getByTestId("card-life")).toHaveText("noch 2 Termine");
  await expect(ben.getByRole("combobox", { name: "Protokoll" })).toContainText("Ben");
  await expect(ben.getByRole("combobox", { name: "Moderation" })).toContainText("Anna");

  // Historie und Audit-Log zeigen, wer was gemacht hat
  await ben.getByRole("link", { name: "Historie" }).click();
  await expect(ben.getByRole("row").filter({ hasText: "Release-Planung" })).toContainText("Ben");

  await ben.getByRole("link", { name: "Audit-Log" }).click();
  const entries = ben.getByTestId("audit-entry");
  await expect(entries.filter({ hasText: "Anna hat das Thema „Weg damit“ gelöscht" })).toHaveCount(1);
  await expect(entries.filter({ hasText: "Ben hat „Carla“ zum Thema „Release-Planung“ hinzugefügt" })).toHaveCount(1);
  await expect(entries.filter({ hasText: "Moderation: Anna → Ben" })).toHaveCount(1);
  await expect(entries.filter({ hasText: "Anna hat Termin 1 beendet" })).toHaveCount(1);
});

test("letzte Runde: Vorschau „wird archiviert“, reduzierte Bewegung zeigt einen Hinweis", async ({ browser }) => {
  const anna = await login(browser, "anna@example.com");
  const boardPath = await createBoard(anna, `E2E-Archiv ${Date.now()}`);
  const ben = await login(browser, "ben@example.com", boardPath, { reducedMotion: "reduce" });
  await expect(ben.getByRole("heading", { level: 1 })).toBeVisible();

  await addCard(anna, "Budget 2027");
  await startAndEnd(anna);
  // Ben sieht keine Bewegung, sondern einen Hinweis
  await expect(ben.getByText("Termin 1 beendet – die Themen sind weitergerückt.")).toBeVisible();
  expect(await cardAnimations(ben)).toBe(0);
  await startAndEnd(anna);

  const card = anna.getByTestId("column-3").getByTestId("topic-card");
  await expect(card.getByTestId("card-life")).toHaveText("letzte Chance");

  await anna.getByRole("button", { name: "Termin starten" }).click();
  await anna.getByRole("button", { name: "Termin beenden" }).click();
  await expect(anna.getByRole("alertdialog")).toContainText("0 Themen rücken weiter, 1 wird archiviert");
  await expect(card).toHaveAttribute("data-preview", "archive");
  await expect(card).toContainText("wird archiviert");

  // Ben beendet, während Annas Bestätigung offen ist: Annas Leiste schließt sich von selbst
  await ben.getByRole("button", { name: "Termin beenden" }).click();
  await ben.getByRole("alertdialog").getByRole("button", { name: "Termin beenden" }).click();
  await expect(anna.getByRole("alertdialog")).toBeHidden();
  await expect(anna.locator("[data-preview]")).toHaveCount(0);

  await expect(ben.getByText("Budget 2027")).toBeHidden();
  await expect(anna.getByText("Budget 2027")).toBeHidden();
});
