## ADDED Requirements

### Requirement: Direkt auf dem Zettel bearbeiten
Titel und Beschreibung einer Karte SHALL im großen Zettel per Klick oder Tastatur
direkt zum Eingabefeld werden, ohne Bearbeiten-Modus. Verlassen des Felds MUST
speichern, beim Titel auch Enter; Escape MUST die Eingabe verwerfen. Ein
unverändertes Feld MUST NOT gespeichert werden. Ein leerer Titel MUST NOT
gespeichert werden; das Feld bleibt mit Fehlermeldung offen. Wird der Zettel mit
einer geänderten Eingabe geschlossen, MUST sie gespeichert werden.

#### Scenario: Titel direkt ändern
- **GIVEN** der große Zettel „Release“ ist offen
- **WHEN** der Teilnehmer auf den Titel klickt, „Release-Planung“ eingibt und Enter
  drückt
- **THEN** zeigt der Zettel bei allen Teilnehmern „Release-Planung“, ohne dass ein
  Bearbeiten-Modus geöffnet wurde

#### Scenario: Beschreibung beim Verlassen speichern
- **WHEN** ein Teilnehmer in die Beschreibung klickt, Text ergänzt und danach
  woanders hinklickt
- **THEN** ist die neue Beschreibung gespeichert

#### Scenario: Mit Escape verwerfen
- **WHEN** ein Teilnehmer den Titel ändert und Escape drückt
- **THEN** zeigt der Zettel den unveränderten Titel, nichts wurde gespeichert, und
  der Zettel bleibt offen

#### Scenario: Nichts geändert
- **WHEN** ein Teilnehmer in den Titel klickt und ihn ohne Änderung verlässt
- **THEN** wird nichts gespeichert und kein Audit-Eintrag erzeugt

#### Scenario: Leerer Titel
- **WHEN** ein Teilnehmer den Titel leert und Enter drückt
- **THEN** wird nichts gespeichert, und am Feld steht eine Fehlermeldung

#### Scenario: Schließen mit offener Eingabe
- **WHEN** ein Teilnehmer die Beschreibung ändert und den Zettel direkt schließt
- **THEN** ist die neue Beschreibung gespeichert

#### Scenario: Kein Bearbeiten-Button
- **WHEN** ein Teilnehmer einen großen Zettel öffnet
- **THEN** gibt es keinen Button „Bearbeiten“

### Requirement: Löschen direkt auf dem Zettel
Der große Zettel einer bestehenden Karte SHALL „Löschen“ direkt anbieten, ohne
vorher einen Modus zu öffnen, als Symbol mit dem zugänglichen Namen „Löschen“. Vor
dem Löschen MUST wie bisher eine Bestätigung abgefragt werden (siehe „Thema
löschen“).

#### Scenario: Löschen ohne Bearbeiten-Modus
- **GIVEN** der große Zettel „Release“ ist offen
- **WHEN** der Teilnehmer auf das Symbol „Löschen“ klickt und bestätigt
- **THEN** ist „Release“ bei allen vom Board verschwunden und der große Zettel
  geschlossen

### Requirement: Gleichzeitig dasselbe Feld bearbeiten
Ändert ein anderer Teilnehmer ein Feld, das ich gerade bearbeite, MUST meine Eingabe
erhalten bleiben, und am Feld MUST ein Hinweis mit dem Namen der Person und
„Neuen Stand übernehmen“ erscheinen. Speichere ich trotzdem, gilt meine Eingabe.
Andere Felder desselben Zettels MUST sich währenddessen weiter live aktualisieren.

#### Scenario: Gleichzeitig am Titel
- **GIVEN** Anna bearbeitet den Titel der Karte „Release“
- **WHEN** Ben den Titel derselben Karte speichert
- **THEN** sieht Anna am Titel den Hinweis „Ben hat dieses Thema gerade geändert“,
  und ihre Eingabe bleibt erhalten

#### Scenario: Neuen Stand übernehmen
- **GIVEN** Anna sieht den Hinweis am Titel
- **WHEN** sie „Neuen Stand übernehmen“ klickt
- **THEN** steht Bens Titel im Feld, und Annas Eingabe ist verworfen

#### Scenario: Anderes Feld ändert sich
- **GIVEN** Anna bearbeitet den Titel der Karte „Release“
- **WHEN** Ben die Beschreibung derselben Karte ändert
- **THEN** sieht Anna die neue Beschreibung sofort, ohne Hinweis am Titel

## MODIFIED Requirements

