const { prefix, tempDir, ownNumber } = require(`${BASE_DIR}/config`);
const { bxssdxrkLog, toUserJid } = require(`${BASE_DIR}/utils`);
const fs = require("fs");
const path = require("path");


function isValidMedia(mimeType = "", fileName = "") {
  const validMimeTypes = [
    "image/jpeg", "image/jpg", "image/png", "image/webp"
  ];
  const validExtensions = [".jpg", ".jpeg", ".png"];

  return (
    validMimeTypes.includes(mimeType) ||
    validExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
  );
}

module.exports = {
  name: "Alterar foto de perfil",
  description: "Altera sua foto de perfil.",
  commands: ["updatepfp", "atualizarfotodeperfil"],
  usage: `${prefix}updatepfp <imagem>`,
  handle: async ({
    args,
    webMessage,
    socket,
    isImage,
    isVideo,
    isDocument,
    sendReply,
    downloadMedia,
    getMediaMsg,
    deleteFilesSync,
    sendStickerFromBuffer,
    sendErrorReply,
    sendWarningReply,
    sendSuccessReact,
    sendWaitReact,
  }) => {
    await sendWaitReact();
    
    if (!isImage && !isDocument) {
      return await sendErrorReply("Envie ou marque uma imagem válida.");
    }
    
    if (isDocument) {
      const docMsg = webMessage.message?.documentMessage ||
      webMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage?.documentMessage;
      const mimeType = docMsg?.mimetype || "";
      const fileName = docMsg?.fileName || "";
      
      if (!isValidMedia(mimeType, fileName)) {
        return await sendErrorReply("Documento com formato inválido.");
      }
    }
    
    const mediaMsg = await getMediaMsg(webMessage);
    
    if (!mediaMsg) {
      return await sendErrorReply("Nenhuma mídia válida encontrada.");
    }
    
    const inputPath = await downloadMedia(mediaMsg, `input-${Date.now()}`);
    
    try {
      await socket.updateProfilePicture(
        toUserJid(ownNumber), 
        { url: inputPath }
      );
    } catch (error) {
      bxssdxrkLog(error, "pfp", "error");
      await sendErrorReply("Erro ao alterar imagem de perfil. Veja o motivo no console.");
    }
    
    await deleteFilesSync(inputPath);
    return await sendSuccessReact();
  },
};