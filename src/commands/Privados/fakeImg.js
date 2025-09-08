const { prefix, tempDir, stickerMetadata } = require(`${BASE_DIR}/config`);
const { bxssdxrkLog } = require(`${BASE_DIR}/utils`);
const fs = require("fs");
const path = require("path");
const {
  convertMediaToSticker,
  convertMediaToStickerC,
  convertMediaToStickerX,
} = require(`${BASE_DIR}/utils/stickerUtils`);

// Carrega metadata para sticker (packname e author)
async function loadStickerMetadata() {
  return {
    packname: stickerMetadata.packName,
    author: stickerMetadata.author,
  };
}

// Valida se o tipo MIME ou extensão de arquivo é compatível com sticker
function isValidMedia(mimeType = "", fileName = "") {
  const validMimeTypes = [
    "image/jpeg", "image/png", "image/gif", "image/avif",
    "image/webp", "video/mp4", "video/webm",
  ];
  const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".mp4", ".webm"];

  return (
    validMimeTypes.includes(mimeType) ||
    validExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
  );
}

module.exports = {
  name: "Fazer Imagem Fake",
  description: "Cria uma imagem que muda ao ser baixada",
  commands: ["fakeimg"],
  usage: `${prefix}fakeimg <mídia>`,

  handle: async ({
    args,
    webMessage,
    socket,
    isImage,
    isVideo,
    isDocument,
    sendReply,
    downloadMedia,
    getMediaMsg,
    deleteFilesSync,
    sendImageFromBuffer,
    sendErrorReply,
    sendWarningReply,
    sendSuccessReact,
    sendWaitReact,
  }) => {
    await sendWaitReact();
    
    if (!isImage) {
      return await sendErrorReply("Você precisa escolher uma imagem!");
    }
    try {
      const mediaMsg = getMediaMsg(webMessage);
      if (!mediaMsg) {
        return await sendErrorReply("Nenhuma mídia válida encontrada.");
      }
      
      const inputPath = await downloadMedia(mediaMsg, `input-${Date.now()}`);
      const buffer = fs.readFileSync(inputPath);
      
      /*
      ToDo:
      - Permitir escolher thumbnail fixa (sempre será a mesma thumb)
      - Permitir escolher thumbnail diferente (usa o comando 2 vezes para gerar 1 imagem)
      - Permitir adicionar legenda na imagem
      */
      
      // Por enquanto você só pode alterar a imagem fake padrão usando o comando "mek" em alguma imagem, copiando o jpegThumbnail eccolando no lugar desse aí de baixo :p
      await sendImageFromBuffer(buffer, {
        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEAASAMBIgACEQEDEQH/xAAxAAACAwEBAAAAAAAAAAAAAAAEBQACAwYBAQADAQEBAAAAAAAAAAAAAAAAAQMCBAX/2gAMAwEAAhADEAAAAOlFKRGvSkGaZUX0Bw45Fma6mAx4MRvk2aj2qwzYC+pBNb7epdtCJThsGZ4HPsabS6FplSdTWHEkNySahAyl3JaZ6LeHoZBi4evx9IWkLaYwSNf/xAAkEAACAgICAgIDAQEAAAAAAAABAgADBBESIRAxBTITIlFxQf/aAAgBAQABPwCZtrU41jr7AnxuRktca7m3teU+UuenFLodGX5+VtOFn1QEw/I5mQ6LWdHUyc3LJrRWCEJtphZQuoRnYcvPyOSz02IBMSxzfyG/pqZluSWetyxU+pYChIIPaQo9ZGwe1h5LxLA9pMXYpSYTMQwJjfUy3XMwAL2AIf3I5ajJttajVD1sbhUf9AmpiVlE79nxk1fjc+EWpaeZWDLxlbpTK2ov5cVloCuQvqDZYCJ9V/zxl18k5eEAfGIH8gpQCYtYRXaP25mJT7Zh5IBGjLcdefRlapWOIaWBeZ0ZWgevQOhBjVgjqAa8tcWJ10BC36EwXJxiVApz5dRrylhNZ0JTba6BzqA7APhvqf8AIp9wdoZpVYkiPnow4KTxEa9Ov5MfOp/Eic+4mdSikFoM2huGj9jqf//EACERAQABAwIHAAAAAAAAAAAAAAEQAAIRAxIEICIxMkFR/9oACAECAQE/AKzCw8260fIgI4q+63aD3oM1pHSL8r3H/8QAHBEAAgMAAwEAAAAAAAAAAAAAAQIAAxEQEiFB/9oACAEDAQE/AFUtuQpi7sKxKwxzYy9WIlBGkSxuoBAhtPmCA6NjHWJit1YGWMGUZCwwR7dXF4qUHTAB7HPpnwcf/9k="
      });
      
      await deleteFilesSync(inputPath);
      
      return await sendSuccessReact();
    } catch (err) {
      bxssdxrkLog(err);
      return await sendErrorReply("Erro ao criar a figurinha. Veja o motivo no console.");
    }
  },
};