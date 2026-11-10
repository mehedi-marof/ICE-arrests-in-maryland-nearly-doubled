// embed.js: draws one chart on a stand-alone embed page and tells the parent page how tall it is.
// The chart is picked by <body data-chart="...">. Charts and data are the same files the story uses.
import { loadData } from '../js/lib/data.js';
import { drawGrowth } from '../js/charts/growth.js';
import { drawStateShare } from '../js/charts/stateShare.js';
import { drawShareMonthly } from '../js/charts/shareMonthly.js';
import { createArrestMap } from '../js/charts/arrestMap.js';

const $ = id => document.getElementById(id);
const chart = document.body.dataset.chart;

// Report height to the parent page (handled by embed/resize.js on the partner's page).
function postHeight() {
  const h = Math.ceil(document.documentElement.getBoundingClientRect().height);
  parent.postMessage({ type: 'cns-embed-height', src: location.href, height: h }, '*');
}
new ResizeObserver(postHeight).observe(document.body);
addEventListener('load', postHeight);

// The map steps match the story's scrollytelling cards.
const STEPS = [
  { mode: 'all', choro: false, text: '<b>ICE has made 9,071 arrests in Maryland since Jan. 20, 2025.</b> Each circle marks a city or town where ICE recorded arrests, sized by the number of arrests through Aug. 6, 2026.', legend: '<span><i style="background:#3a3a3a"></i>All arrests</span>' },
  { mode: 'norecord', choro: false, text: "<b>Most had no criminal record.</b> About 63% had no prior criminal conviction and no pending charge in ICE's records.", legend: '<span><i style="background:var(--red)"></i>No prior conviction or pending charge</span>' },
  { mode: 'office', choro: false, text: "<b>Hundreds were arrested at ICE's own offices.</b> ICE made 889 arrests at its Baltimore field office and at the office where immigrants under supervision report for check-ins. About 77% had no record.", legend: "<span><i style=\"background:var(--rust)\"></i>At ICE's offices</span>" },
  { mode: 'community', choro: false, text: '<b>Most arrests were non-custodial.</b> Agents found people at homes, workplaces and on the street. About 69% of those arrests involved someone with no record.', legend: '<span><i style="background:var(--orange)"></i>Non-custodial</span>' },
  { mode: 'norecord', choro: true, text: '<b>The Eastern Shore stands out.</b> Its nine counties, outlined, are home to about 7% of Marylanders but had 23% of ICE\'s arrests since Jan. 20, 2025. Rates are per resident, not per immigrant resident.', legend: '<span><i style="background:#4d8fc7"></i>Arrests per 10,000 residents</span><span><i style="background:var(--ink)"></i>Eastern Shore</span>' },
];

async function init() {
  if (chart === 'growth') {
    const D = await loadData('../data/', ['growth'], []);
    const draw = () => drawGrowth($('viz'), D.growth); draw(); onWidth(draw);
  } else if (chart === 'states') {
    const D = await loadData('../data/', ['states'], []);
    const draw = () => drawStateShare($('viz'), D.states); draw(); onWidth(draw);
  } else if (chart === 'share') {
    const D = await loadData('../data/', ['share_monthly'], []);
    const draw = () => drawShareMonthly($('viz'), D.share_monthly); draw(); onWidth(draw);
  } else if (chart === 'map') {
    const D = await loadData('../data/', ['counties', 'cities'], ['maryland']);
    const map = createArrestMap($('viz'), D);
    $('scale').innerHTML = map.legendHTML();
    const buttons = [...document.querySelectorAll('.controls button')];
    const show = (i, animate = true) => {
      const s = STEPS[i];
      map.setMode(s.mode, s.choro, animate);
      $('step-text').innerHTML = s.text;
      $('step-legend').innerHTML = s.legend;
      $('scale').style.display = s.choro ? 'flex' : 'none';
      buttons.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
    };
    buttons.forEach((b, i) => b.addEventListener('click', () => show(i)));
    show(0, false);
  }
  postHeight();
}

function onWidth(draw) {
  let w = innerWidth;
  addEventListener('resize', () => { if (innerWidth === w) return; w = innerWidth; clearTimeout(onWidth.t); onWidth.t = setTimeout(() => { draw(); postHeight(); }, 150); });
}

init().catch(err => { console.error(err); $('viz').innerHTML = '<p class="chart-note">This chart could not load.</p>'; });