### Requirement: Detailansicht
Ein Klick auf eine Karte SHALL sie groß in einer Detailansicht öffnen. Die
Detailansicht MUST Titel, vollständige Beschreibung, Spalte und verbleibende
Termine, Namen, Ersteller mit Datum und den Verlauf der Karte zeigen. Titel,
Beschreibung, Farbe und Namen SHALL direkt in der Detailansicht geändert werden
können (siehe „Direkt auf dem Zettel bearbeiten“). Sie öffnet sich nur beim
Teilnehmer, der geklickt hat. Ändert jemand anderes die Karte, MUST die
Detailansicht den neuen Stand ohne Neuladen zeigen. Wird die Karte gelöscht oder
archiviert, MUST sich die Detailansicht mit einem Hinweis schließen.

#### Scenario: Karte öffnen
- **WHEN** ein Teilnehmer auf die Karte „Release-Planung“ klickt
- **THEN** sieht er sie groß mit vollständiger Beschreibung, ohne Button
  „Bearbeiten“

#### Scenario: Nur bei mir
- **WHEN** Anna eine Karte anklickt
- **THEN** öffnet sich bei Ben nichts

#### Scenario: Änderung durch andere
- **GIVEN** Anna hat die Detailansicht einer Karte offen
- **WHEN** Ben die Beschreibung ändert
- **THEN** zeigt Annas Detailansicht die neue Beschreibung ohne Neuladen

#### Scenario: Name in der Detailansicht ergänzen
- **WHEN** ein Teilnehmer in der Detailansicht den Namen „Carla“ hinzufügt
- **THEN** steht „Carla“ an der Karte

### Requirement: Zettelfarbe
Jede Karte SHALL eine Zettelfarbe aus genau sechs festen Tönen haben: Gelb,
Orange, Rosa, Grün, Blau, Lila. Neue Karten MUST gelb sein, sofern beim Anlegen
keine andere Farbe gewählt wird. Jeder Teilnehmer des Boards SHALL die Farbe jeder
Karte direkt auf dem großen Zettel ändern können; ein Klick auf eine Farbe MUST sie
sofort speichern. Die Auswahl MUST jeden Ton mit seinem Namen zugänglich machen,
damit sie ohne Farbwahrnehmung bedienbar ist. Eine Farbänderung MUST bei allen
Teilnehmern ohne Neuladen erscheinen und als „Karte bearbeitet“ mit alter und neuer
Farbe im Audit-Log stehen. Andere Werte als die sechs Töne MUST abgelehnt werden.
Die Farbe hat in der Anwendung keine festgelegte Bedeutung.

#### Scenario: Neue Karte ist gelb
- **WHEN** ein Teilnehmer ein Thema ohne Farbwahl anlegt
- **THEN** erscheint die Karte als gelber Zettel

#### Scenario: Farbe beim Anlegen wählen
- **WHEN** ein Teilnehmer ein neues Thema anlegt und „Grün“ wählt
- **THEN** erscheint die Karte als grüner Zettel in Spalte 1

#### Scenario: Farbe ändern
- **GIVEN** Anna und Ben haben das Board geöffnet, die Karte „Budget“ ist gelb
- **WHEN** Ben auf dem großen Zettel „Blau“ anklickt
- **THEN** ist „Budget“ bei Anna ohne Neuladen ein blauer Zettel, ohne dass Ben
  speichern musste, und das Audit-Log enthält „Karte bearbeitet“ mit Ben als
  Akteur sowie Gelb und Blau

#### Scenario: Gleiche Farbe erneut
- **GIVEN** die Karte „Budget“ ist blau
- **WHEN** ein Teilnehmer „Blau“ anklickt
- **THEN** wird nichts gespeichert und kein Audit-Eintrag erzeugt

#### Scenario: Unbekannte Farbe
- **WHEN** ein Client eine Karte mit der Farbe „rot“ speichern will
- **THEN** wird die Änderung abgelehnt und die Karte behält ihre Farbe

#### Scenario: Bestehende Karten
- **GIVEN** Karten, die vor dieser Änderung angelegt wurden
- **WHEN** die Änderung eingespielt wird
- **THEN** sind alle diese Karten gelb

## REMOVED Requirements

### Requirement: Bearbeiten aus der Detailansicht
**Reason**: Der Bearbeiten-Modus entfällt; Titel, Beschreibung, Farbe und Löschen
sind direkt auf dem großen Zettel erreichbar.
**Migration**: Ersetzt durch „Direkt auf dem Zettel bearbeiten“ und „Gleichzeitig
dasselbe Feld bearbeiten“. Ein neues Thema beginnt weiterhin als Formular (siehe
„Großer Zettel“ in `ui-appearance`).
