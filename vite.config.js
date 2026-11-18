import{defineConfig}from'vite';
export default defineConfig({esbuild:{jsx:'automatic'},build:{target:'es2022',cssCodeSplit:true,sourcemap:false,assetsInlineLimit:4096,chunkSizeWarningLimit:350,rollupOptions:{output:{manualChunks(id){if(id.includes('/node_modules/react/')||id.includes('/node_modules/react-dom/'))return'react-vendor'}}}}});
