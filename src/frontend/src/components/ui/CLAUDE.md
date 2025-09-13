# ShadCN UI Components - Development Guidelines

This file provides guidance for working with ShadCN UI components in this project.

## Core Principle: NEVER MODIFY SHADCN COMPONENTS

**IMPORTANT**: ShadCN UI components in this directory should NEVER be modified directly. These are vendor components that should remain unchanged to ensure:

- Easy updates to newer ShadCN versions
- Consistency with ShadCN documentation and community solutions
- No conflicts during component updates
- Maintainability and predictability

## Instead: Create Custom Wrapper Components

When you need to extend or modify ShadCN component behavior:

1. **Create wrapper components** in `/src/components/common/` or appropriate feature directories
2. **Import and wrap** the ShadCN component inside your custom component
3. **Add your customizations** to the wrapper component
4. **Use your wrapper** throughout the application instead of the ShadCN component directly

## Examples

### ✅ CORRECT: Custom Button Wrapper
```tsx
// src/components/common/ForwardRefButton.tsx
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';

export const ForwardRefButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  ButtonProps
>(({ ...props }, ref) => {
  return <Button ref={ref} {...props} />;
});

ForwardRefButton.displayName = "ForwardRefButton";
```

### ❌ INCORRECT: Modifying ShadCN Component
```tsx
// DON'T DO THIS - Never modify button.tsx directly
function Button({ ... }, ref) {
  // Adding forwardRef here is wrong
}
export default React.forwardRef(Button);
```

## Current Component Status

All ShadCN components in this directory correctly import `cn` from `@/lib`. This is the only acceptable modification - updating import paths to match our project structure.

## Acceptable Changes to ShadCN Components

The ONLY acceptable changes to ShadCN components are:

1. **Import path corrections** - Updating import paths to match our project structure:
   ```tsx
   // ✅ Correct
   import { cn } from "@/lib"

   // ❌ Wrong (if it doesn't match our structure)
   import { cn } from "@/lib/utils"
   ```

2. **No other modifications** - Everything else should be handled via wrapper components.

## Component Extensions

When you need to extend ShadCN components:

- **Form components**: Create form-specific wrappers in `/src/components/forms/`
- **Feature-specific variants**: Create in relevant feature directories
- **General utilities**: Create in `/src/components/common/`
- **Complex compositions**: Create dedicated component files

## Best Practices

1. **Name wrapper components clearly** - Use descriptive names that indicate their purpose
2. **Forward refs when needed** - Use `React.forwardRef` for components that need ref access
3. **Preserve original props** - Ensure your wrapper accepts and forwards all original props
4. **Document wrapper purpose** - Add comments explaining why the wrapper exists
5. **Follow TypeScript patterns** - Properly type wrapper components with the original component's types

## Benefits of This Approach

- **Maintainable**: Easy to update ShadCN components without losing customizations
- **Traceable**: Clear separation between vendor code and custom code
- **Flexible**: Can create multiple variants of the same component
- **Consistent**: Follows React composition patterns
- **Safe**: No risk of breaking changes during updates

Remember: Composition over modification!