const DEFAULT_LABELS = [
  'being a dom', 'being a sub', 'being a switch', 'choking', 'being choked',
  'spanking', 'being spanked', 'ddlg / mdlb', 'age play', 'doing stuff in public',
  'wax play', 'water sports', 'role play', 'consensual non consent',
  'having orgasms controlled', 'controlling orgasms', 'gags', 'feet', 'anal',
  'being tied up', 'tying people up', 'humiliating or degrading',
  'being humiliated or degraded', 'bdsm', 'threesomes', 'sadism', 'masochism', 'spit'
];
const PRESETS = ['#e63946','#ff5d8f','#ff8c42','#ffd23f','#7bd389','#2ec4b6','#3a86ff','#5b2a86','#c77dff','#8d1d3a','#8d5524','#2b2d42'];
const STORAGE_KEY = 'my-kink-jars-v1';
const MAX_LABEL_LENGTH = 40;

function readSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
const saved = readSaved();
const state = {
  name: typeof saved.name === 'string' ? saved.name.slice(0, 32) : '',
  color: /^#[0-9a-f]{6}$/i.test(saved.color) ? saved.color : PRESETS[0],
  opacity: Number.isInteger(saved.opacity) && saved.opacity >= 0 && saved.opacity <= 100 ? saved.opacity : 100,
  labels: DEFAULT_LABELS.map((label, index) => typeof saved.labels?.[index] === 'string' ? saved.labels[index].slice(0, MAX_LABEL_LENGTH) : label),
  scores: DEFAULT_LABELS.map((_, index) => [0,1,2,3,4,5,6].includes(saved.scores?.[index]) ? saved.scores[index] : 0)
};

const $ = id => document.getElementById(id);
const canvas = $('poster');
const ctx = canvas.getContext('2d');
let drawTimer;

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function queueDraw() {
  clearTimeout(drawTimer);
  drawTimer = setTimeout(drawPoster, 35);
}
function rgb(hex) { return [1,3,5].map(i => parseInt(hex.slice(i, i + 2), 16)); }
function hexFromRgb(values) { return '#' + values.map(value => Number(value).toString(16).padStart(2, '0')).join(''); }
function hsvFromHex(hex) {
  const [red, green, blue] = rgb(hex).map(value => value / 255);
  const max = Math.max(red, green, blue), min = Math.min(red, green, blue), delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  return {hue, saturation: max ? (delta / max) * 100 : 0, brightness: max * 100};
}
function hexFromHsv({hue, saturation, brightness}) {
  const chroma = brightness / 100 * saturation / 100;
  const segment = (hue % 360) / 60;
  const secondary = chroma * (1 - Math.abs(segment % 2 - 1));
  const offset = brightness / 100 - chroma;
  const channels = segment < 1 ? [chroma, secondary, 0] : segment < 2 ? [secondary, chroma, 0] : segment < 3 ? [0, chroma, secondary] : segment < 4 ? [0, secondary, chroma] : segment < 5 ? [secondary, 0, chroma] : [chroma, 0, secondary];
  return hexFromRgb(channels.map(value => Math.round((value + offset) * 255)));
}
function fillColor() {
  return state.opacity === 100 ? state.color : `rgba(${rgb(state.color).join(',')},${state.opacity / 100})`;
}
const picker = hsvFromHex(state.color);

function favoriteJarSvg(color) {
  return `<svg class="jar-svg" viewBox="0 0 80 120" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 20 Q12 23 12 30 V103 Q12 112 21 112 H59 Q68 112 68 103 V30 Q68 23 66 20 Z" fill="${color}" stroke="#171717" stroke-width="2.6"/>
    <path d="M20 35 V94 M20 99 V104" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
    <path d="M14 26 Q23 16 34 21 Q46 13 57 20 Q64 18 69 24 C74 24 77 28 77 34 V79 Q77 87 73 87 Q69 87 69 79 V48 Q69 43 66 43 Q63 43 63 48 V66 Q63 72 59 72 Q55 72 55 66 V34 Q34 29 14 34Z" fill="${color}" stroke="#171717" stroke-width="2" stroke-linejoin="round"/>
    <path d="M73 34 V74" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
    <path d="M73 94 Q69 100 69 104 Q69 109 73 109 Q77 109 77 104 Q77 100 73 94Z" fill="${color}" stroke="#171717" stroke-width="1.6"/>
    <g transform="rotate(-7 40 10)"><rect x="12" y="4" width="56" height="12" rx="3" fill="#fff" stroke="#171717" stroke-width="2.5"/><path d="M15 9 H65 M15 13 H65" stroke="#171717" stroke-width="1.3"/></g>
    <path d="M21 106 Q27 109 34 107 M54 107 Q59 108 63 105" fill="none" stroke="#171717" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`;
}

