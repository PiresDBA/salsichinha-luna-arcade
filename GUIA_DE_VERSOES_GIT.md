# Documentação de Commits e Restauração (Git)

Este arquivo foi criado para te ajudar a entender as últimas mudanças feitas no **Salsichinha Luna Arcade** e te dar os comandos corretos se você quiser **desfazer**, **testar** ou **voltar o tempo** para qualquer versão anterior.

---

## 🛠 Nossos Últimos Commits Recentes

**ATENÇÃO:** Nós acabamos de JUNTAR TUDO (Merge) de novo na **Branch Principal `master`**! Tudo o que fizemos nas últimas duas branches com o novo desenho e o sistema de dificuldade acabou de entrar pra valer no jogo - bem como o **Desenho Manual da Gaivota**!

### Branch Atual: `master`
Aqui está a **base segura e final** do jogo neste momento.

### 1. `Atualização de Cache do PWA para v14 (Identidade nos Recordes)`
- **O que mudou:** `sw.js` agora para **v14**.
- **Novidade Principal:** Agora você pode **digitar o seu nome (máximo 10 letras)** quando bater um recorde! 
- Ao final de cada partida, aparecerá um campo para você se identificar. Basta clicar em "Salvar Recorde" e seu nome ficará imortalizado no Top 5 de recordistas locais do jogo!

---

### 2. `Atualização de Cache do PWA para v13 (Recordes e Perigos)`
  1. **Novos Chefes nas Primeiras Fases:** Agora a Gaivota será a Fase 1! O Cachorrão (Fase 2). A Vassoura, os Fogos e a Mangueira fecham as Fases 3, 4 e 5! 
  2. **Ilda, o Cão (A Vida Real):** O temido chefe Cachorrão deixou de ser apenas a "cara do lobo flutuante" num emoji de lua cheia! Eu tirei do céu e a coloquei **nas telas/chão**. Desenhei programaticamente a "ILDA O CÃO", um gigantesco vira-lata de lona preta, com focinho feio e agressivo, olho vermelho malvado, babando entre os dentes afiados!
  3. **A Ilda Te Persegue no Chão:** Sendo o primeiro chefe focado em combate de solo (Melee), a Ilda não fica oscilando entre as nuvens lançando bombas. Ela cai literalmente com quatro patas no asfalto e **corre de frente a frente pela tela para te caçar!** A colisão dela fará o cachorro dar Game Over! Corra dela e atire petiscos para vencê-la!

---

### *Histórico das Branches que foram Mescladas (Merges Anteriores/Antigos)*

### Branch: `feat/terreno-diagonal-ursos` (URSOS, DECLIVES E DIFICULDADE DE TESTE)
- **Detalhes:** 
  - **Terreno Inclinado / Diagonal:** A partir dos 15 segundos da fase, o chão do jogo inteiro começará lentamente a se inclinar num ângulo orgânico formando uma longa ladeira.
  - **Mais Demorado e Difícil:** As fases foram artificialmente infladas em 50% para compensar a chegada rápida do chefe. Consequentemente, o número de buracos triplicou ao longo desse espaço perigoso. O rate dos foguetes/torpedos foi acelerado.
  - **Ursos Gigantes:** Variações Urso Pardo `🐻`, Urso Polar `🐻‍❄️` e o raro Panda `🐼` com rosnado próprio e sonoro!

### Branch: `feat/urubu-desenhado` (O URUBU ESTILO CARTOON)
- **Detalhes:** Desenho Procedural no Canvas de um Urubu gigante idêntico ao seu referencial de cartoon! Ele tem corcunda, colar de penas brancas no pescoço longo enrugado, pele rosa, um olho com pupila pequena, sobrancelha grossa e um bicaço laranja puxado! Asinhas batendo freneticamente.

---

### Branch Atual: `master`
Aqui está a **base segura e final** do jogo neste momento.

### 1. `Atualização de Cache do PWA para v7 (O Merge Supremo)`
- **O que mudou:** Apenas o arquivo `sw.js`. O `CACHE_NAME` passou para **v7**.
- **Por que:** Força o celular de todo mundo a baixar instantaneamente do ar o "Torpedo Apontando pra Baixo", os "Animais de Corpo Inteiro" e a "Animação de Balanço do Paraquedas e do Pânico"!

---

### *Histórico das Branches que foram Mescladas (Merges Anteriores)*

### Branch de Refinação Total: `feat/corpos-animais-torpedo`
- **Detalhes:** Fim das "cabeças flutuantes" trocadas por corpos inteiros, torpedo embicado/angulado `🚀` (-135 graus) reto para o chão, e animação orgânica (Senoidal) na queda dos animais de todos os resgates.

---

### *Histórico das Branches que foram Mescladas (Merges Anteriores)*

### Branch de Destaque: `feat/novos-chefes`
- **Detalhes:** Expandimos de 5 para 10 os Medos do Final da Fase (Gaivota Bobona `🦤`, Cachorrão `🐺`, Vassoura `🧹`, Fogos `🎇`, Mangueira `🚿`).

### Branch de Polimento: `correcoes-finais-animais`
- **Detalhes:** Remoção de furtos do mar. Apenas `🐦‍⬛` (Urubu) sequestra os animais. O que cai do céu pros Bulldogs são mísseis/torpedinhos `🚀`. Animais não viram macacos aleatórios no resgate.

### Branch de Expansão: `feat/novas-fases-animais`
- **Detalhes:** Adicionadas 6 novas fases além das 4 antigas (Marte, Vênus, Alto Mar, Cidade, Selva e Era do Gelo) e mais de 20 novos bichos puxados por emojis.

---

### *Histórico de Commits Antigos do Master*

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
