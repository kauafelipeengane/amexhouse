import{useCallback,useEffect,useState}from'react';import{isUuid}from'../lib/security';
const publicPages=new Set(['portal','store','profile']);
const academyPages=new Set(['home','courses','notes','saved','progress','activities','goals','certificate','lesson']);
const academies=new Set(['pentest','python']);
const legacyAcademy={pentest:'pentest',python:'python'};
function decode(value=''){try{return decodeURIComponent(value)}catch{return''}}
function academyRoute(academy,section='courses',selected=''){if(!academies.has(academy)||!academyPages.has(section))return'#/portal';return section==='lesson'&&isUuid(selected)?`#/academy/${academy}/lesson/${encodeURIComponent(selected)}`:`#/academy/${academy}/${section}`}
function parseHash(){
 const parts=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean).map(decode);
 if(!parts.length)return{page:'portal',academy:'',section:'',selected:'',invalid:false,canonical:'#/portal'};
 if(parts[0]==='academy'){
  const academy=academies.has(parts[1])?parts[1]:'',section=academyPages.has(parts[2])?parts[2]:'courses',selected=section==='lesson'&&isUuid(parts[3])?parts[3]:'';
  const invalid=!academy||(section==='lesson'&&!selected),canonical=invalid?'#/portal':academyRoute(academy,section,selected);
  return invalid?{page:'portal',academy:'',section:'',selected:'',invalid:true,canonical}:{page:'academy',academy,section,selected,invalid:false,canonical};
 }
 if(legacyAcademy[parts[0]])return{page:'academy',academy:legacyAcademy[parts[0]],section:'courses',selected:'',invalid:false,canonical:academyRoute(legacyAcademy[parts[0]],'courses')};
 if(parts[0]==='home'||parts[0]==='courses')return{page:'portal',academy:'',section:'',selected:'',invalid:false,canonical:'#/portal'};
 if(publicPages.has(parts[0]))return{page:parts[0],academy:'',section:'',selected:'',invalid:false,canonical:`#/${parts[0]}`};
 return{page:'portal',academy:'',section:'',selected:'',invalid:true,canonical:'#/portal'};
}
const scrollKey=hash=>`amex-scroll:${hash||'#/portal'}`;
function remember(){try{sessionStorage.setItem(scrollKey(location.hash),String(Math.max(0,scrollY)))}catch{}}
function restore(){requestAnimationFrame(()=>{let top=0;try{top=Math.min(Math.max(0,Number(sessionStorage.getItem(scrollKey(location.hash)))||0),Math.max(0,document.documentElement.scrollHeight-innerHeight))}catch{}scrollTo({top,behavior:'auto'})})}
export function useNavigation(){const[route,setRoute]=useState(parseHash);useEffect(()=>{history.scrollRestoration='manual';const sync=()=>{const next=parseHash();if(location.hash!==next.canonical)history.replaceState(null,'',next.canonical);setRoute(next);restore()};if(!location.hash)history.replaceState(null,'','#/portal');sync();addEventListener('hashchange',sync);addEventListener('pagehide',remember);return()=>{remember();removeEventListener('hashchange',sync);removeEventListener('pagehide',remember)}},[]);const go=useCallback((target,options={})=>{remember();let next='#/portal';if(typeof target==='string')next=`#/${publicPages.has(target)?target:'portal'}`;else if(target?.academy)next=academyRoute(target.academy,target.section,target.selected);if(options.replace){history.replaceState(null,'',next);setRoute(parseHash());scrollTo({top:0,behavior:'auto'})}else if(location.hash===next)scrollTo({top:0,behavior:typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});else location.hash=next},[]);return{...route,go,canGoBack:history.length>1,goBack:()=>history.back()}}
