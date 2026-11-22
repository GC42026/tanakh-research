'use strict';

const lineageLibrary = 'https://kabbalah.academy/en-us/library/';
const sourceNodes = new Map(Object.entries(lineageSources).map(([key, entry], index, entries) => {
  const [number,title,author,kind,locator,note] = entry;
  return [key,{
    id:'source-'+key, type:'lineageSource', title, ref:author, note,
    detailKind:kind, gloss:locator, url:lineageLibrary+'sources/articles/'+number+'/', external:true,
    linkText:'Read in Bnei Baruch library', microOnly:true, ...nodePosition(index,entries.length)
  }];
}));
const termNodes = new Map(Object.entries(lineageTerms).map(([key,entry],index,entries) => {
  const [title,he,ref,note] = entry;
  return [key,{id:'term-'+key,type:'concept',title,he,ref,note,...nodePosition(index,entries.length)}];
}));
const lineageGraph = [
  ...lineageConnections.map(([a,b]) => ({
    a:termNodes.get(a).id,b:termNodes.get(b).id,kind:'Related concept',
    detail:'Explore how these terms are used together in the lineage’s sources.'
  })),
  ...Object.entries(lineageTerms).flatMap(([term,entry]) => entry[4].map(source => ({
    a:termNodes.get(term).id,b:sourceNodes.get(source).id,kind:sourceNodes.get(source).detailKind,
    detail:sourceNodes.get(source).gloss
  })))
];

// Index exact citations from the project. Unmapped texts retain access to the glossary.
const curatedRefs = new Map();
for (const node of curatedNodes) {
  const key = refKey(node.url);
  if (!curatedRefs.has(key)) curatedRefs.set(key,[]);
  curatedRefs.get(key).push(node.id);
}
const directRefs = new Map([
  ['Exodus 10:1-2','torah-as-language-of-branches'],
  ['Exodus 25:8','mishkan'],
  ['Genesis 28:12','ladder'],
  ['Genesis 2:7','the-whole-in-each-person']
].map(([ref,id]) => [refKey(ref),id]));

function nodeLineage(node) {
  const ref = node.canonicalRef ?? node.sefariaRef;
  const key = ref ? refKey(ref) : '';
  const citedArticle = node.external && node.url?.match(/^https:\/\/kabbalah\.academy\/(?:en|en-us)\/library\/sources\/articles\/(\d+)\/?$/);
  const relatedStudies = [...(citationOwners.get(key) ?? [])];
  const sourceKey = citedArticle && Object.keys(lineageSources).find(id => lineageSources[id][0] === Number(citedArticle[1]));
  const ids = [node.id.replace(/^curated:/,''),directRefs.get(key),...(curatedRefs.get(key) ?? []),...relatedStudies];
  const found = new Map();
  if (sourceKey) {
    const source = sourceNodes.get(sourceKey);
    found.set(source.id,{source,reason:'This is the cited Bnei Baruch edition.'});
    for (const [term,entry] of Object.entries(lineageTerms)) {
      if (!entry[4].includes(sourceKey)) continue;
      for (const id of entry[4].filter(id => id !== sourceKey).slice(0,2)) {
        const related = sourceNodes.get(id);
        found.set(related.id,{source:related,reason:'Further reading on '+termNodes.get(term).title+'.'});
      }
    }
  }
  for (const id of new Set(ids)) {
    for (const [entry,reason] of lineageAnchors[id] ?? []) {
      const source = sourceNodes.get(entry) ?? termNodes.get(entry);
      if (!found.has(source.id)) found.set(source.id,{source,reason,context:journalById.get(id)?.title});
    }
  }
  return [...found.values()];
}

function lineageShelf(node) {
  if (node.type === 'concept' || node.type === 'lineageSource') {
    return `<p class="lineage-library"><a href="${lineageLibrary}" target="_blank" rel="noopener noreferrer">Bnei Baruch Kabbalah Library</a></p>`;
  }
  const related = nodeLineage(node);
  return `<details class="lineage-shelf" ${related.length && !node.readerHTML ? 'open' : ''}>
    <summary>Bnei Baruch readings ${related.length ? `<span>${related.length}</span>` : ''}</summary>
    ${related.length ? `<ul>${related.map(({source,reason,context}) => {
      const title = escapeHTML(source.title);
      const link = source.url ? `<a href="${escapeHTML(source.url)}" target="_blank" rel="noopener noreferrer">${title}</a>`
        : `<a href="?layer=${source.id}">${title}</a>`;
      return `<li>${link}<small>${escapeHTML(source.ref)}${source.gloss ? ' · '+escapeHTML(source.gloss) : ''}</small>
        <p>${escapeHTML(reason)}</p><a class="lineage-node-link" href="?layer=${source.id}">View connections</a>${context && context !== node.title ? `<small>Via ${escapeHTML(context)}</small>` : ''}</li>`;
    }).join('')}</ul>` : '<p>Explore the lineage glossary and primary sources. A reading for this node has yet to be mapped.</p>'}
    <a class="lineage-map-link" href="?layer">Explore Kabbalah in 3D</a>
  </details>`;
}

function openLineage(id,focus) {
  const graph = [...termNodes.values(),...sourceNodes.values()];
  const selected = graph.some(node => node.id === id) ? id : 'term-kli';
  setHeader('lineage','Kabbalah sources','Explore Bnei Baruch’s vocabulary and follow it into the Zohar, the Ari, Baal HaSulam, Rabash, and later teaching commentary.');
  setAtlas(graph,lineageGraph,selected,{
    scale:id ? 'micro' : 'macro',searchAll:true,focus,
    onSelect(node) {
      changeLocation({layer:node.id});
      return false;
    }
  });
}
