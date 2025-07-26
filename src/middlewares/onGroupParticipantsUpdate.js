const path = require("path");
const fs = require('fs');
const { ownNumber, onlyChatsCommands } = require(`${BASE_DIR}/config`);
const { onlyNumbers, bxssdxrkLog, toUserJid } = require(`${BASE_DIR}/utils`);
const {
  setGroupMetadata,
  getGroupMetadata,
  hasGroupMetadata,
  delGroupMetadata,
  flushGroupCache
} = require(`${BASE_DIR}/utils/groupCache`);

exports.onGroupParticipantsUpdate = async ({ 
  socket, 
  id, 
  participants, 
  action
}) => {
  try {
    const metadata = await socket.groupMetadata(id);
    await setGroupMetadata(id, metadata);
  } catch (err) {
    bxssdxrkLog(`Erro ao obter/salvar metadata do grupo ${id}: ${err?.message || err}`, "groupCache", "error");
    console.log(id);
    console.log(participants);
    console.log(action);
  }

  
  if (Array.isArray(onlyChatsCommands) && onlyChatsCommands.length > 0) {
    if (!onlyChatsCommands.includes(id)) return;
  }
};