'use strict';

const categories = {
  study: { label: 'Journal study', plural: 'Studies', color: '#edbc78' },
  text: { label: 'Source text', plural: 'Texts', color: '#8cc6bd' },
  passage: { label: 'Passage', plural: 'Passages', color: '#edbc78' },
  person: { label: 'Person', plural: 'People', color: '#bca3e5' },
  parsha: { label: 'Parsha', plural: 'Parashot', color: '#8cc6bd' },
  motif: { label: 'Motif', plural: 'Motifs', color: '#e899a8' },
  source: { label: 'Commentary', plural: 'Commentary', color: '#9aace4' }
};

const curatedNodes = [
  { id:'ladder', type:'passage', title:'Yaakov’s Ladder', ref:'Genesis 28:12', url:'Genesis.28.12', he:'וַיַּחֲלֹם וְהִנֵּה סֻלָּם מֻצָּב אַרְצָה וְרֹאשׁוֹ מַגִּיעַ הַשָּׁמָיְמָה', gloss:'He dreamed of a ladder planted on the earth, its top reaching toward heaven.', word:'סֻלָּם', meaning:'sullam · ladder', note:'The dream shows movement in both directions. Messengers go up and down, and Yaakov wakes to call the place a gate of heaven.', position:[0.19,0.32], offset:[16,-15] },
  { id:'tower', type:'passage', title:'Tower of Bavel', ref:'Genesis 11:4', url:'Genesis.11.4', he:'וּמִגְדָּל וְרֹאשׁוֹ בַשָּׁמַיִם', gloss:'A tower with its top in the heavens.', word:'מִגְדָּל', meaning:'migdal · tower', note:'The builders want to make a name for themselves and avoid dispersal. Compare their project with the structure Yaakov sees in a dream.', position:[2.61,-0.40], offset:[-15,19] },
  { id:'gate', type:'passage', title:'Gate of Heaven', ref:'Genesis 28:17', url:'Genesis.28.17', he:'אֵין זֶה כִּי אִם בֵּית אֱלֹהִים וְזֶה שַׁעַר הַשָּׁמָיִם', gloss:'This is the house of God, and this is the gate of heaven.', word:'שַׁעַר', meaning:'sha’ar · gate', note:'After the dream, Yaakov identifies the place itself as a threshold between the earthly and the divine.', position:[1.55,0.69], offset:[15,-12] },
  { id:'sinai', type:'passage', title:'Descent at Sinai', ref:'Exodus 19:20', url:'Exodus.19.20', he:'וַיֵּרֶד יְהוָה עַל הַר סִינַי אֶל רֹאשׁ הָהָר', gloss:'HaShem descended upon Mount Sinai, to the summit of the mountain.', word:'סִינַי', meaning:'Sinai', note:'In the same verse, HaShem descends to the summit and calls Moshe to ascend. Bereshit Rabbah reads this meeting through Yaakov’s ladder.', position:[0.72,-0.71], offset:[15,19] },
  { id:'mishkan', type:'passage', title:'Dwelling Below', ref:'Exodus 25:8', url:'Exodus.25.8', he:'וְעָשׂוּ לִי מִקְדָּשׁ וְשָׁכַנְתִּי בְּתוֹכָם', gloss:'Let them make me a sanctuary, and I will dwell among them.', word:'מִקְדָּשׁ', meaning:'mikdash · sanctuary', note:'The sanctuary adds a different spatial relation to the atlas: a divine presence dwelling among people.', position:[1.99,0.15], offset:[13,16] },
  { id:'fire', type:'passage', title:'Fire to Heaven', ref:'Deuteronomy 4:11', url:'Deuteronomy.4.11', he:'וְהָהָר בֹּעֵר בָּאֵשׁ עַד לֵב הַשָּׁמַיִם', gloss:'The mountain burned with fire to the heart of heaven.', word:'אֵשׁ', meaning:'esh · fire', note:'Moshe recalls the revelation at Horeb. This verse supplies the midrash with an image matching the ladder’s reach.', position:[-0.75,0.92], offset:[-13,-12] },
  { id:'yaakov', type:'person', title:'Yaakov', ref:'Genesis 28:10–22', url:'Genesis.28.10-22', he:'יַעֲקֹב', gloss:'On his way to Haran, Yaakov stops for the night and dreams.', word:'יַעֲקֹב', meaning:'Yaakov · Jacob', note:'The same person who sees the ladder names the place Bethel and sets up the stone as a pillar.', position:[-0.95,0.31], offset:[-14,-15] },
  { id:'vayetze', type:'parsha', title:'Vayetze', ref:'Genesis 28:10–32:3', url:'Genesis.28.10-32.3', he:'וַיֵּצֵא יַעֲקֹב מִבְּאֵר שָׁבַע', gloss:'Yaakov left Be’er Sheva.', word:'וַיֵּצֵא', meaning:'vayetze · and he went out', note:'The parsha opens with Yaakov’s departure and encounter at Bethel. Near its close, divine messengers meet him again.', position:[-1.62,-0.50], offset:[-12,13] },
  { id:'heaven', type:'motif', title:'Heaven & Earth', ref:'Genesis 1:1', url:'Genesis.1.1', he:'אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ', gloss:'The heavens and the earth.', word:'שָׁמַיִם', meaning:'shamayim · heavens', note:'Follow vertical imagery across the atlas and compare what crosses the boundary in each passage: builders’ ambition, messengers, fire, or divine presence.', position:[-1.85,0.95], offset:[-12,-12] },
  { id:'midrash', type:'source', title:'The Ladder as Sinai', ref:'Bereshit Rabbah 68:12', url:'Bereshit_Rabbah.68.12', gloss:'A midrash aligns details of Yaakov’s dream with the revelation at Sinai.', note:'It pairs the top reaching heaven with the mountain’s fire, and the divine presence above the ladder with the descent at Sinai.', position:[-0.49,-0.53], offset:[-15,16] },
  { id:'ibn', type:'source', title:'Ibn Ezra', ref:'Ibn Ezra on Genesis 28:12', url:'Ibn_Ezra_on_Genesis.28.12.1', gloss:'Ibn Ezra discusses multiple readings of the ladder, including its numerical association with Sinai.', note:'He calls the numerical reading a derash and offers an account of ascending and descending messengers in relation to divine governance.', position:[-0.37,0.01], offset:[-15,14] },
  { id:'terumah', type:'parsha', title:'Terumah', ref:'Exodus 25:1–27:19', url:'Exodus.25.1-27.19', he:'וְיִקְחוּ לִי תְּרוּמָה', gloss:'Let them take an offering for me.', word:'תְּרוּמָה', meaning:'terumah · offering', note:'Instructions for the sanctuary begin with contributions from willing participants.', position:[2.98,0.34], offset:[15,-13] }
];

