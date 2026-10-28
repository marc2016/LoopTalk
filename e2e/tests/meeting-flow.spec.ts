import { type Browser, expect, type Page, test } from "@playwright/test";

/** Laufende Web-Animationen auf Karten (Weiterrücken). */
const cardAnimations = (page: Page) =>
  page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((a) => (a.effect as KeyframeEffect | null)?.target instanceof HTMLElement)
        .filter((a) => ((a.effect as KeyframeEffect).target as HTMLElement).dataset.cardId !== undefined).length,
  );

async function createBoard(page: Page, name: string): Promise<string> {
  await page.getByRole("button", { name: "Board erstellen" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Erstellen" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  return new URL(page.url()).pathname;
}

async function addCard(page: Page, title: string) {
  await page.getByRole("button", { name: "Thema" }).click();
  await page.getByLabel("Titel").fill(title);
  await page.getByRole("button", { name: "Anlegen" }).click();
  await expect(page.getByTestId("column-1").getByText(title)).toBeVisible();
}

async function startAndEnd(page: Page) {
  await page.getByRole("button", { name: "Termin starten" }).click();
  await page.getByRole("button", { name: "Termin beenden" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Termin beenden" }).click();
  await expect(page.getByRole("button", { name: "Termin starten" })).toBeVisible();
}

/** Login über die echte Dex-Anmeldeseite (Testnutzer aus docker/dex.*.yaml). */
async function login(
  browser: Browser,
  email: string,
  path = "/",
  options: { reducedMotion?: "reduce" | "no-preference" } = {},
): Promise<Page> {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.goto(path);
  await page.locator('input[name="login"]').fill(email);
  await page.locator('input[name="password"]').fill("password");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/dex"));
  return page;
}

test("zwei Personen arbeiten live auf einem Board und schließen einen Termin ab", async ({ browser }) => {
  const boardName = `E2E-Board ${Date.now()}`;

  // Anna erstellt ein Board
  const anna = await login(browser, "anna@example.com");
  const boardPath = await createBoard(anna, boardName);
  await expect(anna.getByText("Für die Rotation werden mindestens zwei aktive Teilnehmer benötigt")).toBeVisible();

  // Ben öffnet den Link, landet nach dem Login auf dem Board und erscheint bei Anna als anwesend
  const ben = await login(browser, "ben@example.com", boardPath);
  await expect(ben).toHaveURL(new RegExp(`${boardPath}$`));
  await expect(ben.getByRole("heading", { name: boardName })).toBeVisible();
  await expect(anna.getByLabel("Gerade auf dem Board").getByLabel("Ben")).toBeVisible();
  await expect(anna.getByText("Für die Rotation werden mindestens zwei aktive Teilnehmer benötigt")).toBeHidden();

  // Anna legt ein Thema an, Ben sieht es live
  await anna.getByRole("button", { name: "Thema" }).click();
  await anna.getByLabel("Titel").fill("Release-Planung");
  await anna.getByRole("button", { name: "Anlegen" }).click();
  const benColumn1 = ben.getByTestId("column-1");
  await expect(benColumn1.getByText("Release-Planung")).toBeVisible();
  expect(await cardAnimations(ben)).toBe(0);
  await expect(benColumn1.getByTestId("card-life")).toHaveText("noch 3 Termine");
  await expect(ben.getByTestId("column-until")).toHaveText(["bis Termin 3", "bis Termin 2", "nur noch Termin 1"]);

  // Ben bearbeitet das fremde Thema und hängt einen Namen an
  await benColumn1.getByText("Release-Planung").click();
  await ben.getByLabel("Beschreibung (optional)").fill("Was steht für Q1 an?");
  await ben.getByRole("button", { name: "Name hinzufügen" }).click();
  await ben.getByPlaceholder("Name eingeben …").fill("Carla");
  await ben.getByRole("option", { name: "„Carla“ hinzufügen" }).click();
  await expect(ben.getByRole("region", { name: "Namen" }).getByText("Carla")).toBeVisible();
  await ben.getByRole("button", { name: "Speichern" }).click();
  const annaCard = anna.getByTestId("column-1").getByTestId("topic-card").filter({ hasText: "Release-Planung" });
  await expect(annaCard.getByText("Was steht für Q1 an?")).toBeVisible();
  await expect(annaCard.getByText("Carla")).toBeVisible();

  // Anna legt ein zweites Thema an und löscht es wieder
  await anna.getByRole("button", { name: "Thema" }).click();
  await anna.getByLabel("Titel").fill("Weg damit");
  await anna.getByRole("button", { name: "Anlegen" }).click();
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
