// ==================================================
// 🎮 FPS 3D BATTLE ROYALE - ESTILO FREE FIRE
// Motor 3D próprio - WebGL leve
// Desempenho otimizado para celulares e PCs fracos
// Tudo contido em um único arquivo
// ==================================================

(() => {
    'use strict';

    // --------------------------
    // CONFIGURAÇÕES GERAIS DO JOGO
    // --------------------------
    const CONFIG = {
        RENDER_DISTANCE: 120,
        LOD_THRESHOLDS: [40, 80, 120],
        MAX_ENTITIES: 64,
        TICK_RATE: 60,
        ZONE_SHRINK_TIME: 30000,
        ZONE_DAMAGE_RATE: 5,
        DEFAULT_SENSITIVITY: 0.002,
        TEXTURE_SIZE: 256,
        SHADOW_SIZE: 32
    };

    // --------------------------
    // MOTOR 3D WEBGL OTIMIZADO
    // --------------------------
    class Engine3D {
        constructor(canvas) {
            this.canvas = canvas;
            this.gl = canvas.getContext('webgl', { antialias: false, depth: true });
            if (!this.gl) alert('Seu navegador não suporta WebGL');
            
            this.programs = {};
            this.buffers = {};
            this.textures = {};
            this.meshes = new Map();
            
            this.viewMatrix = new Float32Array(16);
            this.projMatrix = new Float32Array(16);
            this.camera = { x: 0, y: 1.8, z: 0, rotX: 0, rotY: 0 };
            
            this.initGL();
            this.initShaders();
            this.createBaseMeshes();
            this.generateBaseTextures();
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }

        initGL() {
            const gl = this.gl;
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);
            gl.clearColor(0.529, 0.808, 0.922, 1.0);
        }

        initShaders() {
            const gl = this.gl;
            
            const vsBasic = `
                attribute vec3 aPos;
                attribute vec2 aTexCoord;
                attribute vec3 aNormal;
                uniform mat4 uView;
                uniform mat4 uProj;
                uniform vec3 uColor;
                uniform float uDistance;
                varying vec2 vTexCoord;
                varying vec3 vColor;
                varying float vFog;
                void main() {
                    gl_Position = uProj * uView * vec4(aPos, 1.0);
                    vTexCoord = aTexCoord;
                    float dist = length(aPos);
                    vFog = clamp(dist / ${CONFIG.RENDER_DISTANCE}.0, 0.0, 1.0);
                    vColor = uColor * (0.6 + dot(normalize(aNormal), normalize(vec3(0.5, 0.8, 0.3))) * 0.4);
                }
            `;

            const fsBasic = `
                precision mediump float;
                uniform sampler2D uTex;
                uniform bool uUseTex;
                uniform vec3 uTint;
                varying vec2 vTexCoord;
                varying vec3 vColor;
                varying float vFog;
                void main() {
                    vec4 base = uUseTex ? texture2D(uTex, vTexCoord) : vec4(vColor, 1.0);
                    vec3 fogColor = vec3(0.529, 0.808, 0.922);
                    vec3 finalColor = mix(base.rgb * uTint, fogColor, vFog * 0.7);
                    gl_FragColor = vec4(finalColor, base.a);
                }
            `;

            const createShader = (src, type) => {
                const s = gl.createShader(type);
                gl.shaderSource(s, src);
                gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
                return s;
            };

            const createProgram = (vs, fs) => {
                const p = gl.createProgram();
                gl.attachShader(p, createShader(vs, gl.VERTEX_SHADER));
                gl.attachShader(p, createShader(fs, gl.FRAGMENT_SHADER));
                gl.linkProgram(p);
                gl.useProgram(p);
                p.loc = {
                    aPos: gl.getAttribLocation(p, 'aPos'),
                    aTexCoord: gl.getAttribLocation(p, 'aTexCoord'),
                    aNormal: gl.getAttribLocation(p, 'aNormal'),
                    uView: gl.getUniformLocation(p, 'uView'),
                    uProj: gl.getUniformLocation(p, 'uProj'),
                    uTex: gl.getUniformLocation(p, 'uTex'),
                    uUseTex: gl.getUniformLocation(p, 'uUseTex'),
                    uTint: gl.getUniformLocation(p, 'uTint')
                };
                return p;
            };

            this.programs.basic = createProgram(vsBasic, fsBasic);
        }

        createBuffer(data, type = this.gl.ARRAY_BUFFER) {
            const b = this.gl.createBuffer();
            this.gl.bindBuffer(type, b);
            this.gl.bufferData(type, data, this.gl.STATIC_DRAW);
            return b;
        }

        createBaseMeshes() {
            // Cubo básico
            const cubeVerts = new Float32Array([
                -0.5,-0.5,-0.5, 0,0,-1, 0,0,  0.5,-0.5,-0.5, 0,0,-1, 1,0,  0.5,0.5,-0.5, 0,0,-1, 1,1,  -0.5,0.5,-0.5, 0,0,-1, 0,1,
                -0.5,-0.5,0.5, 0,0,1, 0,0,   0.5,-0.5,0.5, 0,0,1, 1,0,   0.5,0.5,0.5, 0,0,1, 1,1,   -0.5,0.5,0.5, 0,0,1, 0,1,
                -0.5,-0.5,-0.5, -1,0,0, 0,0, -0.5,-0.5,0.5, -1,0,0, 1,0, -0.5,0.5,0.5, -1,0,0, 1,1, -0.5,0.5,-0.5, -1,0,0, 0,1,
                0.5,-0.5,-0.5, 1,0,0, 0,0,   0.5,-0.5,0.5, 1,0,0, 1,0,   0.5,0.5,0.5, 1,0,0, 1,1,   0.5,0.5,-0.5, 1,0,0, 0,1,
                -0.5,-0.5,-0.5, 0,-1,0, 0,0, 0.5,-0.5,-0.5, 0,-1,0, 1,0, 0.5,-0.5,0.5, 0,-1,0, 1,1, -0.5,-0.5,0.5, 0,-1,0, 0,1,
                -0.5,0.5,-0.5, 0,1,0, 0,0,   0.5,0.5,-0.5, 0,1,0, 1,0,   0.5,0.5,0.5, 0,1,0, 1,1,   -0.5,0.5,0.5, 0,1,0, 0,1
            ]);
            const cubeIndices = new Uint16Array([
                0,1,2, 0,2,3, 4,5,6, 4,6,7, 8,9,10, 8,10,11, 12,13,14, 12,14,15, 16,17,18, 16,18,19, 20,21,22, 20,22,23
            ]);
            
            this.meshes.set('cube', {
                vbo: this.createBuffer(cubeVerts),
                ibo: this.createBuffer(cubeIndices, this.gl.ELEMENT_ARRAY_BUFFER),
                indexCount: cubeIndices.length,
                stride: 8 * Float32Array.BYTES_PER_ELEMENT
            });

            // Plano para chão
            const planeVerts = new Float32Array([
                -500,0,-500, 0,1,0, 0,0,  500,0,-500, 0,1,0, 100,0,  500,0,500, 0,1,0, 100,100,  -500,0,500, 0,1,0, 0,100
            ]);
            const planeIndices = new Uint16Array([0,1,2, 0,2,3]);
            
            this.meshes.set('plane', {
                vbo: this.createBuffer(planeVerts),
                ibo: this.createBuffer(planeIndices, this.gl.ELEMENT_ARRAY_BUFFER),
                indexCount: planeIndices.length,
                stride: 8 * Float32Array.BYTES_PER_ELEMENT
            });
        }

        generateBaseTextures() {
            const createTex = (w, h, fill) => {
                const c = document.createElement('canvas');
                c.width = w; c.height = h;
                const ctx = c.getContext('2d');
                ctx.fillStyle = fill;
                ctx.fillRect(0,0,w,h);
                const tex = this.gl.createTexture();
                this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, c);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
                return tex;
            };

            this.textures.grass = createTex(CONFIG.TEXTURE_SIZE, CONFIG.TEXTURE_SIZE, '#4CAF50');
            this.textures.wall = createTex(CONFIG.TEXTURE_SIZE, CONFIG.TEXTURE_SIZE, '#8B4513');
            this.textures.wood = createTex(CONFIG.TEXTURE_SIZE, CONFIG.TEXTURE_SIZE, '#5D4037');
            this.textures.player = createTex(CONFIG.TEXTURE_SIZE, CONFIG.TEXTURE_SIZE, '#2196F3');
            this.textures.enemy = createTex(CONFIG.TEXTURE_SIZE, CONFIG.TEXTURE_SIZE, '#F44336');
            this.textures.weapon = createTex(CONFIG.TEXTURE_SIZE, CONFIG.TEXTURE_SIZE, '#212121');
        }

        resize() {
            const w = this.canvas.clientWidth;
            const h = this.canvas.clientHeight;
            this.canvas.width = w;
            this.canvas.height = h;
            this.gl.viewport(0, 0, w, h);
            this.perspective(70, w/h, 0.1, CONFIG.RENDER_DISTANCE);
        }

        perspective(fov, aspect, near, far) {
            const f = 1.0 / Math.tan(fov * Math.PI / 360);
            this.projMatrix.set([
                f/aspect, 0, 0, 0,
                0, f, 0, 0,
                0, 0, (near+far)/(near-far), -1,
                0, 0, (2*near*far)/(near-far), 0
            ]);
        }

        updateCamera() {
            const cx = this.camera.x, cy = this.camera.y, cz = this.camera.z;
            const rx = this.camera.rotX, ry = this.camera.rotY;
            
            const cosRy = Math.cos(ry), sinRy = Math.sin(ry);
            const cosRx = Math.cos(rx), sinRx = Math.sin(rx);

            this.viewMatrix.set([
                cosRy, 0, -sinRy, 0,
                sinRx*sinRy, cosRx, sinRx*cosRy, 0,
                cosRx*sinRy, -sinRx, cosRx*cosRy, 0,
                -cx*cosRy + cz*sinRy, -cy, cx*sinRx*sinRy - cy*cosRx - cz*sinRx*cosRy, 1
            ]);
        }

        drawMesh(meshName, x, y, z, scale = 1, rot = 0, tint = [1,1,1], texture = null) {
            const gl = this.gl;
            const mesh = this.meshes.get(meshName);
            if (!mesh) return;

            // Culling básico
            const dist = Math.hypot(x - this.camera.x, z - this.camera.z);
            if (dist > CONFIG.RENDER_DISTANCE) return;

            // LOD automático
            let finalScale = scale;
            if (dist > CONFIG.LOD_THRESHOLDS[1]) finalScale *= 0.7;
            else if (dist > CONFIG.LOD_THRESHOLDS[0]) finalScale *= 0.85;

            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);

            gl.vertexAttribPointer(this.programs.basic.loc.aPos, 3, gl.FLOAT, false, mesh.stride, 0);
            gl.vertexAttribPointer(this.programs.basic.loc.aNormal, 3, gl.FLOAT, false, mesh.stride, 3 * Float32Array.BYTES_PER_ELEMENT);
            gl.vertexAttribPointer(this.programs.basic.loc.aTexCoord, 2, gl.FLOAT, false, mesh.stride, 6 * Float32Array.BYTES_PER_ELEMENT);
            
            gl.enableVertexAttribArray(this.programs.basic.loc.aPos);
            gl.enableVertexAttribArray(this.programs.basic.loc.aNormal);
            gl.enableVertexAttribArray(this.programs.basic.loc.aTexCoord);

            gl.useProgram(this.programs.basic);
            gl.uniformMatrix4fv(this.programs.basic.loc.uView, false, this.viewMatrix);
            gl.uniformMatrix4fv(this.programs.basic.loc.uProj, false, this.projMatrix);
            gl.uniform3fv(this.programs.basic.loc.uTint, tint);
            gl.uniform1i(this.programs.basic.loc.uUseTex, texture ? 1 : 0);
            
            if (texture) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.uniform1i(this.programs.basic.loc.uTex, 0);
            }

            // Matriz de modelo simplificada
            const modelMat = new Float32Array([
                finalScale, 0, 0, 0,
                0, finalScale, 0, 0,
                0, 0, finalScale, 0,
                x, y, z, 1
            ]);
            
            gl.uniformMatrix4fv(gl.getUniformLocation(this.programs.basic, 'uModel'), false, modelMat);
            gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);

            // Sombra falsa
            gl.disable(gl.DEPTH_TEST);
            gl.uniform3fv(this.programs.basic.loc.uTint, [0,0,0,0.2]);
            gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
            gl.enable(gl.DEPTH_TEST);
        }

        clear() {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl
