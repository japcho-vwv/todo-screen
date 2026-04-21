const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  openPopup:  () => ipcRenderer.invoke("open-popup"),
  closePopup: () => ipcRenderer.invoke("close-popup"),
  openMain:   () => ipcRenderer.invoke("open-main"),
  closeMain:  () => ipcRenderer.invoke("close-main"),
  notifyStorage: (data) => ipcRenderer.invoke("storage-changed", data),
  onStorageUpdate: (cb) => { ipcRenderer.on("storage-update", (_e, data) => cb(data)); },
});