function jarSvg(value, color, id) {
  if (value === 6) return favoriteJarSvg(color);
  const fillTop = value ? 104 - value * 16 : 112;
  const extra = value === 5 ? `<path d="M13 20 H67 V27 Q64 27 64 34 V42 Q64 47 60 47 Q56 47 56 42 V31 Q55 29 53 31 V50 Q53 55 49 55 Q45 55 45 50 V33 Q43 29 40 31 V43 Q40 48 36 48 Q32 48 32 43 V31 Q29 29 27 32 V39 Q27 44 23 44 Q19 44 19 39 V29 H13 Z" fill="${color}" stroke="#171717" stroke-width="2"/>` : '';
  return `<svg class="jar-svg" viewBox="0 0 80 120" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="jar-clip-${id}"><path d="M14 20 Q12 23 12 30 V103 Q12 112 21 112 H59 Q68 112 68 103 V30 Q68 23 66 20 Z"/></clipPath></defs>
    <path d="M14 20 Q12 23 12 30 V103 Q12 112 21 112 H59 Q68 112 68 103 V30 Q68 23 66 20 Z" fill="#fff"/>
    <g clip-path="url(#jar-clip-${id})"><path d="M9 ${fillTop} Q25 ${fillTop-3} 40 ${fillTop+1} T71 ${fillTop} V118 H9 Z" fill="${color}"/><path d="M11 ${fillTop+1} Q37 ${fillTop-2} 69 ${fillTop+1}" fill="none" stroke="#171717" stroke-width="1.4" opacity=".48"/></g>
    <path d="M14 20 Q12 23 12 30 V103 Q12 112 21 112 H59 Q68 112 68 103 V30 Q68 23 66 20 Z" fill="none" stroke="#171717" stroke-width="2.6"/>
    <path d="M20 106 Q27 109 34 107 M54 107 Q59 108 63 105" fill="none" stroke="#171717" stroke-width="1.4" stroke-linecap="round"/>
    <rect x="12" y="10" width="56" height="12" rx="3" fill="#fff" stroke="#171717" stroke-width="2.5"/>
    <path d="M14 15 H66 M14 19 H66" stroke="#171717" stroke-width="1.3"/>
    ${extra}
  </svg>`;
}

