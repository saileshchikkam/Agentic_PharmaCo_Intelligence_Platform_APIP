import {useEffect,useState} from 'react';
export const FULL_BRAND_NAME='Agentic Pharma Co-Intelligence Platform';
export function HeaderBrandText(){
 const [text,setText]=useState('APIP');
 useEffect(()=>{const motion=matchMedia('(prefers-reduced-motion: reduce)'),wide=matchMedia('(min-width: 1200px)');let timer:ReturnType<typeof setTimeout>;let stopped=false;
 const reset=()=>{clearTimeout(timer);setText('APIP');if(motion.matches||!wide.matches||stopped)return;let index=0;const type=()=>{if(stopped)return;setText(FULL_BRAND_NAME.slice(0,++index));timer=setTimeout(index<FULL_BRAND_NAME.length?type:reset,index<FULL_BRAND_NAME.length?85:4500);};timer=setTimeout(type,2500);};
 motion.addEventListener('change',reset);wide.addEventListener('change',reset);reset();return()=>{stopped=true;clearTimeout(timer);motion.removeEventListener('change',reset);wide.removeEventListener('change',reset);};},[]);
 return <span className="access-header-brand-text" aria-hidden="true">{text}</span>;
}
