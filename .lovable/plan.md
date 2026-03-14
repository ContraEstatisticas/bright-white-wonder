## Separação Base vs Premium — Implementado ✅

### O que foi corrigido

1. **`process_pending_billing_events()`**: Compras `base` agora inserem `is_premium = false`. Apenas `freelancer`, `ai_hub` e `combo` setam `is_premium = true`.

2. **Dados existentes**: Usuários base-only que estavam com `is_premium = true` foram corrigidos para `false`.

3. **Chat.tsx**: Agora usa `useProductAccess` ao invés de `usePremiumAccess`. O chat EDI só é acessível para quem tem `freelancer` ou `ai_hub`.

4. **ChatPremiumGate**: Removida prop `checkoutUrl`, agora redireciona para `/upgrade`.

### Arquitetura de acesso atual

| Guard | Função | Onde é usado |
|---|---|---|
| `PremiumGuard` | Qualquer produto ativo (base, freelancer, ai_hub) OU whitelist | Rotas autenticadas |
| `ProductGuard` | Produto específico (`freelancer`, `ai_hub`) | `/freelancer`, `/assistentes` |
| `useProductAccess` | Hook para verificar produto específico | `Chat.tsx`, componentes internos |

### Tiers

- **BASE**: Acesso ao dashboard, desafios. Sem chat EDI, sem freelancer, sem AI Hub.
- **PREMIUM (Freelancer)**: Base + `/freelancer` + chat EDI
- **AI PACK**: Base + `/assistentes` + chat EDI  
- **COMBO**: Tudo (freelancer + ai_hub ativos)
- **WHITELIST**: Acesso total via `premium_whitelist`
