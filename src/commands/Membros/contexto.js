const axios = require("axios");
const { prefix } = require(`${BASE_DIR}/config`);
const { bxssdxrkLog } = require(`${BASE_DIR}/utils`);
const { initialGameData, gameApi, getDistance, getTip, guessWord, getResult, calculateNextTipDistance } = require(`${BASE_DIR}/utils/contextoGame`);

const activeGames = {}; // Armazena sessões por remoteJid

const getEmojiByDistance = (distance) => {
  if (distance <= 300) return "🟩";
  if (distance <= 1500) return "🟧";
  return "🟥";
};

const padWord = (word, totalLength = 15) => {
  const spaces = " ".repeat(Math.max(totalLength - word.length, 1));
  return word + spaces;
};

const summarizeColors = (history) => {
  const counts = { green: 0, orange: 0, red: 0 };
  for (const [_, distance] of history) {
    if (distance <= 299) counts.green++;
    else if (distance <= 1499) counts.orange++;
    else counts.red++;
  }
  return `\n🟩 ${counts.green}\n🟧 ${counts.orange}\n🟥 ${counts.red}`;
};

// Gera um gameId aleatório entre 0 e 1450 por sessão
const getCurrentGameId = async (remoteJid) => {
  if (!activeGames[remoteJid]?.gameId) {
    const randomGameId = Math.floor(Math.random() * 1451); // 0–1450
    return randomGameId;
  }
  return activeGames[remoteJid].gameId;
};

// Monta a lista completa das tentativas, ordenada por distância (menor -> maior), sem numeração
const formatGuessHistory = (history, lastGuess) => {
  if (!history.length) return "Nenhuma palavra jogada ainda.";

  const sorted = [...history].sort((a, b) => a[1] - b[1]);

  return sorted
    .map(([lemma, distance]) => {
      const emoji = getEmojiByDistance(distance);
      const highlighted =
        lastGuess && lemma === lastGuess[0] ? `✨${lemma}✨` : lemma;
      return `${emoji} ${padWord(highlighted)} ${distance}`;
    })
    .join("\n");
};

