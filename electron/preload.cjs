const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('crepettooPrint', {
  silent: (html, opts) => ipcRenderer.invoke('print:silent', html, opts),
});
