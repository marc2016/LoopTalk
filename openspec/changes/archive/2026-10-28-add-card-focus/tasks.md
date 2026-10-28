# Tasks

## 1. Datenmodell und Typen

- [x] 1.1 Schema erweitern (`meetings.focus_card_id`, `focus_by`, `focus_since` mit gemeinsamem `CHECK`; Tabelle `meeting_discussed`; `meeting_cards.discussed`) und Migration `0002_card_focus` mit drizzle-kit erzeugen; Migration läuft in `compose.test.yaml` gegen eine leere und eine befüllte Datenbank durch
- [x] 1.2 Gemeinsame Typen erweitern (`CurrentMeeting.focus`, `CardView.discussed`, `MeetingCardSnapshot.discussed`, Audit-Aktionen `card.discussed`/`card.undiscussed`, SSE-Grund `meeting.focus_changed`); `npm run typecheck` grün

## 2. Server

- [x] 2.1 `meetingService.focus` und `unfocus`: Termin sperren, `running` prüfen (sonst Konflikt), Karte des Boards prüfen (sonst nicht gefunden), Version unverändert; Zeigen markiert in derselben Transaktion als besprochen inkl. Audit `card.discussed` mit `via: focus` nur bei neuer Markierung; Integrationstests grün
- [x] 2.2 `meetingService.setDiscussed`: markieren/entfernen idempotent mit Audit nur bei Änderung, nur bei laufendem Termin; Integrationstests grün
- [x] 2.3 Löschen einer Karte im Fokus leert den Fokus in derselben Transaktion; Beenden schreibt `discussed` in den Historien-Stand und leert den Fokus; Integrationstests für beide Fälle grün
- [x] 2.4 Board-Ansicht liefert `meeting.focus` und `cards[].discussed`, Historie liefert `discussed`; Integrationstests grün
- [x] 2.5 Endpunkte `PUT/DELETE …/meetings/current/focus` und `PUT/DELETE …/meetings/current/discussed/:cardId` mit SSE-Benachrichtigung; API-Tests für Erfolg, 409 bei geplantem Termin, 404 für fremde oder gelöschte Karte, unveränderte Terminversion; grün

## 3. Detailansicht und Bearbeiten

- [x] 3.1 `CardDialog` zu `CardSheet` mit Modi `view`, `edit`, `create` umbauen: Detailansicht ohne Eingabefelder mit Lebensanzeige, Namen (Hinzufügen/Entfernen), Ersteller, eingeklapptem Verlauf und Button „Bearbeiten“; „Löschen“ nur im Bearbeiten-Modus; „+ Thema“ startet im Modus `create`; im Browser geprüft
- [x] 3.2 Hinweis bei gleichzeitigem Bearbeiten („<Name> hat dieses Thema gerade geändert“, Name aus dem jüngsten `card.updated`-Eintrag), Eingaben bleiben erhalten; Schließen mit Hinweis, wenn die Karte gelöscht oder archiviert wird; mit zwei Browserfenstern geprüft
- [x] 3.3 Wachsen aus der Karte und Zurückschrumpfen per Web Animations API, eingebaute Dialog-Zoom-Animation abgeschaltet, ohne Ursprung oder bei reduzierter Bewegung nur Einblenden; im Browser geprüft

## 4. Gemeinsamer Fokus

- [x] 4.1 In der Detailansicht bei laufendem Termin „Allen zeigen“ und Schalter „besprochen“; in der Fokusansicht „<Name> zeigt“ und „Fokus beenden“; im Browser geprüft
- [x] 4.2 Fokus-Logik in `BoardPage`: Fokusansicht öffnen, wenn ein Fokus existiert, nicht lokal geschlossen und ich nicht beschäftigt bin (Bearbeiten, Anlegen, anderer Dialog); View-Modus wird ersetzt; neuer Fokus öffnet erneut; mit zwei Browserfenstern geprüft
- [x] 4.3 Fokus-Leiste unter der Termin-Leiste („<Name> zeigt: <Titel>“ mit „Zurück zum Fokus“ bzw. „Ansehen“ und „Fokus beenden“); im Browser geprüft
- [x] 4.4 „Heute besprochen“ auf Karten, Warnung mit Titeln nicht besprochener Karten der letzten Runde in der Bestätigung zum Beenden, Kennzeichnung in der Historie; im Browser geprüft
- [x] 4.5 Audit-Texte für `card.discussed` (inkl. „durch Zeigen“) und `card.undiscussed` in `describeAudit` und `actionLabels` mit Unit-Tests; `npm test -w @looptalk/web` grün

## 5. Tests und Abschluss

- [x] 5.1 Ende-zu-Ende-Test „Detailansicht“: Klick öffnet groß ohne Eingabefelder, Bearbeiten/Speichern/Abbrechen, Löschen nur im Bearbeiten-Modus, Name in der Detailansicht ergänzen, Hinweis bei gleichzeitigem Bearbeiten; grün
- [x] 5.2 Ende-zu-Ende-Test „Fokus“: Anna zeigt, Ben sieht die Karte groß mit „Anna zeigt“; Ben schließt lokal und sieht die Leiste; Anna zeigt ein anderes Thema; Ben bearbeitet und wird nicht unterbrochen; später dazukommende Person sieht den Fokus; „Fokus beenden“ schließt bei allen; grün
- [x] 5.3 Ende-zu-Ende-Test „Besprochen“: Zeigen markiert, Schalter entfernt, Warnung in der Bestätigung nennt das nicht besprochene Thema der letzten Runde, Historie kennzeichnet besprochen/nicht besprochen; grün
- [x] 5.4 Bestehende Ende-zu-Ende-Tests an die Detailansicht anpassen (Bearbeiten jetzt über „Bearbeiten“); gesamte Suite in Docker grün (`docker compose -f compose.test.yaml run --rm test` und `… run --rm --build e2e`)
