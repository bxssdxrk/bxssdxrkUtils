const { prefix } = require(`${BASE_DIR}/config`);
const path = require("path");
const { splitVideo } = require(`${BASE_DIR}/utils/bxssdxrkUtils`);

module.exports = {
  name: "Split Video [INSTÁVEL]",
  description: "Divide um vídeo em segmentos de X segundos. *ESTE COMANDO É INSTÁVEL:* Este comando pode consumir MUITO processamento do seu dispositivo se usado com videos pesados. Causando até mesmo a demora do bxssdxrkUtils de receber comandos. Use com cautela e em videos leves. Caso esteja demorando demais, reinicie o script no console com CTRL + C, e depois 'npm start'",
  commands: ["split", "splitvideo", "cortar"],
  usage: `${prefix}split <segundos>`,
  handle: async ({
    downloadMedia,
    deleteFilesSync,
    bxssdxrkLog,
    getMediaMsg,
    sendErrorReply,
    sendReply,
    sendWaitReact,
    webMessage,
    args
  }) => {
    await sendWaitReact();
    let videoPath;

    try {
      const seconds = parseInt(args[0]) || 90;
      if (isNaN(seconds) || seconds <= 0) {
        return await sendErrorReply("O tempo deve ser um número maior que zero.");
      }

      const mediaMsg = getMediaMsg(webMessage);
      if (!mediaMsg) {
        return await sendErrorReply("Nenhum vídeo encontrado na mensagem ou citação.");
      }

      await sendReply(`Preparando para dividir o vídeo em segmentos de ${seconds}s... O vídeo dividido será salvo em "Download/bxssdxrkUtils/splitVideo" e será avisado somente no console quando concluir.`);

      videoPath = await downloadMedia(mediaMsg, `splitvideo-${Date.now()}`);
      if (!videoPath) {
        return await sendErrorReply("Falha ao baixar o vídeo.");
      }

      await splitVideo(videoPath, seconds);
    } catch (err) {
      bxssdxrkLog(`Erro no comando splitVideo: ${err.message}`, "splitVideo", "error");
      await sendErrorReply(`Erro ao dividir o vídeo: ${err.message}`);
    }
    deleteFilesSync(videoPath);
  }
};