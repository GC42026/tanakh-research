'use strict';

const curatedIntro = $('atlas-intro').textContent;
const curatedTitle = $('atlas-title').innerHTML;
const curatedToJournal = [
  ['mishkan','torah-as-language-of-branches','The journal follows the Mishkan as a model of the world and the person.'],
  ['sinai','the-ten-utterances','The journal examines how Torah names and counts the words of the covenant.'],
  ['ladder','sefirot-gematria-and-computation','The journal sets out how letter values are computed and what equal sums can establish.'],
  ['yaakov','esav-and-mitzrayim','The journal follows the relationship of Yaakov and Esav into the encounter between Israel and Edom.']
];
const journalById = new Map(journal.map(study => [study.id,study]));

function coordinatesFor(i, total) {
  const z = 1-2*(i+0.5)/Math.max(1,total);
  return [i*2.399963 + 0.42, Math.asin(z)*0.91];
}
function nodePosition(i,total) {
  return {position:coordinatesFor(i,total),offset:i%2 ? [-13,17] : [13,-12]};
}
function journalNode(study,i) {
  return {id:study.id,type:'study',title:study.title,ref:'Tanakh Research',gloss:study.summary,
    articleHref:`../research/${study.id}.html`,...nodePosition(i,journal.length)};
}
function sefariaSlug(url) {
  try {
    const parts = new URL(url);
    return /^(www\.)?sefaria\.org$/.test(parts.hostname) ? decodeURIComponent(parts.pathname.slice(1)) : '';
  } catch { return ''; }
}
function refKey(ref) {
  return ref.normalize('NFC').replace(/[_.:]+/g,' ').replace(/\s+/g,' ').trim().toLowerCase();
}
function refFromInput(input) {
  const value = input.trim();
  return sefariaSlug(value) || value;
}
function safeSlug(ref) {
  return encodeURIComponent(ref.replaceAll(' ','_').replaceAll(':','.'));
}

const journalNodes = journal.map(journalNode);
const allJournalEdges = [];
const citations = new Map();
const citationOwners = new Map();
const sharedSources = new Map();

function connectJournal(a,b,kind,detail) {
  if (a === b || allJournalEdges.some(e => (e.a === a && e.b === b) || (e.a === b && e.b === a))) return;
  allJournalEdges.push({a,b,kind,detail});
}
for (const study of journal) {
  for (const related of study.related.filter(id => journalById.has(id))) {
    connectJournal(study.id,related,'Related reading','The journal points readers from one study to the other.');
  }
  for (const citation of study.sources) {
    const sefariaRef = sefariaSlug(citation.url);
    const id = 'citation:'+citation.url;
    if (!citations.has(id)) {
      citations.set(id,{id,type:'text',title:citation.title,ref:sefariaRef ? sefariaRef.replaceAll('_',' ') : new URL(citation.url).hostname,
        sefariaRef,url:sefariaRef ? encodeURIComponent(sefariaRef) : citation.url,external:!sefariaRef,microOnly:true});
    }
    connectJournal(study.id,id,'Journal citation','This study cites the source.');
    if (sefariaRef) {
      const key = refKey(sefariaRef);
      if (!citationOwners.has(key)) citationOwners.set(key,new Set());
      sharedSources.set(key,{url:citation.url,label:citation.title});
      citationOwners.get(key).add(study.id);
    }
  }
}
[...citations.values()].forEach((node,i) => Object.assign(node,nodePosition(i,citations.size)));
for (const [nodeId,studyId,detail] of curatedToJournal) {
  const node = curatedNodes.find(item => item.id === nodeId);
  if (!node || !journalById.has(studyId)) continue;
  const id = 'curated:'+node.id;
  citations.set(id,{...node,id,microOnly:true,sefariaRef:node.url,extraActions:
    `<a class="source-link" href="?node=${node.id}">Explore Heaven &amp; Earth</a>`});
  connectJournal(studyId,id,'Atlas study',detail);
}
for (const [key,owners] of citationOwners) {
  const ids = [...owners];
  ids.forEach((a,i) => ids.slice(i+1).forEach(b => {
    const existing = allJournalEdges.find(edge => (edge.a === a && edge.b === b) || (edge.a === b && edge.b === a));
    if (existing) {
      existing.kind = 'Shared citation';
      existing.detail = 'Both articles cite the same Sefaria reference.';
      (existing.sources ??= []).push(sharedSources.get(key));
    } else {
      allJournalEdges.push({a,b,kind:'Shared citation',detail:'Both articles cite the same Sefaria reference.',sources:[sharedSources.get(key)]});
    }
  }));
}

