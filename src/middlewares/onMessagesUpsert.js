const fs = require("fs");
const path = require("path");
const { onlyChatsCommands } = require(`${BASE_DIR}/config`);
const { onlyNumbers } = require(`${BASE_DIR}/utils`);
const { 
  saveInStore,
  saveViewOnce,
  saveStatus,
  antiSpam,
  autoLikeStatus
} = require(`${BASE_DIR}/utils/bxssdxrkUtils`);
const { handleCommand } = require(`${BASE_DIR}/utils/commandHandler`);
const { createHelpers } = require(`${BASE_DIR}/utils/commonFunctions`);
const {
  setGroupMetadata,
  getGroupMetadata,
  hasGroupMetadata,
  delGroupMetadata,
  flushGroupCache
} = require(`${BASE_DIR}/utils/groupCache`);

exports.onMessagesUpsert = async ({ socket, messages }) => {
  if (!messages.length) return;
  
  for (const webMessage of messages) {
  //  await Promise.all(messages.map(async (webMessage) => {
  
  if (!webMessage?.key) continue;
  
    const spamDetected = await antiSpam(webMessage, socket);
    saveInStore(webMessage);
    if (spamDetected) continue;
    await autoLikeStatus(webMessage, socket);
    await saveViewOnce(webMessage, socket);
    await saveStatus(webMessage, socket);

    if (Array.isArray(onlyChatsCommands) && onlyChatsCommands.length > 0) {
      if (!onlyChatsCommands.includes(webMessage.key?.remoteJid)) continue;
    }

    const commonFunctions = createHelpers({ socket, webMessage });
    if (!commonFunctions) {
      continue;
    }
    await handleCommand(commonFunctions);
  }
  // }));
};