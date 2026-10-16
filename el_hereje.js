'use strict';
// EL HEREJE — VampireBBS 2026
// Toledo, 1492 · Inquisición española · 4 finales · 250 puntos · ~70-90 min

// ─── Estado ───────────────────────────────────────────────────────────────────
const S = {
  room: 'celda',
  inv: ['vela'],
  worn: [],
  flags: {
    velaEncendida: false,
    hebreaLeida: false,
    criptaAbierta: false,
    llaveEncontrada: false,
    geronimoEncontrado: false,
    geronimoHablado: false,
    documentosLeidos: false,
    sinagogaDescubierta: false,
    mapaEncontrado: false,
    guardiaHablado: false,
    guardaSobornado: false,
    palacioVisitado: false,
    acusacionEscrita: false,
    scriptoriumVisitado: false,
    juderiaVisitada: false,
    refectorioVisitado: false,
    porteriaVisitada: false,
    disfracesTomados: false,
    monedasTomadas: false,
    crucifijoExaminado: false,
    finalStarted: false,
  },
  visited: new Set(), score: 0, turns: 0, history: [], histIdx: 0,
};

const HIDDEN_ITEMS = new Set(['llave_cripta']);

// ─── Items ────────────────────────────────────────────────────────────────────
const ITEMS = {
  vela: {
    name: 'Vela de Cera — Media Velada',
    location: 'inv',
    nouns: ['vela','candela','luz','candil','vela cera'],
    desc: () => `Una vela de cera de la capilla. Media velada de luz, quizás menos.\n` +
      (S.flags.velaEncendida
        ? `Está encendida. La llama tiembla con los pasos.`
        : `Sin encender. En el claustro hay oscuridad suficiente como para necesitarla.`),
  },
  biblia_hebrea: {
    name: 'Biblia Hebrea — Sin Encuadernación',
    location: 'celda',
    nouns: ['biblia','hebrea','libro','torat','torá','tora','texto','manuscrito','escrito','biblia hebrea'],
    desc: () => `Un manuscrito sin encuadernación. Escrito a mano en hebreo cuadrado sobre pergamino.\n` +
      `Reconoces las letras: ב·ר·א·ש·י·ת. <em>Bereshit.</em> «En el principio.»\n` +
      (S.flags.hebreaLeida
        ? `Lo has leído todo. Está firmado con una sola letra: י — Yod. La inicial de Jerónimo.\n` +
          `O de su nombre anterior. El que nunca pronuncia.`
        : `En la guarda, en castellano: <em>«Para quien sabe por qué rezamos.»</em>\n` +
          `Letra de Fray Jerónimo. Sin duda. Reconocerías su caligrafía entre mil.`),
  },
  crucifijo: {
    name: 'Crucifijo de Madera — Celda',
    location: 'celda',
    nouns: ['crucifijo','cruz','cristo','colgado','pared'],
    desc: () => `El crucifijo que cuelga sobre tu catre. Trescientos años de madera oscura.\n` +
      `Lo has mirado cada mañana desde novicio.\n` +
      (S.flags.crucifijoExaminado
        ? `Hoy no te dice lo mismo que ayer.`
        : `Hoy, con la biblia hebrea en las manos, no sabes si te condena o te absuelve.`),
  },
  llave_cripta: {
    name: 'Llave de Hierro — Cripta del Convento',
    location: 'biblioteca',
    nouns: ['llave','hierro','llave cripta','llave hierro','llave oxidada'],
    desc: () => `Una llave de hierro oscuro, grande como una mano. ` +
      `Abre la trampilla de la cripta del claustro.\n` +
      `No debería estar aquí. Alguien la escondió entre los libros hace tiempo.`,
  },
  carta_acusacion: {
    name: 'Formulario de Denuncia — Santo Oficio',
    location: 'scriptorium',
    nouns: ['carta','denuncia','formulario','acusacion','acusación','papel','escrito','oficio','formulario denuncia'],
    desc: () => `El formulario oficial del Santo Oficio de la Inquisición.\n` +
      (S.flags.acusacionEscrita
        ? `Lo has rellenado. El nombre de Fray Jerónimo está escrito en el espacio de «acusado».\n` +
          `Tu firma, al pie. No se puede deshacer.`
        : `En blanco. Una línea para el nombre del acusado. Una línea para el acusador.\n` +
          `Dos rayas vacías que contienen todo un destino.`),
  },
  documentos_bautismo: {
    name: 'Documentos de Bautismo — Familia Cresques',
    location: 'cripta',
    nouns: ['documentos','bautismo','papeles','pergaminos','familia','cresques','documentos bautismo','registro'],
    desc: () => `Pergaminos de bautismo de hace treinta años. Familia Cresques, conversos de Toledo.\n` +
      `El padre: Abraham Cresques. El hijo, bautizado: Jerónimo de la Cruz.\n` +
      (S.flags.documentosLeidos
        ? `Fray Jerónimo nació judío. Su conversión fue por decreto, no por fe.\n` +
          `Lleva treinta años siendo algo que no eligió ser.`
        : `Reconoces el apellido Cresques. Cartógrafos. Los mejores de la Península, antes de 1391.`),
  },
  monedas_oro: {
    name: 'Monedas de Oro — Seis Ducados',
    location: 'refectorio',
    nouns: ['monedas','oro','ducados','dinero','moneda','seis ducados','bolsa'],
    desc: () => `Seis ducados de oro. Una fortuna para un fraile.\n` +
      `Las encontraste detrás de una piedra suelta en el refectorio.\n` +
      `No son tuyas. Tampoco son del convento. Son de quien las necesite esta noche.`,
  },
  habito_laico: {
    name: 'Ropa de Laico — Jubón y Capa',
    location: 'cripta',
    nouns: ['ropa','laico','jubon','jubón','capa','disfraz','habito laico','ropa laico','habito','hábito'],
    desc: () => `Un jubón oscuro y una capa corta. Ropa de artesano o mercader.\n` +
      `Con esto puesto, un fraile dominico puede caminar por Toledo sin que lo vean.\n` +
      (S.flags.disfracesTomados ? `Ya la llevas encima.` : `Guardada en un cofre de la cripta.`),
  },
  mapa_huida: {
    name: 'Mapa de Rutas — Frontera con Aragón',
    location: 'sinagoga',
    nouns: ['mapa','rutas','aragon','aragón','frontera','caminos','mapa huida','mapa rutas'],
    desc: () => `Un mapa dibujado a mano. Marcadas en rojo: rutas secundarias hacia la frontera de Aragón.\n` +
      `En el margen, en hebreo: <em>«El camino que nadie vigila al amanecer.»</em>\n` +
      `Con esto, Jerónimo puede cruzar antes de que el Santo Oficio despierte.`,
  },
};

