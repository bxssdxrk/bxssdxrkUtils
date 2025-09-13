const { prefix } = require(`${BASE_DIR}/config`);
const { toUserJid, onlyNumbers } = require(`${BASE_DIR}/utils`);

module.exports = {
  name: "saveProfilePicture",
  description: "Salva a imagem de perfil do usuário/grupo no seu armazenamento.",
  commands: ["perfil", "fotodeperfil", "imagemdeperfil", "pfp"],
  usage: `${prefix}pfp @usuário (ou respondendo)`,
  handle: async ({ 
    socket,
    args,
    remoteJid,
    replyJid,
    sendWaitReact,
    sendImageFromURL,
    sendErrorReply,
    sendWarningReply,
  }) => {
    try {
      await sendWaitReact();
      let toGetPP = toUserJid(args[0]) || replyJid || remoteJid;
      if (!toGetPP) return await sendWarningReply("Especifique um usuário.");
      const ppURL = await socket.profilePictureUrl(toGetPP, 'image');
      
      await sendImageFromURL(ppURL, {
        caption: `Exibindo a imagem de perfil de: @${onlyNumbers(toGetPP)}`,
        mentions: [toGetPP],
      });
    } catch (error) {
      const errorCode = error.output?.payload?.statusCode;
      
      if (errorCode === 500) {
        return await sendErrorReply(`A imagem de perfil do usuário não é pública ou este número não está no WhatsApp. Verifique o número e tente novamente. Não foi possível baixar a imagem.`);
      }
      if (errorCode === 408) {
        return await sendErrorReply(`Não foi possível baixar a imagem de perfil do usuário pois o WhatsApp demorou demais para responder.`);
      }
      return sendErrorReply(`Erro desconhecido:\n${error}`);
    }
  }
};