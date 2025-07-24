const NodeCache = require('node-cache');
  
// Cria a instância do cache
const groupCache = new NodeCache({
  stdTTL: 60 * 60,
  useClones: false
});

// Funções utilitárias
const setGroupMetadata = (id, metadata) => {
  if (!id || !metadata) return false;
  return groupCache.set(id, metadata);
};

const getGroupMetadata = (id) => {
  if (!id) return null;
  return groupCache.get(id);
};

const hasGroupMetadata = (id) => {
  if (!id) return false;
  return groupCache.has(id);
};

const delGroupMetadata = (id) => {
  if (!id) return false;
  return groupCache.del(id);
};

const flushGroupCache = () => {
  groupCache.flushAll();
};

const isGroupCacheEmpty = () => {
  return groupCache.keys().length === 0;
};

// Exporta tanto a instância como as funções
module.exports = {
  groupCache,
  setGroupMetadata,
  getGroupMetadata,
  hasGroupMetadata,
  delGroupMetadata,
  flushGroupCache,
  isGroupCacheEmpty
};