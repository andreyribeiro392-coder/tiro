// ==================================================
// 🎮 JOGO PRINCIPAL - CÓDIGO ORIGINAL 100% INTACTO
// ==================================================
// GameJS.js — FPS 3D Battle Royale Lite Engine (Browser)
// No external libraries
// Optimized pseudo-3D raycasting engine (Wolfenstein-style)

(() => {
  const canvas = document.createElement('canvas');
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W = canvas.width = innerWidth;
  let H = canvas.height = innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
  });

  // ===== MAP =====
  const map = [
    "1111111111111111",
    "1000000000000001",
    "1011110111111101",
    "1000010000000101",
    "1011011110110101",
    "1001000000100001",
    "1011110111101101",
    "1000000000000001",
    "1111111111111111"
  ];

  const mapW = map[0].length;
  const mapH = map.length;

  const tileSize = 64;

  // ===== PLAYER =====
  const player = {
    x: 100,
    y: 100,
    angle: 0,
    hp: 100,
    speed: 2.2
  };

  // ===== ENEMIES =====
  const enemies = [];

  function spawnEnemy() {
    enemies.push({
      x: Math.random() * mapW * tileSize,
      y: Math.random() * mapH * tileSize,
      hp: 100
    });
  }

  for (let i = 0; i < 8; i++) spawnEnemy();

  // ===== INPUT =====
  const keys = {};
  document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

  document.addEventListener('mousemove', e => {
    player.angle += e.movementX * 0.002;
  });

  document.body.addEventListener('click', () => {
    document.body.requestPointerLock();
    shoot();
  });

  // ===== COLLISION =====
  function isWall(x, y) {
    const mx = Math.floor(x / tileSize);
    const my = Math.floor(y / tileSize);
    if (mx < 0 || my < 0 || mx >= mapW || my >= mapH) return true;
    return map[my][mx] === '1';
  }

  // ===== SHOOT =====
  function shoot() {
    for (let i = 0; i < enemies.length; i++) {
      const dx = enemies[i].x - player.x;
      const dy = enemies[i].y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        enemies[i].hp -= 50;
        if (enemies[i].hp <= 0) enemies.splice(i, 1);
        break;
      }
    }
  }

  // ===== UPDATE =====
  function update() {
    let moveX = 0, moveY = 0;

    if (keys['w']) {
      moveX += Math.cos(player.angle) * player.speed;
      moveY += Math.sin(player.angle) * player.speed;
    }
    if (keys['s']) {
      moveX -= Math.cos(player.angle) * player.speed;
      moveY -= Math.sin(player.angle) * player.speed;
    }
    if (keys['a']) {
      moveX += Math.cos(player.angle - Math.PI / 2) * player.speed;
      moveY += Math.sin(player.angle - Math.PI / 2) * player.speed;
    }
    if (keys['d']) {
      moveX += Math.cos(player.angle + Math.PI / 2) * player.speed;
      moveY += Math.sin(player.angle + Math.PI / 2) * player.speed;
    }

    if (!isWall(player.x + moveX, player.y)) player.x += moveX;
    if (!isWall(player.x, player.y + moveY)) player.y += moveY;

    // enemies simple AI
    for (let e of enemies) {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d < 200) {
        e.x += dx / d * 0.6;
        e.y += dy / d * 0.6;
      }

      if (d < 20) player.hp -= 0.2;
    }
  }

  // ===== RAYCAST =====
  function castRay(angle) {
    let rayX = player.x;
    let rayY = player.y;

    const step = 2;
    for (let i = 0; i < 300; i += step) {
      rayX += Math.cos(angle) * step;
      rayY += Math.sin(angle) * step;

      if (isWall(rayX, rayY)) {
        return i;
      }
    }
    return 300;
  }

  // ===== RENDER =====
  function render() {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, W, H / 2);
    ctx.fillStyle = '#222';
    ctx.fillRect(0, H / 2, W, H / 2);

    const fov = Math.PI / 3;
    const rays = W;

    for (let i = 0; i < rays; i += 4) {
      const rayAngle = player.angle - fov / 2 + (i / rays) * fov;
      const dist = castRay(rayAngle);

      const corrected = dist * Math.cos(rayAngle - player.angle);
      const wallHeight = (tileSize * 300) / (corrected + 0.0001);

      ctx.fillStyle = `rgb(${255 - corrected * 0.6},${200 - corrected * 0.4},${100})`;
      ctx.fillRect(i, H / 2 - wallHeight / 2, 4, wallHeight);
    }

    // enemies
    for (let e of enemies) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const angle = Math.atan2(dy, dx) - player.angle;
      const size = 200 / dist;

      const sx = W / 2 + Math.tan(angle) * W;

      ctx.fillStyle = 'red';
      ctx.fillRect(sx, H / 2 - size / 2, size, size);
    }

    // HUD
    ctx.fillStyle = 'white';
    ctx.fillText("HP: " + Math.floor(player.hp), 20, 20);
    ctx.fillText("ENEMIES: " + enemies.length, 20, 40);
  }

  // ===== LOOP =====
  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  loop();

  // ==================================================
  // 🟦 CAMADA DE MELHORIAS - FPS ENHANCEMENT LAYER
  // NÃO ALTERA NENHUMA LINHA DO CÓDIGO ACIMA
  // ==================================================
  const FEL_CONFIG = {
    GRAPHICS: {
      ENABLE_VIGNETTE: true,
      ENABLE_COLOR_ENHANCE: true,
      ENABLE_BLOOM: true,
      VIGNETTE_INTENSITY: 0.4,
      SATURATION: 1.2,
      CONTRAST: 1.15,
      BRIGHTNESS: 1.08,
      BLOOM_INTENSITY: 0.2
    },
    CONTROLS: {
      ENABLE_MOUSE_SMOOTH: true,
      MOUSE_SMOOTH_AMOUNT: 0.85,
      SENSITIVITY_MULT: 1.1
    },
    GAMEPLAY_FEEL: {
      ENABLE_RECOIL_VISUAL: true,
      ENABLE_HEADBOB: true,
      HEADBOB_INTENSITY: 0.006,
      ENABLE_FOV_DYNAMIC: true,
      FOV_SPRINT_MULT: 1.07,
      ENABLE_SCREEN_SHAKE: true,
      HIT_EFFECT_INTENSITY: 0.15
    },
    HUD: {
      ENABLE_UPGRADES: true,
      ANIMATION_SPEED: 0.2
    }
  };

  let gameCanvas = canvas;
  let overlayCanvas, overlayCtx;
  let smoothMousePos = { x: 0, y: 0 };
  let cameraState = { offsetX: 0, offsetY: 0, fovOffset: 0 };
  let playerState = { isMoving: false, isSprinting: false, isShooting: false };
  let effectsState = { shakeIntensity: 0, hitFlash: 0, bloomValue: 0 };
  let lastFrameTime = performance.now();

  // Cria camada de sobreposição
  function initEnhancementLayer() {
    createOverlayCanvas();
    interceptInputEvents();
    startEffectsLoop();
    enhanceHUD();
    console.log('✅ Camada de melhorias carregada com sucesso');
  }

  // Cria canvas para efeitos visuais
  function createOverlayCanvas() {
    overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = W;
    overlayCanvas.height = H;
    overlayCanvas.style.position = 'absolute';
    overlayCanvas.style.top = '0';
    overlayCanvas.style.left = '0';
    overlayCanvas.style.pointerEvents = 'none';
    overlayCanvas.style.zIndex = '10';
    document.body.appendChild(overlayCanvas);
    overlayCtx = overlayCanvas.getContext('2d');

    window.addEventListener('resize', () => {
      overlayCanvas.width = W;
      overlayCanvas.height = H;
    });
  }

  // Intercepta e melhora controles
  function interceptInputEvents() {
    // Suavização do mouse
    document.addEventListener('mousemove', (e) => {
      if (!FEL_CONFIG.CONTROLS.ENABLE_MOUSE_SMOOTH) return;
      
      const rawX = e.movementX;
      const rawY = e.movementY;

      smoothMousePos.x = smoothMousePos.x * FEL_CONFIG.CONTROLS.MOUSE_SMOOTH_AMOUNT + rawX * (1 - FEL_CONFIG.CONTROLS.MOUSE_SMOOTH_AMOUNT);
      smoothMousePos.y = smoothMousePos.y * FEL_CONFIG.CONTROLS.MOUSE_SMOOTH_AMOUNT + rawY * (1 - FEL_CONFIG.CONTROLS.MOUSE_SMOOTH_AMOUNT);

      Object.defineProperty(e, 'movementX', { value: smoothMousePos.x * FEL_CONFIG.CONTROLS.SENSITIVITY_MULT });
      Object.defineProperty(e, 'movementY', { value: smoothMousePos.y * FEL_CONFIG.CONTROLS.SENSITIVITY_MULT });
    }, { capture: true });

    // Detecta estado do jogador
    document.addEventListener('keydown', (e) => {
      if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) playerState.isMoving = true;
      if (e.key === 'Shift') {
        playerState.isSprinting = true;
        player.speed = 3.2;
      }
    }, { capture: true });

    document.addEventListener('keyup', (e) => {
      if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) playerState.isMoving = false;
      if (e.key === 'Shift') {
        playerState.isSprinting = false;
        player.speed = 2.2;
      }
    }, { capture: true });

    // Detecta disparos
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        playerState.isShooting = true;
        triggerRecoilEffect();
        setTimeout(() => playerState.isShooting = false, 120);
      }
    }, { capture: true });
  }

  // Efeito de recuo visual
  function triggerRecoilEffect() {
    if (!FEL_CONFIG.GAMEPLAY_FEEL.ENABLE_RECOIL_VISUAL) return;
    cameraState.offsetY = -0.02;
    effectsState.shakeIntensity = 0.3;
    effectsState.bloomValue = 1;
  }

  // Atualiza sensação da câmera
  function updateCameraFeel(deltaTime) {
    if (!FEL_CONFIG.GAMEPLAY_FEEL.ENABLE_HEADBOB && !FEL_CONFIG.GAMEPLAY_FEEL.ENABLE_FOV_DYNAMIC) return;

    // Movimento natural da cabeça
    if (playerState.isMoving) {
      const speedMult = playerState.isSprinting ? 1.8 : 1;
      const time = performance.now() / 200;
      cameraState.offsetX = Math.sin(time) * FEL_CONFIG.GAMEPLAY_FEEL.HEADBOB_INTENSITY * speedMult;
      cameraState.offsetY = Math.abs(Math.cos(time * 2)) * FEL_CONFIG.GAMEPLAY_FEEL.HEADBOB_INTENSITY * 0.5 * speedMult;
    } else {
      cameraState.offsetX *= 0.9;
      cameraState.offsetY *= 0.9;
    }

    // Ajuste dinâmico de FOV
    if (FEL_CONFIG.GAMEPLAY_FEEL.ENABLE_FOV_DYNAMIC) {
      const targetFOV = playerState.isSprinting ? FEL_CONFIG.GAMEPLAY_FEEL.FOV_SPRINT_MULT : 1;
      cameraState.fovOffset += (targetFOV - cameraState.fovOffset) * 0.05;
      gameCanvas.style.transform = `scale(${1 + (cameraState.fovOffset - 1) * 0.02})`;
      gameCanvas.style.transformOrigin = 'center center';
    }

    // Efeito de tremor de tela
    if (FEL_CONFIG.GAMEPLAY_FEEL.ENABLE_SCREEN_SHAKE && effectsState.shakeIntensity > 0) {
      cameraState.offsetX += (Math.random() - 0.5) * effectsState.shakeIntensity;
      cameraState.offsetY += (Math.random() - 0.5) * effectsState.shakeIntensity;
      effectsState.shakeIntensity *= 0.9;
    }

    // Aplica deslocamento
    gameCanvas.style.transform += ` translate(${cameraState.offsetX * 100}px, ${cameraState.offsetY * 100}px)`;
  }

  // Renderiza efeitos visuais
  function renderEnhancements() {
    overlayCtx.clearRect(0, 0, W, H);
    
    // Vinheta
    if (FEL_CONFIG.GRAPHICS.ENABLE_VIGNETTE) {
      const gradient = overlayCtx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H)/1.5);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, `rgba(0,0,0,${FEL_CONFIG.GRAPHICS.VIGNETTE_INTENSITY})`);
      overlayCtx.fillStyle = gradient;
      overlayCtx.fillRect(0, 0, W, H);
    }

    // Efeito de brilho ao atirar
    if (FEL_CONFIG.GRAPHICS.ENABLE_BLOOM && effectsState.bloomValue > 0) {
      overlayCtx.fillStyle = `rgba(255,255,200,${0.1 * effectsState.bloomValue})`;
      overlayCtx.fillRect(0, 0, W, H);
      effectsState.bloomValue *= 0.9;
    }

    // Efeito de dano
    if (player.hp < 30) {
      overlayCtx.fillStyle = `
