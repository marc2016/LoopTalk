# topic-board Specification

## Purpose

Themenkarten in drei Spalten anlegen, bearbeiten, löschen und um Namen ergänzen.

## Requirements

### Requirement: Drei Spalten
Jedes Board SHALL genau drei Spalten haben, die den Lebenszyklus eines Themas abbilden
(Spalte 1 = neu, Spalte 2 = zweiter Termin, Spalte 3 = letzter Termin).

#### Scenario: Board anzeigen
- **WHEN** ein angemeldeter Teilnehmer das Board öffnet
- **THEN** sieht er drei Spalten mit allen nicht archivierten Karten

### Requirement: Thema anlegen
Jeder angemeldete Teilnehmer SHALL eine Themenkarte mit Titel und optionaler
Beschreibung anlegen können. Neue Karten MUST in Spalte 1 landen.

#### Scenario: Neue Karte
- **WHEN** ein Teilnehmer ein Thema mit Titel „Release-Planung“ anlegt
- **THEN** erscheint die Karte in Spalte 1 mit dem Teilnehmer als Ersteller

#### Scenario: Titel fehlt
- **WHEN** ein Teilnehmer eine Karte ohne Titel speichern will
- **THEN** wird die Karte nicht angelegt und eine Fehlermeldung angezeigt

### Requirement: Kein manuelles Verschieben
Karten MUST NOT manuell zwischen Spalten verschoben werden können. Die Spalte
einer Karte ändert sich ausschließlich beim Beenden eines Termins.

#### Scenario: Verschieben per API
- **WHEN** ein Client die Spalte einer Karte direkt ändern will
- **THEN** wird die Änderung abgelehnt und die Karte bleibt in ihrer Spalte

### Requirement: Thema bearbeiten
Jeder Teilnehmer des Boards SHALL Titel und Beschreibung jeder Karte ändern
können, auch von Karten anderer Teilnehmer.

#### Scenario: Bearbeiten
- **WHEN** ein Teilnehmer den Titel einer Karte ändert
- **THEN** wird der neue Titel bei allen Teilnehmern angezeigt

#### Scenario: Fremdes Thema bearbeiten
- **GIVEN** Anna hat die Karte „Release“ angelegt
- **WHEN** Ben die Beschreibung ändert
- **THEN** wird die Änderung gespeichert und Anna bleibt Erstellerin

### Requirement: Thema löschen
Jeder Teilnehmer des Boards SHALL jede Karte löschen können; vorher MUST eine
Bestätigung abgefragt werden. Eine gelöschte Karte MUST vom Board und aus allen
Listen verschwinden und kann nicht mehr bearbeitet werden. Ihr letzter Inhalt
MUST im Audit-Log erhalten bleiben. Bereits in der Termin-Historie festgehaltene
Stände bleiben unverändert.

#### Scenario: Löschen
- **WHEN** ein Teilnehmer die Karte „Release“ löscht und bestätigt
- **THEN** ist sie bei allen Teilnehmern vom Board verschwunden, und das
  Audit-Log zeigt, wer sie wann mit welchem Inhalt gelöscht hat

#### Scenario: Abbrechen
- **WHEN** ein Teilnehmer beim Löschen die Bestätigung abbricht
- **THEN** bleibt die Karte unverändert

#### Scenario: Gelöschte Karte bearbeiten
- **WHEN** ein Client eine bereits gelöschte Karte ändern will
- **THEN** antwortet die API mit 404

### Requirement: Weitere Namen an einem Thema
Jeder Teilnehmer des Boards SHALL einer Karte weitere Namen hinzufügen und wieder
entfernen können, z. B. Personen, die das Thema mit einbringen oder dazu etwas
sagen wollen. Ein Name ist Freitext; beim Eingeben SHALL die Teilnehmerliste des
Boards vorgeschlagen werden, damit auch Personen ohne Login eingetragen werden
können. Der Ersteller MUST unabhängig davon als Ersteller erhalten bleiben.
Derselbe Name MUST NOT zweimal an einer Karte stehen.

#### Scenario: Name hinzufügen
- **GIVEN** Anna hat die Karte „Release-Planung“ angelegt
- **WHEN** Ben die Namen „Ben“ und „Carla“ hinzufügt
- **THEN** zeigt die Karte Anna als Erstellerin sowie Ben und Carla bei allen
  Teilnehmern an

#### Scenario: Vorschlag aus Teilnehmern
- **WHEN** ein Teilnehmer im Namensfeld „Ca“ tippt
- **THEN** werden passende Teilnehmer des Boards vorgeschlagen, freie Eingabe
  bleibt möglich

#### Scenario: Name entfernen
- **WHEN** ein Teilnehmer „Carla“ von der Karte entfernt
- **THEN** steht Carla nicht mehr an der Karte

#### Scenario: Doppelter Name
- **WHEN** ein Teilnehmer „Ben“ an eine Karte hängt, an der „Ben“ schon steht
- **THEN** wird der Name nicht doppelt gespeichert

### Requirement: Archiv
Karten, die aus Spalte 3 herausfallen, SHALL archiviert und nicht gelöscht werden.
Archivierte Karten MUST über die Termin-Historie einsehbar bleiben, samt ihren
Namen.

#### Scenario: Archivierte Karte nachschlagen
- **WHEN** ein Teilnehmer die Historie eines vergangenen Termins öffnet
- **THEN** sieht er die Karten, die bei diesem Termin auf dem Board waren
