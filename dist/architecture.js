const root=document.querySelector('#objects-map');
if(root){
 const cards=[...document.querySelectorAll('.map-project')],region=document.querySelector('#map-region'),phase=document.querySelector('#map-status'),status=document.querySelector('.map-loading');
 const frame=document.createElement('iframe');frame.title='Карта объектов Google Maps';frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';frame.allowFullscreen=true;root.append(frame);
 const external=document.querySelector('.google-map-link');
 function show(card){
  cards.forEach(c=>c.classList.toggle('selected',c===card));
  const query=card?card.dataset.lat+','+card.dataset.lng:'Россия';
  frame.src='https://www.google.com/maps?q='+encodeURIComponent(query)+'&hl=ru&z='+(card?'10':'4')+'&output=embed';
  frame.title=card?'Google Maps — '+card.querySelector('strong').textContent:'Google Maps — обзор';
  external.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query);
  status.textContent=card?card.querySelector('strong').textContent:'Выберите объект в списке';
 }
 cards.forEach(card=>card.querySelector('button').onclick=()=>show(card));
 function filter(){const visible=cards.filter(card=>{const yes=(!region.value||card.dataset.region===region.value)&&(!phase.value||card.dataset.status===phase.value);card.hidden=!yes;return yes;});document.querySelector('.map-count').textContent='Найдено объектов: '+visible.length;show(visible[0]);if(!visible.length)status.textContent='По выбранным условиям объектов нет';}
 region.onchange=filter;phase.onchange=filter;document.querySelector('.map-fit').onclick=()=>{region.value='';phase.value='';filter()};filter();
}
// Demo forms keep file-selection interactions without accepting enquiries.
const demo=document.querySelector('#demo-project-form');
if(demo){demo.addEventListener('submit',ev=>ev.preventDefault());const input=demo.querySelector('[type=file]'),output=demo.querySelector('#selected-files');input?.addEventListener('change',()=>{output.replaceChildren();[...input.files].slice(0,5).forEach(f=>{const row=document.createElement('li');row.textContent=f.name+' — файл не отправляется';output.append(row)})});}
