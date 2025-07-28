const { getContentType, getDevice, downloadContentFromMessage } = require("@itsukichan/baileys");

const { onlyNumbers, toUserJid, extractDataFromMessage } = require(".");
const { commandPrefixes, tempDir } = require(`${BASE_DIR}/config`);
const fs = require("fs");
const path = require('path');
const { writeFile } = require('fs').promises;
const https = require("https");
const http = require("http");
const mime = require("mime-types");

exports.createHelpers = ({ socket, webMessage }) => {
  const {
    remoteJid, 
    prefix, 
    commandName, 
    args, 
    fullArgs,
    fullMessage,
    userJid, 
    isReply, 
    replyJid 
  } = extractDataFromMessage(webMessage, commandPrefixes);
  
  if (!remoteJid) return;
  
  const deleteFilesSync = (...files) => {
    files.forEach(file => {
      try {
        if (fs.existsSync(file) && fs.lstatSync(file).isFile()) fs.unlinkSync(file);
      } catch (error) {}
    });
  };

  const downloadMedia = async (mediaMsg, fileName) => {
    const getMediaInfo = () => {
      const mediaTypes = ['image', 'video', 'audio', 'sticker', 'document'];
      
      for (const type of mediaTypes) {
        const messageType = `${type}Message`;
        if (mediaMsg?.[messageType]) {
          return {
            type,
            content: mediaMsg[messageType]
          };
        }
      }
      return null;
    };
  
    const mediaInfo = getMediaInfo();
    if (!mediaInfo) {
      return null;
    }
  
    const getExtension = () => {
      const extensionMap = {
        image: 'png',
        sticker: 'webp',
        video: 'mp4',
        audio: 'opus'
      };
      if (mediaInfo.type === 'document') {
        const originalFilename = mediaInfo.content.fileName || '';
        const fileExtension = originalFilename.split('.').pop();
        return fileExtension || 'bin';
      }
      return extensionMap[mediaInfo.type] || mediaInfo.type;
    };
  
    const extension = getExtension();
    const stream = await downloadContentFromMessage(mediaInfo.content, mediaInfo.type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    const filePath = path.resolve(tempDir, `${fileName}.${extension}`);
    await writeFile(filePath, buffer);
    return filePath;
  };
  
  const isType = (webMessage, type) => {
    const messageType = `${type}Message`;
    if (webMessage.message?.[messageType] != null) {
      return true;
    }
    const quotedMessage = 
      webMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
      webMessage.message?.contextInfo?.quotedMessage;
    return quotedMessage?.[messageType] != null;
  };

  const isViewOnce = (webMessage) => {
    const mediaTypes = ["image", "video", "audio"];
    const quotedMessage = 
      webMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage || 
      webMessage.message?.contextInfo?.quotedMessage || 
      webMessage.message?.imageMessage?.contextInfo?.quotedMessage || 
      webMessage.message?.videoMessage?.contextInfo?.quotedMessage || 
      webMessage.message?.audioMessage?.contextInfo?.quotedMessage || 
      webMessage.message?.stickerMessage?.contextInfo?.quotedMessage || 
      webMessage.message?.documentMessage?.contextInfo?.quotedMessage;
    
    const messagesToCheck = [];
    
    if (webMessage?.message) {
      messagesToCheck.push(webMessage.message);
    }

    if (quotedMessage) {
      messagesToCheck.push(quotedMessage);
    }

    return messagesToCheck.some(msgObj => {
      for (const type of mediaTypes) {
        const messageType = `${type}Message`;
        const content = msgObj?.[messageType];
        if (content?.viewOnce === true) {
          return true;
        }
      }
      return false;
    });
  };
  
  const isImage = isType(webMessage, "image");
  const isVideo = isType(webMessage, "video");
  const isSticker = isType(webMessage,"sticker");
  const isAudio = isType(webMessage, "audio");
  const isDocument = isType(webMessage, "document");
  
  const getBuffer = async (url) => {
    const protocol = url.startsWith("https") ? https : http;
    return new Promise((resolve, reject) => {
      protocol.get(url, res => {
        const chunks = [];
        res.on("data", chunk => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      });
    });
  };
  
  const userDevice = (id) => {
    return getDevice(id);
  };

  const sendReply = async (text, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, {
      text,
      ...optionalParams
    }, { quoted: webMessage });
  };

  const sendReact = async (emoji) => {
    return await socket.sendMessage(remoteJid, {
      react: { text: emoji, key: webMessage.key },
    });
  };

  const sendSuccessReact = async () => {
    return await sendReact("✅");
  };

  const sendWaitReact = async () => {
    return await sendReact("⌛");
  };

  const sendWarningReact = async () => {
    return await sendReact("⚠️");
  };

  const sendErrorReact = async () => {
    return await sendReact("❌");
  };

  const sendSuccessReply = async (text, optionalParams = {}) => {
    await sendSuccessReact();
    return await sendReply(text, optionalParams);
  };

  const sendWaitReply = async (text, optionalParams = {}) => {
    await sendWaitReact();
    return await sendReply(text, optionalParams);
  };

  const sendWarningReply = async (text, optionalParams = {}) => {
    await sendWarningReact();
    return await sendReply(text, optionalParams);
  };

  const sendErrorReply = async (text, optionalParams = {}) => {
    await sendErrorReact();
    return await sendReply(text, optionalParams);
  };

  const formatButtons = (buttons = []) => {
    return buttons.map(btn => ({
      buttonId: btn.id,
      buttonText: { displayText: btn.text },
      type: 1
    }));
  };
  
  const sendTextWithButtons = async (text, optionalParams = {}) => {
    const msg = {
      text,
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {}),
      headerType: 1
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };

  const sendImageFromFileWithButtons = async (file, optionalParams = {}) => {
    const msg = {
      image: fs.readFileSync(file),
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {}),
      headerType: 4
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };

  const sendImageFromURLWithButtons = async (url, optionalParams = {}) => {
    const msg = {
      image: { url },
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {}),
      headerType: 4
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };

  const sendImageFromBufferWithButtons = async (buffer, optionalParams = {}) => {
    const msg = {
      image: buffer,
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {}),
      headerType: 4
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };
  
  const sendVideoFromFileWithButtons = async (file, optionalParams = {}) => {
    const msg = {
      video: fs.readFileSync(file),
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {}),
      headerType: 5
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };
  
  const sendVideoFromURLWithButtons = async (url, optionalParams = {}) => {
    const msg = {
      video: { url },
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {}),
      headerType: 5
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };
  
  const sendVideoFromBufferWithButtons = async (buffer, optionalParams = {}) => {
    const msg = {
      video: buffer,
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {}),
      headerType: 5
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };
  
  const sendDocumentFromFileWithButtons = async (file, optionalParams = {}) => {
    const msg = {
      document: fs.readFileSync(file),
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {}),
      headerType: 1
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };

  const sendDocumentFromURLWithButtons = async (url, optionalParams = {}) => {
    const msg = {
      document: { url },
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {}),
      headerType: 1
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };

  const sendDocumentFromBufferWithButtons = async (buffer, optionalParams = {}) => {
    const msg = {
      document: buffer,
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {}),
      headerType: 1
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };
  
  const sendAudioFromFileWithButtons = async (file, optionalParams = {}) => {
    const msg = {
      audio: fs.readFileSync(file),
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {})
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };

  const sendAudioFromURLWithButtons = async (url, optionalParams = {}) => {
    const msg = {
      audio: { url },
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {})
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };

  const sendAudioFromBufferWithButtons = async (buffer, optionalParams = {}) => {
    const msg = {
      audio: { url },
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {})
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };
  
  const sendStickerFromFileWithButtons = async (file, optionalParams = {}) => {
    const msg = {
      sticker: fs.readFileSync(file),
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {})
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };
  
  const sendStickerFromURLWithButtons = async (url, optionalParams = {}) => {
    const msg = {
      sticker: { url },
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {})
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };
  
  const sendStickerFromBufferWithButtons = async (buffer, optionalParams = {}) => {
    const msg = {
      sticker: buffer,
      ...optionalParams,
      ...(optionalParams.buttons ? { buttons: formatButtons(optionalParams.buttons) } : {})
    };
    return await socket.sendMessage(remoteJid, msg, { quoted: webMessage });
  };

  const sendImageFromFile = async (file, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, { 
      image: fs.readFileSync(file),
      ...optionalParams
    }, { quoted: webMessage });
  };

  const sendImageFromURL = async (url, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, {
      image: { url },
      ...optionalParams
    }, { quoted: webMessage });
  };
  
  const sendImageFromBuffer = async (buffer, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, {
      image: buffer,
      ...optionalParams
    }, { quoted: webMessage });
  };

  const sendVideoFromFile = async (file, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, { 
      video: fs.readFileSync(file),
      ...optionalParams
    }, { quoted: webMessage });
  };

  const sendVideoFromURL = async (url, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, {
      video: { url },
      ...optionalParams
    }, { quoted: webMessage });
  };
  
  const sendVideoFromBuffer = async (buffer, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, {
      video: buffer,
      ...optionalParams
    }, { quoted: webMessage });
  };

  const sendStickerFromFile = async (file, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, { 
      sticker: fs.readFileSync(file),
      ...optionalParams
    }, { quoted: webMessage });
  };

  const sendStickerFromURL = async (url, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, {
      sticker: { url },
      ...optionalParams
    }, { quoted: webMessage });
  };

  const sendStickerFromBuffer = async (buffer, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, {
      sticker: buffer,
      ...optionalParams
    }, { quoted: webMessage });
  };

  const sendAudioFromFile = async (file, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, { 
      audio: fs.readFileSync(file),
      ...optionalParams
    }, { quoted: webMessage });
  };

  const sendAudioFromURL = async (url, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, {
      audio: { url },
      ...optionalParams
    }, { quoted: webMessage });
  };

  const sendAudioFromBuffer = async (buffer, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, {
      audio: buffer,
      ...optionalParams
    }, { quoted: webMessage });
  };

  const sendDocumentFromFile = async (file, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, { 
      document: fs.readFileSync(file),
      mimetype: mime.lookup(file) || "application/octet-stream",
      fileName: optionalParams.fileName || Date.now(),
      ...optionalParams
    }, { quoted: webMessage });
  };

  const sendDocumentFromURL = async (url, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, {
      document: { url },
      mimetype: mime.lookup(url) || "application/octet-stream",
      fileName: optionalParams.fileName || Date.now(),
      ...optionalParams
    }, { quoted: webMessage });
  };
  
  const sendDocumentFromBuffer = async (buffer, optionalParams = {}) => {
    return await socket.sendMessage(remoteJid, {
      document: buffer,
      mimetype: mime.lookup(url) || "application/octet-stream",
      fileName: optionalParams.fileName || Date.now(),
      ...optionalParams
    }, { quoted: webMessage });
  };

  return {
    remoteJid, 
    prefix, 
    commandName, 
    args, 
    fullArgs,
    fullMessage,
    userJid, 
    isReply, 
    replyJid,
    webMessage,
    socket,
    userDevice,
    isViewOnce,
    isType,
    isImage,
    isVideo,
    isSticker,
    isAudio,
    isDocument,
    sendSuccessReact,
    sendWaitReact,
    sendWarningReact,
    sendErrorReact,
    sendReact,
    sendReply,
    sendSuccessReply,
    sendWaitReply,
    sendWarningReply,
    sendErrorReply,
    sendImageFromFile,
    sendImageFromURL,
    sendImageFromBuffer,
    sendVideoFromFile,
    sendVideoFromURL,
    sendVideoFromBuffer,
    sendStickerFromFile,
    sendStickerFromURL,
    sendStickerFromBuffer,
    sendAudioFromFile,
    sendAudioFromURL,
    sendAudioFromBuffer,
    sendDocumentFromFile,
    sendDocumentFromURL,
    sendDocumentFromBuffer,
    sendTextWithButtons,
    sendImageFromFileWithButtons,
    sendImageFromURLWithButtons,
    sendImageFromBufferWithButtons,
    sendVideoFromFileWithButtons,
    sendVideoFromURLWithButtons,
    sendVideoFromBufferWithButtons,
    sendDocumentFromFileWithButtons,
    sendDocumentFromURLWithButtons,
    sendDocumentFromBufferWithButtons,
    sendAudioFromFileWithButtons,
    sendAudioFromURLWithButtons,
    sendAudioFromBufferWithButtons,
    sendStickerFromFileWithButtons,
    sendStickerFromURLWithButtons,
    sendStickerFromBufferWithButtons,
    downloadMedia,
    getBuffer,
    deleteFilesSync,
    onlyNumbers,
    toUserJid,
  };
};