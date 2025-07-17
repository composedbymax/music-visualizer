(async () => {
function hexToRgbNormalized(hex) {
    const r = parseInt(hex.substr(1,2),16)/255;
    const g = parseInt(hex.substr(3,2),16)/255;
    const b = parseInt(hex.substr(5,2),16)/255;
    return [r,g,b];
}
async function loadShaderFile(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    return await res.text();
}
const vertexShaderSource = await loadShaderFile('vertex.glsl');
const fragmentShaderSource = await loadShaderFile('fragment.glsl');
const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl');
let audioContext, analyzer, micSource;
let audioData = new Float32Array(64);
let isAudio = false;
const micButton = document.getElementById('micButton');
const fullscreenButton = document.getElementById('fullscreenButton');
const micSelect = document.getElementById('micSourceSelect');
const visualizationType = document.getElementById('visualizationType');
const audioSensitivity = document.getElementById('audioSensitivity');
const audioSensitivityValue = document.getElementById('audioSensitivityValue');
const color1Picker = document.getElementById('color1');
const color2Picker = document.getElementById('color2');
const timeSpeed = document.getElementById('timeSpeed');
const timeSpeedValue = document.getElementById('timeSpeedValue');
const stats = {
    peakFreq: document.getElementById('peakFreq'),
    avgVolume: document.getElementById('avgVolume'),
    frameRate: document.getElementById('frameRate')
};
async function populateMicList(preserveId) {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        const oldValue = preserveId || micSelect.value;
        micSelect.innerHTML = '';
        audioInputs.forEach((device, idx) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text  = device.label || `Microphone ${idx+1}`;
        micSelect.appendChild(option);
        });
        if (oldValue && [...micSelect.options].some(o => o.value === oldValue)) {
        micSelect.value = oldValue;
        }
        micSelect.addEventListener('change', async () => {
        if (isAudio) {stopAudio(); await initAudio();}
        });
    } catch (err) {
        console.error('Error enumerating devices:', err);
    }
}
navigator.mediaDevices.addEventListener('devicechange', () => populateMicList());
populateMicList();
async function initAudio() {
    const deviceId = micSelect.value;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: deviceId ? { exact: deviceId } : undefined }
        });
            audioContext = new AudioContext();
            analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 128;
            micSource = audioContext.createMediaStreamSource(stream);
            micSource.connect(analyzer);
            isAudio = true;
        micButton.textContent = 'Disable Microphone';
        await populateMicList(deviceId);
    } catch (err) {
        console.error('Failed to get audio stream:', err);
    }
}
function stopAudio() {
    if (micSource) {
        micSource.disconnect();
        if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(err => console.error('Error closing audio context:', err));
        }
        micSource = null;
        audioContext = null;
        analyzer = null;
        isAudio = false;
        micButton.textContent = 'Enable Microphone';
    }
}
micButton.addEventListener('click', () => {
    isAudio ? stopAudio() : initAudio();
});
fullscreenButton.addEventListener('click', () => {
    if (!document.fullscreenElement) canvas.requestFullscreen();
    else document.exitFullscreen();
});
audioSensitivity.addEventListener('input', () => {
    audioSensitivityValue.textContent = parseFloat(audioSensitivity.value).toFixed(1);
});
timeSpeed.addEventListener('input', () => {
    timeSpeedValue.textContent = parseFloat(timeSpeed.value).toFixed(2);
});
function adjustSlider(slider, display, delta, min, max, precision) {
    let newValue = Math.min(max, Math.max(min, parseFloat(slider.value) + delta));
    slider.value = newValue.toFixed(precision);
    display.textContent = newValue.toFixed(precision);
}
function compile(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
}
const program = gl.createProgram();
gl.attachShader(program, compile(vertexShaderSource, gl.VERTEX_SHADER));
gl.attachShader(program, compile(fragmentShaderSource, gl.FRAGMENT_SHADER));
gl.linkProgram(program);
gl.useProgram(program);
const posLoc = gl.getAttribLocation(program, 'a_position');
const quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ -1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1 ]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
const uni = {
    time: gl.getUniformLocation(program, 'u_time'),
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    visualizationType: gl.getUniformLocation(program, 'u_visualizationType'),
    audioData: gl.getUniformLocation(program, 'u_audioData'),
    audioLevel: gl.getUniformLocation(program, 'u_audioLevel'),
    audioSensitivity: gl.getUniformLocation(program, 'u_audioSensitivity'),
    color1: gl.getUniformLocation(program, 'u_color1'),
    color2: gl.getUniformLocation(program, 'u_color2')
};
let lastTime = 0, frameCount = 0;
function render(now) {
    const t = now * 0.001 * parseFloat(timeSpeed.value);
    frameCount++;
    if (now - lastTime > 1000) {
    stats.frameRate.textContent = Math.round(frameCount * 1000 / (now - lastTime)) + ' FPS';
    frameCount = 0;
    lastTime = now;
    }
    if (isAudio) {
    const freqData = new Float32Array(analyzer.frequencyBinCount);
    analyzer.getFloatFrequencyData(freqData);
    let sum = 0, peak = 0, peakIdx = 0;
    for (let i = 0; i < freqData.length; i++) {
        const v = Math.pow(10, freqData[i] / 20);
        sum += v;
        if (v > peak) { peak = v; peakIdx = i; }
        audioData[i] = v;
    }
    stats.avgVolume.textContent = (20 * Math.log10(sum / freqData.length)).toFixed(1) + ' dB';
    stats.peakFreq.textContent = Math.round(peakIdx * audioContext.sampleRate / analyzer.fftSize) + ' Hz';
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uni.time, t);
    gl.uniform2f(uni.resolution, canvas.width, canvas.height);
    gl.uniform1i(uni.visualizationType, parseInt(visualizationType.value));
    gl.uniform1fv(uni.audioData, audioData);
    gl.uniform1f(uni.audioLevel, isAudio ? Math.sqrt(audioData.reduce((a, v) => a + v*v, 0)/audioData.length) : 0);
    gl.uniform1f(uni.audioSensitivity, parseFloat(audioSensitivity.value));
    gl.uniform3fv(uni.color1, hexToRgbNormalized(color1Picker.value));
    gl.uniform3fv(uni.color2, hexToRgbNormalized(color2Picker.value));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
}
requestAnimationFrame(render);
document.querySelector('.toggle-controls').addEventListener('click', () => {
    document.querySelector('.controls').classList.toggle('collapsed');
});
document.addEventListener('keydown', (event) => {
    switch (event.key) {
    case 'v': case 'V': {
        visualizationType.value = (parseInt(visualizationType.value) + 1) % 9;
        break;
    }
    case 'ArrowUp': adjustSlider(audioSensitivity, audioSensitivityValue, 0.1, 0, 5, 1); break;
    case 'ArrowDown': adjustSlider(audioSensitivity, audioSensitivityValue, -0.1, 0, 5, 1); break;
    case 'ArrowRight': adjustSlider(timeSpeed, timeSpeedValue, 0.1, 0, 2, 2); break;
    case 'ArrowLeft': adjustSlider(timeSpeed, timeSpeedValue, -0.1, 0, 2, 2); break;
    case 'c': case 'C': document.querySelector('.controls').classList.toggle('collapsed'); break;
    case 'f': case 'F': if (!document.fullscreenElement) canvas.requestFullscreen(); else document.exitFullscreen(); break;
    case 'm': case 'M': isAudio ? stopAudio() : initAudio(); break;
    }
});
})();