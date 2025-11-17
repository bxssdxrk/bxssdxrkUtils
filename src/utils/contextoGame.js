// gameScreen.js
const axios = require('axios');

// --- DADOS INICIAIS ---
const initialGameData = {
  gameId: 0,
  guessHistory: [],
  lastGuess: null,
  foundWord: '',
  numberOfTips: 0,
  numberOfAttempts: 0,
  gaveUp: '',
  postGameHistory: [],
  lastClosestDistance: 1750
};

// --- API DO JOGO ---
const gameApi = (lang, gameId) => {
  const baseUrl = 'https://api.contexto.me/machado';

  const play = (word) => axios.get(`${baseUrl}/${lang}/game/${gameId}/${word}`);
  const tip = (distance) => axios.get(`${baseUrl}/${lang}/tip/${gameId}/${distance}`);
  const giveUp = () => axios.get(`${baseUrl}/${lang}/giveup/${gameId}`);
  const getClosestWords = () => axios.get(`${baseUrl}/${lang}/top/${gameId}`);

  return { play, tip, giveUp, getClosestWords };
};

// --- FUNÇÕES DE UTILIDADE ---

// Verifica se há espaços em branco em uma palavra
function containsWhitespace(str) {
  return /\s/.test(str);
}

// Retorna uma tentativa existente, caso já tenha sido usada
const getExistent = (wordParam, guessHistory, postGameHistory) => {
  let result = guessHistory.find((item) => item[0] === wordParam);
  if (!result) result = postGameHistory.find((item) => item[0] === wordParam);
  return result;
};

// --- LÓGICA DE CÁLCULO DE DICAS CORRIGIDA ---
/**
 * Calcula a próxima distância de dica baseada na regra de metade e na regra de salto.
 * 1. Aplica a regra da Metade (arredondando para cima).
 * 2. Se o resultado for 1, busca a próxima distância não-adivinhada (o "salto").
 * @param {number} lastClosestDistance - A distância da última dica recebida (ou 300 inicialmente).
 * @param {Array<[string, number]>} guessHistory - Histórico de tentativas: [palavra, distância].
 * @returns {number} A distância de dica a ser solicitada na API.
 */
const calculateNextTipDistance = (lastClosestDistance, guessHistory) => {
    // 1. Aplica a regra da Metade (arredondando para cima)
    const nextDistance = Math.ceil(lastClosestDistance / 2);
    
    // 2. Se o cálculo resultar em 1 (ou seja, a resposta seria 1, mas 1 é a palavra-chave),
    // é necessário aplicar a lógica de salto: procurar a próxima palavra não adivinhada.
    if (nextDistance <= 1) {
        // Coleta todas as distâncias que JÁ foram adivinhadas (tentadas)
        const guessedDistances = new Set(guessHistory.map(([, distance]) => distance));
        
        // Começa a buscar a partir da distância 2 (pois 1 é a resposta).
        // O limite máximo é 300 (ou 299, se você considera que 300 é o inicial e a maior palavra é 299).
        // Usaremos o limite do jogo (300).
        let potentialTipDistance = 2;
        
        // Loop que busca a próxima distância não-adivinhada
        while (potentialTipDistance < 300) {
            if (!guessedDistances.has(potentialTipDistance)) {
                // Encontramos a próxima distância que o usuário ainda não tentou.
                return potentialTipDistance;
            }
            potentialTipDistance++;
        }
        
        // Caso de fallback: se todas as palavras até 300 foram adivinhadas, retorna 300
        return 300; 
    }
    
    // 3. Retorna o resultado da divisão por 2 (a regra padrão)
    return nextDistance; 
};

// --- FUNÇÕES DE REQUISIÇÃO À API ---

// Faz requisição e retorna a distância de uma palavra
const getDistance = async (api, wordParam) => {
  let lemma = '';
  let distance = -2;
  let error = '';

  try {
    const response = await api.play(wordParam);
    
    // Destructuring seguro
    const { 
        lemma: apiLemma = '', 
        distance: apiDistance = -2, 
        error: errorFromApi = '' 
    } = response.data;

    lemma = apiLemma;
    distance = apiDistance;
    error = errorFromApi;

    // Se a API retornar um erro interno na resposta (distance < 0), 
    if (distance < 0 && !error) {
        error = 'Não foi possível obter a distância dessa palavra.';
    }

  } catch (e) {
    if (e.response?.data?.error) {
      error = e.response?.data?.error;
    } else if (e.response) {
      error = `Erro do servidor (${e.response.status}).`;
    } else if (e.request) {
      error = 'Oops, erro de conexão com o servidor (timeout ou rede).';
    } else {
      error = 'Erro inesperado ao processar a resposta da API.';
    }
  }

  return { lemma, distance, error };
};

// Solicita uma dica da API
const getTip = async (api, tipDistance) => {
  const response = await api.tip(tipDistance);
  const { lemma, distance } = await response.data;
  return { lemma, distance };
};

// Pede a resposta correta ao desistir
const getResult = async (api) => {
  const response = await api.giveUp();
  const { lemma } = await response.data;
  return lemma;
};

// --- FUNÇÃO PRINCIPAL DE ADIVINHAÇÃO ---

const guessWord = async ({
  api,
  word,
  guessHistory,
  postGameHistory,
  foundWord,
  gaveUp,
  numberOfTips,
  numberOfAttempts,
  tip = '',
  tipDistance,
}) => {
  let lowerCaseWord = word?.toLowerCase().trim() || '';

  if (tip) {
    lowerCaseWord = tip.toLowerCase().trim();
  }

  if (lowerCaseWord === '') return { error: 'Palavra vazia.' };
  if (containsWhitespace(lowerCaseWord)) return { error: 'Digite apenas uma palavra.' };

  let lemma, distance, error;
  if (!tipDistance) {
    ({ lemma, distance, error } = await getDistance(api, lowerCaseWord));
  } else {
    lemma = tip;
    distance = tipDistance;
    error = '';
  }

  if (error || distance < 0) return { error };

  const existent = getExistent(lemma, guessHistory, postGameHistory);
  if (existent) return { error: `A palavra "${lemma}" já foi tentada.` };

  const newLastGuess = [lemma, distance];
  let newFoundWord = foundWord;
  if (distance === 0 && !gaveUp) newFoundWord = lemma;

  let newGuessHistory = [...guessHistory];
  let newPostGameHistory = [...postGameHistory];
  const isPostGame = foundWord || gaveUp;

  if (isPostGame) newPostGameHistory.push(newLastGuess);
  else newGuessHistory.push(newLastGuess);

  return {
    guessHistory: newGuessHistory,
    postGameHistory: newPostGameHistory,
    lastGuess: newLastGuess,
    foundWord: newFoundWord,
    numberOfTips: tip ? numberOfTips + 1 : numberOfTips,
    numberOfAttempts: tip || foundWord || gaveUp ? numberOfAttempts : numberOfAttempts + 1,
    success: distance === 0,
  };
};

module.exports = {
  initialGameData,
  gameApi,
  containsWhitespace,
  getExistent,
  getDistance,
  getTip,
  getResult,
  guessWord,
  calculateNextTipDistance, // Exporta a função atualizada
};
