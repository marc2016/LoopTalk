## ADDED Requirements

### Requirement: Detailansicht
Ein Klick auf eine Karte SHALL sie groß in einer Detailansicht öffnen, ohne
Eingabefelder. Die Detailansicht MUST Titel, vollständige Beschreibung, Spalte und
verbleibende Termine, Namen, Ersteller mit Datum und den Verlauf der Karte zeigen.
Sie öffnet sich nur beim Teilnehmer, der geklickt hat. Ändert jemand anderes die
Karte, MUST die Detailansicht den neuen Stand ohne Neuladen zeigen. Wird die Karte
gelöscht oder archiviert, MUST sich die Detailansicht mit einem Hinweis schließen.
Namen SHALL direkt in der Detailansicht ergänzt und entfernt werden können.

#### Scenario: Karte öffnen
- **WHEN** ein Teilnehmer auf die Karte „Release-Planung“ klickt
- **THEN** sieht er sie groß mit vollständiger Beschreibung, ohne Eingabefelder,
  und mit einem Button „Bearbeiten“

#### Scenario: Nur bei mir
- **WHEN** Anna eine Karte anklickt
- **THEN** öffnet sich bei Ben nichts

#### Scenario: Änderung durch andere
- **GIVEN** Anna hat die Detailansicht einer Karte offen
- **WHEN** Ben die Beschreibung ändert
- **THEN** zeigt Annas Detailansicht die neue Beschreibung ohne Neuladen

#### Scenario: Name in der Detailansicht ergänzen
- **WHEN** ein Teilnehmer in der Detailansicht den Namen „Carla“ hinzufügt
- **THEN** steht „Carla“ an der Karte, ohne dass der Bearbeiten-Modus geöffnet wurde

### Requirement: Bearbeiten aus der Detailansicht
Die Detailansicht SHALL einen Button „Bearbeiten“ haben, der dieselbe Ansicht in
einen Bearbeiten-Modus mit Titel und Beschreibung umschaltet. „Speichern“ und
„Abbrechen“ MUST in die Detailansicht zurückführen; „Abbrechen“ verwirft die
Eingaben. „Löschen“ MUST nur im Bearbeiten-Modus angeboten werden. Ein neues Thema
SHALL direkt im Bearbeiten-Modus beginnen. Ändert ein anderer Teilnehmer die Karte,
während sie bearbeitet wird, MUST ein Hinweis erscheinen, ohne die Eingaben zu
überschreiben.

#### Scenario: Bearbeiten und speichern
- **GIVEN** die Detailansicht der Karte „Release“ ist offen
- **WHEN** der Teilnehmer auf „Bearbeiten“ klickt, den Titel in „Release-Planung“
  ändert und speichert
- **THEN** zeigt die Detailansicht den neuen Titel

#### Scenario: Abbrechen
- **WHEN** ein Teilnehmer im Bearbeiten-Modus Text ändert und „Abbrechen“ klickt
- **THEN** zeigt die Detailansicht den unveränderten Inhalt

#### Scenario: Löschen nur beim Bearbeiten
- **WHEN** die Detailansicht offen ist
- **THEN** wird kein Button „Löschen“ angeboten, im Bearbeiten-Modus schon

#### Scenario: Gleichzeitig bearbeitet
- **GIVEN** Anna bearbeitet die Karte „Release“
- **WHEN** Ben die Karte speichert
- **THEN** sieht Anna den Hinweis „Ben hat dieses Thema gerade geändert“, und ihre
  Eingaben bleiben erhalten

### Requirement: Besprochen markieren
Während eines laufenden Termins SHALL jeder Teilnehmer eine Karte für diesen Termin
als besprochen markieren und die Markierung wieder entfernen können. Eine Karte,
die in den gemeinsamen Fokus genommen wird, MUST automatisch als besprochen gelten.
Das Board MUST besprochene Karten mit „heute besprochen“ kennzeichnen. Ohne
laufenden Termin MUST NOT markiert werden können. Mit dem nächsten Termin beginnt
jede Karte wieder als nicht besprochen.

#### Scenario: Durch Zeigen besprochen
- **WHEN** Anna die Karte „Budget“ allen zeigt
- **THEN** ist „Budget“ bei allen als „heute besprochen“ gekennzeichnet

#### Scenario: Manuell markieren
- **GIVEN** ein laufender Termin
- **WHEN** ein Teilnehmer in der Detailansicht „besprochen“ einschaltet
- **THEN** ist die Karte bei allen als „heute besprochen“ gekennzeichnet

#### Scenario: Markierung entfernen
- **WHEN** ein Teilnehmer „besprochen“ bei einer markierten Karte ausschaltet
- **THEN** ist die Karte nicht mehr als besprochen gekennzeichnet

#### Scenario: Kein laufender Termin
- **WHEN** der Termin geplant ist
- **THEN** wird kein Schalter „besprochen“ angeboten und ein entsprechender Aufruf
  abgelehnt

#### Scenario: Neuer Termin
- **GIVEN** Karte A wurde in Termin 4 besprochen und rückt beim Beenden weiter
- **WHEN** Termin 5 beginnt
- **THEN** ist A nicht als besprochen gekennzeichnet
