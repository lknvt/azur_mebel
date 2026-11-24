/* Каталог AZUR (макет). Все данные в одном месте: главные, категории и карточки берут товары отсюда. */
window.AZ = (function(){
  const moods = [
    {k:'sage',  n:'Шалфей', c:'#9DB5A3'},
    {k:'blush', n:'Пудра',  c:'#E6B7A6'},
    {k:'lav',   n:'Лаванда',c:'#B9A6D9'},
    {k:'butter',n:'Масло',  c:'#EBD58A'},
    {k:'sky',   n:'Небо',   c:'#A9BFD3'}
  ];
  const cats = [
    {k:'sofas',    n:'Диваны',            d:'Угловые и прямые диваны для лаунж-зоны', i:'f05', pos:'50% 55%'},
    {k:'armchairs',n:'Кресла',            d:'Лаунж-кресла и подвесные кресла',        i:'f15', pos:'68% 50%'},
    {k:'dining',   n:'Обеденные группы',  d:'Столы и стулья для ужинов на воздухе',   i:'f12', pos:'50% 55%'},
    {k:'loungers', n:'Шезлонги и дэйбеды',d:'Для отдыха у бассейна и под перголой',   i:'f10', pos:'38% 55%'}
  ];
  const products = [
    {id:'vasca',    n:'Vasca',    v:'Угловой диван',     c:'sofas',    m:'sage',  i:'f05',pos:'50% 55%',mat:'Тик · Лён',          d:'Угловой диван на каркасе из тика с низким столом. Подушки шалфейного цвета, мягкая глубокая посадка.'},
    {id:'exee',     n:'Exee',     v:'Трёхместный диван', c:'sofas',    m:'sage',  i:'f14',pos:'45% 55%',mat:'Тик · Лён',          d:'Трёхместный диван с массивными тиковыми подлокотниками. Спокойная форма, которая подходит и дому, и ресторану.'},
    {id:'visconti', n:'Visconti', v:'Лаунж-группа',      c:'sofas',    m:'sage',  i:'f20',pos:'40% 55%',mat:'Тик · Лён',          d:'Угловой диван и стол из тика для террасы на крыше. Модули можно переставлять под форму пространства.'},
    {id:'veranda',  n:'Veranda',  v:'Угловой диван',     c:'sofas',    m:'butter',i:'f25',pos:'50% 60%',mat:'Тик · Лён',          d:'Угловой диван кремово-жёлтого цвета для крытой веранды. Тёплый свет и светлые ткани.'},
    {id:'borromeo', n:'Borromeo', v:'Лаунж-кресло',      c:'armchairs',m:'blush', i:'f15',pos:'68% 50%',mat:'Тик · Лён',          d:'Глубокая посадка и тёплое дерево в деталях. Пудровые подушки, которые легко сочетаются с любой зеленью.'},
    {id:'cocoon',   n:'Cocoon',   v:'Подвесное кресло',  c:'armchairs',m:'lav',   i:'f07',pos:'36% 50%',mat:'Плетение · Лён',     d:'Подвесное плетёное кресло для чтения и тишины. Мягкая подушка лавандового цвета.'},
    {id:'courtyard',n:'Courtyard',v:'Лаунж-кресла',      c:'armchairs',m:'lav',   i:'f23',pos:'30% 60%',mat:'Тик · Лён',          d:'Два лаунж-кресла и приставной стол для двора или маленького сада.'},
    {id:'terrace',  n:'Terrace',  v:'Столы и стулья',    c:'dining',   m:'blush', i:'f21',pos:'45% 55%',mat:'Тик · Лён',          d:'Обеденные столы и стулья с розово-персиковыми подушками. Для ресторана, кафе и отеля.'},
    {id:'nofi',     n:'Nofi 2.0', v:'Обеденная группа',  c:'dining',   m:'sky',   i:'f12',pos:'50% 55%',mat:'Тик · Лён',          d:'Обеденный стол и стулья с серо-голубыми подушками для долгих ужинов на воздухе.'},
    {id:'heck',     n:'Heck',     v:'Шезлонг',           c:'loungers', m:'butter',i:'f10',pos:'38% 55%',mat:'Тик · Лён',          d:'Шезлонг с регулируемой спинкой и масляно-жёлтым матрасом для отдыха у бассейна.'},
    {id:'heck2',    n:'Heck II',  v:'Шезлонг на раме',   c:'loungers', m:'butter',i:'f09',pos:'50% 55%',mat:'Тик · Лён',          d:'Шезлонг на тиковой раме с мягким матрасом. Лёгкий и устойчивый.'},
    {id:'daybed',   n:'Daybed',   v:'Дэйбед',            c:'loungers', m:'sky',   i:'f18',pos:'50% 60%',mat:'Тик · Лён',          d:'Дэйбед из тика под перголой для долгих вечеров. Серо-голубые подушки и льняной плед.'},
    {id:'pool',     n:'Pool',     v:'Шезлонги',          c:'loungers', m:'sky',   i:'f01',pos:'35% 60%',mat:'Тик · Лён',          d:'Пара шезлонгов с голубыми подушками и приставным столиком у бассейна.'}
  ];
  const scenes = {
    sage:['f19_m','f03_m'], blush:['f21_m','f22_m'], lav:['f23_m','f17_m'],
    butter:['f25_m','f17_m'], sky:['f01_m','f03_m']
  };
  const byId = id => products.find(p=>p.id===id);
  const mood = k => moods.find(m=>m.k===k);
  const cat  = k => cats.find(c=>c.k===k);
  const gallery = p => [ p.i, ...(scenes[p.m]||[]).slice(0,2) ];   // ключи файлов в img/
  const src = (k,pos) => 'img/'+k+'.jpg';
  const related = (p,n=4) => {
    const r = products.filter(x=>x.id!==p.id && (x.c===p.c || x.m===p.m));
    return r.sort((a,b)=>(b.c===p.c)-(a.c===p.c)).slice(0,n);
  };
  const URLS = {
    1:{home:'variant-1.html',catalog:'variant-1-catalog.html',product:'variant-1-product.html'},
    2:{home:'variant-2.html',catalog:'variant-2-catalog.html',product:'variant-2-product.html'},
    3:{home:'variant-3.html',catalog:'variant-3-catalog.html',product:'variant-3-product.html'}
  };
  const V = +(document.documentElement.getAttribute('data-v')||1);
  const link = {
    catalog:(cat,extra)=> URLS[V].catalog + (cat?('?cat='+cat):'') + (extra||''),
    product:id=> URLS[V].product+'?id='+id,
    home:h=> URLS[V].home + (h||'')
  };
  return {moods,cats,products,scenes,byId,mood,cat,gallery,src,related,link,V,
    WA:'https://wa.me/996553387878?text=', enc:encodeURIComponent};
})();
