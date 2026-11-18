import React, { createContext, useContext, useRef, useState } from 'react';
import { motion } from 'motion/react';
const MouseEnterContext = createContext([false, () => {}]);
export function CardContainer({ children, className = '', containerClassName = '', ...props }) {
  const containerRef = useRef(null), [isMouseEntered, setIsMouseEntered] = useState(false);
  function move(event) { if (!containerRef.current) return; const { left, top, width, height } = containerRef.current.getBoundingClientRect(); const x=(event.clientX-left-width/2)/25, y=(event.clientY-top-height/2)/25; containerRef.current.style.transform=`rotateY(${x}deg) rotateX(${-y}deg)`; }
  function leave(){ if(!containerRef.current)return; setIsMouseEntered(false); containerRef.current.style.transform='rotateY(0deg) rotateX(0deg)'; }
  return <MouseEnterContext.Provider value={[isMouseEntered,setIsMouseEntered]}><div className={`aceternity-card-container ${containerClassName}`.trim()} {...props}><div ref={containerRef} className={`aceternity-card-perspective ${className}`.trim()} onMouseEnter={()=>setIsMouseEntered(true)} onMouseMove={move} onMouseLeave={leave}>{children}</div></div></MouseEnterContext.Provider>;
}
export function CardBody({ children, className='', as:Tag='div', ...props }){return <Tag className={`aceternity-card-body ${className}`.trim()} {...props}>{children}</Tag>}
export function CardItem({ as:Tag='div',children,className='',translateX=0,translateY=0,translateZ=0,rotateX=0,rotateY=0,rotateZ=0,...props }){const[entered]=useContext(MouseEnterContext);return <motion.div className={`aceternity-card-item ${className}`.trim()} animate={{x:entered?translateX:0,y:entered?translateY:0,z:entered?translateZ:0,rotateX:entered?rotateX:0,rotateY:entered?rotateY:0,rotateZ:entered?rotateZ:0}} transition={{type:'spring',stiffness:150,damping:18,mass:.7}} style={{transformStyle:'preserve-3d'}}><Tag {...props}>{children}</Tag></motion.div>}
