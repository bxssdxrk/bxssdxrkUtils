const { prefix } = require(`${BASE_DIR}/config`);
const { bxssdxrkLog } = require(`${BASE_DIR}/utils`);

function detectType(url) {
  try {
    const tokenMatch = url.match(/token=([^&]+)/);
    
    if (tokenMatch) {
      const token = tokenMatch[1];
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      
      if (decoded.filename) {
        const filename = decoded.filename.toLowerCase();
        if (filename.match(/\.(jpg|jpeg|png|heic|webp|gif|avif|bmp)$/i)) return "imagem";
        if (filename.match(/\.(mp4|mov|avi|mkv|webm)$/i)) return "vídeo";
      }

      if (decoded.url) {
        const internalUrl = decoded.url.toLowerCase();
        
        if (internalUrl.match(/\.(jpg|jpeg|png|heic|webp|gif|avif|bmp)($|\?)/i)) return "imagem";
        if (internalUrl.match(/\.(mp4|mov|avi|mkv|webm)($|\?)/i)) return "vídeo";
      }
    }
    
    const base = url.split("?")[0].toLowerCase();
    
    if (base.match(/\.(jpg|jpeg|png|heic|webp|gif|avif|bmp)$/i)) return "imagem";
    if (base.match(/\.(mp4|mov|avi|mkv|webm)$/i)) return "vídeo";
    if (url.includes("dst-jpg") || url.includes("e35_s") || url.includes("stp=dst-jpg")) return "imagem";
    if (url.includes("dst-mp4") || url.includes("mp4?") || url.includes("video")) return "vídeo";
    return "unknown";
  } catch (error) {
    const base = url.split("?")[0].toLowerCase();
    if (base.match(/\.(jpg|jpeg|png|heic|webp|gif|avif|bmp)$/i)) return "imagem";
    if (base.match(/\.(mp4|mov|avi|mkv|webm)$/i)) return "vídeo";
    if (url.includes("dst-jpg") || url.includes("stp=dst-jpg")) return "imagem";
    if (url.includes("dst-mp4") || url.includes("mp4?")) return "vídeo";
    return "unknown";
  }
}

module.exports = {
  name: "Instagram Downloader",
  description: "Baixa vídeo ou imagem do Instagram",
  commands: ["igdl"],
  usage: `${prefix}igdl <link>`,
  handle: async ({
    sendWaitReact,
    sendErrorReply,
    sendSuccessReact,
    fullArgs,
    sendVideoFromURL,
    sendImageFromURL,
    sendAlbumMessage,
    args,
    nekoLabs,
    socket,
    remoteJid,
    webMessage,
  }) => {
    await sendWaitReact();
    try {
      if (!args[0]) return sendErrorReply("Envie o link do post do Instagram!");

      const resp = await nekoLabs({
        endpoint: "downloader/instagram",
        content: { url: args[0] },
      });
      

      const downloadUrl = resp.downloadUrl || resp.url || [];
      
      
      const meta = resp.metadata || resp.metadata?.metadata || {};

      if (!downloadUrl || !Array.isArray(downloadUrl) || !downloadUrl.length)
        return sendErrorReply(`Nenhum link de mídia encontrado.`);

      const captionParts = [];
      if (meta.username) captionParts.push(`*Usuário:* ${meta.username}`);
      if (meta.like) captionParts.push(`*Curtidas:* ${meta.like.toLocaleString('pt-BR')}`);
      if (meta.comment) captionParts.push(`*Comentários:* ${meta.comment.toLocaleString('pt-BR')}`);
      if (meta.caption) captionParts.push(`*Descrição:* ${meta.caption}`);
      const caption = captionParts.join("\n");

      const media = [];
      const unknownMediaType = [];
      for (const url of downloadUrl) {
        const type = await detectType(url);
        if (type === "imagem") media.push({ image: { url: url } });
        else if (type === "vídeo") media.push({ video: { url: url } });
        else if (type === "unknown") unknownMediaType.push(url);
      }

      if (!media.length) return sendErrorReply(`Nenhuma mídia válida encontrada. ${unknownMediaType.length} desconhecida(s).`);

      if (media.length === 1) {
        const unique = media[0];
        if (unique.image) return sendImageFromURL(unique.image.url, { caption });
        if (unique.video) return sendVideoFromURL(unique.video.url, { caption });
      }
      

      await sendAlbumMessage(media);
      await sendSuccessReact();

    } catch (error) {
      console.log(error);
      await bxssdxrkLog(error?.message, module?.exports?.name, "error");
      await sendErrorReply(error?.message || error);
    }
  },
};