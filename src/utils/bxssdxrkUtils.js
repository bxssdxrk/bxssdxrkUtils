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
 * Ah, no fim do arquivo, deixei um exemplo de uso :3
 */

const fs = require("fs");
const path = require("path");
const { writeFile } = require("fs/promises");
const { config } = require("../config");
const { 
  groupCache,
  setGroupMetadata,
  getGroupMetadata,
  hasGroupMetadata,
  delGroupMetadata,
  flushGroupCache,
  isGroupCacheEmpty
} = require("./groupCache");
const createStore = require("./store");
const store = createStore();

const BASE_DIR = "/storage/emulated/0/Download/bxssdxrkUtils";
let socket = null;
let eventsRegistered = false;
  
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

const bxssdxrkLog = (message, type = "log", status = "info") => {
  const colorMap = {
    error:   "\x1b[1;31m", // vermelho (bold red)
    success: "\x1b[1;32m", // verde (bold green)
    warn:    "\x1b[1;33m", // amarelo (bold yellow)
    info:    "\x1b[1;34m", // azul (bold blue)
    debug:   "\x1b[1;35m", // magenta (bold magenta)
    trace:   "\x1b[1;36m", // ciano (bold cyan)
    neutral: "\x1b[1;37m", // branco (bold white)
  };
  const color = colorMap[status] || "\x1b[1;37m";
  const label = `${color}[bxssdxrkUtils. | ${type}]\x1b[0m`;
  console.log(`${label} ${message}`);
};

function importFromModules(functionName, modules) {
  for (const moduleName of modules) {
    try {
      const mod = require(moduleName);
      if (mod?.[functionName]) {
        return mod[functionName];
      }
    } catch (err) {}
  }
  bxssdxrkLog(`Nenhum módulo válido encontrado para a função '${functionName}'.`, "error", "error");
  bxssdxrkLog(`Encerrando...`, "error", "error");
  setTimeout(() => process.exit(1), 1000);
}

const onlyNumbers = (text) => text.replace(/[^0-9]/g, "");

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

const downloadContentFromMessage = importFromModules("downloadContentFromMessage", [
  "@whiskeysockets/baileys", 
  "baileys", 
  "@itsukichan/baileys", 
  "@shizo-devs/baileys", 
  "baileys-pro"
]);