function renderSwatches() {
  $('swatches').innerHTML = PRESETS.map(color => `<button type="button" class="swatch" style="--swatch:${color}" data-color="${color}" aria-label="Color ${color}" aria-pressed="${state.color.toLowerCase() === color}"></button>`).join('');
}
function updateColorUI() {
  const field = $('color-field');
  field.style.setProperty('--picker-hue', picker.hue);
  field.style.setProperty('--picker-saturation', `${picker.saturation}%`);
  field.style.setProperty('--picker-brightness', `${100 - picker.brightness}%`);
  field.setAttribute('aria-valuenow', String(Math.round(picker.saturation)));
  field.setAttribute('aria-valuetext', `${Math.round(picker.saturation)}% saturation, ${Math.round(picker.brightness)}% brightness`);
  $('hue').value = picker.hue;
  $('opacity').value = state.opacity;
  $('opacity').style.setProperty('--picker-color', state.color);
  $('opacity-value').value = `${state.opacity}%`;
  $('hex').value = state.color.toUpperCase();
  document.documentElement.style.setProperty('--accent', state.color);
  document.querySelectorAll('.swatch').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.color === state.color.toLowerCase())));
  const color = fillColor();
  $('color-jars').innerHTML = [1,3,6].map((score,index) => jarSvg(score,color,`sample-${index}`)).join('');
  document.querySelectorAll('.question .jar-icon').forEach((element,index) => element.innerHTML = jarSvg(state.scores[index],color,`question-${index}`));
  queueDraw();
}
function renderQuestions() {
  $('questions').innerHTML = state.labels.map((label,index) => `<div class="question" data-index="${index}">
    <div class="jar-icon">${jarSvg(state.scores[index],fillColor(),`question-${index}`)}</div>
    <div class="question-content">
      <div class="question-head"><div class="question-number">${index + 1} of ${state.labels.length}</div><div class="move-controls"><button class="move-button" type="button" data-move="-1" aria-label="Move jar ${index + 1} up" title="Move up" ${index === 0 ? 'disabled' : ''}>↑</button><button class="move-button" type="button" data-move="1" aria-label="Move jar ${index + 1} down" title="Move down" ${index === state.labels.length - 1 ? 'disabled' : ''}>↓</button></div></div>
      <div class="jar-name-wrap"><input class="jar-name" aria-label="Name for jar ${index + 1}" type="text" maxlength="${MAX_LABEL_LENGTH}" spellcheck="false" placeholder="Name this jar" value="${escapeAttribute(label)}" title="Rename this jar (up to ${MAX_LABEL_LENGTH} characters)" /><span class="edit-mark" aria-hidden="true">✎</span></div>
      <div class="score-buttons" role="group" aria-label="Fill level for jar ${index + 1}">${[0,1,2,3,4,5].map(score => `<button type="button" class="score-button" data-score="${score}" aria-label="${score === 0 ? '0, empty' : `${score} out of 5`}" aria-pressed="${state.scores[index] === score}">${score}</button>`).join('')}<button type="button" class="score-button favorite-button" data-score="6" aria-label="Favorite, spilling over" title="Favorite, spilling over" aria-pressed="${state.scores[index] === 6}">★</button></div>
      <div class="scale"><span>empty</span><span>overflowing</span><span>favorite</span></div>
    </div>
  </div>`).join('');
}
function escapeAttribute(text) { return text.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;'); }

function setColor(hex) {
  state.color = hex.toLowerCase();
  const next = hsvFromHex(state.color);
  if (next.saturation && next.brightness) picker.hue = next.hue;
  picker.saturation = next.saturation;
  picker.brightness = next.brightness;
  updateColorUI();
  persist();
}
function setColorFromPicker() {
  state.color = hexFromHsv(picker);
  updateColorUI();
  persist();
}

function saveSetup() {
  const file = new Blob([JSON.stringify(state.labels, null, 2) + '\n'], {type:'application/json'});
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'kink-jars-setup.json';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('setup-status').textContent = 'Setup download started. Share the JSON file with anyone who wants these jars.';
}

async function loadSetup(file) {
  try {
    const labels = JSON.parse(await file.text());
    if (!Array.isArray(labels) || labels.length !== DEFAULT_LABELS.length ||
        !labels.every(label => typeof label === 'string' && label.length <= MAX_LABEL_LENGTH)) {
      throw new Error('Invalid setup');
    }
    state.labels = labels;
    state.scores = DEFAULT_LABELS.map(() => 0);
    $('clear-status').textContent='';
    renderQuestions();
    persist();
    queueDraw();
    $('setup-status').textContent = 'Setup loaded. All 28 jars are empty and ready to fill.';
  } catch {
    $('setup-status').textContent = 'Could not load this setup. Choose a setup JSON file with 28 descriptions (40 characters each).';
  }
}

function roundRect(x,y,w,h,r) {
  ctx.beginPath(); ctx.roundRect(x,y,w,h,r);
}
function drawFavoriteJar(x,y,w,h,color) {
  ctx.save();
  // Match the body bounds used by drawJar; the raised lid and spill extend past them.
  const scaleX=(w-12)/56;
  const scaleY=(h-20)/92;
  ctx.translate(x+6-12*scaleX,y+20-20*scaleY);
  ctx.scale(scaleX,scaleY);
  const paint = (path,fill,width=2.5) => {
    const shape=new Path2D(path);
    ctx.fillStyle=fill;ctx.strokeStyle='#171717';ctx.lineWidth=width;
    ctx.lineJoin='round';ctx.fill(shape);ctx.stroke(shape);
  };
  paint('M14 20 Q12 23 12 30 V103 Q12 112 21 112 H59 Q68 112 68 103 V30 Q68 23 66 20 Z',color,2.6);
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=3;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(20,35);ctx.lineTo(20,94);ctx.moveTo(20,99);ctx.lineTo(20,104);ctx.stroke();
  paint('M14 26 Q23 16 34 21 Q46 13 57 20 Q64 18 69 24 C74 24 77 28 77 34 V79 Q77 87 73 87 Q69 87 69 79 V48 Q69 43 66 43 Q63 43 63 48 V66 Q63 72 59 72 Q55 72 55 66 V34 Q34 29 14 34Z',color,2);
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(73,34);ctx.lineTo(73,74);ctx.stroke();
  paint('M73 94 Q69 100 69 104 Q69 109 73 109 Q77 109 77 104 Q77 100 73 94Z',color,1.6);
  ctx.save();ctx.translate(40,10);ctx.rotate(-7*Math.PI/180);ctx.translate(-40,-10);
  ctx.fillStyle='#fff';ctx.strokeStyle='#171717';ctx.lineWidth=2.5;
  roundRect(12,4,56,12,3);ctx.fill();ctx.stroke();
  ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(15,9);ctx.lineTo(65,9);ctx.moveTo(15,13);ctx.lineTo(65,13);ctx.stroke();
  ctx.restore();
  ctx.strokeStyle='#171717';ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(21,106);ctx.quadraticCurveTo(27,109,34,107);
  ctx.moveTo(54,107);ctx.quadraticCurveTo(59,108,63,105);ctx.stroke();
  ctx.restore();
}
function drawJar(x,y,w,h,value,color) {
  if(value===6){drawFavoriteJar(x,y,w,h,color);return;}
  const bodyY = y + 20;
  const bottom = y + h;
  ctx.save();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#171717'; ctx.lineWidth = 4;
  roundRect(x+6,bodyY,w-12,h-20,15);ctx.fill();
  ctx.save();roundRect(x+8,bodyY+2,w-16,h-24,12);ctx.clip();
  if(value) {
    const top = bottom - 10 - value * (h-36)/5;
    ctx.fillStyle = color;
    ctx.beginPath();ctx.moveTo(x+7,top);
    ctx.bezierCurveTo(x+w*.3,top-5,x+w*.65,top+5,x+w-7,top);
    ctx.lineTo(x+w-7,bottom);ctx.lineTo(x+7,bottom);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(23,23,23,.55)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x+8,top);ctx.bezierCurveTo(x+w*.3,top-5,x+w*.65,top+5,x+w-8,top);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.26)';
    for(let dot=0;dot<5;dot++){const dx=x+22+((dot*23+value*7)%(w-42));const dy=top+22+((dot*31)%(bottom-top-34));if(dy<bottom-10){ctx.beginPath();ctx.arc(dx,dy,2+dot%2,0,Math.PI*2);ctx.fill();}}
  }
  ctx.restore();
  roundRect(x+6,bodyY,w-12,h-20,15);ctx.stroke();
  ctx.strokeStyle='#171717';ctx.lineWidth=2;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x+19,bottom-12);ctx.quadraticCurveTo(x+25,bottom-8,x+36,bottom-10);ctx.moveTo(x+w-35,bottom-10);ctx.quadraticCurveTo(x+w-24,bottom-8,x+w-18,bottom-12);ctx.stroke();
  ctx.fillStyle='#fff';ctx.strokeStyle='#171717';ctx.lineWidth=4;
  roundRect(x+5,y+4,w-10,21,5);ctx.fill();ctx.stroke();
  ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+8,y+13);ctx.lineTo(x+w-8,y+13);ctx.moveTo(x+8,y+19);ctx.lineTo(x+w-8,y+19);ctx.stroke();
  if(value===5){
    ctx.fillStyle=color;ctx.strokeStyle='#171717';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(x+8,y+22);ctx.lineTo(x+w-8,y+22);ctx.lineTo(x+w-8,y+36);
    ctx.quadraticCurveTo(x+w-14,y+40,x+w-19,y+34);
    ctx.lineTo(x+w-19,y+63);ctx.quadraticCurveTo(x+w-24,y+72,x+w-29,y+63);
    ctx.lineTo(x+w-29,y+36);ctx.quadraticCurveTo(x+w-34,y+30,x+w-39,y+37);
    ctx.lineTo(x+w-39,y+53);ctx.quadraticCurveTo(x+w-44,y+61,x+w-49,y+52);
    ctx.lineTo(x+w-49,y+37);ctx.quadraticCurveTo(x+24,y+30,x+19,y+38);
    ctx.lineTo(x+19,y+61);ctx.quadraticCurveTo(x+13,y+70,x+9,y+60);
    ctx.closePath();ctx.fill();ctx.stroke();
  }
  ctx.restore();
}

