const { getContentType, getDevice, downloadContentFromMessage } = require("@itsukichan/baileys");

const { onlyNumbers, toUserJid, extractDataFromMessage } = require(".");
const { commandPrefixes } = require(`${BASE_DIR}/config`);
const fs = require("fs");
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

  const getMessageType = (msg) => {
    return getContentType(msg?.message);
  };

  const getQuotedMessage = (msg) => {
    if (!msg || typeof msg !== "object") {
      return null;
    }
    const messageContent = Object.values(msg.message || {})[0];
    return messageContent?.contextInfo?.quotedMessage || null;
  };

  const isViewOnce = (msg) => {
    const messages = [];
    if (msg?.message) messages.push(msg.message);
    const quotedMsg = getQuotedMessage(msg);
    if (quotedMsg) messages.push(quotedMsg);

    return messages.some(msgObj => {
      const msgTypeKey = Object.keys(msgObj || {})[0];
      return msgObj?.[msgTypeKey]?.viewOnce === true;
    });
  };

  const downloadMedia = async (mediaMsg) => {
    const type = Object.keys(mediaMsg)[0];
    const stream = await downloadContentFromMessage(mediaMsg[type], type.replace("Message", ""));
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
  };

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

  const cleanType = (rawType) => {
    if (typeof rawType !== "string") {
      return "";
    }
    return rawType.replace(/Message$/, "");
  };

  const isType = (type) => {
    const mainType = cleanType(getMessageType(webMessage));
    const quotedMsg = getQuotedMessage(webMessage);
    const quotedType = cleanType(getMessageType({ message: quotedMsg }));
    return mainType === type || quotedType === type;
  };

  const isImage = isType("image");
  const isVideo = isType("video");
  const isSticker = isType("sticker");
  const isAudio = isType("audio");
  const isDocument = isType("document");

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

  const downloadMediaFromMessage = async () => {
    const quotedMsg = getQuotedMessage(webMessage);
    const targetMsg = quotedMsg || webMessage.message;
    if (!targetMsg) return null;
    return await downloadMedia(targetMsg);
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
    getMessageType,
    isType,
    isViewOnce,
    isImage,
    isVideo,
    isSticker,
    isAudio,
    isDocument,
    sendSuccessReact,
    sendWaitReact,
    sendWarningReact,
    sendErrorReact,
    sendReply,
    sendSuccessReply,
    sendWaitReply,
    sendWarningReply,
    sendErrorReply,
    sendImageFromFile,
    sendImageFromURL,
    sendVideoFromFile,
    sendVideoFromURL,
    sendStickerFromFile,
    sendStickerFromURL,
    sendAudioFromFile,
    sendAudioFromURL,
    sendDocumentFromFile,
    sendDocumentFromURL,
    sendTextWithButtons,
    sendImageFromFileWithButtons,
    sendImageFromURLWithButtons,
    sendVideoFromFileWithButtons,
    sendVideoFromURLWithButtons,
    sendDocumentFromFileWithButtons,
    sendDocumentFromURLWithButtons,
    sendAudioFromFileWithButtons,
    sendAudioFromURLWithButtons,
    sendStickerFromFileWithButtons,
    sendStickerFromURLWithButtons,
    getQuotedMessage,
    downloadMedia,
    getBuffer,
    downloadMediaFromMessage,
    sendReact,
    onlyNumbers,
    toUserJid
  };
};