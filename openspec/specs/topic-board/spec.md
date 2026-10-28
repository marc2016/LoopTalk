# topic-board Specification

## Purpose

Themenkarten in drei Spalten anlegen, bearbeiten, löschen und um Namen ergänzen.

## Requirements

### Requirement: Drei Spalten
Jedes Board SHALL genau drei Spalten haben, die den Lebenszyklus eines Themas abbilden
(Spalte 1 = neu, Spalte 2 = zweiter Termin, Spalte 3 = letzter Termin). Die Spalten
SHALL als zusammenhängender Zeitstrahl dargestellt werden: nummerierte Schritte
„Neu“, „Zweite Runde“ und „Letzte Runde“, verbunden in Leserichtung und endend im
Archiv. Jeder Spaltenkopf MUST anhand der Nummer des aktuellen Termins N angeben,
bis zu welchem Termin die Themen dieser Spalte auf dem Board bleiben: Spalte 1 bis
Termin N+2, Spalte 2 bis Termin N+1, Spalte 3 nur noch Termin N. Die Spalte
„Letzte Runde“ MUST sich optisch von den anderen beiden abheben.

#### Scenario: Board anzeigen
- **WHEN** ein angemeldeter Teilnehmer das Board öffnet
- **THEN** sieht er drei Spalten mit allen nicht archivierten Karten

#### Scenario: Terminnummern in den Spaltenköpfen
- **GIVEN** der aktuelle Termin hat die Nummer 5
- **WHEN** ein Teilnehmer das Board ansieht
- **THEN** zeigen die Spaltenköpfe „bis Termin 7“, „bis Termin 6“ und „nur noch
  Termin 5“

#### Scenario: Zeitstrahl aktualisiert sich
- **GIVEN** der aktuelle Termin hat die Nummer 5
- **WHEN** der Termin beendet wird
- **THEN** zeigen die Spaltenköpfe bei allen Teilnehmern „bis Termin 8“, „bis
  Termin 7“ und „nur noch Termin 6“

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

### Requirement: Lebensanzeige
Jede Karte auf dem Board SHALL anzeigen, bei wie vielen Terminen sie einschließlich
des aktuellen noch auf dem Board steht: drei in Spalte 1, zwei in Spalte 2, einer
in Spalte 3. Die Anzeige MUST sowohl grafisch als auch als Text erfolgen, damit sie
ohne Farbwahrnehmung verständlich ist. Karten in Spalte 3 MUST als „letzte Chance“
gekennzeichnet sein.

#### Scenario: Karte in Spalte 1
- **WHEN** eine Karte in Spalte 1 liegt
- **THEN** zeigt sie „noch 3 Termine“

#### Scenario: Karte in Spalte 2
- **WHEN** eine Karte in Spalte 2 liegt
- **THEN** zeigt sie „noch 2 Termine“

#### Scenario: Karte in der letzten Runde
- **WHEN** eine Karte in Spalte 3 liegt
- **THEN** zeigt sie „letzte Chance“ und ist gegenüber den anderen Karten
  hervorgehoben

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
