'use strict';

const orderedVessels = ['Keter','Hochma','Bina','Tifferet','Malchut'];
const enteringLights = ['Nefesh','Ruach','Neshama','Haya','Yechida'];

function stageVessels(stage) {
  return orderedVessels.map((vessel,index) => ({
    vessel, light:enteringLights[stage-1-index] ?? null
  }));
}

function showStage(stage) {
  const previous = stageVessels(stage-1);
  $('sequence-table').innerHTML = stageVessels(stage).map(({vessel,light},index) => {
    const shift = !light ? '' : index === 0 ? 'Enters' : previous[index-1].light === light ? 'Moves down' : '';
    return `<tr class="${light ? 'occupied' : 'unformed'}"><th scope="row">${vessel}</th>
      <td>${light ?? 'Vessel not formed'}</td><td>${shift}</td></tr>`;
  }).join('');
  const final = stage === orderedVessels.length;
  $('sequence-status').textContent = stage === 1
    ? 'Keter forms first. Nefesh enters and clothes it.'
    : `${orderedVessels[stage-1]} forms. ${enteringLights[stage-1]} enters Keter, and each earlier light moves down one vessel.${final ? ' All five now occupy their designated vessels.' : ''}`;
  markPressed($('sequence-stages'), $('sequence-stages').querySelector(`[data-stage="${stage}"]`));
}

$('sequence-stages').innerHTML = orderedVessels.map((vessel,index) =>
  `<button type="button" data-stage="${index+1}" aria-pressed="false" aria-label="Stage ${index+1}, ${vessel} forms">${index+1} · ${vessel}</button>`
).join('');
$('sequence-stages').addEventListener('click',event => {
  const button = event.target.closest('[data-stage]');
  if (button) showStage(Number(button.dataset.stage));
});

function openSequence(focus) {
  setHeader('sequence','Lights and vessels','Follow the order of formation and reception in Baal HaSulam’s Preface to the Wisdom of Kabbalah, §§24–25.');
  showStage(1);
  if (focus) $('atlas-title').focus();
}
