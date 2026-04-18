"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Algo deu errado
        </h1>
        <p className="text-gray-500 max-w-sm">
          Ocorreu um erro inesperado. Tente novamente ou entre em contato com o
          suporte.
        </p>
        <Button onClick={reset} variant="outline">
          Tentar novamente
        </Button>
      </div>
    </main>
  );
}
