const { prefix } = require(`${BASE_DIR}/config`);
const axios = require('axios');

async function isValidUrl(url) {
  try {
    new URL(url);

    const config = {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      validateStatus: (status) => status < 500,
      maxRedirects: 5
    };

    try {
      await axios.head(url, config);
      return true;
    } catch (headError) {
      try {
        await axios.get(url, {
          ...config,
          timeout: 15000,
          maxContentLength: 1024,
          maxBodyLength: 1024
        });
        return true;
      } catch (getError) {
        return false;
      }
    }
    
  } catch (error) {
    return false;    
  }
}

async function shortenURL(longUrl) {
  
  if (!longUrl) {
    throw new Error('Você deve passar um URL para encurtar!');
  }
  
  const isValid = await isValidUrl(longUrl);
  
  if (!isValid) {
    throw new Error('URL não é válida ou não está acessível.');
  }
  
  try {
    const { data } = await axios.get('https://is.gd/create.php', {
      params: {
        format: 'simple',
        url: longUrl
      }
    });
    
    return data;
  } catch (error) {
    throw new Error('Erro ao encurtar a URL: ' + error.message);
  }
}

module.exports = {
  name: "Encurtar URL",
  description: "Encurta um URL rapidamente.",
  commands: ["short", "encurtar"],
  usage: `${prefix}short <URL>`,
  handle: async ({
    args,
    sendWaitReact,
    sendSuccessReply,
    sendErrorReply,
  }) => {
    await sendWaitReact();
    const longUrl = args[0] ? args[0] : "https://github.com/bxssdxrk/bxssdxrkUtils";
    try {
      const shortURL = await shortenURL(longUrl);
      await sendSuccessReply(shortURL);
    } catch (error) {
      return await sendErrorReply(error.message);
    }
  }
};