# Move your own Valcre records

Valcre documents CSV exports in [Using the Search Grid](https://support.valcre.com/hc/en-us/articles/4417746816019-Valcre-Online-Using-the-Search-Grid), [Creating a Job](https://support.valcre.com/hc/en-us/articles/115015862568-Valcre-Online-Creating-a-Job) and [Importing Third-Party Sale Comparables](https://support.valcre.com/hc/en-us/articles/360021831793-Importing-Third-Party-Sale-Comparables). Reopened 2026-10-31. Export permission must be enabled for the user. The grid guide describes selecting records, right-clicking and choosing Export to CSV. The comparable guide also describes Properties, Export selected as, CSV (all data).

## Start with a sample

Export properties, jobs and sale comparables you have permission to keep. Keep the original files. The headings depend on the selected grid columns and custom fields. The sample files in examples/ are synthetic fixtures, not claimed to be an untouched vendor export. Compare your headers with docs/cli.md and map differences through a JSON file. Each value in the map is the exact CSV header for the canonical field key. No silent column guessing is used for units.

Import one standard CSV file with one command:

```bash
node scripts/appraisal.mjs import valcre properties.csv --kind=properties --source=office-export-2026 --actor=Operator --dry-run
```

Check the preview. Repeat without --dry-run to commit. Import properties before jobs, since a job needs its property code. Import sales separately into the comparable library. For a three-file export:

```bash
node scripts/appraisal.mjs import valcre properties.csv --kind=properties --source=office-export-2026 --actor=Operator
node scripts/appraisal.mjs import valcre jobs.csv --kind=jobs --source=office-export-2026 --map=examples/column-map.json --actor=Operator
node scripts/appraisal.mjs import valcre sales.csv --kind=sales --source=office-export-2026 --actor=Operator
```

Supply --currency=NZD or another recorded currency only when the export omits it and you have checked every row. A missing job assignee can use --valuer=Name after the same check. Never infer a currency from the dollar sign. Dates must be YYYY-MM-DD; amounts use a decimal point with no thousands separators or currency symbols. Area must be square metres. Convert an imperial export explicitly and retain the original area and conversion notes. These conversions and custom heading mapping are the migration work, not automatic capabilities.

## What maps

Properties: source identifier, address, type, area, interest, source reference. Jobs: job number, property identifier, client, appraiser, due date, effective date, currency. Sales: identifier, address, type, area, price, date, currency, source and verification references. Preserve unknown columns verbatim in the import batch's original rows. Job status always begins active; existing completion or sign-off is never trusted as a new review.

An identical file with the same source, mapping and defaults skips as a duplicate batch. A reused record code in a different batch fails visibly instead of overwriting a workfile. Every file is atomic, including its retained source rows. A failed second row rolls the first one back. A dry run uses the same validation and rolls everything back. Corrections need an explicitly reviewed migration or a new source identifier after checking whether the record already exists.

## Reconcile before switching

Compare counts and dates with the original exports. Read a complete job, then its comparable grid, evidence list and history. Select each sale for a job with a reason, weight and adjustment. Record scope, title and inspection evidence. Have another valuer review a complete workfile. Keep both systems until these checks pass and your professional obligations are met.

Photos, maps, signed reports, attachments, Word/Excel links, vendor market data, licensed third-party datasets, billing integrations and DCF models do not move through these CSV imports. Retain originals in secure storage and record their references. This free base calculates a sales-comparison indication and prepares workfiles, not a full Valcre feature replacement. Enterprise DNA can build your document formats, approved connections and field workflow around this base. Confirm data licences before moving third-party information.

Export all records and history with node scripts/appraisal.mjs export --out=workfile-records.json. This is a portable record copy, not a native backup or a tested restore tool. Test your database's native backup and recovery separately.
