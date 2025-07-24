const path = require("path");

exports.config = {
  // Coloque o seu número entre as aspas (EXEMPLO: 555199998888)
  SEU_NUMERO: "",
  
  // Emoji ao curtir status automaticamente (Deixe vazio entre as aspas para desligar)
  AUTO_CURTIR_STATUS: "🔥",
  
  // Salvar status respondendo ao status
  SALVAR_STATUS_RESPONDENDO: false,
  
  // Salvar o status curtindo o status
  SALVAR_STATUS_CURTINDO: true,
  
  // Rejeitar ligações de grupos automaticamente
  REJEITAR_CHAMADAS_EM_GRUPOS: true,
  
  // Rejeitar ligações de contatos automaticamente
  REJEITAR_CHAMADAR_PRIVADAS: false,
  
  // Rejeitar ligações de contatos especificos automaticamente
  REJEITAR_CHAMADAS_PRIVADAS_ESPECIFICAS: [
    "555199998888",
    "555177776666",
    "555155554444"
  ],
  
  DATABASE_DIR: path.resolve(__dirname, "..", "database")
};