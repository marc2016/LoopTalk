# audit-log Specification

## Purpose

Unveränderliches Protokoll aller Änderungen pro Board: wer hat wann was gemacht.

## Requirements

### Requirement: Änderungen protokollieren
Jede verändernde Aktion SHALL als Audit-Eintrag mit Zeitpunkt, Akteur, Board,
Aktion, betroffenem Objekt und den geänderten Werten (vorher/nachher) gespeichert
werden. Der Eintrag MUST in derselben Transaktion wie die Änderung geschrieben
werden, sodass es keine Änderung ohne Eintrag gibt.

Protokolliert werden mindestens:
- Board erstellt, umbenannt, Wand geändert
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

#### Scenario: Wand geändert
- **WHEN** Ben die Wand des Boards von Papier auf Kork stellt
- **THEN** enthält das Audit-Log einen Eintrag „Wand geändert“ mit Ben als Akteur,
  Zeitpunkt sowie Papier und Kork

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

### Requirement: Unveränderlich
Audit-Einträge MUST NOT über die Anwendung geändert oder gelöscht werden können.

#### Scenario: Kein Bearbeiten
- **WHEN** ein Teilnehmer das Audit-Log öffnet
- **THEN** kann er Einträge nur lesen

### Requirement: Audit-Log einsehen
Jeder Teilnehmer eines Boards SHALL das Audit-Log dieses Boards einsehen können,
neueste Einträge zuerst, seitenweise geladen und filterbar nach Akteur und Aktion.
Zu jeder Karte SHALL ihr eigener Verlauf abrufbar sein.

#### Scenario: Wer hat das gelöscht?
- **WHEN** ein Teilnehmer das Audit-Log nach „Karte gelöscht“ filtert
- **THEN** sieht er, wer welche Karte wann gelöscht hat, samt Titel und Beschreibung

#### Scenario: Verlauf einer Karte
- **WHEN** ein Teilnehmer den Verlauf einer Karte öffnet
- **THEN** sieht er Anlage, alle Bearbeitungen und ggf. Löschen bzw. Archivierung
