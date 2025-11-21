const imageLoader = document.getElementById('imageLoader');
const originalCanvas = document.getElementById('originalCanvas');
const resultCanvas   = document.getElementById('resultCanvas');
const ctxOriginal = originalCanvas.getContext('2d');
const ctxResult   = resultCanvas.getContext('2d');

let originalImageData = null;

imageLoader.addEventListener('change', handleImage, false);

function handleImage(e){
    const reader = new FileReader();
    reader.onload = function(event){
        const img = new Image();
        img.onload = function(){
            originalCanvas.width = img.width;
            originalCanvas.height = img.height;
            resultCanvas.width = img.width;
            resultCanvas.height = img.height;
            ctxOriginal.drawImage(img,0,0);
            originalImageData = ctxOriginal.getImageData(0,0,img.width,img.height);
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
}

document.getElementById('applyBtn').addEventListener('click', ()=>{
    if(!originalImageData) return;

    const method = document.getElementById('methodSelect').value;
    const kSize  = parseInt(document.getElementById('kernelSize').value);
    let result;

    if(method === 'median'){
        result = applyMedianFilter(originalImageData, kSize);
    } else {
        const se = createStructuringElement(kSize);
        result = applyMorphology(originalImageData, method, se);
    }

    ctxResult.putImageData(result, 0, 0);
});

function applyMedianFilter(imgData, kSize){
    const {width, height, data} = imgData;
    const output = ctxResult.createImageData(width, height);

    const half = Math.floor(kSize/2);

    for(let y=0;y<height;y++){
        for(let x=0;x<width;x++){
            let rValues=[], gValues=[], bValues=[];
            for(let ky=-half;ky<=half;ky++){
                for(let kx=-half;kx<=half;kx++){
                    const px = Math.min(width-1, Math.max(0,x+kx));
                    const py = Math.min(height-1, Math.max(0,y+ky));
                    const idx = (py*width + px)*4;
                    rValues.push(data[idx]);
                    gValues.push(data[idx+1]);
                    bValues.push(data[idx+2]);
                }
            }
            rValues.sort((a,b)=>a-b);
            gValues.sort((a,b)=>a-b);
            bValues.sort((a,b)=>a-b);
            const mid = Math.floor(rValues.length/2);
            const idx = (y*width + x)*4;
            output.data[idx]   = rValues[mid];
            output.data[idx+1] = gValues[mid];
            output.data[idx+2] = bValues[mid];
            output.data[idx+3] = 255;
        }
    }
    return output;
}

function createStructuringElement(size){
    const se = [];
    for(let y=0;y<size;y++){
        const row=[];
        for(let x=0;x<size;x++) row.push(1); 
        se.push(row);
    }
    return se;
}

function applyMorphology(imgData, method, se){
    const {width, height, data} = imgData;
    const output = ctxResult.createImageData(width, height);
    const half = Math.floor(se.length/2);

    for(let y=0;y<height;y++){
        for(let x=0;x<width;x++){
            let rArr=[], gArr=[], bArr=[];

            for(let ky=0;ky<se.length;ky++){
                for(let kx=0;kx<se.length;kx++){
                    if(se[ky][kx]===0) continue;
                    const px = Math.min(width-1, Math.max(0, x+kx-half));
                    const py = Math.min(height-1, Math.max(0, y+ky-half));
                    const idx = (py*width + px)*4;
                    rArr.push(data[idx]);
                    gArr.push(data[idx+1]);
                    bArr.push(data[idx+2]);
                }
            }

            const idx = (y*width + x)*4;
            if(method==='erode'){
                output.data[idx]   = Math.min(...rArr);
                output.data[idx+1] = Math.min(...gArr);
                output.data[idx+2] = Math.min(...bArr);
            } else if(method==='dilate'){
                output.data[idx]   = Math.max(...rArr);
                output.data[idx+1] = Math.max(...gArr);
                output.data[idx+2] = Math.max(...bArr);
            } else if(method==='open'){
                const eroded = {r: Math.min(...rArr), g: Math.min(...gArr), b: Math.min(...bArr)};
                const dilated = {r: Math.max(...rArr.map(v=>v>eroded.r?v:eroded.r)),
                                 g: Math.max(...gArr.map(v=>v>eroded.g?v:eroded.g)),
                                 b: Math.max(...bArr.map(v=>v>eroded.b?v:eroded.b))};
                output.data[idx]   = dilated.r;
                output.data[idx+1] = dilated.g;
                output.data[idx+2] = dilated.b;
            } else if(method==='close'){
                const dilated = {r: Math.max(...rArr), g: Math.max(...gArr), b: Math.max(...bArr)};
                const eroded = {r: Math.min(...rArr.map(v=>v<dilated.r?v:dilated.r)),
                                g: Math.min(...gArr.map(v=>v<dilated.g?v:dilated.g)),
                                b: Math.min(...bArr.map(v=>v<dilated.b?v:dilated.b))};
                output.data[idx]   = eroded.r;
                output.data[idx+1] = eroded.g;
                output.data[idx+2] = eroded.b;
            }
            output.data[idx+3] = 255;
        }
    }
    return output;
}
