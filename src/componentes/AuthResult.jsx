import React from 'react';
export function AuthResult({ error, onDone }) {
  return (
    <main className="auth-flow">
      <section className="auth-flow-card" role={error ? 'alert' : 'status'}>
        <small>Conta</small>
        <h1>{error ? 'Link inválido' : 'E-mail confirmado'}</h1>
        <p>
          {error
            ? 'O link expirou ou já foi utilizado. Solicite outro e-mail.'
            : 'A confirmação foi concluída. Você já pode continuar.'}
        </p>
        <button type="button" className="primary" onClick={onDone}>
          Continuar
        </button>
      </section>
    </main>
  );
}
