# bxssdxrkUtils 🇧🇷

Fiz esse script com algumas funçõeszinhas massa pra eu usar no zapzap :3

E sim, é vibe-coded :p

## Como que instala?

Primeiramente, você vai ter que baixar e instalar o [Termux](https://f-droid.org/repo/com.termux_1002.apk).

Para instalar esse projeto, basta seguir os passos abaixo:

1. Permitir acesso ao armazenamento

    ```bash
    termux-setup-storage
    ```

2. Atualizar pacotes
    ```bash
    pkg update && pkg upgrade -y
    ```
    Se ao rodar isso o Termux perguntar por alguma coisa, apenas aperte enter.

3. Instalar pacotes principais

    ```bash
    pkg install git nodejs-lts ffmpeg -y
    ```

4. Clonar o repositório

    ```bash
    git clone https://github.com/bxssdxrk/bxssdxrkUtils.git
    ```

5. Entrar na pasta do projeto

    ```bash
    cd bxssdxrkUtils
    ```

6. Instalar dependências do projeto
> Essas flags são opcionais, se der problema ao instalar, remova elas.

    ```bash
    npm install --no-bin-links --ignore-scripts
    ```

7. Configurar o arquivo de configuração

    Abra o [arquivo de configuração](./src/config.js) e configure como preferir.

8. Iniciar o script

    ```bash
    npm start
    ```
  
9. Coloque seu número (EXEMPLO: 555188889999), copie o código de pareamento e conecte no WhatsApp (deve chegar uma notificação do WhatsApp. clique nela e cole o código de pareamento)

## E pra que serve essa bosta?

Aqui estão algumas das funções disponíveis:

* **`Salvar viewOnce`**: Salva a mídia de visualização única apenas respondendo a mensagem.

* **`Salvar Status`**: Salvar o status de um usuário ao responder ou curtir o status. Precisa ter recebido o status DEPOIS de ter iniciado o script pra salvar curtindo. (configurável no [arquivo de configuração](./src/config.js))

* **`Auto-rejeitar Chamadas`**: Rejeita automaticamente as chamadas recebidas.  (configurável no [arquivo de configuração](./src/config.js))

* **`Auto-curtir Status`**: Curte os status recebidos. (configurável no [arquivo de configuração](./src/config.js))

## Que bosta hein, bxssdxrk...

Eu sei `,:j

## Quero contribuir no projeto, mas como?

Se quiser contribuir, fique à vontade para abrir uma pull request. Vou analisar e, se estiver tudo certo, vou integrar suas melhorias :3

## 📄 Licença e Aviso Legal

> Este projeto foi criado com muito ó̶d̶i̶o̶ amor por **bxssdxrk** com fins **educacionais e pessoais**, usando a biblioteca **Baileys** para interagir com o WhatsApp.
>
> ### ⚠️ AVISO LEGAL:
>
> Este código é fornecido **gratuitamente**, sem qualquer garantia.
>
> * Ferramentas experimentais criadas sem vínculo com o WhatsApp, Meta Platforms Inc. ou os devs da Baileys.
> * **O uso é por sua conta e risco.** Não me responsabilizo por banimentos, perdas, danos, etc.
>
> ### ✅ LIBERADO GERAL:
>
> Pode copiar, modificar, adaptar e compartilhar **à vontade**.
>
> * O único requisito é: **NÃO VENDA!**
> * Se alguém vender esse código ou algo derivado dele, está desrespeitando a proposta original e será considerado um **tremendo bobão**.
>
> ### 🧡 SE FOR USAR:
>
> * **Dê os créditos** pra mim (bxssdxrk), por favorzinho :3
> * Se modificar algo, me mostra! Vou adorar ver o que você fez.
>
> ### 🚨 IMPORTANTE:
>
> * Se você pagou por isso, **foi enganado**.
> * Esse projeto é e sempre será **gratuito**. Denuncie quem comercializa algo que nunca teve preço.

Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.