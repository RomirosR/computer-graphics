const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const drawBtn = document.getElementById('drawBtn');
const algorithmSelect = document.getElementById('algorithmSelect');
const fileInput = document.getElementById('fileInput');
const coordTableDiv = document.getElementById('coordTable');

let segments = [];
let windowRect = null;
let convexPolygon = null;

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(ev){
        parseFile(ev.target.result);
    };
    reader.readAsText(file);
});

function parseFile(text){
    const lines = text.split(/\r?\n/).filter(l=>l.trim()!=="");
    const n = parseInt(lines[0]);
    segments = [];
    for(let i=1;i<=n;i++){
        const [x1,y1,x2,y2] = lines[i].trim().split(/\s+/).map(Number);
        segments.push({x1,y1,x2,y2});
    }
    const [xmin,ymin,xmax,ymax] = lines[n+1].trim().split(/\s+/).map(Number);
    windowRect = {xmin,ymin,xmax,ymax};
    convexPolygon = [
        {x:xmin,y:ymin},
        {x:xmax,y:ymin},
        {x:xmax,y:ymax},
        {x:xmin,y:ymax}
    ];
}

drawBtn.addEventListener('click', ()=>{
    clearCanvas();
    if(segments.length===0) return;

    ctx.strokeStyle = 'lightgray';
    segments.forEach(s=>{
        drawLine(s.x1,s.y1,s.x2,s.y2);
    });

    if(algorithmSelect.value==='liangBarsky'){
        drawRect(windowRect,'blue');
    } else if(algorithmSelect.value==='convexPolygon'){
        drawPolygon(convexPolygon,'blue');
    }

    let visibleSegments=[];
    if(algorithmSelect.value==='liangBarsky'){
        segments.forEach(s=>{
            const vs = liangBarsky(s,windowRect);
            if(vs) visibleSegments.push(vs);
        });
    } else if(algorithmSelect.value==='convexPolygon'){
        segments.forEach(s=>{
            const vs = clipConvexPolygon(s,convexPolygon);
            if(vs) visibleSegments.push(vs);
        });
    }

    ctx.strokeStyle='red';
    visibleSegments.forEach(s=>drawLine(s.x1,s.y1,s.x2,s.y2));

    renderCoordTable(visibleSegments);
});

function drawLine(x1,y1,x2,y2){
    ctx.beginPath();
    ctx.moveTo(x1,canvas.height - y1);
    ctx.lineTo(x2,canvas.height - y2);
    ctx.stroke();
}

function drawRect(r,color){
    ctx.strokeStyle=color;
    ctx.strokeRect(r.xmin,canvas.height - r.ymax, r.xmax-r.xmin, r.ymax-r.ymin);
}

function drawPolygon(polygon,color){
    ctx.strokeStyle=color;
    ctx.beginPath();
    ctx.moveTo(polygon[0].x,canvas.height - polygon[0].y);
    for(let i=1;i<polygon.length;i++){
        ctx.lineTo(polygon[i].x,canvas.height - polygon[i].y);
    }
    ctx.closePath();
    ctx.stroke();
}

function clearCanvas(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    coordTableDiv.innerHTML='';
}

function renderCoordTable(segments){
    if(segments.length===0) return;
    let html = '<table><tr><th>#</th><th>x1</th><th>y1</th><th>x2</th><th>y2</th></tr>';
    segments.forEach((s,i)=>{
        html+=`<tr><td>${i+1}</td><td>${s.x1}</td><td>${s.y1}</td><td>${s.x2}</td><td>${s.y2}</td></tr>`;
    });
    html+='</table>';
    coordTableDiv.innerHTML=html;
}

function liangBarsky(s,rect){
    let {x1,y1,x2,y2}=s;
    let dx = x2-x1;
    let dy = y2-y1;
    let p=[-dx,dx,-dy,dy];
    let q=[x1-rect.xmin, rect.xmax-x1, y1-rect.ymin, rect.ymax-y1];
    let tE=0, tL=1;
    for(let i=0;i<4;i++){
        if(p[i]===0){
            if(q[i]<0) return null; 
        } else {
            let t=q[i]/p[i];
            if(p[i]<0) tE=Math.max(tE,t);
            else tL=Math.min(tL,t);
        }
    }
    if(tE>tL) return null;
    return {x1:x1 + tE*dx, y1:y1 + tE*dy, x2:x1 + tL*dx, y2:y1 + tL*dy};
}

function clipConvexPolygon(s,polygon){
    let tE = 0, tL = 1;
    const dx = s.x2 - s.x1;
    const dy = s.y2 - s.y1;

    for(let i=0;i<polygon.length;i++){
        const j = (i+1) % polygon.length;
        const edge = {x: polygon[j].x - polygon[i].x, y: polygon[j].y - polygon[i].y};

        const normal = {x: edge.y, y: -edge.x};

        const w = {x: s.x1 - polygon[i].x, y: s.y1 - polygon[i].y};
        const DdotN = dx*normal.x + dy*normal.y;
        const WdotN = w.x*normal.x + w.y*normal.y;

        if(DdotN === 0){
            if(WdotN < 0) return null; 
        } else {
            const t = -WdotN / DdotN;
            if(DdotN > 0) tL = Math.min(tL, t); 
            else tE = Math.max(tE, t);
        }
    }

    if(tE > tL) return null;

    return {
        x1: s.x1 + tE*dx,
        y1: s.y1 + tE*dy,
        x2: s.x1 + tL*dx,
        y2: s.y1 + tL*dy
    };
}

