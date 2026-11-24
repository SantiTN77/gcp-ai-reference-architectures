"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Lang = "en" | "es";

const KEY = "arch-portal-lang";
const listeners = new Set<() => void>();

function read(): Lang {
  if (typeof window === "undefined") return "en";
  const q = new URLSearchParams(window.location.search).get("lang");
  if (q === "es" || q === "en") {
    try {
      window.localStorage.setItem(KEY, q);
    } catch {
      /* ignore */
    }
    return q;
  }
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "es" || v === "en") return v;
  } catch {
    /* storage unavailable */
  }
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

export function useLang(): [Lang, (l: Lang) => void] {
  const lang = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => "en" as Lang,
  );
  const set = useCallback((l: Lang) => {
    try {
      window.localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
    const url = new URL(window.location.href);
    url.searchParams.set("lang", l);
    window.history.replaceState(null, "", url);
    document.documentElement.lang = l;
    listeners.forEach((f) => f());
  }, []);
  return [lang, set];
}

export const STRINGS = {
  en: {
    brandA: "GCP",
    brandB: "AI Reference Architectures",
    nav: ["Blueprints", "ADRs", "Cost calculator"],
    heroEyebrow: "3 blueprints · 6 quantitative ADRs · 100% verified Mermaid",
    heroA: "The architecture work that happens",
    heroB: "before the code.",
    heroLede:
      "Production-grade GCP + AI blueprints: explicit VPC / PSC / Cloud NAT perimeters, DLP before every Vertex AI call, tiered Gemini Flash vs Pro routing, three-tier cost models and STRIDE threat models mapped to the OWASP Top 10 for LLMs.",
    explore: "Explore Blueprints",
    calc: "Cost calculator",
    browse: "Browse 6 ADRs",
    pillars: [
      ["$0", "Idle cost by design", "Cloud Run v2 at min=0 and Firestore Vector Search replace $156–$350+/mo always-on clusters."],
      ["5", "Security layers per hop", "Cloud DLP redaction, Model Armor, VPC-SC, PSC and OIDC IAM — CMEK everywhere."],
      ["69.7%", "LLM spend saved", "Per-node Gemini Flash vs Pro routing saves $5,986/mo across the portfolio."],
    ],
    bpLabel: "Blueprints",
    bpTitle: "Enterprise reference blueprints",
    bpLede: "Each one ships network and sequence diagrams, a three-tier GCP cost model and a STRIDE / OWASP threat model.",
    tiers: ["Pilot", "Growth", "Enterprise"],
    decLabel: "Decisions",
    decTitle: "Architecture decision records",
    decLede: "Trade-off matrices, break-even math and revisit triggers for compute, vectors, routing, privacy, IAM and MCP / A2A.",
    searchAll: "Search all ADRs",
    allBlueprints: "All Reference Blueprints",
    blueprint: "Blueprint",
    tierLong: ["Pilot tier", "Growth tier", "Enterprise tier"],
    modelCost: "Model a custom cost →",
    tabs: ["Architecture & Sequence", "Overview & SLOs", "Cost Estimation (3 Tiers)", "STRIDE / OWASP Threat Model"],
    diagA: "Network & Security Architecture Diagram",
    diagASub: "VPC subnets, Private Service Connect, Cloud NAT, least-privilege IAM, Cloud DLP, Model Armor, KMS / Secret Manager and Vertex AI",
    diagB: "Runtime Request & Security Sequence Diagram",
    diagBSub: "Auth verification, DLP redaction, tiered Flash / Pro routing, tool guardrails and audit logging",
    docsNote: "",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    reset: "Reset zoom",
    sourceBtn: "Source",
    copy: "Copy",
    copied: "Copied",
    adrEyebrow: "MADR format · break-even math · revisit triggers",
    adrA: "Architecture Decision",
    adrB: "Records",
    adrLede:
      "Every infrastructure, privacy, model-routing and agent-interoperability decision — with the numbers that justify it and the signal that would reverse it.",
    search: "Search — Firestore, Cloud Run, DLP, MCP, A2A, break-even…",
    all: "All",
    noMatch: "No ADRs match",
    backAdrs: "Back to All ADRs",
    calcEyebrow: "us-central1 · on-demand · formulas from each cost-estimation.md",
    calcA: "What will it cost",
    calcB: "every month?",
    calcLede: "Pick a blueprint, set the monthly volume and the Gemini Flash vs Pro routing split. Every line item maps to a node in the architecture diagram.",
    defaultSplit: "Default split",
    controls: "Workload & FinOps controls",
    volume: "Monthly volume",
    flash: "Gemini Flash share (vs Pro escalation)",
    amortize: "Amortize Shared VPC networking (ALB + Cloud NAT + PSC)",
    amortizeSub: "For deployments into an existing enterprise Shared VPC with centralised ingress and egress.",
    spend: "Estimated monthly GCP spend",
    perUnit: "per unit",
    savings: "Flash / Pro routing savings vs 100% Pro",
    perMonth: "/ mo",
    baseline: "A 100% Pro baseline would cost",
    breakdown: "Per-service monthly cost — matches the blueprint nodes",
    cols: ["GCP service", "Category", "Formula / sizing", "Monthly", "Share"],
    total: "Total estimated monthly cost",
    saves: "saves",
    vsPro: "vs 100% Pro",
    built: "Built by Daniel Tafur · AI Solutions Architect (GCP)",
  },
  es: {
    brandA: "GCP",
    brandB: "Arquitecturas de referencia de IA",
    nav: ["Blueprints", "ADRs", "Calculadora de costos"],
    heroEyebrow: "3 blueprints · 6 ADRs cuantitativos · Mermaid 100% verificado",
    heroA: "El trabajo de arquitectura que ocurre",
    heroB: "antes del código.",
    heroLede:
      "Blueprints de GCP + IA listos para producción: perímetros explícitos con VPC / PSC / Cloud NAT, DLP antes de cada llamada a Vertex AI, enrutamiento escalonado Gemini Flash vs Pro, modelos de costo en tres niveles y modelos de amenazas STRIDE mapeados al OWASP Top 10 para LLMs.",
    explore: "Explorar blueprints",
    calc: "Calculadora de costos",
    browse: "Ver los 6 ADRs",
    pillars: [
      ["$0", "Costo en reposo por diseño", "Cloud Run v2 con min=0 y Firestore Vector Search reemplazan clústeres siempre encendidos de $156–$350+/mes."],
      ["5", "Capas de seguridad por salto", "Redacción con Cloud DLP, Model Armor, VPC-SC, PSC e IAM con OIDC — CMEK en todo."],
      ["69.7%", "Ahorro en gasto de LLM", "Enrutar por nodo entre Gemini Flash y Pro ahorra $5,986/mes en todo el portafolio."],
    ],
    bpLabel: "Blueprints",
    bpTitle: "Blueprints de referencia empresarial",
    bpLede: "Cada uno incluye diagramas de red y de secuencia, un modelo de costos de GCP en tres niveles y un modelo de amenazas STRIDE / OWASP.",
    tiers: ["Piloto", "Crecimiento", "Empresa"],
    decLabel: "Decisiones",
    decTitle: "Registros de decisiones de arquitectura",
    decLede: "Matrices de trade-offs, cálculos de punto de equilibrio y señales para revisar cómputo, vectores, enrutamiento, privacidad, IAM y MCP / A2A.",
    searchAll: "Buscar en todos los ADRs",
    allBlueprints: "Todos los blueprints",
    blueprint: "Blueprint",
    tierLong: ["Nivel piloto", "Nivel crecimiento", "Nivel empresa"],
    modelCost: "Calcular un costo a medida →",
    tabs: ["Arquitectura y secuencia", "Resumen y SLOs", "Estimación de costos (3 niveles)", "Modelo de amenazas STRIDE / OWASP"],
    diagA: "Diagrama de arquitectura de red y seguridad",
    diagASub: "Subredes VPC, Private Service Connect, Cloud NAT, IAM de mínimo privilegio, Cloud DLP, Model Armor, KMS / Secret Manager y Vertex AI",
    diagB: "Diagrama de secuencia de la petición y seguridad",
    diagBSub: "Verificación de identidad, redacción DLP, enrutamiento Flash / Pro, guardrails de herramientas y auditoría",
    docsNote: "La documentación técnica detallada de cada blueprint y ADR está en inglés.",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    reset: "Restablecer zoom",
    sourceBtn: "Código",
    copy: "Copiar",
    copied: "Copiado",
    adrEyebrow: "Formato MADR · punto de equilibrio · señales de revisión",
    adrA: "Registros de decisiones de",
    adrB: "arquitectura",
    adrLede:
      "Cada decisión de infraestructura, privacidad, enrutamiento de modelos e interoperabilidad de agentes, con los números que la justifican y la señal que la revertiría.",
    search: "Buscar — Firestore, Cloud Run, DLP, MCP, A2A, punto de equilibrio…",
    all: "Todos",
    noMatch: "Ningún ADR coincide con",
    backAdrs: "Volver a todos los ADRs",
    calcEyebrow: "us-central1 · bajo demanda · fórmulas de cada cost-estimation.md",
    calcA: "¿Cuánto costará",
    calcB: "cada mes?",
    calcLede: "Elige un blueprint, ajusta el volumen mensual y el reparto entre Gemini Flash y Pro. Cada partida corresponde a un nodo del diagrama de arquitectura.",
    defaultSplit: "Reparto por defecto",
    controls: "Carga de trabajo y FinOps",
    volume: "Volumen mensual",
    flash: "Porcentaje en Gemini Flash (vs escalar a Pro)",
    amortize: "Amortizar la red de una Shared VPC (ALB + Cloud NAT + PSC)",
    amortizeSub: "Para despliegues en una Shared VPC empresarial existente con ingreso y egreso centralizados.",
    spend: "Gasto mensual estimado en GCP",
    perUnit: "por unidad",
    savings: "Ahorro por enrutar Flash / Pro vs 100% Pro",
    perMonth: "/ mes",
    baseline: "Con 100% Pro costaría",
    breakdown: "Costo mensual por servicio — coincide con los nodos del blueprint",
    cols: ["Servicio GCP", "Categoría", "Fórmula / dimensionamiento", "Mensual", "Peso"],
    total: "Costo mensual total estimado",
    saves: "ahorra",
    vsPro: "vs 100% Pro",
    built: "Hecho por Daniel Tafur · AI Solutions Architect (GCP)",
  },
} as const;

