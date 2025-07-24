const { connect } = require("./connection");
const { load } = require("./loader");
const { bxssdxrkBanner } = require("./utils");
const { bxssdxrkLog } = require("./utils/bxssdxrkUtils");

async function start() {
  try {
    bxssdxrkBanner();
    bxssdxrkLog("Iniciando, aguarde!", "info", "info");
    const socket = await connect();
    load(socket);
  } catch (error) {
    console.log(error);
  }
}

start();