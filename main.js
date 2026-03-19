const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const UI = {
  score: document.getElementById('score'),
  phase: document.getElementById('phase'),
  lives: document.getElementById('lives'),
  startScreen: document.getElementById('start-screen'),
  gameOverScreen: document.getElementById('game-over-screen'),
  phaseTransition: document.getElementById('phase-transition'),
  nextPhase: document.getElementById('next-phase'),
  finalScore: document.getElementById('final-score'),
  startBtn: document.getElementById('start-btn'),
  restartBtn: document.getElementById('restart-btn'),
  phaseCompleteScreen: document.getElementById('phase-complete-screen'),
  continueBtn: document.getElementById('continue-btn'),
  continueScreen: document.getElementById('continue-screen'),
  btnYesContinue: document.getElementById('btn-yes-continue'),
  btnNoContinue: document.getElementById('btn-no-continue'),
  continuesLeftText: document.getElementById('continues-left'),
  continueTimerText: document.getElementById('continue-timer')
};

// --- IMAGE ASSETS ---
const menuDogImg = new Image();
menuDogImg.src = 'luna-menu-transparent.png';

let continueInterval = null;

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
  setTimeout(() => {
    UI.gameOverScreen.classList.remove('hidden');
  }, 1000);
  stopBGM();
  saveGame();
}

const GROUND_Y = 500;
const DOG_COLOR = '#B2663E';
const EARS_COLOR = '#5C2E0A';

// --- AUDIO SYSTEM ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function saveGame() {
  const data = {
    score: game.score,
    phase: game.phase,
    lives: game.lives,
    continues: game.continues,
    outfit: player.outfit
  };
  localStorage.setItem('luna_arcade_save', JSON.stringify(data));
}

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
      updateUI();
    } catch(e) { console.error("Load error:", e); }
  }
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// YT BGM Player
let ytPlayer = null;

const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
if(firstScriptTag && firstScriptTag.parentNode) {
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
} else {
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('yt-player', {
    height: '200',
    width: '200',
    videoId: 'yi6qpbUo-w8', // Pure Piano Instrumental
    playerVars: {
      'autoplay': 0,
      'controls': 0,
      'disablekb': 1,
      'loop': 1,
      'playlist': 'yi6qpbUo-w8' 
    },
    events: {
      'onReady': function(event) {
        event.target.setVolume(50); 
      }
    }
  });
};

function startBGM() {
  if (ytPlayer && ytPlayer.playVideo) {
    ytPlayer.playVideo();
  }
}

