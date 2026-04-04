import type { Locale } from "@/shared/i18n/locales";

const pt = {
  form: {
    cardTitle: "Configurar Varredura",
    urlLabel: "URL do Site",
    urlPlaceholder: "https://exemplo.com",
    advancedSettings: "Configurações Avançadas",
    maxPages: "Máx. de Páginas",
    maxPagesDesc: "Número máximo de páginas a visitar.",
    maxClicksPerPage: "Máx. de Cliques por Página",
    maxClicksPerPageDesc: "Elementos interativos a clicar em cada página.",
    navigationTimeout: "Timeout de Navegação (ms)",
    navigationTimeoutDesc: "Tempo máximo de espera para carregar uma página.",
    navIdleTimeout: "Timeout de Inatividade (ms)",
    navIdleTimeoutDesc:
      "Tempo de espera para a atividade de rede estabilizar.",
    interactionIdleTimeout: "Timeout de Interação (ms)",
    interactionIdleTimeoutDesc:
      "Atraso após clicar antes do próximo elemento.",
    allowedHostsMode: "Modo de Hosts Permitidos",
    allowedHostsModeDesc: "Quais hosts podem ser rastreados.",
    relatedHosts: "Relacionados (mesmo domínio base)",
    sameOrigin: "Mesma Origem (exata)",
    manualAuth: "Autenticação Manual",
    manualAuthDesc:
      "Configure a autenticação manualmente com seletores personalizados.",
    startingScan: "Iniciando Varredura...",
    startScan: "Iniciar Varredura",
    estimatedTime: (pages: string) =>
      `Estimativa ~2-5 min para ${pages} página${pages !== "1" ? "s" : ""}`,
    toastScanStarted: "Varredura iniciada",
    toastScanFailed: "Falha ao iniciar a varredura",
  },
  progress: {
    scanning: "Varrendo…",
    cancel: "Cancelar",
    pageOf: (visited: number, max: number) => `Página ${visited} de ${max}`,
    inQueue: (count: number) => `(${count} na fila)`,
    visiting: "Visitando:",
    liveLog: "Log em Tempo Real",
    waitingForLogs: "Aguardando logs…",
  },
  dashboard: {
    newScan: "Nova Varredura",
    copySummaryFull: "Copiar Resumo",
    copySummaryShort: "Copiar",
    downloadJsonFull: "Baixar JSON",
    downloadJsonShort: "JSON",
    tabSummary: "Resumo",
    tabSitemap: "Mapa do Site",
    tabPages: "Páginas",
    tabApis: "APIs",
    tabAssets: "Assets",
    tabExternal: "Externas",
    tabErrors: "Erros",
    toastJsonDownloaded: "JSON baixado",
    toastSummaryCopied: "Resumo copiado para a área de transferência",
    copySummaryText: (summary: {
      startUrl: string;
      scannedAt: string;
      pagesVisited: number;
      pagesDiscovered: number;
      apiRoutesDiscovered: number;
      assetsObserved: number;
      externalRequestsObserved: number;
      errors: number;
    }) =>
      [
        "Resultados da Varredura — Route Mapper",
        `URL: ${summary.startUrl}`,
        `Varrido em: ${new Date(summary.scannedAt).toLocaleString("pt-BR")}`,
        `Páginas Visitadas: ${summary.pagesVisited}`,
        `Páginas Descobertas: ${summary.pagesDiscovered}`,
        `Rotas de API: ${summary.apiRoutesDiscovered}`,
        `Assets: ${summary.assetsObserved}`,
        `Requisições Externas: ${summary.externalRequestsObserved}`,
        `Erros: ${summary.errors}`,
      ].join("\n"),
  },
  summary: {
    scannedUrl: "URL Varrida",
    pagesVisited: "Páginas Visitadas",
    pagesVisitedTooltip: "Páginas que foram acessadas durante a varredura",
    pagesDiscovered: "Descobertas",
    pagesDiscoveredTooltip: "Total de URLs únicas encontradas nos links",
    apiRoutes: "Rotas de API",
    apiRoutesTooltip: "Endpoints de API detectados (XHR/Fetch)",
    assets: "Assets",
    assetsTooltip: "Arquivos estáticos: JS, CSS, imagens, fontes",
    externalRequests: "Externas",
    externalRequestsTooltip: "Requisições para domínios de terceiros",
    errors: "Erros",
    errorsTooltip: "Páginas que falharam ao carregar",
    completedSuccess: "Concluída sem erros",
    completedWithErrors: (count: number) =>
      `${count} erro${count !== 1 ? "s" : ""} encontrado${count !== 1 ? "s" : ""}`,
    totalDiscovered: (count: number) =>
      `${count} recurso${count !== 1 ? "s" : ""} descoberto${count !== 1 ? "s" : ""}`,
    coverageLabel: "Cobertura de Crawl",
    coverageDesc: (visited: number, discovered: number) =>
      `${visited} de ${discovered} página${discovered !== 1 ? "s" : ""} visitada${discovered !== 1 ? "s" : ""}`,
  },
  charts: {
    sectionTitle: "Análise Detalhada",
    discoveryOverview: "Visão Geral",
    discoveryDesc: "Distribuição dos recursos descobertos",
    assetsByType: "Assets por Tipo",
    assetsDesc: "Classificação dos arquivos estáticos",
    httpMethods: "Métodos HTTP",
    httpMethodsDesc: "Distribuição por método nas rotas de API",
    topPatterns: "Padrões Frequentes",
    topPatternsDesc: "Padrões de rota mais encontrados",
    pages: "Páginas",
    apis: "APIs",
    assets: "Assets",
    external: "Externas",
    errors: "Erros",
  },
  pageRoutesTable: {
    searchPlaceholder: "Buscar rotas...",
    searchAriaLabel: "Buscar rotas de página",
    allPatterns: "Todos os padrões",
    routesFound: (count: number) =>
      `${count} rota${count !== 1 ? "s" : ""} encontrada${count !== 1 ? "s" : ""}`,
    noRoutesFound: "Nenhuma rota encontrada",
    caption:
      "Tabela de rotas de página mostrando URL, caminho, padrão e parâmetros de consulta",
    colUrl: "URL",
    colPath: "Caminho",
    colPattern: "Padrão",
    colQuery: "Consulta",
  },
  apiRoutesTable: {
    searchPlaceholder: "Buscar rotas de API...",
    searchAriaLabel: "Buscar rotas de API",
    allMethods: "Todos os métodos",
    routesFound: (count: number) =>
      `${count} rota${count !== 1 ? "s" : ""} de API encontrada${count !== 1 ? "s" : ""}`,
    noRoutesFound: "Nenhuma rota de API encontrada",
    caption: "Tabela de rotas de API mostrando caminho, padrão e métodos HTTP",
    expand: "Expandir",
    collapse: "Recolher",
    colPath: "Caminho",
    colPattern: "Padrão",
    colMethods: "Métodos",
    observedUrls: (count: number) => `URLs observadas (${count}):`,
  },
  assetsList: {
    emptyTitle: "Nenhum asset observado",
    emptyDescription:
      "Nenhum asset estático (JS, CSS, imagens, fontes) foi capturado durante a varredura. Isso pode acontecer se o site carrega assets de um CDN em outro domínio.",
    searchPlaceholder: "Buscar assets...",
    searchAriaLabel: "Buscar assets",
    filterByType: "Filtrar por tipo",
    assetsCount: (filtered: number, total: number) =>
      `${filtered} de ${total} asset${total !== 1 ? "s" : ""}`,
    noMatchingAssets: "Nenhum asset correspondente encontrado",
    typeJs: "JS",
    typeCss: "CSS",
    typeImage: "Imagem",
    typeFont: "Fonte",
    typeOther: "Outro",
    all: (count: number) => `Todos (${count})`,
  },
  externalRequests: {
    emptyTitle: "Nenhuma requisição externa observada",
    emptyDescription:
      "Nenhuma chamada de API de terceiros ou requisição cross-origin foi capturada. Isso pode acontecer se o site não faz requisições HTTP externas durante o carregamento da página.",
    searchPlaceholder: "Buscar requisições externas...",
    searchAriaLabel: "Buscar requisições externas",
    requestsCount: (filtered: number, total: number) =>
      total === 1
        ? `${filtered} de ${total} requisição externa`
        : `${filtered} de ${total} requisições externas`,
    noMatchingRequests: "Nenhuma requisição correspondente encontrada",
  },
  errorLog: {
    emptyTitle: "Nenhum erro encontrado",
    emptyDescription: "A varredura foi concluída sem nenhum erro.",
    errorsFound: (count: number) =>
      `${count} erro${count !== 1 ? "s" : ""} encontrado${count !== 1 ? "s" : ""}`,
  },
  manualAuth: {
    strategyLabel: "Estratégia de Autenticação",
    formLogin: "Login por Formulário",
    storageState: "Storage State (JSON)",
    credentials: "Credenciais",
    loginUrl: "URL de Login",
    username: "Usuário / E-mail",
    usernameOptionalHint: "(deixe vazio para sites com apenas senha)",
    password: "Senha",
    cssSelectors: "Seletores CSS",
    optional: "(opcional)",
    usernameSelector: "Seletor de Usuário",
    passwordSelector: "Seletor de Senha",
    submitSelector: "Seletor de Envio",
    rememberMeSelector: 'Seletor de "Lembrar-me"',
    successUrlContains: "URL de Sucesso (contém)",
    successSelector: "Seletor de Sucesso",
    postSubmitTimeout: "Timeout Pós-Envio (ms)",
    storageStateLabel: "Storage State JSON",
    storageStatePlaceholder: "Cole o JSON do storageState do Playwright aqui...",
    bearerToken: "Bearer Token",
    bearerTokenLabel: "Token",
    bearerHeaderName: "Nome do Header",
    bearerHeaderPrefix: "Prefixo",
    bearerPreview: "Header enviado",
  },
  capturedTokens: {
    title: "Credenciais Capturadas",
    description: "Tokens, cookies e dados de autenticação interceptados durante a varredura",
    reveal: "Revelar valor",
    hide: "Ocultar valor",
    copy: "Copiar valor",
    copied: "Copiado para a área de transferência",
    firstSeen: "Origem",
    summary: (headers: number, cookies: number, storage: number) => {
      const parts: string[] = [];
      if (headers > 0) parts.push(`${headers} header${headers !== 1 ? "s" : ""}`);
      if (cookies > 0) parts.push(`${cookies} cookie${cookies !== 1 ? "s" : ""}`);
      if (storage > 0) parts.push(`${storage} storage`);
      return parts.join(" · ");
    },
  },
  autoAuth: {
    label: "Login automático",
    description:
      "O Route Mapper encontra a tela de login e tenta entrar para você antes da varredura.",
    setupTitle: "Entrar antes da varredura",
    detecting: "Procurando...",
    detectForm: "Encontrar tela de login",
    analyzingPage: "Procurando a tela de login deste site...",
    formDetected: "Tela de login encontrada",
    formDetectedDescFull:
      "Encontramos os campos de e-mail, senha e botão de entrada.",
    formDetectedDescPasswordOnly:
      "Encontramos o campo de senha e o botão de entrada.",
    stepsTitle: "Como funciona",
    stepDetect: "1. Encontrar a tela de login",
    stepPassword: "2. Você informa a senha",
    stepReady: "3. A varredura entra automaticamente",
    username: "Usuário / E-mail",
    password: "Senha",
    passwordHelp: "Sua senha é usada somente nesta execução da varredura.",
    saveCredentials: "Lembrar meu e-mail neste site",
    enableAuth: "Login automático pronto",
    readyMessage: "Pronto. Ao iniciar a varredura, o sistema vai tentar entrar automaticamente.",
    toastDetected: "Tela de login encontrada",
    toastDetectFirst: "Primeiro encontre a tela de login",
    toastFillPassword: "Digite a senha para continuar",
    toastEnabled: "Login automático ativado",
    toastDetectionFailed: "Não foi possível encontrar a tela de login",
    toastDetectionError: "Falha ao procurar a tela de login",
    toastWaitForDetection: "Espere a busca da tela de login terminar antes de iniciar a varredura",
    toastResolveBeforeScan: "Corrija o login automático ou desative essa opção antes de iniciar a varredura",
    toastEnableBeforeScan: "Digite a senha ou desative o login automático antes de iniciar a varredura",
  },
  sitemap: {
    noRoutes: "Nenhuma rota para exibir",
    legendPage: "Página",
    legendApi: "API",
    legendDirectory: "Diretório",
    filterAll: "Todas",
    filterPages: "Páginas",
    filterApis: "APIs",
    searchPlaceholder: "Buscar no mapa...",
    clearSelection: "Limpar seleção",
    matchesFound: (count: number) =>
      `${count} resultado${count !== 1 ? "s" : ""} encontrado${count !== 1 ? "s" : ""}`,
  },
  resultsPage: {
    scanFailed: "Varredura Falhou",
    unknownError: "Ocorreu um erro desconhecido",
    tryAgain: "Tentar Novamente",
    scanCancelled: "Varredura Cancelada",
    scanCancelledDesc: "A varredura foi cancelada antes de ser concluída.",
    startNewScan: "Nova Varredura",
    connecting: "Conectando...",
    unavailable: "Resultado indisponível",
    unavailableDesc:
      "Este job não existe mais, expirou ou não pôde ser carregado no momento.",
    toastCompleted: "Varredura concluída",
    toastFailed: "Varredura falhou",
    toastCancelled: "Varredura cancelada",
    cancelFailed: "Não foi possível cancelar a varredura",
  },
  boundaries: {
    errorTitle: "Algo deu errado",
    errorFallback: "Ocorreu um erro inesperado.",
    tryAgain: "Tentar novamente",
    notFoundCode: "404",
    notFoundMessage: "A página que você procura não existe ou foi movida.",
    backToHome: "Voltar ao início",
    loading: "Carregando...",
    invalidResponse: "Resposta inválida do servidor",
    cancelFailed: (status: number) => `Falha ao cancelar varredura: ${status}`,
  },
};

