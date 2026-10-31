# Verification, 2026-10-31

Local Linux, Node 22.23.4: npm install, npm test, npm run demo, npm run view and npm run docs passed. The suite exercised all 30 CLI commands and 102 assertions on disposable PGlite storage, including real CLI child processes and generated HTML. No production database was used.

The manually dispatched workflow tests Linux and Windows PGlite plus PostgreSQL 17. Remote results will be recorded after the private push. Those platforms are not claimed as passed merely because the workflow exists.

Examples and demo records are fictional. No actual Valcre export from a customer was available. The import tests cover documented CSV export shapes through synthetic fixtures, explicit mapping, duplicate batches, conflicting codes and all-or-nothing failure. A real export still needs header and unit reconciliation before switching.
