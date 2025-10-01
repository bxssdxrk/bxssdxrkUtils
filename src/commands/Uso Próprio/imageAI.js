const { prefix, tempDir } = require(`${BASE_DIR}/config`);
const fs = require("fs");  
const path = require("path");  
const axios = require('axios');

async function ai4chat(prompt, ratio = '1:1') {
    const _ratio = ['1:1', '16:9', '2:3', '3:2', '4:5', '5:4', '9:16', '21:9', '9:21'];
    
    if (!prompt) throw new Error('Você precisa dizer o que quer gerar!');
    if (!_ratio.includes(ratio)) throw new Error(`Proporção inválida!\nProporções disponíveis: ${_ratio.join(', ')}`);
    const { data } = await axios.get('https://www.ai4chat.co/api/image/generate', {
        params: {
            prompt: prompt,
            aspect_ratio: ratio
        },
        headers: {
            accept: '*/*',
            'content-type': 'application/json',
            referer: 'https://www.ai4chat.co/image-pages/realistic-ai-image-generator',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    return data.image_link;
}
  
module.exports = {
  name: "Gerar imagem com IA",
  description: "Gera uma ou mais imagens usando IA.",
  commands: ["img"],
  usage: `${prefix}img <prompt> | <quantidade> | <proporção> (é obrigatório separar com "|")`,
  handle: async ({
    args,
    socket,
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
    sendAlbumMessage,
    webMessage,
    remoteJid,
    userJid
    }) => {
    await sendWaitReact();  
    
    const prompt = args[0] ? args[0] : `A really cute baby kitty looking happy to the camera. Below the cat, the text written ":3".`;
    const outputAmount = args[1] ? args[1] : 1;
    const ratio = args[2] ? args[2] : '1:1';
    try {
      const imageLinks = await Promise.all(
        Array.from({ length: outputAmount }, () => ai4chat(prompt, ratio))
      );
      
      const albumContent = imageLinks.map((link, index) => ({
        image: { url: link },
        caption: imageLinks.length > 1 ? `Imagem ${index + 1}` : null
      }));
      
      await sendAlbumMessage(albumContent);
      
      await sendSuccessReact();
    } catch (error) {
      await sendErrorReply(error);
    }  
  },  
};