function wrapLabel(text,maxWidth) {
  const words=(text.trim() || ' ').split(/\s+/);
  const lines=[];let line='';
  for(const word of words){
    const candidate=line?`${line} ${word}`:word;
    if(ctx.measureText(candidate).width<=maxWidth){line=candidate;continue;}
    if(line){lines.push(line);line='';}
    if(ctx.measureText(word).width<=maxWidth){line=word;continue;}
    for(const character of word){
      if(line && ctx.measureText(line+character).width>maxWidth){lines.push(line);line='';}
      line+=character;
    }
  }
  if(line)lines.push(line);
  return lines;
}

function drawPoster() {
  const W=canvas.width,H=canvas.height;
  ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#171717';
  ctx.font='700 108px Oswald, Impact, sans-serif';
  ctx.textBaseline='alphabetic';
  const title='Kink Jars';
  const titleX=W/2+45;
  ctx.fillText(title,titleX,160);
  ctx.strokeStyle='#171717';ctx.lineWidth=5;
  ctx.beginPath();ctx.moveTo(240,155);ctx.lineTo(titleX-25,155);ctx.stroke();
  if(state.name.trim()){
    let nameSize=49;ctx.font=`700 ${nameSize}px Oswald, Impact, sans-serif`;ctx.textAlign='right';
    while(ctx.measureText(state.name.trim()).width>titleX-280&&nameSize>25){nameSize--;ctx.font=`700 ${nameSize}px Oswald, Impact, sans-serif`;}
    ctx.fillText(state.name.trim(),titleX-33,139);ctx.textAlign='left';
  }
  ctx.font='500 28px Oswald, Impact, sans-serif';ctx.textAlign='center';
  ctx.fillText('(0 = empty · 5 = overflowing · ★ = favorite, spilling over)',W/2+140,214);
  const cols=7,cell=177,startX=81,startY=290,rowGap=390;
  state.labels.forEach((label,index)=>{
    const col=index%cols,row=Math.floor(index/cols);
    const x=startX+col*cell,y=startY+row*rowGap;
    drawJar(x+32,y,112,190,state.scores[index],fillColor());
    let font=700;let size=29;
    ctx.font=`${font} ${size}px Oswald, Impact, sans-serif`;
    let lines=wrapLabel(label,cell-8);
    while(lines.length>4&&size>17){size-=1;ctx.font=`${font} ${size}px Oswald, Impact, sans-serif`;lines=wrapLabel(label,cell-8);}
    ctx.fillStyle='#171717';ctx.textAlign='center';
    lines.forEach((line,lineIndex)=>ctx.fillText(line,x+cell/2,y+222+lineIndex*(size+3)));
  });
  ctx.textAlign='left';
}

