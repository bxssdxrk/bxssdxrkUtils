const fs = require("fs");
const { prefix } = require(`${BASE_DIR}/config`);
const { onlyNumbers, bxssdxrkLog } = require(`${BASE_DIR}/utils`);

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
    } catch {
      bxssdxrkLog("Teste falhou!", "teste", "error");
      await sendErrorReply("Erro no teste!");
    }
  }
};