const en: typeof pt = {
  form: {
    cardTitle: "Configure Scan",
    urlLabel: "Website URL",
    urlPlaceholder: "https://example.com",
    advancedSettings: "Advanced Settings",
    maxPages: "Max Pages",
    maxPagesDesc: "Maximum number of pages to visit.",
    maxClicksPerPage: "Max Clicks per Page",
    maxClicksPerPageDesc: "Interactive elements to click on each page.",
    navigationTimeout: "Navigation Timeout (ms)",
    navigationTimeoutDesc: "Maximum wait time to load a page.",
    navIdleTimeout: "Idle Timeout (ms)",
    navIdleTimeoutDesc: "Wait time for network activity to settle.",
    interactionIdleTimeout: "Interaction Timeout (ms)",
    interactionIdleTimeoutDesc: "Delay after clicking before the next element.",
    allowedHostsMode: "Allowed Hosts Mode",
    allowedHostsModeDesc: "Which hosts can be crawled.",
    relatedHosts: "Related (same base domain)",
    sameOrigin: "Same Origin (exact)",
    manualAuth: "Manual Authentication",
    manualAuthDesc: "Configure authentication manually with custom selectors.",
    startingScan: "Starting Scan...",
    startScan: "Start Scan",
    estimatedTime: (pages: string) =>
      `Estimated ~2-5 min for ${pages} page${pages !== "1" ? "s" : ""}`,
    toastScanStarted: "Scan started",
    toastScanFailed: "Failed to start scan",
  },
  progress: {
    scanning: "Scanning…",
    cancel: "Cancel",
    pageOf: (visited: number, max: number) => `Page ${visited} of ${max}`,
    inQueue: (count: number) => `(${count} in queue)`,
    visiting: "Visiting:",
    liveLog: "Live Log",
    waitingForLogs: "Waiting for logs…",
  },
  dashboard: {
    newScan: "New Scan",
    copySummaryFull: "Copy Summary",
    copySummaryShort: "Copy",
    downloadJsonFull: "Download JSON",
    downloadJsonShort: "JSON",
    tabSummary: "Summary",
    tabSitemap: "Sitemap",
    tabPages: "Pages",
    tabApis: "APIs",
    tabAssets: "Assets",
    tabExternal: "External",
    tabErrors: "Errors",
    toastJsonDownloaded: "JSON downloaded",
    toastSummaryCopied: "Summary copied to clipboard",
    copySummaryText: (summary: {
      startUrl: string;
      scannedAt: string;
      pagesVisited: number;
      pagesDiscovered: number;
      apiRoutesDiscovered: number;
      assetsObserved: number;
      externalRequestsObserved: number;
      errors: number;
    }) =>
      [
        "Scan Results — Route Mapper",
        `URL: ${summary.startUrl}`,
        `Scanned at: ${new Date(summary.scannedAt).toLocaleString("en")}`,
        `Pages Visited: ${summary.pagesVisited}`,
        `Pages Discovered: ${summary.pagesDiscovered}`,
        `API Routes: ${summary.apiRoutesDiscovered}`,
        `Assets: ${summary.assetsObserved}`,
        `External Requests: ${summary.externalRequestsObserved}`,
        `Errors: ${summary.errors}`,
      ].join("\n"),
  },
  summary: {
    scannedUrl: "Scanned URL",
    pagesVisited: "Pages Visited",
    pagesVisitedTooltip: "Pages accessed during the scan",
    pagesDiscovered: "Discovered",
    pagesDiscoveredTooltip: "Total unique URLs found in links",
    apiRoutes: "API Routes",
    apiRoutesTooltip: "API endpoints detected (XHR/Fetch)",
    assets: "Assets",
    assetsTooltip: "Static files: JS, CSS, images, fonts",
    externalRequests: "External",
    externalRequestsTooltip: "Requests to third-party domains",
    errors: "Errors",
    errorsTooltip: "Pages that failed to load",
    completedSuccess: "Completed without errors",
    completedWithErrors: (count: number) =>
      `${count} error${count !== 1 ? "s" : ""} found`,
    totalDiscovered: (count: number) =>
      `${count} resource${count !== 1 ? "s" : ""} discovered`,
    coverageLabel: "Crawl Coverage",
    coverageDesc: (visited: number, discovered: number) =>
      `${visited} of ${discovered} page${discovered !== 1 ? "s" : ""} visited`,
  },
  charts: {
    sectionTitle: "Detailed Analysis",
    discoveryOverview: "Overview",
    discoveryDesc: "Distribution of discovered resources",
    assetsByType: "Assets by Type",
    assetsDesc: "Classification of static files",
    httpMethods: "HTTP Methods",
    httpMethodsDesc: "Distribution by method in API routes",
    topPatterns: "Top Patterns",
    topPatternsDesc: "Most frequently found route patterns",
    pages: "Pages",
    apis: "APIs",
    assets: "Assets",
    external: "External",
    errors: "Errors",
  },
  pageRoutesTable: {
    searchPlaceholder: "Search routes...",
    searchAriaLabel: "Search page routes",
    allPatterns: "All patterns",
    routesFound: (count: number) =>
      `${count} route${count !== 1 ? "s" : ""} found`,
    noRoutesFound: "No routes found",
    caption: "Page routes table showing URL, path, pattern, and query parameters",
    colUrl: "URL",
    colPath: "Path",
    colPattern: "Pattern",
    colQuery: "Query",
  },
  apiRoutesTable: {
    searchPlaceholder: "Search API routes...",
    searchAriaLabel: "Search API routes",
    allMethods: "All methods",
    routesFound: (count: number) =>
      `${count} API route${count !== 1 ? "s" : ""} found`,
    noRoutesFound: "No API routes found",
    caption: "API routes table showing path, pattern, and HTTP methods",
    expand: "Expand",
    collapse: "Collapse",
    colPath: "Path",
    colPattern: "Pattern",
    colMethods: "Methods",
    observedUrls: (count: number) => `Observed URLs (${count}):`,
  },
  assetsList: {
    emptyTitle: "No assets observed",
    emptyDescription:
      "No static assets (JS, CSS, images, fonts) were captured during the scan. This can happen if the site loads assets from a CDN on another domain.",
    searchPlaceholder: "Search assets...",
    searchAriaLabel: "Search assets",
    filterByType: "Filter by type",
    assetsCount: (filtered: number, total: number) =>
      `${filtered} of ${total} asset${total !== 1 ? "s" : ""}`,
    noMatchingAssets: "No matching assets found",
    typeJs: "JS",
    typeCss: "CSS",
    typeImage: "Image",
    typeFont: "Font",
    typeOther: "Other",
    all: (count: number) => `All (${count})`,
  },
  externalRequests: {
    emptyTitle: "No external requests observed",
    emptyDescription:
      "No third-party API calls or cross-origin requests were captured. This can happen if the site doesn't make external HTTP requests during page load.",
    searchPlaceholder: "Search external requests...",
    searchAriaLabel: "Search external requests",
    requestsCount: (filtered: number, total: number) =>
      `${filtered} of ${total} external request${total !== 1 ? "s" : ""}`,
    noMatchingRequests: "No matching requests found",
  },
  errorLog: {
    emptyTitle: "No errors found",
    emptyDescription: "The scan completed without any errors.",
    errorsFound: (count: number) =>
      `${count} error${count !== 1 ? "s" : ""} found`,
  },
  manualAuth: {
    strategyLabel: "Authentication Strategy",
    formLogin: "Form Login",
    storageState: "Storage State (JSON)",
    credentials: "Credentials",
    loginUrl: "Login URL",
    username: "Username / Email",
    usernameOptionalHint: "(leave empty for password-only sites)",
    password: "Password",
    cssSelectors: "CSS Selectors",
    optional: "(optional)",
    usernameSelector: "Username Selector",
    passwordSelector: "Password Selector",
    submitSelector: "Submit Selector",
    rememberMeSelector: '"Remember Me" Selector',
    successUrlContains: "Success URL (contains)",
    successSelector: "Success Selector",
    postSubmitTimeout: "Post-Submit Timeout (ms)",
    storageStateLabel: "Storage State JSON",
    storageStatePlaceholder: "Paste your Playwright storageState JSON here...",
    bearerToken: "Bearer Token",
    bearerTokenLabel: "Token",
    bearerHeaderName: "Header Name",
    bearerHeaderPrefix: "Prefix",
    bearerPreview: "Header sent",
  },
  capturedTokens: {
    title: "Captured Credentials",
    description: "Tokens, cookies, and authentication data intercepted during the scan",
    reveal: "Reveal value",
    hide: "Hide value",
    copy: "Copy value",
    copied: "Copied to clipboard",
    firstSeen: "Source",
    summary: (headers: number, cookies: number, storage: number) => {
      const parts: string[] = [];
      if (headers > 0) parts.push(`${headers} header${headers !== 1 ? "s" : ""}`);
      if (cookies > 0) parts.push(`${cookies} cookie${cookies !== 1 ? "s" : ""}`);
      if (storage > 0) parts.push(`${storage} storage`);
      return parts.join(" · ");
    },
  },
  autoAuth: {
    label: "Automatic login",
    description:
      "Route Mapper finds the login screen and tries to sign in for you before the scan starts.",
    setupTitle: "Sign in before the scan",
    detecting: "Searching...",
    detectForm: "Find login screen",
    analyzingPage: "Looking for this site's login screen...",
    formDetected: "Login screen found",
    formDetectedDescFull:
      "We found the email field, password field, and sign-in button.",
    formDetectedDescPasswordOnly:
      "We found the password field and sign-in button.",
    stepsTitle: "How it works",
    stepDetect: "1. Find the login screen",
    stepPassword: "2. You enter the password",
    stepReady: "3. The scan signs in automatically",
    username: "Username / Email",
    password: "Password",
    passwordHelp: "Your password is only used for this scan.",
    saveCredentials: "Remember my email for this site",
    enableAuth: "Automatic login is ready",
    readyMessage: "Ready. When you start the scan, the system will try to sign in automatically.",
    toastDetected: "Login screen found",
    toastDetectFirst: "Find the login screen first",
    toastFillPassword: "Enter the password to continue",
    toastEnabled: "Automatic login enabled",
    toastDetectionFailed: "Could not find the login screen",
    toastDetectionError: "Failed to look for the login screen",
    toastWaitForDetection: "Wait for the login search to finish before starting the scan",
    toastResolveBeforeScan: "Fix automatic login or disable it before starting the scan",
    toastEnableBeforeScan: "Enter the password or disable automatic login before starting the scan",
  },
  sitemap: {
    noRoutes: "No routes to display",
    legendPage: "Page",
    legendApi: "API",
    legendDirectory: "Directory",
    filterAll: "All",
    filterPages: "Pages",
    filterApis: "APIs",
    searchPlaceholder: "Search sitemap...",
    clearSelection: "Clear selection",
    matchesFound: (count: number) =>
      `${count} result${count !== 1 ? "s" : ""} found`,
  },
  resultsPage: {
    scanFailed: "Scan Failed",
    unknownError: "An unknown error occurred",
    tryAgain: "Try Again",
    scanCancelled: "Scan Cancelled",
    scanCancelledDesc: "The scan was cancelled before completion.",
    startNewScan: "New Scan",
    connecting: "Connecting...",
    unavailable: "Result unavailable",
    unavailableDesc:
      "This job no longer exists, has expired, or could not be loaded.",
    toastCompleted: "Scan completed",
    toastFailed: "Scan failed",
    toastCancelled: "Scan cancelled",
    cancelFailed: "Could not cancel the scan",
  },
  boundaries: {
    errorTitle: "Something went wrong",
    errorFallback: "An unexpected error occurred.",
    tryAgain: "Try again",
    notFoundCode: "404",
    notFoundMessage: "The page you're looking for doesn't exist or has been moved.",
    backToHome: "Back to home",
    loading: "Loading...",
    invalidResponse: "Invalid server response",
    cancelFailed: (status: number) => `Failed to cancel scan: ${status}`,
  },
};

const messages = { "pt-BR": pt, en } as const;

export type CrawlMessages = typeof pt;
export function getCrawlMessages(locale: Locale): CrawlMessages {
  return messages[locale];
}

// Static export for backwards compatibility and non-context usage
export const crawlMessages = pt;