// ─── Salas ────────────────────────────────────────────────────────────────────
const ROOMS = {
  celda: {
    name: 'Tu Celda — Convento de Santo Domingo, Toledo',
    desc: () => `Una celda de piedra. Un catre, una mesa, un crucifijo en la pared.\n` +
      `Esta mañana, al limpiar la celda de Fray Jerónimo — ausente desde ayer — ` +
      `encontraste la biblia entre el colchón y la pared.\n` +
      (S.flags.hebreaLeida
        ? `Ya sabes lo que hay en ella. Ahora tienes que decidir lo que haces.`
        : `Está sobre la mesa. En hebreo. En el convento de la Inquisición.`) +
      `\nAl norte: claustro.`,
    exits: { norte: 'claustro' },
  },
  claustro: {
    name: 'Claustro del Convento',
    desc: () => `El claustro central. Cuatro arcos por lado, una fuente en el centro que lleva días seca.\n` +
      `Al sur: tu celda. Al norte: refectorio. Al este: scriptorium. Al oeste: biblioteca.\n` +
      (S.flags.criptaAbierta
        ? `La trampilla del suelo está abierta. Al fondo de las escaleras: la cripta.`
        : HIDDEN_ITEMS.has('llave_cripta')
          ? `Hay una trampilla de hierro en el suelo del claustro. Cerrada con llave.`
          : `La trampilla del suelo está cerrada, pero llevas la llave.`) +
      ` Abajo: cripta` + (S.flags.criptaAbierta ? `.` : ` (cerrada).`),
    exits: {
      sur: 'celda', norte: 'refectorio', este: 'scriptorium', oeste: 'biblioteca',
      abajo: () => S.flags.criptaAbierta ? 'cripta' : null,
    },
  },
  biblioteca: {
    name: 'Biblioteca del Convento',
    desc: () => `Tres paredes cubiertas de estantes. Pergaminos, incunables, libros encuadernados.\n` +
      `La colección más completa de Toledo después de la catedral.\n` +
      (HIDDEN_ITEMS.has('llave_cripta')
        ? `Entre los estantes del fondo hay algo que brilla débilmente. Un metal oscuro.`
        : ITEMS.llave_cripta.location === 'biblioteca'
          ? `Ves una llave de hierro apoyada en el suelo junto al estante del fondo.`
          : `Los estantes están ordenados. Ya cogiste lo que necesitabas.`) +
      `\nAl este: claustro.`,
    exits: { este: 'claustro' },
  },
  scriptorium: {
    name: 'Scriptorium — Sala de Escritura',
    desc: () => `Pupitres inclinados, tinteros de cuerno, plumas de ganso.\n` +
      `Aquí se copian los textos sagrados. Y también los formularios del Santo Oficio.\n` +
      (ITEMS.carta_acusacion.location === 'scriptorium'
        ? (S.flags.acusacionEscrita
            ? `El formulario de denuncia ya está relleno, sobre el pupitre central.`
            : `Sobre el pupitre central: un formulario en blanco de la Inquisición.`)
        : `Ya tomaste el formulario.`) +
      `\nAl oeste: claustro.`,
    exits: { oeste: 'claustro' },
  },
  refectorio: {
    name: 'Refectorio — Comedor del Convento',
    desc: () => `El comedor. Mesas largas de roble, bancos de piedra. La cena de hace horas, sin recoger.\n` +
      (ITEMS.monedas_oro.location === 'refectorio'
        ? `Hay una piedra suelta en la pared norte. Algo la mantiene separada.`
        : `Ya revisaste la pared. El hueco está vacío.`) +
      `\nAl sur: claustro. Al norte: portería.`,
    exits: { sur: 'claustro', norte: 'porteria' },
  },
  porteria: {
    name: 'Portería — Entrada del Convento',
    desc: () => {
      const guard = S.flags.guardaSobornado
        ? `El hermano portero mira hacia otro lado. La puerta está abierta.`
        : S.flags.guardiaHablado
          ? `El hermano portero está en su garita. Sabe que quieres salir. Espera algo.`
          : `El hermano portero está dormitando en su garita. Nadie sale a estas horas sin su conocimiento.`;
      return `La entrada del convento. La puerta hacia la ciudad.\n` + guard +
        `\nAl sur: refectorio. ` +
        (S.flags.guardaSobornado ? `Al norte: Calle de Santo Domingo.` : `Al norte: bloqueado por el portero.`);
    },
    exits: {
      sur: 'refectorio',
      norte: () => S.flags.guardaSobornado ? 'calle' : null,
    },
  },
  cripta: {
    name: 'Cripta del Convento',
    desc: () => `Bajo el claustro. Bóvedas de piedra, nichos con restos de frailes anteriores.\n` +
      `Huele a tierra húmeda y a cera vieja. ` +
      (S.inv.includes('vela') && S.flags.velaEncendida
        ? `La vela ilumina lo justo para moverse.`
        : S.inv.includes('vela')
          ? `Está oscuro. Podrías ENCENDER la vela.`
          : `Está oscuro.`) + `\n` +
      (S.flags.geronimoEncontrado
        ? `Fray Jerónimo está en el nicho del fondo. Te mira sin hablar.`
        : `Al fondo, en uno de los nichos: un bulto oscuro que no debería estar ahí.`) +
      `\nArriba: claustro.`,
    exits: { arriba: 'claustro' },
  },
  calle: {
    name: 'Calle de Santo Domingo — Toledo',
    desc: () => {
      const hora = S.turns > 20
        ? `Las campanas de la catedral acaban de dar las tres. `
        : `Las campanas acaban de sonar la medianoche. `;
      const disfraz = S.inv.includes('habito_laico')
        ? (S.flags.disfracesTomados ? `Llevas ropa de laico. Nadie te reconoce. ` : ``)
        : `Con el hábito dominico, serías identificable al instante. `;
      const mapa = S.inv.includes('mapa_huida') && S.flags.geronimoHablado
        ? `Tienes el mapa. Sabes la ruta. ` : ``;
      const huida = S.inv.includes('habito_laico') && S.inv.includes('mapa_huida') && S.flags.geronimoHablado
        ? `\nPuedes HUIR esta noche.` : ``;
      return `La calle exterior. Toledo de noche, silenciosa y vigilada.\n` +
        hora + disfraz + mapa + huida +
        `\nAl sur: portería. Al este: judería. Al oeste: Palacio del Inquisidor.`;
    },
    exits: { sur: 'porteria', este: 'juderia', oeste: 'palacio' },
  },
  juderia: {
    name: 'La Judería — Toledo (Abandonada desde 1391)',
    desc: () => `El barrio judío de Toledo lleva cien años muerto. Casas vacías, inscripciones borradas.\n` +
      `Pero las paredes guardan lo que la ley quiso destruir.\n` +
      (S.flags.sinagogaDescubierta
        ? `Encontraste la entrada. Al norte: sinagoga oculta.`
        : `Una pared tiene una marca muy tenue: una estrella de seis puntas, casi borrada.\n` +
          `EXAMINA la pared o BUSCA para encontrar lo que se oculta tras ella.`) +
      `\nAl oeste: calle.`,
    exits: {
      oeste: 'calle',
      norte: () => S.flags.sinagogaDescubierta ? 'sinagoga' : null,
    },
  },
  sinagoga: {
    name: 'Sinagoga Oculta — Bajo la Judería',
    desc: () => `Una pequeña sala subterránea. Paredes con azulejos geométricos, una menorá de piedra.\n` +
      `Olía a polvo y a tiempo. Pero alguien estuvo aquí hace poco: hay cera fresca en el suelo.\n` +
      (ITEMS.mapa_huida.location === 'sinagoga'
        ? `Sobre el altar de piedra, doblado con cuidado: un mapa de rutas.`
        : `Ya tomaste el mapa del altar.`) +
      `\nAl sur: judería.`,
    exits: { sur: 'juderia' },
  },
  palacio: {
    name: 'Palacio del Inquisidor — Puerta Principal',
    desc: () => {
      const hora = S.turns > 25
        ? `Las antorchas de la entrada parpadean con el viento del amanecer. `
        : `Las antorchas de la entrada ardían altas. `;
      const opciones = S.flags.acusacionEscrita
        ? `Llevas el formulario de denuncia firmado. Puedes ENTREGAR la acusación.`
        : `Puedes DENUNCIAR a Fray Jerónimo verbalmente, o CONFESAR tu propio silencio.`;
      return `El palacio del Gran Inquisidor Tomás de Torquemada. Esta noche hay guardia.\n` +
        hora + opciones +
        `\nAl este: calle.`;
    },
    exits: { este: 'calle' },
  },
};

