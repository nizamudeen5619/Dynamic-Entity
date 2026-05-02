---
name: Default table visible columns reduced to 10
description: Reduced individual schema visible table columns from 16 to 10 for better UX
type: project
originSessionId: 0dfaffdd-1093-4c87-8f78-3c0c6ad5dc54
---
**Task**: Reduce default visible columns in list views to max 10 across employee/individual and organization entities

**Status**: Complete

**Changes**:

Individual Schema - Reduced from 16 to 10 visible columns
- Hidden (6 fields):
  - type (multiSelect)
  - companyName 
  - maritalStatus (personalDetails)
  - smoker (residentData)
  - elopementRisk (residentData)
  - ownGuardian (residentData)

- Kept visible (10 fields):
  1. individualNumber
  2. firstName
  3. lastName
  4. status
  5. jobTitle
  6. companyId
  7. roleName
  8. dateOfJoining (workDetails)
  9. employeeNumber (workDetails)
  10. employeeDepartment (workDetails)

Organization Schema - Already compliant
- Only 4 visible columns (name, status, defaultSelection in facilities, primaryPointOfContact)
- No changes needed

**File Modified**: `n:\Work\backup\Superpower-App\src\models\schemas\individual.schema.js`
