# Route-Mapper — Relatório de Auditoria

> Data: 2026-04-03  
> Commit: 69007fb  
> Total de arquivos analisados: 100  
> Total de achados: 14  

## Resumo Executivo

A codebase está em bom estado geral. TypeScript strict mode está ativo, Zod valida todos os boundaries de entrada, não há vulnerabilidades de segurança evidentes (zero `dangerouslySetInnerHTML`, zero env vars expostas). Os principais pontos de atenção são: `shadcn` e `uuid` como dependências desnecessárias em produção, ausência de error/loading boundaries nas rotas dinâmicas, e cobertura de testes em 24% dos arquivos com lógica (os testes existentes são de alta qualidade). Não foram encontrados bugs de runtime críticos.

---

## Crítico (corrigir imediatamente)

Nenhum achado crítico que cause crash ou vulnerabilidade de segurança.

---

## Importante (corrigir em breve)

### IMP-1 — Rotas dinâmicas sem error boundary
- **Arquivos afetados:** `src/app/results/[id]/`, `src/app/api/crawl/[id]/`
- **Problema:** Nenhum `error.tsx`, `loading.tsx` ou `not-found.tsx` existe em nenhum segmento do App Router. Se uma page crashar, o usuário vê a tela de erro genérica do Next.js sem possibilidade de recovery.
- **Impacto:** UX degradada em cenários de erro. Sem loading state durante navegação.
- **Sugestão:** Criar `src/app/error.tsx` (global), `src/app/results/[id]/loading.tsx` e `src/app/not-found.tsx`.

### IMP-2 — `shadcn` em dependencies (deveria ser devDependencies)
- **Arquivo:** `package.json:27`
- **Problema:** `shadcn@^4.1.2` é uma CLI para gerar componentes. Não é runtime.
- **Impacto:** Inflaciona `node_modules` em produção sem necessidade.
- **Sugestão:** `npm install --save-dev shadcn` ou remover (pode usar `npx shadcn`).

### IMP-3 — `uuid` pode ser substituído por API nativa
- **Arquivo:** `src/features/crawl/infrastructure/system/uuid-id-generator.ts:3`
- **Problema:** `import { v4 as uuidv4 } from "uuid"` — `crypto.randomUUID()` é nativo em Node 15.7+ e todos os browsers modernos.
- **Impacto:** Dependência extra (~5KB) sem necessidade.
- **Sugestão:** Substituir por `crypto.randomUUID()` e remover `uuid` + `@types/uuid` do package.json.

### IMP-4 — Mensagens de erro hardcoded nas API routes
- **Arquivos:** `src/app/api/crawl/route.ts:10`, `src/app/api/crawl/[id]/route.ts:11,25`, `src/app/api/detect-login/route.ts:20`, `src/lib/rate-limit.ts` (mensagem de rate limit)
- **Problema:** Strings de erro do servidor estão hardcoded diretamente nos route handlers em vez de centralizadas. Não passam pelo sistema de i18n.
- **Impacto:** Manutenção mais difícil; mensagens de erro do backend aparecem em PT-BR independente da locale do usuário.
- **Sugestão:** Extrair para constantes centralizadas ou integrar com o sistema de mensagens.

### IMP-5 — Cobertura de testes baixa em módulos críticos
- **Arquivos sem teste:**
  - `src/features/crawl/infrastructure/playwright/playwright-crawl-executor.ts` (motor do crawl)
  - `src/features/crawl/infrastructure/playwright/playwright-page-explorer.ts` (automação web)
  - `src/features/crawl/infrastructure/jobs/in-memory-crawl-job-repository.ts` (state de jobs)
  - `src/features/crawl/domain/crawl-inventory.ts` (tracking de URLs)
  - `src/lib/rate-limit.ts` (throttling)
- **Impacto:** Mudanças nesses arquivos não têm rede de segurança automatizada.
- **Sugestão:** Priorizar testes para crawl-executor, page-explorer e rate-limit.

---

## Melhoria (backlog)

### MEL-1 — `next/dynamic` para libs pesadas
- **Arquivos:** `src/features/crawl/presentation/results/sitemap-graph.tsx` (importa `@xyflow/react`), `src/features/crawl/presentation/results/summary-charts.tsx` (importa `recharts`)
- **Problema:** Libs de gráficos são carregadas no bundle principal mesmo quando o usuário está na home.
- **Sugestão:** Usar `next/dynamic({ ssr: false })` para lazy-load esses componentes apenas quando a tab é ativada.

