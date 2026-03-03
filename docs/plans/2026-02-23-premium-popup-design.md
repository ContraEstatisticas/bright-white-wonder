# Premium Access Popup Design

## Goal
Ensure the login popup for "conta sem premium" only appears when the premium-check RPC explicitly returns `false` (user lacks premium access), keeping transient RPC errors from blocking the user.

## Architecture
- Keep the existing client-side login flow in `src/pages/Auth.tsx`.
- After billing reconciliation, call `check_premium_access` and interpret the response as a tri-state: `true` permits the login, `false` triggers the popup/sign-out journey, and any RPC error is treated as a recovery path that simply logs the issue but lets the user proceed.
- The UI state (`loginErrorType`, `isLoginErrorDialogOpen`) should only flip to "noService" when RPC resolved successfully with `false`. All other cases keep the normal flow.

## Tech Stack
- React + TypeScript (client-side UI)
- Supabase RPC `check_premium_access`
- Existing dialog components and hooks in `src/pages/Auth.tsx`

---

## Approvals
- [ ] Product/UX sign-off requested
- [ ] Engineering sign-off requested
