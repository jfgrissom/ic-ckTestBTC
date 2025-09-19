# Code Review Checklist & Quality Gate Mechanisms

## Overview

This document provides comprehensive code review guidelines and quality gate mechanisms to enforce the four-layer architecture classification and prevent violations across the codebase.

## Pre-Review Architecture Classification

### MANDATORY: Layer Classification Check

Before reviewing ANY code, classify all new/modified functionality:

#### 🎨 **PRESENTATION LOGIC (Components Only)**
```markdown
✅ ALLOWED:
- JSX rendering and UI composition
- User interaction handling (onClick, onChange, onSubmit)
- Local UI state (modals open/closed, hover, focus states)
- Visual feedback and animations
- Event delegation to parent components via props
- Conditional rendering based on props

❌ FORBIDDEN:
- API calls or data fetching (fetch, axios, backend actor calls)
- Business calculations (fees, balances, conversions, formatting)
- Validation logic beyond "field not empty" checks
- Amount conversions or mathematical operations
- Data transformation or processing
- Complex state management with multiple useState/useMemo
- Direct backend communication
```

#### 🧠 **BUSINESS LOGIC (Hooks + Services)**
```markdown
✅ ALLOWED:
- Data processing and transformations
- Domain calculations (fees, conversions, balances)
- Workflow orchestration and complex state management
- Transaction preparation and formatting
- Data aggregation and statistics

❌ FORBIDDEN:
- UI rendering or JSX elements
- Direct DOM manipulation
- Component-specific styling or layout
- Event handler implementations for UI
```

#### ✅ **VALIDATION LOGIC (Shared Layer: @/lib/utils/validators/)**
```markdown
✅ ALLOWED:
- Input sanitization and constraint checking
- Business rule enforcement
- Data integrity verification
- Security validation (address formats, amount limits)
- Cross-field validation dependencies

❌ FORBIDDEN:
- Business calculations or transformations
- API communication or external calls
- UI rendering or presentation logic
- Complex workflow orchestration
```

#### 🔌 **CONNECTIVITY LOGIC (Services Only)**
```markdown
✅ ALLOWED:
- Backend actor management and canister calls
- API communication and HTTP requests
- Network error handling and retry logic
- Data serialization/deserialization for external systems

❌ FORBIDDEN:
- Business calculations or domain logic
- Input validation or sanitization
- UI rendering or presentation logic
- Complex data processing beyond serialization
```

## Code Review Quality Gates

### BLOCKING VIOLATIONS (Fail Review Immediately)

#### 🚨 **SEVERE VIOLATIONS** - Immediate Build Failure
```markdown
❌ Business logic found in React components:
   - Mathematical operations (*, +, -, /, %)
   - Fee calculations, balance transformations
   - Amount formatting or conversion
   - Complex conditional business rules

❌ API calls in components or hooks (non-service):
   - fetch(), axios, or backend actor calls
   - Direct canister communication
   - External API integration

❌ Validation logic scattered outside shared layer:
   - Inline validation in components
   - Validation logic in business hooks
   - Duplicate validation patterns
```

#### ⚠️ **HIGH PRIORITY VIOLATIONS** - Require Immediate Fix
```markdown
❌ Complex state management in components:
   - Multiple useState hooks for business data
   - useEffect for data fetching in components
   - Business logic mixed with UI logic

❌ Presentation logic in hooks/services:
   - JSX elements returned from hooks
   - UI-specific formatting in services
   - Component-specific logic in business layer
```

#### 📋 **MODERATE VIOLATIONS** - Must Fix Before Merge
```markdown
❌ Validation duplication:
   - Same validation logic in multiple files
   - Business rules not using shared validators
   - Inconsistent validation patterns

❌ Layer boundary violations:
   - Business logic calling presentation functions
   - Connectivity mixed with business calculations
   - Validation embedded in connectivity layer
```

### Review Process by File Type

#### React Component Files (*.tsx)
```markdown
1. **Presentation Logic Verification**
   - [ ] Component only contains JSX and UI logic
   - [ ] All business logic delegated via props or hooks
   - [ ] No mathematical operations or calculations
   - [ ] No API calls or external communication
   - [ ] No validation logic beyond empty checks

2. **Prop Interface Review**
   - [ ] Clear separation between data props and action props
   - [ ] All business actions delegated via callback props
   - [ ] No complex business types embedded in props

3. **State Management Review**
   - [ ] Only UI state in component (loading, open/closed, etc.)
   - [ ] No business data stored in component state
   - [ ] No complex useEffect patterns for data fetching

BLOCKING PATTERNS:
- calculateFee, processTransaction, validateAmount functions
- fetch(), axios, actor.* calls
- Complex business calculations in render methods
- Validation regex or business rules
```

