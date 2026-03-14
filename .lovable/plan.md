

## Problem

The `src/integrations/supabase/types.ts` file was auto-generated with empty `Tables` (` [_ in never]: never`), meaning TypeScript doesn't know about any of the existing database tables. This causes 50+ build errors wherever the codebase references tables like `profiles`, `user_streaks`, `billing_event_logs`, etc.

## Root Cause

When the Supabase project was connected, the types file was created without pulling the actual schema. The database has 30+ tables, but the types file only has the `get_user_certificates` function and the `ai_tool_category` enum.

## Fix

Run a no-op database migration (e.g., a comment-only SQL statement) to trigger the automatic type regeneration pipeline. This will pull the full schema from the connected Supabase project and regenerate `types.ts` with all tables, views, functions, and enums properly typed.

This single action will resolve all 50+ TypeScript errors at once without touching any application code.

## Steps

1. Execute a trivial migration like `SELECT 1;` using the migration tool
2. The system will automatically regenerate `types.ts` from the live database schema
3. All table references (`profiles`, `user_streaks`, `billing_event_logs`, etc.) will resolve correctly

