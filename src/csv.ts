/* Downloading your records for Excel.

   Everything is written as a CSV file, which Excel, Numbers and Google
   Sheets all open directly. Nothing leaves your browser: the file is
   built on your own computer from what is already on screen. */

const cell = (v: unknown): string => {
  const text = v === null || v === undefined ? '' : String(v);
  return `"${text.replace(/"/g, '""')}"`;
};

export function downloadCsv(
  filename: string,
  columns: string[],
  rows: (string | number | null | undefined)[][],
) {
  const lines = [columns.map(cell).join(','), ...rows.map(r => r.map(cell).join(','))];

  // The marker at the front tells Excel the file is UTF-8, so Burmese
  // names and the Ks symbol survive.
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${filename}-${stamp}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
