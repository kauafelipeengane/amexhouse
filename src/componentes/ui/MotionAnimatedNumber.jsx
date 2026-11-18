import React,{useEffect}from'react';
import{motion,useSpring,useTransform}from'motion/react';
export function MotionAnimatedNumber({value,suffix='',className='',springOptions={bounce:0,duration:.8}}){const spring=useSpring(Number(value)||0,springOptions),display=useTransform(spring,current=>`${Math.round(current)}${suffix}`);useEffect(()=>spring.set(Number(value)||0),[spring,value]);return <motion.span className={className}>{display}</motion.span>}