export const BLUEPRINT_ES: Record<string, { title: string; shortTitle: string; tagline: string }> = {
  "01-technical-support-automation": {
    title: "Blueprint 01: Automatización de soporte técnico empresarial",
    shortTitle: "Automatización de soporte técnico",
    tagline: "Triaje omnicanal L1/L2 con Firestore Vector Search, redacción en línea con Cloud DLP, Model Armor y escalamiento a Zendesk/Jira con ADK.",
  },
  "02-contract-processing-pipeline": {
    title: "Blueprint 02: Pipeline de procesamiento de contratos y extracción de riesgos",
    shortTitle: "Pipeline de procesamiento de contratos",
    tagline: "Document AI + Cloud Workflows + Cloud Run Jobs orientados a eventos, con tokenización DLP determinista envuelta en KMS y registro de auditoría en BigQuery.",
  },
  "03-internal-sql-analytics-agent": {
    title: "Blueprint 03: Agente interno conectado a bases de datos SQL",
    shortTitle: "Agente interno de analítica SQL",
    tagline: "Servidor MCP de SQL de solo lectura con ADK y zero-trust: guardrails AST deterministas, RLS con la identidad de IAP y límite de 10 GB en dry-run de BigQuery.",
  },
};

export const ADR_ES: Record<string, { title: string; summary: string }> = {
  "ADR-001": {
    title: "Cloud Run v2 (min_instances=0) en lugar de GKE Autopilot/Standard",
    summary: "Los orquestadores de agentes, APIs RAG y servidores MCP son cargas I/O-bound, sin estado y en ráfagas: GKE añade tarifas de clúster, nodos ociosos y carga operativa sin beneficio.",
  },
  "ADR-002": {
    title: "Firestore Vector Search en lugar de endpoints de Vertex AI Vector Search",
    summary: "Búsqueda semántica multi-tenant con filtros estrictos de metadatos sin pagar $150–$220+/mes de nodos de índice encendidos 24/7 aunque no haya consultas.",
  },
  "ADR-003": {
    title: "Enrutamiento por nodo — Gemini 3.8 Flash vs Gemini Pro",
    summary: "Todo a Pro destruye la economía unitaria y la latencia; todo a Flash degrada la precisión en cláusulas legales y SQL complejo. Cada nodo elige el modelo adecuado.",
  },
  "ADR-004": {
    title: "Anonimización con Cloud DLP antes de la inferencia en Vertex AI",
    summary: "Tickets, contratos y columnas SQL contienen PII regulada. Se redacta o tokeniza antes de que llegue al prompt o a los logs, por GDPR, PCI-DSS y SOC 2.",
  },
  "ADR-005": {
    title: "IAM privado con OIDC, patrón BFF en Vercel y aislamiento con VPC-SC",
    summary: "Nada de endpoints públicos con API keys estáticas: un BFF en servidor genera tokens OIDC de corta duración hacia backends privados de GCP.",
  },
  "ADR-006": {
    title: "Acceso a herramientas con MCP y delegación entre agentes con A2A",
    summary: "Evita la proliferación N × M de integraciones y la lógica de seguridad duplicada estandarizando herramientas con MCP y la delegación con A2A.",
  },
};

