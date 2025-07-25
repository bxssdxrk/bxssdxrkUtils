const { prefix } = require(`${BASE_DIR}/config`);
const { onlyNumbers } = require(`${BASE_DIR}/utils`);
const { exec } = require("child_process");

module.exports = {
  name: "restart",
  description: "Reinicia o script",
  commands: ["restart", "reiniciar", "reload", "rl"],
  usage: `${prefix}restart`,
  handle: async ({ 
    sendWaitReact,
    sendSuccessReact,
    sendTextWithButtons,
    userJid, 
  }) => {
    await sendWaitReact();
    
    const button = [
      { text: "Reiniciar Novamente", id: `${prefix}rl` }
    ];
    
    const optionalParams = {
      title: "♻️ Reiniciando o bxssdxrkUtils!",
      footer: `Pode demorar um pouquinho...`,
      buttons: button,
      mentions: [userJid]
    };
    
    await sendSuccessReact();
    await sendTextWithButtons(`Olá, @${onlyNumbers(userJid)}!\nO script está reiniciando...\nPor favor, aguarde!`, optionalParams);
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  },
};