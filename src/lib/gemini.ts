import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

export function getGeminiModel(modelName = "gemini-2.5-flash") {
  if (!apiKey) {
    throw new Error("Falta GOOGLE_API_KEY (ou GEMINI_API_KEY) no .env.local");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

export function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function errorResponse(message: string, status = 500, extra?: any) {
  return jsonResponse(
    { error: message, ...(extra ? { extra } : {}) },
    status
  );
}
