import{publicError}from'./security';

const text=value=>String(value??'').toLowerCase();
const statusOf=error=>Number(error?.status||error?.statusCode||0);

export function authErrorMessage(error,context='login'){
 const message=text(error?.message),code=text(error?.code),status=statusOf(error);
 if(typeof navigator!=='undefined'&&navigator.onLine===false)return'Sem conexão. Verifique a internet e tente novamente.';
 if(status===429||code.includes('rate_limit')||message.includes('rate limit')||message.includes('too many requests'))return'Muitas tentativas. Aguarde um pouco e tente novamente.';
 if(code.includes('email_not_confirmed')||message.includes('email not confirmed')||message.includes('email_not_confirmed'))return'Confirme seu e-mail antes de entrar. Verifique também a caixa de spam.';
 if(code.includes('weak_password')||message.includes('password should be')||message.includes('weak password'))return'A senha não atende aos requisitos de segurança. Use pelo menos 8 caracteres.';
 if(context==='signup'&&(code.includes('user_already_exists')||message.includes('already registered')||message.includes('already exists')||message.includes('user already registered')))return'Já existe uma conta com este e-mail. Entre na conta ou use “Esqueci a senha”.';
 if(context==='recovery')return'Se a conta existir, as instruções serão enviadas. Verifique também a caixa de spam.';
 if(context==='login'&&(status===400||code.includes('invalid_credentials')||message.includes('invalid login credentials')||message.includes('invalid credentials')))return'E-mail ou senha incorretos. Confira os dados e tente novamente.';
 if(code.includes('signup_disabled')||message.includes('signups not allowed')||message.includes('signup is disabled'))return'Novos cadastros estão temporariamente indisponíveis.';
 if(status>=500||message.includes('network')||message.includes('fetch'))return publicError('O serviço de acesso está indisponível. Tente novamente em instantes.');
 return context==='signup'?'Não foi possível criar a conta. Revise os dados e tente novamente.':context==='login'?'Não foi possível entrar. Tente novamente.':'Não foi possível concluir a solicitação.';
}
