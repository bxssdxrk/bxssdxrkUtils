const { prefix } = require(`${BASE_DIR}/config`);
const { bxssdxrkLog } = require(`${BASE_DIR}/utils`);

module.exports = {
  name: "Teste",
  description: "Comando de Teste",
  commands: ["test", "teste"],
  usage: `${prefix}test`,
  handle: async ({ 
    sendWaitReact,
    sendSuccessReply,
    sendErrorReply,
  }) => {
    await sendWaitReact();
    try {
      bxssdxrkLog("Teste concluido!", "teste", "success");
      
      await sendSuccessReply("Teste concluido!");
    } catch (error) {
      bxssdxrkLog("Teste falhou!", "teste", "error");
      bxssdxrkLog(error, "teste", "error");
      await sendErrorReply("Erro no teste! Veja o console.");
    }
  }
};