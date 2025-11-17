const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const { 
  savedFilesDir,
  enableAntiSpam,
  autoLikeStatusEmoji,
  saveStatusByReply,
  saveStatusByLike,
  arrangeByNumber,
  rejectGroupCalls,
  rejectVideoCall,
  rejectVoiceCall,
  rejectPrivateCall,
  rejectSpecificPrivateCalls,
  ownNumber,
  debug,
} = require(`${BASE_DIR}/config`);
const { createHelpers } = require("./commonFunctions");
const { bxssdxrkLog, onlyNumbers, toUserJid, isJid, isLid } = require(".");
const createStore = require("./store");

// ============================================================================
// STORE & CACHE
// ============================================================================
const store = createStore();

// ============================================================================
// CONSTANTES E CONFIGURAÇÕES
// ============================================================================
const MEDIA_TYPES = [
  'imageMessage', 
  'videoMessage', 
  'audioMessage', 
  'stickerMessage',
  'documentMessage'
];

const SPAM_TRIGGERS = [".bugde_gp", ".bug_degp", "!bug_degp", "!bugde_gp", "🤹🏻‍♂️"];

const MEDIA_EXTENSIONS = {
  imageMessage: "jpg",
  videoMessage: "mp4",
  audioMessage: "mp3",
  stickerMessage: "webp",
  documentMessage: "bin"
};

const SUBFOLDER_ALIASES = {
  "Visualização Única": "viewOnce",
  "Status": "status"
};

/**
 * Converte JID para LID usando socket
 */
async function toUserLid(socket, jid) {
  if (!jid || !socket) return null;
  
  try {
    return (await socket.getLidUser(jid))[0].lid;
  } catch (err) {
    if (debug) {
      bxssdxrkLog(`Erro ao converter JID para LID: ${err.message}`, "toUserLid", "error");
    }
    return null;
  }
}

async function getBestIdentifier(socket, participantAlt, participant) {
  // Prioridade 1: participantAlt se for LID
  if (isLid(participantAlt)) {
    return participantAlt;
  }
  
  // Prioridade 2: participant se for LID
  if (isLid(participant)) {
    return participant;
  }
  
  // Prioridade 3: Converter participantAlt (JID) para LID
  if (isJid(participantAlt)) {
    const lid = await toUserLid(socket, participantAlt);
    if (lid) return lid;
  }
  
  // Prioridade 4: Converter participant (JID) para LID
  if (isJid(participant)) {
    const lid = await toUserLid(socket, participant);
    if (lid) return lid;
  }
  
  // Fallback: Retorna o que estiver disponível
  return participantAlt || participant || null;
}

/**
 * Extrai o melhor identificador de um objeto key ou contextInfo
 */
async function extractBestId(socket, obj) {
  if (!obj) return null;
  
  const participantAlt = obj.participantAlt;
  const participant = obj.participant;
  
  return await getBestIdentifier(socket, participantAlt, participant);
}

// ============================================================================
// UTILITÁRIOS GERAIS
// ============================================================================

/**
 * Garante que um diretório existe
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Sanitiza um JID/LID para obter apenas o número
 */
function sanitizeJid(jid) {
  if (!jid) return "";
  if (jid.endsWith("@g.us")) return jid;
  return onlyNumbers(jid);
}

/**
 * Divide vídeo em segmentos
 */
