# Proposal

## Why

Die Auswahl für Moderation und Protokoll ist ein kleines Radix-Select ohne Suche und
bietet nur Personen an, die das Board schon einmal geöffnet haben. In der Praxis nutzt
eine Personengruppe alle Boards: Wer neu dazukommt oder ein Board noch nie geöffnet
hat, fehlt in der Auswahl und im Rotationstopf, obwohl er dazugehört.

## What Changes

- Die Auswahl für Moderation und Protokoll in der Termin-Leiste wird eine größere,
  durchsuchbare Auswahl (Combobox) mit Avatar je Person; die jeweils andere Rolle
  bleibt sichtbar, aber gesperrt.
- **BREAKING** Jeder Benutzer, der sich mindestens einmal bei LoopTalk angemeldet hat,
  ist aktiver Teilnehmer **jedes** Boards und liegt in dessen Rotationstopf:
  - beim ersten Login wird er allen bestehenden Boards hinzugefügt,
  - ein neues Board erhält sofort alle bekannten Benutzer als Teilnehmer,
  - eine Migration füllt bestehende Boards mit allen bekannten Benutzern auf.
- Der Beitritt beim ersten Öffnen eines Boards entfällt als eigene Regel (er bleibt
  technisch als Absicherung bestehen).
- Aktiv/Inaktiv pro Board bleibt unverändert der Weg, jemanden aus der Rotation eines
  Boards zu nehmen; wer inaktiv ist, wird nicht wieder automatisch aktiv.
- **BREAKING** Die Startseite zeigt alle Boards („Boards“ statt „Meine Boards“),
  alphabetisch. Boards werden damit allen angemeldeten Benutzern aufgelistet; der
  Link bleibt der direkte Weg zu einem Board.
- Die Quelle der Personen ist LoopTalk selbst (alle bisher angemeldeten Benutzer),
  nicht die Dex-API. Wer sich noch nie angemeldet hat, erscheint nicht.

## Capabilities

### New Capabilities

_keine_

### Modified Capabilities

- `boards`: Board erstellen (alle Benutzer werden Teilnehmer), Zugriff per Link
  (Boards werden allen aufgelistet), Beitritt beim ersten Öffnen wird zu „Alle Benutzer
  sind Teilnehmer“, Meine Boards wird zu „Alle Boards“.
- `meeting-cycle`: Zu wenige Teilnehmer (die Warnung verschwindet, wenn sich ein
  zweiter Benutzer erstmals anmeldet, nicht erst beim Öffnen des Boards).
- `ui-appearance`: neue Anforderung „Rollen-Auswahl“ (großzügig, durchsuchbar).

## Impact

- **Server**: `auth/routes.ts` (nach dem Login allen Boards beitreten),
  `services/boards.ts` (`create` mit allen Benutzern, `listMine` → `listAll`, Beitritt
  als wiederverwendbare Funktion), neue Migration `0003_all_users_on_all_boards.sql`,
  Live-Update `member.joined` an alle offenen Boards beim ersten Login.
- **Web**: `components/meeting-bar.tsx` (`RoleSelect` → Combobox aus `Popover` und
  `Command`), `pages/home-page.tsx` (Überschrift und Text).
- **Tests**: Server-Tests zu Beitritt, Board-Liste und Board-Erstellung; e2e-Tests,
  die von genau zwei Teilnehmern ausgehen (Warnung, gezogener Moderator), müssen die
  übrigen Testbenutzer auf dem Board inaktiv setzen.
- Keine neue Abhängigkeit, keine Änderung an Dex.
