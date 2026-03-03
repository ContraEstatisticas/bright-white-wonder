

# Corrigir Consumo Excessivo do primer-webhook (DEFINITIVO)

## Problema Confirmado (Acontecendo AGORA)

Os logs mostram **50+ requests com status 400** em menos de 2 segundos no `primer-webhook`. Servico externo envia payloads sem email, recebe 400, e **reenvia imediatamente** (retry). Isso cria um loop infinito de boot/shutdown que consome creditos sem parar.

Alem disso, para cada webhook valido, o codigo faz um **loop paginado de ate 10 chamadas** ao `listUsers()` para encontrar o usuario por email.

## Correcoes no `supabase/functions/primer-webhook/index.ts`

### Correcao 1: Retornar 200 para payloads sem email
Linha 22-24: mudar de `status: 400` para `status: 200`. Isso faz o servico externo parar de reenviar, eliminando o flood.

### Correcao 2: Substituir loop `listUsers` por query direta
Linhas 94-119: remover o loop paginado e usar uma query direta na tabela `profiles` (que ja tem o `id` do usuario linkado ao `auth.users`):

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .ilike('email', email)  // ou filtro equivalente
  .maybeSingle();
```

Se `profiles` nao tem coluna email, usar `supabase.auth.admin.listUsers({ filter: email })` que faz uma unica chamada filtrada, em vez de paginar todos os usuarios.

### Correcao 3: Proteger contra JSON invalido
Envolver `req.json()` em try-catch para evitar crash com payloads mal-formados (que tambem geram retries).

## Impacto Esperado

```text
Antes:  50+ boots/segundo (flood) + ate 10 chamadas listUsers por webhook valido
Depois: 0 boots para payloads sem email + 1 query por webhook valido
```

Reducao estimada: **~95% menos creditos consumidos**.

## Arquivo Modificado

Apenas `supabase/functions/primer-webhook/index.ts`. Nenhum outro arquivo, pagina ou funcionalidade e alterado.