let request;
let liveGraph;
let routeView;
const connectionsPerPage = 8;

function changeLocation(parameters) {
  const url = new URL(location.href);
  url.search = new URLSearchParams(parameters);
  if (url.href !== location.href) history.pushState(null,'',url);
}
function setHeader(mode,title,description) {
  routeView = mode;
  $('atlas-title').textContent = title;
  $('atlas-intro').textContent = description;
  document.querySelector('.intro-hebrew').hidden = mode !== 'curated';
  for (const id of ['atlas-workbench','atlas-connections','relationship-key']) $(id).hidden = mode === 'sequence';
  $('sequence').hidden = mode !== 'sequence';
  for (const id of ['curated','journal','lineage','sequence','metals']) {
    const link = $(id+'-mode');
    if (id === mode) link.setAttribute('aria-current','page');
    else link.removeAttribute('aria-current');
  }
}
function status(message = '') {
  $('lookup-status').textContent = message;
  $('lookup-status').hidden = !message;
}
function clearSuggestions() {
  $('suggestions').replaceChildren();
  $('suggestions').hidden = true;
}
function journalLinks(ids) {
  return [...ids].map(id => {
    const study = journalById.get(id);
    return `<a class="source-link" href="?study=${id}">Journal · ${escapeHTML(study.title)}</a>`;
  }).join('');
}

function openCurated(id = 'ladder') {
  setHeader('curated','',curatedIntro);
  $('atlas-title').innerHTML = curatedTitle;
  const graph = curatedNodes.map(node => ({...node,sefariaRef:node.url,
    extraActions:journalLinks(curatedToJournal.filter(([nodeId]) => node.id === nodeId).map(([,studyId]) => studyId)) +
      (['mishkan','terumah'].includes(node.id) ? '<a class="source-link" href="?view=metals">Explore the Mishkan metals</a>' : '')}));
  const selected = graph.some(node => node.id === id) ? id : 'ladder';
  setAtlas(graph,curatedEdges,selected);
}
function openJournal(id) {
  const selected = journalById.has(id) ? id : journalNodes[0].id;
  setHeader('journal','Journal studies','Select a study to follow its cited texts and related research.');
  setAtlas([...journalNodes,...citations.values()],allJournalEdges,selected,
    {scale:id ? 'micro' : 'macro', searchAll:true, onSelect(node) {
      if (node.type === 'study') changeLocation({study:node.id});
      return false;
    }});
}

async function sefaria(path,signal) {
  const response = await fetch('https://www.sefaria.org/api/'+path,{signal});
  if (!response.ok) throw new Error('Sefaria returned '+response.status);
  const data = await response.json();
  if (data?.error) throw new Error(data.error);
  return data;
}
function showSuggestions(items) {
  const options = [...new Set(items.filter(item => item.type === 'ref' && typeof item.key === 'string').map(item => item.key))].slice(0,8);
  $('suggestions').innerHTML = options.map(ref => openTextButton(ref,escapeHTML(ref))).join('');
  $('suggestions').hidden = options.length === 0;
}

function readerContent(text) {
  const seen = new Set();
  const editions = (text.versions ?? []).filter(edition => {
    if (seen.has(edition.versionTitle) || !edition.text) return false;
    seen.add(edition.versionTitle);
    return true;
  });
  const sections = editions.map((edition,i) => {
    const direction = edition.direction === 'rtl' ? 'rtl' : 'ltr';
    const license = edition.license ?? '';
    const openEdition = /^(CC[- ]|public domain|CC0)/i.test(license);
    let remaining = 25;
    const parts = [edition.text].flat(Infinity).filter(item => typeof item === 'string' && item.trim());
    const display = [];
    const limit = 120;
    for (const piece of parts.slice(0,limit)) {
      if (openEdition) {
        display.push(piece);
        continue;
      }
      const words = piece.trim().split(/\s+/);
      if (remaining <= 0) break;
      display.push(words.slice(0,remaining).join(' '));
      remaining -= words.length;
    }
    const shortened = !openEdition && remaining <= 0 || parts.length > limit;
    return `<details ${i === 0 ? 'open' : ''}>
      <summary>${edition.isSource ? 'Source text' : edition.actualLanguage === 'en' ? 'English translation' : 'Edition'}
      <span class="reader-ident">${escapeHTML(edition.versionTitle)}${license ? ' · '+escapeHTML(license) : ''}</span></summary>
      <div class="reader-text" tabindex="0" dir="${direction}">${display.map(piece => `<p>${escapeHTML(piece)}</p>`).join('')}</div>
      ${shortened ? '<p class="reader-ident">Excerpt · continue on Sefaria</p>' : ''}</details>`;
  }).join('');
  const adjacent = [['prev','Previous section'],['next','Next section']].filter(([key]) => text[key]);
  return `<div class="reader">${sections || '<p class="node-note">Sefaria did not return a source or English edition for this reference.</p>'}
    <div class="text-pagination">${adjacent.map(([key,label]) => openTextButton(text[key],label)).join('')}</div></div>`;
}

