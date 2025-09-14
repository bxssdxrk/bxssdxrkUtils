const path = require("path");
const fs = require("fs");

// ==================== CONFIGURAÇÕES PRIMÁRIAS ==================== //

// Informe seu número de telefone completo, SEM espaços, traços ou parênteses,
// e incluindo o código do país (ex: Brasil = 55).
// Exemplo correto: "5599999999999"
const SEU_NUMERO = "555185069870";

// Emoji que será usado automaticamente para curtir os status dos seus contatos.
// Exemplo: "💚". Deixe vazio ("") se não quiser curtir automaticamente.
const AUTO_CURTIR_STATUS = "";

// Salvar o status quando você RESPONDER diretamente a ele?
// true  = sim, o status será salvo automaticamente
// false = não salvará nada ao responder
const SALVAR_STATUS_RESPONDENDO = false;

// Salvar o status quando você CURTIR (reagir com emoji)?
// true  = sim, salvará o status curtido
// false = não salvará
const SALVAR_STATUS_CURTINDO = true;

// Ao salvar mídias (imagens, vídeos, áudios), deseja organizá-las por usuário?
// true  = sim, cada contato terá sua própria pasta
// false = todas as mídias vão para uma única pasta
const SEPARAR_MIDIAS_SALVAS_POR_USUARIOS = false;

// Rejeitar chamadas recebidas dentro de grupos?
// true  = sim, chamadas em grupo serão recusadas automaticamente
// false = não rejeitar chamadas em grupo
const REJEITAR_CHAMADAS_EM_GRUPOS = true;

// Rejeitar qualquer chamada de VÍDEO (grupo ou privado)?
// true  = sim, todas as chamadas de vídeo serão recusadas
// false = chamadas de vídeo são aceitas normalmente
const REJEITAR_CHAMADAS_DE_VIDEO = false;

// Rejeitar qualquer chamada de VOZ (grupo ou privado)?
// true  = sim, todas as chamadas de voz serão recusadas
// false = chamadas de voz são aceitas normalmente
const REJEITAR_CHAMADAS_DE_VOZ = false;

// Rejeitar todas as chamadas feitas no PRIVADO?
// true  = sim, qualquer chamada privada será recusada
// false = chamadas privadas são aceitas
const REJEITAR_CHAMADAR_PRIVADAS = false;

// Prefixos válidos que serão usados para identificar comandos nas mensagens.
// Pode usar mais de um prefixo, como "!", ".", "/", etc.
// Exemplo: ["!", "."] permite usar "!comando" ou ".comando"
// ATENÇÃO: Sempre use colchetes [] mesmo se for apenas um prefixo.
const PREFIXOS_DOS_COMANDOS = [
  // Prefixo padrão
  "?"
];

// Nome que será mostrado como "pacote" nas figurinhas criadas.
// Pode ser qualquer nome, isso é apenas por estética
const NOME_DO_PACOTE_AO_FAZER_FIGURINHAS = "bxssdxrkUtils!";

// Nome do autor mostrado nas figurinhas criadas.
// Pode ser seu nome, um apelido ou até um link.
// Isso também é apenas por estética
const NOME_DO_AUTOR_AO_FAZER_FIGURINHAS = "https://github.com/bxssdxrk/bxssdxrkUtils";

// Deseja permitir o uso de comandos nas mensagens?
// true  = comandos ativados
// false = comandos desativados (nada será executado ao enviar comandos)
const PERMITIR_COMANDOS = true;

// Ativar sistema anti-spam (anti-trava / anti-divulgação)?
// true  = ativa bloqueio automático de mensagens maliciosas ou indesejadas, como:
//    - mensagens com padrões de trava (ex: símbolos, JSONs gigantes)
//    - tipos mensagens de divulgação conhecidas
//    - arquivos potencialmente perigosos
// false = desativa esse filtro, todas as mensagens serão recebidas normalmente
// NEM TODOS OS TIPOS DE SPAM/TRAVAS SÃO BLOQUEADOS!!!
// Os tipos de spam que bloqueia, são spams que eu já "presenciei" anteriormente.
const HABILITAR_ANTI_SPAM = true;

// Lista de chats específicos (grupos ou números) onde o uso de comandos é permitido.
// Caso essa lista fique vazia, comandos funcionarão em qualquer lugar (se PERMITIR_COMANDOS for true).
// Cada item precisa ser um identificador (JID) como mostrado nos exemplos abaixo:
// Grupo: "120363438656526969@g.us"
// Contato: "555155554444@s.whatsapp.net"
const COMANDOS_SOMENTE_NOS_CHATS = [
  // "120363438656526969@g.us",     
  // "555155554444@s.whatsapp.net"  
];

// Lista de números específicos cujas chamadas privadas sempre serão recusadas.
// Útil para bloquear chamadas indesejadas mesmo se chamadas privadas estiverem liberadas em geral.
const REJEITAR_CHAMADAS_PRIVADAS_ESPECIFICAS = [
  // "555199998888",     
  // "555155554444"      
];

// Tempo de espera entre eventos iguais, como mensagens ou comandos repetidos.
// Esse intervalo (em milissegundos) ajuda a evitar spam ou bloqueios por excesso de atividade.
// Exemplo: 700 significa que espera 0,7 segundos entre repetições.
const TIMEOUT_IN_MILLISECONDS_BY_EVENT = 700;






// ==================== APARTIR DAQUI, NÃO ALTERE NADA ==================== //

const ownNumber = SEU_NUMERO;
const autoLikeStatusEmoji = AUTO_CURTIR_STATUS;
const commandPrefixes = PREFIXOS_DOS_COMANDOS;
const prefix = commandPrefixes[0];
const saveStatusByReply = SALVAR_STATUS_RESPONDENDO;
const enableAntiSpam = HABILITAR_ANTI_SPAM;
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
  allowCommands,
  stickerMetadata,
  onlyChatsCommands,
  timeoutByEvent,
  databaseDir,
  tempDir,
  commandsDir,
  savedFilesDir,
};