const { prefix } = require(`${BASE_DIR}/config`);
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
    socket,
    webMessage,
    args,
    sendWaitReact,
    sendReact,
    isImage,
    isVideo,
    isAudio,
    isSticker,
    isViewOnce,
    downloadMedia,
    getMediaMsg,
    deleteFilesSync
  }) => {
    await sendWaitReact();
    
    const groupMetadata = await hasGroupMetadata(remoteJid) 
      ? await getGroupMetadata(remoteJid) 
      : await socket.groupMetadata(remoteJid);
    
    const mentions = groupMetadata.participants.map(participant => participant.id);
    
    const contextInfo = webMessage?.message?.extendedTextMessage?.contextInfo;
    const quotedMessage = contextInfo?.quotedMessage;
    
    const getTextContent = () => {
      const quotedText = quotedMessage?.conversation || quotedMessage?.extendedTextMessage?.text;
      const argsText = args.join(" ");
      let text = quotedText || argsText;
      
      return text.startsWith(prefix) ? text.slice(prefix.length) : text;
    };
    
    const text = getTextContent();
    
    const getCaption = () => {
      const imageCaption = quotedMessage?.imageMessage?.caption;
      const videoCaption = quotedMessage?.videoMessage?.caption;
      const caption = imageCaption || videoCaption;
      
      return caption?.startsWith(prefix) ? caption.slice(prefix.length) : caption;
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
      if (isImage) {
        const mediaMsg = getMediaMsg(webMessage);
        mediaFile = await downloadMedia(mediaMsg, `tagall-image-${Date.now()}`);
        
        messageContent = {
          image: fs.readFileSync(mediaFile),
          caption: caption || text,
          viewOnce,
          mentions
        };
      } else if (isVideo) {
        const mediaMsg = getMediaMsg(webMessage);
        mediaFile = await downloadMedia(mediaMsg, `tagall-video-${Date.now()}`);
        
        messageContent = {
          video: fs.readFileSync(mediaFile),
          caption: caption || text,
          viewOnce,
          mentions
        };
      } else if (isAudio) {
        const mediaMsg = getMediaMsg(webMessage);
        mediaFile = await downloadMedia(mediaMsg, `tagall-audio-${Date.now()}`);
        
        messageContent = {
          audio: fs.readFileSync(mediaFile),
          mimetype: "audio/ogg; codecs=opus",
          ptt: true,
          viewOnce,
          mentions
        };
      } else if (isSticker) {
        const mediaMsg = getMediaMsg(webMessage);
        mediaFile = await downloadMedia(mediaMsg, `tagall-sticker-${Date.now()}`);
        
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