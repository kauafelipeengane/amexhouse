import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
const assets=[
 'src/assets/AMEX_HOUSE.webp','src/assets/portal/AMEX_PENTEST.webp','src/assets/portal/AMEX_PYTHON.webp','src/assets/portal/AMEX_STORE.webp',
 'src/assets/portal/AMEX_PENTEST_BANNER.webp','src/assets/portal/AMEX_PYTHON_BANNER.webp','src/assets/portal/AMEX_STORE_X.webp'
];
for(const asset of assets){
 if(!existsSync(asset)) throw new Error(`Asset ausente: ${asset}`);
 const info=execFileSync('webpmux',['-info',asset],{encoding:'utf8'});
 const frames=Number(info.match(/Number of frames:\s*(\d+)/)?.[1]||0);
 const loop=Number(info.match(/Loop Count\s*:\s*(\d+)/)?.[1]??-1);
 if(frames<2) throw new Error(`WebP não animado: ${asset}`);
 if(loop!==0) throw new Error(`WebP não está em loop infinito: ${asset}`);
 console.log(`[OK] ${asset}: ${frames} frames, loop infinito`);
}
