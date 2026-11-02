# Design

## Context

- Mitgliedschaft liegt in `board_members` (`active`, `joined_at`), der Rotationstopf
  in `rotation_pool`. Heute entsteht ein `board_members`-Eintrag nur in
  `boardService.create` (Ersteller) und `boardService.open` (erster Aufruf eines
  Boards, mit Sperre auf den aktuellen Termin, `addToPool`, Audit `member.joined` und
  Live-Update).
- Benutzer entstehen in `auth/routes.ts` per Upsert auf `oidc_sub` beim Login.
- `RoleSelect` in `meeting-bar.tsx` ist ein Radix-`Select` (`size="sm"`). Der
  `PeoplePicker` nutzt bereits `Popover` + `Command` (cmdk) als durchsuchbare Auswahl.
- Die e2e-Tests laufen mit einer gemeinsamen Datenbank für alle Tests. Die vier
  Dex-Testbenutzer sammeln sich dort im Lauf der Tests an.

## Goals / Non-Goals

**Goals:**
- Mitgliedschaft bleibt eine echte Zeile in `board_members`, damit Topf, Ziehung,
  Aktiv/Inaktiv, Audit und Live-Updates unverändert funktionieren.
- Der Beitritt zu allen Boards ist idempotent und heilt sich selbst.

**Non-Goals:**
- Kein Abruf von Benutzern aus Dex (keine gRPC-API).
- Keine Live-Aktualisierung der Startseite, wenn jemand ein Board erstellt.
- Kein Umbau der Audit-Filter oder des `PeoplePicker`.

## Decisions

### Mitgliedschaft speichern statt berechnen
Alle Benutzer × alle Boards werden als Zeilen in `board_members` angelegt.
*Alternative:* Teilnehmer virtuell als „alle Benutzer minus ausgeschlossene“
berechnen. Das hätte Topf, `loadParticipants`, `activeMemberIds` und den
Aktiv-Schalter verändert und für jeden Lesezugriff einen Sonderfall erzeugt.

### Beitritt zu allen Boards bei jedem Login
Nach dem Upsert in `auth/routes.ts` ruft der Login `boards.joinAll(userId)` auf. Das
sucht alle Boards ohne `board_members`-Zeile für den Benutzer und tritt jedem einzeln
bei. Dafür wird der bisherige Beitritts-Code aus `open` in eine gemeinsame Funktion
`join(board, userId)` gezogen: Sperre auf den aktuellen Termin, `onConflictDoNothing`,
`addToPool`, Audit `member.joined` und Live-Update `member.joined`.
- Das läuft bei *jedem* Login, nicht nur beim ersten. Es kostet nur eine Abfrage,
  wenn nichts fehlt, und schließt Lücken aus Rennen (siehe Risiken).
- Inaktive haben eine Zeile und werden daher nicht angefasst.
- `open` behält den Beitritt als Absicherung und nutzt dieselbe Funktion.
- Ein fehlgeschlagener Beitritt bricht den Login nicht ab. Er wird geloggt und beim
  nächsten Login oder Öffnen des Boards nachgeholt.

### Board erstellen mit allen Benutzern
`create` fügt in derselben Transaktion alle Benutzer per
`INSERT … SELECT id FROM users` in `board_members` ein. Den Rotationstopf befüllt es
mit allen außer dem Ersteller, der den ersten Termin moderiert.
Audit: nur `board.created`, keine `member.joined` je Person. Bei `member.joined` ist
der Akteur die beitretende Person, und die hat beim Erstellen nichts getan.

### Migration ohne Audit-Einträge
`0003_all_users_on_all_boards.sql` legt fehlende Kombinationen in `board_members`
(aktiv) und `rotation_pool` an. Bestehende Zeilen bleiben unverändert, damit Inaktive
inaktiv bleiben und der Fortschritt in der Runde erhalten bleibt. Der aktuelle
Moderator kann nicht unter den neuen Einträgen sein, weil er schon Teilnehmer ist.
Die Migration schreibt keine Audit-Einträge: Es gibt keinen Akteur, und das Audit-Log
soll Handlungen von Personen zeigen.

### Board-Liste
`listMine` wird zu `listAll`: alle Boards, sortiert nach Name und `id`. Die Route
`GET /api/boards` und der Typ `BoardSummary` bleiben gleich. Die Startseite ändert nur
Überschrift und Beschreibung.

### Rollen-Auswahl als Combobox
`RoleSelect` wird aus `Popover` + `Command` gebaut, mit demselben Muster wie der
`PeoplePicker`.
- **Auslöser:** `Button variant="outline"` in normaler Höhe mit `role="combobox"`,
  `aria-expanded`, `aria-label` „Moderation“ bzw. „Protokoll“. Er zeigt Avatar und Name
  mit `truncate`, hat eine Mindestbreite von etwa 12rem und rechts ein Chevron.
- **Popover:** Breite = Auslöserbreite, mindestens etwa 18rem (über
  `--radix-popover-trigger-width`), `align="start"`.
- **Einträge:** `CommandItem` mit `value` = Benutzer-ID und `keywords` = [Name]. So
  stören gleiche Namen nicht, und cmdk sucht unscharf im Namen, „kra“ trifft also
  „Carla Kraus“. Jede Zeile hat etwa 40px Höhe mit Avatar. Die aktuelle Person bekommt
  einen Haken, die andere Rolle ist `disabled` mit rechtsbündigem Hinweis. Eine
  inaktive, aber eingetragene Person erscheint wie bisher deaktiviert mit „inaktiv“.
- „nicht festgelegt“ steht beim Protokoll als eigene Gruppe oben.
- `CommandEmpty`: „Niemand gefunden“. Nach einer Auswahl schließt sich das Popover,
  und die Suche wird geleert.
- *Alternative:* den Radix-`Select` behalten und ein Suchfeld hineinbauen. Radix-Select
  bietet keine Texteingabe mit Filter, das wäre gegen die Komponente gearbeitet.

## Risks / Trade-offs

- **[Rennen]** Ein erster Login gleichzeitig mit der Erstellung eines Boards kann dazu
  führen, dass weder `create` noch `joinAll` den Benutzer eintragen. → `open` tritt
  beim ersten Öffnen nach, und `joinAll` läuft bei jedem Login.
- **[Viele Benutzer]** Bei vielen Boards erzeugt ein erster Login viele kleine
  Transaktionen und `member.joined`-Einträge. → Für die erwartete Größe (ein Team,
  wenige Boards) unkritisch, die Boards werden nacheinander abgearbeitet.
- **[Boards für alle sichtbar]** Board-Namen sind allen angemeldeten Benutzern
  bekannt. → Vom Nutzer so gewollt; die Spec „Zugriff per Link“ wird angepasst.
- **[e2e-Abhängigkeit von der Reihenfolge]** Tests, die genau zwei Teilnehmer erwarten
  (Warnung „zu wenige Teilnehmer“, gezogener Moderator), hängen davon ab, wer sich
  vorher angemeldet hat. → Ein Helfer setzt alle anderen Testbenutzer auf dem Board
  über die bestehende Teilnehmer-API inaktiv. Die Warnung beim Erstellen wird in einem
  Servertest geprüft statt in e2e.

## Migration Plan

1. Deploy mit Migration `0003`: Sie läuft beim Start wie die bisherigen Migrationen.
2. **Rollback:** alten Stand deployen. Die zusätzlichen Teilnehmer bleiben bestehen
   und funktionieren mit dem alten Code wie normal beigetretene Teilnehmer. Wer nicht
   dazugehört, wird auf der Teilnehmerseite inaktiv gesetzt.
