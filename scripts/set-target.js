const fs = require("fs");
const path = require("path");
const game = process.argv[2] === "wetdrool" ? "wetdrool" : "ddd";
fs.writeFileSync(path.join(__dirname, "..", "src", "target.json"), JSON.stringify({ game }) + "\n");
console.log("target:", game);
