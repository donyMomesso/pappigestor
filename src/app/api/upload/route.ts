import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { ensureDir, publicUploadsDir, sanitizeFileName } from '../_financeiro/helpers';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    const type = String(form.get('type') || 'arquivo');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    }

    const dir = path.join(publicUploadsDir(), sanitizeFileName(type));
    await ensureDir(dir);

    const ext = path.extname(file.name || '') || '.bin';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeFileName(path.basename(file.name, ext))}${ext}`;
    const abs = path.join(dir, name);
    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(abs, bytes);

    const relativeUrl = `/uploads/${sanitizeFileName(type)}/${name}`;
    return NextResponse.json({ url: relativeUrl, name: file.name, size: file.size, type: file.type || 'application/octet-stream' });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro ao fazer upload' }, { status: 500 });
  }
}
