/**
 * AI Service API client.
 * All calls go through Next.js rewrite (/api/ai/* → localhost:8000/api/*).
 */

const AI_BASE = "/api/ai";

/** 5 minutes — LLM calls are slow on free tier */
const AI_TIMEOUT = 300_000;

function normalizeAiUrl(url: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  url = url.replace(/^\/api\/ai\/ai\//, "/api/ai/");
  if (url.startsWith(`${AI_BASE}/`)) return url;
  if (url.startsWith("/api/")) return url.replace(/^\/api\//, `${AI_BASE}/`);
  return url;
}

// ─── Risk Check ──────────────────────────────────────────────────────────────

export interface RiskItemResult {
  risk_id: string;
  clause_ref: string | null;
  level: "critical" | "high" | "medium" | "low" | "safe";
  confidence: number;
  title_th: string;
  title_en: string;
  description_th: string;
  description_en: string;
  recommendation_th: string;
  recommendation_en: string;
  category: string;
  legal_refs: { law_name: string; section: string; summary: string; relevance: string }[];
}

export interface ChatContractMismatch {
  field: string;
  chat_value: string;
  contract_value: string;
  severity: "critical" | "high" | "medium" | "low" | "safe";
}

export interface RiskCheckResponse {
  overall_risk: "critical" | "high" | "medium" | "low" | "safe";
  risk_score: number;
  risks: RiskItemResult[];
  mismatches: ChatContractMismatch[];
  legal_checklist: { law_name: string; section: string; summary: string; relevance: string }[];
  summary_th: string;
  summary_en: string;
  contract_type: string;
  processing_time_seconds: number;
}

export interface ChatMessagePayload {
  sender: string;
  message: string;
  timestamp: string;
}

export interface FactoryInfoPayload {
  factory_id: string;
  name: string;
  location?: string;
  category?: string;
  certifications?: string[];
  rating?: number;
  verified?: boolean;
}

/**
 * Upload a contract PDF and run the full risk analysis pipeline.
 */
export async function analyzeContractRisk(
  file: File,
  chatHistory: ChatMessagePayload[] = [],
  factoryInfo?: FactoryInfoPayload,
  language = "both",
): Promise<RiskCheckResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("chat_history", JSON.stringify(chatHistory));
  if (factoryInfo) form.append("factory_info", JSON.stringify(factoryInfo));
  form.append("language", language);

  const res = await fetch(`${AI_BASE}/risk-check/analyze`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(AI_TIMEOUT),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Risk analysis failed (${res.status}): ${err}`);
  }
  return res.json();
}

/**
 * OCR-only: extract text without running risk analysis.
 */
export async function ocrOnly(file: File): Promise<{ text: string; page_count: number }> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${AI_BASE}/risk-check/ocr-only`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`OCR failed (${res.status})`);
  return res.json();
}

// ─── Risk Explanation ────────────────────────────────────────────────────────

export interface RiskExplainRequest {
  risk_id: string;
  title_th: string;
  title_en: string;
  level: string;
  clause_ref: string;
  description_th: string;
  description_en: string;
  recommendation_th: string;
  recommendation_en: string;
  category: string;
}

export interface RiskExplainResponse {
  risk_id: string;
  explanation_th: string;
  explanation_en: string;
  business_impact: string[];
  worst_case_scenario: string;
  suggested_fix: string;
}

/**
 * Get an AI-powered deep explanation of a single risk item.
 */
export async function explainRisk(
  risk: RiskExplainRequest,
): Promise<RiskExplainResponse> {
  const res = await fetch(`${AI_BASE}/risk-check/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(risk),
    signal: AbortSignal.timeout(AI_TIMEOUT),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Risk explanation failed (${res.status}): ${err}`);
  }
  return res.json();
}

// ─── Contract Draft ──────────────────────────────────────────────────────────

