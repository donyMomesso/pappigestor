import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { NextResponse } from "next/server";

let cachedClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada.");
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenerativeAI(apiKey);
  }

  return cachedClient;
}

export function getGeminiModel(
  model = "gemini-1.5-flash"
): GenerativeModel {
  const client = getGeminiClient();
  return client.getGenerativeModel({ model });
}

export function jsonResponse(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(
  message: string,
  status = 500,
  details?: unknown
) {
  return NextResponse.json(
    {
      error: message,
      ...(details !== undefined ? { details } : {}),
    },
    { status }
  );
}
