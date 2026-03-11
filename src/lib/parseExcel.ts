import ExcelJS from "exceljs";

export async function parseExcelBuffer(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows: Record<string, any>[] = [];
  const headerRow = sheet.getRow(1).values as any[];

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r).values as any[];
    const obj: Record<string, any> = {};
    for (let c = 1; c < headerRow.length; c++) {
      const key = headerRow[c] ? String(headerRow[c]).trim() : col_;
      obj[key] = row[c] ?? null;
    }
    rows.push(obj);
  }

  return rows;
}
