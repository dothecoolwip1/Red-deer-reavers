import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Isolated prototype: relative base so it can be served from any sub-folder.
export default defineConfig({ base: './', plugins: [react()] })
