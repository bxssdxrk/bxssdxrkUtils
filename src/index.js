const { connect } = require("./connection");
const { load } = require("./loader");
const { bxssdxrkBanner, bxssdxrkLog, checkForUpdates } = require("./utils");
const { createHelpers } = require("./utils/commonFunctions");

async function start() {
  try {
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