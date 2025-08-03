const fs = require("fs");
const path = require("path");
const { findCommandImport } = require(".");
const { verifyPrefix, hasTypeOrCommand } = require("../middlewares");
const { checkPermission } = require("../middlewares/checkPermission");
const { commandPrefixes, commandsDir } = require(`${BASE_DIR}/config`);

const commandsMap = new Map();

exports.handleCommand = async (paramsHandler) => {
  const {
    commandName,
    fullArgs = [],
    prefix,
    sendWarningReply,
    sendErrorReply,
    sendErrorReact,
    socket,
    sendReply,
    sendReact,
    webMessage,
    replyJid,
    remoteJid,
    userJid,
  } = paramsHandler;
  
  const { type, command } = findCommandImport(commandName);
  
  if (!verifyPrefix(prefix) || !hasTypeOrCommand({ type, command })) {
    return;
  }
  
  if (!(await checkPermission({ type, ...paramsHandler }))) {
    await sendReact("🤏");
    await sendReply("Você não tem permissão pra isso!");
    return;
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
    return await sendErrorReply(`Houve um erro ao executar o comando!\n\n- Erro:\n\n${error}`, optionalParams);
  }
};