import { NextResponse } from "next/server";

const CONNECTORS = [
  {
    id: 1,
    name: "Itaú Empresas",
    imageUrl: "https://logodownload.org/wp-content/uploads/2017/05/itau-logo-3.png",
    primaryColor: "#ec7000",
    type: "BUSINESS_BANK",
    country: "BR",
  },
  {
    id: 2,
    name: "Bradesco Empresas",
    imageUrl: "https://logodownload.org/wp-content/uploads/2014/10/bradesco-logo-0.png",
    primaryColor: "#cc092f",
    type: "BUSINESS_BANK",
    country: "BR",
  },
  {
    id: 3,
    name: "Santander Empresas",
    imageUrl: "https://logodownload.org/wp-content/uploads/2019/02/santander-logo-0.png",
    primaryColor: "#ec0000",
    type: "BUSINESS_BANK",
    country: "BR",
  },
  {
    id: 4,
    name: "Cora",
    imageUrl: "https://play-lh.googleusercontent.com/8o8_9oYw4kM4P2vM0Q7S2U5W4m9dW0jD0jD4sSg4B5bH0D1S3rP1xXrVbS8K0n9F2w",
    primaryColor: "#6c5ce7",
    type: "BUSINESS_BANK",
    country: "BR",
  },
  {
    id: 5,
    name: "Banco do Brasil Empresas",
    imageUrl: "https://logodownload.org/wp-content/uploads/2014/10/banco-do-brasil-logo-0.png",
    primaryColor: "#f7c600",
    type: "BUSINESS_BANK",
    country: "BR",
  },
  {
    id: 6,
    name: "Caixa",
    imageUrl: "https://logodownload.org/wp-content/uploads/2014/10/caixa-logo-0.png",
    primaryColor: "#0066b3",
    type: "BUSINESS_BANK",
    country: "BR",
  },
];

export async function GET() {
  return NextResponse.json({
    results: CONNECTORS,
  });
}
