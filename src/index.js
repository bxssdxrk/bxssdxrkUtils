const { connect } = require("./connection");
const { load } = require("./loader");
const { bxssdxrkBanner, bxssdxrkLog, checkForUpdates, clearTempDir } = require("./utils");

async function start() {
  try {
    clearTempDir();
    bxssdxrkBanner();
    await checkForUpdates();
    bxssdxrkLog("Iniciando, aguarde!", "sistema", "info");
    const socket = await connect();
    load(socket);
  } catch (error) {
    bxssdxrkLog(`Erro ao iniciar o socket: ${error}`, "sistema", "error");
  }
}

start();