async function splitVideo(input, secondsPerSegment) {
  let inputPath;
  try {
    if (Buffer.isBuffer(input)) {
      inputPath = path.join(savedFilesDir, `tmp-${getTimestamp()}.mp4`);
      await fsp.writeFile(inputPath, input);
    } else if (typeof input === "string") {
      inputPath = input;
    } else {
      throw new Error("Input deve ser um path ou Buffer.");
    }
    
    if (debug) bxssdxrkLog(`Obtendo duração do vídeo...`, "splitVideo", "DEBUG");
    
    const duration = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration);
      });
    });
    
    if (debug) bxssdxrkLog(`Duração obtida: ${duration}`, "splitVideo", "DEBUG");

    const splitDir = path.join(savedFilesDir, "videoSplit", `split-${getTimestamp()}`);
    await fsp.mkdir(splitDir, { recursive: true });

    const totalSegments = Math.ceil(duration / secondsPerSegment);

    bxssdxrkLog(`Pra dividir em partes de ${secondsPerSegment} segundos, vai precisar de ${totalSegments} segmentos. Começando agora...`, "splitVideo", "info");

    for (let i = 0; i < totalSegments; i++) {
      const startTime = i * secondsPerSegment;
      const endTime = Math.min((i + 1) * secondsPerSegment, duration);
      const outputFile = path.join(splitDir, `part-${String(i + 1).padStart(3, '0')}.mp4`);

      if (debug) bxssdxrkLog(`Processando segmento ${i + 1}/${totalSegments}...`, "splitVideo", "info");

      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .seekInput(startTime)
          .duration(endTime - startTime)
          .outputOptions([
            "-c:v libx264",
            "-c:a aac",
            "-avoid_negative_ts make_zero",
            "-fflags +genpts"
          ])
          .output(outputFile)
          .on("end", () => resolve())
          .on("error", reject)
          .run();
      });
    }

    if (Buffer.isBuffer(input)) {
      await fsp.unlink(inputPath);
    }

    bxssdxrkLog(`Vídeo dividido com sucesso em ${totalSegments} segmentos em ${splitDir}`, "splitVideo", "success");
    return splitDir;

  } catch (err) {
    bxssdxrkLog(`Erro ao dividir vídeo: ${err.message}`, "splitVideo", "error");
    throw err;
  }
}

/**
 * Gera um timestamp formatado
 */
function getTimestamp() {
  const now = new Date();
  const dia = String(now.getDate()).padStart(2, "0");
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  const ano = String(now.getFullYear());
  const hora = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const seg = String(now.getSeconds()).padStart(2, "0");

  return `${dia}-${mes}-${ano}_${hora}-${min}-${seg}`;
}

/**
 * Normaliza o nome da subpasta
 */
function normalizeSubfolder(subfolder) {
  return SUBFOLDER_ALIASES[subfolder] || subfolder;
}

/**
 * Determina a extensão do arquivo baseado no tipo de mídia
 */
function getFileExtension(mediaMsg, downloadedPath) {
  const fileExtension = path.extname(downloadedPath) || '';
  let finalExtension = fileExtension.toLowerCase().replace('.', '');

  if (!finalExtension) {
    const mediaType = Object.keys(mediaMsg)[0];
    
    if (mediaType === 'documentMessage' && mediaMsg.documentMessage.fileName) {
      finalExtension = mediaMsg.documentMessage.fileName.split(".").pop() || 'bin';
    } else {
      finalExtension = MEDIA_EXTENSIONS[mediaType] || "bin";
    }
  }

  return finalExtension;
}

/**
 * Extrai informações básicas da mensagem web (sem socket)
 */
function extractMessageInfo(webMessage) {
  const key = webMessage?.key;
  const msg = webMessage?.message;
  const fromMe = key?.fromMe;
  const remoteJid = key?.remoteJid || key?.remoteJidAlt;
  
  // Não resolve LID aqui - apenas extrai os valores brutos
  const participantAlt = key?.participantAlt || webMessage?.participantAlt;
  const participant = key?.participant || webMessage?.participant;
  
  return { 
    key, 
    msg, 
    fromMe, 
    remoteJid, 
    participantAlt,
    participant
  };
}

/**
 * Extrai informações completas com melhor identificador (requer socket)
 */
async function extractMessageInfoWithLid(webMessage, socket) {
  const basic = extractMessageInfo(webMessage);
  const bestId = await getBestIdentifier(socket, basic.participantAlt, basic.participant);
  
  return {
    ...basic,
    userId: bestId || basic.participant || basic.remoteJid
  };
}

/**
 * Verifica se uma mensagem é um status
 */
function isStatusMessage(webMessage) {
  const { msg, remoteJid } = extractMessageInfo(webMessage);
  const contextInfo = Object.values(msg || {}).find(v => v?.contextInfo)?.contextInfo;
  
  return msg?.broadcast || 
         remoteJid === "status@broadcast" || 
         contextInfo?.remoteJid === "status@broadcast";
}

/**
 * Extrai o contextInfo de uma mensagem
 */
function getContextInfo(msg) {
  if (!msg) return null;
  
  const msgType = Object.keys(msg)[0];
  return msg[msgType]?.contextInfo || msg?.extendedTextMessage?.contextInfo;
}

// ============================================================================
// MANIPULAÇÃO DE MÍDIA
// ============================================================================

