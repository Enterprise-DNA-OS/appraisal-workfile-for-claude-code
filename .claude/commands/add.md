# /add

Register an appraisal instruction.

Read the affected record first. Use the operator's supplied values and named actor. Example values below are placeholders, never facts to insert. If a name is ambiguous, list candidates and ask for the intended record.

```bash
node scripts/appraisal.mjs add --code=JOB-004 --property=PROP-004 --client="Client name" --valuer="Valuer name" --due=2026-11-20 --date=2026-10-31 --currency=NZD --actor=Operator
```

Add --json for machine-readable output. Present the result in this chat. Nothing sends, signs or publishes.
