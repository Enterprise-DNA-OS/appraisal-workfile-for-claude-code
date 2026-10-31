# Appraisal Workfile for Claude Code

Read records before acting. This system is for trusted valuation-practice operators. Fill in your business, authorised valuers and scope before using real records. Demo facts are fictional.

## One command library

| Ask | Command |
|---|---|
| Read the property register and interests. | /properties |
| Read assignment owners, due dates and status. | /assignments |
| Read the comparable sales library. | /comparables |
| Plan the open appraisal work and due dates. | /work-in-hand |
| Find overdue assignments and evidence gaps. | /attention |
| Prepare the inspection list from missing inspection records. | /inspection-plan |
| Check the workfile evidence against the documented rules. | /compliance |
| Review selected sales for source, date, type and currency issues. | /comp-check |
| See which workfiles need peer review or have changed since review. | /review-queue |
| Read complete workfiles with a current peer review. | /review-ready |
| Compare the valuer conclusion with weighted sale indications. | /indications |
| Read imported source batches. | /imports |
| Read one complete record before an action. | /show |
| Read the attributed history of an assignment. | /history |
| Answer ten questions from current workfile records. | /insights |
| Register a property from checked evidence. | /add-property |
| Register an appraisal instruction. | /add |
| Register a comparable sale from evidence the valuer can use. | /add-comp |
| Select a comparable, its adjustment and relative weight for one assignment. | /link-comp |
| Record agreed instructions, basis, users, assumptions and conflict evidence. | /scope |
| Record a completed inspection and its evidence reference. | /inspect |
| Append an evidence reference and note. | /evidence |
| Record a conclusion and rationale supplied by the authorised valuer. | /conclude |
| Record a peer review supplied by a different person from the valuer. | /review |
| Close a clear and reviewed workfile. This does not issue a report. | /close |
| Reopen a closed workfile for a recorded reason and invalidate its review. | /reopen |
| Append an internal note. | /log |
| Preview and import one Valcre CSV with explicit mapping. | /import |
| Write a portable record copy to a new file. | /export |
| Draft an internal engagement scope from the recorded instructions. | /draft-engagement |
| Monday review | /weekly-review |
| Change a field or local rule | /customise |
| Add a read-only report | /new-view |

## Rules

Use scripts/appraisal.mjs. All mutations need --actor and append history. Never invent professional judgement, comparable verification, an inspection, a client instruction or a peer review. Read docs/compliance.md before discussing compliance. Names identify the source of a statement, not an authenticated person.

Draft to drafts/. Nothing sends, signs, pays or publishes. No deletion command exists. Close completed workfiles and reopen with a reason. Never hide a gap to make review pass. Imported jobs start active and unreviewed. Preserve original source files and their licences.

Use one private database per practice. Do not expose database credentials or a database owner connection to untrusted users. Native backup and recovery are separate from export. Keep files out of git. Never run demo seed on an operated database.

Run npm test after code changes. Apply new migrations in sequence. The code works with PostgreSQL or the local PGlite database. Every report is a read-only snapshot. Real opinions and client issue remain the authorised valuer's responsibility.

Omni by Enterprise DNA: https://enterprisedna.co/omni/instead-of/valcre
