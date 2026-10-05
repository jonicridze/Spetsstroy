const root=document.querySelector('#objects-map');
if(root){
 const cards=[...document.querySelectorAll('.map-project')];
 const region=document.querySelector('#map-region');
 const phase=document.querySelector('#map-status');
 const status=document.querySelector('.map-loading');
 const frame=document.createElement('iframe');
 frame.title='Карта объектов Яндекс';frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';frame.allowFullscreen=true;
 root.append(frame);
 const external=document.querySelector('.yandex-map-link');
 let selected=null;
 function show(){
  const visible=cards.filter(c=>!c.hidden);
  const points=visible.map(c=>`${c.dataset.lng},${c.dataset.lat},pm2rdl`).join('~');
  const focus=selected&&!selected.hidden?selected:visible[0];
  const center=focus?`${focus.dataset.lng},${focus.dataset.lat}`:'42,57';
  const zoom=selected?8:(visible.length>1?4:7);
  const suffix=points?'&pt='+encodeURIComponent(points):'';
  frame.src='https://yandex.ru/map-widget/v1/?ll='+encodeURIComponent(center)+'&z='+zoom+'&l=map'+suffix+'&lang=ru_RU';
  frame.title=focus?'Яндекс.Карты — '+focus.querySelector('strong').textContent:'Яндекс.Карты — объекты ССТ';
  external.href='https://yandex.ru/maps/?ll='+encodeURIComponent(center)+'&z='+zoom+'&l=map'+suffix;
  status.textContent=focus?focus.querySelector('strong').textContent:'Объекты не найдены';
 }
 cards.forEach(card=>card.querySelector('button').onclick=()=>{selected=card;cards.forEach(c=>c.classList.toggle('selected',c===card));show()});
 function filter(){selected=null;const visible=cards.filter(card=>{const yes=(!region.value||card.dataset.region===region.value)&&(!phase.value||card.dataset.status===phase.value);card.hidden=!yes;return yes});document.querySelector('.map-count').textContent='Найдено объектов: '+visible.length;show()}
 region.onchange=filter;phase.onchange=filter;document.querySelector('.map-fit').onclick=()=>{region.value='';phase.value='';filter()};filter();
}
const demo=document.querySelector('#demo-project-form');
if(demo){demo.addEventListener('submit',ev=>ev.preventDefault());const input=demo.querySelector('[type=file]'),output=demo.querySelector('#selected-files');input?.addEventListener('change',()=>{output.replaceChildren();[...input.files].slice(0,5).forEach(f=>{const row=document.createElement('li');row.textContent=f.name+' — файл не отправляется';output.append(row)})});}
