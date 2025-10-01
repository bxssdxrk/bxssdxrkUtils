const fs = require("fs");
const path = require("path");
const { findCommandImport, bxssdxrkLog, onlyNumbers, drawBox, isUserJid, isUserLid, isGroupJid } = require(".");
const { getGroupMetadata, hasGroupMetadata } = require("./groupCache");
const { verifyPrefix, hasTypeOrCommand } = require("../middlewares");
const { checkPermission } = require("../middlewares/checkPermission");
const { commandPrefixes, commandsDir, allowCommands, shouldLogCommands, debug } = require(`${BASE_DIR}/config`);
const { Formatter } = require("@loggings/beta");

const commandsMap = new Map();

exports.handleCommand = async (paramsHandler) => {
  const {
    commandName,
    fullArgs = [],
    args = [],
    prefix,
    sendErrorReply,
    socket,
    sendReply,
    sendReact,
    webMessage,
    replyJid,
    fromMe,
    remoteJid,
    userJid,
  } = paramsHandler;
  
  const { type, command } = findCommandImport(commandName);
  
  if (!allowCommands || !verifyPrefix(prefix) || !hasTypeOrCommand({ type, command })) {
    return;
  }
  
  if (!(await checkPermission({ type, ...paramsHandler }))) {
    await sendReact("🤏");
    await sendReply("Você não tem permissão pra isso!");
    return;
  }
  
  if (shouldLogCommands) {
    const now = new Date();
    const dayAndHour = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour12: false })}`;
  
    const candidates = [
      webMessage?.key?.participant,
      webMessage?.key?.participantAlt,
      webMessage?.participant,
      remoteJid
    ];
    
    let userId = candidates.find(id => isUserJid(id));
    
    if (!userId) {
      userId = candidates.find(id => isUserLid(id));
    }
    
    const isJid = isUserJid(userId);
    const isLid = !isJid && isUserLid(userId);
    const userNumber = isJid ? onlyNumbers(userId) : null;
    
    const texts = [
      `Comando: ${prefix}${commandName} (${type})`,
      `Usuário: ${(webMessage?.pushName ?? "Desconhecido")}`,
      `Horário: ${dayAndHour}`,
    ];
    
    if (debug) {
      texts.push(`Argumentos: ${args}`);
    }
    
    if (isJid && userNumber) {
      texts.push(`Número: ${userNumber}`, `JID: ${userId}`);
    } else if (isLid) {
      texts.push(`LID: ${userId}`);
    } else if (userId) {
      texts.push(`ID desconhecido: ${userId}`);
    }
    
    if (isGroupJid(remoteJid)) {
      if (await hasGroupMetadata(remoteJid)) {
        const metadata = await getGroupMetadata(remoteJid);
        const { subject, id } = metadata;
    
        if (debug && id) {
          texts.push(`Grupo ID: ${id}`);
        } else if (subject) {
          texts.push(`Grupo: ${subject}`);
        }
      } else {
        texts.push(`Grupo ID: ${remoteJid}`);
      }
    }
    
    const box = drawBox(texts, "Comando ativado");
    
    const formattedBox = box.box
      .map((line) => {
        if (!line.includes(":")) return line;
        const colonIndex = line.indexOf(":");
        const label = line.substring(0, colonIndex);
        const restOfLine = line.substring(colonIndex + 1);
        const value = restOfLine.replace(/│/g, "").trim();
        const spacesAfter = restOfLine.match(/\s+│$/)?.[0] || " │";
        const formattedLine = `${label}: [${value}].green${spacesAfter}`;
        return Formatter(formattedLine)[0];
      })
      .join("\n");
    
    process.stdout.write(formattedBox + "\n");
  }
  
  try {
    await command.handle({
      ...paramsHandler,
      type,
    });
  } catch (error) {
    let optionalParams = {
      title: "Erro!",
      footer: "Por favor, verifique o console."
    };
    await bxssdxrkLog(error, command.name, "error");
    return await sendErrorReply(`Houve um erro ao executar o comando!\n\nErro:\n\n${error}`, optionalParams);
  }
};