/**
 * Salva mídia no diretório configurado
 */
async function saveMedia(mediaMsg, senderJid, subfolder, type, socket, webMessage) {
  try {
    const bxssdxrk = createHelpers({ socket, webMessage });
    const downloadedPath = await bxssdxrk.downloadMedia(mediaMsg, `${type}-${Date.now()}`);
    
    if (!downloadedPath) {
      bxssdxrkLog("Não foi possível baixar o arquivo.", type, "error");
      return false;
    }

    const normalizedSubfolder = normalizeSubfolder(subfolder);
    const baseDir = arrangeByNumber 
      ? path.join(savedFilesDir, sanitizeJid(senderJid), normalizedSubfolder)
      : path.join(savedFilesDir, normalizedSubfolder);
      
    ensureDir(baseDir);
    
    const finalExtension = getFileExtension(mediaMsg, downloadedPath);
    const fileName = `${getTimestamp()}.${finalExtension}`;
    const destinationPath = path.join(baseDir, fileName);
    
    await fsp.rename(downloadedPath, destinationPath);
    
    if (debug) {
      const relativePath = path.relative("/storage/emulated/0/Download", destinationPath);
      bxssdxrkLog(`Download/${relativePath}`, type, "success");
    }
    
    bxssdxrkLog(`Salvo com sucesso!`, type, "success");
    return true;
  } catch (err) {
    console.error(err);
    bxssdxrkLog(`Erro ao salvar ${subfolder}: ${err.message}`, type, "error");
    return false;
  }
}

/**
 * Encontra mídia em uma mensagem
 */
function findMediaInMessage(message) {
  if (!message) return null;
  
  for (const type of MEDIA_TYPES) {
    const media = message[type];
    if (media && typeof media === "object" && media?.mimetype) {
      return { [type]: media };
    }
  }
  
  return null;
}

/**
 * Verifica se uma mídia é view once
 */
function isViewOnceMedia(media) {
  if (!media) return false;
  return media.viewOnce === true || media.viewOnceV2 === true;
}

// ============================================================================
// STORE
// ============================================================================

/**
 * Salva mensagem no store
 */
const saveInStore = (webMessage) => {
  const remoteJid = webMessage.key?.remoteJid;
  store.saveMessage(remoteJid, webMessage);
  store.saveStatus(remoteJid, webMessage);
};

// ============================================================================
// HANDLER: VIEW ONCE
// ============================================================================

/**
 * Salva mensagens de visualização única
 */
const saveViewOnce = async (webMessage, socket) => {
  const { fromMe, msg } = extractMessageInfo(webMessage);
  
  if (!fromMe || !msg) return;
  
  const contextInfo = getContextInfo(msg);
  if (!contextInfo) return;
  
  // Obtém o melhor identificador (LID prioritário)
  const targetJid = await extractBestId(socket, contextInfo);
  const quoted = contextInfo.quotedMessage;
  
  if (!quoted || !targetJid) return;
  
  // Procura por mídia view once
  for (const type of MEDIA_TYPES) {
    const media = quoted[type];
    if (media && isViewOnceMedia(media)) {
      const mediaMsg = { [type]: media };
      await saveMedia(mediaMsg, targetJid, "Visualização Única", "viewOnce", socket, webMessage);
      return;
    }
  }
};

// ============================================================================
// HANDLER: AUTO LIKE STATUS
// ============================================================================

let autoLiked = false;

/**
 * Curte status automaticamente
 */
const autoLikeStatus = async (webMessage, socket) => {
  const { key, fromMe, remoteJid } = extractMessageInfo(webMessage);
  
  if (!key || fromMe || !isStatusMessage(webMessage)) return;
  
  const emoji = autoLikeStatusEmoji;
  const ownJid = toUserJid(ownNumber);
  
  if (!emoji || !ownJid) return;
  
  const isReaction = Boolean(webMessage?.message?.reactionMessage);
  if (isReaction) return;
  
  // Obtém o melhor identificador do usuário (LID prioritário)
  const userJid = await extractMessageInfoWithLid(webMessage, socket);
  
  if (!userJid.userId) return;
  
  autoLiked = true;
  
  try {
    await socket.sendMessage(remoteJid, {
      react: { 
        key, 
        text: emoji,
        senderTimestampMs: Date.now()
      },
    }, {
      statusJidList: [userJid.userId, ownJid],
    });
  } catch (err) {
    bxssdxrkLog(`Erro ao curtir status: ${err.message}`, "autoLikeStatus", "error");
  }
};

