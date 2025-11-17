const fs = require('fs');
const path = require('path');
const { databaseDir } = require(`${BASE_DIR}/config`);

function createDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  return p;
}

function readJSON(p, def = {}) {
  try { 
    return JSON.parse(fs.readFileSync(p)); 
  } catch (err) { 
    return def; 
  }
}

function writeJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function createStore(base = `${databaseDir}/store`) {
  createDir(base + '/messages');
  createDir(base + '/status');
  /*
   *  Pode ser útil futuramente:
   *  
   *  createDir(base + '/contacts');
   *  createDir(base + '/blocklist');
   *  createDir(base + '/groups');
  */
  
  return {
    saveMessage(jid, msg) {
      const id = msg?.key?.id;
      const from = msg?.key?.participant || msg?.key?.participantAlt || msg?.key?.remoteJid || msg?.key?.remoteJidAlt;
      const isReaction = !!msg.message?.reactionMessage;
      
      if (!jid || !id || !from || isReaction || jid === "status@broadcast") return;
      const dir = createDir(`${base}/messages/${jid}/${from}`);
      const file = path.join(dir, id + '.json');
      writeJSON(file, { ...msg, timestamp: Date.now() });
    },
    getMessage(key) {
      const remoteJid = key?.remoteJid || key?.remoteJidAlt;
      const userJid = key?.participant || key?.participantAlt || remoteJid;
      const id = key?.id;
      if (!remoteJid || !userJid || !id) return null;
    
      const file = path.join(base, 'messages', remoteJid, userJid, id + '.json');
      return readJSON(file, null);
    },
    getMessagesByUser(jid, participant) {
      const userDir = path.join(base, 'messages', jid, participant);
      if (!fs.existsSync(userDir)) return [];
    
      const files = fs.readdirSync(userDir).filter(f => f.endsWith('.json'));
      const messages = [];
    
      for (const file of files) {
        const filePath = path.join(userDir, file);
        const message = readJSON(filePath, null);
        if (message) messages.push(message);
      }
    
      return messages;
    },
    deleteOldMessages(ttlMs = 24 * 3600 * 1000) { // 24 Horas
    
      const msgsPath = path.join(base, 'messages');
      if (!fs.existsSync(msgsPath)) return;
    
      const now = Date.now();
    
      for (const remoteDir of fs.readdirSync(msgsPath)) {
        const remotePath = path.join(msgsPath, remoteDir);
        if (!fs.lstatSync(remotePath).isDirectory()) continue;
    
        for (const userDir of fs.readdirSync(remotePath)) {
          const userPath = path.join(remotePath, userDir);
          if (!fs.lstatSync(userPath).isDirectory()) continue;
          
          for (const f of fs.readdirSync(userPath)) {
            const full = path.join(userPath, f);
            const data = readJSON(full);
            if (!data.timestamp || now - data.timestamp > ttlMs) {
              fs.unlinkSync(full);
            }
          }
          if (fs.readdirSync(userPath).length === 0) {
            fs.rmSync(userPath, { recursive: true });
          }
        }
        if (fs.readdirSync(remotePath).length === 0) {
          fs.rmSync(remotePath, { recursive: true });
        }
      }
    },
    saveStatus(jid, msg) {
      const userJid = msg?.key?.participantAlt;
      const id = msg?.key?.id;
      const isReaction = !!msg.message?.reactionMessage;
      
      if (jid !== "status@broadcast" || !userJid || !id || isReaction) return;
    
      const dir = createDir(`${base}/status/${userJid}`);
      const file = path.join(dir, id + '.json');
      writeJSON(file, { ...msg, timestamp: Date.now() });
    },
    getStatus(userJid, id) {
      if (!userJid || !id) return null;
    
      const file = path.join(base, 'status', userJid, id + '.json');
      return readJSON(file, null);
    },
    deleteOldStatus(ttlMs = 24 * 3600 * 1000) { // 24 Horas
      const statusBase = path.join(base, 'status');
      if (!fs.existsSync(statusBase)) return;
    
      const now = Date.now();
    
      for (const userDir of fs.readdirSync(statusBase)) {
        const fullUserPath = path.join(statusBase, userDir);
        if (!fs.lstatSync(fullUserPath).isDirectory()) continue;
    
        for (const f of fs.readdirSync(fullUserPath)) {
          const full = path.join(fullUserPath, f);
          const data = readJSON(full);
          if (!data.timestamp || now - data.timestamp > ttlMs) {
            fs.unlinkSync(full);
          }
        }
        if (fs.readdirSync(fullUserPath).length === 0) {
          fs.rmSync(fullUserPath, { recursive: true });
        }
      }
    }
  };
}


const store = createStore();

setInterval(() => {
  try {
    store.deleteOldMessages();
    store.deleteOldStatus();
  } catch (err) {
    console.error('Erro ao limpar mensagens/status antigos:', err);
  }
}, 1000 * 60 * 60); // 1 Hora

module.exports = createStore;