const fs = require("fs");
const { prefix } = require(`${BASE_DIR}/config`);
const { onlyNumbers, bxssdxrkLog } = require(`${BASE_DIR}/utils`);

module.exports = {
  name: "Nome do Comando",
  description: "Descrição do comando",
  commands: ["test", "teste"],
  usage: `${prefix}test`,
  handle: async ({ 
    sendWaitReact,
    sendSuccessReply,
  }) => {
    await sendWaitReact();
    bxssdxrkLog("Teste!", "teste", "success");
    await sendSuccessReply("Teste concluido!");
  }
};