// ─── Output ───────────────────────────────────────────────────────────────────
const out  = document.getElementById('out');
const inp  = document.getElementById('inp');
const scEl = document.getElementById('sc');
let printBusy = false, printQueue = [], bootMode = false;

function pr(html, cls = '') {
  printQueue.push({ html, cls });
  if (!printBusy) drainQueue();
}
function blank() { pr('', 'sep'); }

function drainQueue() {
  if (!printQueue.length) { printBusy = false; return; }
  printBusy = true;
  const { html, cls } = printQueue.shift();
  const div = document.createElement('div');
  div.className = 'line' + (cls ? ' ' + cls : '');
  if (bootMode && html) {
    let i = 0;
    div.innerHTML = '';
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent || '';
    const t = setInterval(() => {
      if (i <= text.length) { div.textContent = text.slice(0, i++); out.scrollTop = out.scrollHeight; }
      else { clearInterval(t); div.innerHTML = html; out.scrollTop = out.scrollHeight; drainQueue(); }
    }, 16);
  } else {
    div.innerHTML = html;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
    setTimeout(drainQueue, 0);
  }
}

function flushQueue() { printQueue = []; printBusy = false; }
function updateScore() { scEl.textContent = S.score; }
function addScore(n, reason) {
  S.score = Math.min(250, S.score + n);
  updateScore();
  if (reason) pr(`[+${n} — ${reason}]`, 'dim');
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }

function itemByNoun(t, pool) {
  if (!t) return null;
  const tl = norm(t).replace(/^(el|la|los|las|un|una)\s+/, '');
  pool = pool || [
    ...S.inv,
    ...Object.keys(ITEMS).filter(k => ITEMS[k].location === S.room && !HIDDEN_ITEMS.has(k)),
  ];
  for (const id of pool) {
    const it = ITEMS[id];
    if (!it || HIDDEN_ITEMS.has(id)) continue;
    if (it.nouns && it.nouns.some(n => tl === n || tl.includes(n) || n.includes(tl))) return { id, it };
  }
  return null;
}

function allAtRoom(room) {
  return Object.entries(ITEMS).filter(([id, it]) =>
    it.location === room && !HIDDEN_ITEMS.has(id));
}

function resolvedExits(room) {
  const ex = {};
  for (const [dir, tgt] of Object.entries(ROOMS[room]?.exits || {})) {
    const d = typeof tgt === 'function' ? tgt() : tgt;
    if (d) ex[dir] = d;
  }
  return ex;
}

// ─── Mirar ────────────────────────────────────────────────────────────────────
function doLook() {
  const r = ROOMS[S.room];
  if (!r) return;
  blank();
  pr(r.name, 'loc');
  pr(typeof r.desc === 'function' ? r.desc() : r.desc, 'desc');
  const items = allAtRoom(S.room);
  if (items.length) { blank(); items.forEach(([, it]) => pr(`Ves: <em>${it.name}</em>.`, 'ok')); }
  const ex = resolvedExits(S.room);
  const keys = Object.keys(ex);
  if (keys.length) { blank(); pr('Salidas: ' + keys.join(', ') + '.', 'dim'); }
}

// ─── Movimiento ───────────────────────────────────────────────────────────────
const DIR = {
  norte:'norte',n:'norte',sur:'sur',s:'sur',este:'este',e:'este',
  oeste:'oeste',o:'oeste',arriba:'arriba',up:'arriba',u:'arriba',
  subir:'arriba',bajar:'abajo',
  abajo:'abajo',down:'abajo',d:'abajo',
};

function doGo(rawDir) {
  const dir = DIR[rawDir];
  if (!dir) { pr('Dirección no reconocida.', 'bad'); return; }
  const rawTgt = ROOMS[S.room]?.exits?.[dir];
  const tgt = typeof rawTgt === 'function' ? rawTgt() : rawTgt;
  if (!tgt) {
    if (S.room === 'claustro' && dir === 'abajo' && !S.flags.criptaAbierta) {
      if (S.inv.includes('llave_cripta'))
        pr('La trampilla está cerrada. Usa la llave que llevas para ABRIR la cripta.', 'bad');
      else
        pr('La trampilla está cerrada con llave. Busca la llave en algún lugar del convento.', 'bad');
    } else if (S.room === 'porteria' && dir === 'norte' && !S.flags.guardaSobornado) {
      pr('El hermano portero bloquea la salida. Habla con él o encuentra otra manera.', 'bad');
    } else if (S.room === 'juderia' && dir === 'norte' && !S.flags.sinagogaDescubierta) {
      pr('No ves ninguna entrada. Examina las paredes de la judería.', 'bad');
    } else {
      pr('No hay salida en esa dirección desde aquí.', 'bad');
    }
    return;
  }
  S.room = tgt;
  const first = !S.visited.has(tgt);
  S.visited.add(tgt);
  doLook();
  if (first) _onEnterRoom(tgt);
  _advanceTurn();
}

function _onEnterRoom(room) {
  if (room === 'scriptorium' && !S.flags.scriptoriumVisitado) {
    S.flags.scriptoriumVisitado = true;
    addScore(10, 'scriptorium del convento');
    blank();
    pr('El scriptorium. Los formularios del Santo Oficio están siempre a mano.', 'hint');
    pr('Aquí se escriben las condenas antes de que existan.', 'dim');
  }
  if (room === 'refectorio' && !S.flags.refectorioVisitado) {
    S.flags.refectorioVisitado = true;
    addScore(10, 'refectorio');
    blank();
    pr('La cena de esta noche, sin recoger. Nadie tenía hambre.', 'dim');
    pr('Hay una piedra suelta en la pared norte. Examínala.', 'hint');
  }
  if (room === 'porteria' && !S.flags.porteriaVisitada) {
    S.flags.porteriaVisitada = true;
    addScore(10, 'portería del convento');
    blank();
    pr('El hermano Rodrigo. Lleva veinte años en esta garita.', 'desc');
    pr('No es cruel. Solo obediente. Habla con él.', 'hint');
  }
  if (room === 'cripta' && !S.flags.geronimoEncontrado) {
    S.flags.geronimoEncontrado = true;
    addScore(15, 'Fray Jerónimo encontrado');
    blank();
    pr('Al fondo del nicho, encogido entre sombras: Fray Jerónimo.', 'warn');
    pr('Te mira. No huye. Lleva aquí desde esta mañana, esperando que alguien bajase.', 'desc');
    pr('Habla con él.', 'hint');
  }
  if (room === 'juderia' && !S.flags.juderiaVisitada) {
    S.flags.juderiaVisitada = true;
    addScore(15, 'judería de Toledo');
    blank();
    pr('El barrio judío. Cien años de silencio y piedra borrada.', 'desc');
    pr('Pero hay marcas que no se borran del todo. Examina las paredes.', 'hint');
  }
  if (room === 'sinagoga') {
    blank();
    pr('Una sala subterránea que lleva cien años esperando ser destruida.', 'desc');
    pr('Y aún está en pie.', 'warn');
  }
  if (room === 'palacio' && !S.flags.palacioVisitado) {
    S.flags.palacioVisitado = true;
    addScore(15, 'palacio del Inquisidor');
    blank();
    pr('El palacio de Torquemada. Entraste porque decidiste entrar.', 'warn');
    pr('Todo lo que hagas aquí es voluntario.', 'dim');
  }
}

