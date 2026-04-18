"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { Search } from "lucide-react";

export default function SearchInput({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpa timer ao desmontar
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleSearch = useCallback(
    (term: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        if (term) {
          params.set("q", term);
        } else {
          params.delete("q");
        }
        router.push(`${pathname}?${params.toString()}`);
      }, 300);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="relative">
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="search"
        placeholder="Buscar por nome, empresa ou e-mail..."
        defaultValue={defaultValue}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}
