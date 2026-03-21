# Documentação de Commits e Restauração (Git)

Este arquivo foi criado para te ajudar a entender as últimas mudanças feitas no **Salsichinha Luna Arcade** e te dar os comandos corretos se você quiser **desfazer**, **testar** ou **voltar o tempo** para qualquer versão anterior.

---

## 🛠 Nossos Últimos Commits Recentes

**ATENÇÃO:** Nós acabamos de criar uma **Branch Nova Segunda** chamada `correcoes-finais-animais`!

### Branch: `correcoes-finais-animais` (A MAIS NOVA E PERFEITA)
- **O que mudou:** `main.js`.
- **Detalhes:**  
  - **Urubu Apenas:** Só tem o Urubu `🐦‍⬛` sequestrando os bichinhos pra tirar a mosca e morcego chatos da tela.
  - **Sem frutos do mar:** Remoção do Camarão, Lagosta e Minhoca. Apenas Zoológico Terrestre puro da cabeça aos pés.
  - **Fim da Caixa de Presentes:** O que cai do céu pros Bulldogs são mísseis/torpedinhos `🚀` que fazem total sentido com a explosão.
  - **Fim da Mutação Animal:** Os gatinhos e zebras presos, quando atingem o paraquedas, conservam o próprio corpo correto (Gato é Gato, Zebra é Zebra) e não há mais mutações em que todo mundo vira o bicho original Macaco!
  - **Como voltar para antes disso:** `git checkout master`

---

### Branch: `feat/novas-fases-animais`
- **`5f5f12a`** - **10 Fases Novas & Zoológico Completo:**
  - **Expandiu Fases:** Adicionadas 6 novas fases além das 4 antigas. O jogo passa por: Floresta, Montanha, Lua, Alien, Marte, Vênus, Alto Mar (com barcos navegando), Cidade (com trânsito de fundo), Selva Tropical (cipós) e Era do Gelo.
  - **Dezenas de Animais:** Refatorei o código pesado de desenho dos animais para usar os emojis de coração puramente direto na fonte do jogo. Agora você está resgatando Quase Todo o Zoológico (Leões, Coalas, Pinguins, Girafas, etc).
  - **Como voltar para antes disso (pro Master):** Digite `git checkout master`.

---

### Branch: `master`
Aqui estão as mudanças antigas, que agora formam a **base segura** do jogo.

### 1. `b5ad1ce` - Atualização de Cache do PWA para v4
- **O que mudou:** Apenas o arquivo `sw.js`. O `CACHE_NAME` passou de v3 para v4.
- **Por que:** Como arrumamos bugs de invencibilidade e dificuldade logo apos atualizar o sw.js pra versao 3, as pessoas em celulares passariam a usar a v3 sem esses bugs resolvidos. Mudar para v4 força o celular de todo mundo a baixar instantaneamente do GitHub as melhorias do PWA.

### 2. `082539a` - Correção Buracos, Invencibilidade (I-Frames) e Dificuldade
- **O que mudou:** O miolo pesado do jogo (`index.html` e `main.js`). 
- **Por que:** Resolve o problema de perder todas as vidas de uma vez ao cair no buraco (agora move a Salsichinha para segurança enquanto morta); Adiciona pisca-pisca e invencibilidade temporária após renascer; Adiciona menu de Dificuldade na tela inicial (Fácil, Médio, Muito Difícil).

### 3. `444cd14` - Atualização Cache (PWA) para Música Offline (v3)
- **O que mudou:** Adicionada a instrução `/bgm.mp3` no arquivo `sw.js`.
- **Por que:** Para garantir que a nova música de fundo MP3 seja salva dentro da memória do celular na hora que as pessoas instalam o aplicativo, permitindo tocar sem internet.

### 4. `3d21377` - Fim do YouTube com Música MP3 Local
- **O que mudou:** Extirpamos a API/Iframe do YouTube (`index.html` e `main.js`) e adicionamos o elemento `new Audio('bgm.mp3')`. O arquivo físico `bgm.mp3` pesado (~3 MB) foi atrelado ao Git.
- **Por que:** Para sumir com todas as propagandas que apareciam para usuários sem conta no "YouTube Premium" durante o jogo.

*(Nota: O commit antes desse foi o **`39dd654`**, que é onde você tinha deixado o GitHub com aqueles sons incríveis de chuva e trovoada antes da nossa sessão)*

---

## 🕒 Como Viajar no Tempo no Git (Como voltar para qualquer versão)

Seja por que uma mudança introduziu dor de cabeça ou porque você só quer "testar" a versão antiga, use o seu **Terminal** ou **PowerShell** na pasta do jogo e execute um dos comandos abaixo:

### Opção A: Como APENAS "Olhar" e Testar o Passado
Se você quiser só *ver* como o jogo estava em um determinado commit, rodar ele no seu PC e depois voltar pro mais perfeito de hoje, use:

1. **Para ir para um passado:**
   ```bash
   git checkout <codigo-do-commit>
   
   # Exemplo para voltar pra versão ANTES da música MP3 (com YouTube):
   git checkout 39dd654
   ```
2. **Para voltar para a versão definitiva (a mais atual do master):**
   ```bash
   git checkout master
   ```

### Opção B: Como DELETAR MUDANÇAS (Voltar de Verdade e Sobrescrever o Futuro)
ATENÇÃO: Este modo rasga, incinera e **exclui para sempre** todos os commits do Github que vieram DEPOIS do commit que você pediu para voltar. Utilize este aqui somente e estritamente se você se arrependeu 100% do que fizemos e quer jogar as modificações recentes no Lixo.

1. Escolha a versão segura que você quer manter (Ex: `3d21377` onde tudo estava bem mas antes dos buracos mudarem).
2. Resete violentamente o estado do jogo para ele:
   ```bash
   git reset --hard 3d21377
   ```
3. "Atropele" (force-push) o Github para que lá também apague tudo o que aconteceu após isso:
   ```bash
   git push origin master --force
   ```

### Opção C: Como CRIAR UM BRANCH ("Universo Alternativo")
Se você quiser continuar de uma versão antiga sem destruir o que já existe no seu master principal, divida em um galho (Branch) diferente a partir do ponto que quiser:

```bash
# Volta no commit antigo temporal
git checkout 082539a

# Cria uma "branch" paralela pra vc continuar o trabalho de outro jeito sem zoar o master
git checkout -b um-teste-antigo
```

---
Espero que isso facilite 100% o seu controle sobre as versões do GitHub daqui para frente!
