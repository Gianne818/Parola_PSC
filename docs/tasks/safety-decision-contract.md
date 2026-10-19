# SON-03 / SAFE-03: isolated safety decision

Selected by Son on October 19, 2026. `lib/safety-decision.ts` combines already
validated, area-specific wind, wave and official-warning classifications. It
returns `NORMAL`, `SUPPRESSED_WEATHER_HAZARD` or `UNKNOWN`, a stable reason,
whether fishing guidance is actionable, and the reviewed rule version when used.

- A current, applicable validated hazard suppresses fishing guidance even if
  another source is missing. This supports a warning-only decision without a
  prediction or target coordinates.
- `NORMAL` requires a vessel class, reviewed rule version and current validated
  clear evidence for all three required inputs. Each classification must match
  that vessel and rule version. Missing, stale, unverified, wrongly scoped or
  contradictory local evidence yields `UNKNOWN`, even alongside clear records.
- Evidence validity is start-inclusive and end-exclusive. Each kind has an
  explicit unit, and timestamps require real calendar dates and valid clocks.
  No numeric threshold or vessel-specific policy is invented.

Independent validated official hazards may explicitly use `vesselClass=null`
to indicate all-vessel applicability. Such hazards survive missing rule/vessel
metadata; a warning limited to one vessel is not applied to another. Clear
classifications always require exact context. Returned rule metadata is null
when an independent warning, rather than the requested numeric rule, caused
suppression. These classifications and context are trusted backend inputs, not
client attestations or proof that a named rule is actually approved.

This is a backend combination contract and fixture-tested portion, not an active
provider, database or dispatch integration. The repository's baseline advisory CHECK
only permits `NORMAL` and `SUPPRESSED_WEATHER_HAZARD`; do not persist `UNKNOWN`
there or treat its default `NORMAL` as proof. Before live use, inspect deployed
schema, agree on Toby-validated units, rules, freshness and area matching, add a
reviewed versioned decision store and connect query/SMS/export enforcement.
Independent official warnings must remain eligible during model failure. Tier
can consume the eventual status/reason/validity response without owning these
backend decisions. No SMS, paid provider, production DB operation or deployment
is part of this portion.

Recheck: 26 focused tests pass, including vessel/rule mismatch, malformed dates,
invalid local evidence beside clear readings and independent warning precedence.
