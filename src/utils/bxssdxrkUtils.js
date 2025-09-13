/*
 * bxssdxrkUtils
 * =============================
 * Coleção de funções utilitárias feitas com muito ó̶d̶i̶o̶ amor por bxssdxrk. :3
 * Voltadas para uso pessoal em projetos com a biblioteca Baileys.
 *
 * 🧠 PROPÓSITO:
 * Este código foi criado com o objetivo de aprendizado e prática pessoal.
 * A intenção principal é educativa — estudar programação, explorar a API do Baileys,
 * testar ideias e compartilhar conhecimento de forma aberta e livre.
 *
 * ⚠️ AVISO LEGAL:
 * Este código é fornecido gratuitamente, sem qualquer garantia.
 * São ferramentas experimentais, feitas por iniciativa própria,
 * sem nenhum tipo de vínculo, afiliação ou apoio da Meta Platforms Inc.,
 * WhatsApp ou dos desenvolvedores da biblioteca Baileys.
 *
 * ❗ O uso deste código é de inteira responsabilidade do usuário.
 * Não me responsabilizo por qualquer consequência gerada por seu uso
 * (banimentos, perdas, danos, etc.).
 *
 * ✅ LIBERADO GERAL:
 * Pode copiar, modificar, adaptar e compartilhar à vontade.
 * O único requisito é: **NÃO VENDA!**
 * Este código foi feito para ser totalmente gratuito e deve continuar assim.
 * Se alguém usar essas funções pra vender ou ganhar dinheiro, está
 * automaticamente desrespeitando a proposta e será considerado um tremendo bobão.
 *
 * 🤍 SE FOR USAR:
 * Se você der os créditos pra mim, bxssdxrk, eu vou ficar muito felizinho :3
 * E se modificar ou adaptar algo, me diga ou me mostre o que fez!
 * Vou adorar ver até onde essas ideias podem chegar nas mãos de outras pessoas.
 *
 * 🚨 IMPORTANTE:
 * Se você pagou por isso, sinto muito... você foi enganado.
 * Essa coleção de funções é e sempre será gratuita. Denuncie quem comercializa
 * algo que nunca teve preço. Não alimente esse tipo de comportamento.
 *
 * 🛠️ Use com consciência e ética.
 *
 * Autor: bxssdxrk
 * GitHub: https://github.com/bxssdxrk
 * Data de criação: 21/07/2025
 * 
 */

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const { downloadContentFromMessage } = require("@itsukichan/baileys");
const { writeFile } = require("fs/promises");
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
  timeoutByEvent,
} = require(`${BASE_DIR}/config`);
const { 
  groupCache,
  setGroupMetadata,
  getGroupMetadata,
  hasGroupMetadata,
  delGroupMetadata,
  flushGroupCache,
  isGroupCacheEmpty
} = require("./groupCache");
const { createHelpers } = require("./commonFunctions");
const { bxssdxrkLog, onlyNumbers } = require(".");

const createStore = require("./store");
const store = createStore();

let autoLiked = false;
let eventsRegistered = false;
  
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function sanitizeJid(jid) {
  if (jid.endsWith("@g.us")) return jid;
  const number = onlyNumbers(jid);
  return number;
}

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

const saveInStore = (webMessage) => {
  const remoteJid = webMessage.key?.remoteJid;
  store.saveMessage(remoteJid, webMessage);
  store.saveStatus(remoteJid, webMessage);
};

async function saveMedia(mediaMsg, senderJid, subfolder, type, socket, webMessage) {
  try {
    const bxssdxrk = createHelpers({ socket, webMessage });
    const downloadedPath = await bxssdxrk.downloadMedia(mediaMsg, `${type}-${Date.now()}`);
    
    if (!downloadedPath) {
      bxssdxrkLog("Não foi possível baixar o arquivo.", type, "error");
      return;
    }

    if (subfolder === "Visualização Única") subfolder = "viewOnce";
    if (subfolder === "Status") subfolder = "status";
    
    const baseDir = arrangeByNumber 
      ? path.join(savedFilesDir, sanitizeJid(senderJid), subfolder)
      : path.join(savedFilesDir, subfolder);
      
    ensureDir(baseDir);
    
    const fileExtension = path.extname(downloadedPath) || '';
    let finalExtension = fileExtension.toLowerCase().replace('.', '');

    if (!finalExtension) {
      finalExtension = mediaMsg?.imageMessage
        ? "jpg"
        : mediaMsg?.videoMessage
        ? "mp4"
        : mediaMsg?.audioMessage
        ? "mp3"
        : mediaMsg?.documentMessage
        ? (mediaMsg.documentMessage.fileName?.split(".").pop() || 'bin')
        : mediaMsg?.stickerMessage
        ? "webp"
        : "bin";
    }

    const fileName = `${getTimestamp()}.${finalExtension}`;
    const destinationPath = path.join(baseDir, fileName);
    
    await fsp.rename(downloadedPath, destinationPath);
    const relativePath = path.relative("/storage/emulated/0/Download", destinationPath);

    bxssdxrkLog(`Salvo com sucesso!`, type, "success");
    bxssdxrkLog(`Download/${relativePath}`, type, "success");
  } catch (err) {
    console.log(err);
    bxssdxrkLog(`Erro ao salvar ${subfolder}: ${err.message}`, type, "error");
  }
}


