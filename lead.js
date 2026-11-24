/* AzurLead — окно «Оставить заявку» и встроенные формы.
   Заявка уходит в Netlify Forms (форма name="lead" есть на каждой странице) и дублируется кнопкой в WhatsApp.
   На localhost и file:// отправка имитируется, чтобы можно было проверять макет без сервера. */
(function(){
  const AZ = window.AZ, $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>[...r.querySelectorAll(s)];
  const DAYS = ['вс','пн','вт','ср','чт','пт','сб'];
  const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol==='file:';

  const TYPES = {
    general:{title:'Оставить заявку',     sub:'Расскажите, что вы ищете, и мы подберём мебель и пришлём предложение.', btn:'Отправить заявку', img:'f19_m'},
    product:{title:'Получить расчёт',     sub:'Оставьте контакты — уточним наличие, цвет ткани и стоимость выбранной модели.', btn:'Получить расчёт', img:'f23_m'},
    showroom:{title:'Записаться в шоурум',sub:'Приезжайте посмотреть мебель вживую: ул. Исакеева 1/1, ежедневно 9:00–18:00.', btn:'Записаться', img:'f03_m'},
    b2b:{title:'Проект для бизнеса',      sub:'Ресторан, отель, терраса офиса. Опишите задачу, и мы рассчитаем комплект.', btn:'Рассчитать проект', img:'f21_m'}
  };
  const INTERESTS = ['Лаунж-зона','Обеденная группа','Отдых и шезлонги','Подвесное кресло','Пока не знаю'];
  const B2B = ['Ресторан или кафе','Отель','Терраса офиса','Частный дом'];
  const NEXT = ['Получим заявку и посмотрим, что вам нужно','Свяжемся в WhatsApp или по телефону в рабочее время','Подберём комплект и пришлём предложение'];

  let state = null;

  /* ---------- маска телефона ---------- */
  function fmtPhone(v){
    let d = v.replace(/\D/g,'');
    if(d.startsWith('996')) d = d.slice(3);
    if(d.startsWith('0')) d = d.slice(1);
    d = d.slice(0,9);
    let o = '+996';
    if(d.length) o += ' '+d.slice(0,3);
    if(d.length>3) o += ' '+d.slice(3,5);
    if(d.length>5) o += ' '+d.slice(5,7);
    if(d.length>7) o += ' '+d.slice(7,9);
    return o;
  }
  const phoneOk = v => v.replace(/\D/g,'').replace(/^996/,'').length===9;
  function bindPhone(inp){
    inp.addEventListener('focus',()=>{ if(!inp.value) inp.value='+996 '; });
    inp.addEventListener('input',()=>{ inp.value = fmtPhone(inp.value); });
    inp.addEventListener('blur',()=>{ if(inp.value.trim()==='+996') inp.value=''; });
  }

  /* ---------- отправка ---------- */
  async function send(data){
    const body = new URLSearchParams({'form-name':'lead', ...data});
    if(isLocal || /(github\.io|pages\.dev)$/.test(location.hostname)){ await new Promise(r=>setTimeout(r,700)); return true; }
    try{
      const r = await fetch('/', {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString()});
      return r.ok;
    }catch(e){ return false; }
  }
  function waText(d){
    const L = ['Здравствуйте! Оставляю заявку на сайте AZUR.'];
    L.push('Тема: '+d.topic);
    if(d.product) L.push('Модель: '+d.product);
    if(d.interest) L.push('Интересует: '+d.interest);
    if(d.object) L.push('Объект: '+d.object);
    if(d.visit) L.push('Визит в шоурум: '+d.visit);
    if(d.comment) L.push('Комментарий: '+d.comment);
    L.push('Имя: '+d.name, 'Телефон: '+d.phone);
    return L.join('\n');
  }

  /* ---------- модальное окно ---------- */
  function root(){
    let ov = $('#lmOv');
    if(ov) return ov;
    ov = document.createElement('div');
    ov.id='lmOv'; ov.className='lm-ov'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true');
    ov.innerHTML='<div class="lm" id="lmBox"></div>';
    document.body.appendChild(ov);
    ov.addEventListener('mousedown',e=>{ if(e.target===ov) close(); });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); });
    return ov;
  }
  let pushed=false;
  function hide(){ const ov=$('#lmOv'); if(ov) ov.classList.remove('on'); document.documentElement.style.overflow=''; }
  function close(){ const wasPushed=pushed; pushed=false; hide(); if(wasPushed && history.state && history.state.lm){ try{ history.back(); }catch(e){} } }
  window.addEventListener('popstate',()=>{ if(pushed){ pushed=false; hide(); } });

  function chips(name,list,sel){
    return `<div class="lm-chips" data-name="${name}">${list.map((x,i)=>`<button type="button" class="${x===sel||(!sel&&i===0&&name==='contact')?'on':''}" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>`;
  }
  function daysChips(){
    const a=[]; for(let i=0;i<6;i++){ const x=new Date(); x.setDate(x.getDate()+i); a.push((i?DAYS[x.getDay()]+' ':'сегодня ')+x.getDate()+'.'+String(x.getMonth()+1).padStart(2,'0')); }
    return a;
  }

  function open(opts){
    opts = opts||{};
    const type = TYPES[opts.type]?opts.type:'general';
    const T = TYPES[type];
    const prod = opts.product ? AZ.byId(opts.product) : null;
    state = {type, source: opts.source||'', product: prod?(prod.n+' · '+prod.v):''};
    const ov = root(), box = $('#lmBox');
    const img = prod ? prod.i : T.img;
    let extra = '';
    if(type==='showroom'){
      extra = `<div><span class="lm-lab">День</span>${chips('day',daysChips(),'')}</div>
               <div><span class="lm-lab">Время</span>${chips('time',['10:00','11:30','13:00','14:30','16:00','17:00'],'')}</div>`;
    }
    box.innerHTML = `
      <button class="lm-x" type="button" aria-label="Закрыть">✕</button>
      <div class="lm-side"><img src="img/${img}.jpg" alt=""><div class="lm-next"><b>Что будет дальше</b><ol>${NEXT.map(x=>`<li>${x}</li>`).join('')}</ol></div></div>
      <div class="lm-body" id="lmBody">
        <h3>${T.title}</h3><p class="lm-sub">${T.sub}</p>
        ${prod?`<div class="lm-prod"><img src="img/${prod.i}.jpg" style="object-position:${prod.pos}" alt=""><div><b>${esc(prod.n)}</b><span>${esc(prod.v)} · ${esc(prod.mat)}</span></div></div>`:''}
        <form class="lm-f" id="lmForm" novalidate>
          <div class="lm-row">
            <div class="lm-fld" data-f="name"><label>Ваше имя</label><input name="name" autocomplete="name" placeholder="Как к вам обращаться"><div class="lm-err">Напишите имя</div></div>
            <div class="lm-fld" data-f="phone"><label>Телефон</label><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+996 ___ __ __ __"><div class="lm-err">Введите номер полностью</div></div>
          </div>
          ${extra}
          <div class="lm-hp"><label>Не заполняйте <input name="bot-field" tabindex="-1" autocomplete="off"></label></div>
          <button class="lm-go" type="submit">${T.btn} →</button>
          <p class="lm-note">Нажимая кнопку, вы соглашаетесь на обработку контактных данных. Ответим в рабочее время: ежедневно 9:00–18:00.</p>
        </form>
      </div>`;
    $('.lm-x',box).onclick = close;
    $$('.lm-chips',box).forEach(g=>g.addEventListener('click',e=>{
      const b=e.target.closest('button'); if(!b) return;
      const multi = false;
      const was = b.classList.contains('on');
      if(!multi) $$('button',g).forEach(x=>x.classList.remove('on'));
      if(!(was && g.dataset.name!=='contact')) b.classList.add('on');
    }));
    bindPhone($('input[name=phone]',box));
    $('#lmForm',box).addEventListener('submit',e=>{ e.preventDefault(); submit(box,type); });
    ov.classList.add('on'); document.documentElement.style.overflow='hidden';
    try{ history.pushState({lm:1},''); pushed=true; }catch(e){}
    setTimeout(()=>{ const f=$('input[name=name]',box); f&&f.focus(); },60);
  }

  function collect(box,type){
    const val = n => { const e=$(`[name=${n}]`,box); return e?e.value.trim():''; };
    const chip = n => { const g=$(`.lm-chips[data-name=${n}] .on`,box); return g?g.dataset.v:''; };
    const d = {
      name:val('name'), phone:val('phone'), contact:chip('contact')||'WhatsApp',
      type, topic:TYPES[type].title, product:state.product||'', source:state.source||'',
      page:location.pathname.split('/').pop()||'index', comment:val('comment'),
      interest:chip('interest'), object:chip('object'), size:val('size'),
      visit:(chip('day')&&chip('time'))?(chip('day')+', '+chip('time')):(chip('day')||chip('time')),
      'bot-field':val('bot-field')
    };
    return d;
  }

  async function submit(box,type){
    const d = collect(box,type);
    let ok = true;
    const nf=$('[data-f=name]',box), pf=$('[data-f=phone]',box);
    nf.classList.toggle('err', d.name.length<2); pf.classList.toggle('err', !phoneOk(d.phone));
    if(d.name.length<2||!phoneOk(d.phone)){ (d.name.length<2?$('input[name=name]',box):$('input[name=phone]',box)).focus(); return; }
    if(type==='showroom' && (!$('.lm-chips[data-name=day] .on',box)||!$('.lm-chips[data-name=time] .on',box))){
      d.comment = (d.comment?d.comment+' · ':'')+'день/время не выбраны';
    }
    const btn=$('.lm-go',box); btn.disabled=true; btn.textContent='Отправляем…';
    ok = d['bot-field'] ? true : await send(d);   // робот: молча «успех» без отправки
    const body=$('#lmBody',box);
    const wa = AZ.WA+AZ.enc(waText(d));
    if(ok){
      const lines=[['Имя',d.name],['Телефон',d.phone],['Связь',d.contact]];
      if(d.product) lines.push(['Модель',d.product]);
      if(d.interest) lines.push(['Интересует',d.interest]);
      if(d.object) lines.push(['Объект',d.object+(d.size?', '+d.size:'')]);
      if(d.visit) lines.push(['Визит',d.visit]);
      body.innerHTML=`<div class="lm-ok"><i>✓</i><h3>Спасибо, ${esc(d.name)}!</h3>
        <p>Заявка принята. Мы свяжемся с вами ${d.contact==='Звонок'?'по телефону':d.contact==='Telegram'?'в Telegram':'в WhatsApp'} в рабочее время: ежедневно с 9:00 до 18:00.</p>
        <div class="lm-sum">${lines.map(l=>`<div><span>${l[0]}:</span> ${esc(l[1])}</div>`).join('')}</div>
        <div class="lm-acts"><a class="pri" href="${wa}" target="_blank" rel="noopener">Написать в WhatsApp</a><button type="button" id="lmClose">Закрыть</button></div></div>`;
      $('#lmClose',body).onclick=close;
      try{ localStorage.setItem('azur_lead_name',d.name); }catch(e){}
    }else{
      body.innerHTML=`<div class="lm-ok"><i>!</i><h3>Не удалось отправить</h3>
        <p>Что-то пошло не так со связью. Нажмите кнопку, и ваша заявка уйдёт нам в WhatsApp с уже заполненным текстом.</p>
        <div class="lm-acts"><a class="pri" href="${wa}" target="_blank" rel="noopener">Отправить в WhatsApp</a><button type="button" id="lmClose">Закрыть</button></div></div>`;
      $('#lmClose',body).onclick=close;
    }
  }

  /* ---------- встроенная форма (имя + телефон) ---------- */
  function inline(el){
    const type = el.dataset.leadInline||'general', T=TYPES[type]||TYPES.general;
    el.innerHTML = `<form class="lm-inline" novalidate>
      <div class="lm-fld" data-f="name"><label>Ваше имя</label><input name="name" autocomplete="name" placeholder="Как к вам обращаться"><div class="lm-err">Напишите имя</div></div>
      <div class="lm-fld" data-f="phone"><label>Телефон</label><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+996 ___ __ __ __"><div class="lm-err">Введите номер полностью</div></div>
      <div class="lm-hp"><input name="bot-field" tabindex="-1" autocomplete="off"></div>
      <button class="lm-go" type="submit">${T.btn} →</button></form>
      <p class="lm-note" style="margin-top:10px">Нажимая кнопку, вы соглашаетесь на обработку контактных данных. Ответим в рабочее время: ежедневно 9:00–18:00.</p>`;
    bindPhone($('input[name=phone]',el));
    $('form',el).addEventListener('submit',async e=>{
      e.preventDefault();
      const g=n=>$(`[name=${n}]`,el).value.trim();
      const d={name:g('name'),phone:g('phone'),contact:'WhatsApp',type,topic:T.title,product:'',source:el.dataset.source||'inline',page:location.pathname.split('/').pop()||'index',comment:'',interest:'',object:'',size:'',visit:'','bot-field':g('bot-field')};
      $('[data-f=name]',el).classList.toggle('err',d.name.length<2); $('[data-f=phone]',el).classList.toggle('err',!phoneOk(d.phone));
      if(d.name.length<2||!phoneOk(d.phone)) return;
      const b=$('.lm-go',el); b.disabled=true; b.textContent='Отправляем…';
      const ok = d['bot-field']?true:await send(d);
      const wa = AZ.WA+AZ.enc(waText(d));
      el.innerHTML = ok
        ? `<div class="lm-inline-ok"><b>Спасибо, ${esc(d.name)}! Заявка принята.</b><span>Ответим в рабочее время, ежедневно 9:00–18:00.</span><a class="lm-go" style="width:auto;text-decoration:none" href="${wa}" target="_blank" rel="noopener">Написать в WhatsApp</a></div>`
        : `<div class="lm-inline-ok"><b>Не удалось отправить.</b><a class="lm-go" style="width:auto;text-decoration:none" href="${wa}" target="_blank" rel="noopener">Отправить в WhatsApp</a></div>`;
    });
  }

  /* ---------- делегирование: любой элемент с data-lead открывает окно ---------- */
  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-lead]');
    if(!t) return;
    e.preventDefault();
    open({type:t.dataset.lead, product:t.dataset.product||'', source:t.dataset.source||t.textContent.trim().slice(0,40), interest:t.dataset.interest||''});
  });
  function init(){ $$('[data-lead-inline]').forEach(inline); }
  if(document.readyState!=='loading') init(); else document.addEventListener('DOMContentLoaded',init);


  /* ---------- плавающие кнопки справа снизу ---------- */
  function floatBtns(){
    if(document.querySelector('.fl')) return;
    const d=document.createElement('div');d.className='fl';
    d.innerHTML='<div class="fl-m"><a href="https://wa.me/996553387878" target="_blank" rel="noopener">'+'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l4.9-1.3A10 10 0 1012 2zm0 18.2c-1.5 0-3-.4-4.2-1.200l-.3-.2-3 .8.8-2.900-.2-.3A8.200 8.200 0 1112 20.200zm4.500-6.100c-.2-.1-1.500-.7-1.700-.8-.2-.1-.4-.1-.6.100l-.8 1c-.1.200-.3.200-.5.100-1.500-.7-2.400-1.300-3.400-2.900-.3-.4.300-.4.800-1.300.1-.2 0-.3 0-.5l-.8-1.800c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.100-.7.300-.7.700-1 1.500-1 2.300.1 1 .5 2 1.200 2.800 1.300 1.700 2.900 2.900 4.900 3.600 1.800.6 2.500.5 3.300.4.600-.1 1.500-.6 1.700-1.300.2-.6.2-1.100.1-1.200l-.5-.2z"/></svg>'+'WhatsApp</a><a href="https://www.instagram.com/azur.outdoor.kg/" target="_blank" rel="noopener">'+'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.500" y="3.500" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.200" cy="6.800" r=".8" fill="currentColor"/></svg>'+'Instagram</a><a href="tel:+996553387878">Позвонить</a></div><button class="fl-c" type="button">Связаться с нами</button><button class="fl-a" type="button" data-lead="general" data-source="float">Оставить заявку</button>';
    document.body.appendChild(d);
    d.querySelector('.fl-c').onclick=e=>{e.stopPropagation();d.classList.toggle('open')};
    document.addEventListener('click',e=>{if(!d.contains(e.target))d.classList.remove('open')});
  }
  if(document.readyState!=='loading') floatBtns(); else document.addEventListener('DOMContentLoaded',floatBtns);

  window.AzurLead = {open, close, inline};
})();