function _advanceTurn() {
  S.turns++;
  if (S.turns === 5 && !S.flags.llaveEncontrada) {
    pr('La cripta del claustro podría ser un escondite. Necesitas la llave — busca en la biblioteca.', 'hint');
  }
  if (S.turns === 12 && !S.flags.geronimoHablado && S.flags.geronimoEncontrado) {
    pr('Fray Jerónimo te espera en la cripta. Habla con él.', 'hint');
  }
  if (S.turns === 18 && !S.flags.guardaSobornado) {
    pr('Para salir del convento necesitas pasar por la portería. El portero no te deja sin motivo.', 'hint');
  }
  if (S.turns === 25 && !S.flags.finalStarted) {
    pr('El amanecer se acerca. Cuando cante el primer gallo, la ciudad despertará y la decisión ya no será tuya.', 'warn');
  }
  if (S.turns > 30 && S.turns % 10 === 0 && !S.flags.finalStarted) {
    const msgs = [
      'Las campanas de la catedral suenan en la distancia.',
      'En algún lugar del convento, alguien reza maitines.',
      'La biblia hebrea pesa más de lo que pesa.',
    ];
    pr(msgs[Math.floor(S.turns / 10) % msgs.length], 'dim');
  }
}

// ─── Coger / Dejar ────────────────────────────────────────────────────────────
function doTake(t) {
  if (!t) { pr('¿Coger qué?', 'bad'); return; }
  const pool = [...Object.keys(ITEMS).filter(k => ITEMS[k].location === S.room && !HIDDEN_ITEMS.has(k))];
  const r = itemByNoun(t, pool);
  if (!r) {
    const rInv = itemByNoun(t, S.inv);
    if (rInv) { pr('Ya lo llevas encima.', 'hint'); return; }
    pr(`No encuentro «${t}» aquí para coger.`, 'bad'); return;
  }
  const { id, it } = r;
  if (id === 'crucifijo') { pr('El crucifijo está clavado en la pared. No puedes arrancarlo.', 'bad'); return; }
  if (id === 'documentos_bautismo' && S.room !== 'cripta') { pr('No está aquí.', 'bad'); return; }
  S.inv.push(id);
  it.location = 'inv';
  pr(`Coges ${it.name}.`, 'ok');
  if (id === 'llave_cripta' && !S.flags.llaveEncontrada) {
    HIDDEN_ITEMS.delete('llave_cripta');
    S.flags.llaveEncontrada = true;
    addScore(10, 'llave de la cripta encontrada');
  }
  if (id === 'monedas_oro' && !S.flags.monedasTomadas) {
    S.flags.monedasTomadas = true; addScore(10, 'monedas de oro');
  }
  if (id === 'habito_laico' && !S.flags.disfracesTomados) {
    S.flags.disfracesTomados = true; addScore(10, 'ropa de laico recogida');
  }
  if (id === 'mapa_huida' && !S.flags.mapaEncontrado) {
    S.flags.mapaEncontrado = true; addScore(20, 'mapa de rutas a Aragón');
    blank();
    pr('El mapa de huida. Rutas que la Inquisición no vigila de noche.', 'warn');
    if (S.flags.geronimoHablado && S.inv.includes('habito_laico')) {
      pr('Ya tienes todo lo necesario para la huida. Puedes HUIR desde la calle.', 'hint');
    }
  }
  _advanceTurn();
}

function doDrop(t) {
  if (!t) { pr('¿Dejar qué?', 'bad'); return; }
  const tl = norm(t);
  if (tl.includes('biblia') || tl.includes('hebrea') || tl.includes('libro')) {
    pr('No puedes abandonarla. Mientras la tengas, es tu responsabilidad.', 'bad'); return;
  }
  const r = itemByNoun(t, S.inv);
  if (!r) { pr('No llevo eso.', 'bad'); return; }
  const { id, it } = r;
  S.inv = S.inv.filter(x => x !== id);
  it.location = S.room;
  pr(`Dejas ${it.name}.`, 'ok');
}

// ─── Examinar ─────────────────────────────────────────────────────────────────
function doExamine(t) {
  if (!t) { pr('¿Examinar qué?', 'bad'); return; }
  const pool = [
    ...S.inv,
    ...Object.keys(ITEMS).filter(k => ITEMS[k].location === S.room),
  ];
  const r = itemByNoun(t, pool);
  if (!r) {
    const tl = norm(t);
    if ((tl.includes('estante') || tl.includes('libro') || tl.includes('pared') || tl.includes('suelo')) && S.room === 'biblioteca') {
      _examinarBiblioteca(); return;
    }
    if ((tl.includes('pared') || tl.includes('piedra') || tl.includes('muro') || tl.includes('estrella') || tl.includes('marca')) && S.room === 'juderia') {
      _examinarJuderia(); return;
    }
    if ((tl.includes('pared') || tl.includes('piedra') || tl.includes('suelo') || tl.includes('muro')) && S.room === 'refectorio') {
      _examinarRefectorio(); return;
    }
    if ((tl.includes('altar') || tl.includes('menora') || tl.includes('menorá') || tl.includes('sala')) && S.room === 'sinagoga') {
      if (ITEMS.mapa_huida.location === 'sinagoga') {
        pr('Sobre el altar de piedra, doblado con cuidado: un mapa de rutas.', 'ok');
        pr('COGER MAPA para tomarlo.', 'hint');
      } else {
        pr('El altar de piedra. Vacío ahora.', 'dim');
      }
      return;
    }
    if ((tl.includes('nicho') || tl.includes('habitacion') || tl.includes('fondo') || tl.includes('sombra')) && S.room === 'cripta') {
      if (!S.flags.geronimoEncontrado) {
        S.flags.geronimoEncontrado = true; addScore(15, 'Fray Jerónimo encontrado');
        pr('En el nicho del fondo: Fray Jerónimo, encogido entre las sombras.', 'warn');
        pr('Está vivo. Lleva aquí desde esta mañana. Te mira sin hablar.', 'desc');
        pr('Habla con él.', 'hint');
      } else {
        pr('Fray Jerónimo sigue en el nicho del fondo.', 'desc');
      }
      return;
    }
    pr(`No encuentro «${t}» aquí.`, 'bad'); return;
  }
  const { id, it } = r;
  blank();
  pr(it.name, 'big');
  pr(typeof it.desc === 'function' ? it.desc() : it.desc, 'desc');

  if (id === 'crucifijo' && !S.flags.crucifijoExaminado) {
    S.flags.crucifijoExaminado = true;
    addScore(5, 'crucifijo examinado');
  }
  if (id === 'biblia_hebrea' && !S.flags.hebreaLeida) {
    S.flags.hebreaLeida = true;
    addScore(25, 'biblia hebrea leída');
    blank();
    pr('La letra י — Yod. El nombre de Dios abreviado, o el nombre de Jerónimo abreviado.', 'warn');
    pr('No hay diferencia.', 'dim');
    pr('El convento tiene una cripta. Jerónimo sabía que llevarías esto aquí.', 'hint');
  }
  if (id === 'documentos_bautismo' && !S.flags.documentosLeidos) {
    S.flags.documentosLeidos = true;
    addScore(20, 'documentos de bautismo leídos');
    blank();
    pr('Abraham Cresques. Su hijo fue bautizado por decreto real.', 'desc');
    pr('No por fe. Por supervivencia.', 'warn');
    pr('Llevas treinta años rezando junto a un hombre que nunca dejó de ser lo que era.', 'hint');
  }
  if (id === 'carta_acusacion' && S.room === 'scriptorium' && !S.flags.acusacionEscrita) {
    blank();
    pr('El formulario está en blanco. Podrías ESCRIBIR en él para rellenarlo.', 'hint');
  }
  if (id === 'llave_cripta' && HIDDEN_ITEMS.has('llave_cripta')) {
    HIDDEN_ITEMS.delete('llave_cripta');
    S.flags.llaveEncontrada = true;
    addScore(10, 'llave de la cripta encontrada');
    pr('Una llave de hierro, escondida entre los lomos de dos incunables.', 'ok');
    pr('COGER LLAVE para tomarla.', 'hint');
  }
  _advanceTurn();
}

