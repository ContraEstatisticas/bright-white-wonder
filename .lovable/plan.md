

## Problem Analysis

The `jessicamiller@educly.app` account is fully set up: email confirmed, `is_premium = true`, 3 active products. The data is correct. The problem is **systematic** and affects multiple users. After investigating the login flow, I found two root causes:

### Root Cause 1: Double premium check blocks valid users

The login flow in `Auth.tsx` (lines 163-191) performs a **redundant premium check** immediately after `signInWithPassword`. If this RPC call fails (network timeout, transient error), it **signs the user OUT** and shows "Sem servico ativo" even though the user has valid access. The `PremiumGuard` component already does the same check with retry logic on every protected page, making this duplicate check unnecessary and harmful.

### Root Cause 2: Confusing error messages

When `signInWithPassword` fails (wrong password), the error dialog shows "No pudimos encontrar tu cuenta" / "Não localizamos a sua conta" — which makes users think their account doesn't exist. Supabase returns the same error for wrong password AND non-existent account, but the message should guide users toward password reset instead of implying the account is missing.

Additionally, the "Forgot Password" button is hidden for "noService" errors (line 738: `loginErrorType !== "noService"`), so users stuck in that flow have no escape route.

## Plan

### 1. Remove redundant premium check from login flow (`src/pages/Auth.tsx`)

Delete lines 161-191 (the entire `check_premium_access` block after login). After successful `signInWithPassword` + billing reconciliation, navigate directly to `/dashboard`. Let `PremiumGuard` handle access control — that's its job.

This eliminates false "noService" errors caused by transient RPC failures during login.

### 2. Improve error messages and dialogs (`src/pages/Auth.tsx`)

- Change "invalid" login error title/description from "No encontramos tu cuenta" to "Email o contraseña incorrectos" with guidance to reset password
- Show the "Forgot Password" button for ALL error types (remove the `loginErrorType !== "noService"` condition on line 738)
- Add a "Forgot Password" button in the "noService" dialog footer as well, since users might have the right password but their access isn't recognized

### 3. Add console logging for debugging

Add `console.log` statements at key points in the login flow so future issues are diagnosable without guessing:
- Log the normalized email being used
- Log signInWithPassword success/failure
- Log billing reconciliation result

### Summary of changes

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Remove premium check from login, improve error messages, show reset button always |

