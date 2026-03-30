let panX = 0, panY = 0;
let zoom = 1.0;

let currentTool  = 'brush';
let currentColor = '#000000';
let brushSize    = 10;
let bgColor      = '#ffffff';

let isDrawing  = false;
let isPanning  = false;
let spaceHeld  = false;
let lastWX, lastWY;
let startWX, startWY;
let panStartX, panStartY, panStartMouseX, panStartMouseY;

const WORLD_SIZE = 8000;
let layers      = [];
let activeLayer = 0;
let history     = [];
let redoStack   = [];

let gameActive       = false;
let gamePromptText   = '';
let gameOverlayAlpha = 0;

function isOverSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return false;
  const r = sidebar.getBoundingClientRect();
  return mouseX >= r.left && mouseX <= r.right &&
         mouseY >= r.top  && mouseY <= r.bottom;
}

function setup() {
  pixelDensity(1);
  createCanvas(windowWidth, windowHeight).parent('canvas-container');
  panX = WORLD_SIZE / 2 - windowWidth  / 2;
  panY = WORLD_SIZE / 2 - windowHeight / 2;
  addNewLayer();
  saveState();
  setupEventListeners();
  updateZoomDisplay();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(bgColor);

  for (let g of layers) {
    image(g, -panX * zoom, -panY * zoom, WORLD_SIZE * zoom, WORLD_SIZE * zoom);
  }

  if (isDrawing && ['line','rectangle','circle'].includes(currentTool)) drawPreview();
  if (isDrawing && currentTool === 'spray') drawSpray(layers[activeLayer]);

  cursor(spaceHeld || isPanning ? 'grab' : ARROW);

  if (gameActive && gamePromptText) {
    gameOverlayAlpha = min(gameOverlayAlpha + 10, 210);
    const pad  = 16;
    const boxW = min(width - pad * 2, 380);
    push();
    noStroke();
    fill(13, 13, 20, gameOverlayAlpha);
    rect(pad, pad, boxW, 76, 12);
    fill(160, 170, 255, min(gameOverlayAlpha + 60, 255));
    textSize(11); textStyle(BOLD); textAlign(LEFT, TOP);
    text('DRAW THIS:', pad + 12, pad + 10);
    fill(255, 255, 255, min(gameOverlayAlpha + 60, 255));
    textStyle(NORMAL);
    let fs = 28; textSize(fs);
    while (textWidth(gamePromptText) > boxW - 24 && fs > 12) { fs--; textSize(fs); }
    text(gamePromptText, pad + 12, pad + 30);
    pop();
  } else {
    gameOverlayAlpha = 0;
  }
}

function screenToWorldX(sx) { return sx / zoom + panX; }
function screenToWorldY(sy) { return sy / zoom + panY; }
function worldToScreenX(wx) { return (wx - panX) * zoom; }
function worldToScreenY(wy) { return (wy - panY) * zoom; }
function getWorldMouseX()   { return screenToWorldX(mouseX); }
function getWorldMouseY()   { return screenToWorldY(mouseY); }
function clampWorld(v)      { return constrain(v, 0, WORLD_SIZE); }

function mousePressed() {
  if (isOverSidebar()) return;

  if (mouseButton === CENTER || (mouseButton === LEFT && spaceHeld)) {
    isPanning = true;
    panStartX = panX; panStartY = panY;
    panStartMouseX = mouseX; panStartMouseY = mouseY;
    return;
  }

  if (mouseButton !== LEFT) return;

  const wx = clampWorld(getWorldMouseX());
  const wy = clampWorld(getWorldMouseY());

  if (currentTool === 'text') {
    const inputEl   = document.getElementById('textInput');
    const sizeEl    = document.getElementById('textSize');
    const textValue = (inputEl?.value || '').trim();
    const size      = parseInt(sizeEl?.value || '24', 10);
    if (textValue.length > 0) {
      saveState();
      const g = layers[activeLayer];
      g.noStroke(); g.fill(currentColor); g.textSize(size);
      g.text(textValue, wx, wy);
    }
    return;
  }

  isDrawing = true;
  startWX = wx; startWY = wy;
  lastWX  = wx; lastWY  = wy;

  if (['brush','eraser','spray','line','rectangle','circle'].includes(currentTool)) saveState();
  if (currentTool === 'brush' || currentTool === 'eraser') drawPoint(wx, wy);
}

function mouseDragged() {
  if (isOverSidebar() && !isDrawing && !isPanning) return;

  if (isPanning) {
    panX = panStartX - (mouseX - panStartMouseX) / zoom;
    panY = panStartY - (mouseY - panStartMouseY) / zoom;
    return;
  }

  if (!isDrawing) return;
  const wx = clampWorld(getWorldMouseX());
  const wy = clampWorld(getWorldMouseY());
  if (currentTool === 'brush')  drawLine(lastWX, lastWY, wx, wy);
  if (currentTool === 'eraser') eraseLine(lastWX, lastWY, wx, wy);
  lastWX = wx; lastWY = wy;
}

