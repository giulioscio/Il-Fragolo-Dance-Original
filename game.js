(() => {
  const startScreen = document.getElementById('startScreen');
  const gameScreen  = document.getElementById('gameScreen');
  const endScreen   = document.getElementById('endScreen');

  const startBtn   = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const spinBtn    = document.getElementById('spinBtn');

  const sprite = document.getElementById('sprite');
  const scoreEl = document.getElementById('score');
  const timeEl  = document.getElementById('time');
  const finalScoreEl = document.getElementById('finalScore');

  const musicStart = document.getElementById('musicStart');
  const musicGame  = document.getElementById('musicGame');

  const DURATION_MS = 60_000;
  const FRAMES = 8;
  const FRAME_ANGLE = 360 / FRAMES; // 45°
  const TAP_BOOST = 850;
  const MAX_VEL = 4200;
  const DAMPING = 4.2;

  const frameSrc = Array.from({length: FRAMES}, (_,i) => `assets/spin_${i}.png`);

  let running=false, startTs=0, lastTs=0;
  let angle=0, totalAngle=0, vel=0;
  let score=0;

  function setFrameFromAngle(deg){
    const a = ((deg % 360) + 360) % 360;
    const idx = Math.floor(a / FRAME_ANGLE) % FRAMES;
    sprite.style.backgroundImage = `url("${frameSrc[idx]}")`;
  }
  function calcScore(){ return Math.floor(Math.abs(totalAngle) / 360); }
  function setTimeLeft(ms){ timeEl.textContent = String(Math.ceil(ms/1000)); }

  function resetGame(){
    running=false; startTs=0; lastTs=0;
    angle=0; totalAngle=0; vel=0; score=0;
    scoreEl.textContent='0';
    setTimeLeft(DURATION_MS);
    setFrameFromAngle(0);
  }

  function tap(){
    if(!running) return;
    vel = Math.min(MAX_VEL, vel + TAP_BOOST);
    spinBtn.animate([{transform:"scale(1)"},{transform:"scale(.985)"},{transform:"scale(1)"}], {duration:110, easing:"ease-out"});
  }

  function endGame(){
    running=false;
    try{ musicGame.pause(); }catch{}
    finalScoreEl.textContent = String(score);
    endScreen.classList.remove('hidden');
  }

  function tick(ts){
    if(!running) return;
    if(!startTs){ startTs=ts; lastTs=ts; }
    const dt = Math.min(0.033, (ts-lastTs)/1000);
    lastTs = ts;

    vel *= Math.exp(-DAMPING * dt);

    const d = vel * dt;
    angle += d;
    totalAngle += d;

    setFrameFromAngle(angle);

    const ns = calcScore();
    if(ns !== score){ score=ns; scoreEl.textContent=String(score); }

    const elapsed = ts - startTs;
    const left = Math.max(0, DURATION_MS - elapsed);
    setTimeLeft(left);

    if(left<=0){ endGame(); return; }
    requestAnimationFrame(tick);
  }

  async function safePlay(a){
    try{
      a.muted = false;
      a.volume = 1;
      await a.play();
      return true;
    }catch(e){
      // retry after a short delay (some mobile browsers need a tick)
      try{
        await new Promise(r=>setTimeout(r, 150));
        await a.play();
        return true;
      }catch(e2){
        return false;
      }
    }
  }

  async function startFlow(){
    if(running) return; // già in game

    // hard-hide start screen (mobile safe)
    startScreen.classList.remove('show');
    startScreen.style.display = 'none';
    startScreen.style.pointerEvents = 'none';

    // show game
    gameScreen.classList.remove('hidden');

    // audio: abilita con gesto e poi passa alla musica game
    musicStart.currentTime = 0;
    await safePlay(musicStart);
    try{ musicStart.pause(); }catch(e){}

    musicGame.currentTime = 0;
    await safePlay(musicGame);

    resetGame();
    running = true;
    vel = 900;
    endScreen.classList.add('hidden');
    requestAnimationFrame(tick);
  }

  function backToStart(){
    resetGame();
    gameScreen.classList.add('hidden');
    startScreen.classList.add('show');
    endScreen.classList.add('hidden');
    try{ musicGame.pause(); }catch{}
    musicStart.currentTime = 0;
    safePlay(musicStart);
  }

  startBtn.addEventListener('pointerdown', (e)=>{ e.preventDefault(); startFlow(); }, {passive:false});
  startBtn.addEventListener('click', (e)=>{ e.preventDefault(); startFlow(); });

  spinBtn.addEventListener('pointerdown', (e)=>{ e.preventDefault(); tap(); }, {passive:false});

  restartBtn.addEventListener('pointerdown', (e)=>{ e.preventDefault(); backToStart(); }, {passive:false});
  restartBtn.addEventListener('click', (e)=>{ e.preventDefault(); backToStart(); });

  resetGame();
})();