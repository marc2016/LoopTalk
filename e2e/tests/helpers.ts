import { type Browser, expect, type Page } from "@playwright/test";

/** Laufende Web-Animationen auf Karten (Weiterrücken). */
export const cardAnimations = (page: Page) =>
  page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((a) => (a.effect as KeyframeEffect | null)?.target instanceof HTMLElement)
        .filter((a) => ((a.effect as KeyframeEffect).target as HTMLElement).dataset.cardId !== undefined).length,
  );

export async function createBoard(page: Page, name: string): Promise<string> {
  await page.getByRole("button", { name: "Board erstellen" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Erstellen" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  return new URL(page.url()).pathname;
}

export async function addCard(page: Page, title: string) {
  await page.getByRole("button", { name: "Thema" }).click();
  await page.getByLabel("Titel").fill(title);
  await page.getByRole("button", { name: "Anlegen" }).click();
  await expect(page.getByTestId("column-1").getByText(title)).toBeVisible();
}

export async function startAndEnd(page: Page) {
  await page.getByRole("button", { name: "Termin starten" }).click();
  await page.getByRole("button", { name: "Termin beenden" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Termin beenden" }).click();
  await expect(page.getByRole("button", { name: "Termin starten" })).toBeVisible();
}

/** Login über die echte Dex-Anmeldeseite (Testnutzer aus docker/dex.*.yaml). */
export async function login(
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

/** Große Karten-Ansicht über das X schließen. */
export async function closeSheet(page: Page) {
  const sheet = page.locator("[data-card-sheet]");
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(sheet).toBeHidden();
}

/**
 * Alle Benutzer sind Teilnehmer jedes Boards. Für vorhersagbare Ziehungen nur die
 * genannten Personen aktiv lassen, alle anderen Testbenutzer inaktiv setzen.
 */
export async function onlyActive(page: Page, boardPath: string, names: string[]) {
  const api = `/api/boards/${boardPath.split("/").pop()}/participants`;
  const participants: { id: number; name: string; active: boolean }[] = await (await page.request.get(api)).json();
  for (const p of participants) {
    const active = names.includes(p.name);
    if (p.active === active) continue;
    const res = await page.request.patch(`${api}/${p.id}`, { data: { active } });
    expect(res.status()).toBe(204);
  }
}
