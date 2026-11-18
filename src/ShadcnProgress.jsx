import React from'react';
import*as ProgressPrimitive from'@radix-ui/react-progress';
export function Progress({value=0,label,className=''}){const safe=Math.min(100,Math.max(0,Number(value)||0));return <ProgressPrimitive.Root className={`shadcn-progress ${className}`.trim()} value={safe} aria-label={label}><ProgressPrimitive.Indicator className="shadcn-progress-indicator" style={{transform:`translateX(-${100-safe}%)`}}/></ProgressPrimitive.Root>}