function mouseReleased() {
  if (isPanning) { isPanning = false; return; }
  if (!isDrawing) return;
  if (currentTool === 'line')      drawFinalLine();
  if (currentTool === 'rectangle') drawFinalRectangle();
  if (currentTool === 'circle')    drawFinalCircle();
  isDrawing = false;
}

function mouseWheel(event) {
  if (isOverSidebar()) return;
  const factor = event.delta > 0 ? 0.9 : 1.1;
  const wx = getWorldMouseX(), wy = getWorldMouseY();
  zoom = constrain(zoom * factor, 0.05, 10.0);
  panX = wx - mouseX / zoom;
  panY = wy - mouseY / zoom;
  updateZoomDisplay();
  return false;
}

function drawPoint(wx, wy) {
  const g = layers[activeLayer];
  if (currentTool === 'brush') {
    g.stroke(currentColor); g.strokeWeight(brushSize); g.point(wx, wy);
  } else if (currentTool === 'eraser') {
    g.erase(); g.strokeWeight(brushSize); g.point(wx, wy); g.noErase();
  }
}

function drawLine(x1, y1, x2, y2) {
  const g = layers[activeLayer];
  g.stroke(currentColor); g.strokeWeight(brushSize); g.strokeCap(ROUND);
  g.line(x1, y1, x2, y2);
}

function eraseLine(x1, y1, x2, y2) {
  const g = layers[activeLayer];
  g.strokeWeight(brushSize); g.strokeCap(ROUND);
  g.erase(); g.line(x1, y1, x2, y2); g.noErase();
}

function drawFinalLine() {
  const wx = clampWorld(getWorldMouseX()), wy = clampWorld(getWorldMouseY());
  const g  = layers[activeLayer];
  g.stroke(currentColor); g.strokeWeight(brushSize);
  g.line(startWX, startWY, wx, wy);
}

function drawFinalRectangle() {
  const wx = clampWorld(getWorldMouseX()), wy = clampWorld(getWorldMouseY());
  const g  = layers[activeLayer];
  g.stroke(currentColor); g.strokeWeight(brushSize); g.noFill();
  g.rect(startWX, startWY, wx - startWX, wy - startWY);
}

function drawFinalCircle() {
  const wx = clampWorld(getWorldMouseX()), wy = clampWorld(getWorldMouseY());
  const g  = layers[activeLayer];
  g.stroke(currentColor); g.strokeWeight(brushSize); g.noFill();
  g.ellipse(startWX, startWY, dist(startWX, startWY, wx, wy) * 2);
}

function drawSpray(g) {
  const wx = clampWorld(getWorldMouseX()), wy = clampWorld(getWorldMouseY());
  g.fill(currentColor); g.noStroke();
  for (let i = 0; i < 5; i++) {
    const a = random(TWO_PI), r = random(brushSize * 2);
    g.ellipse(wx + cos(a)*r, wy + sin(a)*r, random(1, max(2, brushSize / 3)));
  }
}

function drawPreview() {
  const wx = getWorldMouseX(), wy = getWorldMouseY();
  const sx1 = worldToScreenX(startWX), sy1 = worldToScreenY(startWY);
  const sx2 = worldToScreenX(wx),      sy2 = worldToScreenY(wy);
  push();
  stroke(currentColor); strokeWeight(max(1, brushSize * zoom)); noFill();
  if (currentTool === 'line')      line(sx1, sy1, sx2, sy2);
  if (currentTool === 'rectangle') rect(sx1, sy1, sx2 - sx1, sy2 - sy1);
  if (currentTool === 'circle')    ellipse(sx1, sy1, dist(sx1, sy1, sx2, sy2) * 2);
  pop();
}

function zoomIn()    { zoomAround(width/2, height/2, 1.15); }
function zoomOut()   { zoomAround(width/2, height/2, 0.87); }
function zoomReset() { zoom = 1.0; updateZoomDisplay(); }

function zoomAround(sx, sy, factor) {
  const wx = screenToWorldX(sx), wy = screenToWorldY(sy);
  zoom = constrain(zoom * factor, 0.05, 10.0);
  panX = wx - sx / zoom;
  panY = wy - sy / zoom;
  updateZoomDisplay();
}

function updateZoomDisplay() {
  const el = document.getElementById('zoomDisplay');
  if (el) el.textContent = Math.round(zoom * 100) + '%';
}

