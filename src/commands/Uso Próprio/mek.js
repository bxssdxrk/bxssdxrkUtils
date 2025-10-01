const { prefix } = require(`${BASE_DIR}/config`);
const createStore = require(`../../utils/store`);
const store = createStore();

module.exports = {
  name: "Message Extended Key (mek)",
  description: "Mostra informações técnicas de uma mensagem. Apenas para uso do desenvolvedor.",
  commands: ["mek"],
  usage: `\`${prefix}mek (respondendo a mensagem)\``,
  handle: async ({ 
    sendWaitReact,
    webMessage,
    userJid,
    sendErrorReply,
    sendSuccessReply
  }) => {
    await sendWaitReact();
    const contextInfo = webMessage.message?.extendedTextMessage?.contextInfo;
    const id = contextInfo?.stanzaId || webMessage.key?.id;
    
    let remoteJid = contextInfo?.remoteJid;
    
    if (!id) return await sendErrorReply("ID da mensagem não encontrado.");

    let storedMessage;

    if (remoteJid === "status@broadcast") {
      const participant = contextInfo?.participant || userJid;
      if (!participant) return await sendErrorReply("Participante do status não encontrado.");
      storedMessage = await store.getStatus(participant, id);
    } else {
      remoteJid = webMessage.key?.remoteJid;
      const participant = contextInfo?.participant || userJid || remoteJid;
      storedMessage = await store.getMessage({ remoteJid, participant, id });
    }

    if (!storedMessage) {
      const jsonWebMessage = JSON.stringify(webMessage, null, 4);
      await sendSuccessReply("Mensagem original não encontrada no store\n\n" + jsonWebMessage);
      return;
    }

    const jsonStoredMessage = JSON.stringify(storedMessage, null, 4);
    
    await sendSuccessReply(jsonStoredMessage);
  },
};