'use strict';

const mishkanMetals = [
  {id:'gold', title:'Gold', word:'זָהָב', meaning:'zahav · gold', symbol:'Au', number:79, group:11,
    use:'Shemot 25:11', slug:'Exodus.25.11', detail:'Pure gold overlays the Ark inside and out.',
    chemistry:'https://periodic-table.rsc.org/element/79/gold'},
  {id:'silver', title:'Silver', word:'כֶּסֶף', meaning:'kesef · silver', symbol:'Ag', number:47, group:11,
    use:'Shemot 26:19', slug:'Exodus.26.19', detail:'Silver sockets support the boards of the Mishkan.',
    chemistry:'https://periodic-table.rsc.org/element/47/silver'},
  {id:'copper', title:'Copper', word:'נְחֹשֶׁת', meaning:'neḥoshet · copper or copper alloy', symbol:'Cu', number:29, group:11,
    use:'Shemot 27:2', slug:'Exodus.27.2', detail:'The outer altar is overlaid with neḥoshet. The biblical term can also refer to a copper alloy such as bronze.',
    chemistry:'https://periodic-table.rsc.org/element/29/copper'},
  {id:'iron', title:'Iron', word:'בַּרְזֶל', meaning:'barzel · iron', symbol:'Fe', number:26, group:8,
    chemistry:'https://periodic-table.rsc.org/element/26/iron'},
  {id:'tin', title:'Tin', word:'בְּדִיל', meaning:'bedil · tin', symbol:'Sn', number:50, group:14,
    chemistry:'https://periodic-table.rsc.org/element/50/tin'},
  {id:'lead', title:'Lead', word:'עֹפֶרֶת', meaning:'oferet · lead', symbol:'Pb', number:82, group:14,
    chemistry:'https://periodic-table.rsc.org/element/82/lead'}
];