function addNewLayer() {
  const g = createGraphics(WORLD_SIZE, WORLD_SIZE);
  g.clear();
  layers.push(g);
  history.push([]);
  redoStack.push([]);
  const sel   = document.getElementById('layerSelect');
  const index = layers.length - 1;
  const opt   = document.createElement('option');
  opt.value = index; opt.text = `Layer ${index + 1}`;
  sel.appendChild(opt);
  sel.value   = index;
  activeLayer = index;
}

function saveState() {
  history[activeLayer].push(layers[activeLayer].get());
  redoStack[activeLayer] = [];
}

function undo() {
  if (history[activeLayer].length > 0) {
    redoStack[activeLayer].push(layers[activeLayer].get());
    const img = history[activeLayer].pop();
    layers[activeLayer].clear();
    layers[activeLayer].image(img, 0, 0);
  }
}

function redo() {
  if (redoStack[activeLayer].length > 0) {
    history[activeLayer].push(layers[activeLayer].get());
    const img = redoStack[activeLayer].pop();
    layers[activeLayer].clear();
    layers[activeLayer].image(img, 0, 0);
  }
}

function setupEventListeners() {
  document.getElementById('colorPicker').addEventListener('input', e => currentColor = e.target.value);

  document.getElementById('brushSize').addEventListener('input', e => {
    brushSize = parseInt(e.target.value);
    document.getElementById('brushSizeValue').textContent = brushSize;
  });

  document.getElementById('toolSelect').addEventListener('change', e => currentTool = e.target.value);

  document.getElementById('textSize')?.addEventListener('input', e => {
    document.getElementById('textSizeValue').textContent = parseInt(e.target.value);
  });

  document.getElementById('bgColorPicker')?.addEventListener('input', e => bgColor = e.target.value);

  document.getElementById('newLayerBtn').addEventListener('click', addNewLayer);
  document.getElementById('layerSelect').addEventListener('change', e => activeLayer = +e.target.value);

  document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Clear the active layer?')) { saveState(); layers[activeLayer].clear(); }
  });

  document.getElementById('saveBtn').addEventListener('click', () => saveCanvas('my-painting', 'png'));

  document.getElementById('undoBtn')?.addEventListener('click', undo);
  document.getElementById('redoBtn')?.addEventListener('click', redo);

  document.getElementById('zoomInBtn')?.addEventListener('click',    zoomIn);
  document.getElementById('zoomOutBtn')?.addEventListener('click',   zoomOut);
  document.getElementById('zoomResetBtn')?.addEventListener('click', zoomReset);

  const startBtn = document.getElementById('startGameBtn');
  const stopBtn  = document.getElementById('stopGameBtn');
  const promptEl = document.getElementById('gamePrompt');

  startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    promptEl.textContent = 'Generating prompt…';
    try {
      const res  = await fetch('/get-prompt', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data?.prompt) throw new Error(data?.error || 'Failed');
      gamePromptText = data.prompt.trim();
      promptEl.textContent = `Draw: ${gamePromptText}`;
      gameActive = true; gameOverlayAlpha = 0;
      stopBtn.disabled = false;
    } catch (err) {
      console.error(err);
      promptEl.textContent = 'Could not get a prompt. Try again.';
      gameActive = false;
    } finally {
      startBtn.disabled = false;
    }
  });

  stopBtn.addEventListener('click', () => {
    gameActive = false; gamePromptText = '';
    promptEl.textContent = '';
    stopBtn.disabled = true;
  });
  stopBtn.disabled = true;
}

function keyPressed() {
  if (document.activeElement === document.getElementById('textInput')) return true;
  if (key === ' ') { spaceHeld = true; return false; }

  if (key >= '1' && key <= '5') {
    const sizes = [5, 10, 15, 20, 30];
    brushSize = sizes[+key - 1];
    document.getElementById('brushSize').value = brushSize;
    document.getElementById('brushSizeValue').textContent = brushSize;
  }

  const toolMap = {b:'brush',e:'eraser',s:'spray',l:'line',r:'rectangle',c:'circle',t:'text'};
  if (toolMap[key]) {
    currentTool = toolMap[key];
    document.getElementById('toolSelect').value = currentTool;
  }

  if (keyCode === DELETE || keyCode === 8) { saveState(); layers[activeLayer].clear(); }

  const ctrl = keyIsDown(CONTROL) || keyIsDown(91);
  if (ctrl) {
    if (keyCode === 83)         { saveCanvas('my-painting','png'); return false; }
    if (key==='z'||key==='Z')   { undo();       return false; }
    if (key==='y'||key==='Y')   { redo();       return false; }
    if (key==='='||key==='+')   { zoomIn();     return false; }
    if (key==='-'||key==='_')   { zoomOut();    return false; }
    if (key==='0')              { zoomReset();  return false; }
  }
}

function keyReleased() {
  if (key === ' ') { spaceHeld = false; isPanning = false; }
}