function organizeLinks(raw,current) {
  const unique = new Map();
  for (const link of raw) {
    const ref = link.sourceRef ?? link.ref;
    if (typeof ref !== 'string' || refKey(ref) === refKey(current)) continue;
    const key = refKey(ref);
    const group = link.index_title ?? link.collectiveTitle?.en ?? link.category ?? 'Text';
    if (!unique.has(key)) unique.set(key,{ref,group,anchors:new Set(),labels:new Set()});
    const target = unique.get(key);
    if (link.anchorRef) target.anchors.add(link.anchorRef);
    target.labels.add(link.category || link.type || 'Connection');
  }
  const groups = new Set();
  const first = [], rest = [];
  for (const link of unique.values()) {
    (groups.has(link.group) ? rest : first).push(link);
    groups.add(link.group);
  }
  return [...first,...rest];
}

function renderLive(page = 0, focus = false) {
  const {text, textSlug, links, pending, failed} = liveGraph;
  const readerState = document.querySelector('#inspector .reader');
  const expanded = readerState ? [...readerState.querySelectorAll('details')].map(item => item.open) : [];
  const readerScroll = readerState ? [...readerState.querySelectorAll('.reader-text')].map(item => item.scrollTop) : [];
  const section = links.slice(page*connectionsPerPage,(page+1)*connectionsPerPage);
  const root = {id:'source',type:'text',title:text.ref,ref:text.heRef ?? 'Sefaria',
    url:textSlug,canonicalRef:text.ref,mediaKey:text.ref,readerHTML:readerContent(text),
    position:[0.17,0.26],offset:[16,-14]};
  const linkedNodes = section.map((link,i) => ({
    id:'linked:'+i,type:'text',title:link.ref,ref:link.group,sefariaRef:link.ref,
    ...nodePosition(i,section.length)
  }));
  const linkEdges = section.map((link,i) => ({a:'source',b:'linked:'+i,kind:[...link.labels].join(' · '),evidenceType:'context',
    sources:[...link.anchors].slice(0,2).map(ref => ({url:'https://www.sefaria.org/'+safeSlug(ref),label:ref})),
    detail:link.anchors.size ? 'Linked at '+[...link.anchors].slice(0,2).join(' · ')+(link.anchors.size > 2 ? ' …' : '') : 'Indexed by Sefaria'}));
  const citedBy = [...(citationOwners.get(refKey(text.ref)) ?? [])].map((id,i,array) =>
    ({...journalNode(journalById.get(id),i),position:[-0.85-i*0.26,0.63-i/(array.length+1)]}));
  const studyEdges = citedBy.map(study => ({a:'source',b:study.id,kind:'Journal citation',detail:'This Tanakh Research study cites the text.'}));
  const linkSummary = pending ? 'Checking Sefaria…' : failed ? 'Sefaria connections unavailable'
    : `${links.length.toLocaleString()} distinct Sefaria connections`;
  setAtlas([root,...linkedNodes,...citedBy],[...studyEdges,...linkEdges],'source',{focus,linkSummary,scale: page ? state.scale : 'macro',
    onSelect(node,targetFocus) {
      if (node.type === 'study') {
        changeLocation({study:node.id});
        showRoute(true);
        return true;
      }
      if (!node.sefariaRef) return false;
      navigateToText(node.sefariaRef,targetFocus);
      return true;
    }});
  if (expanded.length) {
    $('inspector').querySelectorAll('.reader details').forEach((item,i) => { item.open = expanded[i] ?? item.open; });
    $('inspector').querySelectorAll('.reader-text').forEach((item,i) => { item.scrollTop = readerScroll[i] ?? 0; });
  }
  if (failed) $('edges').insertAdjacentHTML('beforeend',`<p class="empty">Could not load the Sefaria links. ${openTextButton(text.ref,'Retry')}</p>`);
  if (pending && !studyEdges.length) $('edges').textContent = '';
  const pages = Math.ceil(links.length/connectionsPerPage);
  const pagination = $('link-pages');
  pagination.hidden = pages < 2;
  pagination.innerHTML = pages < 2 ? '' : `
    <button class="action" data-page="${page-1}" ${page === 0 ? 'disabled' : ''}>Previous links</button>
    <span aria-live="polite">${page+1} of ${pages}</span>
    <button class="action" data-page="${page+1}" ${page+1 >= pages ? 'disabled' : ''}>More links</button>`;
}

