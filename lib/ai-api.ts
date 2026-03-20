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

interface ExtractContextOptions {
  forceRefresh?: boolean;
}

type ExtractContextCacheEntry = {
  createdAt: number;
  promise: Promise<ExtractContextResponse>;
};

const EXTRACT_CONTEXT_CACHE = new Map<string, ExtractContextCacheEntry>();
const EXTRACT_CONTEXT_CACHE_MAX = 32;
const EXTRACT_CONTEXT_MAX_MESSAGES = 10;
const EXTRACT_CONTEXT_MAX_CHARS = 2200;

const EXTRACT_CONTEXT_PRIORITY_PATTERNS = [
  /buyer|seller|vendor|factory|manufacturer|company|address|tax|vat/i,
  /product|formula|ingredient|packaging|spec|size|shade|sku|label/i,
  /price|cost|quote|budget|total|deposit|payment|milestone|percent|%/i,
  /moq|qty|quantity|pieces|pcs|kg|unit|batch/i,
  /delivery|lead time|shipment|ship|weeks|days|deadline/i,
  /qc|quality|inspection|standard|gmp|iso|sample|approve/i,
  /fda|registration|regulatory|อย\.|compliance/i,
  /ip|intellectual property|formula ownership|artwork|tooling|penalty|terminate/i,
];

const EXTRACT_CONTEXT_ANCHOR_PATTERNS = [
  /this is .* from /i,
  /we are based at /i,
  /tax id/i,
  /delivery should go to /i,
  /the product should be /i,
];

function scoreExtractContextMessage(message: ChatMessagePayload) {
  const text = (message.message || "").trim();
  if (!text) return -1;

  let score = 0;
  for (const pattern of EXTRACT_CONTEXT_PRIORITY_PATTERNS) {
    if (pattern.test(text)) score += 3;
  }
  if (/\d/.test(text)) score += 2;
  if (text.length > 40) score += 1;
  if ((message.sender || "").toLowerCase() === "factory") score += 1;
  return score;
}

function normalizeChatHistory(chatHistory: ChatMessagePayload[]) {
  const normalized = chatHistory
    .filter((message) => {
      const text = (message.message || "").trim();
      if (!text) return false;
      if ((message.sender || "").toLowerCase() === "system") return false;
      if (text.toLowerCase().startsWith("uploaded:")) return false;
      return true;
    })
    .map((message) => ({
      sender: (message.sender || "").trim().toLowerCase(),
      message: (message.message || "").trim(),
      timestamp: message.timestamp || "",
    }));

  const scored = normalized
    .map((message, index) => ({
      message,
      index,
      score: scoreExtractContextMessage(message),
    }))
    .filter((item) => item.score >= 0);

  const anchorIndexes = new Set<number>();
  const firstUserIndex = normalized.findIndex((message) => message.sender === "user");
  const firstFactoryIndex = normalized.findIndex((message) => message.sender === "factory");
  if (firstUserIndex >= 0) anchorIndexes.add(firstUserIndex);
  if (firstFactoryIndex >= 0) anchorIndexes.add(firstFactoryIndex);

  for (const item of scored) {
    if (EXTRACT_CONTEXT_ANCHOR_PATTERNS.some((pattern) => pattern.test(item.message.message))) {
      anchorIndexes.add(item.index);
    }
  }

  const anchored = scored
    .filter((item) => anchorIndexes.has(item.index))
    .sort((left, right) => left.index - right.index);

  const remainingSlots = Math.max(EXTRACT_CONTEXT_MAX_MESSAGES - anchored.length, 0);
  const prioritizedRemainder = scored
    .filter((item) => !anchorIndexes.has(item.index))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return right.index - left.index;
    })
    .slice(0, remainingSlots);

  const prioritized = [...anchored, ...prioritizedRemainder]
    .sort((left, right) => left.index - right.index)
    .map((item) => item.message);

  const bounded: typeof prioritized = [];
  let totalChars = 0;
  for (let index = prioritized.length - 1; index >= 0; index -= 1) {
    const message = prioritized[index];
    const nextChars = totalChars + message.message.length;
    if (bounded.length > 0 && nextChars > EXTRACT_CONTEXT_MAX_CHARS) {
      continue;
    }
    bounded.push(message);
    totalChars = nextChars;
  }

  return bounded.reverse();
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function buildExtractContextCacheKey(
  chatHistory: ChatMessagePayload[],
  factoryName?: string,
  factoryId?: string,
) {
  const normalized = normalizeChatHistory(chatHistory);
  const chatHash = hashString(JSON.stringify(normalized));
  return [
    factoryId || "unknown-factory-id",
    factoryName || "unknown-factory-name",
    chatHash,
  ].join(":");
}

function rememberExtractContext(
  key: string,
  promise: Promise<ExtractContextResponse>,
) {
  EXTRACT_CONTEXT_CACHE.set(key, { createdAt: Date.now(), promise });
  if (EXTRACT_CONTEXT_CACHE.size <= EXTRACT_CONTEXT_CACHE_MAX) return;

  const oldest = [...EXTRACT_CONTEXT_CACHE.entries()].sort(
    (left, right) => left[1].createdAt - right[1].createdAt,
  )[0];

  if (oldest) {
    EXTRACT_CONTEXT_CACHE.delete(oldest[0]);
  }
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
  anchors: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    snippet: string;
  }[];
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
  acceptable_findings?: RiskItemResult[];
  mismatches: ChatContractMismatch[];
  legal_checklist: { law_name: string; section: string; summary: string; relevance: string }[];
  summary_th: string;
  summary_en: string;
  contract_type: string;
  processing_time_seconds: number;
}

