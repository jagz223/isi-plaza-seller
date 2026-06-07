import * as XLSX from 'xlsx';

import { readUriAsArrayBuffer } from '@/utils/read-uri-as-array-buffer';

const MAX_PREVIEW_ROWS = 50;
const MAX_PREVIEW_COLS = 15;

function escapeHtml(value: unknown): string {
  const text = value == null ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rowsToTableHtml(rows: unknown[][]): string {
  if (rows.length === 0) {
    return '<p style="padding:12px;color:#666;">La hoja está vacía.</p>';
  }

  const limited = rows
    .slice(0, MAX_PREVIEW_ROWS)
    .map((row) => (Array.isArray(row) ? row.slice(0, MAX_PREVIEW_COLS) : []));

  const [headerRow, ...bodyRows] = limited;
  const headerCells = (headerRow ?? []).map(
    (cell) => `<th>${escapeHtml(cell)}</th>`,
  ).join('');
  const bodyHtml = bodyRows
    .map((row) => {
      const cells = row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const truncatedNote =
    rows.length > MAX_PREVIEW_ROWS
      ? `<p class="note">Mostrando las primeras ${MAX_PREVIEW_ROWS} filas.</p>`
      : '';

  return `
    <table>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyHtml}</tbody>
    </table>
    ${truncatedNote}
  `;
}

export async function buildLocalSpreadsheetPreviewHtml(uri: string): Promise<string> {
  const buffer = await readUriAsArrayBuffer(uri);
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('El archivo Excel no tiene hojas.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as unknown[][];

  const tableHtml = rowsToTableHtml(rows);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 8px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 12px; background: #fff; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
    thead tr { background: #2563eb; color: #fff; }
    tbody tr:nth-child(even) { background: #eff6ff; }
    .note { margin-top: 8px; color: #64748b; font-size: 11px; }
  </style>
</head>
<body>
  ${tableHtml}
</body>
</html>`;
}
