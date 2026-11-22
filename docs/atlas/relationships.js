'use strict';

const relationshipStyles = {
  direct: {label:'Direct or shared source', color:'#e7b77d', dash:[], weight:1.65, length:0.62},
  context: {label:'Context or indexed link', color:'#ba9bdc', dash:[9,4], weight:0.85, length:0.91},
  reading: {label:'Interpretive comparison', color:'#9ac7bf', dash:[2,5], weight:0.40, length:1.19}
};

function relationshipStyle(edge) {
  if (edge.evidenceType) return relationshipStyles[edge.evidenceType];
  if (/^(Narrative|Text location|Source cited|Traditional reading|Commentary|Journal citation|Shared citation|Technical source|Primary source excerpt|Classical text with commentary|Direct lineage reading|Lineage essay|Teaching commentary)$/.test(edge.kind)) return relationshipStyles.direct;
  if (/^(Textual echo|Thematic reading|Gematria · traditional|Narrative parallel|Atlas study)$/.test(edge.kind)) return relationshipStyles.reading;
  return relationshipStyles.context;
}

// Resolve repulsion and category-weighted springs in three dimensions.
// The seeded coordinates supply a repeatable starting orientation.
function relationshipLayout(ids, seeds, graphEdges) {
  const points = ids.map((id,index) => ({
    id, position:seeds.get(id).sphere.map((value,axis) =>
      value*0.78+0.012*Math.sin((index+1)*(axis+2)*8.31)), delta:[0,0,0]
  }));
  const lookup = new Map(points.map(point => [point.id,point]));
  const links = graphEdges.filter(edge => lookup.has(edge.a) && lookup.has(edge.b))
    .map(edge => ({a:lookup.get(edge.a),b:lookup.get(edge.b),style:relationshipStyle(edge)}));
  const repel = 0.16 / Math.sqrt(Math.max(2,points.length));

  function applyForce(a,b,force) {
    const offset = b.position.map((value,axis) => value-a.position[axis]);
    const distance = Math.max(0.025, Math.hypot(...offset));
    const step = force(distance)/distance;
    for (let axis = 0; axis < 3; axis++) {
      const move = offset[axis]*step;
      a.delta[axis] += move;
      b.delta[axis] -= move;
    }
  }

  for (let tick = 0; tick < 115; tick++) {
    for (const point of points) point.delta.fill(0);
    for (let i = 0; i < points.length; i++) {
      for (let j = i+1; j < points.length; j++) {
        applyForce(points[i],points[j],distance => -repel/(0.075+distance*distance));
      }
    }
    for (const {a,b,style} of links) {
      applyForce(a,b,distance => style.weight * (distance-style.length));
    }
    const learningRate = 0.09*(1-tick/132);
    for (const point of points) {
      point.position = point.position.map((value,axis) =>
        value+Math.max(-0.25,Math.min(0.25,(point.delta[axis]-value*0.24)*learningRate)));
    }
  }
  const extent = Math.max(0.01,...points.map(point => Math.hypot(...point.position)));
  return new Map(points.map(point => [point.id,point.position.map(value => value*1.05/extent)]));
}

function inspectRelationship(edge) {
  const a = byId.get(edge.a), b = byId.get(edge.b);
  const records = new Map((edge.sources ?? []).map(source => [source.url,source.label]));
  const references = new Map();
  for (const node of [a,b]) {
    if (node.url) references.set(node.external ? node.url : 'https://www.sefaria.org/'+node.url,node.title);
    else if (node.articleHref) references.set(node.articleHref,node.title);
    else if (node.sefariaRef) references.set('https://www.sefaria.org/'+safeSlug(node.sefariaRef),node.title);
  }
  function links(items) {
    return [...items].map(([url,label]) => sourceLink(webUrl(url),escapeHTML(label))).join('');
  }
  $('connection-title').textContent = edge.kind;
  $('connection-detail').innerHTML = `<p class="connection-endpoints">${escapeHTML(a.title)} <span aria-hidden="true">↔</span> ${escapeHTML(b.title)}</p>
    <p>${escapeHTML(edge.detail)}</p>
    ${records.size ? `<h3>Evidence</h3><div class="connection-actions">${links(records)}</div>` : ''}
    ${references.size ? `<h3>Linked nodes’ sources</h3><div class="connection-actions">${links(references)}</div>` : ''}
    <h3>Explore the nodes</h3><div class="connection-actions">${[a,b].map(node =>
      `<button class="action" data-open-node="${escapeHTML(node.id)}">${escapeHTML(node.title)}</button>`).join('')}</div>`;
  $('connection-dialog').showModal();
}

document.getElementById('connection-detail').addEventListener('click',event => {
  const button = event.target.closest('[data-open-node]');
  if (!button) return;
  $('connection-dialog').close();
  selectNode(button.dataset.openNode,true);
});