function _examinarBiblioteca() {
  if (HIDDEN_ITEMS.has('llave_cripta')) {
    blank();
    pr('Entre los estantes del fondo, apoyada contra la pared:', 'desc');
    pr('Una llave de hierro grande, casi oculta entre los lomos de dos incunables.', 'ok');
    HIDDEN_ITEMS.delete('llave_cripta');
    S.flags.llaveEncontrada = true;
    addScore(10, 'llave de la cripta encontrada');
    pr('COGER LLAVE para tomarla.', 'hint');
  } else if (ITEMS.llave_cripta.location === 'biblioteca') {
    pr('Ya ves la llave en el suelo junto al estante. COGER LLAVE.', 'hint');
  } else {
    pr('Los estantes. Miles de páginas que alguien consideró dignas de preservar.', 'desc');
    pr('Y miles de páginas que alguien consideró peligrosas de destruir.', 'dim');
  }
  _advanceTurn();
}

function _examinarJuderia() {
  if (!S.flags.sinagogaDescubierta) {
    blank();
    pr('En la pared del fondo: una estrella de seis puntas, casi borrada.', 'ok');
    pr('Y debajo: el contorno de una puerta tapiada con piedras más nuevas.', 'warn');
    pr('Algunas piedras ceden. Encuentras escalones que bajan.', 'ok');
    S.flags.sinagogaDescubierta = true;
    addScore(20, 'sinagoga oculta descubierta');
    pr('La sinagoga está ahora accesible al norte.', 'hint');
  } else {
    pr('La entrada a la sinagoga, al norte. Ya la conoces.', 'hint');
  }
  _advanceTurn();
}

function _examinarRefectorio() {
  if (ITEMS.monedas_oro.location === 'refectorio') {
    blank();
    pr('La piedra norte cede. Detrás: un hueco de palmo y medio.', 'ok');
    pr('Dentro: una bolsa de cuero. La abres.', 'desc');
    pr('Seis ducados de oro. Alguien los dejó aquí para quien los necesitase.', 'ok');
    pr('COGER MONEDAS para tomarlas.', 'hint');
  } else {
    pr('El hueco detrás de la piedra norte. Vacío ya.', 'dim');
  }
  _advanceTurn();
}

function doRead(t) {
  if (!t) { pr('¿Leer qué?', 'bad'); return; }
  const pool = [...S.inv, ...Object.keys(ITEMS).filter(k => ITEMS[k].location === S.room)];
  const r = itemByNoun(t, pool);
  if (r) { doExamine(t); return; }
  pr(`No encuentro «${t}» para leer.`, 'bad');
}

// ─── Acciones especiales ──────────────────────────────────────────────────────
function doAbrir(t) {
  if (!t) { pr('¿Abrir qué?', 'bad'); return; }
  const tl = norm(t);
  if ((tl.includes('cripta') || tl.includes('trampilla') || tl.includes('puerta') || tl.includes('llave')) && S.room === 'claustro') {
    if (S.flags.criptaAbierta) { pr('La trampilla ya está abierta.', 'hint'); return; }
    if (!S.inv.includes('llave_cripta')) { pr('La trampilla está cerrada con llave. Busca la llave.', 'bad'); return; }
    S.flags.criptaAbierta = true;
    addScore(20, 'cripta abierta');
    blank();
    pr('Introduces la llave en la cerradura oxidada. Un chasquido. La trampilla cede.', 'ok');
    pr('Escalones de piedra descienden hacia la oscuridad.', 'desc');
    pr('Acceso al abajo: cripta.', 'hint');
    return;
  }
  pr('No sé cómo abrir eso aquí.', 'bad');
}

function doEncender(t) {
  if (!t || norm(t).includes('vela') || norm(t).includes('candela') || norm(t).includes('luz')) {
    if (!S.inv.includes('vela')) { pr('No llevas ninguna vela.', 'bad'); return; }
    if (S.flags.velaEncendida) { pr('La vela ya está encendida.', 'hint'); return; }
    S.flags.velaEncendida = true;
    addScore(5, 'vela encendida');
    pr('Enciendes la vela. La llama tiembla y se establece.', 'ok');
    pr('La cripta ya no es completamente oscura.', 'hint');
    return;
  }
  pr('No sé cómo encender eso.', 'bad');
}

function doEscribir(t) {
  if (S.room !== 'scriptorium') { pr('Para escribir necesitas un pupitre. El scriptorium es el lugar.', 'bad'); return; }
  if (!ITEMS.carta_acusacion || ITEMS.carta_acusacion.location !== 'scriptorium') {
    pr('No hay un formulario aquí para rellenar.', 'bad'); return;
  }
  if (S.flags.acusacionEscrita) { pr('El formulario ya está escrito. Tu firma ya está puesta.', 'hint'); return; }
  if (!S.flags.hebreaLeida) { pr('¿Qué pondrías en la denuncia? Ni siquiera sabes aún lo que has encontrado.', 'bad'); return; }
  blank();
  pr('Te sientas al pupitre. La pluma en la mano.', 'desc');
  pr('Escribes: <em>«Fray Jerónimo de la Cruz, prior de Santo Domingo, Toledo.»</em>', 'warn');
  pr('La tinta seca rápido. Hay quien dice que así es la mala conciencia.', 'dim');
  S.flags.acusacionEscrita = true;
  addScore(10, 'denuncia escrita');
  pr('El formulario está relleno. Firmado. Real.', 'bad');
  pr('COGER CARTA para tomarlo y llevarlo al palacio.', 'hint');
  ITEMS.carta_acusacion.location = 'scriptorium';
  _advanceTurn();
}

function doSobornar(t) {
  if (S.room !== 'porteria') { pr('El portero está en la portería, no aquí.', 'bad'); return; }
  if (S.flags.guardaSobornado) { pr('El hermano Rodrigo ya ha recibido su compensación.', 'hint'); return; }
  if (!S.inv.includes('monedas_oro')) {
    pr('No tienes nada con qué sobornar al portero. Busca algo de valor en el convento.', 'bad'); return;
  }
  blank();
  pr('Deslizas la bolsa de monedas hacia el hermano Rodrigo.', 'desc');
  pr('Él no la mira. No dice nada. Se gira hacia la pared.', 'dim');
  pr('La puerta está abierta.', 'ok');
  S.flags.guardaSobornado = true;
  addScore(15, 'portero sobornado');
  pr('Acceso al norte: Calle de Santo Domingo.', 'hint');
  _advanceTurn();
}

