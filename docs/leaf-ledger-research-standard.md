# PodScape Leaf Ledger · Research & Editorial Standard

**Purpose:** A compact, curated species reference, backed by transparent research. Keep the default dashboard concise; deeper facts are optional and customizable.

## Source evaluation
1. Start with accepted taxonomy: scientific articles, original descriptions, recognized taxonomic databases and identification keys. Species identity is not established by trade listings alone.
2. Check specialized reference collections, including **https://isopod.site/**, while verifying their attribution and taxonomic context. Do not reproduce photographs without permission.
3. Compare multiple independent specialist isopod sellers and experienced breeders **across different regions**. A shared care-sheet claim or distributor description is one claim, not several independent confirmations.
4. Separate captive husbandry recommendations from experimentally measured biology; record disagreements instead of manufacturing numerical precision.
5. Only enter data actually supported for the specific species or morph. Species-level brood statistics can support a morph profile **only when clearly labelled species-level**.
6. External facts and numeric ranges need source URLs and field-to-source notes. Use `researchSources` (one full URL per line), `evidenceScope`, `evidenceQuality`, and `evidenceNotes` to attribute **which field** relies on which source. Where contradictory, state the uncertainty.
7. The public profile must not expose internal keeper notes. All public sources are editorial choices; avoid misleading claims of verification from a mere URL.

## The three moisture measures are distinct
- **Relative humidity (RH, %)**: water vapour in enclosure air; specify a researched lower and upper percentage when supportable. Do not derive from other moisture measures.
- **Moist-zone coverage (% of floor area)**: approximate recommended portion of the enclosure with a damp retreat. This is not the percent of substrate water content.
- **Moist-refuge substrate condition**: Lightly damp / Moist / Very moist. Applies to the refuge **only**, never automatically to the whole bin. “Drier” does not mean bone-dry and “very moist” does not mean saturated.

## Reproduction
- **Reproduction rate** (Slow / Moderate / Fast / Prolific) is an editorial husbandry tendency, not a scientifically measurable average of subjective seller labels.
- **Average brood size**, **observed brood range**, incubation and maturity are independent variables. Preserve sample/population conditions and whether measurements are morph-specific or species-wide.

## Quick Import contract
- Enter one JSON object with keys matching the editable fields. Empty or unknown values may be omitted; unknown keys are ignored.
- Each researched numeric property uses its own unit: `adultSizeMm` mm; `humidityMin`, `humidityMax`, `moistZoneCoverage` integer percentages; `broodAverage`, `broodMin`, `broodMax` counts.
- For source audit include `researchSources` with full URLs separated by newlines, and `evidenceNotes` explaining each relevant field's origin. Generic source links without claim mapping are insufficient for high-confidence labels.
- Imports never modify identity verification, publication, catalogue number, slug, photos, or record IDs.
- Human review of all values is mandatory. Publishing requires a separate conscious save and publication decision.

## Research status
Unverified/unavailable information remains blank. No default percentage, average brood, lifespan, moisture fraction, or care recommendation is invented for visual completeness.
