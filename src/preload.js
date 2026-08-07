/**
 * Preload — expose only a platform marker so the game can badge desktop
 * players in the cross-play roster (same shape the Seeker shell injects).
 */
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("__MAPLE_CLIENT__", {
  platform: "desktop",
  shell: "electron",
});
