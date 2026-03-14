

## Problem

The preview is blank because of a **build error** in `src/pages/Auth.tsx`. The variable `user` is destructured twice in the same function scope:

- **Line 149**: `const { data: { user } } = await supabase.auth.getUser();` (inside billing reconciliation)
- **Line 164**: `const { data: { user } } = await supabase.auth.getUser();` (for the toast message)

This causes a duplicate variable declaration error that prevents the app from compiling.

## Fix

Remove the second `getUser()` call on line 164 and reuse the user data from the billing reconciliation block. Since line 149 is inside a try/catch, we need to hoist the variable so it's accessible outside:

1. Declare `let loggedInUser` before the try block
2. Assign it inside the try block from the existing `getUser()` call
3. Use `loggedInUser` in the toast on line 167

This is a one-file, ~5 line fix in `src/pages/Auth.tsx`.