export const COST_ES = {
  names: {
    "01-technical-support-automation": "BP01 — Automatización de soporte técnico",
    "02-contract-processing-pipeline": "BP02 — Pipeline de procesamiento de contratos",
    "03-internal-sql-analytics-agent": "BP03 — Agente interno de analítica SQL",
  } as Record<string, string>,
  units: {
    "support tickets / mo": "tickets de soporte / mes",
    "20-page contracts / mo": "contratos de 20 páginas / mes",
    "analytics queries / mo": "consultas analíticas / mes",
  } as Record<string, string>,
  tiers: { Pilot: "Piloto", Growth: "Crecimiento", Enterprise: "Empresa" } as Record<string, string>,
  categories: {
    Compute: "Cómputo",
    "AI & Models": "IA y modelos",
    "Data & Storage": "Datos y almacenamiento",
    "Privacy & Security": "Privacidad y seguridad",
    Networking: "Redes",
    Observability: "Observabilidad",
  } as Record<string, string>,
  notes: {
    "Firestore Vector Search saves ~$156–$260/mo vs always-on Vertex AI Vector Search Index Endpoints.":
      "Firestore Vector Search ahorra ~$156–$260/mes frente a endpoints de índice de Vertex AI Vector Search siempre encendidos.",
    "Routing digital-native PDFs around Document AI OCR cuts Enterprise spend by up to 60.5%.":
      "Enviar los PDFs nativos digitales sin pasar por el OCR de Document AI reduce el gasto en el nivel empresa hasta un 60.5%.",
    "BigQuery-only variant (without dedicated Cloud SQL replica) saves $59.50–$248.00/mo.":
      "La variante solo con BigQuery (sin réplica dedicada de Cloud SQL) ahorra $59.50–$248.00/mes.",
  } as Record<string, string>,
};

/** "Pilot (10k/mo)" -> "Piloto (10k/mes)" */
export function tierLabelEs(label: string): string {
  return label.replace(/^(Pilot|Growth|Enterprise)/, (m) => COST_ES.tiers[m] ?? m).replace("/mo", "/mes");
}
