# CLI reference

Run node scripts/appraisal.mjs help. All commands accept --json. Unknown flags fail rather than being ignored. Every write requires --actor=Name. Codes are case-insensitive. Exact codes win; otherwise partial codes, UUID prefixes and case-insensitive address/client names match. Multiple matches list candidates and exit 1.

## Reads

- properties: Read the property register and interests.
- assignments: Read assignment owners, due dates and status.
- comparables: Read the comparable sales library.
- work-in-hand: Plan the open appraisal work and due dates.
- attention: Find overdue assignments and evidence gaps.
- inspection-plan: Prepare the inspection list from missing inspection records.
- compliance: Check the workfile evidence against the documented rules.
- comp-check: Review selected sales for source, date, type and currency issues.
- review-queue: See which workfiles need peer review or have changed since review.
- review-ready: Read complete workfiles with a current peer review.
- indications: Compare the valuer conclusion with weighted sale indications.
- imports: Read imported source batches.

show takes an entity (properties, assignments, comparables) and a record reference. history takes an assignment. insights returns ten questions and result sets.

## Writes and files

Examples are illustrative, not instructions to create these records:

```bash
node scripts/appraisal.mjs show assignments JOB-001
node scripts/appraisal.mjs history JOB-001
node scripts/appraisal.mjs insights
node scripts/appraisal.mjs add-property --code=PROP-004 --address="10 Example Road" --type=industrial --area=1000 --interest=Freehold --source=title-ref --actor=Operator
node scripts/appraisal.mjs add --code=JOB-004 --property=PROP-004 --client="Client name" --valuer="Valuer name" --due=2026-11-20 --date=2026-10-31 --currency=NZD --actor=Operator
node scripts/appraisal.mjs add-comp --code=SALE-004 --address="12 Example Road" --type=industrial --area=900 --amount=1980000 --currency=NZD --date=2026-09-01 --source=deed-ref --verification=verification-ref --actor=Operator
node scripts/appraisal.mjs link-comp JOB-004 --comp=SALE-004 --adjustment=0 --weight=1 --reason="Comparable location and use" --actor=Operator
node scripts/appraisal.mjs scope JOB-004 --purpose="Internal planning" --users="Client directors" --basis="Market value" --reference=engagement-ref --conflict=conflict-check-ref --date=2026-10-31 --assumptions="Recorded assumptions" --actor=Operator
node scripts/appraisal.mjs inspect JOB-004 --date=2026-10-30 --reference=inspection-ref --actor=Operator
node scripts/appraisal.mjs evidence JOB-004 --kind=title --reference=title-ref --note="Evidence checked" --actor=Operator
node scripts/appraisal.mjs conclude JOB-004 --amount=2200000 --rationale="Valuer supplied reasoning" --assumptions="Recorded assumptions" --actor=Operator
node scripts/appraisal.mjs review JOB-004 --reference=review-ref --note="Reviewer supplied finding" --actor="Peer reviewer"
node scripts/appraisal.mjs close JOB-004 --note="Workfile complete" --actor=Operator
node scripts/appraisal.mjs reopen JOB-004 --note="New instruction received" --actor=Operator
node scripts/appraisal.mjs log JOB-004 --note="Operator supplied note" --actor=Operator
node scripts/appraisal.mjs import valcre properties.csv --kind=properties --source=office-export --actor=Operator --dry-run
node scripts/appraisal.mjs export --out=records.json
node scripts/appraisal.mjs draft-engagement JOB-001
```

Evidence kinds: title, scope, inspection, market, other. Currency is an explicit uppercase three-letter code. Money uses decimal currency units, not cents. Area is square metres. Weights are positive relative weights. Adjustment is a signed percentage above -100 and at most 100. The operator supplies every adjustment and the final opinion.

Import mapping keys: code, address, type, area, interest, reference, property, client, valuer, due, date, currency, amount, verification. Values are exact column headings in your file. Automatic aliases and requirements are implemented in importCsv in scripts/appraisal.mjs. See examples/ and replace-valcre.md. No fuzzy guessing of units or dates. Export writes a new JSON file and refuses to overwrite.

close changes workflow state without issuing anything. reopen requires a reason and makes the earlier review stale. New evidence, a changed scope, inspection, conclusion or comparable selection also makes it stale.
