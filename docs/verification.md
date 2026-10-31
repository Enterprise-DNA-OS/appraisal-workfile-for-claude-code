# Verification, 2026-10-31

Local Linux, Node 22.23.4: npm install, npm test, npm run demo, npm run view and npm run docs passed. The suite exercised all 30 CLI commands and 102 assertions on disposable PGlite storage, including real CLI child processes and generated HTML. No production database was used.

The same suite passed all 102 assertions against a disposable local PostgreSQL 17.11 server on Linux. It used a separate temporary schema and removed it after the run. The server was stopped afterward.

GitHub Actions run [41248775825](https://github.com/Enterprise-DNA-OS/appraisal-workfile-for-claude-code/actions/runs/41248775825) could not start any job. GitHub reported that recent account payments failed or the spending limit needs increasing. This is an infrastructure block, not a test failure. Windows was not executed and is not claimed as passed. The manual workflow retains Linux, Windows and PostgreSQL jobs for a later run. No billing settings were changed.

Headless browser checks rendered the real Landing Pages template with the target's data at desktop and mobile widths. The page had noindex,nofollow, all three paths, booking attribution and no mobile page overflow. The page gate passed. The draft workfile and weekly view were also opened and visually inspected. The comparable evidence, inputs and adjustments were split into separate sections after inspection showed a crowded wide report.

Examples and demo records are fictional. No actual Valcre export from a customer was available. The import tests cover documented CSV export shapes through synthetic fixtures, explicit mapping, duplicate batches, conflicting codes and all-or-nothing failure. A real export still needs header and unit reconciliation before switching.
