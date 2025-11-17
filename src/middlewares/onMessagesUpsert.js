const { onlyChatsCommands } = require(`${BASE_DIR}/config`);
const { resolveLid } = require(`${BASE_DIR}/utils`);
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
  hasGroupMetadata
} = require(`${BASE_DIR}/utils/groupCache`);

exports.onMessagesUpsert = async ({ socket, messages }) => {
  if (!messages.length) return;
  
  for (const webMessage of messages) {
    if (!webMessage?.key) continue;
  
    const spamDetected = await antiSpam(webMessage, socket);
    let { participant, participantAlt } = webMessage?.key;

    const lid = await resolveLid(socket, participant, participantAlt);
    webMessage.key.participant = lid;
    webMessage.key.participantAlt = lid;
    
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
};