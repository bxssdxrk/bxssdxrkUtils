const { ownNumber } = require(`${BASE_DIR}/config`);
const { 
  setGroupMetadata,
  getGroupMetadata,
  hasGroupMetadata,
  isGroupCacheEmpty
  } = require(`${BASE_DIR}/utils/groupCache`);
const { toUserJid, isGroupJid } = require(`${BASE_DIR}/utils`);
  
exports.checkPermission = async ({ type, socket, userJid, remoteJid, fromMe }) => {
  if (type === "Membros") {
    return true;
  }
  
  const ownJid = toUserJid(ownNumber);
  const ownLid = (await socket.getLidUser(ownJid))[0].lid;
  
  const isOwnUser = userJid ? (ownLid === userJid || ownJid === userJid) : fromMe;
  
  const isGroupChat = isGroupJid(remoteJid);
  
  if (isGroupChat) {
    const metadata = await hasGroupMetadata(remoteJid) ? await getGroupMetadata(remoteJid) : await socket.groupMetadata(remoteJid);
    
    const { participants, owner } = metadata;
  
    const participant = participants.find(
      participant => participant.id === userJid || participant.lid === userJid
    );
    
    if (!participant) {
      return false;
    }
  
    const isOwner =
      participant.id === owner || participant.admin === "superadmin";
  
    const isAdmin = participant.admin === "admin";
    
    if (type === "Admins") {
      return isOwner || isAdmin || isOwnUser;
    }
  
    if (type === "Dono") {
      return isOwner || isOwnUser;
    }
  }

  if (type === "Uso Próprio") {
    return isOwnUser;
  }

  return false;
};