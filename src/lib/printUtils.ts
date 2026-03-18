/**
 * Utility to open a print-ready A4 window with professional formatting.
 */
export interface PrintHeader {
  organizationName: string;
  branchName: string;
  documentTitle: string;
  date?: string;
}

const PRINT_STYLES = `
  @page { size: A4; margin: 15mm 20mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #1a1a1a;
    line-height: 1.5;
    max-width: 210mm;
    margin: 0 auto;
    padding: 0;
    font-size: 11px;
  }
  .print-header {
    border-bottom: 2px solid #1a1a1a;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }
  .print-header h1 { font-size: 18px; margin: 0 0 2px; }
  .print-header .org-name { font-size: 13px; font-weight: 600; color: #374151; margin: 0; }
  .print-header .branch-name { font-size: 11px; color: #6b7280; margin: 0; }
  .print-header .date { font-size: 10px; color: #9ca3af; margin: 4px 0 0; }
  .print-header-row { display: flex; justify-content: space-between; align-items: flex-start; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10px; }
  th, td { border: 1px solid #d1d5db; padding: 5px 8px; text-align: left; vertical-align: top; }
  th { background: #f3f4f6; font-weight: 600; color: #374151; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
  .badge-ccp { background: #fee2e2; color: #991b1b; }
  .badge-oprp { background: #fef3c7; color: #92400e; }
  .badge-prp { background: #dbeafe; color: #1e40af; }
  .badge-ok { background: #d1fae5; color: #065f46; }
  .badge-notok { background: #fee2e2; color: #991b1b; }
  .section-title { font-size: 13px; font-weight: 600; margin: 18px 0 8px; color: #1f2937; }
  .blank-line { border-bottom: 1px solid #d1d5db; height: 28px; margin: 4px 0; }
  .blank-area { border: 1px solid #d1d5db; min-height: 60px; margin: 8px 0; }
  .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; display: flex; justify-content: space-between; }
  @media print { body { padding: 0; } .no-print { display: none !important; } }
`;

function buildHeader(header: PrintHeader): string {
  const date = header.date || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  return `
    <div class="print-header">
      <div class="print-header-row">
        <div>
          <p class="org-name">${escapeHtml(header.organizationName)}</p>
          <p class="branch-name">${escapeHtml(header.branchName)}</p>
        </div>
        <p class="date">${escapeHtml(date)}</p>
      </div>
      <h1>${escapeHtml(header.documentTitle)}</h1>
    </div>
  `;
}

function buildFooter(header: PrintHeader): string {
  return `
    <div class="footer">
      <span>${escapeHtml(header.organizationName)} — ${escapeHtml(header.documentTitle)}</span>
      <span>Printed: ${new Date().toLocaleDateString("en-GB")}</span>
    </div>
  `;
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function openPrintWindow(header: PrintHeader, bodyHtml: string) {
  const w = window.open("", "_blank");
  if (!w) return;

  w.document.write(`<!DOCTYPE html><html><head>
    <title>${escapeHtml(header.documentTitle)}</title>
    <style>${PRINT_STYLES}</style>
  </head><body>
    ${buildHeader(header)}
    ${bodyHtml}
    ${buildFooter(header)}
  </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 300);
}

/** Build a blank template table with empty rows */
export function blankTable(columns: string[], rows = 15): string {
  const ths = columns.map(c => `<th>${escapeHtml(c)}</th>`).join("");
  const emptyRow = columns.map(() => `<td class="blank-line"></td>`).join("");
  const trs = Array(rows).fill(`<tr>${emptyRow}</tr>`).join("");
  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

/** Get control type badge class */
export function controlBadgeClass(ct: string | null): string {
  if (!ct) return "badge";
  const u = ct.toUpperCase();
  if (u === "CCP") return "badge badge-ccp";
  if (u === "OPRP") return "badge badge-oprp";
  return "badge badge-prp";
}
