const fs = require("fs");
const path = require("path");
const { findCommandImport, bxssdxrkLog, onlyNumbers, drawBox, isJid, isLid, isGroupJid } = require(".");
const { getGroupMetadata, hasGroupMetadata } = require("./groupCache");
const { verifyPrefix, hasTypeOrCommand } = require("../middlewares");
const { checkPermission } = require("../middlewares/checkPermission");
const { commandPrefixes, commandsDir, allowCommands, shouldLogCommands, debug } = require(`${BASE_DIR}/config`);
const { Formatter } = require("@loggings/beta");

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
  
  const txt = webMessage?.message?.conversation || webMessage?.message?.extendedTextMessage?.text;
  
  const meLidResult = await socket.getLidUser(socket.user.id).catch(() => null);
  const meLid = meLidResult?.[0]?.lid;
  
  if (meLid && meLid === userJid && txt?.startsWith('> ')) {
    // Normaliza o texto antes do eval
    const code = fullArgs
      .replace(/^>\s?/, '')     // remove o ">" inicial
      .replace(/\r\n/g, '\n')   // normaliza as quebras de linha
      .trim();
    
    try {
      const result = await eval(`(async ({${Object.keys(paramsHandler).join(', ')}}) => { ${code} })`)(paramsHandler);
      
      console.log('--- Resultado do eval ---');
      console.log(result);
      console.log('-------------------------');
    } catch (err) {
      console.error('Erro no eval:', err);
      await sendErrorReply(err.message);
    }
  }
  
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
    
    let userId = candidates.find(id => isJid(id));
    
    if (!userId) {
      userId = candidates.find(id => isLid(id));
    }
    
    const isJidID = isJid(userId);
    const isLidID = !isJidID && isLid(userId);
    const userNumber = isJidID ? onlyNumbers(userId) : null;
    
    const texts = [
      `Comando: ${prefix}${commandName} (${type})`,
      `Usuário: ${(webMessage?.pushName ?? "Desconhecido")}`,
      `Horário: ${dayAndHour}`,
    ];
    
    //  if (debug && args.length > 0) {
    //    texts.push(`Argumentos: ${args}`);
    //  }
    
    if (isJidID && userNumber) {
      texts.push(`Número: ${userNumber}`, `JID: ${userId}`);
    } else if (isLidID) {
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