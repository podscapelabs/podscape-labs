# Leaf Ledger V1 — canonical field ownership and forward-compatibility

## Principle
A species fact has **one canonical stored field** and **one detailed home**. It may also appear in Basic Care or the species hero as a short at-a-glance summary. Widgets never copy or persist a second value.

## Current research fact owners

| Canonical owner | Fields |
| --- | --- |
| Identity & Taxonomy | Common/scientific name, genus, species, morph, taxonomic status, synonyms, native distribution, captive morph origin, identification/lookalikes, adult size, lifespan |
| Habitat & Setup | Natural microhabitat, substrate composition (existing overview field, rendered in Habitat & Setup), substrate depth, enclosure setup guidance |
| Moisture & Humidity | Broad moisture tendency / reviewed ordinal substrate gradient, RH bounds, moist-area floor coverage, moist refuge dampness, moisture gradient guidance |
| Feeding & Nutrition | Staple diet, protein guidance, calcium guidance, dietary cautions, legacy feeding overview only as fallback when structured nutrition has not yet been reviewed |
| Behaviour & Ecology | Defensive behaviour, activity & visibility notes, bioactive suitability |
| Breeding & Development | Brood average and observed range, brooding duration, maturity age, breeding season |
| Research & Sources | Original source URLs, evidence scope, quality basis, claim-to-source notes, last reviewed |
| Notable Traits | Up to five characteristics identified by stable canonical trait IDs for future comparisons |
| Basic Care & Behaviour | Care level, preferred temperature, ventilation, activity classification, reproduction classification; lightweight overview, not a second detailed description |
| Species About | One concise original narrative about the specimen; never a second care guide |

**Deliberate at-a-glance overlap:** Reproduction/activity labels may be summarized in Basic Care and species-specific traits may be visible in hero chips. These share source fields. Breeding details do not repeat the reproduction label; taxonomy does not repeat natural microhabitat; habitat does not repeat the moisture guidance; nutrition does not repeat defensive behaviour. The old aggregate Advanced Care widget is retired. The old standalone Feeding and Habitat widgets are shown only when their structured specialist equivalents are unavailable; existing source text is not erased.

## Deprecated fields and migration

Never delete source data solely to reduce the field count. Current old keys include `summary`, `moisture`, `moistureNote`, `activityNote`, `feedingResponse`, and `feedingResponseNote`. Keep them available for historical reads until migration is verified. They are not new research tasks.

- `summary`: use About to auto-generate catalogue extracts; preserve previous legacy summary if About empty.
- `moistureNote` → `moistureGradientGuidance` **only after an editorial relevance review**. An older generic moisture note may not be valid gradient guidance.
- `activityNote` → `visibilityNotes` after review.
- `feedingResponse` / `feedingResponseNote`: do **not** translate generic eager feeding into protein appetite without new evidence.
- `moisture`: do not derive RH or whole-enclosure moisture percentage from this general legacy label.
- `moistureProfile` is a broad legacy editorial approximation; more reviewed ordinal fields should take display precedence.

## Rules for all future species imports

1. **Preserve existing values by default.** Populate empty fields; do not automatically replace facts, identity, photos, status or layout. Keep changes in edit state until owner saves.
2. **Update by import or migration.** If a truly new field is introduced, register it once in `lib/species-research-fields.ts`, add its optional storage type, import validation and UI widget mapping. Existing records omit the field safely; populate them through future Quick Imports or a reviewable batch backfill, never by reopening all records manually.
3. **Never invent data to fill a box.** An absent metric remains blank. Do not silently infer morph-specific numbers from species-level research.
4. **Each new field needs a single owner, unit or controlled vocabulary where useful, evidence note and a comparison rule.** Comparison traits require stable canonical IDs; owner custom tags are not comparable until curated.
5. **Do not require research fields for publication.** The original 20 species records stay usable during enrichment.
6. **Do not confuse scientific fact with keeper recommendation.** Label ranges, measured brood statistics and breeder observations appropriately.
7. **Only add new fields if a concrete use case cannot be expressed faithfully through existing ones.** Adding a widget or changing the layout should not add stored fields.

## Potentially low-value information kept as optional

Lifespan, breeding season, brood minimum/maximum, RH percentages, substrate depth, and exact moist-zone coverage can be rare or unsupported in hobby sources. Keep optional rather than forcing speculation or discarding future scientific utility. Source/evidence data must remain even though it is not everyday keeper-facing information.

## Audit guarantee
The original data model keeps 75 storage keys including system metadata and legacy fields; **75 is not the required editorial form length**. The 33 research-field keys have unique editorial groups enforced in regression checks. No guarantee can eliminate every future unknown field; instead, additions are additive and importable, without manual per-record schema recreation.
