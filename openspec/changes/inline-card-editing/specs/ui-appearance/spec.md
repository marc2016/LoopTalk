## MODIFIED Requirements

### Requirement: Großer Zettel
Ein Klick auf einen Zettel SHALL ihn sichtbar aus seiner Position auf dem Board zu
einem großen Zettel wachsen lassen; beim Schließen MUST er an seinen Platz
zurückschrumpfen. Solange der große Zettel offen ist, MUST der kleine an seiner
Stelle ausgeblendet sein, damit nur ein Zettel zu sehen ist. Der große Zettel MUST wie der kleine aussehen: dieselbe
Zettelfarbe, dasselbe Alter, Papier mit umgeknickter Ecke, ohne Dialograhmen. Er
enthält alles zum Lesen, Bearbeiten und Präsentieren: Titel, vollständige
Beschreibung, Namen, Lebensanzeige, Farbwahl, „besprochen“, „Allen zeigen“ bzw.
„Fokus beenden“, Verlauf und „Löschen“. Es gibt keinen Bearbeiten-Modus: Titel und
Beschreibung MUST wie Schrift auf dem Papier aussehen und beim Bearbeiten an
derselben Stelle zum Eingabefeld werden, ohne dass sich der Zettel sonst verändert.
Ein leerer Beschreibungstext MUST als Aufforderung erscheinen, eine Beschreibung zu
ergänzen. Ein Klick auf eine Farbe MUST den großen Zettel sofort umfärben und die
Farbe speichern. Ein neues Thema MUST als großer gelber Zettel mit Eingabefeldern,
Farbwahl, „Abbrechen“ und „Anlegen“ beginnen; dort wird die Farbe erst mit
„Anlegen“ gespeichert. Die gemeinsame Fokusansicht MUST ebenfalls als großer Zettel
erscheinen. Bei reduzierter Bewegung erscheint und verschwindet der große Zettel
ohne Animation. Text auf dem großen Zettel MUST mindestens einen Kontrast nach WCAG
AA haben, und alle Felder MUST per Tastatur und Screenreader bedienbar bleiben.

#### Scenario: Zettel öffnen
- **GIVEN** „Budget“ ist ein grüner Zettel in Spalte 2
- **WHEN** ein Teilnehmer auf den Zettel klickt
- **THEN** wächst er zu einem großen grünen Zettel mit vollständiger Beschreibung,
  ohne Dialograhmen

#### Scenario: Auf dem Papier bearbeiten
- **GIVEN** der große Zettel „Budget“ ist offen
- **WHEN** der Teilnehmer auf die Beschreibung klickt
- **THEN** wird die Beschreibung an derselben Stelle zum Eingabefeld, ohne Button
  „Bearbeiten“, und Farbwahl, Namen und Verlauf bleiben unverändert sichtbar

#### Scenario: Farbe ausprobieren
- **GIVEN** ein Teilnehmer legt ein neues Thema an
- **WHEN** er „Blau“ wählt und „Abbrechen“ klickt
- **THEN** war der große Zettel kurz blau, und es wurde kein Thema angelegt

#### Scenario: Per Tastatur bearbeiten
- **GIVEN** der große Zettel „Budget“ ist offen
- **WHEN** der Teilnehmer per Tab auf den Titel geht und Enter drückt
- **THEN** wird der Titel zum Eingabefeld, und ein Screenreader kündigt ihn als
  bearbeitbaren Titel an

#### Scenario: Farbe direkt wählen
- **GIVEN** der große Zettel „Budget“ ist grün
- **WHEN** der Teilnehmer „Blau“ anklickt
- **THEN** wird der große Zettel sofort blau, und nach dem Schließen ist auch der
  kleine Zettel blau

#### Scenario: Escape im Feld
- **GIVEN** der Teilnehmer bearbeitet den Titel auf dem großen Zettel
- **WHEN** er Escape drückt
- **THEN** wird nur die Eingabe verworfen, der große Zettel bleibt offen

#### Scenario: Nur ein Zettel
- **GIVEN** der große Zettel „Budget“ ist offen
- **WHEN** der Teilnehmer auf das Board dahinter schaut
- **THEN** ist der kleine Zettel „Budget“ dort nicht zu sehen

#### Scenario: Schließen
- **WHEN** der Teilnehmer den großen Zettel schließt
- **THEN** schrumpft er an seinen Platz auf dem Board zurück, und erst dann ist der kleine Zettel wieder zu sehen

#### Scenario: Fokus als großer Zettel
- **WHEN** Anna „Budget“ allen zeigt
- **THEN** erscheint „Budget“ bei Ben als großer grüner Zettel mit „Anna zeigt“
