// src/lib/parseExcel.ts
import ExcelJS from "exceljs";
import { Buffer } from "buffer";

export async function parseExcelBuffer(
  bufferLike: Buffer | Uint8Array | ArrayBuffer
): Promise<Record<string, any>[]> {
  const workbook = new ExcelJS.Workbook();

  // Normaliza para Buffer do Node
  let nodeBuffer: Buffer;
  if (Buffer.isBuffer(bufferLike)) {
    nodeBuffer = bufferLike as Buffer;
  } else if (bufferLike instanceof Uint8Array) {
    nodeBuffer = Buffer.from(bufferLike);
  } else {
    nodeBuffer = Buffer.from(bufferLike as ArrayBuffer);
  }

  // exceljs aceita um Buffer; o cast para any evita a incompatibilidade de tipos do TS
  await workbook.xlsx.load(nodeBuffer as any);

  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows: Record<string, any>[] = [];

  const headerValues = (sheet.getRow(1).values || []) as any[];
  const headerRow = headerValues.length && headerValues[0] === undefined
    ? headerValues.slice(1)
    : headerValues;

  for (let r = 2; r <= sheet.rowCount; r++) {
    const rowValues = (sheet.getRow(r).values || []) as any[];
    const obj: Record<string, any> = {};

    for (let c = 0; c < headerRow.length; c++) {
      const header = headerRow[c];
      const key = header ? String(header).trim() : `col_${c + 1}`;
      const value = rowValues.length && rowValues[0] === undefined ? rowValues[c + 1] : rowValues[c];
      obj[key] = value ?? null;
    }

    rows.push(obj);
  }

  return rows;
}