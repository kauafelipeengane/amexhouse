import React, { useEffect, useRef, useState } from 'react';
export function LazyAnimatedArtwork({ src, poster, alt = '', priority = false, className = '' }) {
  const root=useRef(null), [active,setActive]=useState(priority);
  useEffect(()=>{
    if(priority||active) return undefined;
    const reduced=matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const saveData=navigator.connection?.saveData===true;
    if(reduced||saveData) return undefined;
    const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setActive(true);observer.disconnect();}},{rootMargin:'180px'});
    if(root.current) observer.observe(root.current);
    return()=>observer.disconnect();
  },[priority,active]);
  const selected=active?src:(poster||src);
  return (
    <span ref={root} className={`lazy-artwork ${className}`.trim()} data-active={active?'true':'false'}>
      <img src={selected} alt={alt} width="960" height="640" loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'low'} decoding="async" draggable="false" />
    </span>
  );
}
