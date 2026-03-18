"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileWarning } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export interface RiskHighlight {
  riskId: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  snippet?: string;
}

interface RiskPdfViewerProps {
  fileUrl: string | null;
  highlights: RiskHighlight[];
  selectedRiskId: string | null;
  focusedPage?: number | null;
  onHighlightClick: (riskId: string) => void;
}

async function sendPdfViewerLog(level: "info" | "warn" | "error", event: string, context: Record<string, unknown>) {
  try {
    await fetch("/api/ai/risk-check/client-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, event, context }),
    });
  } catch {
    // Best-effort logging only.
  }
}

export function RiskPdfViewer({
  fileUrl,
  highlights,
  selectedRiskId,
  focusedPage,
  onHighlightClick,
}: RiskPdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [containerWidth, setContainerWidth] = useState(800);
  const [docError, setDocError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!focusedPage) return;
    setCurrentPage(focusedPage);
  }, [focusedPage]);

  useEffect(() => {
    if (!fileUrl) {
      setNumPages(0);
      setCurrentPage(1);
      setDocError(null);
      setPageError(null);
      return;
    }
    void sendPdfViewerLog("info", "pdf_file_loading", { fileUrl });
  }, [fileUrl]);

  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef.current) return;
      setContainerWidth(Math.max(320, Math.floor(containerRef.current.clientWidth - 16)));
    };

    updateWidth();
    void sendPdfViewerLog("info", "pdf_worker_configured", {
      workerSrc: pdfjs.GlobalWorkerOptions.workerSrc,
    });
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const currentPageHighlights = useMemo(
    () => highlights.filter((h) => h.page === currentPage),
    [highlights, currentPage],
  );

  const prevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage((p) => Math.min(numPages || 1, p + 1));

  if (!fileUrl) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
        <FileWarning className="h-5 w-5" />
        <span>Upload a document to preview and highlight risks</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="h-10 border-b flex items-center justify-between px-3 bg-card flex-shrink-0">
        <span className="text-xs text-muted-foreground">Page {currentPage}{numPages ? ` / ${numPages}` : ""}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevPage} disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextPage} disabled={numPages === 0 || currentPage >= numPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto p-2 bg-secondary/10">
        {(docError || pageError) && (
          <div className="mb-2 rounded border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
            PDF render issue: {docError || pageError}
          </div>
        )}
        <div className="mx-auto relative w-fit">
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages: loaded }) => {
              void sendPdfViewerLog("info", "pdf_document_loaded", {
                numPages: loaded,
                containerWidth,
              });
              setNumPages(loaded);
              setCurrentPage((p) => Math.min(Math.max(1, p), loaded));
              setDocError(null);
              setPageError(null);
            }}
            onLoadError={(error) => {
              const message = error instanceof Error ? error.message : String(error);
              void sendPdfViewerLog("error", "pdf_document_load_error", {
                message,
              });
              setDocError(message);
            }}
            onSourceError={(error) => {
              const message = error instanceof Error ? error.message : String(error);
              void sendPdfViewerLog("error", "pdf_document_source_error", {
                message,
              });
              setDocError(message);
            }}
            loading={<div className="text-sm text-muted-foreground p-4">Loading PDF...</div>}
            error={<div className="text-sm text-destructive p-4">Failed to render PDF. Viewer diagnostics were sent to backend logs.</div>}
          >
            <div className="relative">
              <Page
                pageNumber={currentPage}
                width={containerWidth}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                onRenderSuccess={() => {
                  void sendPdfViewerLog("info", "pdf_page_rendered", {
                    currentPage,
                    containerWidth,
                  });
                  setPageError(null);
                }}
                onRenderError={(error) => {
                  const message = error instanceof Error ? error.message : String(error);
                  void sendPdfViewerLog("error", "pdf_page_render_error", {
                    currentPage,
                    containerWidth,
                    message,
                  });
                  setPageError(message);
                }}
              />

              <div className="absolute inset-0 pointer-events-none">
                {currentPageHighlights.map((hl, idx) => {
                  const selected = selectedRiskId === hl.riskId;
                  return (
                    <button
                      key={`${hl.riskId}-${idx}`}
                      type="button"
                      className={`absolute pointer-events-auto border rounded-sm transition-colors ${selected
                        ? "bg-destructive/30 border-destructive"
                        : "bg-warning/25 border-warning/80 hover:bg-warning/35"
                        }`}
                      style={{
                        left: `${hl.x * 100}%`,
                        top: `${hl.y * 100}%`,
                        width: `${hl.width * 100}%`,
                        height: `${hl.height * 100}%`,
                      }}
                      onClick={() => onHighlightClick(hl.riskId)}
                      title={hl.snippet || "Risk-highlighted text"}
                    />
                  );
                })}
              </div>
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
}
