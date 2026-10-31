# /add-property

Register a property from checked evidence.

Read the affected record first. Use the operator's supplied values and named actor. Example values below are placeholders, never facts to insert. If a name is ambiguous, list candidates and ask for the intended record.

```bash
node scripts/appraisal.mjs add-property --code=PROP-004 --address="10 Example Road" --type=industrial --area=1000 --interest=Freehold --source=title-ref --actor=Operator
```

Add --json for machine-readable output. Present the result in this chat. Nothing sends, signs or publishes.