// ─── NPCs ─────────────────────────────────────────────────────────────────────
function doHablar(t) {
  if (!t) { pr('¿Con quién hablar?', 'bad'); return; }
  const tl = norm(t).replace(/^con\s+/, '');

  if ((tl.includes('jeronimo') || tl.includes('prior') || tl.includes('fraile') || tl.includes('fray') || tl.includes('cresques') || tl.includes('anciano')) && S.room === 'cripta') {
    if (!S.flags.geronimoEncontrado) {
      pr('Fray Jerónimo no está aquí todavía. Busca en el nicho del fondo.', 'bad'); return;
    }
    blank();
    if (!S.flags.geronimoHablado) {
      S.flags.geronimoHablado = true;
      addScore(20, 'Fray Jerónimo — conversación completa');
      pr('"Sabía que vendrías. Nadie más limpiaría mi celda."', 'desc');
      pr('Te mira con calma. Treinta años de práctica en no mostrar miedo.', 'dim');
      blank();
      pr('"Me llamo Yitzhak Cresques. Me bauticé Jerónimo porque la alternativa era morir."', 'warn');
      pr('"Llevo treinta años rezando dos veces. Una para el convento. Otra para mí."', 'desc');
      blank();
      pr('"No te pido que calles. Te pido que elijas con los ojos abiertos."', 'hint');
      pr('"Hay una sinagoga bajo la judería. Hay un mapa en el altar."', 'ok');
      pr('"Si decides ayudarme, tráeme ese mapa y esa ropa de laico que hay en el cofre."', 'hint');
      blank();
      pr('La judería está accesible desde la calle, al este. Para llegar a la calle', 'hint');
      pr('necesitas pasar la portería. El portero puede ser convencido.', 'hint');
    } else {
      pr('"¿Ya tienes el mapa?"', 'desc');
      const tieneMap = S.inv.includes('mapa_huida');
      const tieneHabito = S.inv.includes('habito_laico');
      if (tieneMap && tieneHabito) {
        pr('"Entonces ya puedes salir. Yo te sigo."', 'ok');
        pr('Lleva el mapa a la calle y HUYE.', 'hint');
      } else if (tieneMap) {
        pr('"Falta la ropa. El cofre del rincón."', 'hint');
      } else if (tieneHabito) {
        pr('"Falta el mapa. En la sinagoga, bajo la judería."', 'hint');
      } else {
        pr('"El mapa está en la sinagoga de la judería. La ropa, en ese cofre."', 'hint');
      }
    }
    _advanceTurn(); return;
  }

  if ((tl.includes('rodrigo') || tl.includes('portero') || tl.includes('guardian') || tl.includes('guardián') || tl.includes('hermano') || tl.includes('monje')) && S.room === 'porteria') {
    if (!S.flags.guardiaHablado) { S.flags.guardiaHablado = true; }
    blank();
    pr('"Nadie sale del convento a estas horas, Fray Tomás."', 'desc');
    pr('Lo dice sin crueldad. Es su trabajo.', 'dim');
    if (S.inv.includes('monedas_oro')) {
      pr('"A menos que haya... una razón de peso."', 'gd');
      pr('Puedes SOBORNAR al portero con las monedas.', 'hint');
    } else {
      pr('Necesitas algo que justifique su silencio.', 'hint');
      pr('Las monedas de oro del refectorio podrían servir.', 'hint');
    }
    _advanceTurn(); return;
  }

  pr('No hay nadie con ese nombre aquí.', 'bad');
}

// ─── Inventario / Score / Ayuda ───────────────────────────────────────────────
function doInventario() {
  if (!S.inv.length) { pr('No llevas nada.', 'hint'); return; }
  pr('Llevas encima:', 'ok');
  S.inv.forEach(id => pr(`  ${ITEMS[id].name}`, 'desc'));
}

function doScore() {
  pr(`Puntuación: ${S.score} / 250`, 'ok');
  pr(`Turnos: ${S.turns}`, 'dim');
  pr(`Lugares visitados: ${S.visited.size} / ${Object.keys(ROOMS).length}`, 'dim');
}

function doAyuda() {
  blank();
  pr('COMANDOS — EL HEREJE', 'big');
  pr('──────────────────────────────────────', 'sep');
  pr('NORTE/SUR/ESTE/OESTE/ARRIBA/ABAJO  — Moverte', 'desc');
  pr('MIRAR / M               — Ver el lugar actual', 'desc');
  pr('COGER objeto            — Recoger algo', 'desc');
  pr('DEJAR objeto            — Soltar algo', 'desc');
  pr('EXAMINAR / X objeto     — Examinar en detalle', 'desc');
  pr('LEER objeto             — Leer un documento', 'desc');
  pr('HABLAR [con] persona    — Hablar con alguien', 'desc');
  pr('ABRIR objeto            — Abrir (la cripta, etc.)', 'desc');
  pr('ENCENDER objeto         — Encender la vela', 'desc');
  pr('ESCRIBIR                — Rellenar el formulario (en scriptorium)', 'desc');
  pr('SOBORNAR                — Sobornar al portero (en portería)', 'desc');
  pr('INVENTARIO / I          — Ver lo que llevas', 'desc');
  pr('GUARDAR [1-3]           — Guardar partida', 'desc');
  pr('CARGAR [1-3/AUTO]       — Cargar partida', 'desc');
  blank();
  pr('Decisiones finales (según lugar y objetos):', 'hint');
  pr('  DENUNCIAR — Palacio, para acusar a Jerónimo', 'end1');
  pr('  QUEMAR    — Cripta, con vela + biblia', 'end2');
  pr('  HUIR      — Calle, con disfraz + mapa', 'end3');
  pr('  CONFESAR  — Palacio, para entregarte tú mismo', 'end4');
}

function doCreditos() {
  blank();
  pr('EL HEREJE', 'big');
  pr('Una aventura de drama histórico', 'desc');
  pr('VampireBBS · 2026', 'dim');
  blank();
  pr('Toledo, 1492. El mismo año que Colón llega a América,', 'desc');
  pr('España expulsa a todos sus judíos por decreto real.', 'warn');
  blank();
  pr('Los conversos que se quedaron lo hicieron', 'desc');
  pr('rezando en secreto durante generaciones.', 'dim');
  blank();
  pr('Esto es ficción. Lo otro también fue real.', 'bad');
}

// ─── Guardado ─────────────────────────────────────────────────────────────────
function _serializeState() {
  return JSON.stringify({
    room: S.room, inv: S.inv, worn: S.worn, flags: S.flags,
    visited: [...S.visited], score: S.score, turns: S.turns,
    itemLocs: Object.fromEntries(Object.entries(ITEMS).map(([k,v]) => [k, v.location])),
    hiddenItems: [...HIDDEN_ITEMS],
  });
}
function _loadState(data) {
  const d = JSON.parse(data);
  S.room = d.room; S.inv = d.inv; S.worn = d.worn || [];
  Object.assign(S.flags, d.flags);
  S.visited = new Set(d.visited);
  S.score = d.score; S.turns = d.turns;
  if (d.itemLocs) { for (const [k,v] of Object.entries(d.itemLocs)) { if (ITEMS[k]) ITEMS[k].location = v; } }
  if (d.hiddenItems) { HIDDEN_ITEMS.clear(); d.hiddenItems.forEach(h => HIDDEN_ITEMS.add(h)); }
  updateScore();
}
function _autoSave() { try { localStorage.setItem('hereje_auto', _serializeState()); } catch(_) {} }

