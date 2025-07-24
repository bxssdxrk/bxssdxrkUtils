const bxssdxrk = require("./utils/bxssdxrkUtils");

exports.load = (socket) => {
  bxssdxrk.start(socket);
};