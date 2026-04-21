import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",          // Electron이 로컬 파일 로드 시 상대경로 필요
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
