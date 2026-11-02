import { expect, test } from "@playwright/test";
import { addCard, cardAnimations, createBoard, login, onlyActive, startAndEnd } from "./helpers";

test("Zettelfarbe: gelb zu Beginn, direkt gewählt, live bei allen, im Audit-Log und in der Historie", async ({
  browser,
}) => {
  const anna = await login(browser, "anna@example.com");
  const boardPath = await createBoard(anna, `E2E-Zettel ${Date.now()}`);
  const ben = await login(browser, "ben@example.com", boardPath);
  await expect(ben.getByRole("heading", { level: 1 })).toBeVisible();

  // Ohne Farbwahl ist ein neues Thema gelb
  await addCard(anna, "Budget");
  const benNote = ben.getByTestId("topic-card").filter({ hasText: "Budget" });
  await expect(benNote).toHaveAttribute("data-color", "yellow");
  await expect(benNote).toHaveAttribute("data-age", "3");

  // Namen stehen auf dem Zettel als weiße Badges, Personen mit Konto mit Farbpunkt
  await benNote.click();
  await ben.getByRole("button", { name: "Name hinzufügen" }).click();
  await ben.getByPlaceholder("Name eingeben …").fill("Anna");
  await ben.getByRole("option", { name: "Anna" }).first().click();
  await ben.getByRole("button", { name: "Name hinzufügen" }).click();
  await ben.getByPlaceholder("Name eingeben …").fill("Gast");
  await ben.getByRole("option", { name: "„Gast“ hinzufügen" }).click();

  // Ben färbt das Thema direkt blau, ohne Bearbeiten-Modus und ohne Speichern;
  // Anna sieht den blauen Zettel ohne Neuladen, während Bens Zettel noch offen ist
  await expect(ben.getByRole("button", { name: "Bearbeiten", exact: true })).toHaveCount(0);
  const picker = ben.getByTestId("color-picker");
  await expect(picker.getByRole("radio", { name: "Gelb" })).toBeChecked();
  await picker.getByRole("radio", { name: "Blau" }).check({ force: true });
  await expect(ben.locator("[data-card-sheet]")).toHaveAttribute("data-color", "blue");
  const annaNote = anna.getByTestId("topic-card").filter({ hasText: "Budget" });
  await expect(annaNote).toHaveAttribute("data-color", "blue");

  // Dieselbe Farbe noch einmal anklicken speichert nichts
  await picker.getByRole("radio", { name: "Blau" }).click({ force: true });
  await ben.locator("[data-card-sheet]").getByRole("button", { name: "Close" }).click();
  await expect(annaNote.locator('[data-person="member"] [data-testid="person-dot"]')).toBeVisible();
  await expect(annaNote.locator('[data-person="free"] [data-testid="person-dot"]')).toHaveCount(0);

  // Unbekannte Farben lehnt der Server ab
  const slug = boardPath.split("/").pop();
  const cards = (await (await anna.request.get(`/api/boards/${slug}`)).json()).cards as { id: number }[];
  const res = await anna.request.patch(`/api/boards/${slug}/cards/${cards[0]!.id}`, { data: { color: "red" } });
  expect(res.status()).toBe(400);

  // Audit-Log nennt alte und neue Farbe
  await anna.getByRole("link", { name: "Audit-Log" }).click();
  await expect(anna.getByTestId("audit-entry").filter({ hasText: "Farbe: Gelb → Blau" })).toHaveCount(1);
  // Der zweite Klick auf Blau hat keinen weiteren Eintrag erzeugt
  await expect(anna.getByTestId("audit-entry").filter({ hasText: "Farbe:" })).toHaveCount(1);

  // Historie hält die Farbe zum Zeitpunkt des Termins fest
  await anna.getByRole("link", { name: "Board", exact: true }).click();
  await onlyActive(anna, boardPath, ["Anna", "Ben"]);
  await startAndEnd(anna);
  await expect(annaNote).toHaveAttribute("data-age", "2");
  await anna.getByRole("link", { name: "Historie" }).click();
  await expect(anna.locator('li[data-color="blue"]').filter({ hasText: "Budget" })).toBeVisible();
});

