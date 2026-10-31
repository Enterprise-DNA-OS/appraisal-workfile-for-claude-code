# /review

Record a peer review supplied by a different person from the valuer.

Read the affected record first. Use the operator's supplied values and named actor. Example values below are placeholders, never facts to insert. If a name is ambiguous, list candidates and ask for the intended record. Never make a valuation judgement or sign-off on behalf of a person. A clear machine check is not professional approval.

```bash
node scripts/appraisal.mjs review JOB-004 --reference=review-ref --note="Reviewer supplied finding" --actor="Peer reviewer"
```

Add --json for machine-readable output. Present the result in this chat. Nothing sends, signs or publishes.
