const { prefix } = require(`${BASE_DIR}/config`);  
const { bxssdxrkLog } = require(`${BASE_DIR}/utils`);  
  
module.exports = {  
  name: "TikTok Downloader",  
  description: "Baixa um vídeo ou áudio do TikTok",  
  commands: ["tikdl"],  
  usage: `${prefix}tikdl <link> [video|audio] ou [video|audio] <link>`,  
  handle: async ({   
    sendWaitReact,  
    sendErrorReply,  
    sendSuccessReact,  
    fullArgs,  
    sendAlbumMessage,
    sendVideoFromURL,
    sendAudioFromURL,
    args,  
    nekoLabs,  
  }) => {  
    await sendWaitReact();  
    try {  
      const allArgs = fullArgs.split(' ');  
      
      const normalizeText = (text) => {
        return text.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
      };
      
      let url = null;
      let type = 'video'; // padrão
      
      for (const arg of allArgs) {
        const normalized = normalizeText(arg);
        
        if (arg.includes('http') || arg.includes('tiktok')) {
          url = arg;
        } else if (normalized === 'audio' || normalized === 'video') {
          type = normalized;
        }
      }
      
      if (!url) {
        return await sendErrorReply('Por favor, forneça um link do TikTok.');
      }
        
      const resp = await nekoLabs({  
        endpoint: 'downloader/tiktok',  
        content: {  
          url: url  
        }  
      });
      
      const isAudio = type === 'audio';
        
      const caption = [  
        `— *Vídeo:*`,  
        `- *Link:* ${url}`,  
        `- *Publicado em:* ${resp.create_at || "Data desconhecida"}`,  
        `- *Visualizações:* ${resp.stats?.play || "0"}`,  
        `- *Curtidas:* ${resp.stats?.like || "0"}`,  
        `- *Comentários:* ${resp.stats?.comment || "0"}`,  
        `- *Compartilhamentos:* ${resp.stats?.share || "0"}`,  
        `- *Autor:* ${resp.author?.name || "Desconhecido"} (${resp.author?.username || "?"})`,  
        `- *Título:* ${resp.title || "Sem título"}`,  
        '',  
        `— *Música:*`,  
        `- *Título:* ${resp.music_info?.title || "Desconhecida"}`,  
        `- *Autor:* ${resp.music_info?.author || ""}`,  
      ].join('\n');  
  
      // Verifica se há imagens no resultado
      if (resp.images && Array.isArray(resp.images) && resp.images.length > 0) {
        const albumMedias = resp.images.map((imageUrl, index) => {
          if (index === 0) {
            // Primeira imagem com caption
            return { image: { url: imageUrl }, caption: caption };
          } else {
            // Demais imagens sem caption
            return { image: { url: imageUrl } };
          }
        });
        
        await sendAlbumMessage(albumMedias);
      } else if (isAudio) {
        await sendAudioFromURL(resp?.musicUrl);
      } else {
        await sendVideoFromURL(resp?.videoUrl, { caption });
      }
      
      await sendSuccessReact();  
  
    } catch (error) {  
      await bxssdxrkLog(error?.message, module?.exports?.name, "error");  
      await sendErrorReply(error);  
    }  
  }  
};