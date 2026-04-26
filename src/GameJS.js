// ==================================================
// 🟦 FPS ENHANCEMENT LAYER (FEL)
// Sistema de melhorias externo - NÃO ALTERA O CÓDIGO BASE
// Compatível com qualquer jogo FPS com estrutura padrão
// ==================================================

(() => {
    'use strict';

    // --------------------------
    // CONFIGURAÇÕES DA CAMADA
    // --------------------------
    const FEL_CONFIG = {
        GRAPHICS: {
            ENABLE_BLOOM: true,
            ENABLE_VIGNETTE: true,
            ENABLE_SHARPEN: true,
            ENABLE_COLOR_ENHANCE: true,
            BLOOM_INTENSITY: 0.25,
            VIGNETTE_INTENSITY: 0.3,
            SHARPEN_AMOUNT: 0.4,
            SATURATION: 1.15,
            CONTRAST: 1.1,
            BRIGHTNESS: 1.05,
            FOG_DYNAMIC: true
        },
        CONTROLS: {
            ENABLE_MOUSE_SMOOTH: true,
            MOUSE_SMOOTH_AMOUNT: 0.85,
            ENABLE_CAMERA_INTERPOLATION: true,
            DEADZONE_MOBILE: 0.05,
            SENSITIVITY_MULT: 1.0
        },
        GAMEPLAY_FEEL: {
            ENABLE_RECOIL_VISUAL: true,
            ENABLE_HEADBOB: true,
            HEADBOB_INTENSITY: 0.008,
            ENABLE_FOV_DYNAMIC: true,
            FOV_SPRINT_MULT: 1.08,
            ENABLE_SCREEN_SHAKE: true,
            HIT_EFFECT_INTENSITY: 0.12
        },
        PERFORMANCE: {
            ENABLE_FRAME_SMOOTHING: true,
            TARGET_FPS: 60,
            EFFECTS_THROTTLE: true
        },
        HUD: {
            ENABLE_UPGRADES: true,
            ANIMATION_SPEED: 0.2
        }
    };

    // --------------------------
    // VARIÁVEIS GLOBAIS DA CAMADA
    // --------------------------
    let gameCanvas, gl, originalRender;
    let lastMousePos = { x: 0, y: 0 };
    let smoothMousePos = { x: 0, y: 0 };
    let cameraState = { baseRotX: 0, baseRotY: 0, offsetX: 0, offsetY: 0, fovOffset: 0 };
    let playerState = { isMoving: false, isSprinting: false, isShooting: false, onCooldown: false };
    let effectsState = { shakeIntensity: 0, bloomValue: 0, hitFlash: 0 };
    let animationFrameId;
    let lastFrameTime = performance.now();
    let deltaTime = 0;

    // --------------------------
    // 1. INICIALIZAÇÃO E INTERCEPTAÇÃO
    // --------------------------
    function initEnhancementLayer() {
        // Captura o canvas do jogo sem modificar sua criação
        gameCanvas = document.querySelector('canvas');
        if (!gameCanvas) return console.error('Canvas do jogo não encontrado');

        // Cria canvas de sobreposição para efeitos visuais
        createOverlayCanvas();

        // Intercepta eventos de entrada sem alterar o tratamento original
        interceptInputEvents();

        // Melhora a renderização sem alterar a lógica do jogo
        enhanceRenderPipeline();

        // Adiciona efeitos visuais e de sensação
        startEffectsLoop();

        // Melhora a interface
        enhanceHUD();

        console.log('✅ FPS Enhancement Layer carregado com sucesso');
    }

    // --------------------------
    // 2. CAMADA GRÁFICA E EFEITOS VISUAIS
    // --------------------------
    function createOverlayCanvas() {
        const overlay = document.createElement('canvas');
        overlay.id = 'fel-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '10';
        document.body.appendChild(overlay);
        
        gl = overlay.getContext('webgl', { premultipliedAlpha: true, preserveDrawingBuffer: true });
        resizeOverlay();
        window.addEventListener('resize', resizeOverlay);

        // Shaders para pós-processamento
        initPostProcessShaders();
    }

    function resizeOverlay() {
        const overlay = document.getElementById('fel-overlay');
        overlay.width = gameCanvas.width;
        overlay.height = gameCanvas.height;
        gl.viewport(0, 0, overlay.width, overlay.height);
    }

    function initPostProcessShaders() {
        const vs = `
            attribute vec2 aPosition;
            attribute vec2 aTexCoord;
            varying vec2 vTexCoord;
            void main() {
                gl_Position = vec4(aPosition, 0.0, 1.0);
                vTexCoord = aTexCoord;
            }
        `;

        const fs = `
            precision mediump float;
            varying vec2 vTexCoord;
            uniform sampler2D uScene;
            uniform vec2 uResolution;
            uniform float uTime;
            uniform vec4 uEffects; // x=bloom, y=vignette, z=sharpen, w=hitflash
            uniform vec3 uColorAdj; // x=saturação, y=contraste, z=brilho

            void main() {
                vec2 uv = vTexCoord;
                vec4 color = texture2D(uScene, uv);

                // Ajuste de cor
                color.rgb = ((color.rgb - 0.5) * uColorAdj.y + 0.5) * uColorAdj.z;
                float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                color.rgb = mix(vec3(luma), color.rgb, uColorAdj.x);

                // Nitidez
                if (uEffects.z > 0.0) {
                    vec2 px = 1.0 / uResolution;
                    vec3 colTL = texture2D(uScene, uv + vec2(-px.x, -px.y)).rgb;
                    vec3 colTR = texture2D(uScene, uv + vec2(px.x, -px.y)).rgb;
                    vec3 colBL = texture2D(uScene, uv + vec2(-px.x, px.y)).rgb;
                    vec3 colBR = texture2D(uScene, uv + vec2(px.x, px.y)).rgb;
                    color.rgb = color.rgb * (1.0 + 4.0 * uEffects.z) - (colTL + colTR + colBL + colBR) * uEffects.z;
                }

                // Bloom leve
                if (uEffects.x > 0.0) {
                    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
                    vec3 bloomColor = color.rgb * smoothstep(0.6, 1.0, brightness) * uEffects.x;
                    color.rgb += bloomColor;
                }

                // Vinheta
                if (uEffects.y > 0.0) {
                    vec2 center = uv - 0.5;
                    float vignette = 1.0 - dot(center, center) * uEffects.y * 2.0;
                    color.rgb *= clamp(vignette, 0.3, 1.0);
                }

                // Efeito de impacto/flash
                color.rgb = mix(color.rgb, vec3(1.0, 0.9, 0.7), uEffects.w);

                gl_FragColor = color;
            }
        `;

        // Compilação dos shaders
        const createShader = (src, type) => {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
        };

        const program = gl.createProgram();
        gl.attachShader(program, createShader(vs, gl.VERTEX_SHADER));
        gl.attachShader(program, createShader(fs, gl.FRAGMENT_SHADER));
        gl.linkProgram(program);
        gl.useProgram(program);

        // Buffer para tela inteira
        const quadVerts = new Float32Array([-1,-1, 0,0,  1,-1, 1,0,  -1,1, 0,1,  1,1, 1,1]);
        const quadBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

        const aPosLoc = gl.getAttribLocation(program, 'aPosition');
        const aTexLoc = gl.getAttribLocation(program, 'aTexCoord');
        gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 16, 8);
        gl.enableVertexAttribArray(aPosLoc);
        gl.enableVertexAttribArray(aTexLoc);

        // Textura para captura da cena
        const sceneTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, sceneTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Armazena referências para uso posterior
        gl.felProgram = program;
        gl.felSceneTex = sceneTex;
    }

    function renderPostProcess() {
        if (!gl || !gameCanvas) return;

        // Copia o conteúdo do canvas do jogo para a textura da camada
        gl.bindTexture(gl.TEXTURE_2D, gl.felSceneTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gameCanvas);

        // Define valores dos efeitos
        const effects = [
            FEL_CONFIG.GRAPHICS.ENABLE_BLOOM ? FEL_CONFIG.GRAPHICS.BLOOM_INTENSITY * effectsState.bloomValue : 0,
            FEL_CONFIG.GRAPHICS.ENABLE_VIGNETTE ? FEL_CONFIG.GRAPHICS.VIGNETTE_INTENSITY : 0,
            FEL_CONFIG.GRAPHICS.ENABLE_SHARPEN ? FEL_CONFIG.GRAPHICS.SHARPEN_AMOUNT : 0,
            effectsState.hitFlash
        ];

        const colorAdj = [
            FEL_CONFIG.GRAPHICS.SATURATION,
            FEL_CONFIG.GRAPHICS.CONTRAST,
            FEL_CONFIG.GRAPHICS.BRIGHTNESS
        ];

        // Aplica os efeitos
        gl.useProgram(gl.felProgram);
        gl.uniform1i(gl.getUniformLocation(gl.felProgram, 'uScene'), 0);
        gl.uniform2f(gl.getUniformLocation(gl.felProgram, 'uResolution'), gl.canvas.width, gl.canvas.height);
        gl.uniform1f(gl.getUniformLocation(gl.felProgram, 'uTime'), performance.now() / 1000);
        gl.uniform4fv(gl.getUniformLocation(gl.felProgram, 'uEffects'), effects);
        gl.uniform3fv(gl.getUniformLocation(gl.felProgram, 'uColorAdj'), colorAdj);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // --------------------------
    // 3. MELHORIA DE CONTROLES
    // --------------------------
    function interceptInputEvents() {
        // Intercepta movimento do mouse sem alterar o evento original
        document.addEventListener('mousemove', (e) => {
            if (!FEL_CONFIG.CONTROLS.ENABLE_MOUSE_SMOOTH) return;
            
            const rawX = e.movementX;
            const rawY = e.movementY;

            // Suavização de movimento
            smoothMousePos.x = smoothMousePos.x * FEL_CONFIG.CONTROLS.MOUSE_SMOOTH_AMOUNT + rawX * (1 - FEL_CONFIG.CONTROLS.MOUSE_SMOOTH_AMOUNT);
            smoothMousePos.y = smoothMousePos.y * FEL_CONFIG.CONTROLS.MOUSE_SMOOTH_AMOUNT + rawY * (1 - FEL_CONFIG.CONTROLS.MOUSE_SMOOTH_AMOUNT);

            // Substitui os valores de movimento sem alterar a função que os usa
            Object.defineProperty(e, 'movementX', { value: smoothMousePos.x * FEL_CONFIG.CONTROLS.SENSITIVITY_MULT });
            Object.defineProperty(e, 'movementY', { value: smoothMousePos.y * FEL_CONFIG.CONTROLS.SENSITIVITY_MULT });
        }, { capture: true });

        // Intercepta entrada de movimento para detectar estado do jogador
        document.addEventListener('keydown', (e) => {
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) playerState.isMoving = true;
            if (e.code === 'ShiftLeft') playerState.isSprinting = true;
        }, { capture: true });

        document.addEventListener('keyup', (e) => {
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) playerState.isMoving = false;
            if (e.code === 'ShiftLeft') playerState.isSprinting = false;
        }, { capture: true });

        // Intercepta clique de tiro
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0 && !playerState.onCooldown) {
                playerState.isShooting = true;
                triggerRecoilEffect();
                setTimeout(() => playerState.isShooting = false, 100);
            }
        }, { capture: true });
    }

    // --------------------------
    // 4. SISTEMA DE SENSAÇÃO DE JOGO
    // --------------------------
    function updateCameraFeel() {
        if (!FEL_CONFIG.GAMEPLAY_FEEL.ENABLE_HEADBOB && !FEL_CONFIG.GAMEPLAY_FEEL.ENABLE_FOV_DYNAMIC) return;

        // Movimento natural da cabeça ao andar/correr
        if (playerState.isMoving) {
            const speedMult = playerState.isSprinting ? 1.8 : 1.0;
            const time = performance.now() / 200;
            cameraState.offsetX = Math.sin(time) * FEL_CONFIG.GAMEPLAY_FEEL.HEADBOB_INTENSITY * speedMult;
            cameraState.offsetY = Math.abs(Math.cos(time * 2)) * FEL_CONFIG.GAMEPLAY_FEEL.HEADBOB_INTENSITY * 0.5 * speedMult;
        } else {
            cameraState.offsetX *= 0.9;
            cameraState.offsetY *= 0.9;
        }

        // Ajuste dinâmico de FOV
        if (FEL_CONFIG.GAMEPLAY_FEEL.ENABLE_FOV_DYNAMIC) {
            const targetFOV = playerState.isSprinting ? FEL_CONFIG.GAMEPLAY_FEEL.FOV_SPRINT_MULT : 1.0;
            cameraState.fovOffset += (targetFOV - cameraState.fovOffset) * 0.05;
            // Aplica o ajuste via estilo e transformação visual sem alterar o cálculo interno
            gameCanvas.style.transform = `scale(${1 + (cameraState.fovOffset - 1) * 0.02})`;
        }

        // Efeito de tremor de tela
        if (effectsState.shakeIntensity > 0) {
            cameraState.offsetX += (Math.random() - 0.5) * effectsState.shakeIntensity;
            cameraState.offsetY += (Math.random() - 0.5) * effectsState.shakeIntensity;
            effectsState.shakeIntensity *= 0.9;
        }

        // Aplica o deslocamento da câmera visualmente
        gameCanvas.style.transformOrigin = 'center center';
        gameCanvas.style.transform += ` translate(${cameraState.offsetX * 100}px, ${cameraState.offsetY * 100}px)`
