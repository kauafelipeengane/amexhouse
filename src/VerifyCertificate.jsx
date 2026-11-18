import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
export default function VerifyCertificate({ code = '' }) {
  const [value, setValue] = useState(code),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  async function verify(e) {
    e?.preventDefault();
    const clean = value.trim().toUpperCase().slice(0, 64);
    if (!clean) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('amex_verify_certificate', {
      code: clean,
    });
    setResult(error ? null : (data?.[0] ?? null));
    setDone(true);
    setBusy(false);
  }
  useEffect(() => {
    if (code) verify();
  }, [code]);
  return (
    <main className="legal-page">
      <section className="legal-document">
        <small>Validação pública</small>
        <h1>Verificar certificado</h1>
        <form onSubmit={verify}>
          <label>
            Código público
            <input
              value={value}
              maxLength="64"
              onChange={(e) => setValue(e.target.value.toUpperCase())}
              placeholder="AMEX-2026-XXXXXXXX"
            />
          </label>
          <button disabled={busy}>{busy ? 'VERIFICANDO…' : 'VERIFICAR'}</button>
        </form>
        {done &&
          (result ? (
            <article>
              <h2>{result.status === 'valid' ? 'Certificado válido' : 'Certificado revogado'}</h2>
              <dl>
                <dt>Estudante</dt>
                <dd>{result.student_name}</dd>
                <dt>Formação</dt>
                <dd>{result.academy}</dd>
                <dt>Carga</dt>
                <dd>{result.workload_hours} horas</dd>
                <dt>Currículo</dt>
                <dd>{result.curriculum_version}</dd>
                <dt>Emissão</dt>
                <dd>{new Date(result.issued_at).toLocaleDateString('pt-BR')}</dd>
              </dl>
            </article>
          ) : (
            <p role="status">Código não encontrado ou indisponível.</p>
          ))}
        <a href="#/portal">Voltar</a>
      </section>
    </main>
  );
}
