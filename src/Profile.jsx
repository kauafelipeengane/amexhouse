import { reportClientError } from '../lib/errorReporter';
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Page, Metric } from './ui';
import { asArray, formatDate, safePercent } from '../lib/utils';
import { readPreferences, savePreferences } from '../lib/preferences';
import { authRedirect } from '../lib/authFlow';

const clean = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const AVATAR_MAX = 1024 * 1024,
  AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export function Profile({ session, data }) {
  const lessons = asArray(data.lessons),
    progress = asArray(data.progress),
    validProgress = progress.filter((item) =>
      lessons.some((lesson) => lesson.id === item.lesson_id),
    ),
    completed = validProgress.filter((item) => item.status === 'completed').length,
    active = validProgress.filter((item) => item.status === 'in_progress').length,
    overall = safePercent(lessons.length ? (completed / lessons.length) * 100 : 0),
    user = session.user;
  const [prefs, setPrefs] = useState(readPreferences),
    [editing, setEditing] = useState(false),
    [name, setName] = useState(user.user_metadata?.display_name ?? ''),
    [newEmail, setNewEmail] = useState(''),
    [busy, setBusy] = useState(''),
    [message, setMessage] = useState(''),
    [avatarUrl, setAvatarUrl] = useState(''),
    [avatarVersion, setAvatarVersion] = useState(0),
    initials = useMemo(
      () =>
        clean(user.user_metadata?.display_name || user.email)
          .split(' ')
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join(''),
      [user],
    );
  useEffect(() => {
    if (!editing) setName(user.user_metadata?.display_name ?? '');
  }, [user.id, user.user_metadata?.display_name, editing]);
  useEffect(() => {
    let active = true;
    const path = user.user_metadata?.avatar_path;
    if (!path) {
      setAvatarUrl('');
      return () => {
        active = false;
      };
    }
    (async () => {
      const { data: result, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, 3600);
      if (active) {
        if (error)
          reportClientError(error, { source: 'components/Profile.jsx', operation: 'avatar.sign' });
        setAvatarUrl(error ? '' : (result?.signedUrl ?? ''));
      }
    })();
    return () => {
      active = false;
    };
  }, [user.id, user.user_metadata?.avatar_path, avatarVersion]);
  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy) return;
    if (file.size > AVATAR_MAX) {
      setMessage('A imagem deve ter no máximo 1 MB.');
      return;
    }
    if (!AVATAR_TYPES.has(file.type)) {
      setMessage('Use uma imagem JPG, PNG ou WebP.');
      return;
    }
    setBusy('avatar');
    setMessage('');
    try {
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg',
        path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600',
      });
      if (uploadError) throw uploadError;
      const { data: signed, error: signedError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, 3600);
      if (signedError) throw signedError;
      const url = signed.signedUrl;
      const { error: updateError } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, avatar_path: path },
      });
      if (updateError) throw updateError;
      setAvatarUrl(url);
      setAvatarVersion((value) => value + 1);
      window.dispatchEvent(new CustomEvent('amex:avatar-updated', { detail: { path } }));
      setMessage('Foto de perfil atualizada.');
    } catch (error) {
      reportClientError(error, { source: 'components/Profile.jsx' });
      setMessage(
        error?.message?.includes('row-level security')
          ? 'O envio foi bloqueado pela política de armazenamento. Execute o SQL ativo de avatar no Supabase.'
          : 'Não foi possível atualizar a foto. Verifique o formato e tente novamente.',
      );
    } finally {
      setBusy('');
    }
  }
  function changePreference(key, value) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    const saved = savePreferences(next);
    setMessage(
      saved
        ? 'Preferência salva neste dispositivo.'
        : 'A preferência foi aplicada, mas não pôde ser salva neste dispositivo.',
    );
  }
  async function saveName(event) {
    event.preventDefault();
    const displayName = clean(name);
    if (displayName.length < 2 || displayName.length > 80 || busy) return;
    setBusy('name');
    setMessage('');
    try {
      const { error } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, display_name: displayName },
      });
      if (error) throw error;
      setEditing(false);
      setMessage('Nome de exibição atualizado.');
    } catch (error) {
      reportClientError(error, { source: 'components/Profile.jsx' });
      setMessage('Não foi possível atualizar o nome. Tente novamente.');
    } finally {
      setBusy('');
    }
  }
  async function requestEmailChange(event) {
    event.preventDefault();
    const email = clean(newEmail).toLowerCase();
    if (!emailOk(email) || email === user.email?.toLowerCase() || busy) return;
    setBusy('email');
    setMessage('');
    try {
      const { error } = await supabase.auth.updateUser(
        { email },
        { emailRedirectTo: authRedirect('email') },
      );
      if (error) throw error;
      setNewEmail('');
      setMessage('Confira as caixas de entrada solicitadas para confirmar a alteração.');
    } catch (error) {
      reportClientError(error, { source: 'components/Profile.jsx' });
      setMessage('Não foi possível solicitar a alteração de e-mail.');
    } finally {
      setBusy('');
    }
  }
  async function requestPassword() {
    if (busy) return;
    setBusy('password');
    setMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: authRedirect('recovery'),
      });
      if (error) throw error;
      setMessage('Se a conta estiver disponível, as instruções serão enviadas por e-mail.');
    } catch (error) {
      reportClientError(error, { source: 'components/Profile.jsx' });
      setMessage('Não foi possível enviar as instruções.');
    } finally {
      setBusy('');
    }
  }
  return (
    <Page eyebrow="Conta" title="Seu perfil">
      <section className="profile profile-hero">
        <div className="profile-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Foto de perfil" width="112" height="112" />
          ) : (
            <span aria-hidden="true">{initials || 'A'}</span>
          )}
        </div>
        <article>
          <small>Estudante AMEX</small>
          <h2>{user.user_metadata?.display_name ?? 'Estudante'}</h2>
          <p>{user.email}</p>
          <label className="avatar-upload">
            {busy === 'avatar' ? 'Enviando foto...' : 'Escolher foto'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={uploadAvatar}
              disabled={Boolean(busy)}
            />
            <small>JPG, PNG ou WebP, até 1 MB.</small>
          </label>
          <span className="status-pill">Conta ativa</span>
        </article>
        <button
          type="button"
          onClick={() => {
            setEditing((value) => !value);
            setName(user.user_metadata?.display_name ?? '');
            setMessage('');
          }}
        >
          {editing ? 'Cancelar EDIÇÃO' : 'Editar PERFIL'}
        </button>
      </section>
      {editing && (
        <form className="profile-edit" onSubmit={saveName}>
          <label htmlFor="profile-name">
            NOME DE EXIBIÇÃO
            <input
              id="profile-name"
              autoFocus
              maxLength="80"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <small>{clean(name).length} de 80 caracteres</small>
          </label>
          <button
            type="submit"
            className="primary"
            disabled={busy === 'name' || clean(name).length < 2}
          >
            {busy === 'name' ? 'SALVANDO...' : 'Salvar NOME'}
          </button>
        </form>
      )}
      <div className="metrics profile-metrics">
        <Metric value={`${overall}%`} label="Progresso geral" />
        <Metric value={completed} label="Concluídas" />
        <Metric value={active} label="Em andamento" />
        <Metric value={formatDate(user.created_at)} label="Membro desde" />
      </div>
      <div className="profile-grid">
        <section className="profile-panel">
          <small>Dados da conta</small>
          <h2>Informações</h2>
          <dl className="account-data">
            <div>
              <dt>Nome</dt>
              <dd>{user.user_metadata?.display_name ?? 'Não informado'}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Conta criada</dt>
              <dd>{formatDate(user.created_at)}</dd>
            </div>
            <div>
              <dt>Identificador</dt>
              <dd title={user.id}>•••• {user.id?.slice(-8)}</dd>
            </div>
          </dl>
        </section>
        <section className="profile-panel">
          <small>APARÊNCIA</small>
          <h2>Tema</h2>
          <p>Escolha a aparência mais confortável.</p>
          <div className="segmented" role="group" aria-label="Tema">
            {[
              ['light', 'CLARO'],
              ['dark', 'ESCURO'],
              ['system', 'SISTEMA'],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={prefs.theme === value}
                className={prefs.theme === value ? 'selected' : ''}
                onClick={() => changePreference('theme', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="profile-panel profile-security">
          <small>Segurança</small>
          <h2>Senha</h2>
          <p>Receba um link seguro para definir uma nova senha.</p>
          <button type="button" onClick={requestPassword} disabled={!!busy}>
            {busy === 'password' ? 'ENVIANDO...' : 'ALTERAR SENHA POR E-MAIL'}
          </button>
          <small>A senha nunca é exibida ou armazenada nesta página.</small>
        </section>
        <section className="profile-panel profile-email">
          <small>Acesso</small>
          <h2>Alterar e-mail</h2>
          <p>A mudança só será concluída após as confirmações exigidas pelo provedor.</p>
          <form onSubmit={requestEmailChange}>
            <label htmlFor="profile-email">
              NOVO E-MAIL
              <input
                id="profile-email"
                type="email"
                autoComplete="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="novo@email.com"
              />
            </label>
            <button
              type="submit"
              disabled={
                busy === 'email' ||
                !emailOk(clean(newEmail)) ||
                clean(newEmail).toLowerCase() === user.email?.toLowerCase()
              }
            >
              {busy === 'email' ? 'SOLICITANDO...' : 'SOLICITAR ALTERAÇÃO'}
            </button>
          </form>
        </section>
        <section className="profile-panel profile-privacy">
          <small>Privacidade</small>
          <h2>Seus dados</h2>
          <p className="profile-privacy-intro">Visão objetiva de como a conta utiliza e protege informações pessoais.</p>
          <dl className="privacy-data-map">
            <div><dt>Conta e autenticação</dt><dd>E-mail, nome, avatar e sessão protegida pelo provedor.</dd></div>
            <div><dt>Dados acadêmicos</dt><dd>Progresso, avaliações, favoritos, metas e certificados.</dd></div>
            <div><dt>Conteúdo pessoal</dt><dd>Anotações e preferências vinculadas exclusivamente à conta.</dd></div>
            <div><dt>Proteção</dt><dd>Controle de acesso, RLS e validações de segurança.</dd></div>
          </dl>
          <aside className="privacy-note">
            <strong>Exercer seus direitos</strong>
            <p>Para solicitar acesso, correção, exportação ou exclusão, use o canal indicado na Política de Privacidade. A identidade poderá ser confirmada para impedir fraude.</p>
          </aside>
          <div className="profile-legal">
            <a href="#/privacy">Política de Privacidade <span>→</span></a>
            <a href="#/terms">Termos de Uso <span>→</span></a>
          </div>
        </section>
      </div>
      <p className="profile-message" role="status" aria-live="polite">
        {message}
      </p>
    </Page>
  );
}
