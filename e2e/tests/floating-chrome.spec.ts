import { expect, type Page, test } from "@playwright/test";
import { addCard, createBoard, login } from "./helpers";

const bar = (page: Page) => page.getByTestId("glass-bar");
const dock = (page: Page) => page.getByTestId("meeting-dock");
const wall = (page: Page) => page.getByTestId("board-wall");
const scrollY = (page: Page) => page.evaluate(() => window.scrollY);

test("Glasleiste und randlose Wand: ein Kopf, Wand bis zum Rand, Leiste bleibt oben, Zettel frei vom Dock", async ({
  browser,
}) => {
  const anna = await login(browser, "anna@example.com");
  const name = `E2E-Glas ${Date.now()}`;
  const path = await createBoard(anna, name);

  // Genau eine Leiste mit allem, was man braucht
  await expect(bar(anna)).toHaveCount(1);
  await expect(bar(anna).getByRole("heading", { level: 1, name })).toBeVisible();
  const nav = bar(anna).getByRole("navigation", { name: "Board-Ansichten" });
  await expect(nav.getByRole("link")).toHaveCount(4);
  for (const label of ["Board", "Historie", "Audit-Log", "Teilnehmer"]) {
    await expect(nav.getByRole("link", { name: label })).toBeVisible();
  }
  await expect(bar(anna).getByRole("button", { name: "Link kopieren" })).toBeVisible();
  await expect(bar(anna).getByLabel("Gerade auf dem Board")).toBeVisible();
  await expect(bar(anna).getByRole("link", { name: "Abmelden" })).toBeVisible();
  await expect(anna.getByRole("heading", { level: 1 })).toHaveCount(1);

  // Wand reicht bis an die Fensterränder und beginnt direkt unter der Leiste
  const viewport = anna.viewportSize()!;
  const wallBox = (await wall(anna).boundingBox())!;
  const barBox = (await bar(anna).boundingBox())!;
  expect(wallBox.x).toBe(0);
  expect(wallBox.width).toBe(viewport.width);
  expect(Math.round(wallBox.y)).toBe(Math.round(barBox.y + barBox.height));
  expect(wallBox.y + wallBox.height).toBeGreaterThanOrEqual(viewport.height);

  // Zwölf Zettel: Leiste bleibt nach dem Scrollen oben, der letzte Zettel liegt oberhalb des Docks
  for (let i = 1; i <= 12; i++) await addCard(anna, `Eintrag ${i}`);
  // Wheel-Events laufen asynchron: auf den Scroll-Zustand warten, nicht auf eine feste Zeit.
  await anna.mouse.wheel(0, 10_000);
  await expect.poll(() => scrollY(anna)).toBeGreaterThan(0);
  const barAfter = (await bar(anna).boundingBox())!;
  expect(barAfter.y).toBe(0);
  const lastCard = anna.getByTestId("topic-card").filter({ hasText: "Eintrag 12" });
  await lastCard.scrollIntoViewIfNeeded();
  const cardBox = (await lastCard.boundingBox())!;
  const dockBox = (await dock(anna).boundingBox())!;
  expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(dockBox.y);

  // Per Tab fokussierter Zettel wird vollständig sichtbar gescrollt
  await anna.mouse.wheel(0, -10_000);
  await expect.poll(() => scrollY(anna)).toBe(0);
  await lastCard.focus();
  const focused = (await lastCard.boundingBox())!;
  expect(focused.y).toBeGreaterThanOrEqual(barBox.height);
  expect(focused.y + focused.height).toBeLessThanOrEqual((await dock(anna).boundingBox())!.y);

  // Historie: dieselbe Leiste, aber keine Wand; Startseite ohne Bereiche
  await bar(anna).getByRole("link", { name: "Historie" }).click();
  await expect(bar(anna).getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(wall(anna)).toHaveCount(0);
  await expect(dock(anna)).toHaveCount(0);
  await anna.goto("/");
  await expect(bar(anna)).toHaveCount(1);
  await expect(bar(anna).getByRole("navigation")).toHaveCount(0);
  await expect(bar(anna).getByRole("link", { name: "Abmelden" })).toBeVisible();
  void path;
});

test("Termin-Dock: unten mittig, Bestätigung klappt im Dock auf, Fokus-Toast darüber, Handy-Ansicht", async ({
  browser,
}) => {
  const anna = await login(browser, "anna@example.com");
  const path = await createBoard(anna, `E2E-Dock ${Date.now()}`);
  const ben = await login(browser, "ben@example.com", path);
  await expect(ben.getByRole("heading", { level: 1 })).toBeVisible();
  await addCard(anna, "Budget");

  // Dock unten mittig, schmaler als die Seite, mit Termin-Nummer und Hauptknopf
  const viewport = anna.viewportSize()!;
  const dockBox = (await dock(anna).boundingBox())!;
  expect(dockBox.width).toBeLessThan(viewport.width);
  expect(Math.abs(dockBox.x + dockBox.width / 2 - viewport.width / 2)).toBeLessThan(2);
  expect(dockBox.y + dockBox.height).toBeLessThanOrEqual(viewport.height);
  expect(dockBox.y + dockBox.height).toBeGreaterThan(viewport.height - 40);
  await expect(dock(anna)).toContainText("Termin 1");
  await expect(dock(anna).getByRole("button", { name: "Termin starten" })).toBeVisible();

  // Bestätigung klappt im Dock auf, Vorschau auf dem Board, Escape klappt sie zu
  await dock(anna).getByRole("button", { name: "Termin starten" }).click();
  await expect(dock(anna).getByTestId("meeting-duration")).toBeVisible();
  await dock(anna).getByRole("button", { name: "Termin beenden" }).click();
  const confirm = dock(anna).getByRole("alertdialog");
  await expect(confirm).toContainText("Termin 1 beenden?");
  await expect(wall(anna)).toHaveAttribute("data-previewing", "true");
  await anna.keyboard.press("Escape");
  await expect(confirm).toHaveCount(0);
  await expect(wall(anna)).not.toHaveAttribute("data-previewing", "true");

  // Fokus-Toast erscheint bei Ben über dem Dock, nachdem er die Fokusansicht schließt
  await anna.getByTestId("topic-card").filter({ hasText: "Budget" }).click();
  await anna.locator("[data-card-sheet]").getByRole("button", { name: "Allen zeigen" }).click();
  await expect(ben.locator('[data-card-sheet="focus"]')).toBeVisible();
  await ben.locator("[data-card-sheet]").getByRole("button", { name: "Close" }).click();
  const toast = ben.getByTestId("focus-bar");
  await expect(toast).toContainText("Anna zeigt: Budget");
  const toastBox = (await toast.boundingBox())!;
  const benDock = (await dock(ben).boundingBox())!;
  expect(toastBox.y + toastBox.height).toBeLessThanOrEqual(benDock.y);
  await ben.getByRole("button", { name: "Fokus beenden" }).click();
  await expect(toast).toHaveCount(0);

  // Handy: Dock zeigt nur Termin, Dauer und Hauptknopf; „Rollen anzeigen“ blendet die Rollen ein
  const phone = await browser.newContext({ viewport: { width: 400, height: 800 } });
  const page = await phone.newPage();
  await page.goto(path);
  await page.locator('input[name="login"]').fill("carla@example.com");
  await page.locator('input[name="password"]').fill("password");
  await page.locator('button[type="submit"]').click();
  await expect(dock(page)).toContainText("Termin 1");
  await expect(dock(page).getByTestId("meeting-duration")).toBeVisible();
  await expect(dock(page).getByRole("button", { name: "Termin beenden" })).toBeVisible();
  await expect(dock(page).getByRole("combobox", { name: "Moderation" })).toBeHidden();
  await dock(page).getByRole("button", { name: "Rollen anzeigen" }).click();
  await expect(dock(page).getByRole("combobox", { name: "Moderation" })).toBeVisible();
  await expect(dock(page).getByRole("combobox", { name: "Protokoll" })).toBeVisible();
  const phoneDock = (await dock(page).boundingBox())!;
  expect(phoneDock.y + phoneDock.height).toBeLessThanOrEqual(800);
  await phone.close();
});
