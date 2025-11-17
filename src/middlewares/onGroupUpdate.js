const { bxssdxrkLog } = require(`${BASE_DIR}/utils`);
const { setGroupMetadata } = require(`${BASE_DIR}/utils/groupCache`);

exports.onGroupUpdate = async ({
  socket, 
  event,
}) => {
  try {
    const metadata = await socket.groupMetadata(event.id);
    setGroupMetadata(event.id, metadata);
  } catch (err) {
    bxssdxrkLog(`Erro ao obter/salvar metadata do grupo ${event.id}: ${err?.message || err}`, "groupCache", "error");
  }
};