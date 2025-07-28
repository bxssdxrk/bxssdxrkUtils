const { rejectCall } = require(`${BASE_DIR}/utils/bxssdxrkUtils`);

exports.onCall = async ({ socket, calls }) => {
  for (const call of calls) {
    console.log(call)
    if (!call) continue;
    await rejectCall(socket, call);
  }
};