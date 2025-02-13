const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d', { alpha: false });
let audioContext, analyser, source;
let animationId;
let mediaRecorder;
let chunks = [];
let background = new Image();
let albumArt = new Image();
let audio = new Audio();
let isPlaying = false;
let isRecording = false;
let lastDrawTime = 0;
const FRAME_RATE = 1000 / 60;
const FFT_SIZES = [64, 128, 512, 1024, 2048];
let canvasWidth = canvas.width;
let canvasHeight = canvas.height;
let halfWidth = canvasWidth / 2;
let halfHeight = canvasHeight / 2;
let currentVisualizerType = 'waveform';
let waveWidth, waveHeight, barWidth, barSpacing;
let albumSize, albumX, albumY;
let videoBitrate = 8000000;
let visualizationWidth = 5.5;
let sensitivityFactor = 1.0;
let xbuieowd = true;
const bgCanvas = document.createElement('canvas');
const bgCtx = bgCanvas.getContext('2d', { alpha: false });
const primaryColorInput = document.getElementById('primaryColor');
const secondaryColorInput = document.getElementById('secondaryColor');
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
function updateCanvasDimensions() {
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    halfWidth = canvasWidth / 2;
    halfHeight = canvasHeight / 2;
    waveWidth = canvasWidth * 0.4;
    waveHeight = canvasHeight * 0.25;
    barSpacing = 2;
    albumSize = Math.min(canvasWidth, canvasHeight) * 0.25;
    albumX = (canvasWidth - albumSize) / 2;
    albumY = (canvasHeight - albumSize) / 2;
    bgCanvas.width = canvasWidth;
    bgCanvas.height = canvasHeight;
    updateBackgroundBuffer();
}
function updateBackgroundBuffer() {
    if (background.complete && background.src) {
        bgCtx.drawImage(background, 0, 0, canvasWidth, canvasHeight);
    } else {
        bgCtx.fillStyle = '#000000';
        bgCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
}
function drawWatermark() {
    if (xbuieowd) {
        ctx.save();
        ctx.font = 'bold 24px Arial';
        const text = 'MAX WARREN';
        const metrics = ctx.measureText(text);
        const padding = 8;
        const boxWidth = metrics.width + (padding * 2);
        const boxHeight = 30;
        const x = canvasWidth - boxWidth - 20;
        const y = canvasHeight - 20;
        ctx.fillStyle = 'white';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y - boxHeight + 6, boxWidth, boxHeight);
        ctx.fillStyle = 'black';
        ctx.shadowBlur = 0;
        ctx.fillText(text, x + padding, y);
        ctx.restore();
    }
}
function drawWaveformVisualization(dataArray, bufferLength) {
    const primaryColor = hexToRgb(secondaryColorInput.value);
    const secondaryColor = hexToRgb(primaryColorInput.value);
    const gradient = ctx.createLinearGradient(0, 0, 0, waveHeight);
    gradient.addColorStop(0, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 1)`);
    gradient.addColorStop(1, `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, 1)`);
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.5)`;
    barWidth = (waveWidth / bufferLength) * visualizationWidth;
    const halfBufferLength = bufferLength / 3;
    const quarterBufferLength = bufferLength / 60;
    for (let i = 0; i < halfBufferLength; i++) {
        const scaledHeight = (dataArray[i] / 4000) * waveHeight;
        const peak = 9 - Math.abs(i - quarterBufferLength) / quarterBufferLength;
        const barHeight = scaledHeight * peak;
        const leftX = halfWidth - waveWidth + i * (barWidth + barSpacing);
        const leftY = halfHeight - barHeight / 2;
        ctx.fillRect(leftX - i * 0.000001, leftY, barWidth, barHeight);
        const rightX = halfWidth + waveWidth - i * (barWidth + barSpacing);
        const rightY = halfHeight - barHeight / 2;
        ctx.fillRect(rightX + i * 0.000001, rightY, barWidth, barHeight);
    }
}
function drawCircularVisualization(dataArray, bufferLength) {
    const primaryColor = hexToRgb(primaryColorInput.value);
    const secondaryColor = hexToRgb(secondaryColorInput.value);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.min(canvasWidth, canvasHeight) * 0.1;
    const bars = 90;
    const angleStep = (Math.PI * 4.5) / bars;
    const angles = Array.from({ length: bars }, (_, i) => i * angleStep);
    ctx.lineCap = 'round';
    ctx.lineWidth = visualizationWidth;
    for (let i = 0; i < bars; i++) {
        const angle = angles[i];
        const freqIndex = Math.floor(i * bufferLength / bars);
        const value = dataArray[freqIndex];
        const barHeight = (value / 255) * (radius * 0.8);
        const startRadius = radius + 10;
        const endRadius = startRadius + barHeight;
        const startX = centerX + Math.sin(angle) * startRadius;
        const startY = centerY - Math.cos(angle) * startRadius;
        const endX = centerX + Math.sin(angle) * endRadius;
        const endY = centerY - Math.cos(angle) * endRadius;
        const primaryAlpha = Math.floor((value / 255) * 255);
        const primaryColorHex = `rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, ${primaryAlpha / 255})`;
        const secondaryAlpha = Math.floor(((255 - value) / 255) * 255);
        const secondaryColorHex = `rgb(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, ${secondaryAlpha / 255})`;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = primaryColorHex;
        ctx.stroke();
        const mirroredStartX = centerX + Math.sin(-angle) * startRadius;
        const mirroredStartY = centerY - Math.cos(-angle) * startRadius;
        const mirroredEndX = centerX + Math.sin(-angle) * endRadius;
        const mirroredEndY = centerY - Math.cos(-angle) * endRadius;
        ctx.beginPath();
        ctx.moveTo(mirroredStartX, mirroredStartY);
        ctx.lineTo(mirroredEndX, mirroredEndY);
        ctx.strokeStyle = secondaryColorHex;
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = `rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b})`;
    ctx.stroke();
}
function drawSpectrogramVisualization(dataArray, bufferLength) {
    const primaryColor = hexToRgb(primaryColorInput.value);
    const secondaryColor = hexToRgb(secondaryColorInput.value);
    const barHeight = canvasHeight / 2;
    barWidth = (waveWidth / bufferLength) * visualizationWidth;
    for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        const percent = value / 255;
        const height = barHeight * percent;
        const offset = barWidth * i;
        const gradient = ctx.createLinearGradient(0, canvasHeight - height, 0, canvasHeight);
        gradient.addColorStop(0, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.8)`);
        gradient.addColorStop(1, `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, 0.8)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(offset, canvasHeight - height, barWidth - 2, height);
        ctx.fillRect(offset, 0, barWidth - 2, height);
    }
}
function drawDNAHelixVisualization(dataArray, bufferLength) {
    const primaryColor = hexToRgb(primaryColorInput.value);
    const secondaryColor = hexToRgb(secondaryColorInput.value);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const helixWidth = canvasWidth * 0.4;
    const helixHeight = canvasHeight * 0.8;
    const coils = visualizationWidth * 3;
    for (let i = 0; i < bufferLength; i += 4) {
        const value = dataArray[i];
        const t = i / bufferLength;
        const angle = t * Math.PI * 2 * coils;
        const x1 = centerX + Math.cos(angle) * helixWidth / 2;
        const y1 = centerY + t * helixHeight - helixHeight / 2;
        const x2 = centerX - Math.cos(angle) * helixWidth / 2;
        const y2 = centerY + t * helixHeight - helixHeight / 2;
        const radius1 = (value / 255) * 10;
        const radius2 = (dataArray[Math.min(i + 2, bufferLength - 1)] / 255) * 10;
        ctx.beginPath();
        ctx.arc(x1, y1, radius1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.7)`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x2, y2, radius2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, 0.7)`;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
function drawKaleidoscopeVisualization(dataArray, bufferLength) {
    const primaryColor = hexToRgb(primaryColorInput.value);
    const secondaryColor = hexToRgb(secondaryColorInput.value);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const segments = visualizationWidth;
    const angleStep = (Math.PI * 2) / segments;
    const maxRadius = Math.min(canvasWidth, canvasHeight) / 3;
    for (let i = 0; i < bufferLength; i += 4) {
        const value = dataArray[i];
        const radius = (value / 255) * maxRadius;
        const distortion = Math.sin(i / 20) * 10;
        for (let segment = 0; segment < segments; segment++) {
            const angle = segment * angleStep + Math.sin(i / 50) * 0.2;
            const x = centerX + Math.cos(angle) * radius + distortion;
            const y = centerY + Math.sin(angle) * radius + distortion;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.8)`;
            ctx.stroke();
            ctx.beginPath();
            const circleRadius = Math.max(2, value / 15);
            ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, 0.5)`;
            ctx.fill();
        }
    }
    const pulseRadius = Math.sin(Date.now() / 1000) * 30 + 60;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.1)`;
    ctx.lineWidth = 2;
    ctx.stroke();
}
function drawMatrixVisualization(dataArray, bufferLength) {
    const primaryColor = hexToRgb(primaryColorInput.value);
    const secondaryColor = hexToRgb(secondaryColorInput.value);
    const columns = Math.floor(32 * (visualizationWidth / 5.5));
    const rows = Math.floor(16 * (visualizationWidth / 5.5));
    const cellWidth = canvasWidth / columns;
    const cellHeight = canvasHeight / rows;
    for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
            const dataIndex = Math.floor((i * rows + j) % bufferLength);
            const value = dataArray[dataIndex];
            const size = (value / 255) * Math.min(cellWidth, cellHeight);
            const r = primaryColor.r + (secondaryColor.r - primaryColor.r) * (value/255);
            const g = primaryColor.g + (secondaryColor.g - primaryColor.g) * (value/255);
            const b = primaryColor.b + (secondaryColor.b - primaryColor.b) * (value/255);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${value/255})`;
            ctx.fillRect(
                i * cellWidth + (cellWidth - size) / 2,
                j * cellHeight + (cellHeight - size) / 2,
                size,
                size
            );
        }
    }
}
function drawHexGridVisualization(dataArray, bufferLength) {
    const primaryColor = hexToRgb(primaryColorInput.value);
    const secondaryColor = hexToRgb(secondaryColorInput.value);
    const hexSize = Math.max(10, visualizationWidth * 5);
    const hexWidth = Math.sqrt(3) * hexSize;
    const hexHeight = 2 * hexSize;
    const cols = Math.ceil(canvasWidth / hexWidth);
    const rows = Math.ceil(canvasHeight / (hexHeight * 0.75));
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * hexWidth + (row % 2) * (hexWidth / 2);
            const y = row * hexHeight * 0.75;
            const dataIndex = (row * cols + col) % bufferLength;
            const value = dataArray[dataIndex] / 255;
            const r = primaryColor.r + (secondaryColor.r - primaryColor.r) * value;
            const g = primaryColor.g + (secondaryColor.g - primaryColor.g) * value;
            const b = primaryColor.b + (secondaryColor.b - primaryColor.b) * value;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${value})`;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const px = x + Math.cos(angle) * hexSize;
                const py = y + Math.sin(angle) * hexSize;
                if (i === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }
            ctx.closePath();
            ctx.fill();
        }
    }
}
function drawNeuroNetworkVisualization(dataArray, bufferLength) {
    const primaryColor = hexToRgb(primaryColorInput.value);
    const secondaryColor = hexToRgb(secondaryColorInput.value);
    const nodes = Math.floor(visualizationWidth * 15);
    const connections = nodes * 2;
    for (let i = 0; i < nodes; i++) {
        const dataIndex = Math.floor((i / nodes) * bufferLength);
        const value = dataArray[dataIndex];
        const x = (Math.sin(i) * canvasWidth / 2) + canvasWidth / 2;
        const y = (Math.cos(i) * canvasHeight / 2) + canvasHeight / 2;
        const nodeSize = (value / 255) * 20;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(2, nodeSize), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.6)`;
        ctx.fill();
    }
    for (let i = 0; i < connections; i++) {
        const start = Math.floor(Math.random() * nodes);
        const end = Math.floor(Math.random() * nodes);
        const startX = (Math.sin(start) * canvasWidth / 2) + canvasWidth / 2;
        const startY = (Math.cos(start) * canvasHeight / 2) + canvasHeight / 2;
        const endX = (Math.sin(end) * canvasWidth / 2) + canvasWidth / 2;
        const endY = (Math.cos(end) * canvasHeight / 2) + canvasHeight / 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, 0.2)`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
function drawMandalaVisualization(dataArray, bufferLength) {
    const primaryColor = hexToRgb(primaryColorInput.value);
    const secondaryColor = hexToRgb(secondaryColorInput.value);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const maxRadius = Math.min(canvasWidth, canvasHeight) / 2.5;
    const segments = Math.floor(visualizationWidth * 16);
    for (let i = 0; i < segments; i++) {
        const dataIndex = Math.floor((i / segments) * bufferLength);
        const value = dataArray[dataIndex];
        const angle = (i / segments) * Math.PI * 2;
        const radius = (value / 255) * maxRadius;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        const x = centerX + Math.cos(angle) * (radius + 50);
        const y = centerY + Math.sin(angle) * (radius + 50);
        ctx.lineTo(x, y);
        ctx.strokeStyle = `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.3)`;
        ctx.lineWidth = 2;
        ctx.stroke();
        for (let j = 1; j < 4; j++) {
            const innerAngle = angle + (Math.PI / 4) * j;
            const innerX = centerX + Math.cos(innerAngle) * (radius / j);
            const innerY = centerY + Math.sin(innerAngle) * (radius / j);
            ctx.beginPath();
            ctx.arc(innerX, innerY, 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, 0.5)`;
            ctx.fill();
        }
    }
}
function drawGalaxyVisualization(dataArray, bufferLength) {
    const primaryColor = hexToRgb(primaryColorInput.value);
    const secondaryColor = hexToRgb(secondaryColorInput.value);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const arms = Math.floor(visualizationWidth * 4);
    const time = Date.now() / 1000;
    for (let arm = 0; arm < arms; arm++) {
        const armAngle = (arm / arms) * Math.PI * 2;
        for (let i = 0; i < bufferLength; i += 4) {
            const value = dataArray[i];
            const distance = i / bufferLength * canvasWidth / 2;
            const spiralFactor = time * 0.5;
            const spiralAngle = armAngle + distance / 100 + spiralFactor;
            const x = centerX + Math.cos(spiralAngle) * distance;
            const y = centerY + Math.sin(spiralAngle) * distance;
            ctx.beginPath();
            ctx.arc(x, y, (value / 255) * 5, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, (value / 255) * 5);
            gradient.addColorStop(0, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.8)`);
            gradient.addColorStop(1, `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, 0)`);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }
}
function drawCrystalVisualization(dataArray, bufferLength) {
    const primaryColor = hexToRgb(primaryColorInput.value);
    const secondaryColor = hexToRgb(secondaryColorInput.value);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const crystalSegments = Math.floor(visualizationWidth * 12);
    for (let i = 0; i < crystalSegments; i++) {
        const dataIndex = Math.floor((i / crystalSegments) * bufferLength);
        const value = dataArray[dataIndex];
        const angle = (i / crystalSegments) * Math.PI * 2;
        const outerRadius = (value / 255) * Math.min(canvasWidth, canvasHeight) / 3;
        const innerRadius = outerRadius * 0.5;
        ctx.beginPath();
        const x1 = centerX + Math.cos(angle) * innerRadius;
        const y1 = centerY + Math.sin(angle) * innerRadius;
        const x2 = centerX + Math.cos(angle) * outerRadius;
        const y2 = centerY + Math.sin(angle) * outerRadius;
        const x3 = centerX + Math.cos(angle + Math.PI / crystalSegments) * outerRadius;
        const y3 = centerY + Math.sin(angle + Math.PI / crystalSegments) * outerRadius;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(x1, y1, x3, y3);
        gradient.addColorStop(0, `rgba(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b}, 0.7)`);
        gradient.addColorStop(1, `rgba(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b}, 0.3)`);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}
function drawPulseRingsVisualization(dataArray, bufferLength) {
    const primaryColor = hexToRgb(primaryColorInput.value);
    const secondaryColor = hexToRgb(secondaryColorInput.value);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    for (let i = 0; i < bufferLength; i += 8) {
        const value = (dataArray[i] / 255) * sensitivityFactor;
        const maxRadius = Math.min(canvasWidth, canvasHeight) / 2;
        const radius = Math.max(10, value * maxRadius);
        const r = primaryColor.r + (secondaryColor.r - primaryColor.r) * value;
        const g = primaryColor.g + (secondaryColor.g - primaryColor.g) * value;
        const b = primaryColor.b + (secondaryColor.b - primaryColor.b) * value;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${value})`;
        ctx.lineWidth = visualizationWidth * value;
        ctx.stroke();
    }
}
function draw(timestamp) {
    if (timestamp - lastDrawTime < FRAME_RATE) {
        animationId = requestAnimationFrame(draw);
        return;
    }
    lastDrawTime = timestamp;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    const adjustedDataArray = new Uint8Array(bufferLength);
    for (let i = 0; i < bufferLength; i++) {
        adjustedDataArray[i] = Math.min(255, Math.max(0, dataArray[i] * sensitivityFactor));
    }
    ctx.drawImage(bgCanvas, 0, 0);
    switch (currentVisualizerType) {
        case 'waveform': drawWaveformVisualization(dataArray, bufferLength); break;
        case 'circular': drawCircularVisualization(dataArray, bufferLength); break;
        case 'spectrogram': drawSpectrogramVisualization(dataArray, bufferLength); break;
        case 'dna': drawDNAHelixVisualization(dataArray, bufferLength); break;
        case 'kaleidoscope': drawKaleidoscopeVisualization(dataArray, bufferLength); break;
        case 'matrix': drawMatrixVisualization(dataArray, bufferLength); break;
        case 'honeycomb': drawHexGridVisualization(dataArray, bufferLength); break;
        case 'neuroNetwork': drawNeuroNetworkVisualization(dataArray, bufferLength); break;
        case 'mandala': drawMandalaVisualization(dataArray, bufferLength); break;
        case 'galaxy': drawGalaxyVisualization(dataArray, bufferLength); break;
        case 'crystal': drawCrystalVisualization(dataArray, bufferLength); break;
        case 'pulseRings': drawPulseRingsVisualization(dataArray, bufferLength); break;
    }
    if (albumArt.complete && albumArt.src) {
        ctx.drawImage(albumArt, albumX, albumY, albumSize, albumSize);
    }
    drawWatermark();
    if (isPlaying) {
        animationId = requestAnimationFrame(draw);
    }
}
const togglexbuieowdldwi = document.getElementById('xbuieowdldwigwsfvsjk');
if (togglexbuieowdldwi) {
    togglexbuieowdldwi.addEventListener('click', () => {
        xbuieowd = !xbuieowd;
        if (isPlaying) {
            cancelAnimationFrame(animationId);
            draw();
        }
    });
}
const fileInputs = document.querySelectorAll('.control-group input[type="file"]');
fileInputs.forEach(input => {
    input.addEventListener('dragover', (e) => {
        e.preventDefault();
        input.classList.add('drag-over');
    });
    input.addEventListener('dragleave', () => {
        input.classList.remove('drag-over');
    });
    input.addEventListener('drop', (e) => {
        e.preventDefault();
        input.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) {
            const changeEvent = new Event('change');
            input.files = e.dataTransfer.files;
            input.dispatchEvent(changeEvent);
        }
    });
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (input.id === 'backgroundInput') {
                    background.src = e.target.result;
                } else if (input.id === 'albumArtInput') {
                    albumArt.src = e.target.result;
                } else if (input.id === 'audioInput') {
                    const newAudio = new Audio();
                    if (audio) {
                        audio.pause();
                        audio.remove();
                    }
                    audio = newAudio;
                    audio.src = e.target.result;
                    document.getElementById('playButton').disabled = false;
                    setupAudioContext(audio).catch(error => {
                        console.error('Error setting up audio context:', error);
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    });
});
document.getElementById('visualizerType').addEventListener('change', (e) => {
    currentVisualizerType = e.target.value;
    if (isPlaying) {
        cancelAnimationFrame(animationId);
        draw();
    }
    console.log(`Visualizer changed to: ${currentVisualizerType}`);
});
document.addEventListener('keydown', function(event) {
    const visualizerSelect = document.getElementById('visualizerType');
    const options = visualizerSelect.options;
    let selectedIndex = visualizerSelect.selectedIndex;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        selectedIndex = (selectedIndex + 1) % options.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        selectedIndex = (selectedIndex - 1 + options.length) % options.length;
    }
    visualizerSelect.selectedIndex = selectedIndex;
    currentVisualizerType = options[selectedIndex].value;
    if (isPlaying) {
        cancelAnimationFrame(animationId);
        draw();
    }
    console.log(`Selected visualizer: ${currentVisualizerType}`);
});
primaryColorInput.addEventListener('change', () => {
    if (isPlaying) {
        cancelAnimationFrame(animationId);
        draw();
    }
});
secondaryColorInput.addEventListener('change', () => {
    if (isPlaying) {
        cancelAnimationFrame(animationId);
        draw();
    }
});
async function setupAudioContext(audioElement) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const fftControl = document.getElementById('fftControl');
        analyser.fftSize = FFT_SIZES[parseInt(fftControl.value)];
    }
    if (source) {
        source.disconnect();
    }
    source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
}
document.getElementById('fftControl').addEventListener('input', (e) => {
    const fftSize = FFT_SIZES[parseInt(e.target.value)];
    document.getElementById('fftValue').textContent = fftSize;
    if (analyser) {
        analyser.fftSize = fftSize;
    }
    if (isPlaying) {
        cancelAnimationFrame(animationId);
        draw();
    }
});
document.getElementById('playButton').addEventListener('click', () => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    audio.play();
    isPlaying = true;
    document.getElementById('playButton').disabled = true;
    document.getElementById('pauseButton').disabled = false;
    document.getElementById('startRecording').disabled = false;
    draw();
});
document.getElementById('pauseButton').addEventListener('click', () => {
    audio.pause();
    isPlaying = false;
    document.getElementById('playButton').disabled = false;
    document.getElementById('pauseButton').disabled = true;
    cancelAnimationFrame(animationId);
});
document.getElementById('bitrateControl').addEventListener('input', (e) => {
    videoBitrate = parseInt(e.target.value) * 1000000;
    document.getElementById('bitrateValue').textContent = `${e.target.value} Mbps`;
});
document.getElementById('widthControl').addEventListener('input', (e) => {
    visualizationWidth = parseFloat(e.target.value);
    document.getElementById('widthValue').textContent = visualizationWidth.toFixed(1);
});
document.getElementById('sensitivityControl').addEventListener('input', (e) => {
    sensitivityFactor = parseFloat(e.target.value);
    document.getElementById('sensitivityValue').textContent = sensitivityFactor.toFixed(1);
});
document.getElementById('startRecording').addEventListener('click', async () => {
    chunks = [];
    const stream = canvas.captureStream();
    const audioStream = audio.captureStream();
    const tracks = [...stream.getTracks(), ...audioStream.getTracks()];
    const combinedStream = new MediaStream(tracks);
    mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: videoBitrate
    });
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    };
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'visualization.webm';
        a.click();
        URL.revokeObjectURL(url);
    };
    mediaRecorder.start();
    isRecording = true;
    document.getElementById('startRecording').disabled = true;
    document.getElementById('stopRecording').disabled = false;
});
document.getElementById('stopRecording').addEventListener('click', () => {
    mediaRecorder.stop();
    isRecording = false;
    document.getElementById('startRecording').disabled = false;
    document.getElementById('stopRecording').disabled = true;
});
background.onload = function () {
    canvas.width = background.width || 1200;
    canvas.height = background.height || 600;
    updateCanvasDimensions();
    const dimensionsInfo = document.getElementById('dimensionsInfo');
    dimensionsInfo.textContent = `Canvas dimensions: ${canvas.width}x${canvas.height}px`;
    dimensionsInfo.classList.add('active');
};
canvas.width = 1200;
canvas.height = 600;
updateCanvasDimensions();