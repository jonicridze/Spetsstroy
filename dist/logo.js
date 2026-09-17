import * as THREE from 'three';
import {SVGLoader} from './assets/vendor/SVGLoader.js';
import {RoomEnvironment} from './assets/vendor/RoomEnvironment.js';
export async function initLogo(stage,isMotion){
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
 stage.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(34,1,.1,100);camera.position.set(0,0,9);
 const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xeaf3ff,0x172b4a,2.5));
 const key=new THREE.DirectionalLight(0xf8fbff,4);key.position.set(-3,4,5);scene.add(key);
 const fill=new THREE.DirectionalLight(0x8eaddd,3);fill.position.set(4,-2,2);scene.add(fill);
 const data=await new SVGLoader().loadAsync('/assets/emblem.svg');const logo=new THREE.Group();
 const front=new THREE.MeshStandardMaterial({color:0x8b9bb2,metalness:.9,roughness:.23});
 const sides=new THREE.MeshStandardMaterial({color:0x263952,metalness:.92,roughness:.27});
 for(const path of data.paths)for(const shape of SVGLoader.createShapes(path)){
  const geo=new THREE.ExtrudeGeometry(shape,{depth:14,bevelEnabled:true,bevelThickness:.65,bevelSize:.6,bevelSegments:3,curveSegments:16,steps:1});
  geo.translate(-141.73,-141.73,-7);geo.scale(.021,-.021,.021);geo.computeVertexNormals();logo.add(new THREE.Mesh(geo,[front,sides]));
 }
 scene.add(logo);const home={x:.04,y:-.2,z:-.025};const rot={x:home.x,y:home.y};let dragging=false,lastX=0,lastY=0,visible=true,frame=0,lastTime=0;
 function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=innerWidth<=760?10.5:9;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(stage);resize();
 const reset=()=>{dragging=false;rot.x=home.x;rot.y=home.y};
 stage.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;stage.setPointerCapture(e.pointerId)});
 stage.addEventListener('pointermove',e=>{if(!dragging)return;rot.y+=(e.clientX-lastX)*.012;rot.x=Math.max(-1.1,Math.min(1.1,rot.x+(e.clientY-lastY)*.006));lastX=e.clientX;lastY=e.clientY});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,reset);
 document.querySelector('#reset-logo').addEventListener('click',reset);
 stage.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape','Home'].includes(e.key)){e.preventDefault();if(e.key==='Escape'||e.key==='Home')reset();else{rot.y+=(e.key==='ArrowLeft'?-.35:e.key==='ArrowRight'?.35:0);rot.x+=(e.key==='ArrowUp'?-.2:e.key==='ArrowDown'?.2:0);dragging=true;clearTimeout(stage.returnTimer);stage.returnTimer=setTimeout(reset,1100)}}});
 function animate(t){if(!visible||document.hidden){frame=0;return}frame=requestAnimationFrame(animate);if(t-lastTime<28)return;const dt=Math.min((t-lastTime)/1000,.05);lastTime=t;const smoothing=reduce.matches?1:1-Math.exp(-6*dt);logo.rotation.x=THREE.MathUtils.lerp(logo.rotation.x,rot.x,smoothing);logo.rotation.y=THREE.MathUtils.lerp(logo.rotation.y,rot.y,smoothing);logo.rotation.z=home.z;logo.position.y=isMotion()?Math.sin(t*.0007)*.085:0;document.querySelector('#rotation-value').textContent=String(Math.round((logo.rotation.y-home.y)*180/Math.PI)).padStart(3,'0')+'°';renderer.render(scene,camera)}
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!frame)frame=requestAnimationFrame(animate)},{rootMargin:'100px'}).observe(stage);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&visible&&!frame)frame=requestAnimationFrame(animate)});
 stage.classList.add('logo-ready');stage.dataset.ready='true';
}
