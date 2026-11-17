import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',fullyParallel:true,forbidOnly:!!process.env.CI,retries:process.env.CI?2:0,workers:process.env.CI?2:undefined,timeout:30_000,
 expect:{timeout:5_000,toHaveScreenshot:{animations:'disabled',caret:'hide',maxDiffPixelRatio:0.002,threshold:0.2}},
 reporter:process.env.CI?[['line'],['html',{open:'never'}],['junit',{outputFile:'test-results/e2e.xml'}]]:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure',video:'retain-on-failure',reducedMotion:'reduce',locale:'pt-BR',timezoneId:'America/Sao_Paulo'},
 snapshotPathTemplate:'{testDir}/__snapshots__/{testFilePath}/{arg}-{projectName}{ext}',
 projects:[
  {name:'desktop-chromium',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}},
  {name:'mobile-chromium',use:{...devices['Pixel 7'],viewport:{width:390,height:844},isMobile:true,hasTouch:true}},
  {name:'tablet-chromium',use:{...devices['iPad Pro 11'],viewport:{width:834,height:1194}}},
 ],
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 4173',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:120_000,env:{VITE_SUPABASE_URL:'https://e2e-project.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_e2e_public_key'}}
});
