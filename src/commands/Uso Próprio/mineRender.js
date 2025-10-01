const { prefix } = require(`${BASE_DIR}/config`);
const axios = require('axios');

const baseUrl = "https://starlightskins.lunareclipse.studio/render";

const renderTypes = [
  { type: "default", crops: ["full", "bust", "face"] },
  { type: "marching", crops: ["full", "bust", "face"] },
  { type: "walking", crops: ["full", "bust", "face"] },
  { type: "crouching", crops: ["full", "bust", "face"] },
  { type: "crossed", crops: ["full", "bust", "face"] },
  { type: "criss_cross", crops: ["full", "bust", "face"] },
  { type: "ultimate", crops: ["full", "bust", "face"] },
  { type: "isometric", crops: ["full", "bust", "face", "head"] },
  { type: "head", crops: ["full"] },
  { type: "custom", crops: ["full", "bust", "face"] },
  { type: "cheering", crops: ["full", "bust", "face"] },
  { type: "relaxing", crops: ["full", "bust", "face"] },
  { type: "trudging", crops: ["full", "bust", "face"] },
  { type: "cowering", crops: ["full", "bust", "face"] },
  { type: "pointing", crops: ["full", "bust", "face"] },
  { type: "lunging", crops: ["full", "bust", "face"] },
  { type: "dungeons", crops: ["full", "bust", "face"] },
  { type: "facepalm", crops: ["full", "bust", "face"] },
  { type: "sleeping", crops: ["full", "bust"] },
  { type: "dead", crops: ["full", "bust", "face"] },
  { type: "archer", crops: ["full", "bust", "face"] },
  { type: "kicking", crops: ["full", "bust", "face"] },
  { type: "mojavatar", crops: ["full", "bust"] },
  { type: "reading", crops: ["full", "bust", "face"] },
  { type: "high_ground", crops: ["full", "bust", "face"] },
  { type: "clown", crops: ["full", "bust", "face"] },
  { type: "bitzel", crops: ["full", "bust", "face"] },
  { type: "pixel", crops: ["full", "bust", "face"] },
  { type: "ornament", crops: ["full"] },
  { type: "skin", crops: ["default", "processed", "barebones"] },
  { type: "profile", crops: ["full", "bust", "face"] }
];

function getRenderUrl(nick = 'BxssDxrk', renderType = 'criss_cross', crop = 'full') {
  renderType = renderType?.toLowerCase();
  crop = crop?.toLowerCase();

  const foundType = renderTypes.find(rt => rt.type === renderType);
  if (!foundType) {
    renderType = "criss_cross";
    crop = "full";
  } else if (!foundType.crops.includes(crop)) {
    crop = foundType.crops[0]; // usa o primeiro crop válido
  }

  return `${baseUrl}/${encodeURIComponent(renderType)}/${encodeURIComponent(nick)}/${crop}`;
}

async function getPlayerRender({ nick = 'BxssDxrk', renderType = 'criss_cross', crop = 'full' }) {
  if (!nick) throw new Error('Você deve especificar um nick ou UUID para renderizar.');

  const url = getRenderUrl(nick, renderType, crop);
  const { data } = await axios.get(url, { responseType: 'arraybuffer' });

  return Buffer.from(data);
}

module.exports = {
  name: "Minecraft Player Render",
  description: "Gera uma imagem renderizada do skin de um jogador de Minecraft.",
  commands: ["minerender"],
  usage: `${prefix}minerender <nick/uuid> [renderType] [crop]\n\nRender types e crops válidos: use ${prefix}minerender help para ver a lista completa.`,
  handle: async ({
    args,
    commandName,
    sendDocumentFromBuffer,
    sendImageFromBuffer,
    sendWaitReact,
    sendSuccessReact,
    sendSuccessReply,
    sendErrorReply,
    sendWarningReply,
  }) => {
    await sendWaitReact();
    
    if (!args[0]) return await sendErrorReply(`Uso incorreto! Use:\n${module.exports.usage}`);
    
    if (args[0] && args[0].toLowerCase() === "help") {
      const list = renderTypes
        .map(rt => `\n${rt.type}\n> ${rt.crops.join("\n> ")}`)
        .join("\n");
      return await sendSuccessReply(`📸 *Tipos de render e crops disponíveis:*\n${list}`);
    }
    const nick = args[0] || "bxssdxrk";  
    
    // Encontra o renderType padrão ("criss_cross") ou válido
    const defaultRenderType = "criss_cross";
    const requestedRenderType = args[1] || defaultRenderType;
    const renderTypeConfig = renderTypes.find(rt => rt.type === requestedRenderType);
    const finalRenderType = renderTypeConfig ? requestedRenderType : defaultRenderType;
    
    // Determina o crop padrão baseado no renderType
    let defaultCrop;
    if (finalRenderType === "skin") {
        defaultCrop = "default";
    } else {
        defaultCrop = "full";
    }
    
    // Valida o crop solicitado
    const requestedCrop = args[2];
    let finalCrop = defaultCrop;
    
    if (renderTypeConfig && requestedCrop) {
        // Verifica se o crop solicitado é válido para o renderType
        if (renderTypeConfig.crops.includes(requestedCrop)) {
            finalCrop = requestedCrop;
        }
    }

    // try {
    console.log(nick, finalRenderType, finalCrop);
      const result = await getPlayerRender({ 
        nick, 
        finalRenderType, 
        finalCrop
      });
      console.log(result);
      await sendImageFromBuffer(result);
      await sendDocumentFromBuffer(result, { fileName: `${nick}-${finalRenderType}-${finalCrop}.png`,caption: `Dica: use \`${prefix}${commandName} ajuda\` para ver todos os tipos de render e crops disponíveis!` });
      await sendSuccessReact();
    // } catch (error) {
    //   await sendErrorReply(`Erro ao gerar render: ${error.message}`);
    // }
  }
};