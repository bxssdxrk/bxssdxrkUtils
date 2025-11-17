const { ownNumber } = require(`${BASE_DIR}/config`);
const { 
  setGroupMetadata,
  getGroupMetadata,
  hasGroupMetadata
} = require(`${BASE_DIR}/utils/groupCache`);
const { toUserJid, isGroupJid } = require(`${BASE_DIR}/utils`);
  
exports.checkPermission = async ({ type, socket, userJid, remoteJid, fromMe }) => {
  if (type === "Membros") {
    return true;
  }
  
  try {
    const ownJid = toUserJid(ownNumber);
    const ownLidResult = await socket.getLidUser(ownJid).catch(() => null);
    const ownLid = ownLidResult?.[0]?.lid;
    
    const isOwnUser = userJid ? (ownLid === userJid || ownJid === userJid) : fromMe;
    
    const isGroupChat = isGroupJid(remoteJid);
    
    if (isGroupChat) {
      let metadata;
      
      if (hasGroupMetadata(remoteJid)) {
        metadata = getGroupMetadata(remoteJid);
      } else {
        metadata = await socket.groupMetadata(remoteJid).catch(() => null);
        if (metadata) {
          setGroupMetadata(remoteJid, metadata);
        }
      }
      
      if (!metadata) {
        return isOwnUser;
      }
      
      const { participants, owner } = metadata;
    
      const participant = participants?.find(
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
  } catch (err) {
    console.error("Erro em checkPermission:", err);
    return false;
  }
};