export interface StoredRiskCheckResult {
  analysis_id: string;
  created_at: string;
  source_filename: string;
  source_content_type: string;
  source_file_url: string;
  result: RiskCheckResponse;
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

export async function getLatestStoredRiskResult(): Promise<StoredRiskCheckResult> {
  const res = await fetch(`${AI_BASE}/risk-check/latest-result`, {
    signal: AbortSignal.timeout(AI_TIMEOUT),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Latest risk result failed (${res.status}): ${err}`);
  }

  const data = (await res.json()) as StoredRiskCheckResult;
  data.source_file_url = normalizeAiUrl(data.source_file_url) || data.source_file_url;
  return data;
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
  compliance_notice: string;
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
  product?: {
    name: string;
    specs?: string;
    quantity?: number;
    unit?: string;
    packaging?: string | null;
    target_market?: string | null;
  } | null;
  total_price?: number | null;
  currency?: string;
  delivery_date?: string | null;
  delivery_weeks?: string | null;
  delivery_address?: string | null;
  payment_milestones?: {
    label?: string;
    amount_percentage?: number | null;
    amount_fixed?: number | null;
    due_event?: string | null;
    notes?: string | null;
  }[] | null;
  quality_terms?: {
    standards?: string[];
    qc_basis?: string | null;
    acceptance_window_days?: number | null;
    defect_remedy?: string | null;
    warranty_period_days?: number | null;
  } | null;
  regulatory_terms?: {
    registration_owner?: string | null;
    document_support_by?: string | null;
    label_compliance_owner?: string | null;
    target_market?: string | null;
    notes?: string | null;
  } | null;
  commercial_terms?: {
    commercial_type?: string;
    ip_ownership?: string;
    ip_details?: string;
    penalty_type?: string;
    penalty_details?: string;
    payment_terms_summary?: string | null;
    artwork_ownership?: string | null;
    tooling_ownership?: string | null;
    tooling_return_required?: boolean | null;
    lead_time_days?: number | null;
    termination_trigger?: string | null;
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
  retrieval_debug?: Record<string, Array<Record<string, string>>>;
  polish_applied?: boolean;
}

export interface FinalizeResponse {
  pdf_url: string | null;
  docx_url: string | null;
  contract_id: string;
  message_th: string;
  message_en: string;
  saved_to_history: boolean;
}

export interface ContractHistoryItem {
  id: string;
  contract_id: string;
  base_name: string;
  created_at: string;
  pdf_url: string | null;
  docx_url: string | null;
  has_deal_sheet: boolean;
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
  options: ExtractContextOptions = {},
): Promise<ExtractContextResponse> {
  const cacheKey = buildExtractContextCacheKey(chatHistory, factoryName, factoryId);
  if (!options.forceRefresh) {
    const cached = EXTRACT_CONTEXT_CACHE.get(cacheKey);
    if (cached) {
      return cached.promise;
    }
  }

  const promise = (async () => {
    const res = await fetch(`${AI_BASE}/contract-draft/extract-context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_history: normalizeChatHistory(chatHistory),
        factory_name: factoryName,
        factory_id: factoryId,
        force_refresh: options.forceRefresh ?? false,
      }),
      signal: AbortSignal.timeout(AI_TIMEOUT),
    });

    if (!res.ok) throw new Error(`Context extraction failed (${res.status})`);
    return res.json();
  })();

  rememberExtractContext(cacheKey, promise);

  try {
    return await promise;
  } catch (error) {
    EXTRACT_CONTEXT_CACHE.delete(cacheKey);
    throw error;
  }
}

/**
 * Step 2+3: Generate draft articles from deal sheet + template.
 */
export async function generateDraft(payload: {
  template_type: string;
  deal_sheet: DealSheet;
  parties?: { name: string; role: string; company?: string; address?: string; tax_id?: string }[];
  product?: {
    name: string;
    specs?: string;
    quantity?: number;
    unit?: string;
    packaging?: string | null;
    target_market?: string | null;
  };
  total_price?: number;
  delivery_date?: string;
  commercial_terms?: {
    ip_ownership?: string;
    penalty_type?: string;
    penalty_details?: string;
    payment_terms_summary?: string | null;
    artwork_ownership?: string | null;
    tooling_ownership?: string | null;
    tooling_return_required?: boolean | null;
    lead_time_days?: number | null;
    termination_trigger?: string | null;
  };
  language?: string;
  skip_polish?: boolean;
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
  parties?: { name: string; role: string; company?: string; address?: string; tax_id?: string }[];
  deal_sheet?: DealSheet;
  output_format?: string;
  polish_before_export?: boolean;
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

export async function getContractHistory(): Promise<{ contracts: ContractHistoryItem[] }> {
  const res = await fetch(`${AI_BASE}/contract-draft/history`, {
    signal: AbortSignal.timeout(AI_TIMEOUT),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Contract history failed (${res.status}): ${err}`);
  }
  const result: { contracts: ContractHistoryItem[] } = await res.json();
  return {
    contracts: result.contracts.map((item) => ({
      ...item,
      pdf_url: normalizeAiUrl(item.pdf_url),
      docx_url: normalizeAiUrl(item.docx_url),
    })),
  };
}

/**
 * Get the download URL for a finalized contract.
 */
export function getContractDownloadUrl(contractId: string, format: "pdf" | "docx"): string {
  return `${AI_BASE}/contract-draft/contracts/${contractId}/download/${format}`;
}

export async function downloadFile(url: string, filename?: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename || "download";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
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
