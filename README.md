# Appraisal Workfile for Claude Code

The open-source commercial appraisal workfile that is just a database and Claude Code. Created by Enterprise DNA. Works with Claude Code, Codex, OpenCode or Cursor.

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your Valcre data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=valcre">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/valcre?utm_source=github&utm_medium=readme&utm_campaign=valcre">How it works</a></td>
  </tr>
</table>

## What it does

Keep property interests, instructions, comparable sales, selections, evidence and peer reviews in your own database. Ask what is overdue, what evidence is missing and which opinions need another look. Produce branded draft workfiles and review memoranda. Omni by Enterprise DNA customises and runs it for a setup fee, then a retainer.

Valcre's [published pricing](https://www.valcre.com/pricing/) shows $4,170 a month for ten Professional users, or $50,040 for twelve months before implementation. The visible page does not label the currency. Checked 2026-10-31. This is a vendor price example, not a customer invoice.

The free base covers a sales-comparison workfile. It does not bundle vendor market datasets, mobile capture, Word/Excel linking, income or DCF models. An authorised valuer selects sources and adjustments, records the conclusion and approves any final report. This is not an automated valuation or a certified Valcre replacement.

## Quick start

Node 20 or newer. No database installation is needed for the local PGlite mode.

```bash
npm install
npm run demo
node scripts/appraisal.mjs work-in-hand
node scripts/appraisal.mjs insights
npm run view
npm run docs
npm test
```

Demo data is fictional. Open this folder in Claude Code, Codex, OpenCode or Cursor. Start with /work-in-hand. All runtimes share .claude/commands/.

For your own records, use a separate empty DATA_DIR or set DATABASE_URL to your private PostgreSQL database and run npm run migrate. Do not seed production. Protect credentials and source files. Demo seed refuses hosted databases and any database with operational history.

## Weekly work

| Command | Job |
|---|---|
| /properties | Read the property register and interests. |
| /assignments | Read assignment owners, due dates and status. |
| /comparables | Read the comparable sales library. |
| /work-in-hand | Plan the open appraisal work and due dates. |
| /attention | Find overdue assignments and evidence gaps. |
| /inspection-plan | Prepare the inspection list from missing inspection records. |
| /compliance | Check the workfile evidence against the documented rules. |
| /comp-check | Review selected sales for source, date, type and currency issues. |
| /review-queue | See which workfiles need peer review or have changed since review. |
| /review-ready | Read complete workfiles with a current peer review. |
| /indications | Compare the valuer conclusion with weighted sale indications. |
| /imports | Read imported source batches. |
| /show | Read one complete record before an action. |
| /history | Read the attributed history of an assignment. |
| /insights | Answer ten questions from current workfile records. |
| /add-property | Register a property from checked evidence. |
| /add | Register an appraisal instruction. |
| /add-comp | Register a comparable sale from evidence the valuer can use. |
| /link-comp | Select a comparable, its adjustment and relative weight for one assignment. |
| /scope | Record agreed instructions, basis, users, assumptions and conflict evidence. |
| /inspect | Record a completed inspection and its evidence reference. |
| /evidence | Append an evidence reference and note. |
| /conclude | Record a conclusion and rationale supplied by the authorised valuer. |
| /review | Record a peer review supplied by a different person from the valuer. |
| /close | Close a clear and reviewed workfile. This does not issue a report. |
| /reopen | Reopen a closed workfile for a recorded reason and invalidate its review. |
| /log | Append an internal note. |
| /import | Preview and import one Valcre CSV with explicit mapping. |
| /export | Write a portable record copy to a new file. |
| /draft-engagement | Draft an internal engagement scope from the recorded instructions. |
| /weekly-review | Monday review from work in hand, comparable checks and review queue. |
| /customise | Add a field or change a local control through a tested migration. |
| /new-view | Add a branded read-only report. |

30 CLI commands and 33 workflow commands. See [CLI reference](docs/cli.md). Partial IDs and names work when unambiguous; multiple matches list candidates and exit 1. Every mutation records a named actor.

## Ten questions to ask

The insights command answers these from current data. They are included reports, not claims that Valcre cannot provide equivalent custom reporting.

1. Which overdue jobs still have evidence gaps?
2. Which valuers carry the most open work?
3. Which selected sales were unverified?
4. Which selected sales postdate the valuation?
5. Which selections mix currencies or property types?
6. Which assignments still need an inspection?
7. Which valuations differ most from the weighted sales indication?
8. Which client has the most overdue assignments?
9. Which reviews became stale after evidence changed?
10. Which jobs are complete and have a current peer review?

## Bring your history

Valcre documents CSV exports. Import properties, jobs and sales from those exports with explicit header mapping and a test run first. Each file takes one command. [The switching guide](docs/replace-valcre.md) covers units, dates, omitted attachments and reconciliation. Synthetic examples are labelled as fixtures. Original rows remain in an append-only import batch. Repeated batches skip; conflicting records fail; partial files roll back.

## Evidence and review

Checks flag incomplete scope, missing title and inspection references, unsupported conclusions and incompatible sales. Two verified sales and a one-year recency check are local demo policies, not valuation standards. [Compliance sources and limits](docs/compliance.md) identify the relevant IVSC topics. A different named reviewer must record a clear review. Changed evidence makes it stale.

The comparison indication weights adjusted sale rates per square metre. It never mixes currencies or accepts unverified, later or different-type sales in the indication. The valuer's conclusion remains separate, with variance shown.

## Documents and views

npm run docs creates draft workfiles and peer-review memoranda. /draft-engagement writes an internal draft scope in drafts/. npm run view creates three read-only reports. Change business_name, logo_path and colours in brand.json. Nothing sends or issues a signed report. [Why no front end](docs/why-no-front-end.md) states what a screen and vendor data services add.

## Your first hour: ten things to ask for

1. Put our business name and colours on the workfile.
2. Register a property and the interest valued.
3. Record the client's instructions and intended users.
4. Add two verified comparable sales we have rights to use.
5. Select their weights and adjustments with reasons.
6. Record the inspection and title references.
7. Show the indication alongside the valuer's own conclusion.
8. Show overdue jobs by valuer and client.
9. Draft the workfile for another valuer to review.
10. Add our office code with a tested migration.

## Access and records

Trusted operators only, one database per practice. RLS is enabled without public policies on every domain table. A database owner can bypass application checks, so this is not a multi-user permissions service. Actor names are attribution, not identity verification. Append-only evidence, reviews, imports and events resist ordinary updates, not administrator tampering. Workfile references do not contain original documents. Secure those originals separately.

Export includes all records and history in JSON. It is not a backup restore tool. Use native database backups and test recovery. HTML escapes record text. No customer data or secrets ship here.

npm test uses temporary storage and exercises all CLI commands, validation failures, rollback and generated documents. [Verification](docs/verification.md) records platforms actually run.

MIT. Valcre is its owner's trademark. This project is independent of Valcre.
