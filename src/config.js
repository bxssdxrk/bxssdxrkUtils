const path = require("path");
const fs = require("fs");

// ==================== CONFIGURAÇÕES PRIMÁRIAS ==================== //

// Coloque o seu número (sem espaços, apenas números com DDI, ex: "5599999999999")
const SEU_NUMERO = "";

// Emoji usado ao curtir status automaticamente (deixe vazio "" para desativar)
// Exemplo: "💚"
const AUTO_CURTIR_STATUS = "";

// Salvar status quando RESPONDER diretamente a um status
const SALVAR_STATUS_RESPONDENDO = false;

// Salvar status quando CURTIR (reagir com emoji) um status
const SALVAR_STATUS_CURTINDO = false;

// Separar arquivos de mídia salvos por usuário (true = organiza em pastas por número)
const SEPARAR_MIDIAS_SALVAS_POR_USUARIOS = false;

// Rejeitar chamadas recebidas dentro de grupos (true = rejeita chamadas em grupo)
const REJEITAR_CHAMADAS_EM_GRUPOS = true;

// Rejeitar chamadas de VÍDEO em qualquer contexto (grupo ou privado)
const REJEITAR_CHAMADAS_DE_VIDEO = false;

// Rejeitar chamadas de VOZ em qualquer contexto (grupo ou privado)
const REJEITAR_CHAMADAS_DE_VOZ = false;

// Rejeitar todas chamadas PRIVADAS
const REJEITAR_CHAMADAR_PRIVADAS = false;

// Prefixos válidos para comandos (pode usar múltiplos)
// Exemplo: ["!", ".", "/"]
const PREFIXOS_DOS_COMANDOS = ["!", "."];

const NOME_DO_PACOTE_AO_FAZER_FIGURINHAS = "bxssdxrkUtils!";

const NOME_DO_AUTOR_AO_FAZER_FIGURINHAS = "https://github.com/bxssdxrk/bxssdxrkUtils";

// Permitir o uso de comandos (true = comandos habilitados, false = desativados)
const PERMITIR_COMANDOS = false;

// Lista de JIDs (grupos ou números) onde comandos são permitidos
// Se estiver vazia, comandos são permitidos em qualquer chat (caso PERMITIR_COMANDOS seja true)
const COMANDOS_SOMENTE_NOS_CHATS = [
  // "120363438656526969@g.us",      =>  Exemplo de JID de grupo
  // "555155554444@s.whatsapp.net"   =>  Exemplo de JID privado
];

// Lista de números específicos que terão chamadas privadas rejeitadas automaticamente
const REJEITAR_CHAMADAS_PRIVADAS_ESPECIFICAS = [
  "555199998888", // Exemplo
  "555155554444"  // Exemplo
];

// Tempo de espera (em milissegundos) entre eventos repetidos para evitar spam/banimento
const TIMEOUT_IN_MILLISECONDS_BY_EVENT = 700;


// ==================== APARTIR DAQUI NÃO ALTERE NADA ==================== //


const ownNumber = SEU_NUMERO;
const autoLikeStatusEmoji = AUTO_CURTIR_STATUS;
const commandPrefixes = PREFIXOS_DOS_COMANDOS;
const prefix = commandPrefixes[0];
const saveStatusByReply = SALVAR_STATUS_RESPONDENDO;
const saveStatusByLike = SALVAR_STATUS_CURTINDO;
const arrangeByNumber = SEPARAR_MIDIAS_SALVAS_POR_USUARIOS;
const rejectGroupCalls = REJEITAR_CHAMADAS_EM_GRUPOS;
const rejectVideoCall = REJEITAR_CHAMADAS_DE_VIDEO;
const rejectVoiceCall = REJEITAR_CHAMADAS_DE_VOZ;
const rejectPrivateCall = REJEITAR_CHAMADAR_PRIVADAS;
const rejectSpecificPrivateCalls = REJEITAR_CHAMADAS_PRIVADAS_ESPECIFICAS;
const allowCommands = PERMITIR_COMANDOS;
const stickerMetadata = { 
  packName: NOME_DO_PACOTE_AO_FAZER_FIGURINHAS, 
  author: NOME_DO_AUTOR_AO_FAZER_FIGURINHAS
};
const onlyChatsCommands = COMANDOS_SOMENTE_NOS_CHATS;
const timeoutByEvent = TIMEOUT_IN_MILLISECONDS_BY_EVENT;
const databaseDir = path.resolve(__dirname, "..", "database");
const tempDir = path.resolve(__dirname, "..", "assets", "temp");
const commandsDir = path.resolve(__dirname, "commands");
const savedFilesDir = "/storage/emulated/0/Download/bxssdxrkUtils";

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
[ 
  databaseDir, tempDir, 
  commandsDir, savedFilesDir
].forEach(ensureDirExists);

module.exports = {
  ownNumber,
  commandPrefixes,
  prefix,
  autoLikeStatusEmoji,
  saveStatusByReply,
  saveStatusByLike,
  arrangeByNumber,
  rejectGroupCalls,
  rejectVideoCall,
  rejectVoiceCall,
  rejectPrivateCall,
  rejectSpecificPrivateCalls,
  allowCommands,
  stickerMetadata,
  onlyChatsCommands,
  timeoutByEvent,
  databaseDir,
  tempDir,
  commandsDir,
  savedFilesDir,
};