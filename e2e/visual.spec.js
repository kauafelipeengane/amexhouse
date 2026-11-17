import{test,expect}from'@playwright/test';import{stablePage}from'./fixtures/app.js';
const screens=[['login','/'],['privacidade','/#/privacy'],['termos','/#/terms'],['certificado','/#/verify']];
for(const [name,path]of screens)test(`${name} corresponde ao baseline`,async({page})=>{await stablePage(page,path);await expect(page).toHaveScreenshot(`${name}.png`,{fullPage:true,animations:'disabled',caret:'hide',mask:[page.locator('time')]})});
