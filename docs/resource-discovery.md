# Manual discovery and review

This provides a repeatable human workflow for the Guild’s discovery requirement. It is not a scheduled crawler, verified data feed, or authorization to copy another organization’s dataset.

## Discovery prompt

> Find up to five publicly documented East Bay resources related to [trees / rain gardens / food growing / native plants / permeable surfaces]. Prefer official project, library, municipal, educational, or nonprofit websites. For each candidate, return a stable proposed ID, name, city, category, brief original summary, participation URL, public source URL, explicit access and age requirements if published, and the date checked. State uncertainty. Distinguish a learning or supporting resource from a site that actually implements a practice. Do not infer volunteer availability, partnership, or ecological performance. Do not include a private residence’s precise address or coordinates. Do not submit forms or contact anyone.

## Review

1. Open the primary source and confirm that the candidate and participation link exist.
2. Check the source for site-specific access, appointment, fee, age, and lending requirements. Link to current rules rather than duplicating schedules likely to change.
3. Write an original short description. Confirm permission before importing a partner’s dataset or copying protected content.
4. Use a map point only for a clearly public destination. Record coordinates as approximate; do not guess a private location. Online or arranged private resources remain unplotted.
5. Mark it `source-checked`, with the date and publisher. Steward confirmation, if later obtained, needs separate evidence and ownership.
6. Have the designated reviewer check the proposed record before adding it to `src/data/resources.ts`.
7. Rebuild the readable pages and JSON. Follow the team’s agreed publishing process when deployment is authorized.

For an existing record, use the app’s correction flow to demonstrate the proposed change. Local approval and JSON export do not publish anything. A production flow needs assigned review responsibilities and a shared, authenticated backend or the Guild’s chosen contribution process.

## Suggested record

```json
{
  "id": "stable-public-resource-id",
  "name": "Provider's public resource name",
  "city": "Oakland",
  "neighborhood": "Public neighborhood",
  "category": "Learning",
  "description": "An original, short, factual description.",
  "access": "What the primary source actually says about taking part.",
  "practices": ["native"],
  "action": "Explore the provider's information",
  "url": "https://provider.example/participate",
  "sourceUrl": "https://provider.example/resource",
  "sourcePublisher": "The provider",
  "checkedAt": "YYYY-MM-DD",
  "status": "source-checked"
}
```

Add `address` and `coordinates` only for a verified public destination. The source-check date describes an actual check; it should not be advanced merely because a build or local review ran.
