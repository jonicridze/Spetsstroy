const root=document.querySelector('#objects-map');
if(root){
 const status=document.querySelector('.map-loading'),cards=[...document.querySelectorAll('.map-project')],region=document.querySelector('#map-region'),phase=document.querySelector('#map-status');
 const init=()=>{
  if(!window.L){status.textContent='Карта недоступна. Откройте карточки объектов в списке.';return;}
  const L=window.L,map=L.map(root,{scrollWheelZoom:false}).setView([57,45],4);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map).on('tileerror',()=>{status.hidden=false;status.textContent='Подложка карты недоступна. Список объектов продолжает работать.'}).on('load',()=>status.hidden=true);
  const group=L.featureGroup().addTo(map),markers=new Map();
  cards.forEach((card,i)=>{
   const marker=L.marker([Number(card.dataset.lat),Number(card.dataset.lng)],{icon:L.divIcon({className:'sst-map-marker',html:`<span>${String(i+1).padStart(2,'0')}</span>`,iconSize:[44,44],iconAnchor:[22,44]}),title:card.querySelector('strong').textContent});
   const popup=document.createElement('div'),title=document.createElement('strong'),caption=document.createElement('p'),link=card.querySelector('a').cloneNode(true);
   title.textContent=card.querySelector('strong').textContent;caption.textContent=card.dataset.region+' · '+card.dataset.status;popup.append(title,caption,link);marker.bindPopup(popup);markers.set(card,marker);
   const select=()=>{cards.forEach(c=>c.classList.toggle('selected',c===card));map.setView(marker.getLatLng(),8,{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});marker.openPopup()};
   card.querySelector('button').onclick=select;marker.on('click',()=>cards.forEach(c=>c.classList.toggle('selected',c===card)));
  });
  function fit(){if(group.getLayers().length)map.fitBounds(group.getBounds(),{padding:[45,45],maxZoom:8,animate:false});else map.setView([57,45],4)}
  function filter(){group.clearLayers();let n=0;cards.forEach(card=>{const show=(!region.value||card.dataset.region===region.value)&&(!phase.value||card.dataset.status===phase.value);card.hidden=!show;if(show){markers.get(card).addTo(group);n++}});document.querySelector('.map-count').textContent='Объектов на карте: '+n;fit()}
  region.onchange=filter;phase.onchange=filter;document.querySelector('.map-fit').onclick=()=>{region.value='';phase.value='';filter()};filter();
  new ResizeObserver(()=>map.invalidateSize()).observe(root);
 };
 if(document.readyState==='complete')init();else window.addEventListener('load',init,{once:true});
}
// Demo forms keep file-selection interactions without accepting enquiries.
const demo=document.querySelector('#demo-project-form');
if(demo){demo.addEventListener('submit',ev=>ev.preventDefault());const input=demo.querySelector('[type=file]'),output=demo.querySelector('#selected-files');input?.addEventListener('change',()=>{output.replaceChildren();[...input.files].slice(0,5).forEach(f=>{const row=document.createElement('li');row.textContent=f.name+' — файл не отправляется';output.append(row)})});}