function stopBGM() {
  if (ytPlayer && ytPlayer.pauseVideo) {
    ytPlayer.pauseVideo();
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
  playTone(880, 'sine', 0.1, 0.1);
  setTimeout(() => playTone(1200, 'sine', 0.1, 0.1), 50);
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

let currentBgNoise = null;
let thunderInterval = null;

function playBgNoise(type) {
  if(!audioCtx) return;
  stopBgNoise();
  const bufferSize = audioCtx.sampleRate * 2.0;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  currentBgNoise = audioCtx.createBufferSource();
  currentBgNoise.buffer = buffer;
  currentBgNoise.loop = true;
  
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  
  if (type === 'wind') {
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    gain.gain.value = 0.6;
  } else if (type === 'storm') {
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    gain.gain.value = 0.8;
    thunderInterval = setInterval(() => { 
      if(!currentBgNoise || !audioCtx) return;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(50, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 1.5);
      g.gain.setValueAtTime(0.8, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
      osc.connect(g); g.connect(audioCtx.destination);
      osc.start(); osc.stop(audioCtx.currentTime + 1.5);
    }, 2500);
  } else if (type === 'car' || type === 'motorcycle' || type === 'vacuum') {
    filter.type = 'lowpass';
    filter.frequency.value = type === 'motorcycle' ? 200 : (type === 'vacuum' ? 500 : 150); 
    gain.gain.value = 0.5;
    thunderInterval = setInterval(() => {
      if(!currentBgNoise || !audioCtx) return;
      filter.frequency.linearRampToValueAtTime(type === 'motorcycle' ? 400 : 300, audioCtx.currentTime + 0.3);
      filter.frequency.linearRampToValueAtTime(type === 'motorcycle' ? 200 : 150, audioCtx.currentTime + 0.8);
    }, 1000);
  }
  
  currentBgNoise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  currentBgNoise.start();
}

function stopBgNoise() {
  if(currentBgNoise) { currentBgNoise.stop(); currentBgNoise = null; }
  if(thunderInterval) { clearInterval(thunderInterval); thunderInterval = null; }
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
    bubbleEl.innerHTML += introText.charAt(introIndex);
    introIndex++;
    setTimeout(typeWriter, 35); // typing speed
  }
}
// Start typing!
setTimeout(typeWriter, 500);

let game = {
  score: 0,
  phase: 1,
  lives: 5,
  continues: 5,
  speed: 250, 
  bgSpeed: 50, 
  bgOffset: 0,
  timeInPhase: 0,
  phaseDuration: 30000,
};

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
  outfit: 'sailor'
};

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

// loadGame removed - to avoid crash due to player.outfit before player is defined

function getTheme(phase) {
  const p = (phase - 1) % 4;
  if (p === 0) return { sky: '#4DA6FF', g1: '#5D4037', g2: '#3CB371', m1: '#2E8B57', type: 'forest', starAlpha: 0 };
  if (p === 1) return { sky: '#FF8C00', g1: '#A0522D', g2: '#D2691E', m1: '#8B4513', type: 'mountain', starAlpha: 0.2 };
  if (p === 2) return { sky: '#191970', g1: '#444444', g2: '#777777', m1: '#555555', type: 'lunar', starAlpha: 1 };
  if (p === 3) return { sky: '#800080', g1: '#408080', g2: '#90EE90', m1: '#483D8B', type: 'alien', starAlpha: 0.8 };
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

function drawCat(ctx, x, y, width, height, timer, state) {
  const drawY = y + 20; 

  // Name Tag (Drawn First)
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

window.addEventListener('keydown', e => { 
  keys[e.code] = true;
  if (gameState === 'PLAYING') {
    if (e.code === 'KeyZ' || e.code === 'KeyJ') shoot();
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') jump();
  }
});
window.addEventListener('keyup', e => keys[e.code] = false);

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

// menuDogCanvas click removed - element no longer in HTML


function jump() {
  if (player.jumpCount < player.maxJumps && !player.isFalling) {
    player.vy = player.jumpPower; 
    player.isJumping = true;
    player.jumpCount++;
    soundJump();
    createExplosion(player.x, player.y + player.height/2, '#fff', 8); // Nuvenzinha ao pular no ar
  }
}

function startGame() {
  gameState = 'PLAYING';
  game.score = 0;
  game.phase = 1;
  game.lives = 5;
  game.continues = 5;
  resetPhase();
  UI.startScreen.classList.add('hidden');
  UI.gameOverScreen.classList.add('hidden');
  if(UI.phaseTransition) UI.phaseTransition.classList.add('hidden');
  
  startBGM(); 
}

function resetPhase() {
  game.speed = 250 + (game.phase - 1) * 30;
  game.timeInPhase = 0;
  player.x = 200;
  player.y = GROUND_Y;
  player.vy = 0;
  player.isJumping = false;
  player.isFalling = false;
  player.scale = 1; 
  player.rotation = 0;
  player.jumpCount = 0;
  bullets = [];
  upBullets = [];
  holes = [];
  bulldogs = [];
  enemies = [];
  savedAnimals = [];
  bombs = [];
  particles = [];
  decorations = [];
  boss = null;
  stopBgNoise();
  initMountains();
  updateUI();
}

function nextPhase() {
  gameState = 'TRANSITION';
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

function die() {
  // End phase only after Boss is defeated
  if (gameState !== 'PLAYING') return;
  game.lives--;
  soundDie();
  createExplosion(player.x, player.y - player.height/2, '#f00', 40);
  
  if (game.lives <= 0) {
    showContinueScreen();
  } else {
    player.x = -100; 
    setTimeout(() => {
      if (gameState === 'PLAYING') {
        player.x = 200;
        player.y = -100; 
        player.vy = 0;
        player.isFalling = false;
        player.scale = 1;
        player.rotation = 0;
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
  let currentAmmo = nextAmmo;
  nextAmmo = (nextAmmo === 'bone') ? 'food' : 'bone';
  
  bullets.push({ x: player.x + player.width/2 - 10, y: player.y - 12, vx: 600, rot: 0, type: currentAmmo });
  
  if (isSpread) {
    upBullets.push({ x: player.x, y: player.y - player.height - 20, vy: -600, vx: 0, rot: 0, type: currentAmmo }); 
    upBullets.push({ x: player.x, y: player.y - player.height - 20, vy: -450, vx: -400, rot: 0, type: currentAmmo }); 
    upBullets.push({ x: player.x, y: player.y - player.height - 20, vy: -450, vx: 400, rot: 0, type: currentAmmo }); 
  } else {
    upBullets.push({ x: player.x, y: player.y - player.height - 20, vy: -600, vx: 0, rot: 0, type: currentAmmo });
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
    let bType = 'storm';
    const bPhase = game.phase % 5;
    if (bPhase === 1) bType = 'wind';
    else if (bPhase === 2) bType = 'storm';
    else if (bPhase === 3) bType = 'vacuum';
    else if (bPhase === 4) bType = 'car';
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
    if (decorations.length < 8) {
      let icon = '☁️';
      if (theme.type === 'lunar') icon = '☄️';
      else if (theme.type === 'alien') icon = '🛸';
      
      decorations.push({
        x: canvas.width + 100,
        y: 30 + Math.random() * 200,
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
    if (overHole && !player.isJumping) {
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
    die();
  }

  for(let m of mountains) {
    m.x -= game.bgSpeed * dt;
    if (m.x + m.width < 0) {
      m.x = canvas.width + Math.random() * 100;
      m.height = 200 + Math.random() * 100;
      m.y = 300 + Math.random() * 100;
    }
  }

  const baseHoleChance = (boss || game.timeInPhase > game.phaseDuration - 2000) ? 0 : 0.001 + (game.phase * 0.0003);
  const baseBulldogChance = boss ? 0 : 0.002 + (game.phase * 0.0005);
  
  const maxEnemies = boss ? 0 : 1 + game.phase; 
  const baseEnemyChance = boss ? 0 : 0.002 + (game.phase * 0.001); 

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
      const t = Math.random() > 0.5 ? 'frida' : 'cinder';
      let w = t === 'cinder' ? 60 : 110; 
      let h = t === 'cinder' ? 35 : 50;
      bulldogs.push({ x: canvas.width, y: GROUND_Y, width: w, height: h, state: 'idle', animTimer: 0, kind: t }); 
      if (t === 'cinder') soundMeow(); else soundDogBark();
    }
  }
  if (Math.random() < baseEnemyChance) { 
    if (enemies.length < maxEnemies) { 
      const types = ['marmota', 'lagosta', 'camarao', 'lombriz', 'cat', 'monkey', 'dove'];
      const badTypes = ['bat', 'eagle', 'fly'];
      enemies.push({ 
        x: canvas.width + 50, 
        y: 40 + Math.random() * 180, 
        vx: -150 - Math.random() * 80 * (1 + game.phase * 0.1), 
        timer: 0,
        type: types[Math.floor(Math.random() * types.length)],
        badType: badTypes[Math.floor(Math.random() * badTypes.length)]
      });
    }
  }

  for(let i = holes.length - 1; i >= 0; i--) {
    holes[i].x -= game.speed * dt;
    if (holes[i].x + holes[i].width < -150) holes.splice(i, 1);
  }
  
  for(let i = bulldogs.length - 1; i >= 0; i--) {
    let b = bulldogs[i];
    if (b.state === 'jumping_to_eat') {
      b.y += (b.vy * dt);
      b.vy += 1500 * dt; 
      b.x -= game.speed * dt;
      if (b.y >= GROUND_Y) {
         b.y = GROUND_Y;
         b.state = 'eating';
         b.animTimer = 0;
         soundHappy();
         createExplosion(b.x, b.y - 30, '#ffb6c1', 20); 
         game.score += 20;
         updateUI();
      }
    } else if (b.state === 'eating') {
      b.x -= game.speed * dt; 
      b.animTimer += dt;
      if (Math.random() < 0.05) { 
        createExplosion(b.x, b.y - 30, '#ffb6c1', 2);
      }
      if (b.x + b.width < -100) bulldogs.splice(i, 1);
    } else {
      b.x -= game.speed * dt;
      b.animTimer += dt;
      if (!player.isFalling && 
          Math.abs(player.x - b.x) < player.width/2 + b.width/2 - 10 &&
          Math.abs(player.y - player.height/2 - (b.y - b.height/2)) < player.height/2 + b.height/2 - 10) {
        die();
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
        // Sweeps across the entire screen!
        boss.x = canvas.width / 2 + Math.sin(boss.timer * 1.5) * (canvas.width / 2 - 50);
        boss.y = 150 + Math.sin(boss.timer * 3.5) * 80;
        
        // Boss shoots fast bombs
        if (Math.random() < 0.03 + (game.phase * 0.01)) {
           bombs.push({ x: boss.x, y: boss.y + 40, vy: 300 });
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
      soundPoof();
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

  player.animTimer += dt;
}

// DRAW FUNCTIONS
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
  if (UI.menuDogCanvas && gameState === 'START') {
    const ctx1 = UI.menuDogCanvas.getContext('2d');
    ctx1.clearRect(0, 0, 160, 160);
    drawLunaMenu(ctx1, 80, 80, 100, timer);
  }
  if (UI.victoryDogCanvas && gameState === 'PHASE_COMPLETE') {
    const ctx2 = UI.victoryDogCanvas.getContext('2d');
    ctx2.clearRect(0, 0, 160, 160);
    let bounce = Math.abs(Math.sin(timer * 8) * 15);
    drawLunaMenu(ctx2, 80, 80 + bounce, 100, timer); 
  }
}

function drawDog(ctx, x, y, width, height, timer, isJumping, isFalling) {
  const drawY = y + 20; // Anchor on dirt

  ctx.save();
  ctx.translate(x, drawY); 
  ctx.scale(player.scale || 1, player.scale || 1);
  if (player.isFalling) ctx.rotate(player.rotation || 0);
  else if (isJumping) ctx.rotate(-Math.PI / 12);
  
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 8;
  
  const bodyGrad = ctx.createLinearGradient(0, -height - 10, 0, 0);
  bodyGrad.addColorStop(0, '#B2663E');
  bodyGrad.addColorStop(1, '#5C2E0A');

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-width/2, -height - 10, width, height, height/2);
  ctx.fill();

  ctx.shadowBlur = 0; 
  ctx.shadowOffsetY = 0;

  // Tuxedo for 'suit' outfit
  if (player.outfit === 'suit') {
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(-width/2, -height - 5);
    ctx.lineTo(0, -5);
    ctx.lineTo(width/2, -height - 5);
    ctx.lineTo(width/2, 0);
    ctx.lineTo(-width/2, 0);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-10, -height - 2);
    ctx.lineTo(0, -10);
    ctx.lineTo(10, -height - 2);
    ctx.fill();
    
    // Bow tie
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.moveTo(-5, -height + 2);
    ctx.lineTo(5, -height + 10);
    ctx.lineTo(-5, -height + 10);
    ctx.lineTo(5, -height + 2);
    ctx.fill();
  }

  const headGrad = ctx.createRadialGradient(width/2 + 5, -height - 17, 0, width/2 + 5, -height - 17, 30);
  headGrad.addColorStop(0, '#f08954');
  headGrad.addColorStop(1, '#8B4513');

  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.roundRect(width/2 - 10, -height - 30, 30, 25, 12);
  ctx.fill();

  // Hats
  if (player.outfit === 'sailor') {
    // Pink Sailor Hat
    ctx.save();
    ctx.translate(width/2 + 5, -height - 30);
    ctx.rotate(-0.1);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 12, Math.PI, 0); 
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff69b4'; 
    ctx.fillRect(-15, -2, 30, 4);
    ctx.fillStyle = '#ff1493';
    ctx.fillRect(-5, -12, 10, 2);
    ctx.restore();
  } else if (player.outfit === 'suit') {
    // Elegant Black Hat
    ctx.save();
    ctx.translate(width/2 + 10, -height - 35);
    ctx.fillStyle = '#222';
    ctx.fillRect(-15, 0, 30, 5); // Brim
    ctx.fillRect(-10, -15, 20, 15); // Top
    ctx.fillStyle = '#f00'; // Red ribbon
    ctx.fillRect(-10, -5, 20, 3);
    ctx.restore();
  }
  
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.roundRect(width/2 + 10, -height - 20, 25, 15, 8);
  ctx.fill();
  
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(width/2 + 33, -height - 14, 4, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(width/2 + 32, -height - 16, 1, 0, Math.PI*2);
  ctx.fill();
  
  // CUTE UPPER EYES (PIDÃO)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(width/2 + 12, -height - 22, 5, 8, 0, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  // pupil looking up / forward
  ctx.arc(width/2 + 14, -height - 24, 3.5, 0, Math.PI*2);
  ctx.fill();
  
  // Shiny "Pidão" reflection
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(width/2 + 15, -height - 25, 1.5, 0, Math.PI*2);
  ctx.fill();

  // Blinking animation
  if (Math.sin(timer * 4) > 0.96) {
     ctx.fillStyle = headGrad; 
     ctx.beginPath();
     ctx.ellipse(width/2 + 12, -height - 22, 6, 9, 0, 0, Math.PI*2);
     ctx.fill();
     ctx.fillStyle = '#000'; 
     ctx.fillRect(width/2 + 8, -height - 22, 8, 2);
  }
  
  ctx.save();
  ctx.translate(width/2, -height - 25);
  let earFlap = 0;
  if (isFalling) earFlap = -Math.PI/2 + Math.sin(timer * 30) * 0.3;
  else if (isJumping) earFlap = -Math.PI/3 + Math.sin(timer * 40) * 0.6; 
  else earFlap = -Math.PI/8 + Math.sin(timer * 20) * 0.4;
  ctx.rotate(earFlap);
  
  ctx.fillStyle = EARS_COLOR;
  ctx.beginPath();
  ctx.ellipse(-2, 12, 6, 15, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(-width/2 + 5, -height - 5);
  ctx.rotate(Math.sin(timer * 15) * 0.3 - 0.5);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-20, -5, 25, 8, 4);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = EARS_COLOR;
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

function drawFood(ctx, x, y, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.shadowColor = 'rgba(255,100,0,0.8)';
  ctx.shadowBlur = 10;
  
  // Ração (Fish shape / bowl)
  ctx.fillStyle = '#D2691E'; // orangeish cat food
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(5, 5);
  ctx.lineTo(-5, 5);
  ctx.fill();

  ctx.fillStyle = '#A0522D';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI*2);
  ctx.fill();

  ctx.restore();
}

function drawBulldog(ctx, x, y, width, height, timer, state) {
  const drawY = y + 20; // Anchor on dirt

  // Floating Name Tag (RPG style) - Drawn FIRST, so it doesn't rotate!
  ctx.save();
  ctx.translate(x, drawY);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(-width/2 - 10, -height - 35, 40, 15);
  ctx.fillStyle = '#FFD700';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('FRIDA', -width/2 + 10, -height - 24);
  ctx.restore();

  // Draw Bulldog Body
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
  
  ctx.fillStyle = bBody;
  ctx.beginPath();
  ctx.roundRect(-width/2, -height, width, height, height/2);
  ctx.fill();
  
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -height/2 + 5, width/2 - 15, height/2 - 5, 0, 0, Math.PI*2);
  ctx.fill();
  
  const bHead = ctx.createRadialGradient(-width/2 + 5, -height/2 + 5, 0, -width/2 + 5, -height/2 + 5, 45);
  bHead.addColorStop(0, '#ffdf99');
  bHead.addColorStop(1, '#a6722d');

  ctx.fillStyle = bHead;
  ctx.beginPath();
  ctx.arc(-width/2, -height/2, 25, 0, Math.PI*2); 
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-width/2 - 10, -height/2 + 8, 18, 12, 0, 0, Math.PI*2); 
  ctx.fill();
  
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-width/2 - 15, -height/2 + 2, 6, 0, Math.PI*2); 
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-width/2 - 17, -height/2, 2, 0, Math.PI*2);
  ctx.fill();

  if (state === 'idle' || state === 'jumping_to_eat') {
    ctx.fillStyle = '#6b0000'; 
    ctx.beginPath();
    ctx.arc(-width/2 - 12, -height/2 + 15, 12, 0, Math.PI); 
    ctx.fill();
    ctx.fillStyle = '#ff6666'; 
    ctx.beginPath();
    ctx.ellipse(-width/2 - 12, -height/2 + 18, 8, 5, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-width/2 - 20, -height/2 + 10, 4, 6);
    ctx.fillRect(-width/2 - 6, -height/2 + 10, 4, 6);
  } else { 
    ctx.fillStyle = '#ff6666'; 
    ctx.beginPath();
    ctx.roundRect(-width/2 - 15, -height/2 + 15, 10, 10, 4);
    ctx.fill();
  }

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-width/2 - 5, -height/2 - 10, 7, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  if (state === 'idle') {
    ctx.arc(-width/2 - 7, -height/2 - 10, 3, 0, Math.PI*2); 
    ctx.fillStyle = '#333';
    ctx.fillRect(-width/2 - 10, -height/2 - 18, 12, 4);
  } else if (state === 'jumping_to_eat') {
    ctx.arc(-width/2 - 5, -height/2 - 10, 4, 0, Math.PI*2); 
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(-width/2 - 5, -height/2 - 18, 8, Math.PI, 0); 
    ctx.stroke();
  } else {
    ctx.fillRect(-width/2 - 9, -height/2 - 10, 8, 3);
  }

  ctx.fillStyle = '#8a5c1a'; 
  ctx.beginPath();
  ctx.ellipse(-width/2 + 15, -height/2 - 10, 8, 15, -0.5, 0, Math.PI*2);
  ctx.fill();

  let swing = state === 'eating' ? Math.sin(timer * 10) * 8 : Math.sin(timer * 10) * 4;
  if(state === 'jumping_to_eat') swing = 0;
  
  ctx.fillStyle = bBody;
  ctx.beginPath();
  ctx.roundRect(width/2 - 20 - swing, -10, 12, 15, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff'; 
  ctx.beginPath();
  ctx.roundRect(width/2 - 20 - swing, 0, 12, 5, 2);
  ctx.fill();

  ctx.fillStyle = bBody;
  ctx.beginPath();
  ctx.roundRect(-width/2 + 10 + swing, -10, 12, 15, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff'; 
  ctx.beginPath();
  ctx.roundRect(-width/2 + 10 + swing, 0, 12, 5, 2);
  ctx.fill();
  
  ctx.restore();

  if(state === 'eating' || state === 'jumping_to_eat') {
    ctx.save();
    ctx.translate(x - width/2 - 10, drawY + (state === 'eating' ? 10 : -15));
    ctx.rotate(timer * 15); 
    drawBone(ctx, 0, 0, 0);
    ctx.restore();
  }
}

function drawAnimal(ctx, x, y, type, timer, badType) {
  ctx.save();
  ctx.translate(x, y + Math.sin(timer * 5) * 15); 
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;

  // Add flapping animation to bats and flies!
  if (badType !== 'eagle') {
     const flap = Math.sin(timer * 40) * 0.3; // rapid rocking wings
     ctx.rotate(flap);
  } else {
     const glide = Math.sin(timer * 10) * 0.1;
     ctx.rotate(glide);
  }

  ctx.font = '60px Arial'; 
  if (badType === 'bat') ctx.fillText('🦇', 0, -25);
  else if (badType === 'eagle') ctx.fillText('🦅', 0, -25);
  else ctx.fillText('🪰', 0, -25); // fly
  
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

  ctx.font = '40px Arial';
  if (type === 'cat') ctx.fillText('🐈', 0, 40);
  else if (type === 'marmota') ctx.fillText('🦦', 0, 40);
  else if (type === 'lagosta') ctx.fillText('🦞', 0, 40);
  else if (type === 'camarao') ctx.fillText('🦐', 0, 40); 
  else if (type === 'lombriz') ctx.fillText('🪱', 0, 40); 
  else if (type === 'dove') ctx.fillText('🕊️', 0, 40); 
  else ctx.fillText('🐒', 0, 40); 
  
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
  
  const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGrad.addColorStop(0, theme.sky);
  if (theme.type === 'forest') skyGrad.addColorStop(1, '#afeeee');
  else if (theme.type === 'mountain') skyGrad.addColorStop(1, '#ffc0cb');
  else skyGrad.addColorStop(1, '#000');

  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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

  const g1Grad = ctx.createLinearGradient(0, GROUND_Y, 0, canvas.height);
  g1Grad.addColorStop(0, theme.g1);
  g1Grad.addColorStop(1, '#111'); 
  ctx.fillStyle = g1Grad;
  ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
  
  ctx.fillStyle = theme.g2; 
  ctx.beginPath();
  let startX = -(game.bgOffset % 40); 
  ctx.moveTo(0, GROUND_Y - 20); 
  for(let x = startX; x <= canvas.width + 40; x += 20) {
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
    
    if (boss.type === 'storm' || boss.type === 'wind' || boss.type === 'vacuum') {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Draw flying streaks
      for (let i = 0; i < 30; i++) {
        const sx = Math.random() * canvas.width;
        const sy = Math.random() * canvas.height;
        ctx.moveTo(sx, sy);
        if (boss.type === 'wind' || boss.type === 'vacuum') {
           ctx.lineTo(sx - 100, sy); // horizontal wind
        } else {
           ctx.lineTo(sx - 20, sy + 80); // diagonal rain
        }
      }
      ctx.stroke();
    }
  }

  function drawAngryEyes(c, x, y) {
    c.fillStyle = '#f00';
    c.beginPath(); c.ellipse(x - 15, y, 6, 4, 0.3, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(x + 15, y, 6, 4, -0.3, 0, Math.PI*2); c.fill();
    c.lineWidth = 4; c.strokeStyle = '#000';
    c.beginPath(); c.moveTo(x - 24, y - 6); c.lineTo(x - 8, y + 2); c.stroke();
    c.beginPath(); c.moveTo(x + 24, y - 6); c.lineTo(x + 8, y + 2); c.stroke();
  }

  // Draw Boss Fears
  if (boss) {
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    
    ctx.font = '80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (boss.type === 'wind') {
        ctx.fillText('🌪️', 0, 0); 
        drawAngryEyes(ctx, 0, -10);
    } else if (boss.type === 'storm') {
        ctx.fillText('🌩️', 0, 0); 
        drawAngryEyes(ctx, 0, 10);
    } else if (boss.type === 'vacuum') {
        ctx.fillText('🧹', 0, 0); 
        drawAngryEyes(ctx, 0, -10);
    } else if (boss.type === 'car') {
        ctx.fillText('🚘', 0, 0); 
        drawAngryEyes(ctx, 0, 5);
    } else {
        ctx.fillText('🏍️', 0, 0); 
        drawAngryEyes(ctx, 5, -5);
    }
    
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
    
    let fearName = 'MOTO';
    if (boss.type === 'wind') fearName = 'VENTANIA';
    else if (boss.type === 'storm') fearName = 'TROVÃO';
    else if (boss.type === 'vacuum') fearName = 'ASPIRADOR';
    else if (boss.type === 'car') fearName = 'CARRO';

    ctx.fillText(fearName, 0, 60);

    ctx.restore();
  }

  for(let b of bulldogs) {
    if (b.kind === 'frida') drawBulldog(ctx, b.x, b.y, b.width, b.height, b.animTimer, b.state);
    else drawCat(ctx, b.x, b.y, b.width, b.height, b.animTimer, b.state);
  }

  for(let e of enemies) {
    drawAnimal(ctx, e.x, e.y, e.type, e.timer, e.badType);
  }

  for(let b of bombs) {
    ctx.font = '45px Arial'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 10;
    ctx.fillText('🎁', b.x, b.y); 
    ctx.shadowBlur = 0;
  }

  for(let sa of savedAnimals) {
    ctx.save();
    ctx.translate(sa.x, sa.y);
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 5;
    ctx.fillText('🪂', 0, -40); 
    if (sa.type === 'cat') ctx.fillText('🐈', 0, 0); 
    else if (sa.type === 'marmota') ctx.fillText('🦦', 0, 0); 
    else if (sa.type === 'lagosta') ctx.fillText('🦞', 0, 0); 
    else if (sa.type === 'camarao') ctx.fillText('🦐', 0, 0); 
    else if (sa.type === 'lombriz') ctx.fillText('🪱', 0, 0); 
    else if (sa.type === 'dove') ctx.fillText('🕊️', 0, 0); 
    else ctx.fillText('🐒', 0, 0); 
    ctx.restore();
  }

  for(let b of bullets) {
    if (b.type === 'bone') drawBone(ctx, b.x, b.y, b.rot);
    else drawFood(ctx, b.x, b.y, b.rot);
  }
  for(let b of upBullets) {
    if (b.type === 'bone') drawStone(ctx, b.x, b.y, b.rot); // Stone up is basically bone replacement, wait user said "tudo que atira tem que matar", so standard up bullets
    else drawFood(ctx, b.x, b.y, b.rot);
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
    drawDog(ctx, player.x, player.y, player.width, player.height, player.animTimer, player.isJumping, player.isFalling);
  }
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
