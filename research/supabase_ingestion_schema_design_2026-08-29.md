# Sports Genome Supabase Research-Ingestion Foundation

The first migration establishes **reference evidence and ingestion data only**. It does not move or alter any private athlete profiles, workout logs, authentication records, payments, or current application data. This avoids conflating athlete-specific observations with public/reference research.

| Layer | Purpose | Promotion rule |
|---|---|---|
| `import_batches` and `raw_imports` | Immutable intake ledger and original payload preservation | Never promoted; retained as lineage |
| `staging_*` | Screened and extracted candidates with per-dimension quality and validation state | Only explicit `valid` review may promote |
| Reference tables | Studies, populations, outcomes, norms, exercises, mappings, sports, and demands | No automatic write from raw or staging |
| `validation_errors` | Structured rejection, ambiguity, and repair trace | Resolved independently with audit note |

The schema uses UUID keys, normalized aliases, foreign keys, lineage back to raw imports, and partial unique indexes for DOI, PMID, OpenAlex, Semantic Scholar, raw-source identities, and raw content hashes. A deterministic `citation_fingerprint` gives the promotion workflow a stable title/author/year duplicate key without pretending missing identifiers exist.

All tables in the exposed `public` schema are created with RLS enabled and browser-role grants revoked. Ingestion is intended for server-side or connected-tool execution only. Any later athlete-facing reference API must receive its own scoped read policy after a separate security review. This follows Supabase’s guidance that tables in exposed schemas require RLS and least-privilege grants, while service/secret keys must remain server-only.[1][2]

## Initial migration scope

The migration is intentionally **not** seeded with scientific claims, percentile values, heuristic grades, or placeholder examples. It creates the relational structure needed to hold those values only when a source and extraction support them. In particular, a norm requires an exercise, a source study, a numerical value and unit, a percentile, and a retained source excerpt before it can reach reference storage.

## References

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase: Row Level Security"
[2]: https://supabase.com/docs/guides/database/secure-data "Supabase: Securing your data"