#### Hook Files (*.ts in hooks/)
```markdown
1. **Business Logic Verification**
   - [ ] Contains domain logic and state orchestration
   - [ ] Delegates validation to shared validators
   - [ ] Delegates connectivity to services
   - [ ] No presentation logic or JSX elements

2. **Service Integration Review**
   - [ ] Uses service functions for external communication
   - [ ] Proper error handling and state management
   - [ ] Clean separation from connectivity concerns

3. **Validation Integration Review**
   - [ ] Uses shared validation layer functions
   - [ ] No inline validation or business rules
   - [ ] Consistent validation patterns

BLOCKING PATTERNS:
- JSX elements or React components returned
- Direct fetch() or API calls (should use services)
- Inline validation logic (should use shared validators)
- UI-specific formatting or rendering logic
```

#### Service Files (*.service.ts)
```markdown
1. **Connectivity Logic Verification**
   - [ ] Handles external communication only
   - [ ] Proper error handling and retry logic
   - [ ] Data serialization for external systems
   - [ ] No business calculations or validations

2. **Error Handling Review**
   - [ ] Comprehensive error mapping
   - [ ] Proper error propagation patterns
   - [ ] Network failure handling

3. **Interface Design Review**
   - [ ] Clean functional interfaces
   - [ ] Proper separation from business logic
   - [ ] Consistent error handling patterns

BLOCKING PATTERNS:
- Business calculations or fee computations
- Validation logic or input sanitization
- UI-specific formatting or presentation logic
- Complex business workflows
```

#### Validation Files (validators/*)
```markdown
1. **Pure Function Verification**
   - [ ] Functions are pure with no side effects
   - [ ] No external API calls or business logic
   - [ ] Consistent validation patterns
   - [ ] Proper error message formatting

2. **Reusability Review**
   - [ ] Functions designed for reuse across layers
   - [ ] No layer-specific dependencies
   - [ ] Clear, focused validation purposes

3. **Business Rule Integration**
   - [ ] Business constraints properly encoded
   - [ ] Consistent validation patterns
   - [ ] No business calculations or transformations

BLOCKING PATTERNS:
- API calls or external communication
- Business calculations or data transformations
- UI-specific validation or formatting
- Side effects or state mutations
```

## Automated Quality Gate Scripts

### Pre-Commit Architecture Validation
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Fail on any violation
set -e

echo "🔍 Running architecture compliance checks..."

# Check for business logic in components
if grep -r "calculateFee\|processTransaction\|validateAmount" src/frontend/src/components/; then
    echo "❌ VIOLATION: Business logic found in components"
    exit 1
fi

# Check for API calls in components
if grep -r "fetch(\|axios\|actor\." src/frontend/src/components/; then
    echo "❌ VIOLATION: API calls found in components"
    exit 1
fi

# Check for validation logic outside shared layer
if grep -r "\.match(\|\.test(\|regex\|validation" src/frontend/src/components/ src/frontend/src/hooks/; then
    echo "❌ VIOLATION: Validation logic found outside shared layer"
    exit 1
fi

echo "✅ Architecture compliance checks passed"
```

### Build-Time Quality Gates
```bash
#!/bin/bash
# scripts/validate-architecture.sh

validate_layer_separation() {
    echo "🏗️ Validating layer separation..."

    # Component purity check
    local component_violations=$(find src/frontend/src/components -name "*.tsx" -exec grep -l "useState.*[A-Z]\|useEffect.*fetch\|calculate\|validate" {} \; | wc -l)
    if [ "$component_violations" -gt 0 ]; then
        echo "❌ $component_violations components contain business logic"
        exit 1
    fi

    # Hook presentation check
    local hook_violations=$(find src/frontend/src/hooks -name "*.ts" -exec grep -l "createElement\|JSX\|render" {} \; | wc -l)
    if [ "$hook_violations" -gt 0 ]; then
        echo "❌ $hook_violations hooks contain presentation logic"
        exit 1
    fi

    # Service business logic check
    local service_violations=$(find src/frontend/src/services -name "*.ts" -exec grep -l "calculate\|validate.*[A-Z]\|process.*[A-Z]" {} \; | wc -l)
    if [ "$service_violations" -gt 0 ]; then
        echo "❌ $service_violations services contain business logic"
        exit 1
    fi

    echo "✅ Layer separation validation passed"
}

