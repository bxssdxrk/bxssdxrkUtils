const { prefix } = require(`${BASE_DIR}/config`);
const { onlyNumbers } = require(`${BASE_DIR}/utils`);

module.exports = {
  name: "Teste de Sucesso",
  description: "Envia uma mensagem de sucesso com reação",
  commands: ["test"],
  usage: `${prefix}test`,
  handle: async ({ 
    sendSuccessReply,
    sendTextWithButtons,
    userJid,
    webMessage
  }) => {
    
    const botoes = [
      { text: ":3", id: ".test" }
    ];
    
    const optionalParams = {
      title: `Olá, @${onlyNumbers(userJid)}!`,
      footer: `Espero que goste! :D`,
      buttons: botoes,
      mentions: [userJid]
    };
    await sendTextWithButtons(`Obrigado por usar bxssdxrkUtils! :3`, optionalParams);
  }
};