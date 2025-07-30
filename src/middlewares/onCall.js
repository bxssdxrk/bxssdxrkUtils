const { rejectCall } = require(`${BASE_DIR}/utils/bxssdxrkUtils`);

exports.onCall = async ({ socket, calls }) => {
  if (!calls.length) return;
  
  for (const call of calls) {
    if (!call) continue;
    await rejectCall(socket, call);
  }
};