async function openLive(query,focus) {
  request = new AbortController();
  const {signal} = request;
  status('Looking up '+query+' on Sefaria…');
  $('sefaria-query').value = query;
  try {
    const resolution = await sefaria('name/'+encodeURIComponent(query),signal);
    if (!resolution.is_ref || !resolution.ref) {
      status('Sefaria did not recognize that reference. Try a full book name and section.');
      showSuggestions(resolution.completion_objects ?? []);
      return;
    }
    const bookSlug = encodeURIComponent(resolution.url ?? resolution.ref);
    const opening = resolution.is_book || resolution.is_node
      ? await sefaria('texts/'+bookSlug+'?context=0',signal) : null;
    const slug = opening?.ref ? safeSlug(opening.ref) : bookSlug;
    const text = await sefaria('v3/texts/'+slug+'?version=source&version=english&return_format=text_only',signal);
    if (signal.aborted) return;
    setHeader('sefaria','Sefaria texts','Read a source and follow its indexed connections in the atlas.');
    liveGraph = {text,textSlug:slug,links:[],pending:true,failed:false};
    status('');
    renderLive(0,focus);
    try {
      const links = await sefaria('links/'+slug+'?with_text=0',signal);
      if (!Array.isArray(links)) throw new Error('Unexpected Links response');
      if (signal.aborted) return;
      liveGraph.links = organizeLinks(links,text.ref);
    } catch {
      if (signal.aborted) return;
      liveGraph.failed = true;
    }
    liveGraph.pending = false;
    const focusWasInReader = $('inspector').contains(document.activeElement);
    renderLive(0,focusWasInReader);
    if (opening?.ref) status('Opening section of '+resolution.ref+'.');
  } catch {
    if (!signal.aborted) status('Could not load this text from Sefaria. Check the reference or try again.');
  }
}
function showRoute(focus = false) {
  request?.abort();
  liveGraph = null;
  $('link-pages').hidden = true;
  status('');
  clearSuggestions();
  const params = new URLSearchParams(location.search);
  if (params.has('ref')) {
    if (!routeView || routeView === 'sequence') openCurated();
    const query = refFromInput(params.get('ref'));
    if (query.length && query.length <= 400) openLive(query,focus);
    else status('Enter a Sefaria reference.');
  } else if (params.get('view') === 'sequence') {
    openSequence(focus);
  } else if (params.get('view') === 'metals') {
    openMetals(params.get('node'),focus);
  } else if (params.has('layer')) {
    openLineage(params.get('layer'),focus);
  } else if (params.has('study') || params.get('view') === 'journal') {
    openJournal(params.get('study'));
    if (focus) $('selection-title').focus();
  } else {
    openCurated(params.get('node') ?? undefined);
  }
}
function navigateToText(input,focus = true) {
  const ref = refFromInput(input);
  changeLocation({ref});
  showRoute(focus);
}
$('lookup').addEventListener('submit',event => {
  event.preventDefault();
  navigateToText($('sefaria-query').value);
});
document.addEventListener('click',event => {
  const refButton = event.target.closest('[data-ref]');
  if (refButton) navigateToText(refButton.dataset.ref);
  const page = event.target.closest('#link-pages [data-page]');
  if (page && liveGraph) {
    renderLive(Number(page.dataset.page));
    const nextButton = [...$('link-pages').querySelectorAll('button')].find(button =>
      !button.disabled && button.textContent === page.textContent);
    (nextButton ?? $('link-pages').querySelector('button:not(:disabled)'))?.focus({preventScroll:true});
  }
});
addEventListener('popstate',() => showRoute());
document.addEventListener('DOMContentLoaded',() => showRoute());
