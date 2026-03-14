

## Plano: Inserção em massa de ~703 emails faltando no sistema

### Situação

A planilha tem 703 emails com compras confirmadas (Hotmart/Paddle) que **não têm billing events** no banco. Sem esses eventos, o sistema não consegue liberar acesso -- nem para quem já tem conta, nem para quem criar conta depois.

### Mapeamento de produtos

| Planilha | product_type no sistema |
|---|---|
| Educly (sozinho) | `base` |
| Educly Premium | `freelancer` |
| Educly AI Pack | `ai_hub` |
| Combo Educly Premium + AI Pack | `combo_freelancer_ai` |

Emails com múltiplos produtos (ex: "Educly, Educly AI Pack, Educly Premium") terão um evento para **cada** product_type.

### Abordagem

Criar uma **Edge Function `bulk-grant-access`** que:

1. Recebe a lista de emails + produtos via POST (autenticada como admin)
2. Para cada email, determina os product_types a partir da string "Produtos Comprados"
3. Insere um `billing_event_logs` com `event_type = 'GRANTED'` e `status = 'pending'` para cada produto
4. Para emails que já têm conta (`auth.users`): chama `process_pending_billing_events()` imediatamente para liberar o acesso
5. Para emails sem conta: os eventos ficam pendentes e serão processados automaticamente quando o usuário se registrar (fluxo existente via `reconcile_pending_events`)

### Passos de implementação

1. **Criar Edge Function `bulk-grant-access`**
   - Autenticação admin (mesmo padrão do `admin-grant-access`)
   - Recebe array de `{ email, products_string }` (parseado do CSV)
   - Mapeia strings para product_types
   - Insere billing events
   - Processa os que já têm conta
   - Retorna relatório: quantos processados, quantos pendentes

2. **Chamar a função** com os dados do CSV parseados no frontend (ou via curl)

3. **Frontend**: Adicionar botão na área admin para upload de CSV e disparo do bulk grant (opcional, pode ser feito via curl direto)

### Detalhes técnicos

A Edge Function vai:

```text
Para cada email do CSV:
  ├─ Parsear "Produtos Comprados" → lista de product_types
  ├─ Para cada product_type:
  │   └─ INSERT INTO billing_event_logs (email, event_type, status, processed, payload)
  │      VALUES (email, 'GRANTED', 'pending', false, {product_type, source: 'bulk_import'})
  ├─ Buscar user em auth.users
  ├─ Se encontrou → process_pending_billing_events(user_id, email)
  └─ Se não encontrou → evento fica pendente (processado no signup)
```

A função processará em batches de 50 emails por chamada para evitar timeouts. O frontend (ou script) fará múltiplas chamadas se necessário.

### Arquivos a criar/alterar

| Arquivo | Ação |
|---|---|
| `supabase/functions/bulk-grant-access/index.ts` | Criar - Edge Function para inserção em massa |
| `supabase/config.toml` | Adicionar config da nova função (verify_jwt = false) |
| `src/components/admin/BulkGrantAccess.tsx` | Criar - Componente admin para upload CSV e disparo |
| Página admin existente | Incluir o novo componente |

### Segurança

- Autenticação admin obrigatória (mesma validação `is_admin()` do `admin-grant-access`)
- Deduplicação: não insere billing event se já existe um `GRANTED` para o mesmo email+product_type
- Rate limiting natural pelo batch de 50

