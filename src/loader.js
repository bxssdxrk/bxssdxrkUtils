const { timeoutByEvent } = require(`${BASE_DIR}/config`);
const { rejectCall } = require("./utils/bxssdxrkUtils");
const { onMessagesUpsert } = require("./middlewares/onMessagesUpsert");
const { onGroupParticipantsUpdate } = require("./middlewares/onGroupParticipantsUpdate");
const { onCall } = require("./middlewares/onCall");

exports.load = (socket) => {
  socket.ev.on("messages.upsert", async ({ messages, type }) => {
    setTimeout(async () => {
      onMessagesUpsert({ socket, messages });
    }, timeoutByEvent);
  });
  
  socket.ev.on("group-participants.update", async ({ id, participants, action }) => {
    setTimeout(() => {
      onGroupParticipantsUpdate({ socket, id, participants, action });
    }, timeoutByEvent);
  });
  
  socket.ev.on("call", async (calls) => {
    onCall({ socket, calls });
  });
};