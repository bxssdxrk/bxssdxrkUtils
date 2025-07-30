const { prefix, tempDir, stickerMetadata } = require(`${BASE_DIR}/config`);
const fs = require("fs");
const path = require("path");
const {
  convertMediaToSticker,
  convertMediaToStickerC,
  convertMediaToStickerX,
} = require(`${BASE_DIR}/utils/stickerUtils`);

// Carrega metadata para sticker (packname e author)
async function loadStickerMetadata() {
  return {
    packname: stickerMetadata.packName,
    author: stickerMetadata.author,
  };
}

// Valida se o tipo MIME ou extensão de arquivo é compatível com sticker
function isValidMedia(mimeType = "", fileName = "") {
  const validMimeTypes = [
    "image/jpeg", "image/png", "image/gif",
    "image/webp", "video/mp4", "video/webm",
  ];
  const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm"];

  return (
    validMimeTypes.includes(mimeType) ||
    validExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
  );
}

module.exports = {
  name: "Fazer Figurinha",
  description: "Cria uma figurinha a partir de uma imagem, vídeo ou gif. Use 'x' ou 'c' para estilos diferentes.",
  commands: ["s", "stic", "stik", "stick", "sticke", "sticker", "f", "fig", "figu", "figurinha", "figurinhas"],
  usage: `${prefix}fig <mídia> | ${prefix}fig x <mídia> | ${prefix}fig c <mídia>`,

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
    sendStickerFromBuffer,
    sendErrorReply,
    sendWarningReply,
    sendSuccessReact,
    sendWaitReact,
  }) => {
    await sendWaitReact();

    // Extrai info de vídeo (citada ou direta)
    const videoMsg = webMessage.message?.videoMessage ||
      webMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;

    const fileSizeMB = ((videoMsg?.fileLength || 0) / (1024 * 1024)).toFixed(2);
    const duration = videoMsg?.seconds || 0;

    // Validação de vídeo
    if (duration > 15) {
      return await sendWarningReply(`O vídeo não pode ter mais que 10 segundos! O seu tem ${duration}s.`);
    }
    if (fileSizeMB > 1.0) {
      return await sendWarningReply(`O vídeo não pode ultrapassar 1MB! O seu tem ${fileSizeMB}MB.`);
    }

    // Validação básica de tipo de mídia
    if (!isImage && !isVideo && !isDocument) {
      return await sendErrorReply("Envie ou marque uma imagem, vídeo ou documento válido.");
    }

    try {
      // Validação de documento (se for o caso)
      if (isDocument) {
        const docMsg = webMessage.message?.documentMessage ||
          webMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage?.documentMessage;

        const mimeType = docMsg?.mimetype || "";
        const fileName = docMsg?.fileName || "";

        if (!isValidMedia(mimeType, fileName)) {
          return await sendErrorReply("Documento com formato inválido.");
        }
      }

      // Obtém a mídia correta
      const mediaMsg = getMediaMsg(webMessage);
      if (!mediaMsg) {
        return await sendErrorReply("Nenhuma mídia válida encontrada.");
      }

      // Download da mídia para arquivo temporário
      const inputPath = await downloadMedia(mediaMsg, `input-${Date.now()}`);
      const buffer = fs.readFileSync(inputPath);
      const metadata = await loadStickerMetadata();
      const style = args[0]?.toLowerCase();

      let stickerOutput;

      // Escolhe estilo de figurinha
      switch (style) {
        case "c":
          stickerOutput = await convertMediaToStickerC(buffer, metadata);
          break;
        case "x":
          stickerOutput = await convertMediaToStickerX(buffer, metadata);
          break;
        default:
          stickerOutput = await convertMediaToSticker(buffer, metadata);
          break;
      }

      await sendStickerFromBuffer(stickerOutput);

      // Limpeza dos arquivos temporários
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (typeof stickerOutput === "string" && fs.existsSync(stickerOutput)) {
        fs.unlinkSync(stickerOutput);
      }

      return await sendSuccessReact();
    } catch (err) {
      console.error("Erro ao criar figurinha:", err);
      return await sendErrorReply("Erro ao criar a figurinha.");
    }
  },
};