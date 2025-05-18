<!-- Created by Max Warren -->
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="download a .webm file of uploaded audio, background image and center image with visualizer manipulated by the audio overlayed in">
<title>MAX</title>
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="root.css">
<link rel="stylesheet" href="slider.css">
</head>
<body>
    <div class="container">
        <div class="controls">
            <div class="control-group">
                <label for="visualizerType">Visualization Style</label>
                <select id="visualizerType">
                    <option value="waveform">Waveform</option>
                    <option value="circular">Circular</option>
                    <option value="spectrogram">Spectrogram</option>
                    <option value="dna">DNA Helix</option>
                    <option value="kaleidoscope">Kaleidoscope</option>
                    <option value="matrix">Matrix</option>
                    <option value="honeycomb">honeycomb</option>
                    <option value="neuroNetwork">Neural Network</option>
                    <option value="mandala">Mandala</option>
                    <option value="galaxy">galaxy</option>
                    <option value="crystal">crystal</option>
                    <option value="pulseRings">Pulse Rings</option>
                </select>
            </div>
            <div class="control-group">
                <label for="backgroundInput">1. Load Background</label>
                <input type="file" id="backgroundInput" accept="image/*">
                <div id="dimensionsInfo" class="dimensions-info"></div>
            </div>
            <div class="control-group">
                <label for="albumArtInput">2. Load Album Art</label>
                <input type="file" id="albumArtInput" accept="image/*">
            </div>
            <div class="control-group">
                <label for="audioInput">3. Load Audio File</label>
                <input type="file" id="audioInput" accept="audio/*">
            </div>
            <div class="control-group">
                <button id="playButton" disabled>Play</button>
                <button id="pauseButton" disabled>Pause</button>
                <button id="startRecording" disabled>Start Rec</button>
                <button id="stopRecording" disabled>Stop Rec</button>
            </div>
            <div class="control-group">
                <div class="parameter-control">
                    <label for="bitrateControl">Quality</label>
                    <span id="bitrateValue">16 Mbps</span>
                    <input type="range" id="bitrateControl" min="4" max="16" value="16" step="1">
                </div>
                <div class="parameter-control">
                    <label for="widthControl">Width</label>
                    <span id="widthValue">6</span>
                    <input type="range" id="widthControl" min="1" max="20" value="6" step="0.1">
                </div>
                <div class="parameter-control">
                    <label for="sensitivityControl">Sensitivity</label>
                    <span id="sensitivityValue">1.0</span>
                    <input type="range" id="sensitivityControl" min="0.1" max="5" value="1" step="0.1">
                </div>
                <div class="parameter-control">
                    <label for="fftControl">FFT Size</label>
                    <span id="fftValue">128</span>
                    <input type="range" id="fftControl" min="0" max="4" value="1" step="1">
                </div>
            </div>
            <div class="color-control">
                <input type="color" id="primaryColor" value="#000000">
                <span>Base</span>
                <input type="color" id="secondaryColor" value="#0fff5f">
                <span>Accent</span>
            </div>
            <?php if (isset($_SESSION['username'])): ?>
            <div class="control-group">
                <button id="xbuieowdldwigwsfvsjk">REMOVE WATERMARK</button>
            </div>
            <?php endif; ?>
        </div>
        <div class="visualizer-container">
            <canvas id="visualizer"></canvas>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>