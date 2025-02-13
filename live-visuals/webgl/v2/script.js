const fragmentShaderSource = `
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_effectIntensity;
uniform int u_visualizationType;
uniform int u_colorScheme;
uniform float u_audioData[64];
uniform float u_audioLevel;
uniform float u_audioSensitivity;
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}
vec2 rotate(vec2 p, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
vec3 getColorScheme(float t, int scheme) {
    vec3 color;
    t = fract(t);
    if (scheme == 0) {
    color = 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.333, 0.667)));
    } else if (scheme == 1) {
    color = vec3(
        sin(t * 6.28318) * 0.5 + 0.5,
        cos(t * 6.28318) * 0.5 + 0.5,
        sin(t * 6.28318 + 2.094) * 0.5 + 0.5
    );
    } else if (scheme == 2) {
    color = vec3(
        0.5 + 0.5 * sin(t * 6.28318),
        0.7 + 0.3 * cos(t * 6.28318),
        0.9 + 0.1 * sin(t * 6.28318)
    );
    } else if (scheme == 3) {
    color = vec3(
        0.8 + 0.2 * sin(t * 6.28318),
        0.3 + 0.2 * cos(t * 6.28318),
        0.1 + 0.1 * sin(t * 6.28318)
    );
    } else {
    color = vec3(
        0.1 + 0.1 * sin(t * 6.28318),
        0.3 + 0.2 * cos(t * 6.28318),
        0.8 + 0.2 * sin(t * 6.28318)
    );
    }
    return color;
}
float wavy(vec2 st, float time) {
    vec2 pos = st - 0.5;
    float r = length(pos);
    float angle = atan(pos.y, pos.x);
    float wave = 0.0;
    for(int i = 0; i < 64; i++) {
    float freq = float(i) * 0.1;
    wave += (u_audioData[i] * 2.0) * sin(r * 20.0 + angle * 12.0 + time + freq) * u_audioSensitivity;

    }
    return wave * u_effectIntensity;
}
float swirl(vec2 st, float time) {
    vec2 pos = st - 0.5;
    float r = length(pos);
    float angle = atan(pos.y, pos.x);
    float wave = 0.0;
    for(int i = 0; i < 128; i++) {
    float freq = float(i) * 0.1;
    wave += (u_audioData[i] * 2.0) * sin(r * 5.0 + angle * 1.0 + time + freq) * u_audioSensitivity;

    }
    return wave * u_effectIntensity;
}
float plasma(vec2 st, float time) {
    float ship = 0.0;
    vec2 pos = st * 4.0 - 2.0;
    ship += sin(pos.x * 10.0 + time);
    ship += sin((pos.y * 10.0 + time) * 0.5);
    ship += sin((pos.x * 10.0 + pos.y * 10.0 + time) * 0.5);
    vec2 center = vec2(0.0);
    float dist = length(pos - center);
    ship += sin(dist * 20.0 - time * 2.0);
    ship *= u_audioLevel * u_effectIntensity * 12.0;
    return ship * 0.7 + 0.7;
}
float ripple(vec2 st, float time) {
    vec2 pos = st - 0.5;
    float r = length(pos) * 2.0;
    float angle = atan(pos.y, pos.x);
    float rippleEffect = 0.0;
    for(int i = 0; i < 32; i++) {
        float freq = float(i) * 0.00002;
        float wave = sin(r * 10.0 - time * 4.0 + freq);
        rippleEffect += u_audioData[i] * wave * (4.0 - r) * u_audioSensitivity;
    }
    float beams = 0.0;
    for(int i = 0; i < 12; i++) {
        float rotAngle = angle + time * 0.5 + float(i) * 3.14159 / 3.0;
        beams += pow(abs(sin(rotAngle * 3.0)), 5.0) * 0.3;
    }
    return (rippleEffect + beams) * u_effectIntensity;
}
float kaleidoscope(vec2 st, float time) {
    vec2 pos = st - 0.5;
    float r = length(pos);
    float angle = atan(pos.y, pos.x);
    float segments = 8.0;
    angle = mod(angle + time * 0.2, 2.0 * 3.14159 / segments);
    angle = abs(angle - 3.14159 / segments);
    vec2 kaleidoPos = vec2(cos(angle), sin(angle)) * r;
    float pattern = 0.0;
    for(int i = 0; i < 32; i++) {
        float freq = float(i) * 0.3;
        pattern += u_audioData[i] * sin(kaleidoPos.x * 20.0 + time + freq) * 
                cos(kaleidoPos.y * 20.0 - time + freq) * u_audioSensitivity;
    }
    return pattern * (10.0 - r) * u_effectIntensity;
}
float vortex(vec2 st, float time) {
    vec2 pos = st - 0.5;
    float r = length(pos);
    float angle = atan(pos.y, pos.x);
    float spiral = 0.0;
    for(int i = 0; i < 5; i++) {
        float armAngle = angle + r * 10.0 + time + float(i) * 6.28318 / 5.0;
        spiral += smoothstep(0.8, 0.0, abs(sin(armAngle))) * (1.0 - r);
    }
    float turbulence = 0.0;
    for(int i = 0; i < 32; i++) {
        float freq = float(i) * 0.2;
        turbulence += u_audioData[i] * noise(pos * 5.0 + time * 0.1 + freq) * u_audioSensitivity;
    }
    return (spiral * 0.5 + turbulence) * u_effectIntensity;
}
void main() {
    vec2 st = gl_FragCoord.xy / u_resolution;
    float time = u_time * 0.5;
    float visualization = 0.0;
    if(u_visualizationType == 0) {
        visualization = wavy(st, time);
    } else if(u_visualizationType == 1) {
        visualization = swirl(st, time);
    } else if(u_visualizationType == 2) {
        visualization = plasma(st, time);
    } else if(u_visualizationType == 3) {
        visualization = ripple(st, time);
    } else if(u_visualizationType == 4) {
        visualization = kaleidoscope(st, time);
    } else if(u_visualizationType == 5) {
        visualization = vortex(st, time);
    }
    vec3 color = getColorScheme(visualization + time * 0.1, u_colorScheme);
    float audioBoost = u_audioLevel * u_audioSensitivity;
    color = mix(color, vec3(1.0), audioBoost * visualization * 0.5);
    gl_FragColor = vec4(color, 1.0);
}`;
const vertexShaderSource = `
attribute vec4 a_position;
void main() {
    gl_Position = a_position;
}`;
const canvas = document.getElementById("webgl-canvas");
const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
if (!gl) {
    console.error("WebGL not supported");
}
let audioContext;
let analyzer;
let microphone;
let isAudioInitialized = false;
let audioData = new Float32Array(64);
let fftSize = 128;
const micButton = document.getElementById('micButton');
const presetButton = document.getElementById('presetButton');
const toggleButton = document.querySelector('.toggle-controls');
const controls = document.querySelector('.controls');
const stats = {
    peakFreq: document.getElementById('peakFreq'),
    avgVolume: document.getElementById('avgVolume'),
    frameRate: document.getElementById('frameRate')
};
const presets = [
    {
    name: "wavy",
    visualizationType: "0",
    colorScheme: "1",
    effectIntensity: "0.5",
    timeSpeed: "1.0",
    audioSensitivity: "2.5"
    },
    {
    name: "swirl",
    visualizationType: "1",
    colorScheme: "1",
    effectIntensity: "0.5",
    timeSpeed: "1.0",
    audioSensitivity: "2.5"
    },
    {
    name: "plasma",
    visualizationType: "2",
    colorScheme: "1",
    effectIntensity: "0.5",
    timeSpeed: "1.0",
    audioSensitivity: "2.5"
    },
    {
    name: "ripple",
    visualizationType: "3",
    colorScheme: "1",
    effectIntensity: "0.5",
    timeSpeed: "1.0",
    audioSensitivity: "2.5"
    },
    {
    name: "kaleidoscope",
    visualizationType: "4",
    colorScheme: "1",
    effectIntensity: "0.5",
    timeSpeed: "1.0",
    audioSensitivity: "2.5"
    },
    {
    name: "vortex",
    visualizationType: "5",
    colorScheme: "1",
    effectIntensity: "0.5",
    timeSpeed: "1.0",
    audioSensitivity: "2.5"
    }
];
let currentPreset = 0;
async function initAudio() {
    try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyzer = audioContext.createAnalyser();
    analyzer.fftSize = fftSize;
    analyzer.smoothingTimeConstant = 0.8;
    microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyzer);
    isAudioInitialized = true;
    micButton.classList.add('active');
    micButton.textContent = 'Disable Microphone';
    document.body.classList.add('recording');
    } catch (err) {
    console.error('Error accessing microphone:', err);
    micButton.textContent = 'Microphone Access Denied';
    }
}
function disconnectAudio() {
    if (microphone) {
    microphone.disconnect();
    isAudioInitialized = false;
    micButton.classList.remove('active');
    micButton.textContent = 'Enable Microphone';
    document.body.classList.remove('recording');
    }
}
micButton.addEventListener('click', () => {
    if (!isAudioInitialized) {
    initAudio();
    } else {
    disconnectAudio();
    }
});
presetButton.addEventListener('click', () => {
    currentPreset = (currentPreset + 1) % presets.length;
    applyPreset(presets[currentPreset]);
});
toggleButton.addEventListener('click', () => {
    controls.classList.toggle('collapsed');
});
function initWebGL() {
    const program = createProgram(vertexShaderSource, fragmentShaderSource);
    gl.useProgram(program);
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const uniformLocations = {
    time: gl.getUniformLocation(program, "u_time"),
    resolution: gl.getUniformLocation(program, "u_resolution"),
    effectIntensity: gl.getUniformLocation(program, "u_effectIntensity"),
    visualizationType: gl.getUniformLocation(program, "u_visualizationType"),
    colorScheme: gl.getUniformLocation(program, "u_colorScheme"),
    audioData: gl.getUniformLocation(program, "u_audioData"),
    audioLevel: gl.getUniformLocation(program, "u_audioLevel"),
    audioSensitivity: gl.getUniformLocation(program, "u_audioSensitivity")
    };
    const quadBuffer = createQuad();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);
    let lastTime = 0;
    let frameCount = 0;
    let lastFpsUpdate = 0;
    function render(time) {
    frameCount++;
    if (time - lastFpsUpdate > 1000) {
        stats.frameRate.textContent = `${Math.round(frameCount * 1000 / (time - lastFpsUpdate))} FPS`;
        frameCount = 0;
        lastFpsUpdate = time;
    }
    if (isAudioInitialized) {
        const freqData = new Float32Array(analyzer.frequencyBinCount);
        analyzer.getFloatFrequencyData(freqData);
        let sum = 0;
        let peak = -Infinity;
        let peakIndex = 0;
        for (let i = 0; i < freqData.length; i++) {
        const value = Math.pow(10, freqData[i] / 20);
        sum += value;
        if (value > peak) {
            peak = value;
            peakIndex = i;
        }
        audioData[i] = value;
        }
        const avgVolume = sum / freqData.length;
        stats.avgVolume.textContent = `${(20 * Math.log10(avgVolume)).toFixed(1)} dB`;
        stats.peakFreq.textContent = `${Math.round(peakIndex * audioContext.sampleRate / analyzer.fftSize)} Hz`;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniformLocations.time, time * 0.001 * parseFloat(document.getElementById("timeSpeed").value));
    gl.uniform2f(uniformLocations.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniformLocations.effectIntensity, parseFloat(document.getElementById("effectIntensity").value));
    gl.uniform1i(uniformLocations.visualizationType, parseInt(document.getElementById("visualizationType").value));
    gl.uniform1i(uniformLocations.colorScheme, parseInt(document.getElementById("colorScheme").value));
    gl.uniform1fv(uniformLocations.audioData, audioData);
    gl.uniform1f(uniformLocations.audioLevel, isAudioInitialized ? getAudioLevel() : 0);
    gl.uniform1f(uniformLocations.audioSensitivity, parseFloat(document.getElementById("audioSensitivity").value));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
function createProgram(vertexSource, fragmentSource) {
    const vertexShader = compileShader(vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link failed:", gl.getProgramInfoLog(program));
    }
    return program;
}
function compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile failed:", gl.getShaderInfoLog(shader));
    }
    return shader;
}
function createQuad() {
    const vertices = new Float32Array([
    -1.0, -1.0,
    1.0, -1.0,
    -1.0, 1.0,
    -1.0, 1.0,
    1.0, -1.0,
    1.0, 1.0
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    return buffer;
}
function getAudioLevel() {
    if (!isAudioInitialized) return 0;
    const timeDomainData = new Float32Array(analyzer.frequencyBinCount);
    analyzer.getFloatTimeDomainData(timeDomainData);
    let sum = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
    sum += timeDomainData[i] * timeDomainData[i];
    }
    return Math.sqrt(sum / timeDomainData.length);
}
function applyPreset(preset) {
    Object.keys(preset).forEach(key => {
    const element = document.getElementById(key);
    if (element) {
        element.value = preset[key];
        const valueDisplay = document.getElementById(`${key}Value`);
        if (valueDisplay) {
        valueDisplay.textContent = preset[key];
        }
    }
    });
}
document.querySelectorAll('.slider').forEach(slider => {
    const valueDisplay = document.getElementById(`${slider.id}Value`);
    slider.addEventListener('input', () => {
    valueDisplay.textContent = parseFloat(slider.value).toFixed(1);
    });
});
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener("resize", resizeCanvas);
function init() {
    resizeCanvas();
    initWebGL();
    applyPreset(presets[0]);
    document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'm':
        case 'M':
        micButton.click();
        break;
        case 'n':
        case 'N':
        presetButton.click();
        break;
        case 'h':
        case 'H':
        controls.classList.toggle('collapsed');
        break;
    }
    });
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 14px;
    pointer-events: none;
    transition: opacity 0.3s ease;
    z-index: 1000;
    `;
    tooltip.textContent = 'M for mic, N for pattern, H for controls';
    document.body.appendChild(tooltip);
    setTimeout(() => {
    tooltip.style.opacity = '0';
    setTimeout(() => tooltip.remove(), 300);
    }, 5000);
}
init();