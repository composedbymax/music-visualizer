class AudioVisualizer {
    constructor() {
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('overlay');
        this.overlayCtx = this.overlay.getContext('2d');
        this.audio = null;
        this.isPlaying = false;
        this.isRecording = false;
        this.particles = [];
        this.terrain = [];
        this.audioContext = null;
        this.analyser = null;
        this.gainNode = null;
        this.source = null;
        this.setupEventListeners();
        this.setupCanvas();
        this.initializeParticles();
        this.initializeTerrain();
        this.fpsCounter = new FPSCounter();
        this.mediaRecorder = null;
        this.recordingChunks = [];
        this.smoothedData = new Float32Array(1024);
        this.smoothingFactor = 0.5;
    }
    setupCanvas() {
        const updateCanvasSize = () => {
            const container = document.querySelector('.visualizer-container');
            const width = container.clientWidth;
            const height = container.clientHeight;
            [this.canvas, this.overlay].forEach(canvas => {
                canvas.width = width;
                canvas.height = height;
            });
        };
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
    }
    async cleanupAudio() {
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio.load();
        }
        if (this.source) {
            this.source.disconnect();
        }
        if (this.analyser) {
            this.analyser.disconnect();
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
        }
        if (this.audioContext) {
            await this.audioContext.close();
        }
        this.audio = null;
        this.source = null;
        this.analyser = null;
        this.gainNode = null;
        this.audioContext = null;
    }
    async setupAudio(file) {
        await this.cleanupAudio();
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.gainNode = this.audioContext.createGain();
        this.audio = new Audio();
        const volumeControl = document.getElementById('volumeControl');
        if (volumeControl) {
            this.gainNode.gain.value = volumeControl.value;
        }
        const smoothingControl = document.getElementById('smoothing');
        if (smoothingControl) {
            this.analyser.smoothingTimeConstant = parseFloat(smoothingControl.value);
        }
        this.source = this.audioContext.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
        this.audio.src = URL.createObjectURL(file);
        await this.audio.load();
        this.enablePlayback();
    }
    enablePlayback() {
        document.getElementById('playButton').disabled = false;
        document.getElementById('pauseButton').disabled = true;
        document.getElementById('startRecording').disabled = false;
    }
    initializeParticles() {
        const particleCount = 100;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 5 + 2,
                speedX: Math.random() * 4 - 2,
                speedY: Math.random() * 4 - 2,
                hue: Math.random() * 360
            });
        }
    }
    initializeTerrain() {
        const resolution = 100;
        for (let i = 0; i < resolution; i++) {
            this.terrain[i] = 0;
        }
    }
    draw() {
        if (!this.analyser) return;
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        for (let i = 0; i < bufferLength; i++) {
            this.smoothedData[i] = this.smoothedData[i] * this.smoothingFactor + 
                                dataArray[i] * (1 - this.smoothingFactor);
        }
        this.ctx.fillStyle = document.getElementById('backgroundColor').value + '20';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        const visualizerType = document.getElementById('visualizerType').value;
        switch (visualizerType) {
            case 'spiral':
                this.drawSpiral(dataArray);
                break;
            case 'bars':
                this.drawBars(dataArray);
                break;
            case 'circular':
                this.drawCircular(dataArray);
                break;
            case 'particles':
                this.drawParticles(dataArray);
                break;
            case 'waveform':
                this.drawWaveform(dataArray);
                break;
            case 'spectrum':
                this.draw3DSpectrum(dataArray);
                break;
            case 'kaleidoscope':
                this.drawKaleidoscope(dataArray);
                break;
            case 'terrain':
                this.drawTerrain(dataArray);
                break;
        }
        this.fpsCounter.update();
        if (this.isPlaying) {
            requestAnimationFrame(() => this.draw());
        }
    }
    drawSpiral(dataArray) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.8;
        this.ctx.beginPath();
        this.ctx.strokeStyle = document.getElementById('primaryColor').value;
        this.ctx.lineWidth = 2;
        for (let i = 0; i < dataArray.length; i++) {
            const amplitude = dataArray[i] / 255;
            const angle = (i / dataArray.length) * Math.PI * 20;
            const radius = (angle / (Math.PI * 2)) * maxRadius * amplitude;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();
    }
    drawBars(dataArray) {
        const barWidth = this.canvas.width / dataArray.length;
        const sensitivity = parseFloat(document.getElementById('sensitivity').value);
        for (let i = 0; i < dataArray.length; i++) {
            const percent = (dataArray[i] / 255) * sensitivity;
            const height = this.canvas.height * percent;
            const gradient = this.ctx.createLinearGradient(0, this.canvas.height - height, 0, this.canvas.height);
            gradient.addColorStop(0, document.getElementById('primaryColor').value);
            gradient.addColorStop(1, document.getElementById('secondaryColor').value);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(i * barWidth, this.canvas.height - height, barWidth - 1, height);
        }
    }
    drawCircular(dataArray) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        const sensitivity = parseFloat(document.getElementById('sensitivity').value);
        this.ctx.beginPath();
        for (let i = 0; i < dataArray.length; i++) {
            const amplitude = (dataArray[i] / 255) * sensitivity;
            const angle = (i / dataArray.length) * Math.PI * 2;
            const radiusOffset = radius * amplitude;
            const x = centerX + Math.cos(angle) * (radius + radiusOffset);
            const y = centerY + Math.sin(angle) * (radius + radiusOffset);
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        const gradient = this.ctx.createRadialGradient(centerX, centerY, radius / 2, centerX, centerY, radius * 2);
        gradient.addColorStop(0, document.getElementById('primaryColor').value);
        gradient.addColorStop(1, document.getElementById('secondaryColor').value);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        this.ctx.strokeStyle = document.getElementById('primaryColor').value;
        this.ctx.stroke();
    }
    drawParticles(dataArray) {
        const avgAmplitude = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const sensitivity = parseFloat(document.getElementById('sensitivity').value);
        this.particles.forEach((particle, index) => {
            const frequencyIndex = Math.floor((index / this.particles.length) * dataArray.length);
            const amplitude = dataArray[frequencyIndex] / 255 * sensitivity;
            particle.size = amplitude * 10 + 2;
            particle.x += particle.speedX * amplitude * 2;
            particle.y += particle.speedY * amplitude * 2;
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsl(${particle.hue + avgAmplitude}, 70%, 50%)`;
            this.ctx.fill();
        });
    }
    drawWaveform(dataArray) {
        const waveformData = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteTimeDomainData(waveformData);
        const sensitivity = parseFloat(document.getElementById('sensitivity').value);
        const sliceWidth = this.canvas.width / waveformData.length;
        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = document.getElementById('primaryColor').value;
        for (let i = 0; i < waveformData.length; i++) {
            const x = i * sliceWidth;
            const v = (waveformData[i] / 128.0) * sensitivity;
            const y = (v * this.canvas.height) / 2;
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();
    }
    draw3DSpectrum(dataArray) {
        const sensitivity = parseFloat(document.getElementById('sensitivity').value);
        const bars = 64;
        const spacing = this.canvas.width / bars;
        const maxHeight = this.canvas.height * 0.5;
        for (let z = 0; z < 20; z++) {
            const depth = 1 - (z / 20);
            const offsetY = z * 10;
            const alpha = depth;
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(${hexToRgb(document.getElementById('primaryColor').value)}, ${alpha})`;
            for (let i = 0; i < bars; i++) {
                const freq = Math.floor(i * (dataArray.length / bars));
                const value = dataArray[freq] * sensitivity;
                const percent = value / 255;
                const height = maxHeight * percent * depth;
                const x = i * spacing * depth + (this.canvas.width * (1 - depth)) / 2;
                const y = this.canvas.height - height - offsetY;
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        }
    }
    drawKaleidoscope(dataArray) {
        const sensitivity = parseFloat(document.getElementById('sensitivity').value);
        const segments = 8;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        for (let s = 0; s < segments; s++) {
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate((s * Math.PI * 2) / segments);
            this.ctx.beginPath();
            for (let i = 0; i < dataArray.length / segments; i++) {
                const amplitude = (dataArray[i] / 255) * sensitivity;
                const x = (i / (dataArray.length / segments)) * radius;
                const y = amplitude * 100;
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            const gradient = this.ctx.createLinearGradient(0, 0, radius, 0);
            gradient.addColorStop(0, document.getElementById('primaryColor').value);
            gradient.addColorStop(1, document.getElementById('secondaryColor').value);
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.restore();
        }
    }
    drawTerrain(dataArray) {
        const sensitivity = parseFloat(document.getElementById('sensitivity').value);
        this.terrain.shift();
        const avgAmplitude = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        this.terrain.push(avgAmplitude * sensitivity);
        const terrainWidth = this.canvas.width;
        const terrainHeight = this.canvas.height;
        const resolution = this.terrain.length;
        const segmentWidth = terrainWidth / (resolution - 1);
        this.ctx.beginPath();
        this.ctx.moveTo(0, terrainHeight);
        for (let i = 0; i < resolution; i++) {
            const x = i * segmentWidth;
            const y = terrainHeight - this.terrain[i];
            this.ctx.lineTo(x, y);
        }
        this.ctx.lineTo(terrainWidth, terrainHeight);
        this.ctx.closePath();
        const gradient = this.ctx.createLinearGradient(0, 0, 0, terrainHeight);
        gradient.addColorStop(0, document.getElementById('primaryColor').value);
        gradient.addColorStop(1, document.getElementById('secondaryColor').value);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }
    setupEventListeners() {
        document.getElementById('audioInput').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.setupAudio(file);
            }
        });
        document.getElementById('playButton').addEventListener('click', async () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            if (this.audio) {
                await this.audio.play();
                this.isPlaying = true;
                document.getElementById('playButton').disabled = true;
                document.getElementById('pauseButton').disabled = false;
                this.draw();
            }
        });
        document.getElementById('pauseButton').addEventListener('click', () => {
            this.audio.pause();
            this.isPlaying = false;
            document.getElementById('playButton').disabled = false;
            document.getElementById('pauseButton').disabled = true;
        });
        document.getElementById('volumeControl').addEventListener('input', (e) => {
            if (this.gainNode) {
                this.gainNode.gain.value = e.target.value;
            }
        });
        document.getElementById('smoothing').addEventListener('input', (e) => {
            if (this.analyser) {
                this.analyser.smoothingTimeConstant = parseFloat(e.target.value);
                this.smoothingFactor = 0.5 + parseFloat(e.target.value) * 0.5;
            }
        });
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                this.applyPreset(preset);
            });
        });
        document.getElementById('startRecording').addEventListener('click', async () => {
            if (!this.canvas || !this.audio) return;
            this.recordingChunks = [];
            const quality = document.getElementById('videoQuality').value;
            const videoBitsPerSecond = {
                'high': 16000000,    // 4K
                'medium': 8000000,  // 1080p
                'low': 5000000      // 720p
            }[quality];
            try {
                const canvasStream = this.canvas.captureStream();
                const audioStream = this.audio.captureStream();
                const tracks = [...canvasStream.getTracks(), ...audioStream.getTracks()];
                const combinedStream = new MediaStream(tracks);
                this.mediaRecorder = new MediaRecorder(combinedStream, {
                    mimeType: 'video/webm;codecs=vp8,opus',
                    videoBitsPerSecond: videoBitsPerSecond
                });
                this.mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        this.recordingChunks.push(e.data);
                    }
                };
                this.mediaRecorder.onstop = () => {
                    const blob = new Blob(this.recordingChunks, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    a.href = url;
                    a.download = `visualization-${timestamp}.webm`;
                    a.click();
                    URL.revokeObjectURL(url);
                };
                this.mediaRecorder.start();
                this.isRecording = true;
                document.getElementById('startRecording').disabled = true;
                document.getElementById('stopRecording').disabled = false;
                const stats = document.getElementById('stats');
                stats.style.color = '#ff4444';
                stats.textContent += ' | Recording';
            } catch (error) {
                console.error('Recording failed:', error);
                alert('Failed to start recording. Please make sure you have loaded an audio file and started playback.');
            }
        });
        document.getElementById('stopRecording').addEventListener('click', () => {
            if (this.mediaRecorder && this.isRecording) {
                this.mediaRecorder.stop();
                this.isRecording = false;
                document.getElementById('startRecording').disabled = false;
                document.getElementById('stopRecording').disabled = true;
                const stats = document.getElementById('stats');
                stats.style.color = '#ffffff';
                stats.textContent = stats.textContent.replace(' | Recording', '');
            }
        });
    }
    applyPreset(preset) {
        const presets = {
            neon: {
                primary: '#00ff00',
                secondary: '#ff00ff',
                background: '#000000',
                sensitivity: 1.2,
                smoothing: 0.7
            },
            minimal: {
                primary: '#ffffff',
                secondary: '#888888',
                background: '#111111',
                sensitivity: 0.8,
                smoothing: 0.5
            },
            retro: {
                primary: '#ff6b6b',
                secondary: '#4ecdc4',
                background: '#2c3e50',
                sensitivity: 1.0,
                smoothing: 0.3
            }
        };

        const settings = presets[preset];
        if (settings) {
            document.getElementById('primaryColor').value = settings.primary;
            document.getElementById('secondaryColor').value = settings.secondary;
            document.getElementById('backgroundColor').value = settings.background;
            document.getElementById('sensitivity').value = settings.sensitivity;
            document.getElementById('smoothing').value = settings.smoothing;
            
            if (this.analyser) {
                this.analyser.smoothingTimeConstant = settings.smoothing;
            }
        }
    }
}
class FPSCounter {
    constructor() {
        this.fps = 0;
        this.frames = 0;
        this.lastTime = performance.now();
        this.element = document.getElementById('stats');
    }
    update() {
        this.frames++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastTime;
        if (elapsed >= 1000) {
            this.fps = Math.round((this.frames * 1000) / elapsed);
            this.frames = 0;
            this.lastTime = currentTime;
            this.element.textContent = `FPS: ${this.fps}`;
        }
    }
}
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
        '0, 0, 0';
}
const visualizer = new AudioVisualizer();