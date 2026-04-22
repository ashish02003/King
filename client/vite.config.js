import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: '../server/public',
        // Preserve `server/public/admin` so the standalone admin build remains available.
        emptyOutDir: false,
    }
})
