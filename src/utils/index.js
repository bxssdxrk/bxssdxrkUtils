const path = require("path");
const fs = require("fs");
global.BASE_DIR = path.resolve(__dirname, "..");
const { version } = require("../../package.json");
const readline = require("readline");
const { commandsDir } = require(`${BASE_DIR}/config`);

exports.question = (message) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(message, resolve));
};

const onlyNumbers = (text) => text.replace(/[^0-9]/g, "");
const toUserJid = (number) => `${onlyNumbers(number)}@s.whatsapp.net`;
exports.onlyNumbers = onlyNumbers;
exports.toUserJid = toUserJid;


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

exports.bxssdxrkLog = (message, type = "log", status = "info") => {
    const colorMap = {    
      error:   "\x1b[1;31m",    
      success: "\x1b[1;32m",    
      warn:    "\x1b[1;33m",    
      info:    "\x1b[1;34m",    
      debug:   "\x1b[1;35m",    
      trace:   "\x1b[1;36m",    
      neutral: "\x1b[1;37m",    
    };
    const color = colorMap[status] || "\x1b[1;37m";
    const label = `${color}[bxssdxrkUtils. | ${type}]\x1b[0m`;
    return console.log(`${label} ${message}`);
  };
  
exports.extractDataFromMessage = (webMessage, commandPrefixes = ['.', '!', '/']) => {
  const deepGet = (obj, paths) => {
    for (const path of paths) {
      try {
        const value = path.split('.').reduce((acc, part) => acc[part], obj);
        if (value !== undefined && value !== null) return value;
      } catch {}
    }
    return null;
  };

  const fullMessagePaths = [
    'message.conversation',
    'message.extendedTextMessage.text',
    'message.imageMessage.caption',
    'message.videoMessage.caption',
    'message.documentMessage.caption',
    'message.interactiveResponseMessage.body.text',
    'message.ephemeralMessage.message.extendedTextMessage.text',
    'message.groupMentionedMessage.message.extendedTextMessage.text',
    'message.templateButtonReplyMessage.selectedId',
    'message.buttonsResponseMessage.selectedButtonId',
    {
      path: 'message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson',
      parse: json => JSON.parse(json)?.id
    }
  ];

  const fullMessage = fullMessagePaths.reduce((result, pathConfig) => {
    if (result) return result;
    if (typeof pathConfig === 'string') {
      return deepGet(webMessage, [pathConfig]);
    }
    
    try {
      const rawValue = deepGet(webMessage, [pathConfig.path]);
      return rawValue ? pathConfig.parse(rawValue) : null;
    } catch {
      return null;
    }
  }, null);

  const replyJid = [
    'message.extendedTextMessage.contextInfo.participant',
    'message.imageMessage.contextInfo.participant',
    'message.videoMessage.contextInfo.participant',
    'message.documentMessage.contextInfo.participant',
    'message.audioMessage.contextInfo.participant',
    'message.stickerMessage.contextInfo.participant',
    'message.interactiveResponseMessage.contextInfo.participant',
    'message.buttonsResponseMessage.contextInfo.participant',
    'message.templateButtonReplyMessage.contextInfo.participant'
  ].reduce((jid, path) => jid || deepGet(webMessage, [path]), null);

  const userJid = webMessage?.key?.participant?.replace(
    /:[0-9][0-9]|:[0-9]/g,
    ""
  );

  if (!fullMessage) {
    return {
      remoteJid: webMessage?.key?.remoteJid || null,
      userJid: userJid || null,
      prefix: null,
      commandName: null,
      isReply: false,
      replyJid,
      args: [],
      fullArgs: '',
      fullMessage: null,
    };
  }

  const isReply = [
    'message.extendedTextMessage.contextInfo.quotedMessage',
    'message.imageMessage.contextInfo.quotedMessage',
    'message.videoMessage.contextInfo.quotedMessage',
    'message.documentMessage.contextInfo.quotedMessage',
    'message.audioMessage.contextInfo.quotedMessage',
    'message.stickerMessage.contextInfo.quotedMessage'
  ].some(path => deepGet(webMessage, [path]));

  const [command, ...args] = fullMessage.trim().split(/\s+/);
  const prefix = command.charAt(0);

  let commandWithoutPrefix = command;
  while (commandWithoutPrefix && commandPrefixes.includes(commandWithoutPrefix.charAt(0))) {
    commandWithoutPrefix = commandWithoutPrefix.substring(1);
  }

  return {
    remoteJid: webMessage?.key?.remoteJid || null,
    prefix,
    userJid,
    replyJid,
    isReply,
    commandName: this.formatCommand(commandWithoutPrefix),
    args: this.splitByCharacters(args.join(" "), ["\\", "|"]),
    fullArgs: args.join(" "),
    fullMessage,
  };
};

exports.splitByCharacters = (str, characters) => {
  characters = characters.map((char) => (char === "\\" ? "\\\\" : char));
  const regex = new RegExp(`[${characters.join("")}]`);
  return str
    .split(regex)
    .map((str) => str.trim())
    .filter(Boolean);
};

exports.formatCommand = (text) => {
  return this.onlyLettersAndNumbers(
    this.removeAccentsAndSpecialCharacters(text.toLocaleLowerCase().trim())
  );
};

exports.onlyLettersAndNumbers = (text) => {
  return text.replace(/[^a-zA-Z0-9]/g, "");
};

exports.removeAccentsAndSpecialCharacters = (text) => {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

exports.findCommandImport = (commandName) => {
  const commands = this.readCommandImports();
  
  for (const [type, commandList] of Object.entries(commands)) {
    const targetCommand = commandList.find(cmd => 
      cmd.commands.some(c => this.formatCommand(c) === commandName)
    );
    
    if (targetCommand) {
      return {
        type,
        command: targetCommand
      };
    }
  }
  
  return { type: "", command: null };
};

exports.readCommandImports = () => {
  const commandImports = {};
  
  const scanDirectory = (dirPath, type) => {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        scanDirectory(fullPath, type);
      } 
      else if (
        (item.isFile() && 
        !item.name.startsWith("_") && 
        (item.name.endsWith(".js") || item.name.endsWith(".ts"))
      )) {
        if (!commandImports[type]) commandImports[type] = [];
        const commandModule = require(fullPath);
        commandImports[type].push(commandModule);
      }
    }
  };

  const mainDirs = fs.readdirSync(commandsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const type of mainDirs) {
    scanDirectory(path.join(commandsDir, type), type);
  }

  return commandImports;
};