## MODIFIED Requirements

### Requirement: Änderungen protokollieren
Jede verändernde Aktion SHALL als Audit-Eintrag mit Zeitpunkt, Akteur, Board,
Aktion, betroffenem Objekt und den geänderten Werten (vorher/nachher) gespeichert
werden. Der Eintrag MUST in derselben Transaktion wie die Änderung geschrieben
werden, sodass es keine Änderung ohne Eintrag gibt.

Protokolliert werden mindestens:
- Board erstellt, umbenannt
- Teilnehmer beigetreten, aktiv/inaktiv gesetzt
- Karte angelegt, bearbeitet, gelöscht (mit letztem Inhalt)
- Name an einer Karte hinzugefügt, entfernt
- Termin gestartet
- Moderator oder Protokollant manuell geändert (vorher/nachher)
- Termin beendet (inkl. neuem Moderator und Protokollant)
- Karte als besprochen markiert (auch automatisch durch Zeigen), Markierung entfernt

Das Zeigen einer Karte und das Beenden des Fokus selbst ändern keine Daten und
werden nicht protokolliert.

#### Scenario: Karte bearbeitet
- **WHEN** Ben den Titel einer Karte von „Release“ auf „Release-Planung“ ändert
- **THEN** enthält das Audit-Log einen Eintrag „Karte bearbeitet“ mit Ben als
  Akteur, Zeitpunkt sowie altem und neuem Titel

#### Scenario: Fehlgeschlagene Aktion
- **WHEN** das Beenden eines Termins wegen eines Versionskonflikts abgelehnt wird
- **THEN** entsteht kein Audit-Eintrag

#### Scenario: Automatische Aktionen
- **WHEN** beim Beenden eines Termins Karten weiterrücken und archiviert werden
- **THEN** ist das Teil des Eintrags „Termin beendet“ mit dem auslösenden
  Teilnehmer als Akteur

#### Scenario: Durch Zeigen besprochen
- **WHEN** Anna eine noch nicht besprochene Karte allen zeigt
- **THEN** enthält das Audit-Log einen Eintrag „als besprochen markiert“ mit Anna als
  Akteur, aber keinen Eintrag für das Zeigen selbst

#### Scenario: Erneut gezeigt
- **WHEN** Anna eine bereits besprochene Karte erneut allen zeigt
- **THEN** entsteht kein weiterer Eintrag
