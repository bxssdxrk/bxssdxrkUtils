const { prefix } = require(`${BASE_DIR}/config`);
const { bxssdxrkLog } = require(`${BASE_DIR}/utils`);
const {
  ytdlmp3,
  ytdlmp4,
  ytsearch
} = require('bxssdxrk-ytdl');

module.exports = {
  name: "Downloader YouTube",
  description: "Baixa videos, audios e thumbnails de videos do YouTube com qualidade ajustável.",
  commands: ["ytmp3", "ytmp4", "ytsearch"],
  usage: `${prefix}ytmp3 <query> | <quality>`,
  handle: async ({ 
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
    socket,
    userJid,
    args,
    commandName,
    getBuffer,
    sendTextWithButtons,
    sendVideoFromURL,
    sendImageFromURL,
    sendAudioFromURL,
    sendDocumentFromURL,
  }) => {
    await sendWaitReact();
    const url = args[0] ? args[0] : '';
    let qualityOrAmount = args[0] ? args[0] : '';
    
    let result;
    let thumbBuffer;
    try {
      
      switch(commandName) {
        case "ytmp3":
          result = await ytdlmp3(url, qualityOrAmount);
          thumbBuffer = await getBuffer(result?.info?.thumbnail);
          await sendAudioFromURL(result?.download?.link, {
            contextInfo: {
              externalAdReply: {
                title: result?.info?.title,
                body: result?.info?.description,
                thumbnail: thumbBuffer,
                mediaType: 2,
                mediaUrl: result?.info?.url,
                sourceUrl: result?.info?.url,
                showAdAttribution: false,
                renderLargerThumbnail: true
              },
            },
          });
          break;
        case "ytmp4":
          result = await ytdlmp4(url, qualityOrAmount); // Aqui só passa url e quality
          const info = result?.info;
          caption = `*Autor:* ${info?.author?.name}
*Título:* ${info?.title}
*Canal:* ${info?.author?.url}
*Descrição:* ${info?.description}
*Duração:* ${info?.duration?.timestamp}
*Lançado em:* ${info?.ago}
`;
          thumbBuffer = await getBuffer(result?.info?.thumbnail);
          await sendVideoFromURL(result?.download?.link, {
            caption,
            contextInfo: {
              externalAdReply: {
                title: result?.info?.title,
                body: result?.info?.description,
                thumbnail: thumbBuffer,
                mediaType: 2,
                mediaUrl: result?.info?.url,
                sourceUrl: result?.info?.url,
                showAdAttribution: false,
                renderLargerThumbnail: false
              },
            },
          });
          break;
        case "ytsearch":
          if (qualityOrAmount > 10) qualityOrAmount = 10;
          if (qualityOrAmount < 1) qualityOrAmount = 1;
          result = await ytsearch(url, qualityOrAmount); // Aqui só passa query e amount
          break;
      }
      
      console.log(result);
      
    } catch (error) {
      console.log(error);
      await sendErrorReply("Erro no teste! Veja o console.");
    }
  }
};