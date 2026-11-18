import React from 'react';

const LEGAL = {
  controller: 'Kauã Felipe Engane',
  contact: 'Quauaeng@gmail.com',
  updated: '11 de novembro de 2026',
};

function LegalLayout({ type, title, lead, highlights, children }) {
  return (
    <main className="legal-shell">
      <article className="legal-page">
        <a className="legal-back" href="#/portal">← Voltar à AMEX HOUSE</a>
        <header className="legal-hero">
          <small>{type}</small>
          <h1>{title}</h1>
          <p>{lead}</p>
          <div className="legal-highlights" aria-label="Resumo do documento">
            {highlights.map(([label, value]) => (
              <div key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </div>
        </header>
        <div className="legal-layout">
          <aside className="legal-sidebar">
            <strong>Informações oficiais</strong>
            <dl>
              <div><dt>Responsável</dt><dd>{LEGAL.controller}</dd></div>
              <div><dt>Contato</dt><dd><a href={`mailto:${LEGAL.contact}`}>{LEGAL.contact}</a></dd></div>
              <div><dt>Versão</dt><dd>{LEGAL.updated}</dd></div>
            </dl>
            <nav aria-label="Atalhos do documento">
              <a href="#resumo">Visão geral</a>
              <a href="#direitos">Direitos</a>
              <a href="#seguranca">Segurança</a>
              <a href="#contato">Contato</a>
            </nav>
          </aside>
          <div className="legal-content">{children}</div>
        </div>
        <aside className="legal-review-note">
          <strong>Compromisso de transparência</strong>
          <p>
            Nenhuma cláusula deste documento reduz direitos assegurados pela legislação brasileira.
            Se houver conflito entre este texto e uma norma obrigatória, prevalece a norma.
          </p>
        </aside>
        <footer>
          <a href="#/privacy">Política de Privacidade</a>
          <a href="#/terms">Termos de Uso</a>
          <a href={`mailto:${LEGAL.contact}`}>Contato</a>
        </footer>
      </article>
    </main>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalLayout
      type="PRIVACIDADE E DADOS"
      title="Política de Privacidade"
      lead="Informações objetivas sobre os dados usados pela AMEX HOUSE, por que cada dado é necessário e como o titular pode exercer seus direitos."
      highlights={[
        ['Venda de dados', 'Não realizada'],
        ['Canal do titular', LEGAL.contact],
        ['Abrangência', 'Conta, estudos e segurança'],
      ]}
    >
      <section id="resumo">
        <span className="legal-section-number">01</span>
        <h2>Quem trata os dados</h2>
        <p>
          A AMEX HOUSE é uma plataforma educacional administrada por <strong>{LEGAL.controller}</strong>,
          responsável pelas decisões sobre o tratamento de dados pessoais. Esta Política abrange o
          cadastro, autenticação, perfil, aulas, progresso, avaliações, anotações, favoritos, metas,
          histórico, certificados, suporte e segurança da aplicação.
        </p>
        <p>
          O tratamento observa a Lei nº 13.709/2018, o Marco Civil da Internet e as demais regras
          brasileiras aplicáveis. A AMEX HOUSE não vende, aluga nem negocia dados pessoais.
        </p>
      </section>

      <section>
        <span className="legal-section-number">02</span>
        <h2>Dados utilizados e motivo</h2>
        <div className="legal-data-grid">
          <article><h3>Conta</h3><p>Nome, e-mail, identificador, avatar e informações de autenticação para criar, proteger e recuperar a conta.</p></article>
          <article><h3>Aprendizagem</h3><p>Aulas, progresso, avaliações, notas, metas e certificados para executar a experiência acadêmica.</p></article>
          <article><h3>Conteúdo pessoal</h3><p>Anotações, favoritos e itens salvos para entregar as funcionalidades escolhidas pelo titular.</p></article>
          <article><h3>Segurança</h3><p>IP, data, navegador, dispositivo, sessão, erros e eventos de segurança para prevenção de fraude e estabilidade.</p></article>
        </div>
        <p>
          Senhas são processadas pelo provedor de autenticação e não são exibidas no perfil. A
          plataforma deve coletar somente dados compatíveis com as finalidades acima.
        </p>
      </section>

      <section>
        <span className="legal-section-number">03</span>
        <h2>Finalidades e fundamentos jurídicos</h2>
        <div className="legal-table-wrap">
          <table>
            <thead><tr><th>Operação</th><th>Finalidade</th><th>Fundamento</th></tr></thead>
            <tbody>
              <tr><td>Cadastro e acesso</td><td>Disponibilizar a conta e os cursos</td><td>Execução do serviço solicitado</td></tr>
              <tr><td>Progresso e avaliações</td><td>Registrar aprendizagem e liberar certificado</td><td>Execução do serviço</td></tr>
              <tr><td>Logs e controles</td><td>Prevenir abuso, fraude e acessos indevidos</td><td>Legítimo interesse, segurança e obrigação legal, conforme o caso</td></tr>
              <tr><td>Atendimento</td><td>Responder solicitações e corrigir problemas</td><td>Execução do serviço e legítimo interesse</td></tr>
              <tr><td>Defesa e conformidade</td><td>Cumprir ordem válida e exercer direitos</td><td>Obrigação legal e exercício regular de direitos</td></tr>
              <tr><td>Recurso opcional</td><td>Ativar funcionalidade não essencial</td><td>Consentimento, quando exigido</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          O legítimo interesse somente deve ser utilizado após avaliação de necessidade, impacto e
          expectativa legítima do titular. O consentimento, quando aplicável, pode ser revogado.
        </p>
      </section>

      <section>
        <span className="legal-section-number">04</span>
        <h2>Infraestrutura, compartilhamento e localização</h2>
        <p>
          Fornecedores de autenticação e banco de dados, hospedagem, vídeo, e-mail e monitoramento
          técnico podem atuar como operadores, recebendo apenas os dados necessários ao serviço.
          O compartilhamento também pode ocorrer para cumprir ordem legal válida, investigar fraude,
          responder a incidente ou proteger direitos.
        </p>
        <p>
          Parte da infraestrutura pode processar dados fora do Brasil. Nessas situações, a AMEX HOUSE
          deve utilizar mecanismo permitido pela LGPD, contrato adequado e medidas técnicas compatíveis.
        </p>
      </section>

      <section>
        <span className="legal-section-number">05</span>
        <h2>Cookies, armazenamento local e sessão</h2>
        <p>
          A aplicação pode armazenar identificadores essenciais de sessão, tema, preferência visual,
          estado da navegação e rascunhos locais. Esses recursos servem ao funcionamento, à segurança
          e à continuidade da experiência. Se tecnologias não essenciais forem adicionadas, a
          plataforma deverá apresentar informação e escolha adequadas antes da ativação.
        </p>
      </section>

      <section>
        <span className="legal-section-number">06</span>
        <h2>Conservação e exclusão</h2>
        <p>
          Dados permanecem enquanto a conta estiver ativa e pelo período necessário ao serviço.
          Depois do encerramento, serão eliminados ou anonimizados, exceto quando a conservação for
          necessária para obrigação legal, segurança, prevenção de fraude, auditoria ou exercício de direitos.
        </p>
        <p>
          Cópias de segurança podem permanecer isoladas até o ciclo de sobrescrição. O acesso deve ser
          restrito e a utilização limitada à recuperação e segurança, sem retorno ao uso cotidiano.
        </p>
      </section>

      <section id="direitos">
        <span className="legal-section-number">07</span>
        <h2>Direitos do titular</h2>
        <ul className="legal-rights-list">
          <li>confirmar o tratamento e acessar os dados;</li>
          <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
          <li>solicitar anonimização, bloqueio ou eliminação nos casos previstos em lei;</li>
          <li>obter informações sobre compartilhamento e portabilidade, quando aplicável;</li>
          <li>revogar consentimento e conhecer as consequências da recusa;</li>
          <li>opor-se a tratamento irregular e solicitar revisão de decisão automatizada aplicável;</li>
          <li>apresentar reclamação à ANPD ou aos órgãos competentes.</li>
        </ul>
        <p>
          Solicitações devem ser enviadas para <strong>{LEGAL.contact}</strong>. A identidade poderá
          ser confirmada com informações proporcionais ao risco. A confirmação existe para impedir
          que terceiros obtenham, alterem ou excluam dados da conta.
        </p>
      </section>

      <section id="seguranca">
        <span className="legal-section-number">08</span>
        <h2>Segurança e incidentes</h2>
        <p>
          A plataforma utiliza autenticação, autorização no banco de dados, políticas de segurança em
          nível de linha, validação de arquivos, limitação de privilégios, registros de evento,
          atualizações e cópias de segurança. Nenhum sistema é invulnerável; controles devem ser
          revisados de acordo com risco, mudança técnica e incidentes observados.
        </p>
        <p>
          Incidente com risco ou dano relevante será avaliado e, quando exigido, comunicado à ANPD e
          aos titulares afetados com descrição, dados envolvidos, riscos e medidas de resposta.
        </p>
      </section>

      <section>
        <span className="legal-section-number">09</span>
        <h2>Menores de idade</h2>
        <p>
          A plataforma não é direcionada intencionalmente a crianças. O uso por menor deve ocorrer
          com autorização e supervisão do responsável legal, sempre considerando o melhor interesse.
          Conta incompatível com esta regra poderá ser restringida até regularização ou exclusão.
        </p>
      </section>

      <section id="contato">
        <span className="legal-section-number">10</span>
        <h2>Atualizações e contato</h2>
        <p>
          Alterações relevantes serão destacadas na aplicação e a data da versão será atualizada.
          Dúvidas, pedidos ou reclamações podem ser enviados para <strong>{LEGAL.contact}</strong>.
          O titular também pode procurar a Autoridade Nacional de Proteção de Dados e os demais órgãos competentes.
        </p>
      </section>
    </LegalLayout>
  );
}

export function TermsOfUse() {
  return (
    <LegalLayout
      type="CONDIÇÕES DE UTILIZAÇÃO"
      title="Termos de Uso"
      lead="Regras claras para manter a AMEX HOUSE segura, preservar o conteúdo educacional e proteger os direitos de quem utiliza a plataforma."
      highlights={[
        ['Finalidade', 'Educação e acompanhamento'],
        ['Certificado', 'Conclusão interna'],
        ['Legislação', 'Brasil'],
      ]}
    >
      <section id="resumo">
        <span className="legal-section-number">01</span>
        <h2>Acordo e aplicação</h2>
        <p>
          Estes Termos regulam o uso da AMEX HOUSE. A criação da conta e o acesso à plataforma
          indicam ciência destas regras e da Política de Privacidade. Se o usuário não concordar,
          deverá interromper o uso. Direitos obrigatórios previstos em lei não são renunciados.
        </p>
      </section>

      <section>
        <span className="legal-section-number">02</span>
        <h2>Conta e responsabilidade do usuário</h2>
        <ul>
          <li>fornecer dados verdadeiros e manter o e-mail acessível;</li>
          <li>utilizar conta individual e não compartilhar credenciais;</li>
          <li>adotar senha forte e comunicar suspeita de acesso indevido;</li>
          <li>não se passar por outra pessoa nem criar conta para fraude;</li>
          <li>usar a plataforma de modo compatível com a lei e estes Termos.</li>
        </ul>
        <p>
          A segurança não depende apenas do usuário. A AMEX HOUSE permanece responsável pelos
          controles e deveres que lhe forem legalmente atribuídos.
        </p>
      </section>

      <section>
        <span className="legal-section-number">03</span>
        <h2>Acesso e propriedade intelectual</h2>
        <p>
          O usuário recebe licença pessoal, limitada, não exclusiva, intransferível e revogável para
          estudar na plataforma. Aulas, textos, exercícios, vídeos, código, interface, marcas e
          materiais pertencem aos respectivos titulares.
        </p>
        <p>Sem autorização, não é permitido:</p>
        <ul>
          <li>republicar, vender, sublicenciar, gravar ou distribuir conteúdo;</li>
          <li>compartilhar conta ou permitir acesso coletivo;</li>
          <li>remover autoria, marca, avisos ou mecanismos de proteção;</li>
          <li>raspar dados, automatizar acessos abusivos ou contornar limitações técnicas.</li>
        </ul>
      </section>

      <section id="seguranca">
        <span className="legal-section-number">04</span>
        <h2>Segurança ofensiva e uso autorizado</h2>
        <p>
          Conteúdo de pentest, programação, automação ou segurança deve ser utilizado apenas em
          sistemas próprios, ambientes de laboratório ou alvos com autorização expressa. A existência
          de uma aula não concede permissão para testar, acessar, interromper ou explorar sistemas de terceiros.
        </p>
        <p>
          É proibido distribuir malware, explorar vulnerabilidades sem autorização, obter dados de
          terceiros, fraudar avaliações, sobrecarregar o serviço ou tentar acessar funções administrativas.
        </p>
      </section>

      <section>
        <span className="legal-section-number">05</span>
        <h2>Progresso, avaliações e certificado</h2>
        <p>
          O progresso depende do registro das atividades na conta. O certificado é liberado somente
          após o cumprimento dos requisitos publicados, incluindo aulas e avaliações obrigatórias.
          Indícios de manipulação ou fraude podem ser analisados e resultar em correção do progresso,
          sempre com medida proporcional e possibilidade de esclarecimento quando cabível.
        </p>
        <div className="legal-callout">
          <strong>Natureza do certificado</strong>
          <p>
            O certificado comprova conclusão interna na AMEX HOUSE. Não é diploma reconhecido pelo
            MEC, licença profissional, registro em conselho de classe nem promessa de emprego ou renda.
          </p>
        </div>
      </section>

      <section>
        <span className="legal-section-number">06</span>
        <h2>Conteúdo inserido pelo usuário</h2>
        <p>
          Anotações, avatar e demais informações enviadas devem ser lícitos e não podem violar
          privacidade, sigilo ou propriedade intelectual. O usuário mantém os direitos sobre o próprio
          conteúdo e concede apenas a autorização técnica necessária para armazenar e exibir o material em sua conta.
        </p>
      </section>

      <section>
        <span className="legal-section-number">07</span>
        <h2>Disponibilidade e mudanças</h2>
        <p>
          Manutenção, falha de rede, indisponibilidade de fornecedor ou atualização podem interromper
          temporariamente o acesso. A AMEX HOUSE adotará medidas razoáveis para continuidade e
          comunicação de mudanças relevantes. Conteúdo pode ser atualizado para correção, qualidade ou segurança.
        </p>
      </section>

      <section>
        <span className="legal-section-number">08</span>
        <h2>Serviços externos</h2>
        <p>
          Autenticação, banco de dados, hospedagem, vídeo e e-mail podem depender de empresas
          especializadas. Cada serviço externo segue regras próprias. A AMEX HOUSE não controla
          conteúdo independente de terceiros, sem prejuízo da responsabilidade por suas próprias escolhas e obrigações.
        </p>
      </section>

      <section>
        <span className="legal-section-number">09</span>
        <h2>Suspensão e encerramento</h2>
        <p>
          A conta pode ser restringida para conter risco de segurança, fraude, violação grave ou
          cumprimento de ordem válida. Quando o risco permitir, a medida e o motivo serão informados.
          O usuário pode pedir encerramento pelo canal <strong>{LEGAL.contact}</strong>.
        </p>
      </section>

      <section id="direitos">
        <span className="legal-section-number">10</span>
        <h2>Responsabilidade e limites</h2>
        <p>
          A plataforma oferece conteúdo educacional e não garante emprego, renda, aprovação,
          certificação externa ou resultado profissional. Informações não substituem orientação
          jurídica, financeira, médica ou técnica específica para uma situação real.
        </p>
        <p>
          Nada nestes Termos exclui responsabilidade por dolo, culpa grave, defeito do serviço,
          violação de dados imputável à plataforma ou direito que não possa ser limitado. A análise de
          responsabilidade considera conduta, dano comprovado, nexo causal e legislação aplicável.
        </p>
      </section>

      <section>
        <span className="legal-section-number">11</span>
        <h2>Alteração destes Termos</h2>
        <p>
          Mudanças legais, técnicas ou operacionais podem exigir atualização. Alteração material será
          destacada e, quando juridicamente necessário, dependerá de nova manifestação. A versão
          aplicável permanece identificada pela data exibida no documento.
        </p>
      </section>

      <section id="contato">
        <span className="legal-section-number">12</span>
        <h2>Atendimento e solução de conflitos</h2>
        <p>
          Aplica-se a legislação brasileira. O atendimento inicial ocorre pelo e-mail
          <strong> {LEGAL.contact}</strong>. A tentativa de solução direta não impede o acesso à ANPD,
          aos órgãos de defesa do consumidor ou ao Poder Judiciário. O foro competente será definido
          conforme as regras legais, inclusive as de proteção do consumidor.
        </p>
      </section>
    </LegalLayout>
  );
}
