const { prefix } = require(`${BASE_DIR}/config`);
const { bxssdxrkLog } = require(`${BASE_DIR}/utils`);
const { toUserJid, onlyNumbers } = require(`${BASE_DIR}/utils`);
const { hasGroupMetadata, getGroupMetadata } = require(`${BASE_DIR}/utils/groupCache`);

module.exports = {
  name: "Informações do Grupo",
  description: "Pega as informações do grupo.",
  commands: ["gpinfo"],
  usage: `${prefix}gpinfo`,
  handle: async ({ 
    socket,
    remoteJid,
    isGroupJid,
    sendWaitReact,
    sendImageFromURL,
    sendErrorReply,
    sendSuccessReact,
  }) => {
    try {
      await sendWaitReact();
      
      if (!isGroupJid(remoteJid)) {
        return await sendErrorReply("Este comando só funciona em grupos.");
      }
      
      const ppURL = await socket.profilePictureUrl(remoteJid, "image");
      const info = await hasGroupMetadata(remoteJid)
        ? await getGroupMetadata(remoteJid)
        : await socket.groupMetadata(remoteJid);
      // Extração básica
      const groupId = info.id || "Desconhecido";
      const name = info.subject || "Desconhecido";
      const subjectOwnerJid = info.subjectOwner || "Desconhecido";
      const groupOwnerJid = info.owner || "Desconhecido";
      
      // Números puros
      const subjectOwnerNumber = onlyNumbers(subjectOwnerJid) || "Desconhecido";
      const groupOwnerNumber = onlyNumbers(groupOwnerJid) || "Desconhecido";
      
      // @menções no formato @numero
      const subjectOwnerTag = subjectOwnerNumber !== "Desconhecido" ? `@${subjectOwnerNumber}` : "Desconhecido";
      const groupOwnerTag = groupOwnerNumber !== "Desconhecido" ? `@${groupOwnerNumber}` : "Desconhecido";
      const groupTag = groupId !== "Desconhecido" ? `@${groupId}` : "Desconhecido";
      
      // Menções em array
      const mentions = [];
      if (subjectOwnerJid !== "Desconhecido") mentions.push(subjectOwnerJid);
      if (groupOwnerJid !== "Desconhecido") mentions.push(groupOwnerJid);
      
      // Datas formatadas
      const subjectTime = info.subjectTime
        ? new Date(info.subjectTime * 1000).toLocaleString("pt-BR")
        : "Desconhecido";
      const creationTime = info.creation
        ? new Date(info.creation * 1000).toLocaleString("pt-BR")
        : "Desconhecido";
      
      // Demais propriedades
      const totalMembers = info.size || 0;
      const ownerCountry = info.ownerCountry || "Desconhecido";
      const description = info.desc || "Sem descrição";
      const descriptionId = info.descId || "Desconhecido";
      
      let linkedParentGroupTag = null;
      
      const linkedParentGroup = info.linkedParent || "Nenhum";
      const groupMentions = [
        { groupSubject: name, groupJid: groupId } // Note: remoteJid é o JID do grupo atual
      ];
      if (linkedParentGroup !== "Nenhum") {
        const linkedParentGroupInfo = await hasGroupMetadata(linkedParentGroup)
        ? await getGroupMetadata(linkedParentGroup)
        : await socket.groupMetadata(linkedParentGroup);
        linkedParentGroupTag = linkedParentGroup !== "Nenhum" ? `@${linkedParentGroup}` : "Nenhum";
        const linkedParentGroupName = linkedParentGroupInfo.subject;
        groupMentions.push(
          { groupSubject: linkedParentGroupName, groupJid: linkedParentGroup }
        );
      }
      
      const restrict = info.restrict === true ? "Ativado" : "Desativado";
      const announce = info.announce === true ? "Ativado" : "Desativado";
      const isCommunity = info.isCommunity === true ? "Sim" : "Não";
      const isCommunityAnnounce = info.isCommunityAnnounce === true ? "Sim" : "Não";
      const joinApprovalMode = info.joinApprovalMode === true ? "Ativado" : "Desativado";
      const memberAddMode = info.memberAddMode === true ? "Restrito" : "Livre";
      
      // Ephemeral (mensagens temporárias)
      let ephemeralSetting;
      switch (info.ephemeralDuration) {
        case 86400:
          ephemeralSetting = "24 horas";
          break;
        case 604800:
          ephemeralSetting = "7 dias";
          break;
        case 7776000:
          ephemeralSetting = "90 dias";
          break;
        case 0:
        case undefined:
        default:
          ephemeralSetting = "Desativado";
          break;
      }
      
      // Participantes
      const participants = Array.isArray(info.participants) ? info.participants : [];
      const totalAdmins = participants.filter(p => p.admin !== null).length;
      const totalParticipants = participants.length;
      
      // String final com @menções
      const caption = `
📄 *Informações do Grupo*
📌 *Nome:* ${name}
🆔 *ID:* ${groupId}
🏷️ *Menção:* ${groupTag}
👑 *Dono do Grupo:* ${groupOwnerTag}
🌎 *País do Dono:* ${ownerCountry}

👥 *Total de Membros:* ${totalMembers}
🛡️ *Total de Admins:* ${totalAdmins}/${totalParticipants}

🕒 *Criado em:* ${creationTime}
📝 *Nome definido por:* ${subjectOwnerTag}
🕘 *Nome alterado em:* ${subjectTime}

🧾 *Descrição:* 
${description}

🔗 *ID da Descrição:* ${descriptionId}
🔗 *Grupo Pai:* ${linkedParentGroupTag ? linkedParentGroupTag : linkedParentGroup}

⚙️ *Configurações:*
• Restrições: ${restrict}
• Somente Admins podem enviar: ${announce}
• Modo Comunidade: ${isCommunity}
• Comunidade Anúncio: ${isCommunityAnnounce}
• Aprovação de Entrada: ${joinApprovalMode}
• Adição de Membros: ${memberAddMode}
• Mensagens Temporárias: ${ephemeralSetting}
`.trim();
      
      await sendSuccessReact();
      await sendImageFromURL(ppURL, {
        caption,
        mentions,
        contextInfo: {
        groupMentions
      }
      });
      
    } catch (error) {
      bxssdxrkLog(`Erro no comando ${commandName}: ${error}`, "Group Info", "error");
    }
  },
};