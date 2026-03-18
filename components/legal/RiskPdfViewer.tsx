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
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!focusedPage) return;
    setCurrentPage(focusedPage);
  }, [focusedPage]);

  useEffect(() => {
    if (!fileUrl) {
      setNumPages(0);
      setCurrentPage(1);
    }
  }, [fileUrl]);

  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef.current) return;
      setContainerWidth(Math.max(320, Math.floor(containerRef.current.clientWidth - 16)));
    };

    updateWidth();
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
        <div className="mx-auto relative w-fit">
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages: loaded }) => {
              setNumPages(loaded);
              setCurrentPage((p) => Math.min(Math.max(1, p), loaded));
            }}
            loading={<div className="text-sm text-muted-foreground p-4">Loading PDF...</div>}
            error={<div className="text-sm text-destructive p-4">Failed to render PDF.</div>}
          >
            <div className="relative">
              <Page
                pageNumber={currentPage}
                width={containerWidth}
                renderAnnotationLayer={false}
                renderTextLayer={false}
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
