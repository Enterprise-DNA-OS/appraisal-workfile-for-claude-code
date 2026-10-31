# /log

Append an internal note.

Read the affected record first. Use the operator's supplied values and named actor. Example values below are placeholders, never facts to insert. If a name is ambiguous, list candidates and ask for the intended record.

```bash
node scripts/appraisal.mjs log JOB-004 --note="Operator supplied note" --actor=Operator
```

Add --json for machine-readable output. Present the result in this chat. Nothing sends, signs or publishes.
