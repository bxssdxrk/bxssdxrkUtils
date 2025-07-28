const path = require("path");
const fs = require('fs');
const { bxssdxrkLog } = require(`${BASE_DIR}/utils`);
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
  }
};