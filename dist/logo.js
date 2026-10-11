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
    new THREE.MeshPhysicalMaterial({ color: 0x9aacc5, metalness: 0.62, roughness: 0.26, clearcoat: 0.38, clearcoatRoughness: 0.22, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x1b2943, metalness: 0.46, roughness: 0.32, side: THREE.DoubleSide })
  ];

  for (const path of svg.paths) {
    for (const shape of path.toShapes(true)) {
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 7, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.9, bevelThickness: 0.7, curveSegments: 20 });
      geometry.translate(-141.73, -141.73, -7);
      geometry.scale(0.021, -0.021, 0.021);
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      model.add(new THREE.Mesh(geometry, metal));
    }
  }

  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  const size = bounds.getSize(new THREE.Vector3());
  const fit = 8.5 / Math.max(size.x, size.y);
  model.scale.setScalar(fit);
  const initial = { x: -0.08, y: -0.12 };
  model.rotation.set(initial.x, initial.y, 0);
  let active = false;
  let pointer = null;
  let targetRotation = { ...initial };
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
    event.preventDefault();
    active = true;
    pointer = { x: event.clientX, y: event.clientY };
    try { stage.setPointerCapture(event.pointerId); } catch {}
    last = event.pointerId;
  });
  stage.addEventListener('pointermove', event => {
    if (!active || event.pointerId !== last) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    targetRotation.y += dx * 0.006;
    targetRotation.x = THREE.MathUtils.clamp(targetRotation.x + dy * 0.005, -1.25, 1.25);
    pointer = { x: event.clientX, y: event.clientY };
    if (value) value.textContent = `${String(Math.round(THREE.MathUtils.euclideanModulo(model.rotation.y * THREE.MathUtils.RAD2DEG, 360))).padStart(3, '0')}°`;
  });
  const release = event => {
    if (event.pointerId !== last) return;
    active = false;
    pointer = null;
    targetRotation.x = initial.x;
    targetRotation.y = model.rotation.y + (THREE.MathUtils.euclideanModulo(initial.y - model.rotation.y + Math.PI, Math.PI * 2) - Math.PI);
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('lostpointercapture', release);
  stage.addEventListener('keydown', event => {
    const step = 0.13;
    if (event.key === 'ArrowLeft') targetRotation.y -= step;
    else if (event.key === 'ArrowRight') targetRotation.y += step;
    else if (event.key === 'ArrowUp') targetRotation.x = THREE.MathUtils.clamp(targetRotation.x - step, -1.25, 1.25);
    else if (event.key === 'ArrowDown') targetRotation.x = THREE.MathUtils.clamp(targetRotation.x + step, -1.25, 1.25);
    else if (event.key === 'Escape') { targetRotation.x = initial.x; targetRotation.y = model.rotation.y + (THREE.MathUtils.euclideanModulo(initial.y - model.rotation.y + Math.PI, Math.PI * 2) - Math.PI); }
    else return;
    event.preventDefault();
    if (value) value.textContent = `${String(Math.round(THREE.MathUtils.euclideanModulo(model.rotation.y * THREE.MathUtils.RAD2DEG, 360))).padStart(3, '0')}°`;
  });
  document.querySelector('#reset-logo')?.addEventListener('click', () => { targetRotation.x = initial.x; targetRotation.y = model.rotation.y + (THREE.MathUtils.euclideanModulo(initial.y - model.rotation.y + Math.PI, Math.PI * 2) - Math.PI); });

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const delta = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    const k = 1 - Math.exp(-delta * (active ? 26 : (motionEnabled() ? 4 : 12)));
    model.rotation.x += (targetRotation.x - model.rotation.x) * k;
    const dy = THREE.MathUtils.euclideanModulo(targetRotation.y - model.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    model.rotation.y += dy * k;
    model.rotation.z *= 1 - k;
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
