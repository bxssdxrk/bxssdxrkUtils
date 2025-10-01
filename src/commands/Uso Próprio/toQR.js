const { prefix } = require(`${BASE_DIR}/config`);
const axios = require('axios');

function generateQRCode(text, size = 200) {
  if (!text) throw new Error('Você precisa passar um texto ou URL para gerar o QR Code!');
  
  if (size > 250 || size < 44) size = 147;
  
  const data = encodeURIComponent(text);
  
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${data}`;
}

module.exports = {
  name: "Gerar QR Code",
  description: "Gera um QR Code",
  commands: ["qr", "qrcode", "toqr"],
  usage: `${prefix}qr <URL> | <tamando>`,
  handle: async ({
    args,
    sendWaitReact,
    sendSuccessReact,
    sendImageFromURL,
    sendErrorReply,
  }) => {
    await sendWaitReact();
    const url = args[0] ? args[0] : "https://github.com/bxssdxrk/bxssdxrkUtils";
    const size = args[1] ? args [1] : 147;
    try {
      const qrUrl = await generateQRCode(url, size);
      await sendImageFromURL(qrUrl, 
      {
        caption: `URL do QR Code: ${qrUrl}`
      });
      await sendSuccessReact();
    } catch (error) {
      return await sendErrorReply(error.message);
    }
  }
};