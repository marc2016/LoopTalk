import { expect, type Page, test } from "@playwright/test";
import { addCard, createBoard, login, onlyActive, startAndEnd } from "./helpers";

const wall = (page: Page) => page.getByTestId("board-wall");

test("Wand: eine Fläche mit Etiketten, Geister-Zettel und Ablage; Zettel fällt ins Archiv", async ({ browser }) => {
  const anna = await login(browser, "anna@example.com");
  const path = await createBoard(anna, `E2E-Wand ${Date.now()}`);
  const ben = await login(browser, "ben@example.com", path);
  await expect(ben.getByRole("heading", { level: 1 })).toBeVisible();

  // Papier als Standard; die Spalten haben keine eigene Fläche, nur Trennlinien, keine Pfeile
  await expect(wall(anna)).toHaveAttribute("data-wall", "paper");
  await expect(wall(anna).locator("svg.lucide-chevron-right")).toHaveCount(0);
  const styles = await anna
    .getByTestId(/^column-[123]$/)
    .evaluateAll((els) => els.map((el) => [getComputedStyle(el).backgroundColor, getComputedStyle(el).borderLeftWidth]));
  expect(styles.map((s) => s[0])).toEqual(["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"]);
  expect(styles.map((s) => s[1] !== "0px")).toEqual([false, true, true]);

  // Etiketten mit Badge, Geister-Zettel in jeder leeren Spalte, Ablage nur hinter der letzten Runde
  await expect(anna.getByTestId("column-count")).toHaveText(["0", "0", "0"]);
  await expect(anna.getByTestId("column-1").getByTestId("note-ghost")).toHaveText("Noch keine neuen Themen.");
  await expect(anna.getByTestId("column-2").getByTestId("note-ghost")).toHaveText("Keine Themen in dieser Runde.");
  await expect(anna.getByTestId("archive-tray")).toHaveCount(1);
  await expect(anna.getByTestId("column-3").getByTestId("archive-tray")).toContainText("Archiv");
  await expect(anna.getByTestId("column-3").locator(".wall-glow")).toHaveCount(1);
  await expect(anna.getByTestId("column-1").locator(".wall-glow")).toHaveCount(0);

  // Erstes Thema: Geister-Zettel verschwindet, Badge zählt bei Ben live hoch
  await addCard(anna, "Budget");
  await expect(anna.getByTestId("column-1").getByTestId("note-ghost")).toHaveCount(0);
  await expect(ben.getByTestId("column-1").getByTestId("column-count")).toHaveText("1");

  // Zettel in die letzte Runde bringen
  await onlyActive(anna, path, ["Anna", "Ben"]);
  await startAndEnd(anna);
  await startAndEnd(anna);
  const card = anna.getByTestId("column-3").getByTestId("topic-card");
  await expect(card).toHaveCount(1);
  const cardBox = (await card.boundingBox())!;
  const trayBox = (await anna.getByTestId("archive-tray").boundingBox())!;

  // Vorschau: Schein pulsiert (Wand ist als „previewing“ markiert)
  await anna.getByRole("button", { name: "Termin starten" }).click();
  await anna.getByRole("button", { name: "Termin beenden" }).click();
  await expect(wall(anna)).toHaveAttribute("data-previewing", "true");

  // Beenden: Der Klon des Zettels fällt in die Mitte der Ablage
  const fall = anna.waitForFunction(
    () => {
      const falling = document
        .getAnimations()
        .filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition))
        .map((a) => a.effect as KeyframeEffect)
        .find((e) => (e.target as HTMLElement | null)?.closest("body > div[aria-hidden]") !== null);
      if (!falling) return null;
      return falling.getKeyframes().at(-1)?.transform ?? null;
    },
    undefined,
    { polling: "raf", timeout: 5_000 },
  );
  await anna.getByRole("alertdialog").getByRole("button", { name: "Termin beenden" }).click();
  const transform = String(await (await fall).jsonValue());
  const [dx, dy] = transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/)!.slice(1).map(Number);
  expect(dx).toBeCloseTo(trayBox.x + trayBox.width / 2 - (cardBox.x + cardBox.width / 2), -1);
  expect(dy).toBeCloseTo(trayBox.y + trayBox.height / 2 - (cardBox.y + cardBox.height / 2), -1);
  await expect(anna.getByRole("button", { name: "Termin starten" })).toBeVisible();
  await expect(anna.getByTestId("column-3").getByTestId("note-ghost")).toBeVisible();
});

test("Wand umschalten: live bei allen, im Audit-Log, gleiche Wand ohne Eintrag, Name und Wand zugleich", async ({
  browser,
}) => {
  const anna = await login(browser, "anna@example.com");
  const path = await createBoard(anna, `E2E-Wandwahl ${Date.now()}`);
  const ben = await login(browser, "ben@example.com", path);
  await expect(ben.getByRole("heading", { level: 1 })).toBeVisible();

  const openDialog = async () => {
    await ben.getByRole("button", { name: "Board bearbeiten" }).click();
    const dialog = ben.getByRole("dialog", { name: "Board bearbeiten" });
    await expect(dialog).toBeVisible();
    return dialog;
  };

  // Ben stellt auf Kork: Anna sieht es ohne Neuladen
  let dialog = await openDialog();
  await expect(dialog.getByRole("radio", { name: "Papier" })).toBeChecked();
  await dialog.getByRole("radio", { name: "Kork" }).check({ force: true });
  await dialog.getByRole("button", { name: "Speichern" }).click();
  await expect(dialog).toBeHidden();
  await expect(wall(ben)).toHaveAttribute("data-wall", "cork");
  await expect(wall(anna)).toHaveAttribute("data-wall", "cork");

  // Gleiche Wand erneut: Dialog schließt, nichts passiert
  dialog = await openDialog();
  await expect(dialog.getByRole("radio", { name: "Kork" })).toBeChecked();
  await dialog.getByRole("button", { name: "Speichern" }).click();
  await expect(dialog).toBeHidden();

  // Name und Wand zugleich
  dialog = await openDialog();
  await dialog.getByLabel("Name").fill("Wandboard");
  await dialog.getByRole("radio", { name: "Whiteboard" }).check({ force: true });
  await dialog.getByRole("button", { name: "Speichern" }).click();
  await expect(anna.getByRole("heading", { name: "Wandboard" })).toBeVisible();
  await expect(wall(anna)).toHaveAttribute("data-wall", "whiteboard");

  // Unbekannte Wände lehnt der Server ab
  const slug = path.split("/").pop();
  expect((await anna.request.patch(`/api/boards/${slug}`, { data: { wall: "beton" } })).status()).toBe(400);

  // Audit-Log: zwei Wandwechsel, ein Umbenennen, kein Eintrag für die unveränderte Wand
  await anna.getByRole("link", { name: "Audit-Log" }).click();
  const entries = anna.getByTestId("audit-entry");
  await expect(entries.filter({ hasText: "Ben hat die Wand von Papier auf Kork gestellt" })).toHaveCount(1);
  await expect(entries.filter({ hasText: "Ben hat die Wand von Kork auf Whiteboard gestellt" })).toHaveCount(1);
  await expect(entries.filter({ hasText: "hat die Wand" })).toHaveCount(2);
  await expect(entries.filter({ hasText: "in „Wandboard“ umbenannt" })).toHaveCount(1);
});
