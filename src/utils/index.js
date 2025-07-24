const { version } = require("../../package.json");
const readline = require("readline");

exports.question = (message) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(message, resolve));
};

exports.onlyNumbers = (text) => text.replace(/[^0-9]/g, "");

exports.toUserJid = (number) => `${onlyNumbers(number)}@s.whatsapp.net`;

const randomColor = () => ({
  r: Math.floor(Math.random() * 256),
  g: Math.floor(Math.random() * 256),
  b: Math.floor(Math.random() * 256),
});
  
const interpolateColor = (start, end, factor) => ({
  r: Math.round(start.r + factor * (end.r - start.r)),
  g: Math.round(start.g + factor * (end.g - start.g)),
  b: Math.round(start.b + factor * (end.b - start.b)),
});
  
exports.bxssdxrkBanner = () => {
  const color1 = randomColor();
  const color2 = randomColor();
  const lines = [
    '░█▀▄░█░█░▄▀▀░▄▀▀░█▀▄░█░█░█▀▄░█░█░░░',
    '░█░█░█░█░█░░░█░░░█░█░█░█░█░█░█░█░░░',
    '░█▀▄░▄▀▄░▀▀▄░▀▀▄░█░█░▄▀▄░█▀▄░█▀▄░░░',
    '░█░█░█░█░░░█░░░█░█░█░█░█░█░█░█░█░░░',
    '░█░█░█░█░░░█░░░█░█░█░█░█░█░█░█░█░▄░',
    '░▀▀░░▀░▀░▀▀░░▀▀░░▀▀░░▀░▀░▀░▀░▀░▀░▀░',
  ];
  lines.forEach((line, index) => {
    const factor = index / (lines.length - 1);
    const color = interpolateColor(color1, color2, factor);
    console.log(`\x1b[38;2;${color.r};${color.g};${color.b}m${line}\x1b[0m`);
  });
  console.log(`\x1b[38;2;${color2.r};${color2.g};${color2.b}m ✧ Versão: \x1b[38;2;${color1.r};${color1.g};${color1.b}m${version}\n\x1b[0m`);
};