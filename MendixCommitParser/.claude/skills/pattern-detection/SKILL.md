# Pattern Detection Skill
## Recognize common Mendix change patterns

---

## Purpose

Given a set of file changes, detect common development patterns.

---

## Patterns to Learn (examples)

| Pattern | Indicators |
|---|---|
| Domain model refactor | Multiple Domain entities modified, no UI changes |
| UI update | Pages modified, possibly microflows, no domain changes |
| New feature | Added pages, added microflows, added domain entities |
| Bugfix | Few files modified, often microflows or pages, branch name contains "fix" |
| API integration | Java actions added, constants modified, microflows added |

---

## Training Data

For each commit in the training set, manually label the pattern (or infer from branch name or commit message if available).

---

## Output

Structured field:
`detectedPattern: "DomainRefactor" | "UIUpdate" | "NewFeature" | "Bugfix" | "APIIntegration" | "Unknown"`