module.exports = {
  name: "Contexto",
  description: "Jogo do Contexto — adivinhe a palavra secreta!",
  commands: ["contexto", "ctx"],
  usage: `${prefix}contexto <play/tip/giveup> [palavra]`,
  handle: async ({ 
    sendWaitReact, 
    sendSuccessReply, 
    sendErrorReply, 
    sendSuccessReact, 
    sendErrorReact, 
    remoteJid, 
    args,
    commandName,
    sendTextWithButtons
  }) => {
    await sendWaitReact();
    
    const buttons = [
      { text: 'Desistir', id: `${prefix}${commandName} sys | giveup`},
      { text: 'Dica', id: `${prefix}${commandName} sys | tip`}
    ];

    try {
      if (!args.length) {
        return await sendErrorReply(`Use: ${prefix}contexto play <palavra> | tip | giveup`);
      }

      const userWord = args[0]?.toLowerCase();
      const action = args[1]?.toLowerCase();

      // Cria sessão nova se não existir
      if (!activeGames[remoteJid]) {
        const gameId = await getCurrentGameId(remoteJid);
        activeGames[remoteJid] = { ...initialGameData, gameId };
      }

      const game = activeGames[remoteJid];
      const api = gameApi("pt-br", game.gameId);

      // -------------------------
      // JOGAR UMA PALAVRA
      // -------------------------
      if (action === "play" || !action) {
        if (!userWord) return await sendErrorReply("Digite uma palavra!");

        const { lemma, distance, error } = await getDistance(api, userWord);
        if (error || distance < 0) {
          return await sendErrorReply(error);
        }

        const already = game.guessHistory.find((g) => g[0] === lemma);
        if (already) {
          await sendErrorReact();
          return await sendTextWithButtons(`A palavra "${lemma}" já foi tentada.`, { buttons });
        }

        // adiciona tentativa
        game.guessHistory.push([lemma, distance]);
        game.lastGuess = [lemma, distance];
        game.numberOfAttempts++;
        
        if (distance < game.lastClosestDistance) {
          game.lastClosestDistance = distance;
        }

        const header = `Tentativas: ${game.numberOfAttempts}\nDicas usadas: ${game.numberOfTips}\n`;
        const historyText = formatGuessHistory(game.guessHistory, game.lastGuess);

        let response = `${header}\n`;
        
        if (distance === 0) {
          game.foundWord = lemma;
          response += `\n🎉 Parabéns! Você acertou a palavra!\n`;
          response += summarizeColors(game.guessHistory);
          delete activeGames[remoteJid];
        }
        
        response += `\n${historyText}`;

        console.log(game);
        
        await sendSuccessReact();
        return await sendTextWithButtons(`\`\`\`${response}\`\`\``, { buttons });
      }

      // -------------------------
      // PEDIR DICA
      // -------------------------//
      
      if (action === "tip") {
          // if (!game.guessHistory.length) return await sendErrorReply("Faça pelo menos uma tentativa antes de pedir uma dica!");
      
          // 1. CALCULA qual distância solicitar (usando a última distância da dica).
          const nextTipDistanceToRequest = calculateNextTipDistance(game.lastClosestDistance, game.guessHistory); 
          
          // 2. SOLICITA a dica na API
          const tip = await getTip(api, nextTipDistanceToRequest);
      
          if (!tip?.lemma) {
            await sendErrorReact();
            return await sendTextWithButtons("Não foi possível obter uma dica.", { buttons });
          }
          
          // 3. PROCESSA a dica como uma tentativa (se for o comportamento esperado)
          const result = await guessWord({
              api,
              word: tip.lemma, 
              guessHistory: game.guessHistory,
              postGameHistory: game.postGameHistory,
              foundWord: game.foundWord,
              gaveUp: game.gaveUp,
              numberOfTips: game.numberOfTips,
              numberOfAttempts: game.numberOfAttempts,
              tip: tip.lemma,
              tipDistance: tip.distance,
          });
          
          if (result.error) return await sendErrorReply(result.error);
          
          // 4. ATUALIZA o estado do jogo (incluindo o número de dicas e tentativas)
          Object.assign(game, result);
          
          // 5. ATUALIZA A DISTÂNCIA DA ÚLTIMA DICA (essencial para o próximo cálculo)
          if (tip.distance < game.lastClosestDistance) {
            game.lastClosestDistance = tip.distance;
          }
      
          // ... restante do código para formatar e enviar a resposta
          const emoji = getEmojiByDistance(tip.distance);
          const header = `Tentativas: ${game.numberOfAttempts}\nDicas usadas: ${game.numberOfTips}\n`;
          const historyText = formatGuessHistory(game.guessHistory, game.lastGuess);
          const tipText = `💡 Dica: ${emoji} ${padWord(tip.lemma)} ${tip.distance}`;
          const response = `${header}\n\n${historyText}\n\n${tipText}`;
          
          await sendSuccessReact();
          return await sendTextWithButtons(`\`\`\`${response}\`\`\``, { buttons });
      }

      

      // -------------------------
      // DESISTIR
      // -------------------------
      if (action === "giveup") {
        const result = await getResult(api);
        game.gaveUp = result;

        const header = `Tentativas: ${game.numberOfAttempts}\nDicas usadas: ${game.numberOfTips}\n`;
        const historyText = formatGuessHistory(game.guessHistory, game.lastGuess);

        let response = `${header}\n${historyText}\n\n😔 Você desistiu! A palavra era: ${result}`;
        response += summarizeColors(game.guessHistory);

        delete activeGames[remoteJid];
        await sendSuccessReact();
        return await sendTextWithButtons(`\`\`\`${response}\`\`\``, { buttons });
      }
      return await sendErrorReply(`Ação inválida! Use: play | tip | giveup`);
    } catch (error) {
      console.log(error)
      await sendErrorReply("❌ Erro ao processar comando. Veja o console.");
    }
  },
};