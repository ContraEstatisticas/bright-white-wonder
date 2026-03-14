

## Plan: New Email Template with Multi-language, Custom Domain, and Correct CTA

### Problems Identified

1. **Wrong domain**: All edge functions use `educly.lovable.app` instead of `educly.app`
2. **Single language**: The uploaded HTML is hardcoded in Spanish/Portuguese mix — needs full i18n
3. **CTA link**: Must use `educly.app/cadastro?email={email}&lang={lang}` with the email from the purchase event

### Scope of Changes

**7 edge functions** contain `educly.lovable.app` references that need updating to `educly.app`:

- `send-welcome-email` — main welcome email (full template replacement)
- `send-pending-thanks` — thank-you email post-purchase (full template replacement)
- `send-pending-welcome-batch` — batch welcome emails (full template replacement)
- `send-bulk-emails` — bulk email sender (full template replacement)
- `resend-pending-emails` — retry failed emails (full template replacement)
- `send-incident-notification` — incident alerts (domain fix only)
- `send-password-reset` — password reset (domain fix only, if applicable)

### Template Design

Replace the old simple HTML template with the new uploaded design featuring:
- Hero card with gradient background and logo
- Badge "Acesso Liberado" / "Access Granted" etc.
- Success box showing the user's email
- 2x2 features grid with emojis
- CTA button linking to `https://educly.app/cadastro?email={email}&lang={lang}`
- Multi-language support block (PT/ES/FR)
- Dark footer

### Translation Strategy

Expand the existing `TRANSLATIONS` object to include all new template strings (badge text, success box text, features, CTA note, footer) for all 7 supported languages (pt, en, es, fr, de, it, ru).

### CTA Button Verification

The CTA `href` will be: `https://educly.app/cadastro?email=${encodeURIComponent(userEmail)}&lang=${language}`

This already uses the `userEmail` parameter passed to the function, which comes from the purchase event email in `send-pending-thanks` and from the request body in `send-welcome-email`.

### Implementation Steps

1. **Update `send-welcome-email/index.ts`**: Replace `getEmailHtml()` with new template, update translations, change all `educly.lovable.app` to `educly.app`
2. **Update `send-pending-thanks/index.ts`**: Replace `getUnifiedEmailHtml()` with same new template design, change domain
3. **Update `send-pending-welcome-batch/index.ts`**: Same template replacement and domain fix
4. **Update `send-bulk-emails/index.ts`**: Same template replacement and domain fix
5. **Update `resend-pending-emails/index.ts`**: Same template replacement and domain fix
6. **Update remaining functions** (`send-incident-notification`, `send-password-reset`): Domain-only fix from `educly.lovable.app` to `educly.app`

