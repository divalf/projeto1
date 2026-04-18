"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { Customer } from "@/types";

interface CustomerFormProps {
  customer?: Customer;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}

export default function CustomerForm({
  customer,
  action,
  submitLabel,
}: CustomerFormProps) {
  const [pending, setPending] = useState(false);
  const [emailWarning, setEmailWarning] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const formData = new FormData(e.currentTarget);
      await action(formData);
    } finally {
      setPending(false);
    }
  }

  // Aviso visual de e-mail duplicado com debounce de 400ms
  const checkEmailDuplicate = useCallback((email: string) => {
    if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
    if (!email) { setEmailWarning(false); return; }
    emailDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/customers/check-email?email=${encodeURIComponent(email)}`
        );
        if (res.ok) {
          const { count } = await res.json();
          setEmailWarning(count > 0);
        }
      } catch (err) {
        console.error("Erro ao verificar e-mail duplicado:", err);
      }
    }, 400);
  }, []);

  const field =
    "w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
  const label = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {/* Nome */}
      <div>
        <label htmlFor="name" className={label}>
          Nome <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={customer?.name}
          className={field}
          placeholder="Nome completo ou razão social"
        />
      </div>

      {/* Empresa */}
      <div>
        <label htmlFor="company" className={label}>
          Empresa
        </label>
        <input
          id="company"
          name="company"
          defaultValue={customer?.company ?? ""}
          className={field}
          placeholder="Nome da empresa"
        />
      </div>

      {/* E-mail */}
      <div>
        <label htmlFor="email" className={label}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={customer?.email ?? ""}
          onBlur={(e) => checkEmailDuplicate(e.target.value)}
          className={field}
          placeholder="contato@empresa.com"
        />
        {emailWarning && (
          <p className="mt-1 text-xs text-amber-600">
            ⚠ Já existe um cliente com esse e-mail. Verifique antes de salvar.
          </p>
        )}
      </div>

      {/* Telefone */}
      <div>
        <label htmlFor="phone" className={label}>
          Telefone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={customer?.phone ?? ""}
          className={field}
          placeholder="(11) 99999-9999"
        />
      </div>

      {/* Notas */}
      <div>
        <label htmlFor="notes" className={label}>
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={customer?.notes ?? ""}
          className={`${field} resize-none`}
          placeholder="Informações adicionais sobre o cliente..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Salvando..." : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => history.back()}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
