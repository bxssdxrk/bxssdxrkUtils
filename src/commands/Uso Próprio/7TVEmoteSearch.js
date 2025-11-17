const { prefix } = require(`${BASE_DIR}/config`);
const { bxssdxrkLog } = require(`${BASE_DIR}/utils`);
const axios = require('axios');

const GET_EMOTES_QUERY = `
  query SearchEmotes(
    $query: String!, 
    $limit: Int, 
    $page: Int, 
    $filter: EmoteSearchFilter,
    $sort: Sort
  ) {
    emotes(
      query: $query, 
      limit: $limit, 
      page: $page, 
      filter: $filter,
      sort: $sort
    ) {
      items {
        id
        name
        flags
        lifecycle
        tags
        animated
        created_at
        owner_id
        listed
        personal_use
        state
        trending
        host {
          url
          files {
            name
            format
          }
        }
        owner {
          id
          username
          display_name
          avatar_url
          style {
            color
            paint_id
          }
          roles
        }
        versions {
          id
          name
          description
          created_at
          lifecycle
          state
          listed
          host {
            url
            files {
              name
              format
            }
          }
        }
        channels {
          total
          items {
            id
            username
            display_name
            avatar_url
          }
        }
        common_names {
          name
          count
        }
        activity {
          id
          kind
          created_at
          target_kind
          target_id
          actor {
            id
            username
            display_name
            avatar_url
          }
        }
        reports {
          id
          target_kind
          target_id
          actor_id
          subject
          body
          priority
          status
          created_at
        }
      }
    }
  }
`;

async function search7tvEmotes({ searchTerm = 'yonose', amount = 5, sortType = 'TOP' }) {

  // Mapeia o tipo de ordenação para a categoria do filtro
  let category;
  let sortOrder;

  switch ((sortType || 'POPULAR').toUpperCase()) {
    case 'NEWEST':
      category = 'NEW';
      sortOrder = 'DESCENDING'; // Mais recentes primeiro
      break;
    case 'OLDEST':
      category = 'NEW';
      sortOrder = 'ASCENDING'; // Mais antigos primeiro
      break;
    case 'TRENDING_WEEK':
      category = 'TRENDING_WEEK';
      sortOrder = 'DESCENDING';
      break;
    case 'TRENDING_MONTH':
      category = 'TRENDING_MONTH';
      sortOrder = 'DESCENDING';
      break;
    case 'TRENDING_DAY':
      category = 'TRENDING_DAY';
      sortOrder = 'DESCENDING';
      break;
    case 'TOP':
      category = 'TOP';
      sortOrder = 'DESCENDING';
      break;
    case 'POPULAR':
    default:
      category = 'TRENDING_DAY'; // ou 'FEATURED'
      sortOrder = 'DESCENDING';
      break;
  }

  try {
    const response = await axios.post('https://7tv.io/v3/gql', {
      query: GET_EMOTES_QUERY,
      variables: {
        query: searchTerm,
        limit: (amount > 0 && amount <= 10) ? amount : 5,
        page: 1,
        filter: {
          category: category
        },
        sort: {
          value: '', // Não é usado pela API, mas precisa estar presente
          order: sortOrder
        }
      },
    });

    const emotes = response.data.data.emotes.items;

    if (emotes.length === 0) {
      throw new Error('Nenhum emote encontrado.');
    }
    console.log(JSON.stringify(emotes, null, 2));

    return emotes;
  } catch (error) {
    console.log('Erro ao buscar os emotes:', error.message);
  }
}

module.exports = {
  name: "7TV Emote Search",
  description: "Pesquisa emotes no 7TV",
  commands: ["7tv"],
  usage: `${prefix}7tv <search>`,
  handle: async ({ 
    sendWaitReact,
    sendSuccessReply,
    sendErrorReply,
    socket,
    remoteJid,
    userJid,
    args,
  }) => {
    await sendWaitReact();
    try {
      const searchTerm = args[0] || 'yonose';
      const amount = args[1] ? parseInt(args[1], 10) : 5;
      const sortType = args[2] | 'TOP';
      const emotesData = await search7tvEmotes({
        searchTerm,
        amount,
        sortType
      });

      let emotesFormatedList = "";

      emotesData.forEach(emote => {
        emotesFormatedList += `*Nome:* ${emote.name}\n*ID:* ${emote.id}\n`;
      
        // Agrupa os arquivos por formato (WEBP, AVIF, GIF etc)
        const filesByFormat = {};
        emote.host.files.forEach(file => {
          if (!filesByFormat[file.format]) filesByFormat[file.format] = [];
          const emoteUrl = `https:${emote.host.url}/${file.name}`;
          filesByFormat[file.format].push({
            name: file.name.replace(/\.\w+$/, ''), // remove extensão (1x.webp → 1x)
            url: emoteUrl
          });
        });
      
        // Monta os blocos formatados
        for (const format in filesByFormat) {
          emotesFormatedList += `— *${format.toUpperCase()}:*\n`;
          filesByFormat[format].forEach(f => {
            emotesFormatedList += `- ${f.name}: ${f.url}\n`;
          });
        }
      
        emotesFormatedList += "——————————————————————\n";
      });
      await sendSuccessReply(emotesFormatedList);
    } catch (error) {
      console.log(error);
    }
  }
};