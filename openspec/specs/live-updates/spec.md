# live-updates Specification

## Purpose

Änderungen in Echtzeit an alle Clients eines Boards verteilen und anzeigen, wer das Board gerade ansieht.

## Requirements

### Requirement: Live-Aktualisierung
Änderungen am Board, an den Rollen oder an der Teilnehmerliste SHALL ohne Neuladen
bei allen angemeldeten Clients erscheinen, die dieses Board geöffnet haben. Clients
MUST nur Events des Boards erhalten, das sie geöffnet haben. Die Übertragung erfolgt per
Server-Sent Events.

#### Scenario: Neue Karte bei anderen
- **GIVEN** Anna und Ben haben das Board geöffnet
- **WHEN** Anna eine Karte anlegt
- **THEN** sieht Ben die Karte innerhalb weniger Sekunden ohne Neuladen

#### Scenario: Termin gestartet
- **WHEN** ein Teilnehmer den Termin startet
- **THEN** zeigen alle Clients an, dass der Termin läuft

#### Scenario: Rollen geändert
- **WHEN** ein Teilnehmer Moderator oder Protokollant manuell ändert
- **THEN** zeigen alle Clients die neuen Rollen an

#### Scenario: Teilnehmer beitreten oder inaktiv gesetzt
- **WHEN** ein Benutzer dem Board beitritt oder ein Teilnehmer aktiv/inaktiv gesetzt wird
- **THEN** aktualisieren alle Clients Teilnehmerliste, Rollenauswahl und ggf. die
  Warnung zu wenigen Teilnehmern

#### Scenario: Termin beendet
- **WHEN** ein Teilnehmer den Termin beendet
- **THEN** zeigen alle Clients die verschobenen Karten, den neuen Moderator und
  den neuen Protokollanten an

#### Scenario: Anderes Board
- **GIVEN** Anna hat Board A geöffnet, Ben Board B
- **WHEN** Anna eine Karte auf Board A anlegt
- **THEN** erhält Ben kein Event

### Requirement: Wer ist gerade da
Das Board SHALL allen Betrachtern live anzeigen, welche Teilnehmer das Board
gerade geöffnet haben. Ein Benutzer mit mehreren offenen Tabs oder Geräten MUST
nur einmal erscheinen. Schließt ein Benutzer das Board oder bricht seine
Verbindung ab, MUST er spätestens nach 30 Sekunden aus der Anzeige verschwinden.
Angezeigt werden nur Betrachter des jeweiligen Boards.

#### Scenario: Jemand öffnet das Board
- **GIVEN** Anna hat das Board geöffnet
- **WHEN** Ben das Board öffnet
- **THEN** sieht Anna ohne Neuladen, dass Ben gerade auf dem Board ist, und Ben
  sieht Anna

#### Scenario: Mehrere Tabs
- **WHEN** Ben das Board in zwei Tabs geöffnet hat
- **THEN** erscheint Ben in der Anzeige nur einmal

#### Scenario: Jemand verlässt das Board
- **WHEN** Ben seinen letzten Tab mit dem Board schließt
- **THEN** verschwindet Ben bei Anna spätestens nach 30 Sekunden aus der Anzeige

#### Scenario: Anderes Board
- **WHEN** Carla ein anderes Board geöffnet hat
- **THEN** erscheint Carla nicht in der Anzeige dieses Boards

#### Scenario: Verbindungsabbruch
- **WHEN** die SSE-Verbindung abbricht
- **THEN** verbindet sich der Client automatisch neu und lädt den aktuellen Stand

### Requirement: Weiterrücken sichtbar
Wenn ein Termin beendet wird, SHALL bei allen Teilnehmern, die das Board geöffnet
haben, sichtbar werden, dass die Karten weitergerückt sind: Karten gleiten ruhig in
ihre neue Spalte, archivierte Karten blenden aus. Die Bewegung MUST in höchstens
einer halben Sekunde abgeschlossen sein. Haben Teilnehmer in ihrem System
reduzierte Bewegung eingestellt, MUST die Bewegung entfallen; stattdessen SHALL ein
kurzer Hinweis erscheinen, dass die Themen weitergerückt sind. Andere Änderungen
(Karte anlegen, bearbeiten, löschen) MUST NOT diese Bewegung auslösen.

#### Scenario: Gleiten bei allen
- **GIVEN** Anna und Ben haben das Board geöffnet, Karte A liegt in Spalte 1
- **WHEN** Anna den Termin beendet
- **THEN** gleitet A bei Anna und bei Ben in Spalte 2

#### Scenario: Reduzierte Bewegung
- **GIVEN** Ben hat reduzierte Bewegung eingestellt
- **WHEN** ein Termin beendet wird
- **THEN** erscheint A bei Ben ohne Bewegung in Spalte 2, zusammen mit einem Hinweis,
  dass die Themen weitergerückt sind

#### Scenario: Keine Bewegung bei anderen Änderungen
- **WHEN** ein Teilnehmer eine Karte bearbeitet
- **THEN** gleitet keine Karte

### Requirement: Fokus bei allen
Zeigen, Wechseln und Beenden des gemeinsamen Fokus sowie Änderungen der Markierung
„besprochen“ SHALL ohne Neuladen bei allen Teilnehmern erscheinen, die das Board
geöffnet haben, und nur bei diesen. Nach einem Verbindungsabbruch MUST der aktuelle
Fokus beim Wiederverbinden angezeigt werden.

#### Scenario: Fokus erscheint bei allen
- **GIVEN** Anna und Ben haben das Board geöffnet
- **WHEN** Anna eine Karte allen zeigt
- **THEN** öffnet sie sich bei Ben innerhalb weniger Sekunden ohne Neuladen

#### Scenario: Anderes Board
- **GIVEN** Carla hat ein anderes Board geöffnet
- **WHEN** Anna eine Karte allen zeigt
- **THEN** ändert sich bei Carla nichts

#### Scenario: Wiederverbinden
- **GIVEN** Bens Verbindung ist unterbrochen, während Anna eine Karte zeigt
- **WHEN** Bens Verbindung wiederhergestellt wird
- **THEN** sieht Ben die Fokuskarte
