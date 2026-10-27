import { type Browser, expect, type Page, test } from "@playwright/test";

/** Login über die echte Dex-Anmeldeseite (Testnutzer aus docker/dex.*.yaml). */
async function login(browser: Browser, email: string, path = "/"): Promise<Page> {
  const context = await browser.newContext();
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
  await anna.getByRole("button", { name: "Board erstellen" }).click();
  await anna.getByLabel("Name").fill(boardName);
  await anna.getByRole("button", { name: "Erstellen" }).click();
  await expect(anna.getByRole("heading", { name: boardName })).toBeVisible();
  await expect(anna.getByText("Für die Rotation werden mindestens zwei aktive Teilnehmer benötigt")).toBeVisible();
  const boardPath = new URL(anna.url()).pathname;

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
  await expect(anna.getByRole("combobox", { name: "Moderation" })).toHaveText("Ben");
  await expect(anna.getByTestId("next-protocol-hint")).toHaveText(/Ben protokolliert beim nächsten Termin/);

  // Anna beendet den Termin: Thema rückt weiter, Ben protokolliert, Anna wird gezogen
  await anna.getByRole("button", { name: "Termin beenden" }).click();
  await anna.getByRole("alertdialog").getByRole("button", { name: "Termin beenden" }).click();
  await expect(ben.getByTestId("column-2").getByText("Release-Planung")).toBeVisible();
  await expect(ben.getByText("Termin 2")).toBeVisible();
  await expect(ben.getByRole("combobox", { name: "Protokoll" })).toHaveText("Ben");
  await expect(ben.getByRole("combobox", { name: "Moderation" })).toHaveText("Anna");

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