async function downloadMedia(mediaMsg) {
  const type = Object.keys(mediaMsg)[0];
  const stream = await downloadContentFromMessage(mediaMsg[type], type.replace("Message", ""));
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function saveMedia(mediaMsg, senderJid, subfolder, type) {
  try {
    const mediaBuffer = await downloadMedia(mediaMsg);
    const jidFolder = sanitizeJid(senderJid);
    
    if (subfolder === "Visualização Única") subfolder = "viewOnce";
    if (subfolder === "Fotos de Perfil") subfolder = "profilePic";

    const saveDir = path.join(BASE_DIR, jidFolder, subfolder);
    ensureDir(saveDir);

    const fileType = mediaMsg?.imageMessage
      ? "jpg"
      : mediaMsg?.videoMessage
      ? "mp4"
      : mediaMsg?.audioMessage
      ? "mp3"
      : mediaMsg?.documentMessage
      ? mediaMsg.documentMessage.fileName?.split(".").pop() || "bin"
      : mediaMsg?.stickerMessage
      ? "webp"
      : "bin";

    const fileName = `${getTimestamp()}.${fileType}`;
    const filePath = path.join(saveDir, fileName);
    await writeFile(filePath, mediaBuffer);
    
    const relativePath = path.relative("/storage/emulated/0/Download", filePath);

    bxssdxrkLog(`Salvo com sucesso!`, type, "success");
    bxssdxrkLog(`Download/${relativePath}`, type, "success");
  } catch (err) {
    bxssdxrkLog(`Erro ao salvar ${subfolder}: ${err.message}`, type, "error");
  }
}

// ==============================
// FUNÇÕES PRINCIPAIS
// ==============================

async function saveViewOnce(webMessage) {
  if (!webMessage?.key?.fromMe || !webMessage?.message) return;
  
  const key = webMessage.key;
  const msg = webMessage.message;
  
  const msgType = Object.keys(msg)[0];
  const contextInfo = msg[msgType]?.contextInfo;
  
  if (!contextInfo) return;
  
  const isStatus = key.remoteJid === "status@broadcast" || contextInfo.remoteJid === "status@broadcast";
  
  const targetJid = contextInfo.participant;
  const quoted = contextInfo.quotedMessage;
  if (!quoted) return;
  
  const mediaKeys = Object.keys(quoted);
  for (const type of mediaKeys) {
    const media = quoted[type];
    if (typeof media === "object" && media?.viewOnce === true) {
      const mediaMsg = { [type]: media };
      return await saveMedia(mediaMsg, targetJid, "Visualização Única", "viewOnce");
    }
  }
}

async function saveStatus(webMessage) {
  const key = webMessage?.key;
  const remoteJid = key.remoteJid;
  const msg = webMessage?.message;
  
  const saveStatusLiking = config.SALVAR_STATUS_CURTINDO;
  const saveStatusReplying = config.SALVAR_STATUS_RESPONDENDO;
  
  if (!key?.fromMe || !msg) return;
  
  const contextInfo = Object.values(msg).find(v => v?.contextInfo)?.contextInfo;
  
  const userJid = key.participant || webMessage?.participant || remoteJid;
  const isStatus = msg?.broadcast || remoteJid === "status@broadcast" || contextInfo?.remoteJid === "status@broadcast";
  const isReaction = msg?.reactionMessage?.text;
  
  if (!isStatus) return;
  
  try {
  if (isReaction && saveStatusLiking) {
    const reactionMessage = msg.reactionMessage;
    const targetJid = reactionMessage?.key?.participant;
    const statusID = reactionMessage?.key?.id;
    
    try {
      const originalStatus = await store.getStatus(targetJid, statusID);
      
      if (!originalStatus?.message) return;
      
      const originalMsg = originalStatus.message;
      const mediaType = Object.keys(originalMsg).find(k => originalMsg[k]?.mimetype);
      
      if (!mediaType) return;
      
      const mediaMsg = { [mediaType]: originalMsg[mediaType] };
      
      await saveMedia(mediaMsg, targetJid, "Status", "status");
    } catch (err) {
      bxssdxrkLog(`Erro ao salvar status curtido: ${err.message}`, "saveStatus", "error");
    }
  }
  } catch (err) {
    bxssdxrkLog(`Erro desconhecido: ${err}`, "saveStatus", "error")
  }

  // 💬 Resposta ao status
  if (!isReaction && saveStatusReplying) {
    const quoted = contextInfo?.quotedMessage;
    const targetJid = contextInfo?.participant || userJid;

    if (!quoted || !targetJid) return;

    const mediaKeys = Object.keys(quoted);
    for (const type of mediaKeys) {
      const media = quoted[type];
      if (typeof media === "object" && media?.mimetype) {
        const mediaMsg = { [type]: media };
        return await saveMedia(mediaMsg, targetJid, "Status", "status");
      }
    }
  }
}

async function saveProfilePicture(mediaMsg, senderJid) {
  const msg = mediaMsg.message;
  if (!mediaMsg?.key?.fromMe || !msg) return;
  
  const type = Object.keys(msg).find(k => ["imageMessage", "videoMessage"].includes(k));
  if (!type || !msg[type]) return;
  const mediaObj = { [type]: msg[type] };
  return await saveMedia(mediaObj, senderJid, "Fotos de Perfil", "profilePic");
}

// ==============================
// REGISTRAR EVENTOS INTERNAMENTE
// ==============================

function registerEvents() {
  if (!socket || eventsRegistered) return;
  socket.ev.on("messages.upsert", async ({ messages }) => {
    if (!Array.isArray(messages) || !messages.length) return;
    for (const webMessage of messages) {
      const remoteJid = webMessage.key?.remoteJid;
      await store.saveMessage(remoteJid, webMessage)
      await store.saveStatus(remoteJid, webMessage)
      await saveViewOnce(webMessage);
      await saveStatus(webMessage);
    }
    
  });
  

  socket.ev.on("call", async (calls) => {
    const rejectGroupCall = config.REJEITAR_CHAMADAS_EM_GRUPOS;
    const rejectPrivateCall = config.REJEITAR_CHAMADAS_PRIVADAS;
    const rejectPrivateList = config.REJEITAR_CHAMADAS_PRIVADAS_ESPECIFICAS;
  
    for (const call of calls) {
      const { from, id, isGroup, status } = call;
      const fromNumber = onlyNumbers(from);
      const isPrivateException = rejectPrivateList.includes(fromNumber);
  
      const shouldReject =
        (isGroup && rejectGroupCall) ||
        (!isGroup && rejectPrivateCall && !isPrivateException);
  
      if ((status === "offer" || status === "ringing") && shouldReject) {
        try {
          await socket.rejectCall(id, from, []);
          bxssdxrkLog(`Ligação rejeitada: ${from}`, "rejectCall", "success");
        } catch (err) {
          bxssdxrkLog(`Erro ao rejeitar chamada de: ${from}`, "rejectCall", "error");
          console.error(err);
        }
      }
    }
  });

  eventsRegistered = true;
}

// ==============================
// INICIALIZAÇÃO
// ==============================

async function start(sock) {
  if (socket) return;
  socket = sock;
  registerEvents();
  // bxssdxrkLog("utilitárias inicializadas com sucesso.", "start", "info");
}

// ==============================
// EXPORTAÇÃO
// ==============================

module.exports = {
  start,
  bxssdxrkLog
};