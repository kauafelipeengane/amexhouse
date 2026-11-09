const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
function validUrl(value){try{const parsed=new URL(value);return parsed.protocol==='https:'&&parsed.hostname.endsWith('.supabase.co')}catch{return false}}
if(!validUrl(url))throw new Error('Configuração pública do serviço ausente ou inválida.');
if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key??''))throw new Error('Chave pública do serviço ausente ou inválida.');
if(String(key).includes(['service','role'].join('_'))||String(key).startsWith(['sb','secret',''].join('_')))throw new Error('Credencial não permitida no cliente.');
export const publicEnv=Object.freeze({supabaseUrl:url,supabaseKey:key});
