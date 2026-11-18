import {expect} from '@playwright/test';
export const viewports={mobile:{width:390,height:844},tablet:{width:834,height:1194},desktop:{width:1440,height:900},wide:{width:1920,height:1080}};
export async function mockPublicBackend(page){
 await page.route('https://e2e-project.supabase.co/**',async route=>{
  const url=route.request().url();
  if(url.includes('/auth/v1/token'))return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:'invalid_grant',error_description:'Credenciais inválidas.'})});
  if(url.includes('/auth/v1/recover')||url.includes('/auth/v1/signup'))return route.fulfill({status:200,contentType:'application/json',body:'{}'});
  if(url.includes('/rest/v1/rpc/verify_certificate_public'))return route.fulfill({status:200,contentType:'application/json',body:'[]'});
  return route.fulfill({status:200,contentType:'application/json',body:'{}'});
 });
}
export async function stablePage(page,path='/'){
 await mockPublicBackend(page);await page.goto(path,{waitUntil:'networkidle'});await page.emulateMedia({reducedMotion:'reduce'});await page.addStyleTag({content:'*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;caret-color:transparent!important}'});await expect(page.locator('body')).toBeVisible();
}
export async function assertNoHorizontalOverflow(page){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);expect(overflow,'overflow horizontal em pixels').toBeLessThanOrEqual(1)}
export async function assertInsideViewport(page,selector){const viewport=page.viewportSize();for(const box of await page.locator(selector).evaluateAll(nodes=>nodes.filter(n=>{const s=getComputedStyle(n);return s.display!=='none'&&s.visibility!=='hidden'}).map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}}))){expect(box.x).toBeGreaterThanOrEqual(-1);expect(box.right).toBeLessThanOrEqual(viewport.width+1);expect(box.width).toBeGreaterThan(0)}}
export async function assertCenteredMetrics(page){const result=await page.locator('.metrics .metric,.profile-metrics .metric,.progress-metrics .metric,.admin-metrics>*').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().width>0).map(n=>{const r=n.getBoundingClientRect(),child=n.querySelector('strong,b,dd,.value,.number');if(!child)return null;const c=child.getBoundingClientRect();return{delta:Math.abs((c.left+c.width/2)-(r.left+r.width/2)),text:child.textContent?.trim()}}).filter(Boolean));for(const item of result)expect(item.delta,`métrica desalinhada: ${item.text}`).toBeLessThanOrEqual(3)}
