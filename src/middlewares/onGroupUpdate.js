const { bxssdxrkLog } = require(`${BASE_DIR}/utils`);
const { setGroupMetadata } = require(`${BASE_DIR}/utils/groupCache`);

exports.onGroupUpdate = async ({
  socket, 
  event,
}) => {
  try {
    const metadata = await socket.groupMetadata(event.id);
    await setGroupMetadata(event.id, metadata);
  } catch (err) {
    bxssdxrkLog(`Erro ao obter/salvar metadata do grupo ${id}: ${err?.message || err}`, "groupCache", "error");
  }
};