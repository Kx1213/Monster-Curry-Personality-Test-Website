(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const DPR = Math.max(1, window.devicePixelRatio || 1);

  // UI
  const screens = {
    intro: document.getElementById('screen-intro'),
    ingredients: document.getElementById('screen-ingredients'),
    result: document.getElementById('screen-result')
  };
  const btnStart = document.getElementById('btn-start');
  const btnPlay = document.getElementById('btn-play');
  const btnRestart = document.getElementById('btn-restart');
  const timerEl = document.getElementById('timer');
  const scoreEl = document.getElementById('score');
  const finalScoreEl = document.getElementById('final-score');
  const ingredientsListEl = document.getElementById('ingredients-list');

  // Config
  const GAME_TIME = 60; // seconds
  const ASSETS = {
    player: 'assets/player.svg',
    ing1: 'assets/ingredient1.svg',
    ing2: 'assets/ingredient2.svg',
    ing3: 'assets/ingredient3.svg'
  };

  // per-type configuration (points and spawn weight)
  const TYPE_CONFIG = {
    ing1: { points: 5, weight: 0.5 },
    ing2: { points: 10, weight: 0.35 },
    ing3: { points: 20, weight: 0.15 }
  };

  const SPAWN_INITIAL = 900; // ms
  const SPAWN_MIN = 280; // ms
  const MAX_INGREDIENTS = 28;

  // State
  let state = 'intro';
  let width = 320, height = 568;
  let score = 0;
  let timeLeft = GAME_TIME;
  let lastSpawn = 0;
  let spawnInterval = SPAWN_INITIAL;
  let ingredients = [];
  let particles = [];
  let images = {};
  let running = false;

  // Player
  const player = {x:0,y:0,w:120,h:44,image:null};

  function resize(){
    const wrap = canvas.parentElement;
    const rect = wrap.getBoundingClientRect();
    width = Math.max(280, Math.floor(rect.width));
    height = Math.max(420, Math.floor(rect.height));
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    player.y = height - 80;
    if (player.x === 0) player.x = width/2;
  }

  function loadAssets(cb){
    const keys = Object.keys(ASSETS);
    let loaded = 0;
    keys.forEach(k => {
      const img = new Image();
      img.src = ASSETS[k];
      img.onload = () => { images[k]=img; if(++loaded===keys.length) cb(); };
      img.onerror = () => { images[k]=null; if(++loaded===keys.length) cb(); };
    });
  }

  function setState(s){
    state = s;
    // hide all screens by default
    Object.values(screens).forEach(el=>el.classList.remove('active'));
    if (s === 'intro') screens.intro.classList.add('active');
    if (s === 'ingredients') screens.ingredients.classList.add('active');
    if (s === 'result') screens.result.classList.add('active');
    // 'game' hides all screens and shows canvas/HUD
    document.body.classList.toggle('game-active', s === 'game');
  }

  function startRound(){
    score = 0; timeLeft = GAME_TIME; ingredients = []; lastSpawn = 0; spawnInterval = 700; running = true;
    scoreEl.textContent = '0'; timerEl.textContent = String(timeLeft);
    setState('game');
    lastTime = 0;
    requestAnimationFrame(loop);
  }

  function endRound(){
    running = false;
    finalScoreEl.textContent = 'Score: ' + score;
    setState('result');
  }

  function pickTypeByWeight(){
    const entries = Object.entries(TYPE_CONFIG);
    const total = entries.reduce((s,[_k,v])=>s+v.weight,0);
    let r = Math.random()*total;
    for (const [k,v] of entries){
      if (r < v.weight) return k;
      r -= v.weight;
    }
    return entries[0][0];
  }

  function spawnIngredient(){
    if (ingredients.length >= MAX_INGREDIENTS) return;
    const type = pickTypeByWeight();
    const size = 32 + Math.random()*28;
    const x = 20 + Math.random()*(width-40);
    const elapsed = GAME_TIME - timeLeft;
    const speed = 70 + Math.random()*120 + elapsed*0.6; // scale up over time
    const cfg = TYPE_CONFIG[type] || {points:10};
    ingredients.push({x: x, y: -size, r: size/2, type: type, size: size, speed: speed, points: cfg.points});
  }

  function spawnParticles(x,y,count=6){
    for(let i=0;i<count;i++){
      const angle = (Math.random()*Math.PI) - Math.PI/2;
      const speed = 30 + Math.random()*90;
      particles.push({x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, life: 420 + Math.random()*300, t:0, size:3+Math.random()*5});
    }
    // cap particles for performance
    if (particles.length > 120) particles.splice(0, particles.length - 120);
  }

  function update(dt){
    if (!running) return;
    lastSpawn += dt;
    // compute dynamic spawn interval based on elapsed time
    const elapsed = GAME_TIME - timeLeft;
    const target = Math.max(SPAWN_MIN, SPAWN_INITIAL - elapsed * 9);
    spawnInterval = target;
    if (lastSpawn > spawnInterval){ spawnIngredient(); lastSpawn = 0; }

    for (let i=ingredients.length-1;i>=0;i--){
      const ing = ingredients[i];
      ing.y += ing.speed * (dt/1000);
      // collision
      if (ing.y + ing.r > player.y - player.h/2 && ing.x > player.x - player.w/2 && ing.x < player.x + player.w/2){
        // collected
        score += (ing.points || 10);
        spawnParticles(ing.x, ing.y, 6);
        ingredients.splice(i,1);
        scoreEl.textContent = score;
        // small visual pulse
        player.pulse = 1.18;
        continue;
      }
      // missed
      if (ing.y - ing.r > height){ ingredients.splice(i,1); }
    }

    // update particles
    for (let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.t += dt;
      p.x += p.vx * (dt/1000);
      p.y += p.vy * (dt/1000);
      p.vy += 300 * (dt/1000); // gravity
      if (p.t > p.life) particles.splice(i,1);
    }

    // decay player pulse
    if (player.pulse){ player.pulse = Math.max(1, player.pulse - dt*0.002); if (player.pulse <= 1) player.pulse = 0; }
  }

  function draw(){
    ctx.clearRect(0,0,width,height);
    // background
    ctx.fillStyle = '#fff7ee'; ctx.fillRect(0,0,width,height);

    // draw ingredients
    ingredients.forEach(ing => {
      const img = images[ing.type];
      if (img) ctx.drawImage(img, ing.x - ing.size/2, ing.y - ing.size/2, ing.size, ing.size);
      else { ctx.fillStyle = '#f48'; ctx.beginPath(); ctx.arc(ing.x, ing.y, ing.r, 0, Math.PI*2); ctx.fill(); }
    });

    // draw particles (behind player)
    particles.forEach(p => {
      const alpha = 1 - (p.t / p.life);
      ctx.fillStyle = `rgba(255,200,120,${alpha})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    });

    // draw player (bowl) with optional pulse scale
    const px = player.x - player.w/2;
    const py = player.y - player.h/2;
    const pimg = images.player;
    const pulse = player.pulse || 0;
    if (pulse > 1){
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.scale(pulse, pulse);
      if (pimg) ctx.drawImage(pimg, -player.w/2, -player.h/2, player.w, player.h);
      else { ctx.fillStyle='#e2572e'; ctx.fillRect(-player.w/2, -player.h/2, player.w, player.h); }
      ctx.restore();
    } else {
      if (pimg) ctx.drawImage(pimg, px, py, player.w, player.h);
      else { ctx.fillStyle='#e2572e'; ctx.fillRect(px, py, player.w, player.h); }
    }
  }

  let lastTime = 0;
  function loop(ts){
    if (!lastTime) lastTime = ts;
    const dt = ts - lastTime; lastTime = ts;
    // update timer
    if (running){
      update(dt);
      // decrement timer
      timeLeft -= dt/1000;
      if (timeLeft <= 0){ timeLeft = 0; timerEl.textContent = '0'; endRound(); }
      else timerEl.textContent = Math.ceil(timeLeft);
    }
    draw();
    if (running) requestAnimationFrame(loop);
  }

  // Input - follow pointer horizontally
  function onPointerMove(e){
    const rect = canvas.getBoundingClientRect();
    const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
    if (typeof clientX !== 'number') return;
    const x = clientX - rect.left;
    player.x = Math.max(player.w/2, Math.min(width - player.w/2, x));
  }

  // pointer down / tap — move immediately
  canvas.addEventListener('pointerdown', (ev)=>{
    onPointerMove(ev);
  });

  // keyboard support for desktop testing
  window.addEventListener('keydown', (ev)=>{
    const step = 24;
    if (ev.key === 'ArrowLeft') { player.x = Math.max(player.w/2, player.x - step); }
    if (ev.key === 'ArrowRight') { player.x = Math.min(width - player.w/2, player.x + step); }
  });

  // Buttons
  btnStart.addEventListener('click', ()=> setState('ingredients'));
  btnPlay.addEventListener('click', ()=>{ loadAssets(()=>{ startRound(); }); });
  btnRestart.addEventListener('click', ()=>{ setState('ingredients'); });

  // pointer / touch events
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('touchmove', (ev)=>{ ev.preventDefault(); onPointerMove(ev); }, {passive:false});

  // init
  function init(){
    resize(); window.addEventListener('resize', resize);
    // pause/resume on visibility change
    let wasRunning = false;
    document.addEventListener('visibilitychange', ()=>{
      if (document.hidden){ wasRunning = running; running = false; }
      else { if (wasRunning) { running = true; lastTime = 0; requestAnimationFrame(loop); }}
    });
    // fill ingredient tiles
    ['ing1','ing2','ing3'].forEach(k => {
      const tile = document.createElement('div'); tile.className='tile';
      const img = document.createElement('img'); img.src = ASSETS[k]; img.alt = k; img.width=48; img.height=48;
      tile.appendChild(img); ingredientsListEl.appendChild(tile);
    });
    // set initial images
    player.image = ASSETS.player;
    loadAssets(()=>{});
  }

  init();
})();
