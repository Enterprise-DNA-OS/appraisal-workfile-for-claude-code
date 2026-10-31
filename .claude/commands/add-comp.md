# /add-comp

Register a comparable sale from evidence the valuer can use.

Read the affected record first. Use the operator's supplied values and named actor. Example values below are placeholders, never facts to insert. If a name is ambiguous, list candidates and ask for the intended record.

```bash
node scripts/appraisal.mjs add-comp --code=SALE-004 --address="12 Example Road" --type=industrial --area=900 --amount=1980000 --currency=NZD --date=2026-09-01 --source=deed-ref --verification=verification-ref --actor=Operator
```

Add --json for machine-readable output. Present the result in this chat. Nothing sends, signs or publishes.
