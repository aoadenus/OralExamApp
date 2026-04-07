# Content Audit Notes

## Source of Truth

- Primary business-rule source: `Stratos_BusinessRules.docx`.
- Primary ERD attribute/key source: `Mama_s_Little_Bakery_Management_System_ERD.pdf`, because it contains extractable ERD text and matches the 41-entity structure.
- Primary visual ERD source: `Group 8 Mama’s Little Bakery Management System ERD (1).pdf`, rendered to `public/erd/group8-erd.png` for visual practice.
- Excluded from relationship drills: Stratos rules 47 and 48, per the build instruction to use the technical specification with those rules removed.

## Decisions

- `Event` to `Catering` is modeled as `1:M` because `Stratos_BusinessRules.docx` says an event can have many catering orders and each catering order belongs to exactly one event. Earlier drafts may say at most one catering order, so the final Stratos rule is used.
- `Rating` is kept as a standalone lookup-style entity because the text-extractable ERD does not show `rating_id` in `Review`, and the final Stratos document lists Rating under standalone lookup entities rather than as one of the 46 retained relationship rules.
- `AllergyInfo` and `CustomerAllergyInfo` remain in `entities.json` and oral entity prompts, but rules 47 and 48 are not included in `relationships.json`.
- The Group 8 ERD PDF is image-only, so it is used for visual practice, while the text-extractable ERD PDF is used for seed data and hotspot-coordinate generation.

## Counts

- Domains: 6
- Entities: 41
- Relationship drill rules: 46
- Associative entities: 6
- Oral prompts: 55
- Visual ERD hotspots: 41
