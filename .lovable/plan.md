

## Auditoria: Lista CSV vs. billing_event_logs

### Resumo dos 871 emails do CSV

| Categoria | Qtd aprox. | Descrição |
|-----------|-----------|-----------|
| **SEM NENHUM evento no banco** | **~217** | Compraram mas o webhook nunca registrou o evento no `billing_event_logs` |
| **Com eventos pendentes (aguardando cadastro)** | **~400** | Têm eventos `pending` esperando o usuário criar conta |
| **Com eventos já processados (acesso liberado)** | **~130** | Eventos com `status=success, processed=true` |
| **Com eventos expirados (expired_no_signup)** | **~124** | Eventos expiraram após 7 dias sem cadastro |

---

### Problema Principal: ~217 emails SEM eventos

Esses emails estão concentrados nas **compras mais recentes (10-13 de março de 2026)**. O webhook do Hotmart aparentemente **não disparou ou falhou silenciosamente** para essas compras. Sem evento no `billing_event_logs`, mesmo que o usuário crie conta, o `process_pending_billing_events` não vai encontrar nada para processar.

**Emails faltando eventos (linhas 2-250 do CSV, compras de 10-13/Mar):**

A grande maioria dos emails das linhas 100-250 do CSV não tem NENHUM registro, incluindo:
`lumag112, lt173384, eeruano, luistigre19, jealfonso, cassomour, mateogonzaldz, mirtha.cory, herlu2008, avab83.aa, 941445, evcugel, josejairogalindez1970, meosorioz, raulin.rag88, ledgard.huaroto.2016, rda.adc, sisterlopez56, vikycasus, papuri48, pcartagenagomez, joseleonel3333, solanapperez, jessicamegomez, rodolfopazhf, jcarloslazcano80, marlunaestrella1004, insacanal, gllopez_0108, fernandeznohe3, contacto@ece.cl, gnueve999, manuel.jhs, juan.mendez.nsn, fisabelsanchez10, ja.andres2981, wilder-macedo, albamrdl86, ceciliacordovaverdugo, ale_bautista, santossalgadoyuliana, montilvajd, mrjaramillor, carlos.e.rojas, kdelventas, carito_sa_ce, lidia06_18, attikusarizola, riscoerika74, rosita.pilamunga.civil, mistotis82, yormuro36, anita.astua, acilda2, mramossins84, wilosalpes, comercialbelen67, leyditrivi91, jfpineda16, quintilino.bacale, erlindaruizmachado, mahuca2711, rnarvaeztoro, romin1007, minanty31, mauricio8ochoa, paulasol1986, altuveplata, jhon.jjtr, carlos.alvarezmontoya, karla.navarrete1974, vejimenez, yosimarfunez, marianafvazquez, karenricralozano, marlonfigueroa1984, milu.emprende11, almanza.alco2000, caritomiami, turmerei, mariapadilla514, noelylara`

E também ~81 emails das linhas 2-100 (covachj, pstiago54, yanetguerrerolopez, angelicagarcia19, chefmarc.vatel, gcrucesp, jovando.nacionalseguros, valentina.montiel.p, keikomendoza, zunnybarreto5, ken86martinez, etc.) mais ~22 emails espalhados nas linhas 250-400.

---

### Plano de Correção

#### 1. Inserir eventos manualmente para os ~217 emails faltando
Criar uma migração SQL que insere registros `PURCHASE_COMPLETE` com status `pending` no `billing_event_logs` para cada email que está no CSV mas não tem nenhum evento. Usar o `product_type` do CSV (base, freelancer, ai_hub, combo_freelancer_ai) no payload.

#### 2. Investigar o webhook do Hotmart
Verificar por que as compras de 10-13 de março não geraram eventos. Pode ser um problema no `hotmart-webhook` edge function ou uma mudança na configuração do Hotmart.

#### 3. Para os ~124 expirados, reativar os eventos
Resetar os eventos `expired_no_signup` para `pending` para que, se o usuário eventualmente cadastrar, receba o acesso.

