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
    await saveInStore(webMessage);
    const spamDetected = await antiSpam(webMessage, socket);
    if (spamDetected) continue;
    await saveViewOnce(webMessage, socket);
    await autoLikeStatus(webMessage, socket);
    await saveStatus(webMessage, socket);
    
    if (Array.isArray(onlyChatsCommands) && onlyChatsCommands.length > 0) {
      if (!onlyChatsCommands.includes(webMessage.key?.remoteJid)) return;
    }
    
    const commonFunctions = createHelpers({ socket, webMessage });
    if (!commonFunctions) {
      return;
    }
    
    await handleCommand(commonFunctions);
  }
};