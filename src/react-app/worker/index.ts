import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono().basePath('/api');

// Middleware para permitir chamadas do Frontend
app.use('*', cors());

app.post('/ia/ler-nota', async (c) => {
  try {
    const formData = await c.req.parseBody();
    const file = formData['file'];
    const empresa_id = formData['empresa_id'];

    if (!file || !empresa_id) {
      return c.json({ success: false, error: 'Dados insuficientes enviados ao servidor.' }, 400);
    }

    // Aqui podes integrar com o Google Gemini ou OpenAI
    return c.json({
      success: true,
      fornecedor: "FORNECEDOR VIA WORKER",
      valor_total: 980.40,
      tipo: "PDF/Imagem",
      itens: []
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;