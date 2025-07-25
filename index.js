const { connect } = require("./src/connection");
const { load } = require("./src/loader");
const { bxssdxrkBanner } = require("./src");
const { bxssdxrkLog } = require("./src/utils/bxssdxrkUtils");
async function start() {
  try {
    bxssdxrkBanner();
    bxssdxrkLog("Iniciando meus componentes internos...", "info", "info");
    const socket = await connect();
    load(socket);
  } catch (error) {
    bxssdxrkLog(`Erro desconhecido iniciando o script: ${error}`, "error", "error");
  }
}

start();