test("neue Zettel landen nur bei Bewegung und nur, wenn sie neu dazukommen", async ({ browser }) => {
  const anna = await login(browser, "anna@example.com");
  const boardPath = await createBoard(anna, `E2E-Landen ${Date.now()}`);
  const ben = await login(browser, "ben@example.com", boardPath, { reducedMotion: "no-preference" });
  const carla = await login(browser, "carla@example.com", boardPath, { reducedMotion: "reduce" });
  await expect(ben.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(carla.getByRole("heading", { level: 1 })).toBeVisible();

  await addCard(anna, "Neu dabei");
  const benNote = ben.getByTestId("topic-card").filter({ hasText: "Neu dabei" });
  await expect(benNote).toBeVisible();
  // Landen ist eine CSS-Animation, kein Weiterrücken
  expect(await cardAnimations(ben)).toBe(0);
  const landed = await benNote.evaluate((el) =>
    el.getAnimations().some((a) => a instanceof CSSAnimation && a.animationName === "note-land"),
  );
  const landing = await benNote.getAttribute("data-landing");
  expect(landed || landing === null).toBe(true);
  await expect(benNote).not.toHaveAttribute("data-landing");

  // Mit reduzierter Bewegung läuft keine Animation
  const carlaNote = carla.getByTestId("topic-card").filter({ hasText: "Neu dabei" });
  await expect(carlaNote).toBeVisible();
  expect(await carlaNote.evaluate((el) => el.getAnimations().length)).toBe(0);

  // Nach dem Neuladen landet nichts
  await ben.reload();
  await expect(benNote).toBeVisible();
  await expect(benNote).not.toHaveAttribute("data-landing");
});

test("quadratische Zettel, zwei pro Reihe; neuer Zettel färbt sich beim Ausprobieren um", async ({ browser }) => {
  const anna = await login(browser, "anna@example.com");
  await createBoard(anna, `E2E-Quadrat ${Date.now()}`);
  await addCard(anna, "Eins");
  await addCard(anna, "Zwei");
  await addCard(anna, "Drei mit einer sehr langen Beschreibung");

  // Zwei nebeneinander, der dritte darunter; alle quadratisch und gleich groß
  const boxes = await anna
    .getByTestId("column-1")
    .getByTestId("topic-card")
    .evaluateAll((els: HTMLElement[]) =>
      els.map((el) => ({ top: el.offsetTop, left: el.offsetLeft, w: el.offsetWidth, h: el.offsetHeight })),
    );
  expect(boxes).toHaveLength(3);
  for (const b of boxes) {
    expect(b.w).toBe(boxes[0]!.w);
    expect(Math.abs(b.h - b.w)).toBeLessThanOrEqual(1);
  }
  expect(boxes[0]!.top).toBe(boxes[1]!.top);
  expect(boxes[2]!.top).toBeGreaterThan(boxes[0]!.top);

  // Farbe ausprobieren beim Anlegen: Der Zettel färbt sich um, „Abbrechen“ legt nichts an
  const sheet = anna.locator("[data-card-sheet]");
  await anna.getByRole("button", { name: "Thema" }).click();
  await expect(sheet).toHaveAttribute("data-color", "yellow");
  await sheet.getByRole("radio", { name: "Blau" }).check({ force: true });
  await expect(sheet).toHaveAttribute("data-color", "blue");
  await sheet.getByRole("button", { name: "Abbrechen" }).click();
  await expect(sheet).toBeHidden();
  await expect(anna.getByTestId("topic-card")).toHaveCount(3);

  // Großer Zettel in der Farbe des kleinen
  await anna.getByTestId("topic-card").filter({ hasText: "Eins" }).click();
  await expect(sheet).toHaveAttribute("data-color", "yellow");
  await expect(sheet).toHaveClass(/note-paper/);
  const small = anna.getByTestId("topic-card").filter({ hasText: "Eins" });
  await expect(small).toHaveAttribute("data-color", "yellow");

  // Der kleine Zettel ist der große: solange offen, steht er nicht zusätzlich auf dem Board
  await expect(small).toHaveCSS("visibility", "hidden");
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(sheet).toBeHidden();
  await expect(small).toHaveCSS("visibility", "visible");
});
