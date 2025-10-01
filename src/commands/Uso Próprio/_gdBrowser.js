/*
  Fiz esse comando só por diversãokkkkkkkkkkk tava com preguiça de formatar os textos e emojis direitinho, então pedi pra IA fazer isso
  
  Se você quiser usar/testar esse comando, é só apagar o _ do nome do arquivo e reiniciar o script
*/

const { prefix } = require(`${BASE_DIR}/config`);
const axios = require('axios');
const BASE_URL = 'https://gdbrowser.com/api';

// Função para formatar números com separadores
function formatNumber(num) {
  return num?.toLocaleString('pt-BR') || '0';
}

// Função para obter emoji de dificuldade
function getDifficultyEmoji(difficulty) {
  const emojis = {
    'Auto': '🤖',
    'Easy': '😃', 
    'Normal': '🙂',
    'Hard': '😠',
    'Harder': '😡',
    'Insane': '😫',
    'Easy Demon': '😈',
    'Medium Demon': '👿',
    'Hard Demon': '👺',
    'Insane Demon': '💀',
    'Extreme Demon': '☠️'
  };
  return emojis[difficulty] || '🫥';
}

// Função para converter segundos em tempo legível
function formatTime(seconds) {
  if (!seconds || seconds === 0) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

async function buscarPerfil(username) {
  if (!username) throw new Error('Você precisa passar o nome do jogador.');
  const { data } = await axios.get(`${BASE_URL}/profile/${encodeURIComponent(username)}`);
  return data;
}

async function buscarLevel(levelId) {
  if (!levelId) throw new Error('Você precisa passar o ID do nível.');
  const { data } = await axios.get(`${BASE_URL}/level/${levelId}`);
  return data;
}

async function pesquisarLevels(termo) {
  if (!termo) throw new Error('Você precisa passar uma palavra-chave para pesquisar.');
  const { data } = await axios.get(`${BASE_URL}/search/${encodeURIComponent(termo)}`);
  return data;
}

function formatarPerfil(perfil) {
  const moderatorText = perfil.moderator === 2 ? ' 👑 (RobTop)' : perfil.moderator === 1 ? ' 🛡️ (Moderador)' : '';
  
  const classicDemons = perfil.classicDemonsCompleted;
  const platformerDemons = perfil.platformerDemonsCompleted;
  const classicLevels = perfil.classicLevelsCompleted;
  const platformerLevels = perfil.platformerLevelsCompleted;
  
  let resultado = `🎮 *PERFIL DE: ${perfil.username}*${moderatorText}\n`;
  resultado += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Stats principais
  resultado += `📊 *ESTATÍSTICAS PRINCIPAIS*\n`;
  resultado += `🏆 Rank Global: #${formatNumber(perfil.rank)}\n`;
  resultado += `⭐ Stars: ${formatNumber(perfil.stars)}\n`;
  resultado += `💎 Diamonds: ${formatNumber(perfil.diamonds)}\n`;
  resultado += `🪙 Coins: ${formatNumber(perfil.coins)}\n`;
  resultado += `👤 User Coins: ${formatNumber(perfil.userCoins)}\n`;
  resultado += `😈 Demons: ${formatNumber(perfil.demons)}\n`;
  resultado += `🌙 Moons: ${formatNumber(perfil.moons)}\n`;
  resultado += `🏅 Creator Points: ${formatNumber(perfil.cp)}\n\n`;
  
  // Demons completados
  if (classicDemons) {
    resultado += `👹 *DEMONS CLÁSSICOS COMPLETADOS*\n`;
    resultado += `🟢 Easy: ${classicDemons.easy || 0}\n`;
    resultado += `🟡 Medium: ${classicDemons.medium || 0}\n`;
    resultado += `🔴 Hard: ${classicDemons.hard || 0}\n`;
    resultado += `🟣 Insane: ${classicDemons.insane || 0}\n`;
    resultado += `☠️ Extreme: ${classicDemons.extreme || 0}\n`;
    resultado += `📅 Weekly: ${classicDemons.weekly || 0}\n`;
    resultado += `🎯 Gauntlet: ${classicDemons.gauntlet || 0}\n\n`;
  }
  
  if (platformerDemons && Object.values(platformerDemons).some(v => v > 0)) {
    resultado += `🏃 *DEMONS PLATFORMER COMPLETADOS*\n`;
    resultado += `🟢 Easy: ${platformerDemons.easy || 0}\n`;
    resultado += `🟡 Medium: ${platformerDemons.medium || 0}\n`;
    resultado += `🔴 Hard: ${platformerDemons.hard || 0}\n`;
    resultado += `🟣 Insane: ${platformerDemons.insane || 0}\n`;
    resultado += `☠️ Extreme: ${platformerDemons.extreme || 0}\n\n`;
  }
  
  // Levels clássicos completados
  if (classicLevels) {
    resultado += `🎮 *LEVELS CLÁSSICOS COMPLETADOS*\n`;
    resultado += `🟢 Auto: ${classicLevels.auto || 0}\n`;
    resultado += `🟡 Easy: ${classicLevels.easy || 0}\n`;
    resultado += `🔵 Normal: ${classicLevels.normal || 0}\n`;
    resultado += `🟠 Hard: ${classicLevels.hard || 0}\n`;
    resultado += `🔴 Harder: ${classicLevels.harder || 0}\n`;
    resultado += `🟣 Insane: ${classicLevels.insane || 0}\n`;
    resultado += `📅 Daily: ${classicLevels.daily || 0}\n`;
    resultado += `🎯 Gauntlet: ${classicLevels.gauntlet || 0}\n\n`;
  }
  
  // Levels platformer completados
  if (platformerLevels && Object.values(platformerLevels).some(v => v > 0)) {
    resultado += `🏃 *LEVELS PLATFORMER COMPLETADOS*\n`;
    resultado += `🟢 Auto: ${platformerLevels.auto || 0}\n`;
    resultado += `🟡 Easy: ${platformerLevels.easy || 0}\n`;
    resultado += `🔵 Normal: ${platformerLevels.normal || 0}\n`;
    resultado += `🟠 Hard: ${platformerLevels.hard || 0}\n`;
    resultado += `🔴 Harder: ${platformerLevels.harder || 0}\n`;
    resultado += `🟣 Insane: ${platformerLevels.insane || 0}\n`;
    resultado += `📅 Daily: ${platformerLevels.daily || 0}\n\n`;
  }
  
  // Ícones e customização
  resultado += `🎨 *CUSTOMIZAÇÃO*\n`;
  resultado += `🔷 Ícone: ${perfil.icon}\n`;
  resultado += `🚢 Nave: ${perfil.ship}\n`;
  resultado += `⚽ Bola: ${perfil.ball}\n`;
  resultado += `🛸 UFO: ${perfil.ufo}\n`;
  resultado += `〰️ Wave: ${perfil.wave}\n`;
  resultado += `🤖 Robot: ${perfil.robot}\n`;
  resultado += `🕷️ Spider: ${perfil.spider}\n`;
  resultado += `🏃 Swing: ${perfil.swing}\n`;
  resultado += `🎒 Jetpack: ${perfil.jetpack}\n`;
  resultado += `💀 Death Effect: ${perfil.deathEffect}\n`;
  resultado += `✨ Glow: ${perfil.glow ? 'Sim' : 'Não'}\n\n`;
  
  // Cores RGB
  if (perfil.col1RGB || perfil.col2RGB) {
    resultado += `🌈 *CORES*\n`;
    if (perfil.col1RGB) {
      resultado += `🎨 Cor 1: RGB(${perfil.col1RGB.r}, ${perfil.col1RGB.g}, ${perfil.col1RGB.b})\n`;
    }
    if (perfil.col2RGB) {
      resultado += `🖌️ Cor 2: RGB(${perfil.col2RGB.r}, ${perfil.col2RGB.g}, ${perfil.col2RGB.b})\n`;
    }
    if (perfil.colGRGB) {
      resultado += `💫 Cor Glow: RGB(${perfil.colGRGB.r}, ${perfil.colGRGB.g}, ${perfil.colGRGB.b})\n`;
    }
    resultado += `\n`;
  }
  
  // Configurações sociais
  resultado += `📱 *REDES SOCIAIS & CONFIGURAÇÕES*\n`;
  resultado += `🎥 YouTube: ${perfil.youtube ? `https://youtube.com/channel/${perfil.youtube}` : '—'}\n`;
  resultado += `🐦 Twitter: ${perfil.twitter ? `@${perfil.twitter}` : '—'}\n`;
  resultado += `🟣 Twitch: ${perfil.twitch ? `twitch.tv/${perfil.twitch}` : '—'}\n`;
  resultado += `👥 Pedidos de Amizade: ${perfil.friendRequests ? 'Habilitado' : 'Desabilitado'}\n`;
  resultado += `💬 Mensagens: ${perfil.messages || 'N/A'}\n`;
  resultado += `📝 Histórico de Comentários: ${perfil.commentHistory || 'N/A'}\n`;
  
  return resultado;
}

function formatarLevel(level) {
  const diffEmoji = getDifficultyEmoji(level.difficulty);
  const lengthEmojis = {
    'Tiny': '🔹',
    'Short': '🔸', 
    'Medium': '🔶',
    'Long': '🔷',
    'XL': '💎',
    'Platformer': '🏃'
  };
  
  let resultado = `📄 *${level.name}*\n`;
  resultado += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Info básica
  resultado += `🆔 ID: ${level.id}\n`;
  resultado += `👤 Autor: ${level.author}\n`;
  if (level.description) {
    resultado += `📝 Descrição: ${level.description}\n`;
  }
  resultado += `\n`;
  
  // Dificuldade e stats
  resultado += `${diffEmoji} *DIFICULDADE & ESTATÍSTICAS*\n`;
  resultado += `🎚️ Dificuldade: ${level.difficulty}\n`;
  resultado += `${lengthEmojis[level.length] || '📏'} Duração: ${level.length}\n`;
  resultado += `⭐ Stars: ${formatNumber(level.stars)}\n`;
  resultado += `🔮 Orbs: ${formatNumber(level.orbs)}\n`;
  resultado += `💎 Diamonds: ${formatNumber(level.diamonds)}\n`;
  resultado += `🪙 Coins: ${level.coins}\n`;
  if (level.coins > 0) {
    resultado += `✅ Coins Verificadas: ${level.verifiedCoins ? 'Sim' : 'Não'}\n`;
  }
  resultado += `\n`;
  
  // Downloads e likes
  resultado += `📊 *POPULARIDADE*\n`;
  resultado += `⬇️ Downloads: ${formatNumber(level.downloads)}\n`;
  resultado += `👍 Likes: ${formatNumber(level.likes)}\n`;
  if (level.featured) {
    resultado += `⭐ Featured: Sim (#${level.featuredPosition})\n`;
  }
  if (level.epic) {
    resultado += `🔥 Epic: Sim\n`;
  }
  if (level.legendary) {
    resultado += `🏆 Legendary: Sim\n`;
  }
  if (level.mythic) {
    resultado += `👑 Mythic: Sim\n`;
  }
  resultado += `\n`;
  
  // Música
  resultado += `🎵 *MÚSICA*\n`;
  resultado += `🎶 Nome: ${level.songName}\n`;
  resultado += `🎤 Artista: ${level.songAuthor}\n`;
  if (level.songSize && level.songSize !== '0MB') {
    resultado += `📦 Tamanho: ${level.songSize}\n`;
  }
  resultado += `🆔 Song ID: ${level.songID}\n`;
  resultado += `\n`;
  
  // Detalhes técnicos
  resultado += `⚙️ *DETALHES TÉCNICOS*\n`;
  resultado += `🎮 Versão do Jogo: ${level.gameVersion}\n`;
  resultado += `🏃 Platformer: ${level.platformer ? 'Sim' : 'Não'}\n`;
  resultado += `👥 Dois Jogadores: ${level.twoPlayer ? 'Sim' : 'Não'}\n`;
  resultado += `🔧 Objetos: ${formatNumber(level.objects)}\n`;
  resultado += `📅 Versão do Level: ${level.version}\n`;
  if (level.editorTime > 0) {
    resultado += `⏱️ Tempo no Editor: ${formatTime(level.editorTime)}\n`;
  }
  if (level.copiedID && level.copiedID !== '0') {
    resultado += `📋 Copiado de: ${level.copiedID}\n`;
  }
  resultado += `🏅 Creator Points: ${level.cp}\n`;
  
  // Demon List position se existir
  if (level.demonList) {
    resultado += `👹 Posição na Demon List: #${level.demonList}\n`;
  }
  
  return resultado;
}

module.exports = {
  name: "GDBrowser",
  description: "Busca informações completas de Geometry Dash",
  commands: ["gdbrowser", "gd"],
  usage: `${prefix}gdbrowser <player|level|levels> <info>`,
  handle: async ({
    args,
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
    sendSuccessReply,
    sendTextWithButtons
  }) => {
    await sendWaitReact();
    try {
      if (!args[0]) return await sendErrorReply("Você precisa especificar o tipo (player/level/levels).");
      if (!args[1]) return await sendErrorReply("Você precisa passar a informação para buscar.");

      const type = args[0].toLowerCase();
      const info = args[1];

      switch (type) {
        case "player":
        case "jogador":
        case "user": {
          const perfil = await buscarPerfil(info);
          const resultado = formatarPerfil(perfil);
          return await sendSuccessReply(resultado);
        }

        case "id":
        case "level":
        case "nivel":
        case "nível":
        case "lvl": {
          const level = await buscarLevel(info);
          const resultado = formatarLevel(level);
          return await sendSuccessReply(resultado);
        }

        case "levels":
        case "nivels":
        case "nívels":
        case "niveis":
        case "níveis":
        case "lvls": {
          const pesquisa = await pesquisarLevels(info);
          if (!Array.isArray(pesquisa) || pesquisa.length === 0) {
            return await sendErrorReply("Nenhum level encontrado.");
          }

          let resultadoPesquisa = `🔎 *RESULTADOS PARA: ${info.toUpperCase()}*\n`;
          resultadoPesquisa += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          resultadoPesquisa += `📊 Encontrados: ${formatNumber(pesquisa.length)} levels\n\n`;

          // Cria botões com informações mais detalhadas
          const buttons = pesquisa.slice(0, 10).map(lvl => {
            const diffEmoji = getDifficultyEmoji(lvl.difficulty);
            const featuredText = lvl.featured ? ' ⭐' : '';
            const epicText = lvl.epic ? ' 🔥' : '';
            return {
              text: `${diffEmoji} ${lvl.name} (${lvl.author})${featuredText}${epicText}`,
              id: `${prefix}gdbrowser level | ${lvl.id}`
            };
          });

          return await sendTextWithButtons(resultadoPesquisa + "Selecione um level:", { buttons });
        }

        default:
          return await sendErrorReply("Tipo inválido. Use player, level ou levels.");
      }
    } catch (e) {
      console.error('Erro GDBrowser:', e.message);
      return await sendErrorReply("Erro ao buscar informações. Verifique se o nome/ID está correto ou tente novamente mais tarde.");
    }
  }
};