### MEL-2 — `.env.example` inexistente
- **Problema:** Não há documentação de variáveis de ambiente necessárias.
- **Sugestão:** Criar `.env.example` mesmo que vazio, documentando que nenhuma env var é obrigatória atualmente.

### MEL-3 — Security headers
- **Arquivo:** `next.config.ts`
- **Problema:** Nenhum header de segurança explícito (CSP, X-Frame-Options, X-Content-Type-Options).
- **Sugestão:** Adicionar `headers()` em `next.config.ts` com headers básicos de segurança.

### MEL-4 — Vitest sem coverage reporting
- **Arquivo:** `vitest.config.mts`
- **Problema:** Nenhuma configuração de cobertura.
- **Sugestão:** Adicionar `coverage: { provider: 'v8', reporter: ['text', 'json'] }`.

### MEL-5 — `use-crawl-result.ts` usa flag manual ao invés de AbortController
- **Arquivo:** `src/features/crawl/presentation/results/use-crawl-result.ts:41-97`
- **Problema:** Usa `let isCancelled = false` para cancelar fetch em useEffect cleanup, ao invés de `AbortController`.
- **Impacto:** Funciona corretamente, mas a requisição HTTP continua em andamento após unmount.
- **Sugestão:** Usar `AbortController` no cleanup para cancelar a requisição de fato.

---

## Dependências

### Não usadas (remover)
| Pacote | Motivo |
|---|---|
| `uuid` | Substituível por `crypto.randomUUID()` nativo |
| `@types/uuid` | Segue a remoção do `uuid` |

### Mal posicionadas (mover para devDeps)
| Pacote | Motivo |
|---|---|
| `shadcn` | CLI para gerar componentes, não é runtime |

### Faltantes (adicionar)
Nenhuma dependência fantasma encontrada.

### Redundantes (consolidar)
| Pacote | Nota |
|---|---|
| `clsx` + `tailwind-merge` | Já consolidados via `cn()` em `lib/utils.ts` — consistente em todo o projeto |

### Compatibilidade (verificar)
| Pacote | Versão | Nota |
|---|---|---|
| `@base-ui/react` | ^1.3.0 | Verificar compatibilidade oficial com React 19.2.4 |
| `zod` | ^4.3.6 | API v4 usada corretamente; nenhuma API deprecated de v3 encontrada |

---

## Estrutura do Projeto

### Arquivos órfãos
Nenhum arquivo órfão encontrado. Todos os arquivos são importados por pelo menos um outro arquivo ou são entry points do Next.js.

### Rotas sem error boundary
- `/results/[id]` — rota dinâmica sem `error.tsx`, `loading.tsx` ou `not-found.tsx`
- Root (`/`) — sem `error.tsx` global

### Configs faltantes
- `.env.example` — não existe
- Security headers em `next.config.ts` — não configurados

### Padrões positivos observados
- Clean Architecture bem aplicada (domain/application/infrastructure/presentation)
- Sistema de mensagens centralizado com i18n PT/EN funcional
- Zod valida TODOS os boundaries (API routes, SSE events, localStorage, API responses)
- Rate limiting implementado nas rotas de escrita
- Virtual scrolling em todas as listas longas
- TypeScript strict mode sem `any` em nenhum arquivo

---

## Checklist de Ações

Ordenado por prioridade:

- [ ] [Importante] Criar error boundaries — `src/app/error.tsx`, `src/app/results/[id]/loading.tsx`, `src/app/not-found.tsx`
- [ ] [Importante] Mover `shadcn` para devDependencies — `package.json`
- [ ] [Importante] Substituir `uuid` por `crypto.randomUUID()` — `src/features/crawl/infrastructure/system/uuid-id-generator.ts`
- [ ] [Importante] Centralizar mensagens de erro das API routes — `src/app/api/**/*.ts`
- [ ] [Importante] Adicionar testes para crawl-executor, page-explorer, rate-limit — `src/features/crawl/infrastructure/`, `src/lib/`
- [ ] [Melhoria] Usar `next/dynamic` para sitemap-graph e summary-charts — `src/features/crawl/presentation/results/`
- [ ] [Melhoria] Criar `.env.example` — raiz do projeto
- [ ] [Melhoria] Adicionar security headers — `next.config.ts`
- [ ] [Melhoria] Configurar coverage no Vitest — `vitest.config.mts`
- [ ] [Melhoria] Trocar flag manual por AbortController — `src/features/crawl/presentation/results/use-crawl-result.ts`
