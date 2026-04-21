// preload.js — renderer와 main 사이의 안전한 브릿지
// 현재는 별도 IPC 없이 localStorage만 사용하므로 최소화
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
});
