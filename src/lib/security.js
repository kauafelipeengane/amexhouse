const allowedExternalHosts=new Set(['www.youtube.com','youtube.com','youtu.be']);
export function safeExternalUrl(value){try{const url=new URL(String(value));return url.protocol==='https:'&&allowedExternalHosts.has(url.hostname)?url.href:''}catch{return''}}
export function normalizeEmail(value){return String(value??'').trim().toLowerCase().slice(0,254)}
export function safeText(value,max=500){return String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max)}
export function publicError(fallback='Não foi possível concluir a operação.'){return typeof navigator==='undefined'||navigator.onLine?fallback:'Sem conexão. Verifique a internet e tente novamente.'}
export function redact(value){const text=String(value??'');return text.replace(/(access_token|refresh_token|code|token)=([^&\s]+)/gi,'$1=[removido]').replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,'[e-mail removido]')}
export const isSafeId=value=>typeof value==='string'&&value.length>0&&value.length<=128&&/^[\w-]+$/.test(value);

export const isUuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const isEmail=value=>{const email=normalizeEmail(value);return email.length>=3&&email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)};
export const isStrongPassword=value=>typeof value==='string'&&value.length>=8&&value.length<=128;
