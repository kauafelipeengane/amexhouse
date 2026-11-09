import{useEffect,useRef}from'react';
export function useFocusReturn(active){const previous=useRef(null),wasActive=useRef(false);useEffect(()=>{if(active&&!wasActive.current)previous.current=document.activeElement;if(!active&&wasActive.current)requestAnimationFrame(()=>previous.current?.focus?.());wasActive.current=active},[active]);return previous}
