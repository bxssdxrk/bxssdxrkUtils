const { prefix, commandPrefixes } = require(`${BASE_DIR}/config`);
const fs = require("fs");
const {
  hasGroupMetadata,
  getGroupMetadata
} = require(`${BASE_DIR}/utils/groupCache`);

module.exports = {
  name: "Marcar Todos",
  description: "Marca todos os participantes do grupo.",
  commands: ["cita", "citar", "everyone", "here", "marcar", "mencionar", "tagall"],
  usage: `${prefix}marcar`,
  handle: async ({
    remoteJid,
    sendErrorReply,
    socket,
    webMessage,
    args,
    sendWaitReact,
    sendReact,
    isImage,
    isVideo,
    isAudio,
    isGroupJid,
    isSticker,
    isViewOnce,
    downloadMedia,
    getMediaMsg,
    deleteFilesSync
  }) => {
    await sendWaitReact();
    
    if (!isGroupJid(remoteJid)) {
      return await sendErrorReply("Este comando só funciona em grupos.");
    }
    const groupMetadata = await hasGroupMetadata(remoteJid) 
      ? await getGroupMetadata(remoteJid) 
      : await socket.groupMetadata(remoteJid);
    
    const mentions = groupMetadata.participants.map(participant => participant.id);
    
    const contextInfo = webMessage?.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;
    
    const removePrefix = (text) => {
      if (!text) return text;
      
      for (const p of commandPrefixes) {
        if (text.startsWith(p)) {
          return text.slice(p.length);
        }
      }
      return text;
    };
    
    const getTextContent = () => {
      const quotedText = quotedMessage?.conversation || quotedMessage?.extendedTextMessage?.text;
      const argsText = args.join(" ");
      const text = quotedText || argsText;
      
      return removePrefix(text);
    };
    
    const text = getTextContent();
    
    const getCaption = () => {
      const imageCaption = quotedMessage?.imageMessage?.caption;
      const videoCaption = quotedMessage?.videoMessage?.caption;
      const caption = imageCaption || videoCaption;
      
      return removePrefix(caption);
    };
    
    const caption = getCaption();
    
    // Aparentemente há um erro no Baileys ao enviar em visualização única.
    // Então por enquanto, vai sempre enviar sem visualização única.
    // Vou deixar comentado a linha correta até que corrijam:
    // const viewOnce = isViewOnce(webMessage); 
    const viewOnce = false;
    
    let mediaFile = null;
    let messageContent = {};
    
    try {
      const hasMedia = isImage || isVideo || isAudio || isSticker;
      
      if (hasMedia) {
        const mediaMsg = getMediaMsg(webMessage);
        const mediaType = isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : 'sticker';
        mediaFile = await downloadMedia(mediaMsg, `tagall-${mediaType}-${Date.now()}`);
      }
      
      if (isImage) {
        messageContent = {
          image: fs.readFileSync(mediaFile),
          caption: caption || text,
          viewOnce,
          mentions
        };
      } else if (isVideo) {
        messageContent = {
          video: fs.readFileSync(mediaFile),
          caption: caption || text,
          viewOnce,
          mentions
        };
      } else if (isAudio) {
        messageContent = {
          audio: fs.readFileSync(mediaFile),
          mimetype: "audio/ogg; codecs=opus",
          ptt: true,
          viewOnce,
          mentions
        };
      } else if (isSticker) {
        messageContent = {
          sticker: fs.readFileSync(mediaFile),
          mentions
        };
      } else {
        messageContent = {
          text,
          mentions
        };
      }
      
      await socket.sendMessage(remoteJid, messageContent, { quoted: webMessage });
      await sendReact("📢");
      
    } finally {
      if (mediaFile) {
        deleteFilesSync(mediaFile);
      }
    }
  }
};