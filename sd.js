// sd.js — логика и разметка квиза «ШАГАЙ ДОМА» (mobile-friendly)
// Требуется в index.html: <canvas id="confetti"></canvas>, <div id="progress"></div>, <div id="screens"></div>

(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const vibrate = n => { try { navigator.vibrate && navigator.vibrate(n || 12); } catch(e) {} };

  // ---- Конфетти (без зависимостей)
  const Confetti = (() => {
    const cnv = $('#confetti');
    const ctx = cnv.getContext('2d');
    let W, H, parts = [], running = false;
    const colors = ['#CF2C02','#E85D04','#FFBA08','#fff'];
    function resize(){ W = cnv.width = innerWidth; H = cnv.height = innerHeight; }
    function spawn(n = 180){
      for (let i=0;i<n;i++) {
        parts.push({
          x: Math.random()*W, y: -10 - Math.random()*H*0.5,
          r: 4 + Math.random()*6, c: colors[(Math.random()*colors.length)|0],
          v: 1 + Math.random()*3, a: Math.random()*6.283, s: 0.02 + Math.random()*0.04
        });
      }
    }
    function draw(){
      if(!running) return;
      ctx.clearRect(0,0,W,H);
      for (const p of parts) {
        p.y += p.v; p.x += Math.sin(p.a += p.s);
        ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      }
      parts = parts.filter(p => p.y < H + 20);
      requestAnimationFrame(draw);
    }
    function burst(){ resize(); spawn(); if(!running){ running = true; draw(); } setTimeout(()=>running=false, 1600); }
    addEventListener('resize', resize); resize();
    return { burst };
  })();

  // ---- Данные, хранилище, прогресс
  const A = JSON.parse(localStorage.getItem('sdq') || '{}'); // ответы
  const progress = $('#progress');
  function footprintSVG(){
    const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
    s.setAttribute('viewBox','0 0 64 64'); s.classList.add('foot');
    s.innerHTML = `
      <path d="M26 38c-7 1-8 8-6 13 3 6 12 7 18 3 5-4 7-12 3-16-3-3-9-1-15 0Z" fill="#E85D04"/>
      <circle cx="19" cy="21" r="5" fill="#FFBA08"/>
      <circle cx="28" cy="18" r="4" fill="#FFBA08"/>
      <circle cx="36" cy="18" r="3.8" fill="#FFBA08"/>
      <circle cx="44" cy="21" r="3.2" fill="#FFBA08"/>
      <circle cx="49" cy="26" r="2.6" fill="#FFBA08"/>`;
    return s;
  }
  for (let i=0;i<15;i++) progress.appendChild(footprintSVG());
  function setProgress(i){ $$('.foot', progress).forEach((el,n)=>el.classList.toggle('is', n <= i)); }

  // ---- Справочники
  const AGE   = ['18–29','30–39','40–49','50+'];
  const BODY  = [['Худощавое','slim'],['Среднее','avg'],['Крупное','large'],['Избыточный вес','obese']];
  const LIFE  = ['Сидячая работа','Умеренно активная','Активная'];
  const EXP   = ['Никогда не занималась','Иногда дома / по видео','Регулярно'];
  const GOAL  = ['Сбросить 3–5 кг','Сбросить 5–10 кг','10+ кг','Поддерживать фигуру / вернуть тонус'];
  const MOT   = ['Для здоровья','Для внешности','Для энергии и лёгкости','Для уверенности в себе'];
  const HARD  = ['Долгая прогулка утомляет','Каждый пролёт по лестнице — испытание','Стыдно включаться в активные игры','Прыжки','Ничего из этого'];
  const HEALTH= ['Диабет','Проблемы со щитовидкой','Гипертония','Боль в суставах','Беременность','Нет'];
  const BAD   = ['Сладкая газировка','Выпечка','Фастфуд','Колбаса/сосиски','Сыр 45%+','Ночные перекусы','Алкоголь чаще 2 р/нед','Сладкий чай/кофе','Очень солёная пища'];
  const GOOD  = ['1.5–2 л воды','Овощи 400 г/день','Фрукты ежедневно','Белок в каждом приёме пищи','10–20 мин растяжки','8 000+ шагов уже сейчас'];

  const save = () => localStorage.setItem('sdq', JSON.stringify(A));

  // ---- Генерация экранов (внутрь #screens)
  const screensRoot = $('#screens');

  const section = (id, html) => `<section class="screen${id==='intro' ? ' is' : ''}" data-id="${id}">${html}</section>`;
  const chips   = (id, arr)   => `<div class="chips" id="${id}">` + arr.map(t => `<button type="button" class="chip" data-v="${t}">${t}</button>`).join('') + `</div>`;
  const opts    = (id, arr)   => `<div class="grid cols2" id="${id}">` + arr.map(t => {
    const label = t.label || t[0] || t;
    const key   = t.key   || t[1] || t;
    return `<label class="opt" data-v="${key}"><span>${label}</span></label>`;
  }).join('') + `</div>`;
  const actions = () => `<div class="actions sticky"><button class="btn ghost" data-prev>Назад</button><button class="btn primary" data-next>Далее</button></div>`;

  const html =
    section('intro', `
      <h1>Узнайте, за сколько недель шагательные тренировки помогут вам похудеть</h1>
      <p class="hint">Ответьте на несколько вопросов — это займёт 1–2 минуты.</p>
      <div class="grid">
        <div>
          <div class="hint">Как к вам обращаться?</div>
          <input id="name" class="text" placeholder="Например, Ирина">
        </div>
      </div>
      <div class="actions sticky">
        <button class="btn primary" id="start" type="button" data-next>Поехали →</button>
      </div>
    `) +
    section('age', `
      <h2>Ваш возраст</h2>
      ${opts('ageOpts', AGE)}${actions()}
    `) +
    section('body', `
      <h2>Телосложение сейчас</h2>
      ${opts('bodyOpts', BODY.map(([l,k])=>({label:l,key:k})))}${actions()}
    `) +
    section('steps', `
      <h2>Сколько шагов вы проходите сейчас в день?</h2>
      <input id="steps" type="range" min="0" max="25000" step="250" value="4000">
      <div class="hint">Сейчас: <b><span id="sv">4000</span> шагов</b>. Добавим мягко +2000.</div>
      ${actions()}
    `) +
    section('bmi', `
      <h2>Давайте посчитаем ИМТ</h2>
      <div class="grid cols2">
        <div><div class="hint">Рост, см</div><input id="h" type="number" class="text" placeholder="165"></div>
        <div><div class="hint">Вес, кг</div><input id="w" type="number" class="text" placeholder="72"></div>
      </div>
      <div id="bmiI" class="hint"></div>
      ${actions()}
    `) +
    section('life', `
      <h2>Образ жизни</h2>
      ${opts('lifeOpts', LIFE)}${actions()}
    `) +
    section('exp', `
      <h2>Опыт тренировок</h2>
      ${opts('expOpts', EXP)}${actions()}
    `) +
    section('goal', `
      <h2>Цель</h2>
      ${opts('goalOpts', GOAL)}${actions()}
    `) +
    section('motivation', `
      <h2>Что вас мотивирует больше всего?</h2>
      ${chips('motChips', MOT)}${actions()}
    `) +
    section('perweek', `
      <h2>Сколько готовы тренироваться в неделю?</h2>
      ${chips('pwChips', ['2 раза','3 раза','4–5 раз','Каждый день 20–30 мин'])}${actions()}
    `) +
    section('hard', `
      <h2>Что сейчас даётся тяжелее всего?</h2>
      ${opts('hardOpts', HARD)}${actions()}
    `) +
    section('health', `
      <h2>Есть ли состояния, которые важно учитывать?</h2>
      ${chips('healthChips', HEALTH)}
      <p class="hint">Если есть сомнения — проконсультируйтесь с врачом.</p>
      ${actions()}
    `) +
    section('nutrition', `
      <h2>Включим работу с питанием?</h2>
      ${opts('nutriOpts', [
        {label:'Буду питаться по меню-конструктору в клубе', key:'menu'},
        {label:'Хочу научиться правильно составлять тарелку', key:'plate'},
        {label:'Нет, пока без питания', key:'no'}
      ])}
      ${actions()}
    `) +
    section('food', `
      <h2>Калькулятор продуктов</h2>
      <p class="hint">Отметьте то, что делаете <b>каждый день</b>.</p>
      ${chips('bad', BAD)}
      <div class="hint" style="margin-top:6px">А это — привычки, которые ускоряют результат:</div>
      ${chips('good', GOOD)}
      <div class="actions sticky">
        <button class="btn ghost" data-prev>Назад</button>
        <button class="btn primary" id="calc">Рассчитать результат →</button>
      </div>
    `) +
    section('loading', `
      <div class="loader">
        <div class="pulse"></div>
        <h2>Прогноз загружается…</h2>
        <p class="hint">Учитываем возраст, ИМТ, активность, шаги и питание.</p>
      </div>
    `) +
    section('result', `
      <h2 id="rTitle">Готово!</h2>
      <div class="counter" id="nums">0 кг · 0 недель</div>
      <p class="hint" id="rSub"></p>
      <div class="actions sticky">
        <button class="btn ghost" data-prev>Назад</button>
        <button class="btn primary" id="toCTA">Перейти к абонементу →</button>
      </div>
    `) +
    section('sale', `
      <h2 id="sTitle">Присоединяйтесь к клубу «ШАГАЙ ДОМА» ⚡</h2>
      <p class="hint" id="sLead"></p>
      <ul>
        <li>Домашние шагательные тренировки 20–30 минут</li>
        <li>Готовые планы на неделю</li>
        <li>Поддержка и мотивация в чате</li>
        <li>Без прыжков и сложной хореографии</li>
      </ul>
      <div class="actions">
        <a class="btn primary" id="cta" href="#" target="_blank" rel="noopener">Получить абонемент со скидкой</a>
        <button class="btn ghost" data-prev>Назад</button>
      </div>
      <p class="hint">Прогноз носит ознакомительный характер.</p>
    `);

  screensRoot.innerHTML = html;

  // ---- Навигация между экранами
  let idx = 0;
  const S = $$('#screens .screen');
  const need = k => !A[k];

  function show(n){
    S[idx].classList.remove('is');
    idx = Math.max(0, Math.min(S.length-1, n));
    S[idx].classList.add('is');
    setProgress(idx);
    scrollTo({ top: 0, behavior: 'smooth' });
  }
  setProgress(0);

  addEventListener('click', e => {
    const next = e.target.closest('[data-next]');
    const prev = e.target.closest('[data-prev]');
    if (next) { vibrate(); goNext(); }
    if (prev) { vibrate(); show(idx-1); }
  });

  function shake(){ S[idx].animate(
    [{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],
    {duration:260}
  ); vibrate(25); }

  function goNext(){
    const id = S[idx].dataset.id;
    if (id==='age'      && need('age'))   return shake();
    if (id==='body'     && need('body'))  return shake();
    if (id==='bmi'      && (!A.h || !A.w))return shake();
    if (id==='life'     && need('life'))  return shake();
    if (id==='exp'      && need('exp'))   return shake();
    if (id==='goal'     && need('goal'))  return shake();
    if (id==='perweek'  && need('perweek')) return shake();
    show(idx+1);
  }

  // ---- Привязки
  $('#name').oninput = e => { A.name = e.target.value.trim(); save(); };
  const steps = $('#steps'), sv = $('#sv');
  steps.oninput = e => { A.steps = +e.target.value; sv.textContent = A.steps; save(); };

  ['h','w'].forEach(id => { $('#'+id).oninput = updateBMI; });
  function updateBMI(){
    const h = +$('#h').value, w = +$('#w').value;
    if (h>0 && w>0) {
      A.h = h; A.w = w; const m = h/100; A.bmi = +(w/(m*m)).toFixed(1); save();
      $('#bmiI').innerHTML = `Ваш ИМТ: <b>${A.bmi}</b>`;
    }
  }

  function selectList(root, key, single){
    root.addEventListener('click', e => {
      const sel = e.target.closest(single ? '.opt' : '.chip');
      if (!sel) return;
      if (single) {
        $$('.opt', root).forEach(x => x.classList.remove('is'));
        sel.classList.add('is');
        A[key] = sel.dataset.v || sel.textContent;
      } else {
        sel.classList.toggle('is');
        A[key] = $$('.chip.is', root).map(x => x.dataset.v || x.textContent);
      }
      save(); vibrate(8);
    });
  }

  selectList($('#ageOpts'),   'age',    true);
  selectList($('#bodyOpts'),  'body',   true);
  selectList($('#lifeOpts'),  'life',   true);
  selectList($('#expOpts'),   'exp',    true);
  selectList($('#goalOpts'),  'goal',   true);
  selectList($('#motChips'),  'mot',    false);
  selectList($('#pwChips'),   'perweek',false);
  selectList($('#hardOpts'),  'hard',   true);
  selectList($('#healthChips'),'health',false);
  selectList($('#bad'),       'bad',    false);
  selectList($('#good'),      'good',   false);
  selectList($('#nutriOpts'), 'nutri',  true);

  // ---- Расчёт результата
  $('#calc').onclick = () => { show(idx+1); setTimeout(calculate, 700); };

  function goalKg(){
    const g = A.goal || '';
    if (g.includes('3–5')) return 4;
    if (g.includes('5–10')) return 8;
    if (g.includes('10+'))  return 12;
    return 3;
  }
  const fAge   = () => /50/.test(A.age||'') ? .88 : /40/.test(A.age||'') ? .94 : /30/.test(A.age||'') ? .98 : 1.06;
  const fLife  = () => /Сидячая/.test(A.life||'') ? .90 : /Умеренно/.test(A.life||'') ? 1.00 : 1.08;
  const fExp   = () => /Никогда/.test(A.exp||'') ? .95 : /Регулярно/.test(A.exp||'') ? 1.08 : 1.00;
  const fBody  = () => A.body==='slim'?.92 : A.body==='avg'?1.00 : A.body==='large'?.96 : A.body==='obese'?.92 : 1.00;

  function fSteps(){
    const now = +A.steps || 4000;
    const add = 2000;
    const t = now + add;
    let boost = 1 + add/10000; // +0.2
    if (now < 3000) boost += .08;
    if (now > 9000) boost -= .06;
    return { f: Math.max(.95, Math.min(1.28, boost)), t };
  }
  function fNutri(){
    let f = 1;
    if (A.nutri==='menu') f += .22;
    else if (A.nutri==='plate') f += .12;
    else f -= .12;
    f -= ((A.bad||[]).length) * .03;
    f += Math.min(((A.good||[]).length) * .02, .10);
    return Math.max(.7, Math.min(1.35, f));
  }
  function fHealth(){
    const h = new Set(A.health || []);
    let f = 1;
    if (h.has('Диабет') || h.has('Проблемы со щитовидкой') || h.has('Гипертония')) f -= .06;
    if (h.has('Боль в суставах')) f -= .04;
    return Math.max(.8, f);
  }
  function rate(){
    let r = .5; // базовый безопасный темп, кг/нед
    const bmi = A.bmi || 26;
    if (bmi >= 30) r += .08; else if (bmi < 23) r -= .08;
    r *= fAge()*fLife()*fExp()*fBody()*fSteps().f*fNutri()*fHealth();
    return Math.max(.25, Math.min(.9, +r.toFixed(2)));
  }

  function calculate(){
    const name = A.name?.trim() || 'Друзья';
    const kg   = goalKg();
    const rt   = rate();
    const wks  = Math.max(4, Math.min(16, Math.ceil(kg / rt)));
    const t    = fSteps().t;

    $('#rTitle').textContent = `${name}, ваш прогноз готов ✨`;
    animateNumber(12, wks, 1400, v => { $('#nums').textContent = `${kg} кг · ${v} недель`; });
    $('#rSub').innerHTML = `Темп <b>${rt} кг/нед</b>, шагов в день: <b>${t.toLocaleString('ru-RU')}</b>`;

    $('#sTitle').textContent = `${name}, присоединяйтесь к клубу «ШАГАЙ ДОМА» ⚡`;
    $('#sLead').innerHTML = `Чтобы прийти к цели ≈<b>${kg} кг</b> за <b>${wks} недель</b>, используйте готовые планы и поддержку — первые изменения уже через 1–2 недели.`;

    // CTA ссылку замени на свой лендинг:
    $('#cta').href = 'https://walk-walk.ru/?utm_source=quiz&utm_medium=cta&utm_campaign=sd_weight_calc';

    Confetti.burst();
    show(idxBy('result'));
  }

  function animateNumber(a,b,d,cb){
    const start = performance.now();
    const ease  = t => 1 - Math.pow(1 - t, 3);
    function frame(now){
      const p = Math.min(1, (now - start) / d);
      cb(Math.round(a + (b - a) * ease(p)));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  const idxBy = id => S.findIndex(s => s.dataset.id === id);
  $('#toCTA').onclick = () => show(idxBy('sale'));

  // ---- Простенький техрежим (?edit=1): редактируй тексты прямо на странице
  (() => {
    const qs = new URLSearchParams(location.search);
    if (qs.get('edit') === '1') {
      const list = $$('#screens h1, #screens h2, #screens p, #screens .hint, .btn');
      list.forEach((el, n) => {
        el.setAttribute('contenteditable','true');
        el.dataset.e = 't' + n;
        el.oninput = () => {
          const m = JSON.parse(localStorage.getItem('sd_copy') || '{}');
          m[el.dataset.e] = el.textContent;
          localStorage.setItem('sd_copy', JSON.stringify(m));
        };
      });
      // применить уже сохранённые правки
      const m = JSON.parse(localStorage.getItem('sd_copy') || '{}');
      Object.entries(m).forEach(([k,v]) => {
        const el = document.querySelector('[data-e="'+k+'"]');
        if (el) el.textContent = v;
      });
    }
  })();

  // ---- Восстановление полей
  if (A.name)  $('#name').value = A.name;
  if (A.steps) { $('#steps').value = A.steps; $('#sv').textContent = A.steps; }
  if (A.h)     $('#h').value = A.h;
  if (A.w)     $('#w').value = A.w;
  if (A.bmi)   $('#bmiI').innerHTML = `Ваш ИМТ: <b>${A.bmi}</b>`;

  // ---- Навигация с клавиатуры (удобно на ПК)
  addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft')  show(idx-1);
  });

})();
