'use client';

import { useState } from 'react';
import Field from '@/components/Field';
import { signUpStore } from '@/lib/actions/auth';

export default function StoreSignupForm() {
  const [usesResponsibleAddress, setUsesResponsibleAddress] = useState(true);

  return (
    <form action={signUpStore} className="flex flex-col gap-3">
      <Field label="Nome do responsável" name="responsible_name" required />
      <Field label="E-mail" name="email" type="email" required />
      <Field label="Senha" name="password" type="password" required placeholder="mínimo 8 caracteres" />
      <Field label="Telefone" name="responsible_phone" type="tel" required placeholder="(00) 00000-0000" />

      <p className="mt-2 text-xs font-bold text-inkSoft">Endereço do responsável</p>
      <Field label="CEP" name="resp_zip_code" required placeholder="00000-000" />
      <div className="flex gap-2">
        <div className="flex-1">
          <Field label="Rua" name="resp_street" required />
        </div>
        <div className="w-24">
          <Field label="Número" name="resp_number" required />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Field label="Bairro" name="resp_neighborhood" required />
        </div>
        <div className="flex-1">
          <Field label="Cidade" name="resp_city" required />
        </div>
      </div>
      <Field label="Estado (UF)" name="resp_state" required placeholder="ES" />

      <p className="mt-2 text-xs font-bold text-inkSoft">Dados da loja</p>
      <Field label="Nome da loja" name="store_name" required placeholder="Ex: Cantinho da Vovó" />

      <label className="mt-2 flex items-start gap-2 text-sm text-inkSoft">
        <input
          type="checkbox"
          name="uses_responsible_address"
          checked={usesResponsibleAddress}
          onChange={(e) => setUsesResponsibleAddress(e.target.checked)}
        />
        Usar o mesmo endereço do responsável para a loja
      </label>

      {!usesResponsibleAddress && (
        <div className="flex flex-col gap-3 rounded-m border border-line bg-surface p-3">
          <Field label="CEP da loja" name="store_zip_code" required placeholder="00000-000" />
          <div className="flex gap-2">
            <div className="flex-1">
              <Field label="Rua" name="store_street" required />
            </div>
            <div className="w-24">
              <Field label="Número" name="store_number" required />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Field label="Bairro" name="store_neighborhood" required />
            </div>
            <div className="flex-1">
              <Field label="Cidade" name="store_city" required />
            </div>
          </div>
          <Field label="Estado (UF)" name="store_state" required placeholder="ES" />
        </div>
      )}

      <p className="mt-2 rounded-s bg-accentSoft px-3 py-2 text-xs text-primaryDeep">
        Depois de enviar, sua loja passa por uma análise da nossa equipe antes de aparecer para os
        clientes.
      </p>

      <button type="submit" className="mt-1 rounded-s bg-accent py-3 text-sm font-bold text-white">
        Enviar cadastro
      </button>
    </form>
  );
}
