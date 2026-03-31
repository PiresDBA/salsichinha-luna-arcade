/**
 * ============================================================================
 *           BEM-VINDO AO CÓDIGO DO JOGO: SALSICHINHA LUNA ARCADE
 * ============================================================================
 * 
 * Se você nunca programou antes, não se preocupe! Este código é como uma 
 * "receita de bolo" que diz ao computador exatamente o que desenhar e como
 * os personagens devem se comportar.
 * 
 * --- CONCEITOS IMPORTANTES ---
 * 1. CANVAS (TELA): É como uma lousa mágica onde o jogo é desenhado 60 vezes 
 *    por segundo para criar a ilusão de movimento.
 * 2. CTX (CONTEXTO): É o nosso "pincel". Usamos ele para pintar formas, cores
 *    e imagens na lousa (Canvas).
 * 3. VARIÁVEIS (let e const): São gavetas onde guardamos informações, como
 *    os pontos que você fez ou quantas vidas a Luna ainda tem.
 * 4. FUNÇÕES (function): São pequenos "trabalhadores" que executam uma tarefa
 *    específica (como "pular", "atirar" ou "tocar som").
 */

// Aqui pegamos a "lousa" (canvas) que está lá no nosso arquivo HTML (index.html)
const canvas = document.getElementById('gameCanvas');

// E aqui pegamos o "pincel" (ctx) para podermos desenhar nela
const ctx = canvas.getContext('2d');

/** 
 * UI (User Interface - Interface do Usuário): 
 * Este objeto guarda todas as gavetas que conectam o nosso código com as 
 * mensagens e botões que aparecem na tela (pontos, vidas, telas de Game Over).
 */
const UI = {
  score: document.getElementById('score'),               // Onde aparecem os Pontos
  phase: document.getElementById('phase'),               // Onde mostra a Fase
  lives: document.getElementById('lives'),               // Quantidade de Vidinhas (Corações)
  startScreen: document.getElementById('start-screen'),   // A tela de Início (Menu)
  gameOverScreen: document.getElementById('game-over-screen'), // Tela de quando você perde
  phaseTransition: document.getElementById('phase-transition'), // Mensagem de "Fase 2, 3..."
  nextPhase: document.getElementById('next-phase'),       // O número da próxima fase
  finalScore: document.getElementById('final-score'),     // Pontuação final mostrada no final
  startBtn: document.getElementById('start-btn'),         // O botão verde pra começar
  restartBtn: document.getElementById('restart-btn'),     // O botão pra jogar de novo
  phaseCompleteScreen: document.getElementById('phase-complete-screen'), // Tela de fase vitoriosa
  continueBtn: document.getElementById('continue-btn'),   // Botão de continuar jogando
  continueScreen: document.getElementById('continue-screen'), // Tela de contagem regressiva (10..9..8)
  btnYesContinue: document.getElementById('btn-yes-continue'), // Botão "SIM" pra continuar
  btnNoContinue: document.getElementById('btn-no-continue'),   // Botão "NÃO" pra desistir
  continuesLeftText: document.getElementById('continues-left'), // Quantas vezes ainda pode continuar
  continueTimerText: document.getElementById('continue-timer'), // O reloginho da contagem 
  difficultySelect: document.getElementById('difficulty-select'), // Seleção de Fácil/Médio/Difícil
  highScoresList: document.getElementById('high-scores-list'),   // Lista dos Recordes salvos
  playerNameInput: document.getElementById('player-name'),       // Caixinha pra você digitar seu nome
  saveScoreBtn: document.getElementById('save-score-btn'),       // Botão pra salvar seu Recorde
  recordInputContainer: document.getElementById('record-input-container') // Onde fica a caixinha do nome
};

// --- IMAGE ASSETS ---
const menuDogImg = new Image();
menuDogImg.src = 'luna-menu-transparent.png';

// --- VARIÁVEIS GLOBAIS ---
let continueInterval = null;

// Avião removido conforme pedido do usuário!
function showContinueScreen() {
  if (game.continues <= 0) {
    triggerGameOver();
    return;
  }
  
  gameState = 'CONTINUE';
  UI.continueScreen.classList.remove('hidden');
  UI.continuesLeftText.innerText = game.continues;
  stopBGM();
  
  let count = 10;
  UI.continueTimerText.innerText = count;
  
  if (continueInterval) clearInterval(continueInterval);
  continueInterval = setInterval(() => {
    count--;
    UI.continueTimerText.innerText = count;
    if (count <= 0) {
      rejectContinue();
    }
  }, 1000);
}

function acceptContinue() {
  if (continueInterval) clearInterval(continueInterval);
  game.continues--;
  game.lives = 5;
  UI.continueScreen.classList.add('hidden');
  resetPhase();
  gameState = 'PLAYING';
  startBGM();
  saveGame();
}

function rejectContinue() {
  if (continueInterval) clearInterval(continueInterval);
  UI.continueScreen.classList.add('hidden');
  triggerGameOver();
}

function triggerGameOver() {
  gameState = 'GAMEOVER';
  UI.finalScore.innerText = game.score;
  UI.recordInputContainer.style.display = 'block'; // mostra pra digitar o nome
  renderHighScores();
  setTimeout(() => {
    UI.gameOverScreen.classList.remove('hidden');
  }, 1000);
  stopBGM();
  saveGame();
}

function updateHighScores(newScore, playerName) {
    let scores = JSON.parse(localStorage.getItem('luna_high_scores')) || [];
    const pName = playerName ? playerName.trim().substring(0, 10) : "ANÔNIMO";
    scores.push({ name: pName, score: newScore, date: new Date().toLocaleDateString('pt-BR') });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 5); // top 5
    localStorage.setItem('luna_high_scores', JSON.stringify(scores));
}

function renderHighScores() {
    const scores = JSON.parse(localStorage.getItem('luna_high_scores')) || [];
    if (UI.highScoresList) {
        UI.highScoresList.innerHTML = scores.map((s, i) => `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted rgba(255,255,255,0.3); padding: 5px 0;">
                <span style="font-weight:bold; color:#ffcc00">${i + 1}º ${s.name || '---'}</span>
                <span>${s.score} pts</span>
            </div>
        `).join('') || '<p style="text-align:center; opacity:0.5;">Nenhum recorde ainda!</p>';
    }
}

const GROUND_Y = 500;
const DOG_COLOR = '#B2663E';
const EARS_COLOR = '#5C2E0A';

// --- AUDIO SYSTEM ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

/**
 * SISTEMA DE SALVAMENTO (LocalStorage):
 * Imagina que o seu navegador tem um "caderninho de notas" secreto. 
 * A gente usa o 'localStorage' para anotar os seus pontos e em que fase você parou.
 * Assim, se você fechar o jogo e voltar amanhã, o jogo lê esse caderninho e você 
 * não perde o seu progresso!
 */
function saveGame() {
  const data = {
    score: game.score,      // Pontos atuais
    phase: game.phase,      // Fase atual
    lives: game.lives,      // Vidas
    continues: game.continues, // Quantos continues restam
    outfit: player.outfit   // A roupinha que a Luna está usando
  };
  // Salva no caderninho sob o nome 'luna_arcade_save'
  localStorage.setItem('luna_arcade_save', JSON.stringify(data));
}

// Essa função lê o caderninho quando você abre o jogo
function loadGame() {
  const saved = localStorage.getItem('luna_arcade_save');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      game.score = data.score || 0;
      game.phase = data.phase || 1;
      game.lives = data.lives || 5;
      game.continues = data.continues || 5;
      player.outfit = data.outfit || 'sailor';
      updateUI(); // Atualiza os textos na tela com os dados carregados
    } catch(e) { console.error("Erro ao carregar:", e); }
  }
}

/**
 * ATUALIZAÇÃO DA TELA (updateUI):
 * Essa função serve para pegar os números das nossas gavetas (variáveis)
 * e escrever eles lá no nosso arquivo de texto (HTML) para o jogador ver.
 */
function updateUI() {
  if (UI.score) UI.score.innerText = Math.floor(game.score);
  if (UI.phase) UI.phase.innerText = game.phase;
  if (UI.lives) UI.lives.innerText = game.lives;
}

/**
 * SISTEMA DE ÁUDIO (Web Audio API):
 * O computador precisa de uma "mesa de som" (audioCtx) para criar sons de "piiii", 
 * "pow" e "kabum". A gente inicia essa mesa aqui.
 */
function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Os navegadores modernos pedem que o jogador clique em algo antes de soltar som
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// BGM Player (HTML5 Audio para compatibilidade mobile e sem YouTubeAds)
let bgmAudio = null;
let currentBgmFile = '';

function startBGM() {
  const targetFile = game.phase >= 11 ? 'bgm.mp3' : 'cartoon_bgm.mp3';
  
  if (!bgmAudio) {
    bgmAudio = new Audio(targetFile);
    bgmAudio.loop = true;
    bgmAudio.volume = 0.5;
    currentBgmFile = targetFile;
  } else if (currentBgmFile !== targetFile) {
    bgmAudio.src = targetFile;
    bgmAudio.load();
    currentBgmFile = targetFile;
  }
  
  // Os navegadores bloqueiam som desacompanhado de clique.
  // Nosso botão 'Iniciar' permite que este play() funcione corretamente.
  bgmAudio.play().catch(e => console.log('Autoplay da música foi prevenido:', e));
}

function stopBGM() {
  if (bgmAudio) {
    bgmAudio.pause();
  }
}