const saveViewOnce = async (webMessage, socket) => {
  if (!webMessage?.key?.fromMe || !webMessage?.message) return;
  
  const key = webMessage.key;
  const msg = webMessage.message;
  
  const msgType = Object.keys(msg)[0];
  
  const contextInfo = 
    msg[msgType]?.contextInfo ||
    msg?.extendedTextMessage?.contextInfo;
  
  if (!contextInfo) return;
  
  const isStatus = key.remoteJid === "status@broadcast" || contextInfo.remoteJid === "status@broadcast";
  
  const targetJid = contextInfo.participant;
  const quoted = contextInfo.quotedMessage;
  if (!quoted) return;
  
  const mediaTypes = [
    'imageMessage', 
    'videoMessage', 
    'audioMessage', 
    'stickerMessage',
    'documentMessage'
  ];
  
  for (const type of mediaTypes) {
    const media = quoted[type];
    if (media && (media?.viewOnce === true || media?.viewOnceV2 === true)) {
      const mediaMsg = { [type]: media };
      return await saveMedia(mediaMsg, targetJid, "Visualização Única", "viewOnce", socket, webMessage);
    }
  }
};

const saveStatus = async (webMessage, socket) => {
  const key = webMessage?.key;
  const msg = webMessage?.message;
  
  const { fromMe, remoteJid } = key;
  if (!fromMe || !msg) return;
  const contextInfo = Object.values(msg).find(v => v?.contextInfo)?.contextInfo;
  const userJid = key.participant || webMessage?.participant || remoteJid;
  const isStatus = msg?.broadcast || remoteJid === "status@broadcast" || contextInfo?.remoteJid === "status@broadcast";
  const isReaction = msg?.reactionMessage?.text;
  
  if (!isStatus) return;
  
  if (autoLiked) {
    autoLiked = false;
    return;
  }
  
  try {
  if (isReaction && saveStatusByLike) {
    const reactionMessage = msg.reactionMessage;
    const targetJid = reactionMessage?.key?.participant;
    const statusID = reactionMessage?.key?.id;
    
    try {
      const originalStatus = await store.getStatus(targetJid, statusID);
      if (!originalStatus) {
        bxssdxrkLog("O status não está disponível no store.", "status", "error");
        bxssdxrkLog("Talvez tenha recebido enquanto o script", "status", "error");
        bxssdxrkLog("estava desligado no seu dispositivo.", "status", "error");
        return;
      }
      
      if (!originalStatus?.message) return;
      
      const originalMsg = originalStatus.message;
      const mediaType = Object.keys(originalMsg).find(k => originalMsg[k]?.mimetype);
      
      if (!mediaType) return;
      
      const mediaMsg = { [mediaType]: originalMsg[mediaType] };
      
      await saveMedia(mediaMsg, targetJid, "Status", "status", socket, webMessage);
    } catch (err) {
      bxssdxrkLog(`Erro ao salvar status curtido: ${err.message}`, "saveStatus", "error");
    }
  }
  } catch (err) {
    bxssdxrkLog(`Erro desconhecido: ${err}`, "saveStatus", "error");
  }

  if (!isReaction && saveStatusByReply) {
    const quoted = contextInfo?.quotedMessage;
    const targetJid = contextInfo?.participant || userJid;

    if (!quoted || !targetJid) return;

    const mediaKeys = Object.keys(quoted);
    for (const type of mediaKeys) {
      const media = quoted[type];
      if (typeof media === "object" && media?.mimetype) {
        const mediaMsg = { [type]: media };
        return await saveMedia(mediaMsg, targetJid, "Status", "status", socket, webMessage);
      }
    }
  }
}

