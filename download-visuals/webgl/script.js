const canvas = document.getElementById("visualizerCanvas");
const gl = canvas.getContext("webgl", {
  antialias: true,
  preserveDrawingBuffer: true,
});
if (!gl) {
  alert("WebGL not supported");
  throw new Error("WebGL not supported");
}
const qualitySettings = {
  low: { videoBitsPerSecond: 5000000 },
  medium: { videoBitsPerSecond: 10000000 },
  high: { videoBitsPerSecond: 20000000 }
};
function resizeCanvas() {
  const widthInput = document.getElementById("canvasWidth").value;
  const heightInput = document.getElementById("canvasHeight").value;
  const userWidth = parseInt(widthInput, 10) || window.innerWidth;
  const userHeight = parseInt(heightInput, 10) || window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = userWidth * dpr;
  canvas.height = userHeight * dpr;
  canvas.style.width = userWidth + "px";
  canvas.style.height = userHeight + "px";
  gl.viewport(0, 0, canvas.width, canvas.height);
}
document.getElementById("canvasWidth").addEventListener("input", resizeCanvas);
document.getElementById("canvasHeight").addEventListener("input", resizeCanvas);
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
class ShaderProgram {
  constructor(vertexSrc, fragmentSrc) {
    this.program = this.createProgram(vertexSrc, fragmentSrc);
  }
  createShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error("Shader compile error: " + error);
    }
    return shader;
  }
  createProgram(vertexSrc, fragmentSrc) {
    const vertexShader = this.createShader(vertexSrc, gl.VERTEX_SHADER);
    const fragmentShader = this.createShader(fragmentSrc, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error("Program link error: " + error);
    }
    return program;
  }
  use() {
    gl.useProgram(this.program);
  }
  getAttribLocation(name) {
    return gl.getAttribLocation(this.program, name);
  }
  getUniformLocation(name) {
    return gl.getUniformLocation(this.program, name);
  }
}
class AnimationModule {
  constructor(name, fragmentSrc) {
    this.name = name;
    this.shader = new ShaderProgram(vsSource, fragmentSrc);
    this.uniforms = {
      uUserColor1: gl.getUniformLocation(this.shader.program, "uUserColor1"),
      uUserColor2: gl.getUniformLocation(this.shader.program, "uUserColor2"),
      uTime: gl.getUniformLocation(this.shader.program, "uTime"),
      uResolution: gl.getUniformLocation(this.shader.program, "uResolution"),
      uAudioLevel: gl.getUniformLocation(this.shader.program, "uAudioLevel"),
    };
  }
  use() {
    this.shader.use();
  }
}
const animationModules = [
  new AnimationModule("Waves", fsSourceWaves),
  new AnimationModule("Electric Field", fsSourceElectricField),
  new AnimationModule("Quantum Chromo", fsSourceQCD),
  new AnimationModule("Tunnel", fsSourceTunnel),
  new AnimationModule("Radial Waves", fsSourceRadial),
  new AnimationModule("Gravitational Waves", fsSourceGravWaves),
  new AnimationModule("Photonic Crystal", fsSourcePhotonic),
  new AnimationModule("Geometric Grid", fsSourceGrid),
  new AnimationModule("Pixelation", fsSourcePixelate),
  new AnimationModule("Quantum Fields", fsSourceQuantum),
  new AnimationModule("Magnetic Flux", fsSourceMagnetic),
  new AnimationModule("Fluid Dynamics", fsSourceFluid),
  new AnimationModule("Moire Pattern", fsSourceMoire),
  new AnimationModule("Spectrum", fsSourceSpectrum),
  new AnimationModule("Fractal Explorer", fsSourceFractal),
];
let currentAnimationIndex = 0;
function updateModeDisplay() {
  document.getElementById("modeDisplay").textContent = "Mode: " + animationModules[currentAnimationIndex].name;
}
updateModeDisplay();
const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
function bindAttributes(program) {
  const aPosition = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
}
let audioBuffer = null, analyser = null, dataArray = null, sourceNode = null;
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let dest = null;
const dropZone = document.getElementById('dropZone');
const audioFileName = document.getElementById('audioFileName');
const audioUpload = document.getElementById('audioUpload');
const audioStatus = document.querySelector(".audio-status");
audioStatus.addEventListener("click", () => {
  audioUpload.click();
});
audioUpload.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    audioFileName.textContent = e.target.files[0].name;
  }
});
document.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("active");
});
document.addEventListener("dragleave", (e) => {
  e.preventDefault();
  if (e.relatedTarget === null) {
    dropZone.classList.remove("active");
  }
});
document.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("active");
  if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.type.startsWith("audio/")) {
      audioUpload.files = e.dataTransfer.files;
      audioFileName.textContent = file.name;
    }
  }
});
audioUpload.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleAudioFile(e.target.files[0]);
  }
});
async function handleAudioFile(file) {
  audioFileName.textContent = file.name;
  if (!audioCtx) {
    audioCtx = new AudioContext();
    dest = audioCtx.createMediaStreamDestination();
  }
  const arrayBuffer = await file.arrayBuffer();
  audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  console.log("Audio file loaded.");
}
let startTime = null;
function render(timestamp) {
  if (!startTime) startTime = timestamp;
  const elapsed = (timestamp - startTime) / 1000.0;
  const animModule = animationModules[currentAnimationIndex];
  animModule.use();
  bindAttributes(animModule.shader.program);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(animModule.uniforms.uTime, elapsed);
  gl.uniform2f(animModule.uniforms.uResolution, canvas.width, canvas.height);
  let audioLevel = 0.0;
  if (analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    audioLevel = sum / dataArray.length / 255;
  }
  gl.uniform1f(animModule.uniforms.uAudioLevel, audioLevel);
  const userColor1 = document.getElementById("userColor1").value;
  const userColor2 = document.getElementById("userColor2").value;
  const rgb1 = hexToRgb(userColor1);
  const rgb2 = hexToRgb(userColor2);
  gl.uniform3f(animModule.uniforms.uUserColor1, rgb1[0], rgb1[1], rgb1[2]);
  gl.uniform3f(animModule.uniforms.uUserColor2, rgb2[0], rgb2[1], rgb2[2]);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
function hexToRgb(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    currentAnimationIndex = (currentAnimationIndex + 1) % animationModules.length;
    updateModeDisplay();
  } else if (e.key === "ArrowLeft") {
    currentAnimationIndex = (currentAnimationIndex - 1 + animationModules.length) % animationModules.length;
    updateModeDisplay();
  }
});
document.querySelectorAll('.dimension-button').forEach(button => {
  let intervalId = null;
  let timeoutId = null;
  const startAction = () => {
    const target = document.getElementById(button.dataset.target);
    const direction = button.dataset.direction;
    const step = direction === 'up' ? 50 : -50;
    target.value = Math.max(100, parseInt(target.value || 0) + step);
    target.dispatchEvent(new Event('input'));
    timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        target.value = Math.max(100, parseInt(target.value || 0) + step);
        target.dispatchEvent(new Event('input'));
      }, 50);
    }, 300);
  };
  const stopAction = () => {
    clearTimeout(timeoutId);
    clearInterval(intervalId);
  };
  button.addEventListener('mousedown', startAction);
  button.addEventListener('mouseup', stopAction);
  button.addEventListener('mouseleave', stopAction);
});
let mediaRecorder, chunks = [];
const qualitySelect = document.getElementById("qualitySelect");
const startBtn = document.getElementById("startRecording");
const stopBtn = document.getElementById("stopRecording");
const previewContainer = document.getElementById("previewContainer");
const previewVideo = document.getElementById("previewVideo");
const downloadBtn = document.getElementById("downloadRecording");
const closePreviewBtn = document.getElementById("closePreview");
startBtn.addEventListener("click", async () => {
  chunks = [];
  if (audioBuffer) {
    if (!audioCtx) {
      audioCtx = new AudioContext();
      dest = audioCtx.createMediaStreamDestination();
    }
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }
    if (sourceNode) {
      try { sourceNode.stop(); } catch (e) {}
    }
    sourceNode = audioCtx.createBufferSource();
    sourceNode.buffer = audioBuffer;
    const gainNode = audioCtx.createGain();
    sourceNode.connect(gainNode);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    gainNode.connect(analyser);
    gainNode.connect(audioCtx.destination);
    gainNode.connect(dest);
    sourceNode.start(0);
  }
  const canvasStream = canvas.captureStream(60);
  let combinedStream;
  if (audioBuffer && dest) {
    const audioStream = dest.stream;
    const tracks = [...canvasStream.getTracks(), ...audioStream.getTracks()];
    combinedStream = new MediaStream(tracks);
  } else {
    combinedStream = canvasStream;
  }
  const selectedQuality = qualitySettings[qualitySelect.value];
  const mimeType = audioBuffer ? "video/webm;codecs=vp9,opus" : "video/webm;codecs=vp9";
  mediaRecorder = new MediaRecorder(combinedStream, {
    mimeType: mimeType,
    ...selectedQuality
  });
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    previewVideo.src = url;
    previewVideo.load();
    previewContainer.style.display = "block";
    downloadBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = url;
      a.download = "visualization.webm";
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
  };
  mediaRecorder.start(1000);
  startBtn.disabled = true;
  stopBtn.disabled = false;
});
stopBtn.addEventListener("click", () => {
  mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  if (sourceNode) {
    try { sourceNode.stop(); } catch (e) {}
  }
});
closePreviewBtn.addEventListener("click", () => {
  previewContainer.style.display = "none";
  previewVideo.src = "";
});