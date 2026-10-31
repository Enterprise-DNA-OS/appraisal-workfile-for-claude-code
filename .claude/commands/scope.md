# /scope

Record agreed instructions, basis, users, assumptions and conflict evidence.

Read the affected record first. Use the operator's supplied values and named actor. Example values below are placeholders, never facts to insert. If a name is ambiguous, list candidates and ask for the intended record.

```bash
node scripts/appraisal.mjs scope JOB-004 --purpose="Internal planning" --users="Client directors" --basis="Market value" --reference=engagement-ref --conflict=conflict-check-ref --date=2026-10-31 --assumptions="Recorded assumptions" --actor=Operator
```

Add --json for machine-readable output. Present the result in this chat. Nothing sends, signs or publishes.