function doGuardar(t) {
  const slot = t && ['1','2','3'].includes(t.trim()) ? t.trim() : null;
  if (!slot) { pr('Uso: GUARDAR 1 · GUARDAR 2 · GUARDAR 3', 'hint'); return; }
  try { localStorage.setItem(`hereje_s${slot}`, _serializeState()); pr(`Partida guardada en slot ${slot}.`, 'ok'); }
  catch(e) { pr('Error al guardar.', 'bad'); }
}
function doCargar(t) {
  const s = t && ['1','2','3','auto'].includes(t.trim()) ? t.trim() : null;
  if (!s) { pr('Uso: CARGAR 1/2/3/AUTO', 'hint'); return; }
  const key = s === 'auto' ? 'hereje_auto' : `hereje_s${s}`;
  try {
    const data = localStorage.getItem(key);
    if (!data) { pr(`Slot ${s} vacío.`, 'bad'); return; }
    _loadState(data); pr(`Partida cargada desde slot ${s}.`, 'ok'); blank(); doLook();
  } catch(e) { pr('Error al cargar.', 'bad'); }
}

// ─── Finales ──────────────────────────────────────────────────────────────────
function _finalEnd(pts) {
  addScore(pts, 'decisión tomada');
  blank();
  pr('══ EL HEREJE — FIN ══', 'big');
  pr(`Puntuación final: ${S.score} / 250`, 'ok');
  blank();
  pr('Hay cuatro finales. Escribe CARGAR para volver al último guardado.', 'hint');
  pr('Escribe CREDITOS para los créditos.', 'hint');
}

function doFinalDenuncia() {
  if (S.flags.finalStarted) { pr('Ya has tomado tu decisión.', 'hint'); return; }
  if (S.room !== 'palacio') { pr('Para denunciar tienes que ir al Palacio del Inquisidor.', 'bad'); return; }
  S.flags.finalStarted = true;
  _autoSave();
  blank();
  if (S.flags.acusacionEscrita && S.inv.includes('carta_acusacion')) {
    pr('FINAL I — LA DENUNCIA FIRMADA', 'end1');
    pr('══════════════════════════════', 'sep');
    pr('Entregas el formulario al guardia de la puerta.', 'desc');
    pr('Un formulario con un nombre y una firma. El tuyo.', 'dim');
    blank();
    pr('Antes del amanecer, cuatro alguaciles del Santo Oficio llaman a la cripta.', 'warn');
    pr('Fray Jerónimo — Yitzhak Cresques — es conducido al palacio sin que nadie lo vea.', 'desc');
    blank();
    pr('Dos semanas después, el auto de fe.', 'bad');
    pr('Eres recompensado con un cargo en el tribunal de Toledo.', 'end1');
    blank();
    pr('Cumpliste la ley. La ley de 1492.', 'dim');
    pr('Eso es lo que hiciste.', 'end1');
  } else {
    pr('FINAL I — LA DENUNCIA VERBAL', 'end1');
    pr('═════════════════════════════', 'sep');
    pr('Dices el nombre en voz alta ante el guardia.', 'desc');
    pr('"Fray Jerónimo de la Cruz. Judaizante. Cripta del convento de Santo Domingo."', 'warn');
    blank();
    pr('Las palabras salen solas. No hacía falta escribirlas.', 'dim');
    blank();
    pr('Antes del amanecer, cuatro alguaciles entran al convento.', 'bad');
    pr('El resto es lo que ya sabes.', 'end1');
    blank();
    pr('No firmaste nada. Tu conciencia tampoco.', 'dim');
  }
  _finalEnd(40);
}

function doFinalQuemar() {
  if (S.flags.finalStarted) { pr('Ya has tomado tu decisión.', 'hint'); return; }
  if (S.room !== 'cripta') { pr('Para quemar las evidencias tienes que estar en la cripta.', 'bad'); return; }
  if (!S.inv.includes('biblia_hebrea')) {
    pr('La biblia hebrea es la evidencia principal. Necesitas tenerla contigo.', 'bad');
    pr('Está en tu celda — ve a buscarla y tráela aquí.', 'hint'); return;
  }
  if (!S.inv.includes('vela') || !S.flags.velaEncendida) {
    pr('Necesitas una vela encendida para prender el fuego.', 'bad');
    if (S.inv.includes('vela') && !S.flags.velaEncendida) pr('Tienes la vela. ENCENDER VELA primero.', 'hint');
    return;
  }
  S.flags.finalStarted = true;
  _autoSave();
  blank();
  pr('FINAL III — EL SILENCIO', 'end2');
  pr('════════════════════════', 'sep');
  pr('Acercas la vela a las páginas de la biblia.', 'desc');
  pr('El pergamino arde despacio. Las letras hebreas se apagan de izquierda a derecha.', 'warn');
  blank();
  pr('Quemas también los documentos de bautismo.', 'desc');
  pr('Abraham Cresques, su hijo Yitzhak. Convertido en Jerónimo. Borrado en ceniza.', 'dim');
  blank();
  pr('Cuando la Inquisición busque pruebas, no encontrará nada.', 'ok');
  pr('Fray Jerónimo seguirá en el convento. Seguirá rezando dos veces.', 'desc');
  pr('Y tú seguirás sabiendo lo que sabes.', 'warn');
  blank();
  pr('El silencio como decisión. La complicidad como compasión.', 'end2');
  pr('O viceversa. Depende de quién haga la historia.', 'dim');
  _finalEnd(40);
}

function doFinalHuida() {
  if (S.flags.finalStarted) { pr('Ya has tomado tu decisión.', 'hint'); return; }
  if (S.room !== 'calle') { pr('Para huir necesitas estar en la calle con los objetos necesarios.', 'bad'); return; }
  if (!S.flags.geronimoHablado) { pr('Primero habla con Fray Jerónimo en la cripta. Él debe saber el plan.', 'bad'); return; }
  if (!S.inv.includes('habito_laico')) { pr('Necesitas ropa de laico para no ser reconocido. Está en el cofre de la cripta.', 'bad'); return; }
  if (!S.inv.includes('mapa_huida')) { pr('Necesitas el mapa de rutas. Está en la sinagoga bajo la judería.', 'bad'); return; }
  S.flags.finalStarted = true;
  _autoSave();
  blank();
  pr('FINAL II — LA HUIDA', 'end3');
  pr('════════════════════', 'sep');
  pr('Te cambias el hábito por el jubón de laico en el callejón oscuro.', 'desc');
  pr('Diez minutos después, Fray Jerónimo sale por la puerta trasera del convento.', 'warn');
  blank();
  pr('Camináis en silencio por las calles de Toledo. Dos mercaderes nocturnos.', 'desc');
  pr('Nadie os mira. En 1492, nadie quiere ver demasiado.', 'dim');
  blank();
  pr('El mapa marca el camino secundario al norte. Cuatro horas a pie hasta la frontera de Aragón.', 'ok');
  pr('En Aragón, la Inquisición es más lenta. Hay barcos en los puertos.', 'hint');
  blank();
  pr('Yitzhak Cresques cruza la frontera al amanecer.', 'ok');
  pr('Su nombre sobrevive.', 'end3');
  blank();
  pr('Tú vuelves a Toledo. Con el hábito puesto y una historia preparada.', 'desc');
  pr('Dicen que Fray Jerónimo huyó solo. Nadie puede demostrar lo contrario.', 'dim');
  _finalEnd(40);
}

