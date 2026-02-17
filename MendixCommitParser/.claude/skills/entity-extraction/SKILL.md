# Entity Extraction Skill
## Extract Mendix entities from file paths

---

## Purpose

Given a Mendix project file path, identify:
- The module name
- The entity type (Domain, Page, Microflow, Resource, etc.)
- The entity name

---

## Patterns

| File Path Pattern | Module | Type | Name |
|---|---|---|---|
| `MyModule/Domain/Customer.mpr` | MyModule | Domain | Customer |
| `MyModule/Pages/CustomerDetail.mpr` | MyModule | Page | CustomerDetail |
| `MyModule/Microflows/ACT_SaveCustomer.mpr` | MyModule | Microflow | ACT_SaveCustomer |
| `MyModule/Resources/logo.png` | MyModule | Resource | logo.png |

---

## Edge Cases

- File in project root (no module) -> Module = "ProjectRoot"
- File with nested folders -> Use the deepest folder as context
- Unknown extension -> Type = "Unknown"

---

## Training Objective

Learn to:
1. Handle non-standard folder structures (custom module layouts)
2. Detect related entities (for example a Page and its backing Microflow)
3. Infer intent from naming conventions (for example `ACT_` prefix = action microflow)
