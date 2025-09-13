const path = require("path");
const { question } = require("./utils");
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  isJidStatusBroadcast,
  isJidNewsletter,
  makeInMemoryStore,
  proto,
} = require("@itsukichan/baileys");
const NodeCache = require("node-cache");
const pino = require("pino");
const { load } = require("./loader");
const { bxssdxrkLog, onlyNumbers } = require("./utils");
const { 
  setGroupMetadata,
  getGroupMetadata,
  hasGroupMetadata,
  isGroupCacheEmpty
  } = require("./utils/groupCache");

const msgRetryCounterCache = new NodeCache();

async function saveAllGroupsCache(socket) {
  bxssdxrkLog("Cache de grupos iniciado...", "groupCache", "info");
  let cachedGroupsCount = 0;
  let alreadyCached = 0;
  try {
    const groups = await socket.groupFetchAllParticipating();
    for (const [jid, metadata] of Object.entries(groups)) {
      if (!hasGroupMetadata(jid)) {
        await setGroupMetadata(jid, metadata);
        cachedGroupsCount ++;
      } else {
        alreadyCached ++;
      }
    }
    
    if (cachedGroupsCount > 0) {
      log = `${cachedGroupsCount} grupos salvos em cache com sucesso!`;
      if (alreadyCached > 0) {
        log += ` ${alreadyCached} já estavam em cache.`;
      }
      bxssdxrkLog(log, "groupCache", "success");
    } else {
      bxssdxrkLog(`Todos os grupos já estão em cache!`, "groupCache", "success");
    }
  } catch (err) {
    bxssdxrkLog(`Erro ao salvar cache inicial de grupos: ${err}`, "groupCache", "error");
  }
}

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.resolve(__dirname, "..", "assets", "auth", "baileys")
  );
  
  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({
    version,
    printQRInTerminal: false,
    defaultQueryTimeoutMs: 60 * 1000,
    auth: state,
    logger: pino({ level: "silent" }),
    shouldIgnoreJid: (jid) => isJidNewsletter(jid),
    keepAliveIntervalMs: 60 * 1000,
    markOnlineOnConnect: false,
    msgRetryCounterCache,
    emitOwnEvents: true,
    syncFullHistory: true,
    cachedGroupMetadata: async (jid) => getGroupMetadata(jid),
  });
  
  if (!socket.authState.creds.registered) {
    bxssdxrkLog("Credenciais ainda não configuradas!", "sistema", "warn");
    const phoneNumber = await question("Informe seu número de telefone (EXEMPLO: \"555199998888\"): ");

    if (!phoneNumber || isNaN(phoneNumber)) {
      bxssdxrkLog('Número de telefone inválido!', "sistema", "error");
      setTimeout(() => process.exit(1), 1000);
    }
    const code = await socket.requestPairingCode(onlyNumbers(phoneNumber));
    
    bxssdxrkLog(`Código de pareamento: ${code}`, "sistema", "info");
  }

  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;

      if (statusCode === DisconnectReason.loggedOut) {
        bxssdxrkLog("Script desconectado!", "sistema", "error");
      } else {
        switch (statusCode) {
          case DisconnectReason.badSession:
            bxssdxrkLog("Sessão inválida!", "sistema", "warn");
            break;
          case DisconnectReason.connectionClosed:
            bxssdxrkLog("Conexão fechada!", "sistema", "warn");
            break;
          case DisconnectReason.connectionLost:
            bxssdxrkLog("Conexão perdida!", "sistema", "warn");
            break;
          case DisconnectReason.connectionReplaced:
            bxssdxrkLog("Conexão substituída!", "sistema", "warn");
            break;
          case DisconnectReason.multideviceMismatch:
            bxssdxrkLog("Dispositivo incompatível!", "sistema", "warn");
            break;
          case DisconnectReason.forbidden:
            bxssdxrkLog("Conexão proibida!", "sistema", "warn");
            break;
          case DisconnectReason.restartRequired:
            bxssdxrkLog("Reinício necessário. Reiniciando...", "sistema", "info");
            setTimeout(() => process.exit(1), 1000);
            break;
          case DisconnectReason.unavailableService:
            bxssdxrkLog("Serviço indisponível!", "sistema", "warn");
            break;
        }

        const newSocket = await connect();
        load(newSocket);
      }
    } else if (connection === "open") {
      bxssdxrkLog("Conectado!", "sistema", "success");
      if (isGroupCacheEmpty()) {
        saveAllGroupsCache(socket);
      }
    } else if (connection === "connecting") {
      bxssdxrkLog("Conectando...", "sistema", "info");
    } else {
      bxssdxrkLog("Atualizando conexão...", "sistema", "info");
    }
  });

  socket.ev.on("creds.update", saveCreds);
  
  return socket;
}

exports.connect = connect;
