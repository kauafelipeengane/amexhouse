import React, { useEffect, useState } from 'react';
import {
  adminRole,
  dashboard,
  listEntity,
  saveEntity,
  archiveEntity,
  changeRole,
  issueCertificate,
  revokeCertificate,
  reorderEntity,
  getEntity,
} from './adminService';
import { ConfirmDialog } from './ConfirmDialog';
import './admin.css';
const tabs = [
  ['dashboard', 'Visão geral'],
  ['courses', 'Cursos'],
  ['modules', 'Módulos'],
  ['lessons', 'Aulas'],
  ['quizzes', 'Avaliações'],
  ['questions', 'Perguntas'],
  ['alternatives', 'Alternativas'],
  ['videos', 'Vídeos'],
  ['resources', 'Recursos'],
  ['exercises', 'Exercícios'],
  ['integrity', 'Integridade'],
  ['users', 'Usuários'],
  ['certificates', 'Certificados'],
  ['audit', 'Auditoria'],
];
const empty = {
  courses: {
    title: '',
    slug: '',
    description: '',
    workload_hours: 1,
    status: 'draft',
  },
  modules: { course_id: '', title: '', position: 1 },
  lessons: {
    module_id: '',
    title: '',
    summary: '',
    position: 1,
    workload_hours: 1,
    status: 'draft',
  },
  quizzes: {
    lesson_id: '',
    title: '',
    passing_score: 70,
    max_attempts: 3,
    required: true,
    status: 'draft',
  },
  questions: {
    quiz_id: '',
    prompt: '',
    explanation: '',
    position: 1,
    status: 'draft',
  },
  alternatives: { question_id: '', text: '', is_correct: false, position: 1 },
  videos: {
    lesson_id: '',
    youtube_id: '',
    alternative_youtube_id: '',
    title: '',
    channel: '',
    is_embed_allowed: true,
  },
  resources: {
    lesson_id: '',
    title: '',
    url: 'https://',
    resource_type: 'official_docs',
    position: 1,
  },
  exercises: {
    lesson_id: '',
    title: '',
    instructions: '',
    difficulty: 'beginner',
    position: 1,
  },
  integrity: {},
};
export default function AdminPage() {
  const [role, setRole] = useState('loading'),
    [tab, setTab] = useState('dashboard'),
    [rows, setRows] = useState([]),
    [metrics, setMetrics] = useState({}),
    [form, setForm] = useState(empty.courses),
    [search, setSearch] = useState(''),
    [page, setPage] = useState(1),
    [busy, setBusy] = useState(''),
    [message, setMessage] = useState(''),
    [pending, setPending] = useState(null),
    [editing, setEditing] = useState(null);
  useEffect(() => {
    adminRole().then((r) => setRole(r.error ? 'denied' : r.data));
  }, []);
  useEffect(() => {
    if (!['admin', 'instructor'].includes(role)) return;
    void load();
  }, [role, tab, page]);
  useEffect(() => {
    setPage(1);
    setForm(empty[tab] ?? {});
    setSearch('');
    setRows([]);
  }, [tab]);
  async function load() {
    setBusy('load');
    setMessage('');
    const response =
      tab === 'dashboard' ? await dashboard() : await listEntity(tab, { page, search });
    if (response.error) setMessage(response.error);
    else if (tab === 'dashboard') setMetrics(response.data ?? {});
    else setRows(response.data ?? []);
    setBusy('');
  }
  async function submit(e) {
    e.preventDefault();
    setBusy('save');
    const response = await saveEntity(tab, form);
    setBusy('');
    setMessage(response.error ?? 'Registro salvo e auditado.');
    if (!response.error) {
      setForm(empty[tab] ?? {});
      await load();
    }
  }
  async function archive(id) {
    setPending({ kind: 'archive', id });
  }
  async function confirmPending() {
    const action = pending;
    setPending(null);
    if (!action) return;
    if (action.kind === 'revoke') {
      const r = await revokeCertificate(action.code);
      setMessage(r.error ?? 'Certificado revogado.');
      if (!r.error) load();
      return;
    }
    setBusy(action.id);
    const r = await archiveEntity(tab, action.id);
    setBusy('');
    setMessage(r.error ?? 'Registro arquivado.');
    if (!r.error) await load();
  }
  async function edit(row) {
    setBusy(row.id);
    const r = await getEntity(tab, row.id);
    setBusy('');
    if (r.error) {
      setMessage(r.error);
      return;
    }
    setEditing(row.id);
    setForm(r.data ?? row);
    scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function reorder(id, direction) {
    setBusy(id);
    const r = await reorderEntity(tab, id, direction);
    setBusy('');
    setMessage(r.error ?? 'Ordem atualizada.');
    if (!r.error) load();
  }
  if (role === 'loading') return <AdminState title="Validando autorização" />;
  if (!['admin', 'instructor'].includes(role))
    return (
      <AdminState title="Acesso restrito" text="Sua conta não possui permissão administrativa." />
    );
  return (
    <main className="admin-shell">
      <aside className="admin-nav">
        <a className="admin-brand" href="#/portal">
          AMEX <b>HOUSE</b>
          <small>Administração</small>
        </a>
        <nav>
          {tabs.map(([id, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>
        <footer>
          <span>{role.toUpperCase()}</span>
          <a href="#/portal">Voltar ao portal</a>
        </footer>
      </aside>
      <section className="admin-main">
        <header className="admin-top">
          <div>
            <small>GESTÃO ACADÊMICA SEGURA</small>
            <h1>{tabs.find((x) => x[0] === tab)?.[1]}</h1>
          </div>
          {tab !== 'dashboard' && (
            <form
              className="admin-search"
              onSubmit={(e) => {
                e.preventDefault();
                load();
              }}
            >
              <label>
                Pesquisar
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  maxLength="120"
                />
              </label>
              <button>Buscar</button>
            </form>
          )}
        </header>
        {message && (
          <p className="admin-message" role="status">
            {message}
          </p>
        )}
        {busy === 'load' ? (
          <AdminState title="Carregando dados" />
        ) : tab === 'dashboard' ? (
          <Dashboard data={metrics} />
        ) : (
          <>
            <AdminArea
              tab={tab}
              role={role}
              rows={rows}
              form={form}
              setForm={setForm}
              editing={editing}
              setEditing={setEditing}
              onSubmit={submit}
              busy={busy}
              onArchive={archive}
              onEdit={edit}
              onReorder={reorder}
              onRole={async (id, value) => {
                setBusy(id);
                const r = await changeRole(id, value);
                setBusy('');
                setMessage(r.error ?? 'Permissão atualizada e auditada.');
                if (!r.error) load();
              }}
              onIssue={async (payload) => {
                setBusy('certificate');
                const r = await issueCertificate(payload);
                setBusy('');
                setMessage(r.error ?? `Certificado emitido: ${r.data}`);
                if (!r.error) load();
              }}
              onRevoke={(code) => setPending({ kind: 'revoke', code })}
            />
            <ConfirmDialog
              open={!!pending}
              title={pending?.kind === 'revoke' ? 'Revogar certificado' : 'Arquivar registro'}
              description={
                pending?.kind === 'revoke'
                  ? 'O certificado ficará inválido na consulta pública.'
                  : 'O conteúdo deixará de aparecer para estudantes, mas continuará preservado no banco.'
              }
              confirmLabel={pending?.kind === 'revoke' ? 'Revogar' : 'Arquivar'}
              danger
              onConfirm={confirmPending}
              onCancel={() => setPending(null)}
            />
          </>
        )}
        {tab !== 'dashboard' && (
          <div className="admin-pagination">
            <button disabled={page === 1} onClick={() => setPage((x) => x - 1)}>
              Anterior
            </button>
            <span>Página {page}</span>
            <button disabled={rows.length < 25} onClick={() => setPage((x) => x + 1)}>
              Próxima
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
function Dashboard({ data }) {
  const cards = [
    ['students', 'Estudantes'],
    ['active_7d', 'Ativos em 7 dias'],
    ['active_30d', 'Ativos em 30 dias'],
    ['published_courses', 'Cursos publicados'],
    ['published_lessons', 'Aulas publicadas'],
    ['attempts', 'Tentativas'],
    ['average_score', 'Média das avaliações'],
    ['certificates', 'Certificados válidos'],
  ];
  return (
    <>
      <section className="admin-metrics">
        {cards.map(([key, label]) => (
          <article key={key}>
            <small>{label}</small>
            <strong>
              {data[key] ?? 0}
              {key === 'average_score' ? '%' : ''}
            </strong>
          </article>
        ))}
      </section>
      <section className="admin-card">
        <h2>Integridade operacional</h2>
        <ul>
          <li>Autorização validada no Supabase</li>
          <li>Alterações administrativas registradas</li>
          <li>Listas limitadas a 25 registros</li>
          <li>Certificados com código público e revogação</li>
        </ul>
      </section>
    </>
  );
}
function AdminArea(props) {
  if (props.tab === 'users') return <Users {...props} />;
  if (props.tab === 'certificates') return <Certificates {...props} />;
  if (props.tab === 'audit' || props.tab === 'integrity') return <Table rows={props.rows} />;
  return (
    <section className="admin-grid">
      <Editor {...props} />
      <Table
        rows={props.rows}
        onArchive={props.onArchive}
        onEdit={props.onEdit}
        onReorder={props.onReorder}
        entity={props.tab}
        busy={props.busy}
      />
    </section>
  );
}
function Editor({ tab, form, setForm, onSubmit, busy, editing, setEditing }) {
  const field = (name, label, type = 'text') => (
    <label>
      {label}
      <input
        type={type}
        value={form[name] ?? ''}
        onChange={(e) =>
          setForm({
            ...form,
            [name]: type === 'number' ? Number(e.target.value) : e.target.value,
          })
        }
        required
        maxLength="120"
      />
    </label>
  );
  return (
    <form className="admin-card admin-editor" onSubmit={onSubmit}>
      <h2>{editing ? 'Editar registro' : 'Novo registro'}</h2>
      {editing && (
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setForm(empty[tab] ?? {});
          }}
        >
          Cancelar EDIÇÃO
        </button>
      )}
      {tab === 'courses' && (
        <>
          {field('title', 'Título')}
          {field('slug', 'Slug')}
          <label>
            Descrição
            <textarea
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              maxLength="1200"
            />
          </label>
          {field('workload_hours', 'Carga horária', 'number')}
          <Status form={form} setForm={setForm} editing={editing} setEditing={setEditing} />
        </>
      )}
      {tab === 'modules' && (
        <>
          {field('course_id', 'UUID do curso')}
          {field('title', 'Título')}
          {field('position', 'Posição', 'number')}
        </>
      )}
      {tab === 'lessons' && (
        <>
          {field('module_id', 'UUID do módulo')}
          {field('title', 'Título')}
          <label>
            Resumo
            <textarea
              value={form.summary ?? ''}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              maxLength="1200"
            />
          </label>
          {field('position', 'Posição', 'number')}
          {field('workload_hours', 'Carga horária', 'number')}
          <Status form={form} setForm={setForm} editing={editing} setEditing={setEditing} />
        </>
      )}
      {tab === 'quizzes' && (
        <>
          {field('lesson_id', 'UUID da aula')}
          {field('title', 'Título')}
          {field('passing_score', 'Nota mínima', 'number')}
          {field('max_attempts', 'Máximo de tentativas', 'number')}
          <label className="admin-check">
            <input
              type="checkbox"
              checked={!!form.required}
              onChange={(e) => setForm({ ...form, required: e.target.checked })}
            />{' '}
            Avaliação obrigatória
          </label>
          <Status form={form} setForm={setForm} editing={editing} setEditing={setEditing} />
        </>
      )}
      {tab === 'alternatives' && (
        <>
          {field('question_id', 'UUID da pergunta')}
          <label>
            Texto da alternativa
            <textarea
              value={form.text ?? ''}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              required
              maxLength="1000"
            />
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={!!form.is_correct}
              onChange={(e) => setForm({ ...form, is_correct: e.target.checked })}
            />{' '}
            Alternativa correta
          </label>
          {field('position', 'Posição', 'number')}
        </>
      )}
      {tab === 'questions' && (
        <>
          {field('quiz_id', 'UUID da avaliação')}
          <label>
            Pergunta
            <textarea
              value={form.prompt ?? ''}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              required
              maxLength="1000"
            />
          </label>
          <label>
            Explicação
            <textarea
              value={form.explanation ?? ''}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              maxLength="2000"
            />
          </label>
          {field('position', 'Posição', 'number')}
          <Status form={form} setForm={setForm} editing={editing} setEditing={setEditing} />
        </>
      )}
      {tab === 'videos' && (
        <>
          {field('lesson_id', 'UUID da aula')}
          {field('youtube_id', 'ID do YouTube')}
          {field('alternative_youtube_id', 'ID alternativo')}
          {field('title', 'Título da fonte')}
          {field('channel', 'Canal')}
          <label className="admin-check">
            <input
              type="checkbox"
              checked={form.is_embed_allowed !== false}
              onChange={(e) => setForm({ ...form, is_embed_allowed: e.target.checked })}
            />{' '}
            Incorporação permitida
          </label>
        </>
      )}
      {tab === 'resources' && (
        <>
          {field('lesson_id', 'UUID da aula')}
          {field('title', 'Título')}
          {field('url', 'URL HTTPS')}
          <label>
            Tipo
            <select
              value={form.resource_type ?? 'official_docs'}
              onChange={(e) => setForm({ ...form, resource_type: e.target.value })}
            >
              <option value="official_docs">Documentação</option>
              <option value="article">Artigo</option>
              <option value="repository">Repositório</option>
              <option value="video">Vídeo</option>
            </select>
          </label>
          {field('position', 'Posição', 'number')}
        </>
      )}
      {tab === 'exercises' && (
        <>
          {field('lesson_id', 'UUID da aula')}
          {field('title', 'Título')}
          <label>
            Instruções
            <textarea
              value={form.instructions ?? ''}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              required
              maxLength="6000"
            />
          </label>
          <label>
            Dificuldade
            <select
              value={form.difficulty ?? 'beginner'}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            >
              <option value="beginner">Iniciante</option>
              <option value="intermediate">Intermediário</option>
              <option value="advanced">Avançado</option>
            </select>
          </label>
          {field('position', 'Posição', 'number')}
        </>
      )}
      <button className="admin-primary" disabled={busy === 'save'}>
        {busy === 'save' ? 'SALVANDO...' : 'Salvar COM AUDITORIA'}
      </button>
    </form>
  );
}
function Status({ form, setForm }) {
  return (
    <label>
      Status
      <select
        value={form.status ?? 'draft'}
        onChange={(e) => setForm({ ...form, status: e.target.value })}
      >
        <option value="draft">Rascunho</option>
        <option value="published">Publicado</option>
        <option value="archived">Arquivado</option>
      </select>
    </label>
  );
}
function Users({ rows, role, onRole, busy }) {
  return (
    <Table
      rows={rows}
      renderActions={(row) => (
        <select
          aria-label={`Papel de ${row.display_name ?? row.email_masked}`}
          value={row.role}
          disabled={role !== 'admin' || busy === row.user_id}
          onChange={(e) => onRole(row.user_id, e.target.value)}
        >
          <option value="student">Estudante</option>
          <option value="instructor">Instrutor</option>
          <option value="admin">Administrador</option>
        </select>
      )}
    />
  );
}
function Certificates({ rows, onIssue, onRevoke, busy }) {
  const [f, setF] = useState({
    user_id: '',
    academy: 'pentest',
    student_name: '',
    workload_hours: 1,
  });
  return (
    <section className="admin-grid">
      <form
        className="admin-card admin-editor"
        onSubmit={(e) => {
          e.preventDefault();
          onIssue(f);
        }}
      >
        <h2>Emitir certificado</h2>
        {['user_id', 'student_name', 'workload_hours'].map((x) => (
          <label key={x}>
            {x === 'user_id'
              ? 'UUID do estudante'
              : x === 'student_name'
                ? 'Nome do estudante'
                : 'Carga horária'}
            <input
              required
              type={x === 'workload_hours' ? 'number' : 'text'}
              value={f[x]}
              onChange={(e) => setF({ ...f, [x]: e.target.value })}
            />
          </label>
        ))}
        <label>
          Formação
          <select value={f.academy} onChange={(e) => setF({ ...f, academy: e.target.value })}>
            <option value="pentest">Pentest</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="data">Data</option>
            <option value="devops">DevOps</option>
          </select>
        </label>
        <button className="admin-primary" disabled={busy === 'certificate'}>
          Emitir com validação
        </button>
      </form>
      <Table
        rows={rows}
        renderActions={(row) => (
          <button
            className="admin-danger"
            onClick={() => onRevoke(row.public_code)}
            disabled={row.status === 'revoked'}
          >
            Revogar
          </button>
        )}
      />
    </section>
  );
}
function Table({ rows = [], onArchive, onEdit, onReorder, entity, busy, renderActions }) {
  return (
    <section className="admin-card admin-table">
      <h2>Registros</h2>
      {!rows.length ? (
        <p>Nenhum registro encontrado.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Registro</th>
                <th>Status</th>
                <th>Detalhes</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id ?? row.user_id ?? index}>
                  <td>
                    <strong>
                      {row.title ?? row.display_name ?? row.public_code ?? row.action ?? 'Registro'}
                    </strong>
                    <small>
                      {row.slug ?? row.email_masked ?? row.entity_type ?? row.academy ?? ''}
                    </small>
                  </td>
                  <td>
                    <span className={`badge ${row.status ?? row.role ?? ''}`}>
                      {row.status ?? row.role ?? (row.passed ? 'aprovado' : '')}
                    </span>
                  </td>
                  <td>
                    <code>{row.id ?? row.user_id ?? row.created_at ?? ''}</code>
                  </td>
                  <td>
                    {renderActions?.(row) ?? (
                      <div className="admin-row-actions">
                        {onEdit && (
                          <button type="button" onClick={() => onEdit(row)}>
                            Editar
                          </button>
                        )}
                        {onReorder &&
                          ['modules', 'lessons', 'questions', 'alternatives'].includes(entity) && (
                            <>
                              <button
                                type="button"
                                aria-label="Mover registro para cima"
                                onClick={() => onReorder(row.id, 'up')}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                aria-label="Mover registro para baixo"
                                onClick={() => onReorder(row.id, 'down')}
                              >
                                ↓
                              </button>
                            </>
                          )}
                        {onArchive && (
                          <button
                            className="admin-danger"
                            disabled={busy === row.id}
                            onClick={() => onArchive(row.id)}
                          >
                            Arquivar
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
function AdminState({ title, text = 'Aguarde um instante.' }) {
  return (
    <main className="admin-state">
      <small>AMEX HOUSE</small>
      <h1>{title}</h1>
      <p>{text}</p>
      <a href="#/portal">Voltar ao portal</a>
    </main>
  );
}
