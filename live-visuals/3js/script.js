let scene, camera, renderer, currentVisualizer = 'water';
let audioContext, analyzer, micStream, micLevel = 0, audioEnabled = false;
const dataArray = new Uint8Array(128);
const visualizers = {};
function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('visualization-container').appendChild(renderer.domElement);
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xffffff);
  pointLight.position.set(0, 10, 10);
  scene.add(pointLight);
  initializeVisualizers();
  setupEventListeners();
  animate();
}
function initializeVisualizers() {
  visualizers.water = {
    mesh: null,
    init: function () {
      const geometry = new THREE.PlaneGeometry(15, 10, 64, 64);
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(0.5, '#00b4d8');
      gradient.addColorStop(1, '#90e0ef');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.1,
        roughness: 0.2,
      });
      this.mesh = new THREE.Mesh(geometry, material);
    },
    update: function (time, micLevel) {
      const positions = this.mesh.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        const radius = Math.sqrt(positions[i] * positions[i] + positions[i + 1] * positions[i + 1]);
        positions[i + 2] = audioEnabled
          ? micLevel * 3 * Math.sin(radius * 3 + time)
          : 0.5 * Math.sin(radius * 2 + time);
      }
      this.mesh.geometry.attributes.position.needsUpdate = true;
    }
  };
  visualizers.particles = {
    particles: null,
    burstParticles: [],
    particleMaterial: null,
    backgroundParticles: null,
    init: function () {
      const bgGeometry = new THREE.BufferGeometry();
      const bgVertices = [];
      for (let i = 0; i < 5000; i++) {
        bgVertices.push(
          Math.random() * 40 - 20,
          Math.random() * 40 - 20,
          Math.random() * 40 - 20
        );
      }
      bgGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bgVertices, 3));
      const bgMaterial = new THREE.PointsMaterial({
        size: 0.03,
        color: 0x0066ff,
        transparent: true,
        opacity: 0.6
      });
      this.backgroundParticles = new THREE.Points(bgGeometry, bgMaterial);
      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      for (let i = 0; i < 1000; i++) {
        vertices.push(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        );
      }
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      this.particleMaterial = new THREE.PointsMaterial({
        size: 0.08,
        color: 0x0066ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      this.particles = new THREE.Points(geometry, this.particleMaterial);
      scene.add(this.backgroundParticles);
      scene.add(this.particles);
    },
    burst: function (micLevel) {
      const numBurstParticles = Math.floor(micLevel * 50);
      const burstVelocityFactor = micLevel * 2;
      for (let i = 0; i < numBurstParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.5;
        const burstParticle = {
          position: new THREE.Vector3(0, 0, 0),
          velocity: new THREE.Vector3(
            Math.cos(angle) * burstVelocityFactor,
            Math.sin(angle) * burstVelocityFactor,
            (Math.random() - 0.5) * burstVelocityFactor
          ),
          rotationSpeed: (Math.random() - 0.5) * 0.1,
          radius: Math.random() * 2 + 1,
          angle: Math.random() * Math.PI * 2,
          age: 0,
          maxAge: 50 + Math.random() * 30,
          mesh: null,
          initialSize: 0.1 + Math.random() * 0.1
        };
        const burstGeometry = new THREE.BufferGeometry();
        burstGeometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute([0, 0, 0], 3)
        );
        const burstMaterial = new THREE.PointsMaterial({
          size: burstParticle.initialSize,
          color: 0x0066ff,
          transparent: true,
          opacity: 1.0,
          blending: THREE.AdditiveBlending
        });
        burstParticle.mesh = new THREE.Points(burstGeometry, burstMaterial);
        scene.add(burstParticle.mesh);
        this.burstParticles.push(burstParticle);
      }
    },
    update: function (time, micLevel) {
      const bgPositions = this.backgroundParticles.geometry.attributes.position.array;
      const audioFactor = audioEnabled ? micLevel * 2 : 1;
      for (let i = 0; i < bgPositions.length; i += 3) {
        const x = bgPositions[i];
        const y = bgPositions[i + 1];
        const z = bgPositions[i + 2];
        const distance = Math.sqrt(x * x + y * y + z * z);
        bgPositions[i] += Math.sin(time + distance) * 0.01 * audioFactor;
        bgPositions[i + 1] += Math.cos(time + distance) * 0.01 * audioFactor;
        bgPositions[i + 2] += Math.sin(time * 0.5) * 0.01 * audioFactor;
        if (Math.abs(bgPositions[i]) > 20) bgPositions[i] *= -0.95;
        if (Math.abs(bgPositions[i + 1]) > 20) bgPositions[i + 1] *= -0.95;
        if (Math.abs(bgPositions[i + 2]) > 20) bgPositions[i + 2] *= -0.95;
      }
      this.backgroundParticles.geometry.attributes.position.needsUpdate = true;
      this.particles.rotation.x += 0.001 * audioFactor;
      this.particles.rotation.y += 0.001 * audioFactor;
      const scale = 1 + (audioEnabled ? micLevel : 0) * 0.5;
      this.particles.scale.set(scale, scale, scale);
      if (micLevel > 0.05) {
        this.burst(micLevel);
      }
      const remainingBurstParticles = [];
      this.burstParticles.forEach((p) => {
        p.angle += p.rotationSpeed;
        p.radius += 0.1;
        p.position.x = Math.cos(p.angle) * p.radius + p.velocity.x * 0.1;
        p.position.y = Math.sin(p.angle) * p.radius + p.velocity.y * 0.1;
        p.position.z += (Math.random() - 0.5) * 0.1;
        p.velocity.x *= 0.99;
        p.velocity.y *= 0.99;
        p.mesh.geometry.attributes.position.setXYZ(0, p.position.x, p.position.y, p.position.z);
        p.mesh.geometry.attributes.position.needsUpdate = true;
        p.age++;
        const lifeRatio = 1 - (p.age / p.maxAge);
        p.mesh.material.opacity = lifeRatio;
        p.mesh.material.size = p.initialSize * lifeRatio;
        if (p.age < p.maxAge) {
          remainingBurstParticles.push(p);
        } else {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          p.mesh.material.dispose();
        }
      });
      this.burstParticles = remainingBurstParticles;
    }
  };
  visualizers.galaxy = {
    particles: null,
    init: function () {
      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      const colors = [];
      const numParticles = 10000;
      const color = new THREE.Color();
      for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 4;
        const radius = Math.random() * 5;
        const spiral = angle + (radius / 2);
        const x = Math.cos(spiral) * radius;
        const y = Math.sin(spiral) * radius;
        const z = (Math.random() - 0.5) * (5 - radius) / 2;
        vertices.push(x, y, z);
        const hue = (radius / 5) * 0.5 + 0.5;
        color.setHSL(hue, 1, 0.5);
        colors.push(color.r, color.g, color.b);
      }
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
      });
      this.particles = new THREE.Points(geometry, material);
      this.particles.rotation.x = Math.PI / 4;
    },
    update: function (time, micLevel) {
      this.particles.rotation.z = time * 0.1;
      if (audioEnabled) {
        const scale = 1 + micLevel * 0.5;
        this.particles.scale.set(scale, scale, scale);
      }
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        const distance = Math.sqrt(positions[i] * positions[i] + positions[i + 1] * positions[i + 1]);
        positions[i + 2] = Math.sin(distance - time + Math.random() * 0.1) *
          (audioEnabled ? micLevel * 0.5 : 0.1);
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  };
  visualizers.cubes = {
    cubes: [],
    init: function () {
      const rows = 30;
      const cols = 30;
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const spacing = 0.4;
      const totalWidth = (cols - 1) * spacing;
      const totalHeight = (rows - 1) * spacing;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5),
            specular: 0x444444,
            shininess: 30
          });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.x = j * spacing - totalWidth / 2;
          cube.position.z = i * spacing - totalHeight / 2;
          cube.position.y = 0;
          cube.rotation.x = Math.random() * Math.PI;
          cube.rotation.z = Math.random() * Math.PI;
          this.cubes.push(cube);
        }
      }
    },
    update: function (time, micLevel) {
      this.cubes.forEach((cube, i) => {
        if (audioEnabled) {
          analyzer.getByteFrequencyData(dataArray);
          const freqIndex = Math.floor((i / this.cubes.length) * dataArray.length);
          const frequency = dataArray[freqIndex] / 255;
          cube.scale.y = 1 + frequency * 8;
          cube.position.y = (frequency * 2) - 0.5;
          cube.material.color.setHSL(
            (frequency + time * 0.1) % 1,
            0.8,
            0.4 + frequency * 0.4
          );
          cube.rotation.x += frequency * 0.1;
          cube.rotation.z += frequency * 0.1;
        } else {
          const offset = (i % 10) * 0.1;
          cube.scale.y = 1 + Math.sin(time * 2 + offset) * 0.5;
          cube.position.y = Math.sin(time + offset) * 0.3;
          cube.rotation.x = time * 0.2 + offset;
          cube.rotation.z = time * 0.1 + offset;
          cube.material.color.setHSL(
            (time * 0.1 + i * 0.001) % 1,
            0.8,
            0.5
          );
        }
      });
    }
  };
  Object.values(visualizers).forEach(viz => viz.init());
  showVisualizer('water');
}
function showVisualizer(vizName) {
  while (scene.children.length > 2) {
    scene.remove(scene.children[2]);
  }
  const viz = visualizers[vizName];
  if (vizName === 'water') {
    scene.add(viz.mesh);
  } else if (vizName === 'particles') {
    scene.add(viz.particles);
  } else if (vizName === 'galaxy') {
    scene.add(viz.particles);
  } else if (vizName === 'cubes') {
    viz.cubes.forEach(cube => scene.add(cube));
  }
  document.querySelectorAll('.visualizer-option').forEach(option => {
    option.classList.toggle('active', option.dataset.viz === vizName);
  });
  currentVisualizer = vizName;
}
function setupEventListeners() {
  document.getElementById("toggle-mic").addEventListener("click", async function () {
    if (!audioEnabled) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const micSource = audioContext.createMediaStreamSource(micStream);
        micSource.connect(analyzer);
        audioEnabled = true;
        this.textContent = "Disable Mic";
      } catch (error) {
        console.error("Mic access denied:", error);
      }
    } else {
      micStream.getTracks().forEach(track => track.stop());
      audioContext.close();
      audioContext = null;
      analyzer = null;
      audioEnabled = false;
      micLevel = 0;
      this.textContent = "Enable Mic";
    }
  });
  document.getElementById("fullscreen").addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });
  document.querySelectorAll('.visualizer-option').forEach(option => {
    option.addEventListener('click', () => showVisualizer(option.dataset.viz));
  });
  document.addEventListener('keydown', (e) => {
    const vizList = ['water', 'particles', 'galaxy', 'cubes'];
    const currentIndex = vizList.indexOf(currentVisualizer);
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      const newIndex = (currentIndex - 1 + vizList.length) % vizList.length;
      showVisualizer(vizList[newIndex]);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      const newIndex = (currentIndex + 1) % vizList.length;
      showVisualizer(vizList[newIndex]);
    }
  });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
function getMicLevel() {
  if (analyzer) {
    analyzer.getByteFrequencyData(dataArray);
    micLevel = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255;
  }
}
let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time += 0.01;
  if (audioEnabled) getMicLevel();
  visualizers[currentVisualizer].update(time, micLevel);
  renderer.render(scene, camera);
}
init();