const { prefix } = require(`${BASE_DIR}/config`);

module.exports = {
  name: "sendFromURL (COMANDO AUXILIAR)",
  description: "Envia imagem, audio, video ou figurinha a partir de um link. Este comando é auxiliar, ou seja, ele é usado como auxilio em outros comandos que usam botões.",
  commands: ["sendfromurl"],
  usage: `${prefix}sendfromurl <link> | <type>`,
  handle: async ({
    args,
    sendWaitReact,
    sendSuccessReact,
    sendImageFromURL,
    sendVideoFromURL,
    sendAudioFromURL,
    sendStickerFromURL,
    sendDocumentFromURL,
  }) => {
    await sendWaitReact();
    const link = args[0];
    const type = args[1];
    if (!link || !type) return sendErrorReply(`Você não era suposto de usar esse comando assim.`);
    switch (type) {
      case "image":
        await sendImageFromURL(link);
      break;
      case "video":
        await sendVideoFromURL(link);
      break;
      case "audio":
        await sendAudioFromURL(link);
      break;
      case "sticker":
        await sendStickerFromURL(link);
      break;
      case "document":
      case "doc":
        await sendDocumentFromURL(link);
      break;
    }
    await sendSuccessReact();
  }
};