const antiSpam = async (webMessage, socket) => {
  const fromMe = webMessage.key?.fromMe;
  const legitPlatforms = ['android', 'ios', 'web', 'desktop'];
  
  const textReceived = webMessage?.message?.conversation || webMessage.message?.extendedTextMessage?.text;
  
  const isRequestPaymentInvalid =
    webMessage.message?.requestPaymentMessage &&
    !legitPlatforms.includes(webMessage.platform) &&
    !fromMe;
  
  const isMentionedJidSpam =
    Array.isArray(
      webMessage.message?.viewOnceMessageV2?.message?.listResponseMessage?.contextInfo?.mentionedJid
    ) &&
    webMessage.message.viewOnceMessageV2.message.listResponseMessage.contextInfo.mentionedJid.length > 1000 &&
    !fromMe;
  
  const spamTriggers = [".bugde_gp", ".bug_degp", "!bug_degp", "!bugde_gp", "🤹🏻‍♂️"];
  const hasSpamTrigger = spamTriggers.includes(textReceived);
  
  const isLocationSpam =
    typeof webMessage.message?.locationMessage?.url === 'string' &&
    webMessage.message.locationMessage.url.length > 750 &&
    !fromMe;
    
  if (isRequestPaymentInvalid || isMentionedJidSpam || isLocationSpam || hasSpamTrigger) {
    const remoteJid = webMessage?.key?.remoteJid;
    const participant = webMessage?.key?.participant || remoteJid;
    if (!enableAntiSpam) return true;
    
    try {
      if (remoteJid.endsWith('@g.us')) {
        await socket.groupSettingUpdate(remoteJid, 'announcement');
        await socket.sendMessage(remoteJid, { delete: webMessage.key });
        // Mensagem em grupo → Banir participante
        await socket.groupParticipantsUpdate(remoteJid, [participant], 'remove');
        bxssdxrkLog(`Usuário ${participant} banido automaticamente do grupo ${remoteJid} por comportamento suspeito.`, "antiSpam", "success");
        await socket.sendMessage(remoteJid, {
          text: `🚨 Possível spam detectado! 🚨\n\n*Grupo fechado!*\n\n✅ Banimento automático entrou em ação banindo @${onlyNumbers(participant)}!\n\n`,
          mentions: [participant]
        });
      } else {
        // Mensagem no PV → Bloquear e limpar chat
        await socket.updateBlockStatus(remoteJid, 'block');
        await socket.chatModify(
          { clear: { message: { id: webMessage.key.id, fromMe: false } } },
          remoteJid
        );
        bxssdxrkLog(`Usuário ${remoteJid} bloqueado e chat limpo por comportamento suspeito.`, "antiSpam", "success");
      }
    } catch (error) {
      bxssdxrkLog(`Erro ao lidar com possível spam: ${error}`, "antiSpam", "success");
        
      return true; // Spam detectado
    }
    return true; // Spam detectado
  } else {
    return false; // Spam não detectado
  }
}

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
      await socket.rejectCall(id, from, []);
      bxssdxrkLog(`Chamada de ${isVideoCall ? "vídeo" : "voz"} de ${fromNumber} rejeitada.`, "rejectCall", "success");
    } catch (err) {
      bxssdxrkLog(`Erro ao rejeitar chamada de: ${fromNumber}\n${err}`, "rejectCall", "error");
    }
  }
}

const autoLikeStatus = async(webMessage, socket) => {
  const key = webMessage?.key;
  const { remoteJid, fromMe, participant } = key || {};
  const userJid = participant || webMessage?.participant || remoteJid;
  const isStatus = webMessage?.broadcast || remoteJid === "status@broadcast";
  const isReaction = Boolean(webMessage?.message?.reactionMessage);
  const ownJid = socket?.user?.id;
  const emoji = autoLikeStatusEmoji;
  
  if (!emoji || !key || !userJid || !ownJid || !isStatus || fromMe || isReaction) return;
  autoLiked = true;
  await socket.sendMessage(remoteJid, {
    react: { 
      key, 
      text: emoji,
      senderTimestampMs: Date.now() // Dá pra colocar datas do passado/futuro aqui :3
    },
  }, {
    statusJidList: [userJid, ownJid],
  });
}

module.exports = {
  antiSpam,
  saveInStore,
  saveViewOnce,
  saveStatus,
  rejectCall,
  autoLikeStatus,
};