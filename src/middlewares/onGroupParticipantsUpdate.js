const { bxssdxrkLog } = require(`${BASE_DIR}/utils`);
const {
  setGroupMetadata
} = require(`${BASE_DIR}/utils/groupCache`);

exports.onGroupParticipantsUpdate = async ({ 
  socket, 
  id, 
  participants, 
  action
}) => {
  try {
    const metadata = await socket.groupMetadata(id);
    setGroupMetadata(id, metadata);
  } catch (err) {
    bxssdxrkLog(`Erro ao obter/salvar metadata do grupo ${id}: ${err?.message || err}`, "groupCache", "error");
  }
};