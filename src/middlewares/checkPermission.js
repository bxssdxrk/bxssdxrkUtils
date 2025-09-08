const { ownNumber } = require(`${BASE_DIR}/config`);
const { 
  setGroupMetadata,
  getGroupMetadata,
  hasGroupMetadata,
  isGroupCacheEmpty
  } = require(`${BASE_DIR}/utils/groupCache`);
const { toUserJid } = require(`${BASE_DIR}/utils`);
  
exports.checkPermission = async ({ type, socket, userJid, remoteJid }) => {
  if (type === "Membros") {
    return true;
  }
  
  const metadata = await hasGroupMetadata(remoteJid) ? await getGroupMetadata(remoteJid) : await socket.groupMetadata(remoteJid);
  
  const { participants, owner } = metadata;

  const participant = participants.find(
    (participant) => participant.id === userJid
  );

  if (!participant) {
    return false;
  }

  const isOwner =
    participant.id === owner || participant.admin === "superadmin";

  const isAdmin = participant.admin === "admin";
  
  const isOwnUser = toUserJid(ownNumber) === userJid;
  
  if (type === "Admins") {
    return isOwner || isAdmin || isOwnUser;
  }

  if (type === "Dono") {
    return isOwner || isOwnUser;
  }
  
  if (type === "Privados") {
    return isOwnUser;
  }

  return false;
};