const curatedEdges = [
  ['ladder','tower','Textual echo','Both structures have a “top” associated with heaven. Bavel’s builders propose a tower, while the ladder appears in Yaakov’s dream.'],
  ['ladder','sinai','Gematria · traditional','The consonants of סֻלָּם in Genesis 28:12 give 130, the same as סיני. Ibn Ezra describes this numerical reading as derash.'],
  ['ladder','gate','Narrative','After waking from the dream, Yaakov calls the place a gate of heaven.'],
  ['ladder','yaakov','Narrative','Yaakov sees the ladder and the messengers in the dream.'],
  ['ladder','vayetze','Text location','The dream belongs to the opening episode of Parashat Vayetze.'],
  ['ladder','midrash','Traditional reading','Bereshit Rabbah reads the dream as an image of revelation at Sinai.'],
  ['ladder','ibn','Commentary','Ibn Ezra comments directly on Genesis 28:12.'],
  ['ladder','heaven','Thematic reading','The ladder gives visible shape to the boundary and passage between earth and heaven.'],
  ['sinai','midrash','Traditional reading','The midrash pairs the divine descent at Sinai with the divine presence in the dream.'],
  ['fire','midrash','Source cited','The midrash cites the fire reaching to heaven in Deuteronomy 4:11.'],
  ['fire','sinai','Narrative parallel','Deuteronomy recalls the mountain revelation through Moshe’s speech.'],
  ['gate','mishkan','Thematic reading','The house of God at Bethel and the sanctuary both frame encounter through place.'],
  ['mishkan','terumah','Text location','The sanctuary command appears in Parashat Terumah.'],
  ['yaakov','vayetze','Narrative','Vayetze follows Yaakov through departure, exile, and return.'],
  ['tower','heaven','Thematic reading','The builders imagine a tower extending from human settlement into heaven.']
].map(([a,b,kind,detail])=>({a,b,kind,detail}));

// Entries keyed by atlas node ID, journal slug, or canonical Sefaria reference.
// Each entry can hold a video preview and published video/audio layers with captions.
const mediaByNode = new Map();
