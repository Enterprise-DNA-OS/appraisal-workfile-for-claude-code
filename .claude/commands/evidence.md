# /evidence

Append an evidence reference and note.

Read the affected record first. Use the operator's supplied values and named actor. Example values below are placeholders, never facts to insert. If a name is ambiguous, list candidates and ask for the intended record.

```bash
node scripts/appraisal.mjs evidence JOB-004 --kind=title --reference=title-ref --note="Evidence checked" --actor=Operator
```

Add --json for machine-readable output. Present the result in this chat. Nothing sends, signs or publishes.
