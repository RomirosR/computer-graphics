const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const drawBtn = document.getElementById('drawBtn');
const algorithmSelect = document.getElementById('algorithmSelect');
const timeOutput = document.getElementById('timeOutput');
const coordTableDiv = document.getElementById('coordTable');

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    coordTableDiv.innerHTML = '';
}

function drawGrid() {
    const step = 20;
    ctx.strokeStyle = "#ddd";
    ctx.beginPath();
    for(let x=0; x<=canvas.width; x+=step){
        ctx.moveTo(x,0);
        ctx.lineTo(x,canvas.height);
    }
    for(let y=0; y<=canvas.height; y+=step){
        ctx.moveTo(0,y);
        ctx.lineTo(canvas.width,y);
    }
    ctx.stroke();
    
    ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(0,canvas.height);
    ctx.moveTo(0,canvas.height);
    ctx.lineTo(canvas.width,canvas.height);
    ctx.stroke();
}

drawBtn.addEventListener('click', () => {
    clearCanvas();
    
    const x1 = parseInt(document.getElementById('x1').value);
    const y1 = parseInt(document.getElementById('y1').value);
    const x2 = parseInt(document.getElementById('x2').value);
    const y2 = parseInt(document.getElementById('y2').value);
    const radius = parseInt(document.getElementById('radius').value);
    const alg = algorithmSelect.value;

    let pixels = [];
    let startTime = performance.now();

    if(alg === 'step'){
        pixels = drawStep(x1,y1,x2,y2);
    } else if(alg === 'dda'){
        pixels = drawDDA(x1,y1,x2,y2);
    } else if(alg === 'bresenhamLine'){
        pixels = drawBresenhamLine(x1,y1,x2,y2);
    } else if(alg === 'bresenhamCircle'){
        pixels = drawBresenhamCircle(x1,y1,radius);
    }

    let endTime = performance.now();
    timeOutput.textContent = `Время выполнения: ${(endTime-startTime).toFixed(3)} мс`;
    renderCoordTable(pixels);
});

function setPixel(x,y,pixels){
    ctx.fillStyle = "red";
    ctx.fillRect(x, canvas.height - y, 1, 1);
    if(pixels) pixels.push({x,y});
}

function renderCoordTable(pixels){
    if(pixels.length === 0) return;
    let html = '<table><tr><th>Шаг</th><th>x</th><th>y</th></tr>';
    pixels.forEach((p,i)=>{
        html += `<tr><td>${i}</td><td>${p.x}</td><td>${p.y}</td></tr>`;
    });
    html += '</table>';
    coordTableDiv.innerHTML = html;
}

function drawStep(x1,y1,x2,y2){
    const dx = x2-x1;
    const dy = y2-y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    let pixels = [];
    for(let i=0;i<=steps;i++){
        const x = Math.round(x1 + dx*i/steps);
        const y = Math.round(y1 + dy*i/steps);
        setPixel(x,y,pixels);
    }
    return pixels;
}

function drawDDA(x1,y1,x2,y2){
    const dx = x2-x1;
    const dy = y2-y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const xInc = dx/steps;
    const yInc = dy/steps;
    let x=x1, y=y1;
    let pixels = [];
    for(let i=0;i<=steps;i++){
        setPixel(Math.round(x), Math.round(y), pixels);
        x+=xInc;
        y+=yInc;
    }
    return pixels;
}

function drawBresenhamLine(x1,y1,x2,y2){
    let dx = Math.abs(x2-x1);
    let dy = Math.abs(y2-y1);
    const sx = x1<x2?1:-1;
    const sy = y1<y2?1:-1;
    let err = dx-dy;
    let x=x1, y=y1;
    let pixels = [];

    while(true){
        setPixel(x,y,pixels);
        if(x===x2 && y===y2) break;
        let e2 = 2*err;
        if(e2> -dy){ err -= dy; x += sx;}
        if(e2 < dx){ err += dx; y += sy;}
    }
    return pixels;
}

function drawBresenhamCircle(cx,cy,r){
    let x=0, y=r;
    let d=3-2*r;
    let pixels = [];
    drawCirclePoints(cx,cy,x,y,pixels);
    while(y>=x){
        x++;
        if(d>0){
            y--;
            d = d+4*(x - y) + 10;
        } else {
            d = d+4*x+6;
        }
        drawCirclePoints(cx,cy,x,y,pixels);
    }
    return pixels;
}

function drawCirclePoints(cx,cy,x,y,pixels){
    setPixel(cx+x, cy+y, pixels);
    setPixel(cx-x, cy+y, pixels);
    setPixel(cx+x, cy-y, pixels);
    setPixel(cx-x, cy-y, pixels);
    setPixel(cx+y, cy+x, pixels);
    setPixel(cx-y, cy+x, pixels);
    setPixel(cx+y, cy-x, pixels);
    setPixel(cx-y, cy-x, pixels);
}