function openMetals(id, focus = false) {
  setHeader('metals','The Mishkan metals','Follow six Hebrew metal names through Torah, Zohar, and the periodic table.');
  const offering = {id:'offerings', type:'passage', title:'Metals for the Mishkan', ref:'Shemot 25:3',
    url:'Exodus.25.3', he:'זָהָב וָכֶסֶף וּנְחֹשֶׁת',
    gloss:'Gold, silver, and copper are the first three materials named in the offering.',
    note:'Follow each metal to an actual use in the Mishkan, then compare the same trio in the Zohar and in periodic group 11.',
    extraActions:'<a class="source-link" href="?node=mishkan">Explore Dwelling Below</a>'};
  const purification = {id:'purification', type:'passage', title:'Metals through fire and water', ref:'Bamidbar 31:22–23',
    url:'Numbers.31.22-23', he:'זָהָב · כֶּסֶף · נְחֹשֶׁת · בַּרְזֶל · בְּדִיל · עֹפֶרֶת',
    gloss:'The purification passage names six metals. What can withstand fire passes through fire and is purified with water. What cannot withstand fire passes through water.',
    note:'Compare this list with Shemot 25:3. The Mishkan trio recurs in the same order, alongside iron, tin, and lead.'};
  const rightLeft = {id:'terumah-129b', type:'source', title:'Gold and silver · Left and right', ref:'Zohar II, Terumah 129b.7',
    url:'https://www.zoharonline.org/zohar/english/volume-2/terumah/daf-129b/', external:true,
    gloss:'The Zohar reads the order of Shemot 25:3 through left and right. In its account, creation begins from silver on the right, while the Mishkan’s list begins on the left with gold.'};
  const headArms = {id:'terumah-148a', type:'source', title:'Gold, silver, copper · Head and arms', ref:'Zohar II, Terumah 148a.6–7',
    url:'https://www.zoharonline.org/zohar/english/volume-2/terumah/daf-148a/', external:true,
    gloss:'Gold is the supernal head and silver below is the right arm. Copper proceeds from gold through diminution and appears as the left arm.'};
  const group = {id:'group-11', type:'text', detailKind:'Chemistry', title:'Periodic group 11', ref:'American Chemical Society',
    url:'https://www.acs.org/content/dam/acsorg/education/whatischemistry/periodic-table-of-elements/acs-periodic-table-poster_download.pdf',
    external:true, gloss:'Copper (29), silver (47), and gold (79) occupy the same periodic column and share a filled d subshell and one electron in the outer s orbital.',
    note:'The Torah orders the trio gold, silver, copper. The periodic table orders them copper, silver, gold by increasing proton number.'};
  const branches = {id:'metal-branches', type:'lineageSource', title:'Roots and branches', ref:'Baal HaSulam · kabbalah.info',
    url:'https://www.kabbalah.info/en/the-law-of-roots-and-branches/', external:true,
    gloss:'Baal HaSulam describes the lower world as an imprint of the world above.',
    note:'Atlas question: Can the same material express different spiritual qualities according to its role? Compare the two Zohar passages, then ask what the shared chemistry can illuminate. A shared periodic group alone gives no identification of a spiritual root.'};

  const metalNodes = mishkanMetals.map(metal => ({
    id:metal.id, type:'metal', title:metal.title, word:metal.word, meaning:metal.meaning,
    he:metal.word, ref:metal.use ?? 'Bamidbar 31:22–23',
    gloss:`${metal.symbol} · Atomic number ${metal.number} · Group ${metal.group}`,
    note:metal.detail ?? 'Listed among the six metals in the purification passage.',
    url:metal.slug ?? purification.url, sefariaRef:metal.slug ?? purification.url,
    extraActions:sourceLink(metal.chemistry,'Royal Society of Chemistry')
  }));
  const graph = [offering,...metalNodes,rightLeft,headArms,group,purification,branches]
    .map((node,index,all) => ({...node,...nodePosition(index,all.length)}));
  const edges = [];
  function connect(a,b,kind,detail,evidenceType,sources = []) {
    edges.push({a,b,kind,detail,evidenceType,sources});
  }
  function evidence(node) {
    return {label:node.ref,url:node.external ? node.url : 'https://www.sefaria.org/'+node.url};
  }
  for (const metal of metalNodes) {
    connect(purification.id,metal.id,'Named in the passage',`${metal.title} appears in the list of metals governed by the purification instructions.`,'direct',[evidence(purification)]);
  }
  for (const metal of metalNodes.slice(0,3)) {
    connect(offering.id,metal.id,'Mishkan material',metal.note,'direct',[evidence(offering),evidence(metal)]);
    connect(group.id,metal.id,'Periodic classification',`${metal.title} belongs to group 11.`,'direct',
      [evidence(group),{label:'Royal Society of Chemistry',url:mishkanMetals.find(item => item.id === metal.id).chemistry}]);
  }
  connect(offering.id,rightLeft.id,'Zohar reads Shemot 25:3','The Zohar explains the Mishkan’s ordering by beginning on the left, with gold. It describes creation as beginning on the right, with silver.','direct',[evidence(rightLeft)]);
  connect(offering.id,headArms.id,'Zohar reads the three metals','The Zohar discusses gold, silver, and copper as head and arms.','direct',[evidence(headArms)]);
  connect(rightLeft.id,'gold','Zohar · Left','Gold comes first in the Mishkan’s offering list, read here as beginning on the left.','direct',[evidence(rightLeft)]);
  connect(rightLeft.id,'silver','Zohar · Right','In this reading, the world’s creation begins from the side of silver, on the right.','direct',[evidence(rightLeft)]);
  connect(headArms.id,'gold','Zohar · Head','The supernal head is gold.','direct',[evidence(headArms)]);
  connect(headArms.id,'silver','Zohar · Right arm','Silver below is the right arm.','direct',[evidence(headArms)]);
  connect(headArms.id,'copper','Zohar · Left arm','Copper issues from gold and becomes the left arm through diminution.','direct',[evidence(headArms)]);
  connect(offering.id,purification.id,'Shared metals','Both passages name gold, silver, and copper in that order. The purification passage names three more metals.','context',[evidence(offering),evidence(purification)]);
  connect(offering.id,group.id,'Torah and chemistry','The three metals introduced together in Shemot 25:3 occupy one periodic column. The comparison joins two independent ways of grouping them.','reading',[evidence(offering),evidence(group)]);
  connect(rightLeft.id,headArms.id,'Two Zohar readings','Compare gold’s role in the Mishkan’s left-to-right ordering with its role as the head from which copper proceeds.','reading',[evidence(rightLeft),evidence(headArms)]);
  connect(branches.id,group.id,'Roots-and-branches question','Could a recurring chemical relation express a recurring spiritual relation? Baal HaSulam supplies the framework. The comparison to group 11 is the Atlas’s proposal.','reading',[evidence(branches),evidence(group)]);

  const selected = graph.some(node => node.id === id) ? id : offering.id;
  setAtlas(graph,edges,selected,{focus,onSelect(node) {
    changeLocation({view:'metals',node:node.id});
    return false;
  }});
}
