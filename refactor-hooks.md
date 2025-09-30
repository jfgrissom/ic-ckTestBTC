### Analysis

1.  **`CLAUDE.md` Review:** The documentation is very clear and strict.
    *   **Hook Location:** All custom hooks MUST be located in `src/frontend/src/hooks/`. The document explicitly designates this directory for state management, side effects, and orchestrating service layer calls.
    *   **File Structure:** The `use-modals` hook suggests a `kebab-case` directory name for each hook or group of related hooks, with the logic inside an `index.ts` file (e.g., `src/hooks/use-feature/index.ts`).
    *   **Separation of Concerns:** There's a strong mandate to separate UI (components), business logic (hooks), and connectivity (services). Context providers are for providing context, but the hooks that consume them should be in the hooks directory.

2.  **Codebase Search:** I've identified several custom hooks defined outside the `src/frontend/src/hooks/` directory, primarily within `src/frontend/src/contexts/`.

    *   **`src/frontend/src/contexts/error-context.tsx`**:
        *   `useError`
    *   **`src/frontend/src/contexts/modal-context/index.tsx`**:
        *   `useModalContext` (This is already being re-exported by `src/frontend/src/hooks/use-modals`, but its definition is in the wrong place).
    *   **`src/frontend/src/contexts/wallet-context/index.tsx`**:
        *   `useWalletContext`
    *   **`src/frontend/src/contexts/wallet-context/hooks.ts`**: This file contains a large number of hooks that should be relocated.
        *   `useWalletState`
        *   `useWalletActions`
        *   `useWalletBalance`
        *   `useTransactions`
        *   `useTransfers`
        *   `useTransferCapabilities`
        *   `useDepositWithdrawal`
        *   `useFaucet`
        *   `useAuthentication`

### Refactoring Plan

This plan will align the codebase with the established architectural standards.

1.  **Consolidate Wallet Hooks:**
    *   Create a new directory: `src/frontend/src/hooks/use-wallet/`.
    *   Create a new file: `src/frontend/src/hooks/use-wallet/index.ts`.
    *   Move all hooks from `src/frontend/src/contexts/wallet-context/hooks.ts` into this new file.
    *   Move the `useWalletContext` hook definition from `src/frontend/src/contexts/wallet-context/index.tsx` into this new file as well. It will be a non-exported, internal hook used by the other wallet hooks.
    *   Update the `WalletProvider` to import `useWalletContext` from the new location if needed, or more likely, just have the new hooks import the `WalletContext` directly from the provider file.

2.  **Relocate Modal Hook Definition:**
    *   The file `src/frontend/src/hooks/use-modals/index.ts` already exists.
    *   Move the definition of `useModalContext` from `src/frontend/src/contexts/modal-context/index.tsx` into `src/frontend/src/hooks/use-modals/index.ts`.
    *   The `ModalProvider` will then import the `ModalContext` from its own file, and the `useModals` hook will import and use that context.

3.  **Relocate Error Hook:**
    *   Create a new directory: `src/frontend/src/hooks/use-error/`.
    *   Create a new file: `src/frontend/src/hooks/use-error/index.ts`.
    *   Move the `useError` hook definition from `src/frontend/src/contexts/error-context.tsx` into this new file.
    *   The `ErrorProvider` will import the `ErrorContext` from its own file, and the `useError` hook will import and use that context.

4.  **Update Imports Globally:**
    *   After moving the hooks, perform a global search and replace to update all import paths across the application to point to the new locations under `@/hooks/`. For example, any component using `useWalletBalance` would change its import to `import { useWalletBalance } from '@/hooks/use-wallet';`.
