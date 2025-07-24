#!/data/data/com.termux/files/usr/bin/bash

echo "⌛ Adicionando arquivos..."
# Adiciona todas as mudanças
git add .

# Pergunta a mensagem do commit
read -p "Qual nome do commit: " mensagem

# Faz o commit
git commit -m "$mensagem"

# Envia para o GitHub
git push

# Confirmação final
echo "✅ Commit feito e push enviado com sucesso!"
