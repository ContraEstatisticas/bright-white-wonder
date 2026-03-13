

## Problemas Identificados

A URL é `/cadastro?email=%email%&lang=es` — o `%email%` é uma variável de template (Hotmart) que **não foi substituída**. Isso causa 3 problemas em cascata:

1. **"Compra não localizada"**: `check_purchase_exists` busca por `%email%` literal → não encontra → mostra tela de erro
2. **Email bugado**: `emailParam` é `%email%` literal, exibido como texto na tela
3. **Botão "Contactar soporte"**: usa `window.location.href = "mailto:..."` que não funciona bem em todos os contextos; e visualmente parece um `variant="outline"` sem estilo de botão clicável

## Solução

### 1. Detectar email inválido/template não resolvido

No `SignupFromEmail.tsx`, adicionar validação do `emailParam` para detectar variáveis de template não resolvidas (como `%email%`, `{{email}}`, `{email}`):

```typescript
const isValidEmail = (email: string) => {
  if (!email) return false;
  if (email.includes('%') || email.includes('{{') || email.includes('{')) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

Se `emailParam` não for um email válido, tratar como se não houvesse email (mostrar tela de "link inválido") com mensagem mais clara e um botão funcional para login.

### 2. Verificar se o usuário já tem conta (antes de checar compra)

No `useEffect` de `checkStatus`, adicionar verificação via `check_purchase_exists` que também verifica se o usuário já existe no sistema. Se já existir conta, setar `hasAccount = true` diretamente, em vez de mostrar "compra não localizada".

### 3. Corrigir botão "Contatar suporte"

Trocar `window.location.href = "mailto:..."` por um `<a href="mailto:contact@educly.app">` estilizado como botão, ou usar `window.open("mailto:...")`. Também adicionar um link para WhatsApp como alternativa.

### Arquivos a editar

- **`src/pages/SignupFromEmail.tsx`**: 
  - Adicionar função `isValidEmail` 
  - Tratar `emailParam` inválido na tela de "link inválido" com mensagem amigável e botão de login
  - No `checkStatus`, verificar existência de conta antes de mostrar "compra não localizada"
  - Corrigir botão de suporte para ser um `<a>` funcional