function playTone(freq, type, duration, vol=0.1) {
  if(!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function soundJump() {
  if(!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.15); // higher pitch sweep
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

function soundShoot() {
  if(!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine'; 
  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

function soundPoof() { 
  if(!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * 0.2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(500, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start();
}

function soundTink() { 
  // O "Pim-Pim-Pim-Pim" que o usuário pediu - 4 notas subindo
  playTone(880, 'sine', 0.1, 0.1); 
  setTimeout(() => playTone(1050, 'sine', 0.1, 0.1), 50);
  setTimeout(() => playTone(1200, 'sine', 0.1, 0.1), 100);
  setTimeout(() => playTone(1350, 'sine', 0.1, 0.1), 150);
}

function soundHappy() {
  playTone(523.25, 'sine', 0.1, 0.1); 
  setTimeout(() => playTone(659.25, 'sine', 0.1, 0.1), 100); 
  setTimeout(() => playTone(783.99, 'sine', 0.2, 0.1), 200); 
}

function soundFreeAnimal() {
  playTone(659.25, 'sine', 0.1, 0.1); 
  setTimeout(() => playTone(880.00, 'sine', 0.2, 0.1), 100); 
}

function soundDie() {
  if(!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 1.0);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 1.0);
}


function soundMarioWin() {
  if(!audioCtx) return;
  const playNote = (freq, delay, dur) => {
    const t = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + dur);
  };
  playNote(660, 0, 0.1);
  playNote(660, 0.15, 0.1);
  playNote(660, 0.3, 0.1);
  playNote(510, 0.45, 0.1);
  playNote(660, 0.6, 0.1);
  playNote(770, 0.75, 0.2);
}

function speak(text) {
  const utterance = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=pt-BR&client=tw-ob`);
  utterance.volume = 1.0;
  utterance.play().catch(e => console.log("TTS blocked:", e));
}

// Helicopter Real Sound Player (Local File)
const heliAudio = new Audio('helicoptero.mp3');
heliAudio.loop = true;
heliAudio.volume = 0.5;

function updateHeliSound() {
  if (helicopters.length > 0) {
    if (heliAudio.paused) {
      heliAudio.play().catch(e => console.log("Heli audio blocked:", e));
    }
  } else {
    if (!heliAudio.paused) {
      heliAudio.pause();
      heliAudio.currentTime = 0;
    }
  }
}

const seagullAudio = new Audio('https://www.myinstants.com/media/sounds/seagull.mp3');
seagullAudio.volume = 0.6;

function soundBombImpact() {
  soundTink(); // Agora a bomba ao cair faz o som de "acerto" solicitado
}

let ufoOsc = null;
function startUfoSound() {
  if(!audioCtx) return;
  stopUfoSound();
  ufoOsc = audioCtx.createOscillator();
  const lfo = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  ufoOsc.type = 'sine';
  ufoOsc.frequency.value = 600;
  
  lfo.type = 'sine';
  lfo.frequency.value = 8; // 8 Hz vibrato
  
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 200; // depth
  
  lfo.connect(lfoGain);
  lfoGain.connect(ufoOsc.frequency);
  
  gain.gain.value = 0.1;
  ufoOsc.connect(gain);
  gain.connect(audioCtx.destination);
  
  ufoOsc.start();
  lfo.start();
  ufoOsc.lfo = lfo;
}
function stopUfoSound() {
  if (ufoOsc) {
    try { ufoOsc.stop(); ufoOsc.lfo.stop(); } catch(e){}
    ufoOsc = null;
  }
}

function soundPowerDown() {
  if(!audioCtx) return;
  const t = audioCtx.currentTime;
  const freqs = [659.25, 523.25, 440.00]; // E5, C5, A4 (Plim-Plim-Plim descendente)
  freqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine'; // Som fofo e limpo
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0, t + i * 0.1);
    gain.gain.linearRampToValueAtTime(0.3, t + i * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 0.1);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t + i * 0.1);
    osc.stop(t + i * 0.1 + 0.15);
  });
}

function soundPowerUp() {
  if(!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.exponentialRampToValueAtTime(880, t + 0.2);
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.linearRampToValueAtTime(0, t + 0.2);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(t); osc.stop(t + 0.2);
}

const realMeow = new Audio('https://storage.googleapis.com/eleven-public-cdn/audio/sound-effects-library/cat-meow/11L-cat_meow-10828053.mp3');
const realBark = new Audio('https://www.myinstants.com/media/sounds/dog-bark.mp3');

function soundMeow() {
  realMeow.currentTime = 0;
  realMeow.play().catch(e => {
    // fallback se não carregar da internet
    if(!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square'; 
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  });
}

function soundDogBark() {
  realBark.currentTime = 0;
  realBark.play().catch(e => {
    if(!audioCtx) return;
    const playBark = (t, freq) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq/2, t + 0.15);
      gain.gain.setValueAtTime(0.8, t); 
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(t); osc.stop(t + 0.15);
    };
    playBark(audioCtx.currentTime, 250);
    playBark(audioCtx.currentTime + 0.15, 300);
  });
}

// Latido de dachshund (arquivo real)
const lunaLateAudio = new Audio('luna-latindo.mp3');
lunaLateAudio.volume = 0.6;
function soundDachshundBark() {
  lunaLateAudio.currentTime = 0;
  lunaLateAudio.play().catch(() => {});
}

let currentBgNoise = null;
let thunderInterval = null;
let currentEngineOscs = [];

// Pink noise - soa muito mais natural que ruído branco para vento/chuva
function makePinkNoise(duration) {
  const sr = audioCtx.sampleRate;
  const buf = audioCtx.createBuffer(1, sr * duration, sr);
  const d = buf.getChannelData(0);
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759;
    b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856;
    b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980;
    d[i] = (b0+b1+b2+b3+b4+b5+b6 + w*0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return buf;
}

// Trovão realista: estrondo seco + rumble longo
function soundThunderBolt() {
  if(!audioCtx) return;
  const t = audioCtx.currentTime;

  // Estrondo inicial (noise burst curto)
  const crackSrc = audioCtx.createBufferSource();
  crackSrc.buffer = makePinkNoise(0.12);
  const crackBp = audioCtx.createBiquadFilter();
  crackBp.type = 'bandpass'; crackBp.frequency.value = 400; crackBp.Q.value = 0.5;
  const crackGain = audioCtx.createGain();
  crackGain.gain.setValueAtTime(2.5, t);
  crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  crackSrc.connect(crackBp); crackBp.connect(crackGain); crackGain.connect(audioCtx.destination);
  crackSrc.start(t); crackSrc.stop(t + 0.15);

  // Rumble longo (pink noise passado por lowpass caindo)
  const rumbleSrc = audioCtx.createBufferSource();
  rumbleSrc.buffer = makePinkNoise(4);
  const rumbleLp = audioCtx.createBiquadFilter();
  rumbleLp.type = 'lowpass';
  rumbleLp.frequency.setValueAtTime(350, t + 0.05);
  rumbleLp.frequency.exponentialRampToValueAtTime(40, t + 4);
  const rumbleGain = audioCtx.createGain();
  rumbleGain.gain.setValueAtTime(1.2, t + 0.05);
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + 4);
  rumbleSrc.connect(rumbleLp); rumbleLp.connect(rumbleGain); rumbleGain.connect(audioCtx.destination);
  rumbleSrc.start(t + 0.05); rumbleSrc.stop(t + 4.1);
}

function playBgNoise(type) {
  if(!audioCtx) return;
  stopBgNoise();

  let soundType = type;
  if (type === 'seagull') soundType = 'none'; // Sem vento na gaivota!
  if (type === 'hose') soundType = 'wind';
  if (type === 'broom') soundType = 'vacuum';
  if (type === 'fireworks') soundType = 'storm';
  if (type === 'bigdog') soundType = 'car';

  if (soundType === 'wind') {
    // Vento: pink noise + LFO suave no filtro para simular rajadas
    const noiseSrc = audioCtx.createBufferSource();
    noiseSrc.buffer = makePinkNoise(4); noiseSrc.loop = true;
    const lp = audioCtx.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = 700; lp.Q.value = 0.8;
    const gain = audioCtx.createGain(); gain.gain.value = 0.5;
    // LFO para rajadas de vento
    const lfo = audioCtx.createOscillator(); lfo.frequency.value = 0.3;
    const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 250;
    lfo.connect(lfoGain); lfoGain.connect(lp.frequency);
    noiseSrc.connect(lp); lp.connect(gain); gain.connect(audioCtx.destination);
    noiseSrc.start(); lfo.start();
    currentBgNoise = noiseSrc;
    currentEngineOscs.push(lfo);

  } else if (type === 'storm') {
    // Tempestade: chuva (noise agudo) + trovões periódicos
    const rainSrc = audioCtx.createBufferSource();
    rainSrc.buffer = makePinkNoise(4); rainSrc.loop = true;
    const rainHp = audioCtx.createBiquadFilter(); rainHp.type = 'highpass'; rainHp.frequency.value = 1200;
    const rainLp = audioCtx.createBiquadFilter(); rainLp.type = 'lowpass'; rainLp.frequency.value = 8000;
    const rainGain = audioCtx.createGain(); rainGain.gain.value = 0.4;
    // Vento de fundo
    const windSrc = audioCtx.createBufferSource();
    windSrc.buffer = makePinkNoise(4); windSrc.loop = true;
    const windLp = audioCtx.createBiquadFilter(); windLp.type = 'lowpass'; windLp.frequency.value = 600;
    const windGain = audioCtx.createGain(); windGain.gain.value = 0.35;
    rainSrc.connect(rainHp); rainHp.connect(rainLp); rainLp.connect(rainGain); rainGain.connect(audioCtx.destination);
    windSrc.connect(windLp); windLp.connect(windGain); windGain.connect(audioCtx.destination);
    rainSrc.start(); windSrc.start();
    currentBgNoise = rainSrc;
    currentEngineOscs.push(windSrc);
    // Trovões aleatórios
    thunderInterval = setInterval(() => { if(audioCtx) soundThunderBolt(); }, 2500 + Math.random()*2000);

  } else if (type === 'car') {
    // Motor de carro: fundamental 90Hz + harmônicos + flutter de rotação
    const fundamental = 90;
    const harmonicsFreqs = [1, 2, 3, 4, 6];
    const harmonicsVol   = [0.5, 0.3, 0.2, 0.15, 0.08];
    const masterGain = audioCtx.createGain(); masterGain.gain.value = 0.18;
    const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    masterGain.connect(lp); lp.connect(audioCtx.destination);
    harmonicsFreqs.forEach((mult, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sawtooth'; osc.frequency.value = fundamental * mult;
      osc.detune.value = (Math.random()-0.5)*15;
      const g = audioCtx.createGain(); g.gain.value = harmonicsVol[i];
      osc.connect(g); g.connect(masterGain); osc.start();
      currentEngineOscs.push(osc);
    });
    // Ruído residual do escapamento
    const exhaust = audioCtx.createBufferSource(); exhaust.buffer = makePinkNoise(2); exhaust.loop = true;
    const exGain = audioCtx.createGain(); exGain.gain.value = 0.06;
    exhaust.connect(exGain); exGain.connect(audioCtx.destination); exhaust.start();
    currentBgNoise = exhaust;
    // Flutter de RPM
    thunderInterval = setInterval(() => {
      if(!audioCtx) return;
      const rev = 1 + (Math.random()*0.3);
      currentEngineOscs.forEach(osc => {
        if(osc.frequency) osc.frequency.linearRampToValueAtTime(osc.frequency.value*rev, audioCtx.currentTime+0.3);
      });
    }, 1200);

  } else if (type === 'motorcycle') {
    // Moto: mais agressiva, fundamental maior, rasgada
    const fundamental = 160;
    const harmonicsFreqs = [1, 1.5, 2, 3, 4];
    const harmonicsVol   = [0.55, 0.2, 0.25, 0.15, 0.05];
    const masterGain = audioCtx.createGain(); masterGain.gain.value = 0.2;
    const dist = audioCtx.createWaveShaper();
    // Distorção leve para som rasgado
    const curve = new Float32Array(256);
    for(let i=0;i<256;i++){const x=i*2/256-1; curve[i]=Math.tanh(x*3);}
    dist.curve = curve;
    masterGain.connect(dist); dist.connect(audioCtx.destination);
    harmonicsFreqs.forEach((mult, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = i%2===0 ? 'sawtooth' : 'square';
      osc.frequency.value = fundamental * mult;
      osc.detune.value = (Math.random()-0.5)*20;
      const g = audioCtx.createGain(); g.gain.value = harmonicsVol[i];
      osc.connect(g); g.connect(masterGain); osc.start();
      currentEngineOscs.push(osc);
    });
    // Aceleração periódica
    thunderInterval = setInterval(() => {
      if(!audioCtx) return;
      currentEngineOscs.forEach(osc => {
        if(!osc.frequency) return;
        const peak = osc.frequency.value * (1.5 + Math.random()*0.5);
        osc.frequency.linearRampToValueAtTime(peak, audioCtx.currentTime + 0.2);
        osc.frequency.linearRampToValueAtTime(osc.frequency.value, audioCtx.currentTime + 0.7);
      });
    }, 900);

  } else if (type === 'vacuum') {
    // Aspirador: motor elétrico 60Hz + zumbido + ar
    const fundamental = 120;
    [1,2,3,4,5].forEach((mult, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = fundamental * mult;
      const g = audioCtx.createGain(); g.gain.value = 0.12 / (i+1);
      osc.connect(g); g.connect(audioCtx.destination); osc.start();
      currentEngineOscs.push(osc);
    });
    // Ruído de ar
    const airSrc = audioCtx.createBufferSource(); airSrc.buffer = makePinkNoise(2); airSrc.loop = true;
    const airBp = audioCtx.createBiquadFilter(); airBp.type = 'bandpass'; airBp.frequency.value = 3000; airBp.Q.value = 1.5;
    const airGain = audioCtx.createGain(); airGain.gain.value = 0.3;
    airSrc.connect(airBp); airBp.connect(airGain); airGain.connect(audioCtx.destination); airSrc.start();
    currentBgNoise = airSrc;
  }
}

function stopBgNoise() {
  try { if(currentBgNoise) { currentBgNoise.stop(); currentBgNoise = null; } } catch(e){}
  if(thunderInterval) { clearInterval(thunderInterval); thunderInterval = null; }
  currentEngineOscs.forEach(o => { try { o.stop(); } catch(e){} });
  currentEngineOscs = [];
}

const bearAudioPool = [
  'bear1.mp3',
  'bear2.mp3',
  'bear3.mp3'
].map(src => new Audio(src));

function soundBear() {
  const audio = bearAudioPool[Math.floor(Math.random() * bearAudioPool.length)];
  const clone = audio.cloneNode(true);
  clone.volume = 1.0;
  clone.play().catch(e => console.log('Áudio de urso bloqueado por autoplay: ', e));
}
const crowAudio = new Audio('crow.mp3');
function soundCrow() {
  const clone = crowAudio.cloneNode(true);
  clone.volume = 1.0;
  clone.play().catch(e => console.log('Crow audio blocked: ', e));
}

// --- END AUDIO ---

let _t = 0;
let lastTime = 0;
let gameState = 'START';
let keys = {};

const introText = "Oi! Sou a Luna Salsicha! Aperte o botão da aventura para resgatarmos meus amiguinhos!";
const bubbleEl = document.getElementById('luna-speech-bubble');
const ttsVoice = new Audio('https://translate.google.com/translate_tts?ie=UTF-8&q=Oi!+Eu+sou+a+Luna+Salsicha!+Bem+vindo+a+minha+aventura!+Vem+jogar+comigo!&tl=pt-BR&client=tw-ob');
let introIndex = 0;
let voiced = false;

function typeWriter() {
  if (gameState !== 'START') return;
  if (!voiced) {
     ttsVoice.volume = 1.0;
     ttsVoice.play().catch(e => console.log("Audio block: ", e));
     voiced = true;
  }
  if (introIndex < introText.length) {
    if(bubbleEl) bubbleEl.innerHTML += introText.charAt(introIndex);
    introIndex++;
    setTimeout(typeWriter, 35);
  }
}

let game = {
  score: 0,
  phase: 1,
  lives: 5,
  continues: 5,
  speed: 250, 
  bgSpeed: 50, 
  bgOffset: 0,
  timeInPhase: 0,
  phaseDuration: 45000,
};

// Inicia o texto animado DEPOIS de gameState e game estarem prontos
setTimeout(typeWriter, 500);

let player = {
  x: 200,
  y: GROUND_Y,
  width: 80,
  height: 30, 
  vx: 0,
  vy: 0,
  speed: 300,
  jumpPower: -550, // Base jump
  jumpCount: 0,
  maxJumps: 3, // TRIPLE JUMP!
  gravity: 1600,
  isJumping: false,
  isFalling: false,
  animTimer: 0,
  lastShootTime: 0,
  outfit: 'sailor',
  kind: 'luna',
  tripleShotTimer: 0,
  doubleShotTimer: 0
};

let helicopters = [];
let planes = [];

let bullets = [];
let upBullets = [];
let holes = [];
let bulldogs = [];
let enemies = [];
let savedAnimals = [];
let bombs = [];
let particles = [];
let stars = [];
let mountains = [];
let decorations = [];
let ufos = [];
let beakOpen = false;

// loadGame removed - to avoid crash due to player.outfit before player is defined

function getTheme(phase) {
  const p = (phase - 1) % 10;
  if (p === 0) return { sky: '#4DA6FF', g1: '#5D4037', g2: '#3CB371', m1: '#2E8B57', type: 'forest', starAlpha: 0 };
  if (p === 1) return { sky: '#FF8C00', g1: '#A0522D', g2: '#D2691E', m1: '#8B4513', type: 'mountain', starAlpha: 0.2 };
  if (p === 2) return { sky: '#191970', g1: '#444444', g2: '#777777', m1: '#555555', type: 'lunar', starAlpha: 1 };
  if (p === 3) return { sky: '#800080', g1: '#408080', g2: '#90EE90', m1: '#483D8B', type: 'alien', starAlpha: 0.8 };
  if (p === 4) return { sky: '#ff6600', g1: '#993300', g2: '#cc3300', m1: '#661100', type: 'mars', starAlpha: 0.4 };
  if (p === 5) return { sky: '#ffe666', g1: '#cca300', g2: '#ffcc00', m1: '#b38f00', type: 'venus', starAlpha: 0.1 };
  if (p === 6) return { sky: '#87CEEB', g1: '#006994', g2: '#00BFFF', m1: '#1CA3EC', type: 'sea', starAlpha: 0 };
  if (p === 7) return { sky: '#708090', g1: '#333333', g2: '#4d4d4d', m1: '#2f4f4f', type: 'city', starAlpha: 0.1 };
  if (p === 8) return { sky: '#003300', g1: '#001a00', g2: '#004d00', m1: '#002600', type: 'jungle', starAlpha: 0 };
  if (p === 9) return { sky: '#e0ffff', g1: '#b0e0e6', g2: '#ffffff', m1: '#87cefa', type: 'ice', starAlpha: 0.3 };
  return { sky: '#4DA6FF', g1: '#5D4037', g2: '#3CB371', m1: '#2E8B57', type: 'forest', starAlpha: 0 };
}

for(let i=0; i<100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * 400,
    size: Math.random() * 2 + 1,
    blinkOffset: Math.random() * Math.PI * 2
  });
}

function initMountains() {
  mountains = [];
  const theme = getTheme(game.phase);
  for(let i=0; i<10; i++) {
    mountains.push({
      x: i * 200 - 100,
      y: 300 + Math.random() * 100,
      width: 250 + Math.random() * 150,
      height: 200 + Math.random() * 100,
      color: theme.m1
    });
  }
}

let boss = null;
let nextAmmo = 'bone'; 

function drawCat(ctx, x, y, width, height, timer, state, isHero) {
  const drawY = y + 20; 

  // Name Tag (esconde quando é herói)
  if (!isHero) {
    ctx.save();
    ctx.translate(x, drawY);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-width/2 - 10, -height - 40, 45, 15);
    ctx.fillStyle = '#FFB6C1';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CINDER', -width/2 + 12, -height - 32);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(x, drawY);
  
  if (state === 'eating') {
    // SLEEPING CHIBI CAT 
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 5;
    
    // Sleeping grey curved body
    ctx.fillStyle = '#9aa1a2';
    ctx.beginPath(); ctx.ellipse(-10, -15, 25, 15, 0, 0, Math.PI*2); ctx.fill();
    
    // Sleeping white belly
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-5, -10, 15, 10, 0, 0, Math.PI*2); ctx.fill();
    
    // Body Stripes
    ctx.strokeStyle = '#5e6163'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-20, -28); ctx.lineTo(-15, -15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, -29); ctx.lineTo(-5, -15); ctx.stroke();
    
    // Sleeping Head (tucked in)
    ctx.fillStyle = '#9aa1a2';
    ctx.beginPath(); ctx.ellipse(-25, -12, 14, 11, -0.3, 0, Math.PI*2); ctx.fill();
    
    // Sleeping white muzzle
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-30, -9, 8, 6, -0.3, 0, Math.PI*2); ctx.fill();
    
    // Closed happy sleepy eye
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-26, -11, 4, Math.PI, 0); ctx.stroke();
    
    // Zzz
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; 
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Zzz', -15, -35 + Math.sin(timer*3)*5);
    ctx.restore();
    return;
  }

  if (state === 'jumping_to_eat') {
     ctx.translate(0, -10);
     ctx.rotate(-0.15); 
  }
  
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  
  // Alive Walking Cat!
  const swing = (state === 'jumping_to_eat') ? 0 : Math.sin(timer * 25) * 6;
  const bounce = (state === 'jumping_to_eat') ? 0 : Math.abs(Math.sin(timer * 25)) * -2;
  
  ctx.translate(0, bounce); // Walking bounce

  // Fluffy Tail
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#5e6163'; // Darker grey tail
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(12, -15);
  ctx.quadraticCurveTo(25, -25 + Math.sin(timer * 5)*10, 32, -10);
  ctx.stroke();
  
  // Back Legs
  ctx.shadowBlur = 0; // stop shadowing tiny internal parts
  ctx.fillStyle = '#7a8082';
  ctx.beginPath(); ctx.roundRect(-8 - swing, -10, 6, 10, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(12 + swing, -10, 6, 10, 3); ctx.fill();
  
  // Main Grey Bean Body
  ctx.fillStyle = '#9aa1a2';
  ctx.beginPath();
  ctx.ellipse(5, -18, 22, 14, 0, 0, Math.PI*2);
  ctx.fill();

  // White Chest/Belly extending upwards
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(0, -14, 18, 10, 0.2, 0, Math.PI*2);
  ctx.fill();
  
  // Front Legs (White)
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.roundRect(-5 + swing, -10, 6, 10, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(15 - swing, -10, 6, 10, 3); ctx.fill();

  // Back pattern Stripes
  ctx.strokeStyle = '#5e6163'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, -31); ctx.lineTo(2, -22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -30); ctx.lineTo(12, -22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(20, -25); ctx.lineTo(20, -18); ctx.stroke();

  // Big Round Head!
  ctx.fillStyle = '#9aa1a2';
  ctx.beginPath();
  ctx.ellipse(-15, -25, 17, 14, 0, 0, Math.PI*2);
  ctx.fill();

  // White Face Mask
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-16, -21, 14, 9, 0, 0, Math.PI*2);
  ctx.fill();

  // Wide cute Ears
  // Left ear
  ctx.fillStyle = '#9aa1a2';
  ctx.beginPath(); ctx.moveTo(-26, -33); ctx.lineTo(-18, -44); ctx.lineTo(-12, -35); ctx.fill();
  ctx.fillStyle = '#ffc0cb'; // Pink interior
  ctx.beginPath(); ctx.moveTo(-23, -34); ctx.lineTo(-18, -41); ctx.lineTo(-14, -36); ctx.fill();
  // Right ear
  ctx.fillStyle = '#9aa1a2';
  ctx.beginPath(); ctx.moveTo(-10, -35); ctx.lineTo(-2, -43); ctx.lineTo(-2, -30); ctx.fill();
  ctx.fillStyle = '#ffc0cb';
  ctx.beginPath(); ctx.moveTo(-8, -34); ctx.lineTo(-3, -40); ctx.lineTo(-3, -32); ctx.fill();

  // Big Shiny Eyes!
  if (Math.sin(timer * 4) > 0.95) {
     // Blinking
     ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
     ctx.beginPath(); ctx.moveTo(-26, -24); ctx.lineTo(-20, -24); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(-14, -24); ctx.lineTo(-8, -24); ctx.stroke();
  } else {
     ctx.fillStyle = '#333';
     ctx.beginPath(); ctx.ellipse(-23, -25, 3, 5, 0, 0, Math.PI*2); ctx.fill();
     ctx.beginPath(); ctx.ellipse(-11, -25, 3, 5, 0, 0, Math.PI*2); ctx.fill();
     // White kawaii shines
     ctx.fillStyle = '#fff';
     ctx.beginPath(); ctx.arc(-23.5, -26.5, 1.2, 0, Math.PI*2); ctx.fill();
     ctx.beginPath(); ctx.arc(-11.5, -26.5, 1.2, 0, Math.PI*2); ctx.fill();
  }

  // Pink boop nose
  ctx.fillStyle = '#ffb6c1';
  ctx.beginPath(); ctx.arc(-17, -21, 2.5, 0, Math.PI*2); ctx.fill(); 

  // Cute w mouth
  ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-17, -19); ctx.quadraticCurveTo(-20, -16, -22, -19); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-17, -19); ctx.quadraticCurveTo(-14, -16, -12, -19); ctx.stroke();

  // Whiskers
  ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-30, -20); ctx.lineTo(-38, -22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-30, -18); ctx.lineTo(-38, -17); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-4, -20); ctx.lineTo(4, -22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-4, -18); ctx.lineTo(4, -17); ctx.stroke();

  ctx.restore();
}

/**
 * CONTROLES (Event Listeners):
 * Aqui o computador fica "ouvindo" o que você faz.
 * Se você aperta uma tecla (keydown) ou clica no mouse (mousedown), 
 * o computador executa uma ação de jogo.
 */

// Quando uma tecla é apertada...
window.addEventListener('keydown', e => { 
  keys[e.code] = true; // Guardamos que a tecla está "apertada"
  if (gameState === 'PLAYING') {
    // Se apertar Z ou J, a Luna atira!
    if (e.code === 'KeyZ' || e.code === 'KeyJ') shoot();
    // Se apertar Espaço, Seta pra Cima ou W, a Luna pula!
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') jump();
  }
});

// Quando soltamos a tecla, limpamos a gaveta
window.addEventListener('keyup', e => keys[e.code] = false);

// Clicar com o mouse também atira
canvas.addEventListener('mousedown', () => {
  if (gameState === 'PLAYING') shoot();
});

UI.startBtn.addEventListener('click', () => {
  UI.startBtn.blur();
  initAudio();
  startGame();
});
UI.restartBtn.addEventListener('click', () => {
  UI.restartBtn.blur();
  initAudio();
  startGame();
});

UI.continueBtn.addEventListener('click', () => {
  UI.continueBtn.blur();
  UI.phaseCompleteScreen.classList.add('hidden');
  nextPhase(); // user continues!
});

UI.btnYesContinue.addEventListener('click', acceptContinue);
UI.btnNoContinue.addEventListener('click', rejectContinue);
UI.saveScoreBtn.addEventListener('click', () => {
    updateHighScores(game.score, UI.playerNameInput.value);
    renderHighScores();
    // Esconde o input pra não salvar de novo
    UI.recordInputContainer.style.display = 'none';
    UI.saveScoreBtn.disabled = true;
    // Volta ao menu principal após 1.5s
    setTimeout(() => {
      UI.gameOverScreen.classList.add('hidden');
      UI.startScreen.classList.remove('hidden');
      UI.saveScoreBtn.disabled = false;
    }, 1500);
});

// Mapa de imagens por herói
const heroImageMap = {
  luna: './luna-icon.png',
  frida: './frida-game.png',
  cinder: './Cinder-game.png',
  bear: './urso-sem-fundo.png'
};
const heroNameMap = { luna: 'Luna', frida: 'Frida', cinder: 'Cinder', bear: 'Urso' };
const heroNicknameMap = { luna: 'Luna Salsicha', frida: 'Frida Gorducha', cinder: 'Cinder Gatinha', bear: 'Urso Fofo' };

function updateHeroImages(kind) {
  const img = heroImageMap[kind] || heroImageMap.luna;
  const name = heroNameMap[kind] || 'Luna';
  const nickname = heroNicknameMap[kind] || 'Luna Salsicha';
  const menuImg = document.getElementById('menu-dog-img');
  const victoryImg = document.getElementById('victory-dog-img');
  const phaseImg = document.getElementById('phase-dog-img');
  if (menuImg) menuImg.src = img;
  if (victoryImg) victoryImg.src = img;
  if (phaseImg) phaseImg.src = img;
  menuDogImg.src = img;
  // Texto do balão do menu
  if (bubbleEl) {
    bubbleEl.innerHTML = 'Oi! Sou ' + (kind === 'bear' ? 'o ' : 'a ') + nickname + '! Aperte o botão da aventura para resgatarmos meus amiguinhos!';
  }
  // Texto da transição de fase
  const phaseBubble = document.getElementById('phase-bubble');
  if (phaseBubble) phaseBubble.textContent = 'Vamos lá! ' + (name === 'Urso' ? 'O Urso' : 'A ' + name) + ' está pronta!';
}

document.querySelectorAll('.hero-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.hero-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    updateHeroImages(btn.dataset.val);
  });
});

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    e.target.classList.add('selected');
  });
});

// menuDogCanvas click removed - element no longer in HTML


/**
 * PULAR (jump):
 * Faz a Luna subir no ar. Ela pode pular até 3 vezes (pulo triplo!).
 */
function jump() {
  // Verificamos se ela ainda tem pulos sobrando e se não está caindo num buraco
  if (player.jumpCount < player.maxJumps && !player.isFalling) {
    player.vy = player.jumpPower;   // Dá um "impulso" para cima (número negativo sobe)
    player.isJumping = true;        // Avisa que está pulando
    player.jumpCount++;             // Aumenta o contador de pulos
    soundJump();                    // Toca o som do pulinho
    createExplosion(player.x, player.y + player.height/2, '#fff', 8); // Cria uma fumaça branca
  }
}

/**
 * COMEÇAR O JOGO (startGame):
 * Reinicia todos os valores para o padrão de uma nova partida.
 */
function startGame() {
  gameState = 'PLAYING';            // Muda o estado para "Jogando"
  game.score = 0;                   // Zera os pontos
  game.phase = 1;                   // Volta para a fase 1
  game.lives = 5;                   // Dá 5 vidas
  game.continues = 5;               // Dá 5 chances extras
  // Pega a dificuldade que você escolheu nos botões coloridos
  game.difficulty = document.querySelector('.diff-btn.selected')?.dataset.val || 'medium';
  player.kind = document.querySelector('.hero-btn.selected')?.dataset.val || 'luna';
  updateHeroImages(player.kind);  // Troca imagens e textos para o herói selecionado
  // Ajusta tamanho físico conforme o herói (mesmos tamanhos dos sprites originais do jogo)
  if (player.kind === 'cinder') { player.width = 60; player.height = 35; }
  else if (player.kind === 'frida') { player.width = 110; player.height = 50; }
  else if (player.kind === 'bear') { player.width = 90; player.height = 60; }
  else { player.width = 80; player.height = 30; } // Luna padrão
  resetPhase();                     // Prepara o cenário
  UI.startScreen.classList.add('hidden'); // Esconde o menu inicial
  UI.gameOverScreen.classList.add('hidden'); // Esconde a tela de derrota
  UI.playerNameInput.value = '';             // Limpa a caixinha de nome
  if(UI.phaseTransition) UI.phaseTransition.classList.add('hidden');
  
  startBGM(); // Inicia a música de fundo
}

function resetPhase() {
  let diffMult = 1;
  if(game.difficulty === 'easy') diffMult = 0.7;
  if(game.difficulty === 'hard') diffMult = 1.3;
  
  game.speed = (250 + (game.phase - 1) * 30) * diffMult;
  game.timeInPhase = 0;
  player.x = 200;
  player.y = GROUND_Y;
  player.vy = 0;
  player.isJumping = false;
  player.isFalling = false;
  player.scale = 1; 
  player.rotation = 0;
  player.jumpCount = 0;
  player.dead = false;
  player.invincible = false;
  player.invincibleTimer = 0;
  game.cameraAngle = 0;
  bullets = [];
  upBullets = [];
  holes = [];
  bulldogs = [];
  enemies = [];
  savedAnimals = [];
  bombs = [];
  particles = [];
  decorations = [];
  ufos = [];
  player.doubleShotTimer = 0;
  player.tripleShotTimer = 0;
  boss = null;
  stopBgNoise();
  stopUfoSound();
  initMountains();
  updateUI();
}

function nextPhase() {
  gameState = 'TRANSITION';
  stopUfoSound();
  game.phase++;
  UI.nextPhase.innerText = game.phase;
  if(UI.phaseTransition) UI.phaseTransition.classList.remove('hidden');
  setTimeout(() => {
    resetPhase();
    gameState = 'PLAYING';
    if(UI.phaseTransition) UI.phaseTransition.classList.add('hidden');
    saveGame();
  }, 2500); 
}

function die(fatal = false) {
  // End phase only after Boss is defeated
  if (gameState !== 'PLAYING' || player.dead) return;
  if (player.invincible && !fatal) return;

  game.lives--;
  soundDie();
  createExplosion(player.x, player.y - player.height/2, '#f00', 40);
  player.dead = true;
  
  if (game.lives <= 0) {
    showContinueScreen();
  } else {
    player.x = -100; 
    player.y = -1000;
    player.vy = 0;
    setTimeout(() => {
      if (gameState === 'PLAYING') {
        player.x = 200;
        player.y = -100; 
        player.vy = 0;
        player.isFalling = false;
        player.scale = 1;
        player.rotation = 0;
        player.dead = false;
        player.invincible = true;
        player.invincibleTimer = 2.0;
      }
    }, 1000);
  }
  updateUI();
}

function shoot() {
  const now = Date.now();
  if (player.isFalling || player.x < 0) return;
  
  const timeSinceLast = now - player.lastShootTime;
  if (timeSinceLast < 100) return; 
  
  const isSpread = timeSinceLast > 0 && timeSinceLast < 400; 
  
  player.lastShootTime = now;
  
  soundShoot();
  let r = Math.floor(Math.random() * 4); 
  let f0 = 'food_' + r;
  let f1 = 'food_' + ((r+1)%4);
  let f2 = 'food_' + ((r+2)%4);
  
  // Tiro frontal sempre será osso, saindo do bico do tanque azul (nas costas)
  bullets.push({ x: player.x + 10, y: player.y - 45, vx: 600, rot: 0, type: 'bone' });
  
  // Tiros Verticais usam os tipos de ração aleatórios gerados acima (food_0 a food_3)
  if (player.tripleShotTimer > 0) {
    upBullets.push({ x: player.x, y: player.y - player.height - 20, vy: -600, vx: 0, rot: 0, type: f0 }); 
    upBullets.push({ x: player.x, y: player.y - player.height - 20, vy: -450, vx: -400, rot: 0, type: f1 }); 
    upBullets.push({ x: player.x, y: player.y - player.height - 20, vy: -450, vx: 400, rot: 0, type: f2 }); 
  } else if (player.doubleShotTimer > 0) {
    bullets.push({ x: player.x + 10, y: player.y - 45 - 15, vx: 600, rot: 0, type: 'bone' });
    upBullets.push({ x: player.x, y: player.y - player.height - 20, vy: -600, vx: -50, rot: 0, type: f0 });
    upBullets.push({ x: player.x, y: player.y - player.height - 20, vy: -600, vx: 50, rot: 0, type: f1 });
  } else {
    upBullets.push({ x: player.x, y: player.y - player.height - 20, vy: -600, vx: 0, rot: 0, type: f0 });
  }
}

function updateUI() {
  UI.score.innerText = game.score;
  UI.phase.innerText = game.phase;
  UI.lives.innerText = Math.max(0, game.lives);
  if (UI.continuesLeftText) UI.continuesLeftText.innerText = game.continues;
}

function createExplosion(x, y, color, count) {
  for(let i=0; i<count; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 400,
      vy: (Math.random() - 0.5) * 400,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1.0,
      color: color,
      size: Math.random() * 6 + 3
    });
  }
}

function createStarsExplosion(x, y, count) { 
  const colors = ['#FFD700', '#FFFFFF', '#FFFF00', '#00FFFF'];
  for(let i=0; i<count; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 500,
      vy: (Math.random() - 0.5) * 500,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1.0,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 2,
      isStar: true
    });
  }
}

function update(dt) {
  if (gameState !== 'PLAYING') return;
  
  game.timeInPhase += dt * 1000;
  game.bgOffset += game.speed * dt;

  if (game.timeInPhase > game.phaseDuration && !boss) {
    let bType = 'seagull';
    const bPhase = game.phase % 10;
    if (bPhase === 1) bType = 'seagull';
    else if (bPhase === 2) bType = 'bigdog';
    else if (bPhase === 3) bType = 'broom';
    else if (bPhase === 4) bType = 'fireworks';
    else if (bPhase === 5) bType = 'hose';
    else if (bPhase === 6) bType = 'wind';
    else if (bPhase === 7) bType = 'storm';
    else if (bPhase === 8) bType = 'vacuum';
    else if (bPhase === 9) bType = 'car';
    else bType = 'motorcycle';

    boss = {
      x: canvas.width + 100, y: 150, 
      hp: 15 + game.phase * 5, maxHp: 15 + game.phase * 5, 
      timer: 0, state: 'entering', type: bType
    };
    holes = []; 
    playBgNoise(bType); // Trigger ambient boss weather/engine noise!
  }

  const theme = getTheme(game.phase);

  // Background decorations spawning (clouds, comets, etc.)
  if (Math.random() < 0.01) {
    if (decorations.length < 12) {
      let icon = '☁️';
      if (theme.type === 'lunar') icon = '☄️';
      else if (theme.type === 'alien') icon = '🛸';
      else if (theme.type === 'mars') icon = '🛰️';
      else if (theme.type === 'sea') icon = '⛵';
      else if (theme.type === 'city') icon = '🚗';
      else if (theme.type === 'jungle') icon = '🌿';
      else if (theme.type === 'ice') icon = '❄️';
      
      decorations.push({
        x: canvas.width + 100,
        y: Math.random() < 0.5 && (theme.type === 'sea' || theme.type === 'city') ? GROUND_Y - 30 - Math.random() * 40 : 30 + Math.random() * 200,
        speed: 10 + Math.random() * 40,
        icon: icon,
        size: 40 + Math.random() * 40
      });
    }
  }

  for(let i = decorations.length - 1; i >= 0; i--) {
    let d = decorations[i];
    d.x -= (game.bgSpeed + d.speed) * dt;
    if (d.x < -100) decorations.splice(i, 1);
  }

  if (!player.isFalling && player.x > 0) {
    if ((keys['ArrowLeft'] || keys['KeyA']) && player.x > 50) player.x -= player.speed * dt;
    if ((keys['ArrowRight'] || keys['KeyD']) && player.x < canvas.width/2) player.x += player.speed * dt;
  }
  
  player.y += player.vy * dt;
  player.vy += player.gravity * dt;
  
  let overHole = false;
  for(let h of holes) {
    if (player.x > h.x - 10 && player.x < h.x + h.width + 10) {
      overHole = true;
      break;
    }
  }
  
  if (player.y >= GROUND_Y && !player.isFalling) {
    if (overHole && !player.isJumping && (!player.invincibleTimer || player.invincibleTimer <= 0)) {
      player.isFalling = true;
    } else {
      player.y = GROUND_Y;
      player.vy = 0;
      player.isJumping = false;
      player.jumpCount = 0; // RESET TRIPLE JUMP
    }
  }

  if (player.isFalling) {
    player.scale = Math.max(0, (player.scale || 1) - dt * 1.5);
    player.rotation = (player.rotation || 0) + dt * 15;
    player.y += 150 * dt; 
  }
  
  if (player.y > canvas.height + 100) {
    die(true);
  }

  for(let m of mountains) {
    m.x -= game.bgSpeed * dt;
    if (m.x + m.width < 0) {
      m.x = canvas.width + Math.random() * 100;
      m.height = 200 + Math.random() * 100;
      m.y = 300 + Math.random() * 100;
    }
  }

  let spawnMult = 1;
  if(game.difficulty === 'easy') spawnMult = 0.5;
  if(game.difficulty === 'hard') spawnMult = 1.5;

  const baseHoleChance = (boss || game.timeInPhase > game.phaseDuration - 2000) ? 0 : (0.003 + (game.phase * 0.0006)) * spawnMult;
  const baseBulldogChance = boss ? 0 : (0.002 + (game.phase * 0.0005)) * spawnMult;
  
  const maxEnemies = boss ? 0 : Math.max(1, Math.ceil((1 + game.phase) * spawnMult)); 
  const baseEnemyChance = boss ? 0 : (0.003 + (game.phase * 0.001)) * spawnMult; 

  let targetAngle = 0; // Inclinação Diagonal do Terreno
  if (!boss && game.timeInPhase > 12000 && game.timeInPhase < game.phaseDuration - 8000) {
    const rawSin = Math.sin(game.timeInPhase * 0.0002);
    if (game.phase === 3) {
        targetAngle = rawSin * 0.15;
    } else if (game.phase === 4) {
        targetAngle = Math.abs(rawSin) * 0.15; // Mudar para subir
    } else if (game.phase === 5) {
        targetAngle = -Math.abs(rawSin) * 0.15; // Mudar para descer
    } else if (game.phase >= 6) {
        targetAngle = rawSin * 0.15; // Sobe e desce
    }
  }
  game.cameraAngle = (game.cameraAngle || 0) + (targetAngle - (game.cameraAngle || 0)) * dt * 1.5;

  if (Math.random() < baseHoleChance) {
    if (holes.length === 0 || holes[holes.length-1].x < canvas.width - 350) {
      holes.push({ x: canvas.width, width: 150 + Math.random() * 80 }); 
    }
  }
  if (Math.random() < baseBulldogChance) {
    let valid = true;
    for(let h of holes) {
      if (Math.abs(h.x - canvas.width) < h.width * 2 + 100) valid = false;
    }
    if (valid && bulldogs.length < 2) { 
      // Pool de obstáculos: todos MENOS o herói selecionado. Se não é Luna, Luna vira obstáculo!
      let kinds = ['cinder', 'frida', 'white_bear', 'brown_bear', 'panda_bear'];
      if (player.kind !== 'luna') kinds.push('luna');
      // Remove o herói atual e variantes dele
      if (player.kind === 'cinder') kinds = kinds.filter(k => k !== 'cinder');
      else if (player.kind === 'frida') kinds = kinds.filter(k => k !== 'frida');
      else if (player.kind === 'bear') kinds = kinds.filter(k => !k.includes('bear'));
      
      const t = kinds[Math.floor(Math.random() * kinds.length)];
      let w = t === 'cinder' ? 60 : (t === 'frida' || t === 'luna' ? 110 : 90); 
      let h = t === 'cinder' ? 35 : (t === 'frida' || t === 'luna' ? 50 : 60);
      if (t === 'luna') { w = 80; h = 40; }
      bulldogs.push({ x: canvas.width, y: GROUND_Y, width: w, height: h, state: 'idle', animTimer: 0, kind: t }); 
      if (t === 'cinder') soundMeow(); 
      else if (t.includes('bear')) soundBear(); 
      else if (t === 'luna') soundDachshundBark();
      else soundDogBark();
    }
  }
  if (Math.random() < baseEnemyChance) { 
    if (enemies.length < maxEnemies) { 
      // Apenas animais com corpos inteiros (sem rostos avulsos como urso ou panda)
      const types = ['🐈','🐒','🕊️','🐅','🐎','🐂','🐄','🐖','🐏','🐑','🐐','🐪','🦌','🐇','🐿️'];
      const badTypes = ['🐦‍⬛'];
      enemies.push({ 
        x: canvas.width + 50, 
        y: 40 + Math.random() * 180, 
        vx: -150 - Math.random() * 80 * (1 + game.phase * 0.1), 
        timer: 0,
        type: types[Math.floor(Math.random() * types.length)],
        badType: badTypes[Math.floor(Math.random() * badTypes.length)]
      });
      soundCrow();
    }
  }

  for(let i = holes.length - 1; i >= 0; i--) {
    holes[i].x -= game.speed * dt;
    if (holes[i].x + holes[i].width < -150) holes.splice(i, 1);
  }
  
  /**
   * ATUALIZAÇÃO DOS BULLDOGS (bulldogs):
   * Os bulldogs são "inimigos" que ficam parados, mas se você der um osso, eles
   * ficam felizes e começam a pular de alegria (state = 'eating').
   */
  for(let i = bulldogs.length - 1; i >= 0; i--) {
    let b = bulldogs[i];
    
    // ESTADO: Pulando para comer o osso que você atirou
    if (b.state === 'jumping_to_eat') {
      b.y += (b.vy * dt);          // Move na vertical
      b.vy += 1500 * dt;           // Gravidade puxando pra baixo
      b.x -= game.speed * dt;      // O chão se move, então ele vai pra trás
      if (b.y >= GROUND_Y) {       // Tocou o chão!
         b.y = GROUND_Y;
         b.state = 'eating';       // Agora ele está comendo/feliz
         b.animTimer = 0;
         soundHappy();             // Som de cachorro feliz
         createExplosion(b.x, b.y - 30, '#ffb6c1', 20); // Coraçõezinhos!
         game.score += 20;         // Você ganha pontos por alimentar ele
         updateUI();
      }
    } 
    // ESTADO: Comendo/Feliz (ele não te machuca mais)
    else if (b.state === 'eating') {
      b.x -= game.speed * dt; 
      b.animTimer += dt;
      if (Math.random() < 0.05) { 
        createExplosion(b.x, b.y - 30, '#ffb6c1', 2); // Efeito visual de alegria
      }
      if (b.x + b.width < -100) bulldogs.splice(i, 1); // Sumiu da tela, a gente remove
    } 
    // ESTADO: Bravo (Se você encostar nele, você perde vida!)
    else {
      b.x -= game.speed * dt;
      b.animTimer += dt;
      
      /**
       * DETECÇÃO DE COLISÃO:
       * A gente calcula a distância entre a Luna e o Bulldog.
       * Se a distância for muito pequena, significa que eles se bateram!
       */
      if (!player.isFalling && (!player.invincibleTimer || player.invincibleTimer <= 0) &&
          Math.abs(player.x - b.x) < player.width/2 + b.width/2 - 10 &&
          Math.abs(player.y - player.height/2 - (b.y - b.height/2)) < player.height/2 + b.height/2 - 10) {
        
        if (player.vy > 0) { // Pulo estilo Mario
          b.state = 'eating';
          b.animTimer = 0;
          soundHappy();
          createExplosion(b.x, b.y - 30, '#ffb6c1', 20);
          game.score += 20;
          player.vy = player.jumpPower * 0.8; // Quica
          updateUI();
        } else {
          die(); // Luna se machucou :(
        }
      }
      if (b.x + b.width < -100) bulldogs.splice(i, 1);
    }
  }

  for(let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].x += enemies[i].vx * dt;
    enemies[i].timer += dt;
    if (Math.random() < 0.002 + (game.phase * 0.0003) && enemies[i].x < canvas.width && enemies[i].x > 0) {
      bombs.push({ x: enemies[i].x, y: enemies[i].y, vy: 200 + game.phase * 20 });
    }
    if (enemies[i].x < -50) enemies.splice(i, 1);
  }

  for(let i = savedAnimals.length - 1; i >= 0; i--) {
    let sa = savedAnimals[i];
    sa.y += sa.vy * dt;
    sa.vy += 200 * dt; 
    if (sa.vy > 80) sa.vy = 80; 
    sa.x -= (game.speed * 0.2) * dt; 
    
    if (sa.y >= GROUND_Y) {
      createExplosion(sa.x, sa.y, '#ffb6c1', 8); 
      savedAnimals.splice(i, 1);
    }
  }

  // Boss update swoop logic
  if (boss) {
    boss.timer += dt;
    if (boss.state === 'entering') {
      boss.x -= 200 * dt;
      if (boss.x < canvas.width / 2) boss.state = 'fighting';
    } else if (boss.state === 'fighting') {
      if (!boss.dead) {
        // Define o movimento do Boss de acordo com o tipo
        if (boss.type === 'bigdog') {
           // Hilda the ground charger
           boss.y = Math.min(boss.y + 200 * dt, GROUND_Y - 40);
           boss.x = canvas.width / 2 + Math.sin(boss.timer * 2.0) * (canvas.width / 2 - 20); 
        } else if (boss.type === 'seagull') {
           // Gaivota Dive Attack!
           if (!boss.mode) boss.mode = 'FLYING';
           if (!boss.modeTimer) boss.modeTimer = 0;
           boss.modeTimer += dt;
           
           if (boss.mode === 'FLYING') {
              boss.x = canvas.width / 2 + Math.sin(boss.timer * 1.5) * (canvas.width / 2 - 50);
              boss.y = 150 + Math.sin(boss.timer * 3.5) * 80;
              if (boss.modeTimer > 6) { // Volta a mergulhar a cada 6s
                  boss.mode = 'DIVING';
                  boss.modeTimer = 0;
              }
           } else {
              // Mergulho (Diving)
              const targetY = GROUND_Y - 50;
              const targetX = player.x + 100; // tenta passar por cima
              boss.x += (targetX - boss.x) * dt * 2;
              boss.y += (targetY - boss.y) * dt * 3;
               if (boss.modeTimer > 3) { // 3 segundos de mergulho
                   boss.mode = 'FLYING';
                   boss.modeTimer = 0;
               }
               // Sound on dive start
               if (boss.modeTimer < 0.1) {
                 seagullAudio.currentTime = 0;
                 seagullAudio.play().catch(e=>{});
               }
            }
        } else {
           // Flying bosses loop sky
           boss.x = canvas.width / 2 + Math.sin(boss.timer * 1.5) * (canvas.width / 2 - 50);
           boss.y = 150 + Math.sin(boss.timer * 3.5) * 80;
        }
        
        // Dano Corpo-a-Corpo caso o Chefe colida diretamente (ex: Ilda o Cão!)
        if (!player.isFalling && !player.invincible && boss.y > 200 &&
            Math.abs(player.x - boss.x) < 50 &&
            Math.abs((player.y - player.height/2) - boss.y) < 50) {
           die();
        }
        
        // Boss joga torpedos muito mais rapido agora (rate maior)
        if (Math.random() < 0.05 + (game.phase * 0.015)) {
           bombs.push({ x: boss.x, y: boss.y + 40, vy: 400 });
        }
      }

      if (boss.hp <= 0 && !boss.dead) {
         boss.dead = true;
         stopBgNoise();
         game.score += 500;
         updateUI();
         
         // PAUSE AND SHOW VICTORY OVERLAY WITH EXPLOSIONS!
         let expCount = 0;
         let expInt = setInterval(() => {
           if (gameState !== 'PLAYING') {
              clearInterval(expInt);
              return;
           }
           createExplosion(boss.x + (Math.random()-0.5)*150, boss.y + (Math.random()-0.5)*150, '#ffaa00', 80);
           createExplosion(boss.x + (Math.random()-0.5)*150, boss.y + (Math.random()-0.5)*150, '#ff0000', 80);
           soundPoof();
           expCount++;
           
           if(expCount > 10) {
              clearInterval(expInt);
              boss = null;
              gameState = 'PHASE_COMPLETE';
              UI.phaseCompleteScreen.classList.remove('hidden');
           }
         }, 150);
      }
    }
  }

  for(let i = bombs.length - 1; i >= 0; i--) {
    bombs[i].y += bombs[i].vy * dt;
    bombs[i].x -= game.speed * 0.2 * dt; 
    
    if (!player.isFalling &&
        Math.abs(player.x - bombs[i].x) < player.width/2 &&
        Math.abs(player.y - player.height/2 - bombs[i].y) < player.height/2) {
      die();
    }
    
    if (bombs[i].y > GROUND_Y) {
      soundBombImpact(); // Som sintético de lata latência 0!
      soundPoof(); // Usamos o poof como base complementar
      createExplosion(bombs[i].x, GROUND_Y, '#ffaa00', 10);
      bombs.splice(i, 1);
    }
  }

  for(let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].x += bullets[i].vx * dt;
    bullets[i].rot += dt * 10;
    let hit = false;
    
    for(let j = bulldogs.length - 1; j >= 0; j--) {
      let b = bulldogs[j];
      if (b.state === 'idle' && Math.abs(bullets[i].x - b.x) < b.width/2 + 20 && Math.abs(bullets[i].y - (b.y - b.height/2)) < b.height + 20) {
        if (b.kind === 'cinder' && bullets[i].type === 'bone') continue; // Cinder ignores bone!
        b.state = 'jumping_to_eat'; 
        b.vy = -400; 
        b.animTimer = 0;
        soundJump();
        hit = true;
        break;
      }
    }
    
    if (!hit) {
      for(let k = bombs.length - 1; k >= 0; k--) {
        if (Math.abs(bullets[i].x - bombs[k].x) < 35 && Math.abs(bullets[i].y - bombs[k].y) < 35) {
          soundTink();
          createStarsExplosion(bombs[k].x, bombs[k].y, 25);
          game.score += 15;
          updateUI();
          bombs.splice(k, 1);
          hit = true;
          break;
        }
      }
    }

    if (hit) {
      bullets.splice(i, 1);
      continue;
    }
    if (boss && Math.abs(bullets[i].x - boss.x) < 80 && Math.abs(bullets[i].y - boss.y) < 80) {
      boss.hp--;
      soundTink();
      createExplosion(bullets[i].x, bullets[i].y, '#ffea00', 10);
      bullets.splice(i, 1);
      continue;
    }

    if (bullets[i].x > canvas.width) bullets.splice(i, 1);
  }

  for(let i = upBullets.length - 1; i >= 0; i--) {
    upBullets[i].y += upBullets[i].vy * dt;
    upBullets[i].x += (upBullets[i].vx || 0) * dt; 
    upBullets[i].rot += dt * 10;
    let hit = false;
    
    if (boss && Math.abs(upBullets[i].x - boss.x) < 80 && Math.abs(upBullets[i].y - boss.y) < 80) {
      boss.hp--;
      soundTink();
      createExplosion(upBullets[i].x, upBullets[i].y, '#ffea00', 10);
      upBullets.splice(i, 1);
      continue;
    }

    for(let j = enemies.length - 1; j >= 0; j--) {
      if (Math.abs(upBullets[i].x - enemies[j].x) < 50 && Math.abs(upBullets[i].y - (enemies[j].y - 20)) < 50) {
        soundPoof();
        createExplosion(enemies[j].x, enemies[j].y - 20, '#fff', 30); 
        soundFreeAnimal();
        savedAnimals.push({ x: enemies[j].x, y: enemies[j].y + 10, type: enemies[j].type, vy: -50 });
        enemies.splice(j, 1);
        game.score += 50;
        updateUI();
        hit = true;
        break;
      }
    }

    if (!hit) {
      for(let k = bombs.length - 1; k >= 0; k--) {
        if (Math.abs(upBullets[i].x - bombs[k].x) < 35 && Math.abs(upBullets[i].y - bombs[k].y) < 35) {
          soundTink();
          createStarsExplosion(bombs[k].x, bombs[k].y, 25);
          game.score += 15;
          updateUI();
          bombs.splice(k, 1);
          hit = true;
          break;
        }
      }
    }

    if (hit) {
      upBullets.splice(i, 1);
      continue;
    }
    if (upBullets[i].y < -100) upBullets.splice(i, 1);
  }

  for(let i = particles.length - 1; i >= 0; i--) {
    particles[i].x += particles[i].vx * dt;
    particles[i].y += particles[i].vy * dt;
    particles[i].life -= dt;
    if (particles[i].life <= 0) particles.splice(i, 1);
  }

  if (player.tripleShotTimer > 0) {
    player.tripleShotTimer -= dt * 1000;
    if (player.tripleShotTimer <= 0) soundPowerDown();
  }
  if (player.doubleShotTimer > 0) {
    player.doubleShotTimer -= dt * 1000;
    if (player.doubleShotTimer <= 0) soundPowerDown();
  }

  updateHeliSound();

  // UFO Logic
  const ufoChance = (Math.random() < 0.003) && ufos.length === 0;
  if (ufoChance) {
    ufos.push({ x: canvas.width + 100, y: 70 + Math.random() * 80, vx: -250, hp: 1, timer: 0 });
    startUfoSound();
  }

  let ufoActive = false;
  for(let i = ufos.length - 1; i >= 0; i--) {
     let u = ufos[i];
     u.x += u.vx * dt;
     u.timer += dt;
     u.y += Math.sin(u.timer * 5) * 1.5; // Faz o disco "tremer" no ar
     
     ufoActive = true;

     // Colisão balas com UFO
     for(let j = bullets.length -1; j >= 0; j--) {
       if (Math.abs(bullets[j].x - u.x) < 40 && Math.abs(bullets[j].y - u.y) < 40) {
          u.hp--; bullets.splice(j, 1); soundTink(); createExplosion(u.x, u.y, '#fff', 5);
       }
     }
     for(let j = upBullets.length -1; j >= 0; j--) {
       if (Math.abs(upBullets[j].x - u.x) < 40 && Math.abs(upBullets[j].y - u.y) < 40) {
          u.hp--; upBullets.splice(j, 1); soundTink(); createExplosion(u.x, u.y, '#fff', 5);
       }
     }

     if (u.hp <= 0) {
        createExplosion(u.x, u.y, '#55ff55', 60);
        soundPowerUp(); 
        player.doubleShotTimer = 7000; // Agora 7 segundos como pedido
        ufos.splice(i, 1);
        ufoActive = false;
        stopUfoSound();
     } else if (u.x < -100) {
        ufos.splice(i, 1);
        ufoActive = false;
        stopUfoSound();
     }
  }

  if (!ufoActive) stopUfoSound();

  // Helicopter Update (1-hit kill update)
  const heliSpawnChance = (game.currentPhaseTime < 5000 || (game.currentPhaseTime > game.phaseDuration - 5000 && !boss)) ? 0.005 : 0; // Using timeInPhase check
  const actualHeliChance = (game.timeInPhase < 5000 || (game.timeInPhase > game.phaseDuration - 7000 && !boss)) ? 0.005 : 0;
  
  if (Math.random() < actualHeliChance && helicopters.length === 0) {
    helicopters.push({
      x: canvas.width + 100,
      y: 80,
      vx: -200,
      hp: 1, // 1 shot kill now!
      timer: 0
    });
  }

  for(let i = helicopters.length - 1; i >= 0; i--) {
    let h = helicopters[i];
    h.x += h.vx * dt;
    h.timer += dt;
    h.y = 80 + Math.sin(h.timer * 4) * 20;

    // Bullets vs Helicopter
    for(let j = bullets.length - 1; j >= 0; j--) {
      if (Math.abs(bullets[j].x - h.x) < 45 && Math.abs(bullets[j].y - h.y) < 45) {
        h.hp--;
        bullets.splice(j, 1);
        soundTink();
        createExplosion(h.x, h.y, '#fff', 5);
      }
    }
    for(let k = upBullets.length - 1; k >= 0; k--) {
       if (Math.abs(upBullets[k].x - h.x) < 45 && Math.abs(upBullets[k].y - h.y) < 45) {
         h.hp--; upBullets.splice(k, 1); soundTink(); createExplosion(h.x, h.y, '#fff', 5);
       }
    }

    if (h.hp <= 0) {
      createExplosion(h.x, h.y, '#ffea00', 60);
      soundMarioWin();
      speak("Tiro Triplo!");
      player.tripleShotTimer = 12000; // 12 seconds
      helicopters.splice(i, 1);
      updateHeliSound(); // stop sound immediately
    } else if (h.x < -150) {
      helicopters.splice(i, 1);
      updateHeliSound();
    }
  }

  if (player.invincible) {
    player.invincibleTimer -= dt;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }

  player.animTimer += dt;
}

/**
 * ============================================================================
 *               FUNÇÕES DE DESENHO (O Nosso Pincel Mágico)
 * ============================================================================
 * 
 * Aqui é onde a mágica visual acontece! Imagine que o computador é um 
 * artista muito rápido. Ele desenha cada coisa (Luna, inimigos, nuvens) 
 * muitas vezes por segundo.
 */
// --- FUNÇÕES DE PINTURA (DRAW) ---
function drawLunaMenu(ctx, x, y, size, timer) {
  if (menuDogImg.complete && menuDogImg.naturalWidth > 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size/100, size/100);
    // Draw the image instead of procedural
    ctx.drawImage(menuDogImg, -80, -80, 160, 160);
    ctx.restore();
    return;
  }
  
  // Fallback to procedural if image not loaded
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size/100, size/100);

  // Wag tail
  const wag = Math.sin(timer * 20) * 0.4;
  ctx.save();
  ctx.translate(25, -5);
  ctx.rotate(wag + 0.3);
  ctx.fillStyle = '#833d1a'; // Dark brown
  ctx.beginPath();
  ctx.ellipse(0, -15, 6, 20, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  // Back legs
  ctx.fillStyle = '#6b3216';
  ctx.beginPath(); ctx.ellipse(-15, 20, 7, 12, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(15, 20, 7, 12, 0, 0, Math.PI*2); ctx.fill();

  // Long Body
  ctx.fillStyle = '#af582c'; // light brown
  ctx.beginPath();
  ctx.ellipse(0, 0, 35, 24, 0, 0, Math.PI*2);
  ctx.fill();

  // Front legs
  ctx.beginPath(); ctx.ellipse(-20, 22, 7, 12, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(20, 22, 7, 12, 0, 0, Math.PI*2); ctx.fill();

  // Paws
  ctx.fillStyle = '#6b3216';
  ctx.beginPath(); ctx.ellipse(-22, 28, 9, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(22, 28, 9, 5, 0, 0, Math.PI*2); ctx.fill();

  // Head Base
  ctx.save();
  ctx.translate(-25, -20);
  ctx.rotate(0); // slight head wobble while talking

  // Back ear
  ctx.fillStyle = '#6b3216';
  ctx.beginPath(); ctx.ellipse(18, 5, 12, 28, -0.2, 0, Math.PI*2); ctx.fill();

  // Head
  ctx.fillStyle = '#af582c';
  ctx.beginPath(); ctx.ellipse(0, -5, 22, 20, 0, 0, Math.PI*2); ctx.fill();

  // Snout
  ctx.beginPath(); ctx.ellipse(-15, 5, 16, 12, -0.2, 0, Math.PI*2); ctx.fill();

  // Black nose
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.ellipse(-27, 2, 8, 6, -0.2, 0, Math.PI*2); ctx.fill();

  // Front ear (floppy)
  ctx.fillStyle = '#6b3216';
  ctx.beginPath(); ctx.ellipse(5, 5, 15, 30, 0.2 + (Math.sin(timer*8)*0.05), 0, Math.PI*2); ctx.fill();

  // Big cute Eyes (OLHO BRANCO)
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-10, -10, 8, 11, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(6, -12, 6, 9, 0, 0, Math.PI*2); ctx.fill();
  
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.ellipse(-12, -10, 5, 8, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(4, -12, 4, 7, 0, 0, Math.PI*2); ctx.fill();
  
  ctx.fillStyle = '#fff'; // Shines
  ctx.beginPath(); ctx.arc(-14, -14, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(2, -16, 2, 0, Math.PI*2); ctx.fill();

  // Smile
  ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-15, 10); ctx.quadraticCurveTo(-5, 18, 5, 8); ctx.stroke();

  ctx.restore();
  ctx.restore();
}

function drawMenuDogs(timer) {
  // Canva components removed, using CSS animation for the icon img
  return;
}

/**
 * DESENHANDO A LUNA (drawDog):
 * Esta é a função mais importante! Ela desenha a nossa heroína Luna.
 * A gente usa formas geométricas (retângulos arredondados, círculos) 
 * para montar o corpo dela.
 */
function drawAnimatedAnimal(ctx, x, y, width, height, timer, isJumping, isFalling, type = 'luna') {
  if (player.dead) return; 
  
  let bodyColor1, bodyColor2, earColor;
  let isBear = false;
  let isCat = false;
  let isFrida = false;
  
  if (type === 'luna') {
    bodyColor1 = '#B2663E'; bodyColor2 = '#5C2E0A'; earColor = '#5C2E0A';
  } else if (type === 'frida') {
    bodyColor1 = '#e6b800'; bodyColor2 = '#997a00'; earColor = '#cc9900';
    isFrida = true;
  } else if (type === 'cinder') {
    bodyColor1 = '#95a5a6'; bodyColor2 = '#34495e'; earColor = '#2c3e50';
    isCat = true;
  } else {
    bodyColor1 = '#9b59b6'; bodyColor2 = '#4a235a'; earColor = '#3e1a4d';
    if(type === 'brown_bear') { bodyColor1 = '#CD853F'; bodyColor2='#8B4513'; earColor='#5C2E0A'; }
    else if(type === 'white_bear') { bodyColor1 = '#ecf0f1'; bodyColor2='#bdc3c7'; earColor='#7f8c8d'; }
    else if(type === 'panda_bear') { bodyColor1 = '#ecf0f1'; bodyColor2='#bdc3c7'; earColor='#2c3e50'; }
    isBear = true;
  }

  const drawY = y + 20; 
  ctx.save();
  
  if (player.invincible && player.kind === type) { // Pisca pisca só pro hero
    ctx.globalAlpha = (Math.floor(Date.now() / 150) % 2 === 0) ? 0.3 : 0.8;
  }
  
  ctx.translate(x, drawY); 
  ctx.scale(player.scale || 1, player.scale || 1);
  if (isFalling) ctx.rotate(player.rotation || 0);
  else if (isJumping) ctx.rotate(-Math.PI / 12);
  
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 8;
  
  const bodyGrad = ctx.createLinearGradient(0, -height - 10, 0, 0);
  bodyGrad.addColorStop(0, bodyColor1);
  bodyGrad.addColorStop(1, bodyColor2);

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  if (isBear) {
    // Urso é mais gordinho
    ctx.roundRect(-width/1.8, -height - 15, width*1.1, height+10, (height+10)/2);
  } else {
    // Corpo padrão de quadrupede
    ctx.roundRect(-width/2, -height - 10, width, height, height/2);
  }
  if (type === 'panda_bear') {
    ctx.fill();
    ctx.fillStyle = '#2c3e50'; 
    ctx.beginPath(); ctx.roundRect(-width/2+10, -height - 10, 20, height, 5); ctx.fill();
  } else {
    ctx.fill();
  }

  ctx.shadowBlur = 0; 
  ctx.shadowOffsetY = 0;

  // Outfit suit só na Luna hero por agora, ou pra todos? Vamos colocar pra todos pra ficar bonito!
  if (player.outfit === 'suit' && player.kind === type) {
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.moveTo(-width/2, -height - 5); ctx.lineTo(0, -5); ctx.lineTo(width/2, -height - 5);
    ctx.lineTo(width/2, 0); ctx.lineTo(-width/2, 0); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-10, -height - 2); ctx.lineTo(0, -10); ctx.lineTo(10, -height - 2); ctx.fill();
    ctx.fillStyle = '#f00';
    ctx.beginPath(); ctx.moveTo(-5, -height + 2); ctx.lineTo(5, -height + 10); ctx.lineTo(-5, -height + 10); ctx.lineTo(5, -height + 2); ctx.fill();
  }

  const headGrad = ctx.createRadialGradient(width/2 + 5, -height - 17, 0, width/2 + 5, -height - 17, 30);
  headGrad.addColorStop(0, bodyColor1);
  headGrad.addColorStop(1, bodyColor2);

  ctx.fillStyle = headGrad;
  ctx.beginPath();
  if (isBear) {
    ctx.roundRect(width/2 - 15, -height - 35, 35, 35, 17.5);
  } else {
    ctx.roundRect(width/2 - 10, -height - 30, 30, 25, 12);
  }
  ctx.fill();

  if (game.phase >= 11 && player.kind === type) {
    if (player.outfit === 'sailor') {
      ctx.save(); ctx.translate(width/2 + 5, -height - 30); ctx.rotate(-0.1);
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 5;
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 12, Math.PI, 0); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#ff69b4'; ctx.fillRect(-15, -2, 30, 4);
      ctx.fillStyle = '#ff1493'; ctx.fillRect(-5, -12, 10, 2); ctx.restore();
    } else if (player.outfit === 'suit') {
      ctx.save(); ctx.translate(width/2 + 10, -height - 35); ctx.fillStyle = '#222';
      ctx.fillRect(-15, 0, 30, 5); ctx.fillRect(-10, -15, 20, 15);
      ctx.fillStyle = '#f00'; ctx.fillRect(-10, -5, 20, 3); ctx.restore();
    }
  }

  // Tanquezinho Escolar / Mochila (Só o herói deve ter a mochila de tiro!)
  // Inimigos não devem ter canhão nas costas.
  if (player.kind === type) {
    ctx.save();
    ctx.translate(-5, -height - 18); 
    ctx.fillStyle = '#00bfff'; ctx.beginPath(); ctx.roundRect(-12, -12, 24, 18, 6); ctx.fill();
    ctx.fillStyle = '#ccffff'; ctx.beginPath(); ctx.roundRect(-6, -8, 12, 10, 3); ctx.fill();
    ctx.fillStyle = '#ff1493'; ctx.beginPath(); ctx.roundRect(-5, -16, 10, 5, 2); ctx.fill();
    ctx.fillStyle = '#aaa'; 
    ctx.beginPath(); ctx.moveTo(12, -4); ctx.lineTo(20, -2); ctx.lineTo(20, 2); ctx.lineTo(12, 4); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(-6, 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(6, 18); ctx.stroke();
    ctx.restore();
  }

  // Focinho
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  if (!isBear) ctx.roundRect(width/2 + 10, -height - 20, 25, 15, 8);
  ctx.fill();
  
  // Nariz
  ctx.fillStyle = '#000';
  ctx.beginPath();
  if (isBear) ctx.arc(width/2 + 18, -height - 14, 5, 0, Math.PI*2);
  else ctx.arc(width/2 + 33, -height - 14, 4, 0, Math.PI*2);
  ctx.fill();

  // Olhos
  if (Math.sin(timer * 4) > 0.96) {
     ctx.fillStyle = headGrad; 
     ctx.beginPath();
     if (isBear) ctx.ellipse(width/2 - 2, -height - 25, 5, 5, 0, 0, Math.PI*2);
     else ctx.ellipse(width/2 + 12, -height - 22, 6, 9, 0, 0, Math.PI*2);
     ctx.fill();
     ctx.fillStyle = '#000'; 
     if (isBear) ctx.fillRect(width/2 - 6, -height - 25, 8, 2);
     else ctx.fillRect(width/2 + 8, -height - 22, 8, 2);
  } else {
    // Normal Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    if (isBear) ctx.ellipse(width/2 - 2, -height - 25, 4, 4, 0, 0, Math.PI*2);
    else ctx.ellipse(width/2 + 12, -height - 22, 5, 8, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    if (isBear) ctx.arc(width/2, -height - 25, 2.5, 0, Math.PI*2);
    else ctx.arc(width/2 + 14, -height - 24, 3.5, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    if (isBear) ctx.arc(width/2, -height - 26, 1.0, 0, Math.PI*2);
    else ctx.arc(width/2 + 15, -height - 25, 1.5, 0, Math.PI*2);
    ctx.fill();
  }

  // Orelhas animadas
  ctx.save();
  ctx.translate(width/2, -height - 25);
  let earFlap = 0;
  if (isFalling) earFlap = -Math.PI/2 + Math.sin(timer * 30) * 0.3;
  else if (isJumping) earFlap = -Math.PI/3 + Math.sin(timer * 40) * 0.6; 
  else earFlap = -Math.PI/8 + Math.sin(timer * 20) * 0.4;
  ctx.rotate(earFlap);
  
  ctx.fillStyle = earColor;
  ctx.beginPath();
  if (isCat) { ctx.moveTo(-5,-2); ctx.lineTo(6,-2); ctx.lineTo(0,-18); }
  else if (isBear) { ctx.arc(0, -12, 10, 0, Math.PI*2); }
  else if (isFrida) { ctx.ellipse(2, -8, 6, 12, Math.PI/4, 0, Math.PI*2); }
  else { ctx.ellipse(-2, 12, 6, 15, 0, 0, Math.PI*2); } // Luna
  ctx.fill();
  ctx.restore();

  // Rabo animado
  ctx.save();
  if (isBear) {
    ctx.translate(-width/2 - 10, -height);
  } else {
    ctx.translate(-width/2 + 5, -height - 5);
  }
  ctx.rotate(Math.sin(timer * 15) * 0.3 - 0.5);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  if (isCat) {
      ctx.roundRect(-25, -2, 30, 4, 2); 
      ctx.roundRect(-25, -10, 4, 10, 2); 
  } else if (isBear) {
      ctx.arc(-5, 0, 10, 0, Math.PI*2);
  } else if (isFrida) {
      ctx.roundRect(-10, -5, 15, 6, 3);
  } else { // Luna
      ctx.roundRect(-20, -5, 25, 8, 4);
  }
  ctx.fill();
  ctx.restore();

  // Patas balançantes
  ctx.fillStyle = earColor;
  const swing = isJumping || isFalling ? 0 : Math.sin(timer * 20) * 10;
  
  ctx.beginPath();
  ctx.roundRect(-width/2 + 10 + swing, -15, 8, 15, 4);
  ctx.roundRect(width/2 - 20 - swing, -15, 8, 15, 4);
  ctx.roundRect(-width/2 + 20 - swing, -15, 8, 15, 4);
  ctx.roundRect(width/2 - 10 + swing, -15, 8, 15, 4);
  ctx.fill();

  ctx.restore();
}

function drawBone(ctx, x, y, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  
  ctx.shadowColor = 'rgba(255,255,255,0.8)';
  ctx.shadowBlur = 10;
  
  const boneGrad = ctx.createLinearGradient(-10, -5, 10, 5);
  boneGrad.addColorStop(0, '#fff');
  boneGrad.addColorStop(1, '#ddd');

  ctx.fillStyle = boneGrad;
  ctx.beginPath();
  ctx.roundRect(-10, -3, 20, 6, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-10, -4, 5, 0, Math.PI*2);
  ctx.arc(-10, 4, 5, 0, Math.PI*2);
  ctx.arc(10, -4, 5, 0, Math.PI*2);
  ctx.arc(10, 4, 5, 0, Math.PI*2);
  ctx.fill();
  
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-10, -5, 1.5, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();
}

function drawFood(ctx, x, y, rot, type) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.shadowColor = 'rgba(255,100,0,0.8)';
  ctx.shadowBlur = 10;
  
  if (type === 'food_0') {
    // Meatball redonda
    ctx.fillStyle = '#8B4513';
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#A0522D';
    ctx.beginPath(); ctx.arc(-2, -2, 2, 0, Math.PI*2); ctx.fill();
  } else if (type === 'food_1') {
    // Ração quadrada
    ctx.fillStyle = '#CD853F'; ctx.fillRect(-5, -5, 10, 10);
    ctx.fillStyle = '#8B4513'; ctx.fillRect(-2, -2, 4, 4);
  } else if (type === 'food_2') {
    // Mini-osso dourado
    ctx.fillStyle = '#F5DEB3'; 
    ctx.fillRect(-4, -2, 8, 4);
    ctx.beginPath(); ctx.arc(-4, -2, 3, 0, Math.PI*2); ctx.arc(-4, 2, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -2, 3, 0, Math.PI*2); ctx.arc(4, 2, 3, 0, Math.PI*2); ctx.fill();
  } else {
    // Mini carinha de cachorro biscoito
    ctx.fillStyle = '#D2691E';
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill(); 
    ctx.beginPath(); ctx.ellipse(-4, -3, 2, 4, -0.5, 0, Math.PI*2); ctx.fill(); 
    ctx.beginPath(); ctx.ellipse(4, -3, 2, 4, 0.5, 0, Math.PI*2); ctx.fill(); 
  }
  ctx.restore();
}

function drawBulldog(ctx, x, y, width, height, timer, state, isHero) {
  const drawY = y + 20;

  // Placa de nome (esconde quando é herói pra não espelhar)
  if (!isHero) {
    ctx.save();
    ctx.translate(x, drawY);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-width/2 - 10, -height - 35, 40, 15);
    ctx.fillStyle = '#FFD700';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FRIDA', -width/2 + 10, -height - 24);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(x, drawY); 
  
  if (state === 'eating') {
     ctx.translate(0, -height/2);
     ctx.rotate(Math.PI); 
     ctx.translate(0, height/2);
  } else if (state === 'jumping_to_eat') {
     ctx.translate(0, -20);
     ctx.rotate(-0.15); 
  }

  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 8;
  
  const bBody = ctx.createLinearGradient(0, -height, 0, 0);
  bBody.addColorStop(0, '#ffdf99');
  bBody.addColorStop(1, '#a6722d');

  // Rabo curto animado
  ctx.save();
  ctx.translate(width/2 - 5, -height/2);
  const tailWag = Math.sin(timer * (state === 'jumping_to_eat' ? 30 : 15)) * (state === 'jumping_to_eat' ? 0.8 : 0.4);
  ctx.rotate(tailWag - 0.3);
  ctx.fillStyle = '#a6722d';
  ctx.beginPath(); ctx.roundRect(0, -4, 18, 8, 4); ctx.fill();
  ctx.restore();

  // 4 PATAS animadas
  let swing = state === 'eating' ? Math.sin(timer * 10) * 8 : Math.sin(timer * 10) * 5;
  if (state === 'jumping_to_eat') swing = Math.sin(timer * 25) * 3; // Patas mexem no ar

  // Patas traseiras
  ctx.fillStyle = '#8a5c1a';
  ctx.beginPath(); ctx.roundRect(width/2 - 25 - swing, -12, 12, 18, 4); ctx.fill();
  ctx.beginPath(); ctx.roundRect(width/2 - 10 + swing, -12, 12, 18, 4); ctx.fill();
  ctx.fillStyle = '#fff'; 
  ctx.beginPath(); ctx.roundRect(width/2 - 25 - swing, 0, 12, 6, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(width/2 - 10 + swing, 0, 12, 6, 2); ctx.fill();

  // Corpo gordo
  ctx.fillStyle = bBody;
  ctx.beginPath();
  ctx.roundRect(-width/2, -height, width, height, height/2);
  ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // Barriga branca
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -height/2 + 5, width/2 - 15, height/2 - 5, 0, 0, Math.PI*2);
  ctx.fill();

  // Patas dianteiras
  ctx.fillStyle = bBody;
  ctx.beginPath(); ctx.roundRect(-width/2 + 5 + swing, -12, 12, 18, 4); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-width/2 + 20 - swing, -12, 12, 18, 4); ctx.fill();
  ctx.fillStyle = '#fff'; 
  ctx.beginPath(); ctx.roundRect(-width/2 + 5 + swing, 0, 12, 6, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-width/2 + 20 - swing, 0, 12, 6, 2); ctx.fill();

  // Cabeça
  const bHead = ctx.createRadialGradient(-width/2 + 5, -height/2 + 5, 0, -width/2 + 5, -height/2 + 5, 45);
  bHead.addColorStop(0, '#ffdf99');
  bHead.addColorStop(1, '#a6722d');
  ctx.fillStyle = bHead;
  ctx.beginPath(); ctx.arc(-width/2, -height/2, 25, 0, Math.PI*2); ctx.fill();
  
  // Focinho branco
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(-width/2 - 10, -height/2 + 8, 18, 12, 0, 0, Math.PI*2); ctx.fill();
  
  // Nariz preto
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(-width/2 - 15, -height/2 + 2, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-width/2 - 17, -height/2, 2, 0, Math.PI*2); ctx.fill();

  // Boca/Língua
  if (state === 'idle' || state === 'jumping_to_eat') {
    ctx.fillStyle = '#4a0000'; 
    ctx.beginPath(); ctx.arc(-width/2 - 12, -height/2 + 14, 10, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#ff9999'; 
    ctx.beginPath(); ctx.ellipse(-width/2 - 12, -height/2 + 16, 6, 3 + Math.sin(timer*5)*1.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-width/2 - 19, -height/2 + 10, 3, 4);
    ctx.fillRect(-width/2 - 7, -height/2 + 10, 3, 4);
  } else { 
    ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-width/2 - 12, -height/2 + 15, 6, 0, Math.PI); ctx.stroke();
  }

  // 2 OLHOS grandes com brilho e piscar
  if (Math.sin(timer * 4) > 0.95) {
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-width/2 - 10, -height/2 - 8); ctx.lineTo(-width/2 - 2, -height/2 - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-width/2 + 2, -height/2 - 10); ctx.lineTo(-width/2 + 10, -height/2 - 10); ctx.stroke();
  } else {
    // Olho esquerdo
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-width/2 - 5, -height/2 - 8, 5, 7, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(-width/2 - 6, -height/2 - 8, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-width/2 - 7, -height/2 - 10, 1.2, 0, Math.PI*2); ctx.fill();
    // Olho direito
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-width/2 + 5, -height/2 - 10, 5, 7, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(-width/2 + 4, -height/2 - 10, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-width/2 + 3, -height/2 - 12, 1.2, 0, Math.PI*2); ctx.fill();
  }

  // Orelha caída animada (vento quando pula!)
  ctx.save();
  ctx.translate(-width/2 + 15, -height/2 - 10);
  let earFlap = -0.5 + Math.sin(timer * 3) * 0.1;
  if (state === 'jumping_to_eat') earFlap = -Math.PI/3 + Math.sin(timer * 40) * 0.6;
  ctx.rotate(earFlap);
  ctx.fillStyle = '#8a5c1a';
  ctx.beginPath(); ctx.ellipse(0, 12, 8, 15, -0.5, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  ctx.restore();

  if (state === 'eating' || state === 'jumping_to_eat') {
    ctx.save();
    ctx.translate(x - width/2 - 10, drawY + (state === 'eating' ? 10 : -15));
    ctx.rotate(timer * 15); 
    drawBone(ctx, 0, 0, 0);
    ctx.restore();
  }
}

function drawBear(ctx, x, y, kind, timer, state, isHero) {
  ctx.save();
  
  // Placa de nome (esconde quando é herói)
  if (!isHero) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - 25, y - 70, 50, 15);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let name = "URSO";
    if(kind === 'white_bear') name = "POLAR";
    if(kind === 'panda_bear') name = "PANDA";
    ctx.fillText(name, x, y - 62);
  }
  
  let baseColor1 = '#8B4513'; 
  let baseColor2 = '#A0522D';
  let bellyColor = '#cda177';
  if (kind === 'white_bear') {
      baseColor1 = '#f5f5f5'; baseColor2 = '#ffffff'; bellyColor = '#e0e0e0';
  } else if (kind === 'panda_bear') {
      baseColor1 = '#111111'; baseColor2 = '#222222'; bellyColor = '#ffffff';
  }

  const drawY = y;
  ctx.translate(x, drawY);

  if (state === 'eating' || state === 'jumping_to_eat') {
     ctx.rotate(Math.PI);
     ctx.translate(0, 10);
     
     ctx.fillStyle = baseColor1;
     ctx.beginPath(); ctx.ellipse(0, 0, 25, 30, 0, 0, Math.PI*2); ctx.fill();
     ctx.fillStyle = bellyColor;
     ctx.beginPath(); ctx.ellipse(0, -5, 18, 22, 0, 0, Math.PI*2); ctx.fill();
     
     const wag = Math.sin(timer * 20) * 8;
     ctx.fillStyle = baseColor2;
     ctx.beginPath(); ctx.ellipse(-15, -25 + wag, 8, 12, -0.5, 0, Math.PI*2); ctx.fill(); 
     ctx.beginPath(); ctx.ellipse(15, -25 - wag, 8, 12, 0.5, 0, Math.PI*2); ctx.fill(); 
     ctx.beginPath(); ctx.ellipse(-20, 10 + wag, 8, 12, -0.8, 0, Math.PI*2); ctx.fill(); 
     ctx.beginPath(); ctx.ellipse(20, 10 - wag, 8, 12, 0.8, 0, Math.PI*2); ctx.fill(); 
     
     ctx.fillStyle = (kind === 'panda_bear') ? '#fff' : baseColor1;
     ctx.beginPath(); ctx.ellipse(0, 25, 20, 15, 0, 0, Math.PI*2); ctx.fill();
     
     ctx.fillStyle = baseColor1;
     ctx.beginPath(); ctx.arc(-15, 35, 7, 0, Math.PI*2); ctx.fill();
     ctx.beginPath(); ctx.arc(15, 35, 7, 0, Math.PI*2); ctx.fill();
     
     ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
     ctx.beginPath(); ctx.arc(-8, 22, 4, 0, Math.PI); ctx.stroke();
     ctx.beginPath(); ctx.arc(8, 22, 4, 0, Math.PI); ctx.stroke();

  } else {
     const walk1 = Math.sin(timer * 10) * 6;
     const walk2 = Math.cos(timer * 10) * 6;
     
     // Rabo pompom animado
     ctx.save();
     ctx.translate(25, -15);
     ctx.rotate(Math.sin(timer * 15) * 0.4);
     ctx.fillStyle = baseColor2;
     ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
     ctx.restore();

     // 4 PATAS
     ctx.fillStyle = baseColor2;
     ctx.beginPath(); ctx.ellipse(-15 + walk1, 5, 8, 15, 0, 0, Math.PI*2); ctx.fill(); 
     ctx.beginPath(); ctx.ellipse(15 + walk2, 5, 8, 15, 0, 0, Math.PI*2); ctx.fill(); 
     ctx.beginPath(); ctx.ellipse(-5 - walk1, 8, 7, 12, 0, 0, Math.PI*2); ctx.fill(); 
     ctx.beginPath(); ctx.ellipse(5 - walk2, 8, 7, 12, 0, 0, Math.PI*2); ctx.fill(); 

     // Corpo Gordinho
     ctx.fillStyle = baseColor1;
     ctx.beginPath(); ctx.ellipse(0, -20, 30, 25, 0, 0, Math.PI*2); ctx.fill();
     ctx.fillStyle = bellyColor;
     ctx.beginPath(); ctx.ellipse(-5, -15, 20, 18, 0, 0, Math.PI*2); ctx.fill();

     // Cabeca
     ctx.translate(-25, -35); 
     ctx.fillStyle = (kind === 'panda_bear') ? '#fff' : baseColor1;
     ctx.beginPath(); ctx.ellipse(0, 0, 18, 16, 0, 0, Math.PI*2); ctx.fill();
     
     // Orelhas animadas
     ctx.save();
     let earAngle = Math.sin(timer * 3) * 0.1;
     if (state === 'jumping_to_eat') earAngle = Math.sin(timer * 30) * 0.4;
     ctx.fillStyle = baseColor2;
     if(kind === 'panda_bear') ctx.fillStyle = '#111';
     ctx.save(); ctx.translate(5, -12); ctx.rotate(earAngle);
     ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI*2); ctx.fill();
     ctx.restore();
     ctx.save(); ctx.translate(-5, -12); ctx.rotate(-earAngle);
     ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI*2); ctx.fill();
     ctx.restore();
     ctx.restore();

     // Manchas do Panda
     if (kind === 'panda_bear') {
         ctx.fillStyle = '#111';
         ctx.beginPath(); ctx.ellipse(-5, -2, 6, 8, -0.3, 0, Math.PI*2); ctx.fill();
         ctx.beginPath(); ctx.ellipse(8, -2, 6, 8, 0.3, 0, Math.PI*2); ctx.fill();
     }

     // Olhos com piscar
     if (Math.sin(timer * 4) > 0.95) {
       ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
       ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(-2, -2); ctx.stroke();
       ctx.beginPath(); ctx.moveTo(5, -2); ctx.lineTo(11, -2); ctx.stroke();
     } else {
       ctx.fillStyle = '#fff';
       ctx.beginPath(); ctx.arc(-5, -2, 4, 0, Math.PI*2); ctx.fill();
       ctx.beginPath(); ctx.arc(8, -2, 4, 0, Math.PI*2); ctx.fill();
       ctx.fillStyle = '#000';
       ctx.beginPath(); ctx.arc(-6, -2, 2, 0, Math.PI*2); ctx.fill();
       ctx.beginPath(); ctx.arc(7, -2, 2, 0, Math.PI*2); ctx.fill();
       ctx.fillStyle = '#fff';
       ctx.beginPath(); ctx.arc(-7, -3, 1, 0, Math.PI*2); ctx.fill();
       ctx.beginPath(); ctx.arc(6, -3, 1, 0, Math.PI*2); ctx.fill();
     }
     
     // Sobrancelha malvada (só inimigo)
     if (!isHero) {
       ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
       ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-2, -4); ctx.stroke();
       ctx.beginPath(); ctx.moveTo(11, -6); ctx.lineTo(5, -4); ctx.stroke();
     }

     // Focinho
     ctx.fillStyle = bellyColor;
     ctx.beginPath(); ctx.ellipse(-10, 8, 10, 6, -0.2, 0, Math.PI*2); ctx.fill();
     ctx.fillStyle = '#000';
     ctx.beginPath(); ctx.arc(-14, 6, 3, 0, Math.PI*2); ctx.fill();
     
     if (isHero) {
       ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
       ctx.beginPath(); ctx.arc(-12, 10, 4, 0, Math.PI); ctx.stroke();
     }
  }
  ctx.restore();
}

function drawHilda(ctx, t) {
  ctx.save(); 
  ctx.translate(0, 15); // Abaixada para a Luna conseguir pular
  const walk1 = Math.sin(t * 15) * 8;
  const walk2 = Math.cos(t * 15) * 8;

  ctx.fillStyle = '#222';
  // Pernas traseiras
  ctx.beginPath(); ctx.ellipse(-20 + walk1, 15, 6, 12, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10 + walk2, 15, 6, 12, 0, 0, Math.PI*2); ctx.fill();
  
  // Corpo (menor para permitir pular sobre)
  ctx.beginPath(); ctx.ellipse(0, 0, 35, 20, 0, 0, Math.PI*2); ctx.fill();
  
  // Pernas dianteiras
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.ellipse(-10 - walk1, 15, 6, 12, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(20 - walk2, 15, 6, 12, 0, 0, Math.PI*2); ctx.fill();

  // Rabo agressivo
  ctx.save(); ctx.translate(30, -5); ctx.rotate(walk1 * 0.05 + 0.5);
  ctx.beginPath(); ctx.ellipse(15, 0, 18, 4, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();

  // Cabeça
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.ellipse(-30, -15, 18, 18, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(-20, -10, 8, 15, -0.5, 0, Math.PI*2); ctx.fill(); 
  
  // Focinho
  ctx.fillStyle = '#333'; ctx.beginPath(); ctx.ellipse(-45, -5, 15, 10, -0.2, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-55, -8, 4, 0, Math.PI*2); ctx.fill(); 
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(-50, 2); ctx.lineTo(-45, 12); ctx.lineTo(-40, 0); ctx.fill();

  if (typeof drawAngryEyes === 'function') drawAngryEyes(ctx, -30, -20);
  ctx.restore();
}

function drawUrubu(ctx, flap) {
  ctx.save();
  ctx.translate(0, -35); // Centro do Pássaro

  // Corpo principal escuro (corcunda)
  ctx.fillStyle = '#333b47';
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 28, 0.2, 0, Math.PI*2);
  ctx.fill();

  // Asas batendo
  ctx.save();
  ctx.translate(-15, -5);
  ctx.rotate(-flap - 0.3);
  ctx.fillStyle = '#1c2026';
  ctx.beginPath(); ctx.ellipse(-5, 15, 12, 35, 0.4, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(15, -5);
  ctx.rotate(flap + 0.3);
  ctx.fillStyle = '#1c2026';
  ctx.beginPath(); ctx.ellipse(5, 15, 12, 35, -0.4, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // Colar fofinho de plumas brancas
  ctx.fillStyle = '#f0f0f0';
  ctx.beginPath();
  ctx.arc(0, -20, 16, 0, Math.PI*2);
  ctx.arc(-12, -15, 14, 0, Math.PI*2);
  ctx.arc(12, -15, 14, 0, Math.PI*2);
  ctx.arc(0, -10, 14, 0, Math.PI*2);
  ctx.fill();

  // Pescoço comprido rosa
  ctx.save();
  ctx.strokeStyle = '#ffaec9'; 
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.quadraticCurveTo(-15, -35, -10, -50); 
  ctx.stroke();
  
  // Rugas no pescoço
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#d6859e';
  ctx.beginPath(); ctx.moveTo(-6, -26); ctx.lineTo(0, -24); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10, -33); ctx.lineTo(-4, -30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-12, -43); ctx.lineTo(-6, -41); ctx.stroke();
  ctx.restore();

  // Cabeça rosa
  ctx.save();
  ctx.translate(-14, -54);
  ctx.fillStyle = '#ffaec9';
  ctx.beginPath(); ctx.ellipse(0, 0, 14, 12, -0.2, 0, Math.PI*2); ctx.fill();
  
  // Bico Laranja Gigante Adunco
  ctx.fillStyle = '#ff8800';
  ctx.beginPath();
  ctx.moveTo(8, -2);
  ctx.quadraticCurveTo(25, -10, 20, 15); 
  ctx.quadraticCurveTo(5, 10, 2, 2); 
  ctx.fill();
  
  ctx.fillStyle = '#cc5500';
  ctx.beginPath();
  ctx.moveTo(5, 3);
  ctx.quadraticCurveTo(15, 12, 12, 8);
  ctx.fill();

  // Olho grande meio para fora (estilo maluco)
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(4, -8, 7, 0, Math.PI*2); ctx.fill();
  
  // Pupila raivosa
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(6, -8, 2, 0, Math.PI*2); ctx.fill();
  
  // Sobrancelha malvada e grossa
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#222';
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-5, -14); ctx.lineTo(12, -10); ctx.stroke();

  // Cabelinhos da careca
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-5, -12); ctx.lineTo(-8, -20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2, -12); ctx.lineTo(0, -22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2, -12); ctx.lineTo(6, -18); ctx.stroke();

  ctx.restore(); 

  // Garras amarelas
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath(); ctx.ellipse(-6, 25, 6, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 25, 4, 6, -0.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(6, 25, 6, 4, 0, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

function drawAngryEyes(ctx, x, y) {
  ctx.fillStyle = '#f00'; ctx.beginPath(); ctx.ellipse(x - 12, y, 6, 4, 0.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 12, y, 6, 4, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 20, y - 5); ctx.lineTo(x - 6, y + 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 20, y - 5); ctx.lineTo(x + 6, y + 2); ctx.stroke();
  ctx.fillStyle = '#fc0'; ctx.beginPath(); ctx.arc(x - 11, y, 2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(x + 11, y, 2, 0, Math.PI*2); ctx.fill();
}
function drawWind(ctx, t) {
  ctx.save(); const d = Math.sin(t*8)*15; ctx.fillStyle = 'rgba(200,200,200,0.8)';
  for(let i=0;i<5;i++){ ctx.beginPath(); ctx.ellipse(d*(1-i*0.1)+Math.sin(t*20+i)*5, -i*15, 50-i*10, 10, 0, 0, Math.PI*2); ctx.fill(); }
  drawAngryEyes(ctx, d*0.5, -60); ctx.restore();
}
function drawStorm(ctx, t) {
  ctx.save(); ctx.translate(0, Math.sin(t*4)*8 - 40); const s = 1+Math.sin(t*12)*0.05; ctx.scale(s,s);
  ctx.fillStyle='#444'; ctx.beginPath(); ctx.arc(0,0,35,0,Math.PI*2); ctx.arc(-25,10,25,0,Math.PI*2); ctx.arc(25,10,25,0,Math.PI*2); ctx.arc(-40,30,15,0,Math.PI*2); ctx.arc(40,30,20,0,Math.PI*2); ctx.fill();
  if(Math.random()>0.8){ ctx.fillStyle='#ff0'; ctx.beginPath(); ctx.moveTo(10,20); ctx.lineTo(-10,60); ctx.lineTo(5,60); ctx.lineTo(-15,100); ctx.lineTo(25,50); ctx.fill(); }
  drawAngryEyes(ctx, 0, 15); ctx.restore();
}
function drawVacuum(ctx, t) {
  ctx.save(); ctx.translate(Math.sin(t*40)*2, 0);
  ctx.fillStyle='#c00'; ctx.beginPath(); ctx.roundRect(-30,-60,60,50,10); ctx.fill();
  ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(-35,-10,15,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(35,-10,15,0,Math.PI*2); ctx.fill();
  ctx.translate(0,-60); ctx.rotate(Math.sin(t*8)*0.5); ctx.fillStyle='#555'; ctx.fillRect(-8,-40,16,40);
  ctx.fillStyle='#222'; ctx.beginPath(); ctx.moveTo(-20,-50); ctx.lineTo(20,-50); ctx.lineTo(10,-40); ctx.lineTo(-10,-40); ctx.fill();
  drawAngryEyes(ctx, 0, 25); ctx.restore();
}
function drawCar(ctx, t) {
  ctx.save(); ctx.fillStyle='#222'; ctx.fillRect(-45,-15,20,15); ctx.fillRect(25,-15,20,15); ctx.translate(0,-Math.abs(Math.sin(t*15))*5);
  ctx.fillStyle='#05f'; ctx.beginPath(); ctx.roundRect(-50,-35,100,30,8); ctx.fill(); ctx.beginPath(); ctx.roundRect(-30,-60,60,30,10); ctx.fill();
  ctx.fillStyle='#8cf'; ctx.fillRect(-25,-55,50,20);
  ctx.fillStyle='#ff0'; ctx.beginPath(); ctx.arc(-35,-20,8,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(35,-20,8,0,Math.PI*2); ctx.fill();
  drawAngryEyes(ctx, 0, -45); ctx.restore();
}
function drawMoto(ctx, t) {
  ctx.save(); ctx.rotate(Math.sin(t*5)*0.2);
  ctx.fillStyle='#111'; ctx.fillRect(-15,-20,30,40);
  ctx.fillStyle='#f60'; ctx.beginPath(); ctx.moveTo(0,-70); ctx.lineTo(-25,-20); ctx.lineTo(25,-20); ctx.fill();
  ctx.strokeStyle='#888'; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(-35,-50); ctx.lineTo(35,-50); ctx.stroke();
  ctx.fillStyle='#000'; ctx.fillRect(-45,-55,15,10); ctx.fillRect(30,-55,15,10);
  drawAngryEyes(ctx, 0, -40); ctx.restore();
}
function drawBroom(ctx, t) {
  ctx.save(); ctx.translate(0,-80); ctx.rotate(Math.sin(t*8)*0.4);
  ctx.fillStyle='#8B4513'; ctx.fillRect(-5,0,10,60); ctx.translate(0,60); ctx.rotate(Math.sin(t*20)*0.1);
  ctx.fillStyle='#fc0'; ctx.beginPath(); ctx.moveTo(-15,0); ctx.lineTo(15,0); ctx.lineTo(30,40); ctx.lineTo(-30,40); ctx.fill();
  ctx.strokeStyle='#cda522'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-20,15); ctx.lineTo(20,15); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-25,25); ctx.lineTo(25,25); ctx.stroke();
  drawAngryEyes(ctx, 0, 10); ctx.restore();
}
function drawFireworks(ctx, t) {
  ctx.save(); ctx.translate(0,-40); const s=(Math.random()-0.5)*4; ctx.translate(s,s);
  ctx.fillStyle='#e00'; ctx.fillRect(-15,-20,30,50); ctx.fillStyle='#fff'; ctx.fillRect(-15,0,30,10);
  ctx.fillStyle='#f90'; ctx.beginPath(); ctx.moveTo(-15,-20); ctx.lineTo(15,-20); ctx.lineTo(0,-50); ctx.fill();
  ctx.strokeStyle='#aaa'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,30); ctx.quadraticCurveTo(10,40,20,50); ctx.stroke();
  drawAngryEyes(ctx, 0, -5); ctx.restore();
}
function drawHose(ctx, t) {
  ctx.save(); ctx.translate(0,-80); const wx=Math.sin(t*10)*15;
  ctx.strokeStyle='#093'; ctx.lineWidth=14; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(0,150); ctx.quadraticCurveTo(wx*2,70,wx,0); ctx.stroke();
  ctx.translate(wx,0); ctx.rotate(Math.cos(t*8)*0.5);
  ctx.fillStyle='#ca0'; ctx.fillRect(-10,-20,20,20); ctx.fillStyle='#777'; ctx.fillRect(-14,-5,28,5);
  ctx.fillStyle='rgba(0,150,255,0.7)'; for(let i=0;i<6;i++) { ctx.beginPath(); ctx.ellipse((Math.random()-0.5)*20, -20-((t*200+i*20)%50), 3, 6, 0, 0, Math.PI*2); ctx.fill(); }
  drawAngryEyes(ctx, 0, -10); ctx.restore();
}

function drawSeagull(ctx, flap, isDiving, angle = 0) {
  ctx.save();
  ctx.translate(0, -30); // Base
  
  if (isDiving) {
      // Vira a gaivota para a esquerda com scale(-1, 1) e aplica o angulo calculado para o bico descer!
      ctx.scale(-1, 1); 
      ctx.rotate(angle);
  }

  // Asa Traseira
  ctx.save();
  ctx.translate(-20, -5);
  ctx.rotate(-flap);
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath(); ctx.ellipse(-15, 0, 25, 10, -0.2, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // Corpo (Gaivota peituda e redonda)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, 0, 35, 25, 0.1, 0, Math.PI*2);
  ctx.fill();

  // Pescoço saindo da frente
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 20;
  ctx.beginPath(); ctx.moveTo(20, -10); ctx.lineTo(40, -40); ctx.stroke();

  // Asa Frontal (agora bem mais abaixo)
  ctx.save();
  ctx.translate(-5, 5);
  ctx.rotate(flap);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(-20, 0, 30, 12, 0.1, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#d0d0d0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(-30, 4); ctx.stroke();
  ctx.restore();

  // Cabeça e Lencinho
  ctx.translate(40, -40);

  // Lenço Vermelho amarrado
  ctx.fillStyle = '#cc1111';
  ctx.beginPath(); ctx.ellipse(0, 10, 14, 8, 0, 0, Math.PI*2); ctx.fill();
  // Rabicho do lenço descendo
  ctx.beginPath(); ctx.moveTo(-10, 10); ctx.lineTo(-20, 25); ctx.lineTo(-5, 15); ctx.fill();
  
  // Bolinhas no lenco
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-5, 8, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(2, 12, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, 8, 1.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(-14, 20, 1.5, 0, Math.PI*2); ctx.fill();

  // Rosto gigante de frente
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(5, -5, 22, 22, 0, 0, Math.PI*2); 
  ctx.fill();

  // Penas despenteadas
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(-5, -40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -26); ctx.lineTo(10, -42); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(15, -20); ctx.lineTo(25, -35); ctx.stroke();

  // Bico Adunco Extenso (Animado para abrir/fechar)
  const bO = beakOpen ? 15 : 0; // angulo da mandíbula de baixo
  ctx.fillStyle = '#e87b1c';
  
  // Parte de cima do bico
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(25, 0); 
  ctx.quadraticCurveTo(60, 5, 70, 15); 
  ctx.quadraticCurveTo(40, 15, 20, 10);
  ctx.fill();
  ctx.strokeStyle = '#ba6216'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(25, 5); ctx.lineTo(60, 12); ctx.stroke();
  ctx.restore();

  // Parte de baixo do bico (mandíbula)
  if (beakOpen) {
      ctx.save();
      ctx.translate(25, 10);
      ctx.rotate(0.3); // abre a boca
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(30, 10, 45, 15);
      ctx.quadraticCurveTo(20, 15, 0, 5);
      ctx.fill();
      ctx.restore();
  }

  // Bochechas da vergonha
  ctx.fillStyle = '#ff99aa';
  ctx.beginPath(); ctx.ellipse(10, 10, 7, 5, 0, 0, Math.PI*2); ctx.fill();

  // Óculos Gatinha
  ctx.strokeStyle = '#cc1111';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, -12); // Ponto de orelha (esquerdo do oculos)
  ctx.quadraticCurveTo(0, 5, 12, -2); // lente esquerda
  ctx.quadraticCurveTo(5, -15, -5, -12); 
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(18, -2); // Ponte do nariz
  ctx.quadraticCurveTo(25, 8, 35, -5); // lente direita
  ctx.quadraticCurveTo(30, -18, 18, -2); 
  ctx.stroke();

  ctx.beginPath(); ctx.moveTo(12, -2); ctx.lineTo(18, -2); ctx.stroke(); 
  
  // Olho vesgo 
  ctx.fillStyle = '#55aaff'; // pupila
  ctx.beginPath(); ctx.arc(8, -4, 2.5, 0, Math.PI*2); ctx.fill(); // esquerdo puxado pra direita
  ctx.beginPath(); ctx.arc(22, -4, 2.5, 0, Math.PI*2); ctx.fill(); // direito puxado pra esquerda (VESGA)

  // Palpebras cansadas (olho meio fechado)
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(2, -6); ctx.lineTo(10, -4); ctx.stroke(); 
  ctx.beginPath(); ctx.moveTo(18, -4); ctx.lineTo(28, -6); ctx.stroke(); 

  // Cílios
  ctx.beginPath(); ctx.moveTo(2, -6); ctx.lineTo(-2, -12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, -5); ctx.lineTo(4, -10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(28, -6); ctx.lineTo(32, -12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(23, -4); ctx.lineTo(26, -10); ctx.stroke();

  ctx.restore();
}

function drawAnimal(ctx, x, y, type, timer, badType) {
  ctx.save();
  ctx.translate(x, y + Math.sin(timer * 5) * 15); 
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;

  if (badType === '🐦‍⬛') {
     const flap = Math.sin(timer * 20) * 0.4; 
     drawUrubu(ctx, flap);
  } else {
     if (badType !== '🦅') {
       const flap = Math.sin(timer * 40) * 0.3;
       ctx.rotate(flap);
     } else {
       const glide = Math.sin(timer * 10) * 0.1;
       ctx.rotate(glide);
     }
     ctx.font = '60px Arial'; 
     ctx.fillText(badType, 0, -25);
  }
  
  ctx.shadowBlur = 0;
  // Undo rotation so the line falls straight down to the caught animal!
  ctx.restore();
  
  ctx.save();
  ctx.translate(x, y + Math.sin(timer * 5) * 15); 
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 30);
  ctx.stroke();

  // Animação de pânico (chacoalha) do bichinho segurado
  const panicWobble = Math.sin(timer * 20) * 0.15;
  ctx.rotate(panicWobble);

  ctx.font = '40px Arial';
  ctx.fillText(type, 0, 40); 
  
  ctx.restore();
}

function drawStone(ctx, x, y, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  
  ctx.shadowColor = 'rgba(0,255,255,0.8)';
  ctx.shadowBlur = 20;

  const stGrad = ctx.createRadialGradient(0,0,0,0,0,10);
  stGrad.addColorStop(0, '#fff');
  stGrad.addColorStop(0.5, '#7df9ff');
  stGrad.addColorStop(1, '#00bfff');
  
  ctx.fillStyle = stGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI*2);
  ctx.fill();
  
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-2, -2, 3, 0, Math.PI*2);
  ctx.fill();
  
  ctx.restore();
}

function render() {
  const theme = getTheme(game.phase);
  
  const skyGrad = ctx.createLinearGradient(0, -400, 0, canvas.height + 400);
  skyGrad.addColorStop(0, theme.sky);
  if (theme.type === 'forest') skyGrad.addColorStop(1, '#afeeee');
  else if (theme.type === 'mountain') skyGrad.addColorStop(1, '#ffc0cb');
  else skyGrad.addColorStop(1, '#000');

  ctx.fillStyle = skyGrad;
  // Preenche uma grande area para nao aparecer bordas vazias quando o jogo inclina!
  ctx.fillRect(-600, -600, canvas.width + 1200, canvas.height + 1200);

  ctx.save();
  if (game.cameraAngle) {
    ctx.translate(canvas.width / 2, Math.min(GROUND_Y, canvas.height / 2 + 100)); 
    ctx.rotate(game.cameraAngle);
    ctx.translate(-canvas.width / 2, -Math.min(GROUND_Y, canvas.height / 2 + 100));
  }

  if (theme.starAlpha > 0) {
    ctx.fillStyle = '#fff';
    for(let s of stars) {
      let alpha = (0.5 + Math.sin(Date.now() * 0.002 + s.blinkOffset) * 0.5) * theme.starAlpha;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  // Draw background decorations (clouds, flying saucers)
  for(let d of decorations) {
    ctx.font = `${d.size}px Arial`;
    ctx.globalAlpha = 0.7;
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(d.icon, d.x, d.y);
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
  }

  for(let m of mountains) {
    const mGrad = ctx.createLinearGradient(m.x, m.y, m.x, GROUND_Y);
    mGrad.addColorStop(0, m.color);
    mGrad.addColorStop(1, '#111');
    
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.moveTo(m.x, GROUND_Y);
    ctx.quadraticCurveTo(m.x + m.width/2, m.y - 50, m.x + m.width, GROUND_Y);
    ctx.fill();
  }

  if (theme.type === 'lunar' || theme.type === 'alien') {
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 80;
    ctx.fillStyle = '#dddddd';
    ctx.beginPath();
    ctx.arc(700, 100, 50, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.arc(690, 80, 12, 0, Math.PI*2);
    ctx.arc(680, 110, 18, 0, Math.PI*2);
    ctx.arc(720, 110, 15, 0, Math.PI*2);
    ctx.fill();
  } else if (theme.type === 'forest') {
    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur = 80;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(700, 100, 50, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  const g1Grad = ctx.createLinearGradient(0, GROUND_Y, 0, canvas.height + 600);
  g1Grad.addColorStop(0, theme.g1);
  g1Grad.addColorStop(1, '#111'); 
  ctx.fillStyle = g1Grad;
  ctx.fillRect(-600, GROUND_Y, canvas.width + 1200, canvas.height - GROUND_Y + 600);
  
  ctx.fillStyle = theme.g2; 
  ctx.beginPath();
  let startX = -(game.bgOffset % 40) - 600; 
  ctx.moveTo(-600, GROUND_Y - 20); 
  for(let x = startX; x <= canvas.width + 640; x += 20) {
    let bump = Math.sin((x + game.bgOffset) * 0.05) * 8;
    ctx.lineTo(x, GROUND_Y + bump - 15);
  }
  ctx.lineTo(canvas.width, GROUND_Y + 10);
  ctx.lineTo(0, GROUND_Y + 10);
  ctx.fill();

  // DEPRESSION/CURVED HOLES FIX 
  for(let h of holes) {
    ctx.save();
    
    // Draw deep cutout covering from the top of the wavy grass
    ctx.beginPath();
    ctx.moveTo(h.x, GROUND_Y - 30);
    ctx.lineTo(h.x, canvas.height);
    ctx.lineTo(h.x + h.width, canvas.height);
    ctx.lineTo(h.x + h.width, GROUND_Y - 30);
    ctx.lineTo(h.x, GROUND_Y - 30);

    const pitGrad = ctx.createLinearGradient(h.x, GROUND_Y - 20, h.x, canvas.height);
    pitGrad.addColorStop(0, '#2e1814'); // dark sharp drop
    pitGrad.addColorStop(0.3, '#000000'); 
    
    ctx.fillStyle = pitGrad;
    ctx.fill();
    
    // Left curve dip
    ctx.fillStyle = pitGrad;
    ctx.beginPath();
    ctx.ellipse(h.x + 10, GROUND_Y - 20, 20, 35, 0, 0, Math.PI);
    ctx.fill();
    // Right curve dip
    ctx.beginPath();
    ctx.ellipse(h.x + h.width - 10, GROUND_Y - 20, 20, 35, 0, 0, Math.PI);
    ctx.fill();

    // Grass edge left
    ctx.fillStyle = theme.g1;
    ctx.beginPath();
    ctx.ellipse(h.x - 10, GROUND_Y - 10, 20, 15, 0, 0, Math.PI*2);
    ctx.fill();
    // Grass edge right
    ctx.beginPath();
    ctx.ellipse(h.x + h.width + 10, GROUND_Y - 10, 20, 15, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.restore();
  }

  // Weather and Atmosphere Effects during Boss!
  if (boss) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Todos os bosses ganham um efeito climático no fundo
    const rainBosses = ['storm', 'hose', 'fireworks'];
    const isRain = rainBosses.includes(boss.type);
    
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      ctx.moveTo(sx, sy);
      if (isRain) {
         ctx.lineTo(sx - 20, sy + 80); // diagonal rain
      } else {
         ctx.lineTo(sx - 100, sy); // horizontal wind
      }
    }
    ctx.stroke();
  }

  // Draw Boss Fears Animados
  if (boss) {
    ctx.save();
    ctx.translate(boss.x, boss.y);
    
    if (boss.type === 'wind') drawWind(ctx, boss.timer);
    else if (boss.type === 'storm') drawStorm(ctx, boss.timer);
    else if (boss.type === 'vacuum') drawVacuum(ctx, boss.timer);
    else if (boss.type === 'car') drawCar(ctx, boss.timer);
    else if (boss.type === 'motorcycle') drawMoto(ctx, boss.timer);
    else if (boss.type === 'seagull') {
        const flap = Math.sin(boss.timer * 15) * 0.3;
        let angle = 0;
        if (boss.mode === 'DIVING') {
           let dx = player.x - boss.x;
           let dy = player.y - boss.y;
           angle = Math.atan2(dy, -dx);
        }
        drawSeagull(ctx, flap, boss.mode === 'DIVING', angle);
    } 
    else if (boss.type === 'bigdog') drawHilda(ctx, boss.timer);
    else if (boss.type === 'broom') drawBroom(ctx, boss.timer);
    else if (boss.type === 'fireworks') drawFireworks(ctx, boss.timer);
    else if (boss.type === 'hose') drawHose(ctx, boss.timer);
    
    // Boss HP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(-40, -50, 80, 10);
    ctx.fillStyle = '#f00';
    ctx.fillRect(-40, -50, 80 * (boss.hp / boss.maxHp), 10);
    
    // Fear Name Plate
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-50, 50, 100, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let fearName = 'MOTO';
    if (boss.type === 'wind') fearName = 'VENTANIA';
    else if (boss.type === 'storm') fearName = 'TROVÃO';
    else if (boss.type === 'vacuum') fearName = 'ASPIRADOR';
    else if (boss.type === 'car') fearName = 'CARRO';
    else if (boss.type === 'motorcycle') fearName = 'MOTO';
    else if (boss.type === 'seagull') fearName = 'GAIVOTA VESGA';
    else if (boss.type === 'bigdog') fearName = 'ILDA';
    else if (boss.type === 'broom') fearName = 'VASSOURA';
    else if (boss.type === 'fireworks') fearName = 'FOGOS';
    else if (boss.type === 'hose') fearName = 'BANHO';

    ctx.fillText(fearName, 0, 60);

    ctx.restore();
  }

  for(let u of ufos) {
    ctx.save();
    ctx.translate(u.x, u.y);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '60px Arial';
    
    // Rotação suave do disco voador
    ctx.rotate(Math.sin(u.timer * 3) * 0.1);

    // Efeito de luz do disco
    ctx.shadowColor = '#55ff55';
    ctx.shadowBlur = 15;
    ctx.fillText('🛸', 0, 0);
    ctx.shadowBlur = 0;
    
    // Luz piscante (Alien light)
    if (Math.floor(u.timer * 10) % 2 === 0) {
       ctx.fillStyle = '#ff3333';
       ctx.beginPath();
       ctx.arc(0, 15, 4, 0, Math.PI*2);
       ctx.fill();
    }

    ctx.restore();
  }

  for(let b of bulldogs) {
    if (b.kind === 'frida') drawBulldog(ctx, b.x, b.y, b.width, b.height, b.animTimer, b.state);
    else if (b.kind === 'cinder') drawCat(ctx, b.x, b.y, b.width, b.height, b.animTimer, b.state);
    else if (b.kind === 'luna') {
      // Placa de nome LUNA (só quando andando)
      if (b.state !== 'eating') {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(b.x - 20, b.y + 20 - 30 - 35, 40, 15);
        ctx.fillStyle = '#B2663E';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LUNA', b.x, b.y + 20 - 30 - 27);
        ctx.restore();
      }
      
      ctx.save();
      if (b.state === 'eating') {
        // Salsichinha enrolada dormindo em TAMANHO REAL! (proporcional aos 80px)
        ctx.translate(b.x, b.y + 10);
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        
        const bodyGrad = ctx.createLinearGradient(0, -30, 0, 0);
        bodyGrad.addColorStop(0, '#B2663E'); // Top
        bodyGrad.addColorStop(1, '#5C2E0A'); // Bottom (darker belly area)

        // Corpo grande de salsicha enrolada (raio 35x20)
        ctx.fillStyle = bodyGrad;
        ctx.beginPath(); ctx.ellipse(-5, -5, 35, 20, 0, 0, Math.PI*2); ctx.fill();
        
        // Patinhas encolhidas
        ctx.fillStyle = '#5C2E0A';
        ctx.beginPath(); ctx.ellipse(-20, 10, 10, 6, -0.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(15, 10, 10, 6, 0.2, 0, Math.PI*2); ctx.fill();
        
        // Cabeça
        ctx.fillStyle = bodyGrad;
        ctx.beginPath(); ctx.ellipse(-25, -2, 18, 14, -0.3, 0, Math.PI*2); ctx.fill();
        
        // Focinho comprido característico de Dachshund
        ctx.beginPath(); ctx.ellipse(-38, 5, 10, 7, -0.6, 0, Math.PI*2); ctx.fill();
        
        // Nariz preto molhadozinho
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(-45, 9, 4, 0, Math.PI*2); ctx.fill();
        
        // Olhinho sonolento
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(-28, -5, 5, Math.PI, 0); ctx.stroke();
        
        // Orelha comprida cobrindo o corpo feito cobertor
        ctx.fillStyle = '#5C2E0A';
        ctx.beginPath(); ctx.ellipse(-15, 5, 10, 16, 0.4, 0, Math.PI*2); ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Zzz
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Zzz', 15, -35 + Math.sin(b.animTimer * 3) * 5);
        
      } else {
        // Normal: espelha pra esquerda
        ctx.translate(b.x, 0);
        ctx.scale(-1, 1);
        ctx.translate(-b.x, 0);
        drawAnimatedAnimal(ctx, b.x, b.y, b.width, b.height || 30, b.animTimer, false, false, 'luna');
      }
      ctx.restore();
    }
    else drawBear(ctx, b.x, b.y, b.kind, b.animTimer, b.state);
  }

  for(let e of enemies) {
    drawAnimal(ctx, e.x, e.y, e.type, e.timer, e.badType);
  }

  for(let b of bombs) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.PI * 0.75); // Gira 135 graus para que o bico caia apontando para o chão!

    ctx.font = '45px Arial'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText('🚀', 0, 0); 
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  for(let sa of savedAnimals) {
    ctx.save();
    ctx.translate(sa.x, sa.y);
    
    // Animação do paraquedas balançando suavemente
    const swing = Math.sin(Date.now() * 0.003) * 0.2;
    ctx.rotate(swing);

    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 5;
    ctx.fillText('🪂', 0, -40); 
    ctx.fillText(sa.type, 0, 0); 
    ctx.restore();
  }

  for(let h of helicopters) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '60px Arial';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 15;
    ctx.fillText('🚁', 0, 0);
    
    // Spinning Blade
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#333';
    ctx.save();
    ctx.translate(0, -25);
    ctx.rotate(h.timer * 50);
    ctx.beginPath();
    ctx.moveTo(-40, 0); ctx.lineTo(40, 0);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  for(let b of bullets) {
    drawBone(ctx, b.x, b.y, b.rot);
  }
  for(let b of upBullets) {
    drawFood(ctx, b.x, b.y, b.rot, b.type);
  }

  for(let p of particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    
    if (p.isStar) {
      ctx.globalCompositeOperation = 'lighter'; 
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 15;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Date.now() * 0.01);
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size/2, -p.size/2);
      ctx.lineTo(p.size, 0);
      ctx.lineTo(p.size/2, p.size/2);
      ctx.lineTo(0, p.size);
      ctx.lineTo(-p.size/2, p.size/2);
      ctx.lineTo(-p.size, 0);
      ctx.lineTo(-p.size/2, -p.size/2);
      ctx.fill();
      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;
    } else if (p.color === '#ffb6c1' || p.color === '#ff69b4') {
       ctx.save();
       ctx.translate(p.x, p.y);
       ctx.scale(p.size/5, p.size/5);
       ctx.fillStyle = '#ff69b4';
       ctx.shadowColor = '#ff1493';
       ctx.shadowBlur = 20;
       ctx.beginPath();
       ctx.moveTo(0, 0);
       ctx.bezierCurveTo(-5, -5, -10, -5, -10, 0);
       ctx.bezierCurveTo(-10, 5, 0, 10, 0, 15);
       ctx.bezierCurveTo(0, 10, 10, 5, 10, 0);
       ctx.bezierCurveTo(10, -5, 5, -5, 0, 0);
       ctx.fill();
       ctx.restore();
       ctx.shadowBlur = 0;
    } else {
       ctx.shadowColor = p.color;
       ctx.shadowBlur = 10;
       ctx.beginPath();
       ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
       ctx.fill();
       ctx.shadowBlur = 0;
    }
  }
  ctx.globalAlpha = 1;

  if (player.x > -50) {
    // drawHero: Desenha o herói selecionado virado pra frente, com tanquezinho e efeitos
    ctx.save();
    
    // Invencibilidade = pisca
    if (player.invincible) {
      ctx.globalAlpha = (Math.floor(Date.now() / 150) % 2 === 0) ? 0.3 : 0.8;
    }
    
    // Escala de queda no buraco
    if (player.isFalling) {
      ctx.translate(player.x, player.y + 20);
      ctx.scale(player.scale || 1, player.scale || 1);
      ctx.rotate(player.rotation || 0);
      ctx.translate(-player.x, -(player.y + 20));
    }
    
    if (player.kind === 'luna') {
      // Luna já olha pra direita naturalmente
      drawAnimatedAnimal(ctx, player.x, player.y, player.width, player.height, player.animTimer, player.isJumping, player.isFalling, 'luna');
    } else {
      // Espelha horizontalmente (os sprites de inimigos olham pra esquerda)
      ctx.translate(player.x, 0);
      ctx.scale(-1, 1);
      ctx.translate(-player.x, 0);
      
      let st = player.isJumping ? 'jumping_to_eat' : 'idle';
      if (player.kind === 'cinder') {
        drawCat(ctx, player.x, player.y, player.width, player.height, player.animTimer, st, true);
      } else if (player.kind === 'frida') {
        drawBulldog(ctx, player.x, player.y, player.width, player.height, player.animTimer, st, true);
      } else if (player.kind === 'bear') {
        drawBear(ctx, player.x, player.y, 'brown_bear', player.animTimer, st, true);
      }
    }
    ctx.restore();
    
    // Tanquezinho nas costas de TODOS os heróis (sempre virado pra direita)
    if (player.kind !== 'luna') {
      ctx.save();
      ctx.translate(player.x - 5, player.y + 20 - player.height - 18);
      ctx.fillStyle = '#00bfff'; ctx.beginPath(); ctx.roundRect(-12, -12, 24, 18, 6); ctx.fill();
      ctx.fillStyle = '#ccffff'; ctx.beginPath(); ctx.roundRect(-6, -8, 12, 10, 3); ctx.fill();
      ctx.fillStyle = '#ff1493'; ctx.beginPath(); ctx.roundRect(-5, -16, 10, 5, 2); ctx.fill();
      ctx.fillStyle = '#aaa'; 
      ctx.beginPath(); ctx.moveTo(12, -4); ctx.lineTo(20, -2); ctx.lineTo(20, 2); ctx.lineTo(12, 4); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(-6, 18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(6, 18); ctx.stroke();
      ctx.restore();
    }
    
    // Power-up Timer Clock
    if (player.tripleShotTimer > 0 || player.doubleShotTimer > 0) {
      let remaining = player.tripleShotTimer > 0 ? player.tripleShotTimer : player.doubleShotTimer;
      let secs = Math.ceil(remaining / 1000);
      
      ctx.fillStyle = '#fff';
      if (secs <= 2 && Math.floor(Date.now() / 150) % 2 === 0) {
         ctx.fillStyle = '#f00'; // Pisca vermelho quando vai acabar
      }
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      
      // Ícone baseado no poder
      let icon = player.tripleShotTimer > 0 ? '🚁 ' : '🛸 ';
      ctx.fillText(icon + secs + 's', player.x, player.y - player.height - 30);
    }
  }

  // Desfaz o tilt da camera
  ctx.restore();
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  try {
    drawMenuDogs(timestamp / 1000);
    update(dt);
    render();
  } catch(err) {
    if (UI.score) UI.score.innerText = 'LOOP_ERR: ' + err.message;
    console.error("Game Loop Error:", err);
  }

  requestAnimationFrame(gameLoop);
}
initMountains();
render();
requestAnimationFrame(gameLoop);
