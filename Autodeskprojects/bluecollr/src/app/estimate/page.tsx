import type { Metadata } from "next";
import ErrorBoundary from "@/components/ErrorBoundary";
import EstimateClient from "./EstimateClient";

export const metadata: Metadata = {
  title: "Estimate Generator",
  description: "Create and download a branded PDF estimate in 60 seconds.",
};

export default function EstimatePage() {
  return (
    <ErrorBoundary>
      <EstimateClient />
    </ErrorBoundary>
  );
}
