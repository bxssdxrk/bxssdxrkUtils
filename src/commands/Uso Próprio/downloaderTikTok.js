const { prefix } = require(`${BASE_DIR}/config`);
const { bxssdxrkLog } = require(`${BASE_DIR}/utils`);
const axios = require('axios');

const baseUrl = `https://abhi-api.vercel.app/api/download/tiktok?url=`;

async function downloadTikTok(url) {
  if (!url) throw new Error('Você deve passar um link.');
  
  if (!url.startsWith('http') || !url.includes('tiktok')) throw new Error('Não é um link válido do tiktok!');
  try {
    const { data } = await axios.get(`${baseUrl}${encodeURIComponent(url)}`, { timeout: 15000 });
    return data.result;
  } catch {
    throw new Error('Erro na API ou link inválido.');
  }
}

async function shortenURL(longUrl) {
  try {
    const { data } = await axios.get('https://is.gd/create.php', {
      params: {
        format: 'simple',
        url: longUrl
      }
    });
    if (!data) throw new Error('Sem resultado!');
    return data;
  } catch (error) {
    throw new Error('Erro ao encurtar a URL: ' + error.message);
  }
}

module.exports = {
  name: "Downloader TikTok",
  description: "Baixa um vídeo do TikTok (Este comando pode ficar indisponível futuramente devido á API.)",
  commands: ["tiktokdl", "ttkdl", "tikdl"],
  usage: `${prefix}tiktokdl <link do tiktok>`,
  handle: async ({
    args,
    sendWaitReact,
    sendWarningReply,
    sendErrorReply,
    sendVideoFromURL,
    sendVideoFromURLWithButtons,
    sendImageFromURLWithButtons,
    sendAudioFromURLWithButtons,
    sendSuccessReact
  }) => {
    await sendWaitReact();
    const videoUrl = args[0];
    
    try {
      if (!videoUrl) {
        return await sendWarningReply("Você precisa passar um link.");
      }
      const result = await downloadTikTok(videoUrl);
      const noWatermark = await shortenURL(result.watermark) || result.watermark;
      const watermark = await shortenURL(result.nowm) || result.nowm;
      const thumbnail = await shortenURL(result.thumbnail) || result.thumbnail;
      const audio = await shortenURL(result.audio) || result.audio;
      let caption = `*Autor:* ${result.author}\n\n*Descrição:* ${result.title}`;
      const buttons = [
        { text: `Thumbnail`, id: `?sendfromurl ${thumbnail} | image`},
        { text: `Áudio`, id: `?sendfromurl ${audio} | audio`},
        { text: `Sem marca D'água`, id: `?sendfromurl ${noWatermark} | video`},
        { text: `Com marca D'água`, id: `?sendfromurl ${watermark} | video`},
      ];
      await sendVideoFromURLWithButtons(result.watermark, { buttons, caption });
     return await sendSuccessReact();
    } catch (error) {
      bxssdxrkLog("Erro ao baixar TikTok:", "tiktokdl", "error");
      await sendErrorReply(error.message);
    }
  }
};