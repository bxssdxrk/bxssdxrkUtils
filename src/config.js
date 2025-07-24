const path = require("path");

exports.config = {
  // Coloque o seu número entre as aspas (EXEMPLO: 555199998888)
  SEU_NUMERO: "",
  
  // Emoji ao curtir status automaticamente (Deixe vazio entre as aspas para desligar)
  AUTO_CURTIR_STATUS: "", // O padrão é "💚"
  
  // Salvar status respondendo ao status
  SALVAR_STATUS_RESPONDENDO: false,
  
  // Salvar o status curtindo o status
  SALVAR_STATUS_CURTINDO: false,
  
  // Rejeitar ligações de grupos automaticamente
  REJEITAR_CHAMADAS_EM_GRUPOS: false,
  
  // Rejeitar ligações de video automaticamente
  REJEITAR_CHAMADAS_DE_VIDEO: false,
  
  // Rejeitar ligações de voz automaticamente
  REJEITAR_CHAMADAS_DE_VOZ: false,
  
  // Rejeitar ligações de contatos automaticamente
  REJEITAR_CHAMADAR_PRIVADAS: false,
  
  // Rejeitar ligações de contatos especificos automaticamente
  REJEITAR_CHAMADAS_PRIVADAS_ESPECIFICAS: [
    "555199998888",   // Alguns números de exemplo
    "555155554444"    // Alguns números de exemplo
  ],
  
  DATABASE_DIR: path.resolve(__dirname, "..", "database")
};