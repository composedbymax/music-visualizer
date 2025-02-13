class QuantumVisualizer {
    constructor() {
        this.canvas = document.getElementById('glCanvas');
        this.gl = this.canvas.getContext('webgl2');
        this.micButton = document.getElementById('micButton');
        this.modeButton = document.getElementById('modeButton');
        this.fullscreenButton = document.getElementById('fullscreenButton');
        this.colorPicker = document.getElementById('colorPicker');
        this.zoomSlider = document.getElementById('zoomSlider');
        this.frequencySlider = document.getElementById('frequencySlider');
        this.fpsCounter = document.getElementById('fpsCounter');
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.currentMode = 0;
        this.modes = [
            'SPIRALWAVE',
            'QUANTUMPULSE',
            'FRACTALFLOW',
            'DATASTORM',
            'NEURALPULSE'
        ];
        this.isFullscreen = false;
        this.customColor = [1.0, 1.0, 1.0];
        this.zoomLevel = 1.0;
        this.animationSpeed = 1.0;
        this.waveFrequency = 15.0;
        this.initializeCanvas();
        this.setupEventListeners();
        this.setupWebGL();
    }
    initializeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    setupEventListeners() {
        this.micButton.addEventListener('click', () => this.toggleMicrophone());
        this.modeButton.addEventListener('click', () => this.changeVisualizationMode());
        this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('resize', () => this.resize());
        this.colorPicker.addEventListener('input', (e) => this.updateCustomColor(e.target.value));
        this.zoomSlider.addEventListener('input', (e) => this.zoomLevel = parseFloat(e.target.value));
        this.frequencySlider.addEventListener('input', (e) => this.waveFrequency = parseFloat(e.target.value));
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prevMode();
            } else if (e.key === 'ArrowRight') {
                this.nextMode();
            }
        });
    }
    prevMode() {
        this.currentMode = (this.currentMode + 1 + this.modes.length) % this.modes.length;
        this.changeVisualizationMode();
    }
    nextMode() {
        this.currentMode = (this.currentMode + 1) % this.modes.length;
        this.changeVisualizationMode();
    }
    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }
    enterFullscreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        this.isFullscreen = true;
        this.fullscreenButton.textContent = 'Exit Fullscreen';
        this.resize();
    }
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        this.isFullscreen = false;
        this.fullscreenButton.textContent = 'Enter Fullscreen';
        this.resize();
    }
    resize() {
        if (this.isFullscreen) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.createFullScreenWaveBuffer();
    }
    updateCustomColor(hexColor) {
        const r = parseInt(hexColor.slice(1, 3), 16) / 255;
        const g = parseInt(hexColor.slice(3, 5), 16) / 255;
        const b = parseInt(hexColor.slice(5, 7), 16) / 255;
        this.customColor = [r, g, b];
    }
    setupWebGL() {
        if (!this.gl) {
            console.error('WebGL2 not supported');
            return;
        }
        this.shaderPrograms = {
            'SPIRALWAVE': this.createSpiralWaveShaders(),
            'QUANTUMPULSE': this.createQuantumPulseShaders(),
            'FRACTALFLOW': this.createFractalFlowShaders(),
            'DATASTORM': this.createDataStormShaders(),
            'NEURALPULSE': this.createNeuralPulseShaders()
        };
        this.currentProgram = this.shaderPrograms['SPIRALWAVE'];
    }
    createSpiralWaveShaders() {
        const vertexShaderSource = `#version 300 es
            in vec2 a_position;
            uniform vec2 u_resolution;
            uniform float u_audioLevel;
            uniform float u_time;
            uniform float u_zoom;
            uniform float u_frequency;
            out vec2 v_position;
            void main() {
                vec2 zeroToOne = a_position / u_resolution;
                vec2 clipSpace = zeroToOne * 2.0 - 1.0;
                float angle = atan(clipSpace.y, clipSpace.x);
                float radius = length(clipSpace);
                float spiralWave = sin(angle * u_frequency + u_time * 2.0) * u_audioLevel;
                clipSpace += vec2(spiralWave * cos(angle), spiralWave * sin(angle)) * u_zoom;
                gl_Position = vec4(clipSpace, 0.0, 0.8);
                v_position = a_position;
            }
        `;
        const fragmentShaderSource = `#version 300 es
            precision highp float;
            in vec2 v_position;
            uniform float u_audioLevel;
            uniform vec3 u_customColor;
            out vec4 outColor;

            void main() {
                vec3 color = u_customColor * vec3(
                    0.5 + 0.5 * sin(v_position.x * 10.0 + u_audioLevel),
                    0.5 + 0.5 * cos(v_position.y * 10.0 + u_audioLevel),
                    0.5 + 0.5 * sin(u_audioLevel * 5.0)
                );
                outColor = vec4(color, 0.8);
            }
        `;
        return this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    }
    createQuantumPulseShaders() {
        const vertexShaderSource = `#version 300 es
            in vec2 a_position;
            uniform vec2 u_resolution;
            uniform float u_audioLevel;
            uniform float u_time;
            uniform float u_zoom;
            uniform float u_frequency;
            out vec2 v_position;
            void main() {
                vec2 zeroToOne = a_position / u_resolution;
                vec2 clipSpace = zeroToOne * 2.0 - 1.0;
                float quantumPulse = sin(length(clipSpace) * u_frequency - u_time * 3.0);
                clipSpace *= 1.0 + quantumPulse * u_audioLevel * u_zoom * 0.5;
                gl_Position = vec4(clipSpace, 0.0, 0.8);
                v_position = a_position;
            }
        `;
        const fragmentShaderSource = `#version 300 es
            precision highp float;
            in vec2 v_position;
            uniform float u_audioLevel;
            uniform vec3 u_customColor;
            out vec4 outColor;
            void main() {
                vec3 color = u_customColor * vec3(
                    abs(sin(v_position.x * 0.02 + u_audioLevel * 4.0)),
                    abs(cos(v_position.y * 0.02 + u_audioLevel * 6.0)),
                    1.0 - u_audioLevel * 0.8
                );
                outColor = vec4(color, 0.9);
            }
        `;
        return this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    }
    createFractalFlowShaders() {
        const vertexShaderSource = `#version 300 es
            in vec2 a_position;
            uniform vec2 u_resolution;
            uniform float u_audioLevel;
            uniform float u_time;
            uniform float u_zoom;
            uniform float u_frequency;
            out vec2 v_position;
            float mandelbrot(vec2 c) {
                vec2 z = vec2(0.0, 0.0);
                for (int i = 0; i < 50; i++) {
                    z = vec2(z.x * z.x - z.y * z.y, 9.0 * z.x * z.y) + c;
                    if (length(z) > 2.0) return float(i) / 5.0;
                }
                return 0.0;
            }
            void main() {
                vec2 zeroToOne = a_position / u_resolution;
                vec2 clipSpace = zeroToOne * 2.0 - 1.0;
                vec2 c = clipSpace * (1.0 + u_audioLevel * 0.5) / u_zoom;
                float fractalValue = mandelbrot(c);
                clipSpace *= 1.0 + fractalValue * u_audioLevel * u_frequency;
                gl_Position = vec4(clipSpace, 0.0, 0.9);
                v_position = a_position;
            }
        `;

        const fragmentShaderSource = `#version 300 es
            precision highp float;
            in vec2 v_position;
            uniform float u_audioLevel;
            uniform vec3 u_customColor;
            out vec4 outColor;
            void main() {
                vec3 color = u_customColor * vec3(
                    abs(sin(v_position.x * 0.01 + u_audioLevel)),
                    abs(cos(v_position.y * 0.01 + u_audioLevel)),
                    abs(sin(u_audioLevel * 5.0))
                );
                outColor = vec4(color, 0.8);
            }
        `;
        return this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    }
    createDataStormShaders() {
        const vertexShaderSource = `#version 300 es
            in vec2 a_position;
            uniform vec2 u_resolution;
            uniform float u_audioLevel;
            uniform float u_time;
            uniform float u_zoom;
            uniform float u_frequency;
            out vec2 v_position;
            float hash(vec2 p) {
                p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
                return -1.0 + 2.0 * fract(p.x * p.y * (p.x + p.y));
            }
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash(i + vec2(0.0, 0.0)), 
                            hash(i + vec2(1.0, 0.0)), u.x),
                        mix(hash(i + vec2(0.0, 1.0)), 
                            hash(i + vec2(1.0, 1.0)), u.x), u.y);
            }

            void main() {
                vec2 zeroToOne = a_position / u_resolution;
                vec2 clipSpace = zeroToOne * 2.0 - 1.0;
                float noiseScale = 5.0 + u_audioLevel * 10.0;
                float timeFlow = u_time * 0.2;
                vec2 noiseOffset = vec2(
                    noise(clipSpace * noiseScale + timeFlow),
                    noise(clipSpace * noiseScale - timeFlow)
                );
                clipSpace += noiseOffset * u_zoom;
                gl_Position = vec4(clipSpace, 0.0, 1.0);
                gl_PointSize = 2.0 + u_audioLevel * 5.0;
                v_position = clipSpace;
            }
        `;

        const fragmentShaderSource = `#version 300 es
            precision highp float;
            in vec2 v_position;
            uniform float u_audioLevel;
            uniform vec3 u_customColor;
            out vec4 outColor;
            vec3 dataColor(float t) {
                return u_customColor * vec3(
                    0.5 + 0.5 * sin(t * 3.0),
                    0.5 + 0.5 * sin(t * 4.5 + 2.0),
                    0.5 + 0.5 * cos(t * 2.5 + 1.0)
                );
            }
            void main() {
                float distortion = length(v_position);
                vec3 color = dataColor(u_audioLevel * 5.0 + distortion);
                float gridEffect = abs(sin(v_position.x * 30.0) * cos(v_position.y * 30.0));
                color *= 1.0 + gridEffect * 0.3;
                outColor = vec4(color, 0.8);
            }
        `;
        return this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    }
    createNeuralPulseShaders() {
        const vertexShaderSource = `#version 300 es
            in vec2 a_position;
            uniform vec2 u_resolution;
            uniform float u_audioLevel;
            uniform float u_time;
            uniform float u_zoom;
            uniform float u_frequency;
            out vec2 v_position;
            float neuralConnection(vec2 pos) {
                float connectionStrength = length(pos);
                return sin(connectionStrength * u_frequency + u_time * 2.0) * u_audioLevel;
            }
            void main() {
                vec2 zeroToOne = a_position / u_resolution;
                vec2 clipSpace = zeroToOne * 2.0 - 1.0;
                float pulse = neuralConnection(clipSpace);
                clipSpace *= 1.0 + pulse * u_zoom;
                gl_Position = vec4(clipSpace, 0.0, 0.9);
                gl_PointSize = 3.0 + u_audioLevel * 6.0;
                v_position = clipSpace;
            }
        `;
        const fragmentShaderSource = `#version 300 es
            precision highp float;
            in vec2 v_position;
            uniform float u_audioLevel;
            uniform float u_time;
            uniform vec3 u_customColor;
            out vec4 outColor;
            vec3 neuronColor(float t) {
                return u_customColor * vec3(
                    0.7 + 0.3 * sin(t * 4.0),
                    0.4 + 0.6 * cos(t * 3.0),
                    0.5 + 0.5 * sin(t * 2.5)
                );
            }
            void main() {
                float synapsePattern = abs(sin(v_position.x * 30.0) * cos(v_position.y * 30.0));
                vec3 color = neuronColor(u_audioLevel * 8.0);
                color *= 1.0 + synapsePattern * 0.4;
                float neuralDensity = 1.0 - length(v_position);
                outColor = vec4(color, 0.9 * neuralDensity);
            }
        `;
        return this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    }
    createShaderProgram(vertexShaderSource, fragmentShaderSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program link error', this.gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    createFullScreenWaveBuffer() {
        const numBands = 100;
        const positions = [];
        const step = 10;
        for (let x = 0; x <= this.canvas.width; x += step) {
            for (let y = 0; y <= this.canvas.height; y += step) {
                positions.push(x, y);
            }
        }
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        this.waveformVertexCount = positions.length / 2;
    }
    async toggleMicrophone() {
        if (!this.audioContext) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                this.microphone = this.audioContext.createMediaStreamSource(stream);
                this.analyser.fftSize = 1024;
                this.microphone.connect(this.analyser);
                this.createFullScreenWaveBuffer();
                this.startAnimation();
                this.micButton.textContent = 'Disable Microphone';
                this.micButton.style.backgroundColor = '#F44336';
            } catch (err) {
                console.error('Microphone access denied', err);
                alert('Microphone access is required for visualization');
            }
        } else {
            this.stopAudio();
            this.micButton.textContent = 'Enable Microphone';
            this.micButton.style.backgroundColor = '#70ff4d';
        }
    }
    changeVisualizationMode() {
        this.currentMode = (this.currentMode + 1) % this.modes.length;
        const newMode = this.modes[this.currentMode];
        this.currentProgram = this.shaderPrograms[newMode];
        this.modeButton.textContent = `Mode: ${newMode}`;
    }
    stopAudio() {
        if (this.microphone) this.microphone.disconnect();
        if (this.audioContext) this.audioContext.close();
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
    }
    startAnimation() {
        let frameCount = 0;
        let lastTime = performance.now();
        const animate = (currentTime) => {
            frameCount++;
            const deltaTime = currentTime - lastTime;
            if (deltaTime >= 1000) {
                this.fpsCounter.textContent = `FPS: ${frameCount}`;
                frameCount = 0;
                lastTime = currentTime;
            }
            this.gl.clearColor(0, 0, 0, 1);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.useProgram(this.currentProgram);
            let audioLevel = 0;
            if (this.analyser) {
                const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                this.analyser.getByteFrequencyData(dataArray);
                audioLevel = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
            }
            const resolutionLocation = this.gl.getUniformLocation(this.currentProgram, 'u_resolution');
            const timeLoc = this.gl.getUniformLocation(this.currentProgram, 'u_time');
            const audioLevelLoc = this.gl.getUniformLocation(this.currentProgram, 'u_audioLevel');
            const zoomLoc = this.gl.getUniformLocation(this.currentProgram, 'u_zoom');
            const frequencyLoc = this.gl.getUniformLocation(this.currentProgram, 'u_frequency');
            const customColorLoc = this.gl.getUniformLocation(this.currentProgram, 'u_customColor');
            this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
            this.gl.uniform1f(timeLoc, currentTime / 1000);
            this.gl.uniform1f(audioLevelLoc, audioLevel);
            this.gl.uniform1f(zoomLoc, this.zoomLevel);
            this.gl.uniform1f(frequencyLoc, this.waveFrequency);
            this.gl.uniform3fv(customColorLoc, this.customColor);
            const positionAttributeLocation = this.gl.getAttribLocation(this.currentProgram, 'a_position');
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
            this.gl.enableVertexAttribArray(positionAttributeLocation);
            this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
            switch (this.modes[this.currentMode]) {
                case 'SPIRALWAVE':
                    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.waveformVertexCount);
                    break;
                case 'QUANTUMPULSE':
                    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.waveformVertexCount);
                    break;
                case 'FRACTALFLOW':
                    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.waveformVertexCount);
                    break;
                case 'DATASTORM':
                    this.gl.drawArrays(this.gl.POINTS, 0, this.waveformVertexCount);
                    break;
                case 'NEURALPULSE':
                    this.gl.drawArrays(this.gl.POINTS, 0, this.waveformVertexCount);
                    break;
            }
            if (this.analyser) {
                requestAnimationFrame(animate);
            }
        };
        if (this.analyser) {
            requestAnimationFrame(animate);
        }
    }
}
const visualizer = new QuantumVisualizer();