// ============================================================================
// HANDLER: SAVE STATUS
// ============================================================================

const statusConfirmationMap = new Map();

/**
 * Gerencia confirmação dupla de reação
 */
function handleReactionConfirmation(reactionMessage) {
  const statusIdentifier = `reaction_${reactionMessage?.key?.id}_${reactionMessage?.key?.participant}`;
  const now = Date.now();
  const previousAttempt = statusConfirmationMap.get(statusIdentifier);
  
  if (previousAttempt) {
    const timeDiff = now - previousAttempt.timestamp;
    
    if (timeDiff <= 5000) {
      statusConfirmationMap.delete(statusIdentifier);
      return { confirmed: true };
    } else {
      // Expirou, remover entrada antiga
      statusConfirmationMap.delete(statusIdentifier);
    }
  }
  
  // Primeira tentativa ou expirou
  statusConfirmationMap.set(statusIdentifier, { timestamp: now });
  
  // Agendar limpeza automática
  setTimeout(() => {
    statusConfirmationMap.delete(statusIdentifier);
  }, 5000);
  
  return { confirmed: false };
}

/**
 * Salva status curtido
 */
async function saveStatusByReaction(reactionMessage, socket, webMessage) {
  // Obtém o melhor identificador (LID prioritário)
  const targetJid = await extractBestId(socket, reactionMessage?.key);
  const statusID = reactionMessage?.key?.id;
  
  if (!targetJid || !statusID) return;
  
  try {
    const originalStatus = await store.getStatus(targetJid, statusID);
    
    if (!originalStatus?.message) {
      bxssdxrkLog("O status não está disponível no store.", "status", "error");
      bxssdxrkLog("Talvez tenha recebido enquanto o script estava desligado.", "status", "error");
      return;
    }
    
    const mediaMsg = findMediaInMessage(originalStatus.message);
    if (!mediaMsg) return;
    
    await saveMedia(mediaMsg, targetJid, "Status", "status", socket, webMessage);
  } catch (err) {
    bxssdxrkLog(`Erro ao salvar status curtido: ${err.message}`, "saveStatus", "error");
    if (debug) {
      console.log(err);
    }
  }
}

/**
 * Salva status por resposta
 */
async function saveStatusByReplyMessage(contextInfo, userId, socket, webMessage) {
  const quoted = contextInfo?.quotedMessage;
  
  // Obtém o melhor identificador (LID prioritário)
  const targetJid = await extractBestId(socket, contextInfo) || userId;

  if (!quoted || !targetJid) return;

  const mediaMsg = findMediaInMessage(quoted);
  if (!mediaMsg) return;
  
  await saveMedia(mediaMsg, targetJid, "Status", "status", socket, webMessage);
}

/**
 * Salva status (por curtida ou resposta)
 */
const saveStatus = async (webMessage, socket) => {
  const { fromMe, msg } = extractMessageInfo(webMessage);
  
  if (!fromMe || !msg) return;
  
  const isStatus = isStatusMessage(webMessage);
  if (!isStatus) return;
  
  // Ignora se foi auto-curtida
  if (autoLiked) {
    autoLiked = false;
    return;
  }
  
  const contextInfo = getContextInfo(msg);
  const isReaction = msg?.reactionMessage?.text;
  
  // Salva por reação (com confirmação dupla)
  if (isReaction && saveStatusByLike) {
    const { confirmed } = handleReactionConfirmation(msg.reactionMessage);
    
    if (confirmed) {
      await saveStatusByReaction(msg.reactionMessage, socket, webMessage);
    }
    
    return;
  }

  // Salva por resposta (sem confirmação dupla)
  if (!isReaction && saveStatusByReply && contextInfo) {
    const userInfo = await extractMessageInfoWithLid(webMessage, socket);
    await saveStatusByReplyMessage(contextInfo, userInfo.userId, socket, webMessage);
  }
};

// ============================================================================
// HANDLER: ANTI-SPAM
// ============================================================================

/**
 * Detecta e bloqueia spam
 */
const antiSpam = async (webMessage, socket) => {
  const { fromMe, remoteJid } = extractMessageInfo(webMessage);
  const msg = webMessage?.message;
  
  const legitPlatforms = ['android', 'ios', 'web', 'desktop'];
  const textReceived = msg?.conversation || msg?.extendedTextMessage?.text;
  
  // Detecção de spam
  const isRequestPaymentInvalid =
    msg?.requestPaymentMessage &&
    !legitPlatforms.includes(webMessage.platform) &&
    !fromMe;
  
  const isMentionedJidSpam =
    Array.isArray(msg?.viewOnceMessageV2?.message?.listResponseMessage?.contextInfo?.mentionedJid) &&
    msg.viewOnceMessageV2.message.listResponseMessage.contextInfo.mentionedJid.length > 1000 &&
    !fromMe;
  
  const hasSpamTrigger = SPAM_TRIGGERS.includes(textReceived);
  
  const isLocationSpam =
    typeof msg?.locationMessage?.url === 'string' &&
    msg.locationMessage.url.length > 750 &&
    !fromMe;
  
  const isSpam = isRequestPaymentInvalid || isMentionedJidSpam || isLocationSpam || hasSpamTrigger;
  
  if (!isSpam) return false;
  
  if (!enableAntiSpam) return true;
  
  try {
    // Obtém o melhor identificador (LID prioritário)
    const userInfo = await extractMessageInfoWithLid(webMessage, socket);
    const actualParticipant = userInfo.userId || remoteJid;
    
    if (remoteJid.endsWith('@g.us')) {
      await socket.groupSettingUpdate(remoteJid, 'announcement');
      await socket.sendMessage(remoteJid, { delete: webMessage.key });
      await socket.groupParticipantsUpdate(remoteJid, [actualParticipant], 'remove');
      
      bxssdxrkLog(`Usuário ${actualParticipant} banido do grupo por spam.`, "antiSpam", "success");
      
      await socket.sendMessage(remoteJid, {
        text: `🚨 Possível spam detectado! 🚨\n\n*Grupo fechado!*\n\n✅ Banimento automático de @${onlyNumbers(actualParticipant)}!\n`,
        mentions: [actualParticipant]
      });
    } else {
      await socket.updateBlockStatus(remoteJid, 'block');
      await socket.chatModify(
        { clear: { message: { id: webMessage.key.id, fromMe: false } } },
        remoteJid
      );
      
      bxssdxrkLog(`Usuário ${remoteJid} bloqueado por spam.`, "antiSpam", "success");
    }
  } catch (error) {
    bxssdxrkLog(`Erro ao lidar com spam: ${error.message}`, "antiSpam", "error");
  }
  
  return true;
};

// ============================================================================
// HANDLER: REJECT CALL
// ============================================================================

/**
 * Rejeita chamadas com base nas configurações
 */
const rejectCall = async (socket, call) => {
  const { from, id, isGroup, status, isVideo } = call;
  const fromNumber = onlyNumbers(from);
  const rejectSpecificPrivate = rejectSpecificPrivateCalls.includes(fromNumber);

  const isVideoCall = !!isVideo;
  const isVoiceCall = !isVideoCall;

  const shouldRejectCallType =
    (isVideoCall && rejectVideoCall) ||
    (isVoiceCall && rejectVoiceCall);
    
  const shouldReject =
    (isGroup && rejectGroupCalls) ||
    (!isGroup && (rejectPrivateCall || rejectSpecificPrivate));
    
  if ((status === "offer" || status === "ringing") && (shouldReject || shouldRejectCallType)) {
    try {
      await socket.rejectCall(id, from);
      bxssdxrkLog(`Chamada de ${isVideoCall ? "vídeo" : "voz"} de ${fromNumber} rejeitada.`, "rejectCall", "success");
    } catch (err) {
      bxssdxrkLog(`Erro ao rejeitar chamada de ${fromNumber}: ${err.message}`, "rejectCall", "error");
    }
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Store
  saveInStore,
  
  // Handlers
  saveViewOnce,
  saveStatus,
  autoLikeStatus,
  antiSpam,
  rejectCall,
  splitVideo,
  
  // Utilitários (caso precise usar em outros módulos)
  extractMessageInfo,
  extractMessageInfoWithLid,
  isStatusMessage,
  findMediaInMessage,
  getBestIdentifier,
  isLid,
  isJid,
  toUserLid,
};