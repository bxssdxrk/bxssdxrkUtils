#!/data/data/com.termux/files/usr/bin/bash

# ==========================
# 🔄 Atualizador bxssdxrkUtils
# ==========================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Aviso antes da atualização
echo -e "${YELLOW}⚠️ Atenção:${NC} após a atualização será necessário reconfigurar o arquivo ${CYAN}src/config.js${NC}."
echo -e "Certifique-se de ter salvo ou anotado suas configurações antes de prosseguir.\n"

# Pergunta ao usuário
echo -e "${YELLOW}🔄 Deseja atualizar bxssdxrkUtils para a versão mais recente?${NC}"
while true; do
    read -p "[S/n]: " -n 1 -r
    echo
    case "$REPLY" in
        [SsYy]) break ;; # Confirma atualização
        [Nn]) echo -e "${RED}❌ Atualização cancelada.${NC}"; exit 0 ;;
        *) echo -e "${YELLOW}Digite S para sim ou N para não.${NC}" ;;
    esac
done

REPO_PATH="$(pwd)"

if [ -d ".git" ]; then
    # Se for repositório git, tenta pull
    git config --global --add safe.directory "$REPO_PATH" > /dev/null 2>&1
    if git pull; then
        echo -e "\n${GREEN}✅ Atualização concluída com sucesso!${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ Não foi possível atualizar via git.${NC}"
    fi
else
    # Aviso para quem não está usando git
    echo -e "${CYAN}💡 Dica:${NC} Você está usando uma versão baixada como ZIP."
    echo -e "   Recomendo apagar esta pasta e usar:"
    echo -e "   ${YELLOW}git clone https://github.com/SEU_USUARIO/bxssdxrkUtils.git${NC}"
    echo -e "   Assim você poderá atualizar no futuro sem precisar baixar ZIPs.\n"
fi

# Atualização via ZIP
echo -e "${YELLOW}⬇️ Baixando versão mais recente...${NC}"
TEMP_DIR=$(mktemp -d)
ZIP_URL="https://github.com/SEU_USUARIO/bxssdxrkUtils/archive/refs/heads/main.zip"

if curl -L -o "$TEMP_DIR/bxssdxrkUtils.zip" "$ZIP_URL"; then
    echo -e "${YELLOW}📦 Extraindo arquivos...${NC}"
    unzip -q "$TEMP_DIR/bxssdxrkUtils.zip" -d "$TEMP_DIR"

    NEW_DIR=$(find "$TEMP_DIR" -type d -name "bxssdxrkUtils-*")
    cp -rT "$NEW_DIR" "$REPO_PATH"

    rm -rf "$TEMP_DIR"

    echo -e "\n${GREEN}✅ Atualização concluída com sucesso!${NC}"
    echo -e "${YELLOW}⚠️ Lembre-se de reconfigurar o arquivo src/config.js antes de usar o bot.${NC}"
else
    echo -e "\n${RED}❌ Não foi possível baixar a atualização. Verifique sua internet.${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi