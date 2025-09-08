#!/data/data/com.termux/files/usr/bin/bash

# ==========================
# 🔄 Atualizador bxssdxrkUtils
# ==========================

# 🎨 Cores para feedback
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Confirmação do usuário
echo -e "${YELLOW}🔄 Atualizar bxssdxrkUtils para a versão mais recente?${NC}"
read -p "[S/n]: " -n 1 -r
echo

if [[ ! -z "$REPLY" && ! "$REPLY" =~ ^[SsYy]$ ]]; then
    echo -e "${RED}❌ Atualização cancelada.${NC}"
    exit 0
fi

# Caminho atual do repositório
REPO_PATH="$(pwd)"

# Marca repositório como seguro
git config --global --add safe.directory "$REPO_PATH" > /dev/null 2>&1

# Atualiza o repositório
if git pull; then
    echo -e "\n${GREEN}✅ Atualização concluída com sucesso!${NC}"
else
    echo -e "\n${RED}❌ Não foi possível atualizar. Verifique sua internet ou tente manualmente.${NC}"
fi