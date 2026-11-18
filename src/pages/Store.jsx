import React from 'react';
import storeArt from '../assets/portal/AMEX_STORE_X.webp';
import { PortalHeader } from './Portal';
export function Store({ session, navigate }) {
  return (
    <main className="separate-shell">
      <PortalHeader session={session} navigate={navigate} title="AMEX STORE" area="store" />
      <section className="store-hero">
        <img src={storeArt} alt="Arte da AMEX Store" />
        <div>
          <small>AMEX STORE · AMBIENTE INDEPENDENTE</small>
          <h1>
            PRODUTOS COM
            <br />
            <em>Identidade.</em>
          </h1>
          <p>
            A loja está separada dos ambientes acadêmicos. O catálogo será ativado somente com
            estoque, pedidos e pagamentos protegidos no servidor.
          </p>
          <b>Catálogo em preparação</b>
        </div>
      </section>
    </main>
  );
}