export interface DealSheet {
  vendor?: { name: string; role: string; company?: string; address?: string; tax_id?: string } | null;
  client?: { name: string; role: string; company?: string; address?: string; tax_id?: string } | null;
  product?: { name: string; specs?: string; quantity?: number; unit?: string } | null;
  total_price?: number | null;
  currency?: string;
  delivery_date?: string | null;
  delivery_weeks?: string | null;
  commercial_terms?: {
    commercial_type?: string;
    ip_ownership?: string;
    ip_details?: string;
    penalty_type?: string;
    penalty_details?: string;
  } | null;
  additional_notes?: string | null;
  confidence?: number;
}

export interface ExtractContextResponse {
  deal_sheet: DealSheet;
  suggested_template: string;
  auto_filled_fields: string[];
}

export interface ContractArticle {
  article_number: number;
  title_th: string;
  title_en: string;
  body_th: string;
  body_en: string;
  is_editable: boolean;
}

export interface GenerateDraftResponse {
  contract_title: string;
  contract_filename: string;
  articles: ContractArticle[];
  effective_date: string | null;
  preamble_th: string;
  preamble_en: string;
}

export interface FinalizeResponse {
  pdf_url: string | null;
  docx_url: string | null;
  contract_id: string;
  message_th: string;
  message_en: string;
  saved_to_history: boolean;
}

export interface TemplateInfo {
  type: string;
  name_th: string;
  name_en: string;
  description: string;
  required_articles: string[];
}

/**
 * List available contract templates.
 */
export async function getTemplates(): Promise<{ templates: TemplateInfo[] }> {
  const res = await fetch(`${AI_BASE}/contract-draft/templates`);
  if (!res.ok) throw new Error(`Failed to fetch templates (${res.status})`);
  return res.json();
}

/**
 * Step 1: Extract deal context from chat history.
 */
export async function extractContext(
  chatHistory: ChatMessagePayload[],
  factoryName?: string,
  factoryId?: string,
): Promise<ExtractContextResponse> {
  const res = await fetch(`${AI_BASE}/contract-draft/extract-context`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_history: chatHistory,
      factory_name: factoryName,
      factory_id: factoryId,
    }),
  });

  if (!res.ok) throw new Error(`Context extraction failed (${res.status})`);
  return res.json();
}

/**
 * Step 2+3: Generate draft articles from deal sheet + template.
 */
export async function generateDraft(payload: {
  template_type: string;
  deal_sheet: DealSheet;
  parties?: { name: string; role: string; company?: string }[];
  product?: { name: string; specs?: string; quantity?: number; unit?: string };
  total_price?: number;
  delivery_date?: string;
  commercial_terms?: {
    ip_ownership?: string;
    penalty_type?: string;
    penalty_details?: string;
  };
  language?: string;
}): Promise<GenerateDraftResponse> {
  const res = await fetch(`${AI_BASE}/contract-draft/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(AI_TIMEOUT),
  });

  if (!res.ok) throw new Error(`Draft generation failed (${res.status})`);
  return res.json();
}

/**
 * Step 4: Finalize contract and generate downloadable files.
 */
export async function finalizeContract(payload: {
  contract_title: string;
  articles: ContractArticle[];
  preamble_th?: string;
  effective_date?: string;
  parties?: { name: string; role: string; company?: string }[];
  deal_sheet?: DealSheet;
  output_format?: string;
}): Promise<FinalizeResponse> {
  const res = await fetch(`${AI_BASE}/contract-draft/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(AI_TIMEOUT),
  });

  if (!res.ok) throw new Error(`Finalization failed (${res.status})`);
  const result: FinalizeResponse = await res.json();
  return {
    ...result,
    pdf_url: normalizeAiUrl(result.pdf_url),
    docx_url: normalizeAiUrl(result.docx_url),
  };
}

/**
 * Get the download URL for a finalized contract.
 */
export function getContractDownloadUrl(contractId: string, format: "pdf" | "docx"): string {
  return `${AI_BASE}/contract-draft/contracts/${contractId}/download/${format}`;
}

/**
 * Health check — is AI service running?
 */
export async function checkAIHealth(): Promise<boolean> {
  try {
    const res = await fetch(`/api/ai-health`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
