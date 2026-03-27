import type { Metadata } from "next";
import VaultPage from "@/components/vault";

export const metadata: Metadata = {
  title: "Vault",
  description:
    "Upload and organize files in your Orgnote vault — images, PDFs, and more.",
  openGraph: {
    title: "Vault — Orgnote",
    description:
      "Upload and organize files in your Orgnote vault — images, PDFs, and more.",
  },
};

export default function Vault() {
  return <VaultPage />;
}
