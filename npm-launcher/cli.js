#!/usr/bin/env node
/** drooly-games — open a Drooly game or show desktop download links. */
const { exec } = require("child_process");
const arg = (process.argv[2] || "ddd").toLowerCase();
const urls = {
  ddd: "https://drooly.ai/games/ddd/",
  wetdrool: "https://drooly.ai/games/wetdrool/",
  downloads: "https://github.com/droolyai/drooly-desktop/releases/latest",
};
const url = urls[arg] || urls.ddd;
if (arg === "help" || arg === "--help") {
  console.log("usage: npx drooly-games [ddd|wetdrool|downloads]");
  process.exit(0);
}
if (arg === "wetdrool") console.log("WetDrool is 18+ — age gate enforced in-game.");
console.log("Opening", url);
const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start \"\"" : "xdg-open";
exec(`${opener} "${url}"`);
