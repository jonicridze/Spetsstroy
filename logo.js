import * as THREE from 'three';
import { SVGLoader } from './assets/vendor/SVGLoader.js';
import { RoomEnvironment } from './assets/vendor/RoomEnvironment.js';

export async function initLogo(stage, motionEnabled = () => true) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 15);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.append(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xeaf3ff, 0x25364c, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 4.2);
  key.position.set(-4, 6, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x91b7ec, 3.2);
  rim.position.set(5, 1, -5);
  scene.add(rim);

  const model = new THREE.Group();
  scene.add(model);
  const svg = await new SVGLoader().loadAsync('/assets/emblem.svg');
  const metal = [
    new THREE.MeshStandardMaterial({ color: 0x9aabc0, metalness: 0.86, roughness: 0.2, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x263952, metalness: 0.82, roughness: 0.25, side: THREE.DoubleSide })
  ];
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xd6e2f0, transparent: true, opacity: 0.66 });
  const parts = [];

  for (const path of svg.paths) {
    for (const shape of path.toShapes(true)) {
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 14, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.6, bevelThickness: 0.65, curveSegments: 16 });
      geometry.translate(-141.73, -141.73, -7);
      geometry.scale(0.021, -0.021, 0.021);
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      const mesh = new THREE.Mesh(geometry, metal);
      model.add(mesh);
      parts.push(mesh);
    }
  }

  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  const size = bounds.getSize(new THREE.Vector3());
  const fit = 8.5 / Math.max(size.x, size.y);
  model.scale.setScalar(fit);
  for (const part of parts) {
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(part.geometry, 32), edgeMaterial);
    outline.position.copy(part.position);
    outline.rotation.copy(part.rotation);
    outline.scale.copy(part.scale);
    model.add(outline);
  }

  const initial = { x: -0.12, y: 0.32 };
  model.rotation.set(initial.x, initial.y, 0);
  let active = false;
  let pointer = null;
  let last = 0;
  let raf = 0;
  let previous = performance.now();
  const value = document.querySelector('#rotation-value');
  const fallback = stage.querySelector('.logo-fallback');

  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 600 ? 18 : 15;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();

  stage.addEventListener('pointerdown', event => {
    active = true;
    pointer = { x: event.clientX, y: event.clientY };
    stage.setPointerCapture(event.pointerId);
    last = event.pointerId;
  });
  stage.addEventListener('pointermove', event => {
    if (!active || event.pointerId !== last) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    model.rotation.y += dx * 0.009;
    model.rotation.x += dy * 0.009;
    pointer = { x: event.clientX, y: event.clientY };
    if (value) value.textContent = `${String(Math.round(THREE.MathUtils.euclideanModulo(model.rotation.y * THREE.MathUtils.RAD2DEG, 360))).padStart(3, '0')}°`;
  });
  const release = event => { if (event.pointerId === last) active = false; };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('lostpointercapture', release);
  stage.addEventListener('keydown', event => {
    const step = 0.13;
    if (event.key === 'ArrowLeft') model.rotation.y -= step;
    else if (event.key === 'ArrowRight') model.rotation.y += step;
    else if (event.key === 'ArrowUp') model.rotation.x -= step;
    else if (event.key === 'ArrowDown') model.rotation.x += step;
    else if (event.key === 'Escape') { model.rotation.set(initial.x, initial.y, 0); }
    else return;
    event.preventDefault();
    if (value) value.textContent = `${String(Math.round(THREE.MathUtils.euclideanModulo(model.rotation.y * THREE.MathUtils.RAD2DEG, 360))).padStart(3, '0')}°`;
  });
  document.querySelector('#reset-logo')?.addEventListener('click', () => model.rotation.set(initial.x, initial.y, 0));

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const delta = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    if (!active) {
      const k = motionEnabled() ? 1 - Math.exp(-delta * 2.7) : 1;
      model.rotation.x += (initial.x - model.rotation.x) * k;
      let dy = THREE.MathUtils.euclideanModulo(model.rotation.y - initial.y + Math.PI, Math.PI * 2) - Math.PI;
      model.rotation.y += dy * k;
      model.rotation.z += (0 - model.rotation.z) * k;
    }
    if (fallback) fallback.style.transform = `rotateX(${THREE.MathUtils.radToDeg(model.rotation.x)}deg) rotateY(${THREE.MathUtils.radToDeg(model.rotation.y - initial.y)}deg)`;
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  stage.classList.add('logo-ready');
  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    scene.traverse(object => { object.geometry?.dispose(); if (Array.isArray(object.material)) object.material.forEach(m => m.dispose()); else object.material?.dispose(); });
    renderer.dispose();
    renderer.domElement.remove();
  };
}
