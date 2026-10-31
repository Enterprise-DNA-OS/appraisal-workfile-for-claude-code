# /import

Preview and import one Valcre CSV with explicit mapping.

Read docs/replace-valcre.md. Confirm organisation, source rights, units, currency, dates and headers. Preview first and present counts. Import properties before jobs. Do not invent export columns. Apply the same checked command without --dry-run when the operator has asked for the import.

```bash
node scripts/appraisal.mjs import valcre properties.csv --kind=properties --source=office-export --actor=Operator --dry-run
```

Add --json for machine-readable output. Present the result in this chat. Nothing sends, signs or publishes.