function doFinalConfesor() {
  if (S.flags.finalStarted) { pr('Ya has tomado tu decisión.', 'hint'); return; }
  if (S.room !== 'palacio') { pr('Para confesarte tienes que ir al Palacio del Inquisidor.', 'bad'); return; }
  S.flags.finalStarted = true;
  _autoSave();
  blank();
  pr('FINAL IV — LA CONFESIÓN', 'end4');
  pr('════════════════════════', 'sep');
  pr('Pides audiencia con el Gran Inquisidor.', 'desc');
  pr('Eres conducido a una sala sin ventanas.', 'dim');
  blank();
  pr('"Encontré una biblia hebrea en la celda de Fray Jerónimo."', 'warn');
  pr('"La encontré ayer por la mañana."', 'desc');
  pr('"Tardé en denunciarlo. Tardé demasiado."', 'bad');
  blank();
  pr('El inquisidor te mira largo rato.', 'dim');
  pr('"¿Y el hereje?"', 'warn');
  pr('"No lo sé. Cuando volví a buscarlo, no estaba."', 'desc');
  blank();
  pr('La sala sin ventanas. La silla de madera.', 'dim');
  pr('La pregunta que viene después de esa pregunta.', 'bad');
  blank();
  pr('No delataste a Jerónimo. Pero tampoco mentiste.', 'end4');
  pr('Lo que le pase a Fray Tomás después de esta noche', 'desc');
  pr('depende de cómo de paciente esté el Santo Oficio.', 'end4');
  blank();
  pr('Hay una forma de lealtad que no tiene nombre.', 'dim');
  pr('La conoces ahora.', 'end4');
  _finalEnd(40);
}

// ─── Parser ───────────────────────────────────────────────────────────────────
function parse(raw) {
  flushQueue();
  const clean = raw.trim();
  if (!clean) return;
  S.history.push(clean);
  S.histIdx = S.history.length;
  pr('> ' + clean, 'cmd');

  const n = clean.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const words = n.split(/\s+/);
  const verb = words[0];
  const t = words.slice(1).join(' ');

  switch (verb) {
    case 'norte': case 'n': return doGo('norte');
    case 'sur':   case 's': return doGo('sur');
    case 'este':  case 'e': return doGo('este');
    case 'oeste': case 'o': return doGo('oeste');
    case 'arriba': case 'up': case 'u': case 'subir': return doGo('arriba');
    case 'abajo':  case 'down': case 'd': case 'bajar': return doGo('abajo');
    case 'ir': case 've': case 'camina': return doGo(t);

    case 'mirar': case 'mira': case 'look': case 'l': case 'm': return doLook();

    case 'coger': case 'coge': case 'tomar': case 'toma': case 'agarrar': case 'recoger': return doTake(t);
    case 'dejar': case 'deja': case 'soltar': case 'suelta': return doDrop(t);

    case 'examinar': case 'examina': case 'x': case 'ex': case 'inspeccionar':
    case 'analizar': case 'analiza': case 'ver': return doExamine(t);
    case 'buscar': case 'busca':
      if (!t) {
        if (S.room === 'juderia') { _examinarJuderia(); return; }
        if (S.room === 'biblioteca') { _examinarBiblioteca(); return; }
        if (S.room === 'refectorio') { _examinarRefectorio(); return; }
        pr('¿Buscar qué?', 'bad'); return;
      }
      return doExamine(t);
    case 'leer': case 'lee': return doRead(t);

    case 'hablar': case 'habla': case 'preguntar': case 'pregunta':
    case 'conversar': return doHablar(t);

    case 'abrir': case 'abre': return doAbrir(t);
    case 'usar': case 'usa':
      if (t.includes('vela') || t.includes('candela') || t.includes('luz')) { doEncender(t); return; }
      return doAbrir(t);

    case 'encender': case 'enciende': case 'iluminar': case 'ilumina': return doEncender(t);

    case 'escribir': case 'escribe': case 'rellenar': case 'rellena':
    case 'firmar': case 'firma': case 'anotar': return doEscribir(t);

    case 'sobornar': case 'soborna': case 'pagar': case 'paga':
    case 'comprar': case 'compra': case 'dar': case 'da': return doSobornar(t);

    case 'denunciar': case 'denuncia': case 'acusar': case 'acusa':
    case 'entregar': case 'entrega':
      doFinalDenuncia(); return;

    case 'quemar': case 'quema': case 'incendiar': case 'prender': case 'prende':
      doFinalQuemar(); return;

    case 'huir': case 'huye': case 'escapar': case 'escapa':
    case 'salir': case 'sale': case 'fuga':
      doFinalHuida(); return;

    case 'confesar': case 'confiesa': case 'confesion': case 'rendirse': case 'rindete':
    case 'entregarse':
      doFinalConfesor(); return;

    case 'inventario': case 'inv': case 'i': return doInventario();
    case 'puntuacion': case 'puntuación': case 'score': return doScore();
    case 'ayuda': case 'help': case 'h': return doAyuda();
    case 'creditos': case 'credito': return doCreditos();

    case 'guardar': return doGuardar(t);
    case 'cargar': return doCargar(t);

    default: break;
  }

  if (n.includes('quemar') || n.includes('incendiar') || n.includes('fuego') || n.includes('prender')) {
    doFinalQuemar(); return;
  }
  if (n.includes('confesar') || n.includes('confesion') || n.includes('rendirse') || n.includes('entregarse')) {
    doFinalConfesor(); return;
  }
  if (n.includes('huir') || n.includes('escapar') || n.includes('fuga') || n.includes('huida')) {
    doFinalHuida(); return;
  }
  if (n.includes('denunciar') || n.includes('denuncia') || n.includes('acusar')) {
    doFinalDenuncia(); return;
  }
  if ((n.includes('hablar') || n.includes('habla')) && t) { doHablar(t); return; }
  if ((n.includes('buscar') || n.includes('busca')) && !t) {
    if (S.room === 'juderia') { _examinarJuderia(); return; }
    if (S.room === 'biblioteca') { _examinarBiblioteca(); return; }
    if (S.room === 'refectorio') { _examinarRefectorio(); return; }
  }

  pr(`No entiendo «${clean.trim()}». Escribe AYUDA para ver los comandos.`, 'bad');
}

// ─── Input handler ────────────────────────────────────────────────────────────
inp.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (S.histIdx > 0) { S.histIdx--; inp.value = S.history[S.histIdx] || ''; }
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (S.histIdx < S.history.length - 1) { S.histIdx++; inp.value = S.history[S.histIdx] || ''; }
    else { S.histIdx = S.history.length; inp.value = ''; }
    return;
  }
  if (e.key === 'Enter') { const v = inp.value; inp.value = ''; parse(v); }
});

// ─── Arranque ─────────────────────────────────────────────────────────────────
(function boot() {
  bootMode = true;
  pr('', 'sep');
  pr('TOLEDO · 1492 · TRES HORAS ANTES DEL ALBA', 'big');
  pr('══════════════════════════════════════════', 'sep');
  blank();
  pr('Eres Fray Tomás de Segura, monje dominico, treinta y dos años.', 'desc');
  pr('Esta mañana, limpiando la celda de tu mentor Fray Jerónimo,', 'desc');
  pr('encontraste una biblia hebraica entre el colchón y la pared.', 'warn');
  blank();
  pr('Fray Jerónimo lleva treinta años en este convento.', 'desc');
  pr('Es el hombre que te enseñó a rezar, a leer, a pensar.', 'desc');
  pr('Y tiene una biblia en hebreo escondida en su celda.', 'bad');
  blank();
  pr('El Santo Oficio de la Inquisición está a dos calles.', 'warn');
  pr('El Edicto de Expulsión firmado hace tres meses.', 'warn');
  pr('Un solo formulario basta para destruir a un hombre.', 'bad');
  blank();
  pr('Escribe AYUDA para ver los comandos disponibles.', 'hint');
  pr('Escribe MIRAR para ver dónde estás.', 'hint');
  setTimeout(() => { bootMode = false; S.visited.add('celda'); }, 100);
})();
