import React from 'react';
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib';

export interface ForwardRefButtonProps
  extends React.ComponentProps<"button">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Custom Button wrapper that properly forwards refs for use with Radix UI components
 * like Tooltip, Slot, etc. This wrapper replicates ShadCN Button functionality
 * while adding proper ref forwarding support.
 *
 * Created to resolve React forwardRef warnings when using Button with Tooltip components.
 * Following the project guideline of never modifying ShadCN components directly.
 */
export const ForwardRefButton = React.forwardRef<
  HTMLButtonElement,
  ForwardRefButtonProps
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
});

ForwardRefButton.displayName = "ForwardRefButton";