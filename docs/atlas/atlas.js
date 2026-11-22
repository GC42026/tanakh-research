'use strict';

const $ = id => document.getElementById(id);
const canvas = $('universe');
const ctx = canvas.getContext('2d');
let nodes = curatedNodes, edges = curatedEdges;
let byId = new Map(nodes.map(node => [node.id, node]));
let atlasOptions = {};
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,
  char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[char]);
const webUrl = value => {
  try {
    const url = new URL(value, location.href);
    return url.protocol === 'https:' || url.origin === location.origin ? url.href : '';
  } catch { return ''; }
};
const sourceLink = (url, label) =>
  `<a class="source-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
const openTextButton = (ref, label = 'Open text & links') =>
  `<button class="action" data-ref="${escapeHTML(ref)}">${label}</button>`;

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const defaultView = { yaw: 0, pitch: 0.09, zoom: 1 };
const state = {
  ...defaultView, selected: 'ladder', scale: 'macro', filter: 'all',
  query: '', hot: null, geometry: 'sphere'
};
const weights = { sphere: 1, diamond: 0, helix: 0 };
const letters = 'אבגדהוזחטיכלמנסעפצקרשת';
const values = [1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80,90,100,200,300,400];
const finals = { ך:'כ', ם:'מ', ן:'נ', ף:'פ', ץ:'צ' };

function gematria(word) {
  return Array.from(word.matchAll(/[א-ת]/gu), ([letter]) =>
    [letter, values[letters.indexOf(finals[letter] ?? letter)]]);
}

const filters = document.querySelector('.filters');
function renderFilters() {
  const types = new Set(nodes.map(node => node.type));
  filters.innerHTML = [['all','All'], ...Object.entries(categories).filter(([id]) => types.has(id))
    .map(([id, c]) => [id,c.plural])]
    .map(([id,label]) => `<button data-filter="${id}" aria-pressed="${id === state.filter}">${label}</button>`).join('');
}

function activeNodes() {
  if (state.scale === 'micro') {
    return new Set([state.selected,...nearby(state.selected).map(edge => edge.a === state.selected ? edge.b : edge.a)]);
  }
  return new Set(nodes.filter(node => !node.microOnly || node.id === state.selected).map(node => node.id));
}

function setAtlas(nextNodes, nextEdges, selected, options = {}) {
  nodes = nextNodes;
  edges = nextEdges;
  atlasOptions = options;
  byId = new Map(nodes.map(node => [node.id, node]));
  locations = new Map(nodes.map(node => [node.id, coordinates(...node.position)]));
  Object.assign(state,{selected, hot:null, scale:options.scale ?? 'macro', filter:'all', query:''});
  $('search').value = '';
  markPressed($('scales'), $('scales').querySelector(`[data-scale="${state.scale}"]`));
  renderFilters();
  renderIndex();
  renderSelection(options.focus);
  showMediaPreview(null);
  drawSoon();
}

function nearby(id) {
  return edges.filter(edge => edge.a === id || edge.b === id);
}

function renderIndex() {
  const query = state.query.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
  const active = activeNodes();
  const visible = nodes.filter(node => {
    const matches = [node.title, node.ref, node.he, node.word, node.meaning].filter(Boolean)
      .some(text => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().includes(query));
    return (active.has(node.id) || (query && atlasOptions.searchAll)) && matches && (state.filter === 'all' || node.type === state.filter);
  });
  $('count').textContent = `${visible.length} / ${query && atlasOptions.searchAll ? nodes.length : active.size}`;
  $('node-list').innerHTML = visible.map(node =>
    `<button class="node-row" data-node="${escapeHTML(node.id)}" aria-current="${node.id === state.selected}"><span class="dot" style="--dot:${categories[node.type].color}"></span><span><strong>${escapeHTML(node.title)}</strong><small>${escapeHTML(node.ref)}</small></span></button>`
  ).join('') || '<p class="empty">No matching nodes.</p>';
}

function renderSelection(focusTarget) {
  const node = byId.get(state.selected);
  const category = categories[node.type];
  const breakdown = node.word ? gematria(node.word) : [];
  const total = breakdown.reduce((sum, [,value]) => sum + value, 0);
  const media = mediaByNode.get(node.mediaKey ?? node.id) ?? mediaByNode.get(node.ref);
  const layers = (media?.layers ?? []).filter(layer => webUrl(layer.src) && ['audio','video'].includes(layer.kind));
  const defaultContent = `${node.he || node.gloss ? `<div class="detail-box">${node.he ? `<p class="hebrew" lang="he" dir="rtl">${escapeHTML(node.he)}</p>` : ''}
    ${node.gloss ? `<p class="gloss">${escapeHTML(node.gloss)}</p>` : ''}</div>` : ''}
    ${node.note ? `<p class="node-note">${escapeHTML(node.note)}</p>` : ''}`;
  $('inspector').innerHTML = `
    <div><div class="card-type" style="--dot:${category.color}"><span class="dot"></span>${category.label}</div>
    <h2 tabindex="-1" id="selection-title">${escapeHTML(node.title)}</h2><p class="reference">${escapeHTML(node.ref)}</p></div>
    ${node.readerHTML ?? defaultContent}
    ${breakdown.length ? `<div class="gem-box"><div class="gem-top"><span class="eyebrow">GEMATRIA</span><span class="gem-number">${total}</span></div><p class="gem-word"><b lang="he" dir="rtl">${escapeHTML(node.word)}</b> ${escapeHTML(node.meaning)}</p><div class="letters">${breakdown.map(([letter,value]) => `<span><b lang="he">${letter}</b>${value}</span>`).join('')}</div></div>` : ''}
    ${layers.map(layer => `<div><span class="eyebrow">${escapeHTML(layer.title)}</span>
      <${layer.kind} class="reader-media" controls preload="none" src="${escapeHTML(webUrl(layer.src))}">${layer.captions && webUrl(layer.captions) ? `<track kind="captions" src="${escapeHTML(webUrl(layer.captions))}" srclang="${escapeHTML(layer.lang ?? 'en')}" default>` : ''}</${layer.kind}></div>`).join('')}
    <div class="inspector-actions">${node.articleHref ? `<a class="source-link" href="${escapeHTML(node.articleHref)}">Read the journal post</a>` : ''}
    ${node.sefariaRef && !node.readerHTML ? openTextButton(node.sefariaRef) : ''}
    ${node.url ? sourceLink(webUrl(node.external ? node.url : 'https://www.sefaria.org/'+node.url), node.external ? 'Open cited source' : 'Read on Sefaria') : ''}
    ${node.extraActions ?? ''}</div>`;
  const links = nearby(node.id);
  $('edge-count').textContent = `${atlasOptions.linkSummary ?? `${links.length} direct links`}`;
  $('edges').innerHTML = links.map(edge => {
    const target = byId.get(edge.a === node.id ? edge.b : edge.a);
    return `<button class="edge" data-node="${escapeHTML(target.id)}"><span class="edge-kind">${escapeHTML(edge.kind)}</span><strong>${escapeHTML(target.title)}</strong><p>${escapeHTML(edge.detail)}</p></button>`;
  }).join('') || '<p class="empty">No connections to display.</p>';
  document.querySelectorAll('.node-row').forEach(row => {
    row.setAttribute('aria-current', String(row.dataset.node === node.id));
  });
  if (focusTarget) $('selection-title').focus();
}

function selectNode(id, focusTarget = false) {
  if (!byId.has(id)) return;
  if (atlasOptions.onSelect?.(byId.get(id), focusTarget)) return;
  state.selected = id;
  state.hot = null;
  const focusedId = document.activeElement?.closest('#node-list [data-node]')?.dataset.node;
  renderIndex();
  if (focusedId) [...$('node-list').querySelectorAll('[data-node]')]
    .find(button => button.dataset.node === focusedId)?.focus({preventScroll:true});
  renderSelection(focusTarget);
  showMediaPreview(null);
  drawSoon();
}

$('node-list').addEventListener('click', event => {
  const row = event.target.closest('[data-node]');
  if (row) selectNode(row.dataset.node);
});
$('edges').addEventListener('click', event => {
  const row = event.target.closest('[data-node]');
  if (row) selectNode(row.dataset.node, true);
});
$('search').addEventListener('input', event => {
  state.query = event.target.value;
  renderIndex();
});
filters.addEventListener('click', event => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  state.filter = button.dataset.filter;
  markPressed(filters, button);
  renderIndex();
});

function markPressed(group, button) {
  group.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
}

$('scales').addEventListener('click', event => {
  const button = event.target.closest('[data-scale]');
  if (!button) return;
  state.scale = button.dataset.scale;
  state.hot = null;
  markPressed($('scales'), button);
  renderIndex();
  showMediaPreview(null);
  drawSoon();
});
$('shapes').addEventListener('click', event => {
  const button = event.target.closest('[data-shape]');
  if (!button) return;
  state.geometry = button.dataset.shape;
  markPressed($('shapes'), button);
  drawSoon();
});
$('method').addEventListener('click', () => $('guide').showModal());

const tau = Math.PI * 2;
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
const samples = (size, fn) => Array.from({length:size}, (_,i) => fn(i/(size-1)));
const wire = [
  ...samples(14, t => samples(65, u => [u*tau,(t-0.5)*Math.PI])),
  ...samples(19, t => samples(45, u => [t*tau,(u-0.5)*Math.PI]))
];
const mesh = wire.map(line => line.map(([theta,phi]) => coordinates(theta,phi)));
let locations = new Map(nodes.map(node => [node.id, coordinates(...node.position)]));
const star = value => {
  const v = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
  return v - Math.floor(v);
};
const stars = Array.from({length:260}, (_,i) => [star(i*4),star(i*4+1),star(i*4+2),star(i*4+3)]);

function coordinates(theta, phi) {
  const ring = Math.cos(phi);
  const y = Math.sin(phi);
  const sphere = [Math.sin(theta)*ring,y,Math.cos(theta)*ring];
  const norm = sphere.reduce((sum,value) => sum + Math.abs(value), 0);
  const turn = phi*4.15 + Math.sin(theta)*0.22;
  const radius = 0.59 + Math.cos(theta)*0.12;
  return {
    sphere,
    diamond: sphere.map(value => value*1.18/norm),
    helix: [Math.sin(turn)*radius,phi*0.65+Math.sin(theta)*0.070,Math.cos(turn)*radius]
  };
}

let width = 1, height = 1, dpr = 1;
let frame = 0, renderedNodes = [];
let lastTime = 0;

function drawSoon() {
  if (!frame) frame = requestAnimationFrame(draw);
}

function orbitProjection() {
  const yawCos = Math.cos(state.yaw), yawSin = Math.sin(state.yaw);
  const pitchCos = Math.cos(state.pitch), pitchSin = Math.sin(state.pitch);
  const size = Math.min(width*0.31,height*0.34) * state.zoom * (state.scale === 'micro' ? 1.14 : 1);
  return point => {
    const [x,y,z] = [0,1,2].map(axis => point.sphere[axis]*weights.sphere
      + point.diamond[axis]*weights.diamond + point.helix[axis]*weights.helix);
    const x1 = x*yawCos + z*yawSin;
    const z1 = z*yawCos - x*yawSin;
    const y1 = y*pitchCos - z1*pitchSin;
    const depth = y*pitchSin + z1*pitchCos;
    const perspective = 3.8/(3.8-depth);
    return { x:width*0.50+x1*size*perspective, y:height*0.49-y1*size*perspective, depth, perspective };
  };
}

function drawSky(time) {
  ctx.clearRect(0,0,width,height);
  for (const [x,y,strength,phase] of stars) {
    const pulse = reducedMotion.matches ? 1 : 0.83 + 0.17*Math.sin(phase*7+time*0.0012);
    ctx.fillStyle = `rgba(231,204,202,${(0.10+strength*0.48)*pulse})`;
    ctx.beginPath();
    ctx.arc(x*width,y*height,0.25+strength*0.9,0,tau);
    ctx.fill();
    if (strength > 0.985) {
      ctx.fillRect(x*width-3,y*height-0.28,6,0.56);
      ctx.fillRect(x*width-0.28,y*height-3,0.56,6);
    }
  }
  const radius = Math.min(width*0.37,height*0.39);
  ctx.save();
  ctx.translate(width*0.50,height*0.49);
  ctx.rotate(-0.36);
  ctx.lineWidth = 1;
  for (const [scale,alpha] of [[1,0.21],[1.1,0.13],[1.28,0.08]]) {
    ctx.strokeStyle = `rgba(222,155,104,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(0,0,radius*scale,radius*0.43*scale,0,0,tau);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMesh(project) {
  ctx.lineWidth = 0.75;
  for (const line of mesh) {
    const points = line.map(project);
    for (let i = 1; i < points.length; i++) {
      const a = points[i-1], b = points[i];
      const depth = (a.depth+b.depth)/2;
      const alpha = clamp(0.13 + (depth+0.5)*0.27,0.07,0.53);
      ctx.strokeStyle = `rgba(234,166,112,${alpha*(state.scale === 'micro' ? 0.63 : 1)})`;
      ctx.beginPath();
      ctx.moveTo(a.x,a.y);
      ctx.lineTo(b.x,b.y);
      ctx.stroke();
    }
  }
}

function drawLinks(positions, active) {
  for (const edge of edges) {
    if (!active.has(edge.a) || !active.has(edge.b)) continue;
    const a = positions.get(edge.a), b = positions.get(edge.b);
    const selected = edge.a === state.selected || edge.b === state.selected;
    const hot = state.hot === edge.a || state.hot === edge.b;
    ctx.strokeStyle = hot ? '#ffc98f' : selected ? '#b88779bb' : '#8e72825c';
    ctx.lineWidth = hot ? 1.7 : selected ? 1.15 : 0.75;
    ctx.setLineDash(selected || hot ? [] : [3,5]);
    ctx.beginPath();
    ctx.moveTo(a.x,a.y);
    ctx.lineTo(b.x,b.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawNodes(positions, active) {
  const points = nodes.filter(node => active.has(node.id))
    .map(node => ({...positions.get(node.id), node}))
    .sort((a,b) => a.depth-b.depth);
  for (const p of points) {
    const color = categories[p.node.type].color;
    const emphasis = p.node.id === state.selected || p.node.id === state.hot;
    const radius = emphasis ? 6.5 : 3.8*p.perspective;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = emphasis ? 18 : 10;
    ctx.beginPath();
    ctx.arc(p.x,p.y,radius,0,tau);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = emphasis ? '#f8ca93' : color+'77';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x,p.y,radius+(emphasis ? 5 : 2.4),0,tau);
    ctx.stroke();
    if (emphasis) {
      ctx.fillStyle = '#fff0cb';
      ctx.beginPath();
      ctx.arc(p.x,p.y,2.4,0,tau);
      ctx.fill();
    }
  }

  const labels = [];
  const priority = p => p.node.id === state.selected ? 3 : p.node.id === state.hot ? 2 : p.depth;
  const labelOrder = [...points].sort((a,b) => priority(b)-priority(a));
  for (const p of labelOrder) {
    const focus = p.node.id === state.selected;
    const hot = p.node.id === state.hot;
    if (!focus && !hot && p.depth < (width < 450 ? 0.08 : -0.42)) continue;
    ctx.font = focus || hot ? '600 13px system-ui' : '11px system-ui';
    const title = p.node.title.length > 32 ? p.node.title.slice(0,31)+'…' : p.node.title;
    const length = ctx.measureText(title).width;
    const [dx,dy] = p.node.offset;
    const x = clamp(p.x+dx-(dx < 0 ? length : 0),5,Math.max(5,width-length-5));
    const y = clamp(p.y+dy,83,height-55);
    if (p.x < 0 || p.x > width || p.y < 60 || p.y > height-45) continue;
    if (!hot && !focus && labels.some(l => x < l.x+l.length+8 && x+length+8 > l.x && Math.abs(y-l.y) < 17)) continue;
    labels.push({x,y,length});
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#15101c';
    ctx.strokeText(title,x,y);
    ctx.fillStyle = focus || hot ? '#ffe2b7' : '#d9c8da';
    ctx.fillText(title,x,y);
  }
  renderedNodes = points;
}

function draw(time) {
  frame = 0;
  const eased = reducedMotion.matches ? 1 : 1-Math.exp(-Math.min(time-lastTime,32)/82);
  lastTime = time;
  let moving = false;
  for (const shape of Object.keys(weights)) {
    const target = Number(state.geometry === shape);
    const difference = target-weights[shape];
    weights[shape] = Math.abs(difference) < 0.001 ? target : weights[shape]+difference*eased;
    moving ||= weights[shape] !== target;
  }
  const active = activeNodes();
  const project = orbitProjection();
  const positions = new Map([...locations].map(([id,point]) => [id,project(point)]));
  drawSky(time);
  drawMesh(project);
  drawLinks(positions,active);
  drawNodes(positions,active);
  if (moving) drawSoon();
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  dpr = Math.min(devicePixelRatio || 1,2);
  canvas.width = Math.max(1,Math.round(width*dpr));
  canvas.height = Math.max(1,Math.round(height*dpr));
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawSoon();
}

function hit(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX-rect.left, y = event.clientY-rect.top;
  return renderedNodes.reduce((best,p) => {
    const distance = Math.hypot(x-p.x,y-p.y);
    return distance < (best?.distance ?? 15) ? {id:p.node.id,distance} : best;
  },null)?.id ?? null;
}

function zoom(factor) {
  state.zoom = clamp(state.zoom*factor,0.55,2.35);
  drawSoon();
}

function rotate(x,y) {
  state.yaw += x;
  state.pitch = clamp(state.pitch+y,-1.53,1.53);
  drawSoon();
}

let previewTimer;
let previewNode = null;
function showMediaPreview(id) {
  if (id === previewNode) return;
  previewNode = id;
  clearTimeout(previewTimer);
  const panel = $('media-preview');
  panel.hidden = true;
  panel.replaceChildren();
  const node = byId.get(id);
  const media = node && (mediaByNode.get(node.mediaKey ?? id) ?? mediaByNode.get(node.ref));
  const url = media?.preview && webUrl(media.preview);
  if (!url || reducedMotion.matches) return;
  previewTimer = setTimeout(() => {
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    panel.append(video);
    panel.hidden = false;
  }, 380);
}

let drag = null;
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || drag) return;
  drag = {id:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,moved:false};
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (drag && drag.id === event.pointerId) {
    drag.moved ||= Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY) > 4;
    if (drag.moved) {
      state.hot = null;
      showMediaPreview(null);
      canvas.classList.add('drag');
      rotate((event.clientX-drag.x)*0.009,(event.clientY-drag.y)*0.009);
    }
    drag.x = event.clientX;
    drag.y = event.clientY;
  } else {
    state.hot = hit(event);
    showMediaPreview(event.pointerType === 'mouse' ? state.hot : null);
    canvas.classList.toggle('hot',Boolean(state.hot));
    drawSoon();
  }
});
canvas.addEventListener('pointerleave', () => {
  state.hot = null;
  showMediaPreview(null);
  canvas.classList.remove('hot');
  drawSoon();
});
canvas.addEventListener('pointerup', event => {
  if (!drag || drag.id !== event.pointerId) return;
  if (!drag.moved) selectNode(hit(event));
  drag = null;
  canvas.classList.remove('drag');
});
canvas.addEventListener('lostpointercapture', () => {
  drag = null;
  canvas.classList.remove('drag');
});
canvas.addEventListener('wheel', event => {
  event.preventDefault();
  zoom(Math.exp(-clamp(event.deltaY,-160,160)*(event.deltaMode === 1 ? 0.025 : 0.002)));
},{passive:false});
canvas.addEventListener('keydown', event => {
  const actions = {
    ArrowLeft: () => rotate(-0.13,0), ArrowRight: () => rotate(0.13,0),
    ArrowUp: () => rotate(0,-0.13), ArrowDown: () => rotate(0,0.13),
    '+': () => zoom(1.15), '=': () => zoom(1.15), '-': () => zoom(1/1.15),
    Home: () => { Object.assign(state,defaultView); drawSoon(); }
  };
  if (!Object.hasOwn(actions,event.key)) return;
  event.preventDefault();
  actions[event.key]();
});
$('plus').addEventListener('click', () => zoom(1.16));
$('minus').addEventListener('click', () => zoom(1/1.16));
$('reset').addEventListener('click', () => { Object.assign(state,defaultView); drawSoon(); });
new ResizeObserver(resize).observe(canvas);
