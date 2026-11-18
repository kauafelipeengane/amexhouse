import { supabase } from '../lib/supabase';
const ok = (data, error) => ({
  data: data ?? null,
  error: error ? 'Não foi possível concluir esta operação.' : null,
});
export async function adminRole() {
  const { data, error } = await supabase.rpc('amex_my_role');
  return ok(data, error);
}
export async function dashboard() {
  const { data, error } = await supabase.rpc('amex_admin_dashboard');
  return ok(data, error);
}
export async function listEntity(entity, { page = 1, search = '' } = {}) {
  const { data, error } = await supabase.rpc('amex_admin_list', {
    entity_name: entity,
    page_number: page,
    search_text: String(search).trim().slice(0, 120),
  });
  return ok(data, error);
}
export async function saveEntity(entity, payload) {
  const advanced = ['questions', 'videos', 'resources', 'exercises'].includes(entity),
    { data, error } = await supabase.rpc(
      advanced ? 'amex_admin_save_advanced' : 'amex_admin_save',
      { entity_name: entity, payload },
    );
  return ok(data, error);
}
export async function archiveEntity(entity, id) {
  const { data, error } = await supabase.rpc('amex_admin_archive', {
    entity_name: entity,
    target_id: id,
  });
  return ok(data, error);
}
export async function changeRole(userId, role) {
  const { data, error } = await supabase.rpc('amex_admin_set_role', {
    target_user: userId,
    new_role: role,
  });
  return ok(data, error);
}
export async function issueCertificate(payload) {
  const { data, error } = await supabase.rpc('amex_admin_issue_certificate', {
    target_user: payload.user_id,
    target_academy: payload.academy,
    target_name: payload.student_name,
    target_hours: Number(payload.workload_hours),
  });
  return ok(data, error);
}
export async function revokeCertificate(code) {
  const { data, error } = await supabase.rpc('amex_admin_revoke_certificate', {
    target_code: code,
  });
  return ok(data, error);
}

export async function reorderEntity(entity, id, direction) {
  const { data, error } = await supabase.rpc('amex_admin_reorder', {
    entity_name: entity,
    target_id: id,
    direction,
  });
  return ok(data, error);
}

export async function getEntity(entity, id) {
  const { data, error } = await supabase.rpc('amex_admin_get_entity', {
    entity_name: entity,
    target_id: id,
  });
  return ok(data, error);
}
