// ============================================================
// Milan Thapa - 3D Portfolio Scene
// Three.js | Floating sky island with orbiting project crystals
// ============================================================

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const COLORS = {
  sky:          0x1a0e3d,
  fog:          0x2a1850,
  grass:        0x4caf50,
  grassDark:    0x2e7d32,
  rock:         0x6d4c41,
  trunk:        0x5d4037,
  leaves:       0x33691e,
  crystal:      0x80deea,
  crystalGlow:  0x4dd0e1,
  cloud:        0xffffff,
  cloudGlow:    0xff99cc
};

export class PortfolioScene {
  constructor(canvas) {
    this.canvas         = canvas;
    this.mouse          = new THREE.Vector2();
    this.scrollProgress = 0;
    this.clock          = new THREE.Clock();
    this.crystals       = [];
    this.clouds         = [];
    this.raycaster      = new THREE.Raycaster();
    this.hoveredCrystal = null;

    this._initRenderer();
    this._initScene();
    this._initPostFx();
    this._buildWorld();
    this._bindEvents();
    this._animate();
  }

  // ---- Setup ------------------------------------------------
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.sky);
    this.scene.fog        = new THREE.FogExp2(COLORS.fog, 0.011);

    this.camera = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 0.1, 500
    );
    this.camera.position.set(0, 6, 28);
  }

  _initPostFx() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.75,  // strength
      0.45,  // radius
      0.82   // threshold
    );
    this.composer.addPass(bloom);
    this.composer.addPass(new OutputPass());
  }

  // ---- World ------------------------------------------------
  _buildWorld() {
    this._addLighting();
    this._addIsland();
    this._addTrees();
    this._addMonument();
    this._addProjectCrystals();
    this._addFireflies();
    this._addStars();
    this._addClouds();
  }

  _addLighting() {
    // Cool ambient
    this.scene.add(new THREE.AmbientLight(0x6644aa, 0.45));

    // Warm "sun"
    this.sun = new THREE.DirectionalLight(0xffd6a0, 1.6);
    this.sun.position.set(18, 28, 12);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near   = 0.5;
    this.sun.shadow.camera.far    = 90;
    this.sun.shadow.camera.left   = -25;
    this.sun.shadow.camera.right  = 25;
    this.sun.shadow.camera.top    = 25;
    this.sun.shadow.camera.bottom = -25;
    this.sun.shadow.bias          = -0.0005;
    this.scene.add(this.sun);

    // Cool rim
    const fill = new THREE.DirectionalLight(0x6688ff, 0.55);
    fill.position.set(-15, 8, -12);
    this.scene.add(fill);

    // Glowing monument light
    this.glow = new THREE.PointLight(COLORS.crystalGlow, 3, 35);
    this.glow.position.set(0, 4, 0);
    this.scene.add(this.glow);
  }

  _jitter(geo, amount) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * amount);
      pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * amount);
      pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * amount);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  _addIsland() {
    this.islandGroup = new THREE.Group();

    // Grass top
    const topGeo = new THREE.CylinderGeometry(8, 7.2, 1.6, 9, 1);
    this._jitter(topGeo, 0.25);
    const topMat = new THREE.MeshStandardMaterial({
      color: COLORS.grass,
      flatShading: true,
      roughness: 0.95
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.castShadow = true;
    top.receiveShadow = true;
    this.islandGroup.add(top);

    // Rocky underside
    const bottomGeo = new THREE.ConeGeometry(7.2, 9, 9, 4);
    this._jitter(bottomGeo, 0.55);
    const bottomMat = new THREE.MeshStandardMaterial({
      color: COLORS.rock,
      flatShading: true,
      roughness: 1
    });
    const bottom = new THREE.Mesh(bottomGeo, bottomMat);
    bottom.position.y = -5.3;
    bottom.rotation.x = Math.PI;
    bottom.castShadow = true;
    this.islandGroup.add(bottom);

    // Scatter rocks on the surface
    for (let i = 0; i < 5; i++) {
      const r = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.25, 0),
        new THREE.MeshStandardMaterial({
          color: 0x9e9e9e, flatShading: true, roughness: 1
        })
      );
      const a = Math.random() * Math.PI * 2;
      const d = 3 + Math.random() * 4;
      r.position.set(Math.cos(a) * d, 0.9, Math.sin(a) * d);
      r.castShadow = true;
      this.islandGroup.add(r);
    }

    this.scene.add(this.islandGroup);
  }

  _addTrees() {
    const positions = [
      [ 3.2,  0.9,  2.1],
      [-3.0,  0.9,  1.3],
      [ 1.0,  0.9, -3.2],
      [-2.3,  0.9, -2.4],
      [ 4.2,  0.9, -0.6],
      [-4.0,  0.9, -0.2]
    ];

    positions.forEach(([x, y, z]) => {
      const tree = this._makeTree();
      tree.position.set(x, y, z);
      tree.rotation.y = Math.random() * Math.PI * 2;
      const s = 0.75 + Math.random() * 0.5;
      tree.scale.set(s, s, s);
      this.islandGroup.add(tree);
    });
  }

  _makeTree() {
    const g = new THREE.Group();

    const trunkMat = new THREE.MeshStandardMaterial({
      color: COLORS.trunk, flatShading: true
    });
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.22, 1, 6),
      trunkMat
    );
    trunk.position.y = 0.5;
    trunk.castShadow = true;
    g.add(trunk);

    const leavesMat = new THREE.MeshStandardMaterial({
      color: COLORS.leaves, flatShading: true
    });
    for (let i = 0; i < 3; i++) {
      const r = 0.95 - i * 0.22;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(r, 0.95, 6),
        leavesMat
      );
      cone.position.y = 1.05 + i * 0.55;
      cone.castShadow = true;
      g.add(cone);
    }
    return g;
  }

  _addMonument() {
    const geo = new THREE.OctahedronGeometry(1.1, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.crystal,
      emissive: COLORS.crystalGlow,
      emissiveIntensity: 1.6,
      transparent: true,
      opacity: 0.88,
      roughness: 0.05,
      metalness: 0.25,
      flatShading: true
    });
    this.monument = new THREE.Mesh(geo, mat);
    this.monument.position.set(0, 3.2, 0);
    this.monument.castShadow = true;
    this.islandGroup.add(this.monument);

    // Pedestal
    const pedGeo = new THREE.CylinderGeometry(0.7, 1, 0.6, 8);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x546e7a, flatShading: true, roughness: 0.7
    });
    const ped = new THREE.Mesh(pedGeo, pedMat);
    ped.position.y = 1.2;
    ped.castShadow = true;
    ped.receiveShadow = true;
    this.islandGroup.add(ped);
  }

  _addProjectCrystals() {
    const data = [
      { label: 'Java',     hue: 0.08, radius: 13, height: 5,  speed: 0.18 },
      { label: 'Servlet',  hue: 0.55, radius: 14, height: 4,  speed: 0.14 },
      { label: 'Python',   hue: 0.16, radius: 12, height: 6,  speed: 0.22 },
      { label: 'Data',     hue: 0.78, radius: 15, height: 5.5,speed: 0.12 },
      { label: 'Web',      hue: 0.45, radius: 13.5, height: 4.5, speed: 0.20 },
      { label: 'Music',    hue: 0.92, radius: 14.5, height: 6.2, speed: 0.16 }
    ];

    data.forEach((d, i) => {
      const color = new THREE.Color().setHSL(d.hue, 0.75, 0.62);
      const geo = new THREE.OctahedronGeometry(0.55, 0);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.1,
        transparent: true,
        opacity: 0.92,
        flatShading: true,
        roughness: 0.1,
        metalness: 0.4
      });
      const mesh = new THREE.Mesh(geo, mat);
      const angle = (i / data.length) * Math.PI * 2;
      mesh.position.set(
        Math.cos(angle) * d.radius,
        d.height,
        Math.sin(angle) * d.radius
      );
      mesh.userData = {
        label: d.label,
        baseAngle: angle,
        radius: d.radius,
        baseY: d.height,
        speed: d.speed,
        index: i,
        baseScale: 1
      };
      this.crystals.push(mesh);
      this.scene.add(mesh);

      // Tiny halo light
      const halo = new THREE.PointLight(color, 0.8, 6);
      mesh.add(halo);
    });
  }

  _addFireflies() {
    const count = 240;
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const phases    = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = 6 + Math.random() * 14;
      const a = Math.random() * Math.PI * 2;
      positions[i*3]   = Math.cos(a) * r;
      positions[i*3+1] = Math.random() * 18 - 3;
      positions[i*3+2] = Math.sin(a) * r;

      const c = new THREE.Color().setHSL(0.12 + Math.random()*0.08, 1, 0.7);
      colors[i*3]   = c.r;
      colors[i*3+1] = c.g;
      colors[i*3+2] = c.b;

      phases[i] = Math.random() * Math.PI * 2;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.fireflies = new THREE.Points(geom, mat);
    this.fireflies.userData.phases = phases;
    this.scene.add(this.fireflies);
  }

  _addStars() {
    const count = 1000;
    const positions = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = 90 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(Math.random() * 2 - 1);
      positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.cos(phi);
      positions[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
      sizes[i] = 0.4 + Math.random() * 0.8;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.6,
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true
    });
    this.stars = new THREE.Points(geom, mat);
    this.scene.add(this.stars);
  }

  _addClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: COLORS.cloud,
      transparent: true,
      opacity: 0.55,
      flatShading: true,
      emissive: COLORS.cloudGlow,
      emissiveIntensity: 0.25
    });

    for (let i = 0; i < 6; i++) {
      const g = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const s = 1.1 + Math.random() * 1.5;
        const sphere = new THREE.Mesh(
          new THREE.IcosahedronGeometry(s, 0),
          cloudMat
        );
        sphere.position.set(
          (Math.random()-0.5)*3.2,
          (Math.random()-0.5)*0.6,
          (Math.random()-0.5)*2.2
        );
        g.add(sphere);
      }
      const angle  = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 10;
      g.position.set(
        Math.cos(angle) * radius,
        2.5 + Math.random() * 5,
        Math.sin(angle) * radius
      );
      g.userData = {
        speed: 0.04 + Math.random()*0.05,
        angle,
        radius
      };
      this.clouds.push(g);
      this.scene.add(g);
    }
  }

  // ---- Events -----------------------------------------------
  _bindEvents() {
    window.addEventListener('resize', () => this._onResize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    this.canvas.addEventListener('click', () => this._onClick());
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  _onClick() {
    if (this.hoveredCrystal) {
      const label = this.hoveredCrystal.userData.label;
      window.dispatchEvent(new CustomEvent('crystal:click', { detail: { label } }));
    }
  }

  setScroll(p) { this.scrollProgress = Math.max(0, Math.min(1, p)); }

  // ---- Frame ------------------------------------------------
  _animate() {
    requestAnimationFrame(() => this._animate());
    const t = this.clock.getElapsedTime();

    // Island bob + slow rotate
    this.islandGroup.position.y = Math.sin(t * 0.5) * 0.35;
    this.islandGroup.rotation.y = t * 0.04;

    // Monument
    this.monument.rotation.y = t * 0.6;
    this.monument.rotation.x = Math.sin(t * 0.4) * 0.25;
    this.monument.position.y = 3.2 + Math.sin(t * 1.3) * 0.18;
    this.glow.intensity = 2.6 + Math.sin(t * 2) * 0.6;

    // Orbiting project crystals
    this.crystals.forEach((c, i) => {
      const d = c.userData;
      const a = d.baseAngle + t * d.speed;
      c.position.x = Math.cos(a) * d.radius;
      c.position.z = Math.sin(a) * d.radius;
      c.position.y = d.baseY + Math.sin(t * 0.8 + i) * 0.6;
      c.rotation.y = t * 0.9;
      c.rotation.x = t * 0.5;
    });

    // Hover detection
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.crystals);
    if (hits.length > 0) {
      const hit = hits[0].object;
      if (this.hoveredCrystal !== hit) {
        if (this.hoveredCrystal) this.hoveredCrystal.scale.setScalar(1);
        this.hoveredCrystal = hit;
        document.body.style.cursor = 'pointer';
      }
      hit.scale.setScalar(1.35 + Math.sin(t * 6) * 0.08);
    } else if (this.hoveredCrystal) {
      this.hoveredCrystal.scale.setScalar(1);
      this.hoveredCrystal = null;
      document.body.style.cursor = '';
    }

    // Fireflies drift
    if (this.fireflies) {
      this.fireflies.rotation.y = t * 0.02;
      const pos = this.fireflies.geometry.attributes.position;
      const phases = this.fireflies.userData.phases;
      for (let i = 0; i < pos.count; i++) {
        pos.setY(i, pos.getY(i) + Math.sin(t * 1.5 + phases[i]) * 0.005);
      }
      pos.needsUpdate = true;
    }

    // Clouds slow orbit
    this.clouds.forEach((c) => {
      c.userData.angle += c.userData.speed * 0.004;
      c.position.x = Math.cos(c.userData.angle) * c.userData.radius;
      c.position.z = Math.sin(c.userData.angle) * c.userData.radius;
    });

    // Stars subtle rotate
    if (this.stars) this.stars.rotation.y = t * 0.005;

    // Scroll-driven camera arc
    const p = this.scrollProgress;
    const angle  = p * Math.PI * 0.55;          // 0 → ~100°
    const radius = 28 - p * 9;                  // pull in
    const height = 6 + p * 7;                   // rise

    const targetX = Math.sin(angle) * radius;
    const targetZ = Math.cos(angle) * radius;
    const targetY = height;

    // Smooth lerp + mouse parallax
    this.camera.position.x += (targetX + this.mouse.x * 1.2 - this.camera.position.x) * 0.06;
    this.camera.position.y += (targetY + this.mouse.y * 0.6 - this.camera.position.y) * 0.06;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.06;
    this.camera.lookAt(0, 2 + p * 1.5, 0);

    this.composer.render();
  }
}
