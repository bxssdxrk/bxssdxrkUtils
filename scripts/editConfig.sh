#!/bin/bash

# Cores conforme solicitado
ERROR="\x1b[1;31m"
SUCCESS="\x1b[1;32m"
WARN="\x1b[1;33m"
INFO="\x1b[1;34m"
DEBUG="\x1b[1;35m"
TRACE="\x1b[1;36m"
NEUTRAL="\x1b[1;37m"
RESET="\x1b[0m"

# Arquivo fixo que você quer editar dentro do projeto
ORIGINAL="./src/config.js"

# Caminho temporário para edição (acessível pelo Android)
TEMP="/storage/emulated/0/TEMP-config.js"

# Verifica se o arquivo existe
if [ ! -f "$ORIGINAL" ]; then
    echo -e "${ERROR}Erro: Arquivo '$ORIGINAL' não encontrado!${RESET}"
    exit 1
fi

# Copia o arquivo para a pasta temporária
cp "$ORIGINAL" "$TEMP"

echo -e "${WARN}Abrindo para edição...${RESET}"
am start -a android.intent.action.VIEW -d "file://$(realpath $TEMP)" -t "text/plain"

# Espera o usuário terminar de editar
while true; do
    echo -ne "${WARN}Quando terminar de editar digite 'pronto': ${RESET}"
    read RESP
    if [[ "${RESP,,}" == "pronto" ]]; then
        break
    fi
done

# Move o arquivo de volta para o local original
mv "$TEMP" "$ORIGINAL"

echo -e "${SUCCESS}Arquivo atualizado com sucesso! ✅${RESET}"