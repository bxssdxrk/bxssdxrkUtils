const path = require("path");
const fs = require('fs');
const { ownNumber, onlyChatsCommands } = require(`${BASE_DIR}/config`);
const { onlyNumbers, toUserJid } = require(`${BASE_DIR}/utils`);
const {
  setGroupMetadata,
  getGroupMetadata,
  hasGroupMetadata,
  delGroupMetadata,
  flushGroupCache
} = require(`${BASE_DIR}/utils/groupCache`);

exports.onGroupParticipantsUpdate = async ({ 
  socket, 
  remoteJid, 
  participants, 
  action
}) => {
  
  
  const metadata = await socket.groupMetadata(remoteJid);
  await setGroupMetadata(remoteJid, metadata);
  
  if (Array.isArray(onlyChatsCommands) && onlyChatsCommands.length > 0) {
    if (!onlyChatsCommands.includes(remoteJid)) return;
  }
};