validate_shared_validation_usage() {
    echo "🔍 Validating shared validation usage..."

    # Check that hooks use shared validators
    local validation_imports=$(grep -r "from.*validators" src/frontend/src/hooks/ | wc -l)
    local total_hooks=$(find src/frontend/src/hooks -name "*.ts" | wc -l)

    if [ "$validation_imports" -lt "$((total_hooks / 2))" ]; then
        echo "⚠️ WARNING: Low shared validation usage in hooks"
    fi

    echo "✅ Shared validation usage check completed"
}

main() {
    validate_layer_separation
    validate_shared_validation_usage
    echo "🎉 All architecture validations passed!"
}

main "$@"
```

## Review Checklist Templates

### Pull Request Review Template
```markdown
## Architecture Compliance Review

### Layer Classification Audit
- [ ] All modified components remain purely presentational
- [ ] All business logic properly placed in hooks/services
- [ ] All validation uses shared validation layer
- [ ] All external communication isolated in services

### Violation Scan Results
- [ ] No business logic found in components
- [ ] No API calls found in components or hooks
- [ ] No validation logic scattered outside shared layer
- [ ] No presentation logic in hooks or services

### Quality Gates
- [ ] Pre-commit hooks pass
- [ ] Build-time validation passes
- [ ] Architecture tests pass
- [ ] No architectural debt introduced

### Technical Debt Assessment
- [ ] No temporary violations introduced
- [ ] Existing patterns followed consistently
- [ ] Code ready for production deployment

## Reviewer Certification
By approving this PR, I certify that:
- All code follows four-layer architecture classification
- No architectural violations were introduced
- Quality gates pass successfully
- Code maintains project architectural standards
```

### Architecture-Specific Review Questions

#### For Component Changes
```markdown
1. Does this component contain any business calculations?
2. Are all user actions properly delegated via props?
3. Is state management limited to UI concerns only?
4. Are validation requirements handled via shared validators?
5. Is this component testable with mocked props?
```

#### For Hook Changes
```markdown
1. Does this hook contain any UI or presentation logic?
2. Are external API calls properly delegated to services?
3. Is validation handled via shared validation layer?
4. Is business logic properly separated from connectivity?
5. Can this hook be tested independently of UI?
```

#### For Service Changes
```markdown
1. Does this service contain any business calculations?
2. Is error handling comprehensive and properly structured?
3. Are external communications properly isolated?
4. Is data serialization the only transformation performed?
5. Can this service be tested with mocked external dependencies?
```

#### For Validation Changes
```markdown
1. Are these validation functions pure with no side effects?
2. Can these validators be reused across different layers?
3. Are business rules properly encoded without calculations?
4. Is error messaging consistent with existing patterns?
5. Are these validators testable in complete isolation?
```

## Escalation Procedures

### Violation Severity Levels

#### **Level 1: Critical Violations**
- Business logic in components
- API calls in components
- Block merge immediately, require architectural refactoring

#### **Level 2: High Priority Violations**
- Complex state management in components
- Validation logic outside shared layer
- Require fix before merge approval

#### **Level 3: Moderate Violations**
- Inconsistent patterns
- Minor validation duplication
- Create technical debt tickets, fix in follow-up

#### **Level 4: Low Priority Issues**
- Code style inconsistencies
- Minor optimization opportunities
- Address in future refactoring cycles

### Review Escalation Process
1. **Reviewer identifies violation** → Document severity and required changes
2. **Developer fixes violations** → Re-submit for architecture validation
3. **Persistent violations** → Escalate to Feature Management Specialist
4. **Architecture questions** → Consult React Frontend or Rust Backend Specialists
5. **Policy clarifications** → Update this checklist and inform all agents

## Success Metrics

### Violation Prevention
- **Zero Critical Violations**: No business logic in components
- **Zero API Violations**: No API calls outside services
- **Shared Validation Usage**: >90% of validation uses shared layer
- **Clean Layer Separation**: Each layer maintains single responsibility

### Review Efficiency
- **Review Time**: Average time to identify architectural issues
- **Fix Time**: Time from violation identification to resolution
- **Prevention Rate**: Percentage of violations caught in review vs production
- **Pattern Consistency**: Consistency of architectural patterns across codebase

This comprehensive review system ensures strict adherence to the four-layer architecture while providing clear guidance for developers and reviewers.