function wireEvents() {
  $('name').value=state.name;
  $('name').addEventListener('input',event=>{state.name=event.target.value;persist();queueDraw();});
  $('swatches').addEventListener('click',event=>{const button=event.target.closest('.swatch');if(button)setColor(button.dataset.color);});
  const field = $('color-field');
  const chooseFromField = event => {
    const bounds = field.getBoundingClientRect();
    picker.saturation = Math.round(Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)) * 100);
    picker.brightness = Math.round((1 - Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))) * 100);
    setColorFromPicker();
  };
  field.addEventListener('pointerdown',event=>{field.setPointerCapture(event.pointerId);chooseFromField(event);});
  field.addEventListener('pointermove',event=>{if(field.hasPointerCapture(event.pointerId))chooseFromField(event);});
  field.addEventListener('keydown',event=>{
    const step = event.shiftKey ? 10 : 1;
    if(event.key === 'ArrowLeft') picker.saturation = Math.max(0,picker.saturation-step);
    else if(event.key === 'ArrowRight') picker.saturation = Math.min(100,picker.saturation+step);
    else if(event.key === 'ArrowUp') picker.brightness = Math.min(100,picker.brightness+step);
    else if(event.key === 'ArrowDown') picker.brightness = Math.max(0,picker.brightness-step);
    else return;
    event.preventDefault();setColorFromPicker();
  });
  $('hue').addEventListener('input',event=>{picker.hue=Number(event.target.value);setColorFromPicker();});
  $('opacity').addEventListener('input',event=>{state.opacity=Number(event.target.value);updateColorUI();persist();});
  $('hex').addEventListener('input',event=>{const value=event.target.value.trim();if(/^#?[0-9a-f]{6}$/i.test(value))setColor('#'+value.replace('#',''));});
  $('hex').addEventListener('blur',()=>{$('hex').value=state.color.toUpperCase();});
  $('save-setup').addEventListener('click',saveSetup);
  $('load-setup').addEventListener('click',()=>$('setup-file').click());
  $('clear-values').addEventListener('click',()=>{
    state.labels.fill('');
    state.scores.fill(0);
    renderQuestions();persist();queueDraw();
    $('clear-status').textContent='All jars and descriptions are clear.';
  });
  $('setup-file').addEventListener('change',async event=>{
    const file=event.target.files?.[0];
    if(file)await loadSetup(file);
    event.target.value='';
  });
  $('questions').addEventListener('input',event=>{
    if(!event.target.matches('.jar-name'))return;
    const index=Number(event.target.closest('.question').dataset.index);
    state.labels[index]=event.target.value;
    $('clear-status').textContent='';
    persist();queueDraw();
  });
  $('questions').addEventListener('click',event=>{
    const moveButton=event.target.closest('.move-button');
    if(moveButton){
      const index=Number(moveButton.closest('.question').dataset.index);
      const direction=Number(moveButton.dataset.move);
      const next=index+direction;
      [state.labels[index],state.labels[next]]=[state.labels[next],state.labels[index]];
      [state.scores[index],state.scores[next]]=[state.scores[next],state.scores[index]];
      renderQuestions();persist();queueDraw();
      const nextButton=$('questions').querySelector(`.question[data-index="${next}"] .move-button[data-move="${direction}"]`);
      if(nextButton.disabled)$('questions').querySelector(`.question[data-index="${next}"] .jar-name`).focus();
      else nextButton.focus();
      return;
    }
    const button=event.target.closest('.score-button');if(!button)return;
    const row=button.closest('.question'),index=Number(row.dataset.index),score=Number(button.dataset.score);
    state.scores[index]=score===0||state.scores[index]===score?0:score;
    $('clear-status').textContent='';
    row.querySelectorAll('.score-button').forEach(item=>item.setAttribute('aria-pressed',String(Number(item.dataset.score)===state.scores[index])));
    row.querySelector('.jar-icon').innerHTML=jarSvg(state.scores[index],fillColor(),`question-${index}`);
    persist();queueDraw();
  });
  $('save').addEventListener('click',()=>{
    drawPoster();
    const link=document.createElement('a');link.download='my-kink-jars.png';link.href=canvas.toDataURL('image/png');document.body.append(link);link.click();link.remove();
  });
  $('reset').addEventListener('click',()=>{
    state.name='';state.color=PRESETS[0];state.opacity=100;Object.assign(picker,hsvFromHex(state.color));state.labels=[...DEFAULT_LABELS];state.scores=DEFAULT_LABELS.map(()=>0);
    $('name').value='';$('setup-status').textContent='';$('clear-status').textContent='';renderSwatches();renderQuestions();updateColorUI();persist();window.scrollTo({top:0,behavior:'smooth'});
  });
}

renderSwatches();
renderQuestions();
updateColorUI();
wireEvents();
document.fonts?.ready.then(drawPoster);
