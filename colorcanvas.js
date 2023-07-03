"use strict";
const canvasContainer = document.getElementById("canvascontainer");
const canvas = document.getElementById("fullcanvas");
const maxExtent = Math.max(canvasContainer.clientWidth, canvasContainer.clientHeight);
let divisor = 1;
while (maxExtent / divisor > 500) {
    divisor++;
}
canvas.width = Math.floor(canvasContainer.clientWidth / divisor);
canvas.height = Math.floor(canvasContainer.clientHeight / divisor);
const width = canvas.width;
const height = canvas.height;

console.log(width, height);

const getColorIndicesForCoord = (x, y) => {
    const red = y * (width * 4) + x * 4;
    return [red, red + 1, red + 2, red + 3];
}

const randomIntInclusive = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// https://stackoverflow.com/a/17243070
/* accepts parameters
 * h  Object = {h:x, s:y, v:z}
 * OR 
 * h, s, v
*/
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/* accepts parameters
 * r  Object = {r:x, g:y, b:z}
 * OR 
 * r, g, b
*/
function RGBtoHSV(r, g, b) {
    if (arguments.length === 1) {
        g = r.g, b = r.b, r = r.r;
    }
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return {
        h: h,
        s: s,
        v: v
    };
}

const mod = (n, m) => {
    return ((n % m) + m) % m;
}

const clamp = (x, min, max) => {
    return Math.min(Math.max(x, min), max);
}

const clamp8 = (x) => {
    return clamp(x, 0, 255);
}

const arrays_equal = (a, b) => {
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

var ctx = canvas.getContext("2d");
var imgData = ctx.getImageData(0, 0, width, height);
//var data = imgData.data;
var data = new Uint8ClampedArray(imgData.data);


const draw = () => {
    imgData.data.set(data);
    ctx.putImageData(imgData, 0, 0);
}

const drawDebugWhiteEdges = () => {
    const debugData = new Uint8ClampedArray(data);
    for (let i = 0; i < debugData.length; i+=4) {
        for (let j = 0; j < 3; j++) {
            debugData[i + j] -= 50;
        }
    }
    for (const edge of edges) {
        const redIndex = edge * 4;
        for (let i = 0; i < 3; i++) {
            debugData[redIndex + i] = 255;
        }
    }
    imgData.data.set(debugData);
    ctx.putImageData(imgData, 0, 0);
}

const drawDebugBrightEdges = () => {
    const debugData = new Uint8ClampedArray(data);
    for (let i = 0; i < debugData.length; i+=4) {
        for (let j = 0; j < 3; j++) {
            debugData[i + j] *= 0.25;
        }
    }
    for (const edge of edges) {
        const redIndex = edge * 4;
        for (let i = 0; i < 3; i++) {
            debugData[redIndex + i] = data[redIndex + i];
        }
    }
    imgData.data.set(debugData);
    ctx.putImageData(imgData, 0, 0);
}

const drawDebugGeneration = () => {
    /*
    Greyscale view of each pixel's generation, with white edges
    */
    const debugData = new Uint8ClampedArray(data);
    for (let i = 0; i < debugData.length; i+=4) {
        const genShade = Math.floor(pixelGeneration[Math.floor(i / 4)] * 2) % 256; // used for lightness
        for (let j = 0; j < 3; j++) {
            debugData[i + j] = genShade;
        }
    }
    for (const edge of edges) {
        const redIndex = edge * 4;
        for (let i = 0; i < 3; i++) {
            debugData[redIndex + i] = 255;
        }
    }
    imgData.data.set(debugData);
    ctx.putImageData(imgData, 0, 0);
}

const initWhite = () => {
    // set all pixels to opaque white
    for (let i = 0; i < data.length; i+=4) {
        for (let j = 0; j < 4; j++) {
            data[i + j] = 255;
        }
    }
}

const initRGBA = (r, g, b, a) => {
    for (let i = 0; i < data.length; i+=4) {
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = a;
    }
}

// iterate over all pixels and increment all color values by 1, overflowing at 255
const increment = () => {
    for (let i = 0; i < data.length; i+=4) {
        for (let j = 0; j < 3; j++) {
            data[i + j] = (data[i + j] + 1) % 256;
        }
    }
}

const randomVary = () => {
    for (let i = 0; i < data.length; i+=4) {
        for (let j = 0; j < 3; j++) {
            data[i + j] = mod(data[i + j] + randomIntInclusive(-1, 1), 256);
        }
    }
}

const indexToCoord = (index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    return [x, y];
}

const coordToIndex = (x, y) => {
    return y * width + x;
}



const pixelGeneration = new Uint16Array(width * height).fill(0);
let maxGenDiff = 100; 
let maxGen = 0;
let frameCount = 0;

let edges = []; // freshly visited pixels

//edges.push(Math.floor(height/2) * width + Math.floor(width/2)); // initial pixel

const getValidNeighborIndexes = (index) => {
    const [x, y] = indexToCoord(index);
    
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // 4-connected / Von Neumann neighborhood / Manhattan distance 1
    //const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [-1, 1], [1, -1]]; // 8-connected / Moore neighborhood / Chebyshev distance 1
    let validIndexes = [];
    for (const direction of directions) {
        const newX = x + direction[0];
        if (newX < 0 || newX >= width) continue;
        const newY = y + direction[1];
        if (newY < 0 || newY >= height) continue;

        const newIndex = coordToIndex(newX, newY);
        if (pixelGeneration[newIndex] == 0 || pixelGeneration[index] - pixelGeneration[newIndex] >= maxGenDiff) {
            validIndexes.push(newIndex);
        }
    }
    return validIndexes;
}

const randomStep = (variation=10) => {
    // select a edge pixel at random
    if (edges.length == 0) {
        return;
    }
    const edgeIndex = randomIntInclusive(0, edges.length - 1);
    const edge = edges[edgeIndex];

    const validIndexes = getValidNeighborIndexes(edge);
    
    if (validIndexes.length > 0) {
        const newIndex = validIndexes[randomIntInclusive(0, validIndexes.length - 1)];
        
        const oldRedIndex = edge * 4;
        const redIndex = newIndex * 4;
        for (let i = 0; i < 3; i++) {
            data[redIndex + i] = clamp8(data[oldRedIndex + i] + randomIntInclusive(-variation, variation));
        }

        pixelGeneration[newIndex] = pixelGeneration[edge] + 1; // random increment leads to instability
        if (pixelGeneration[newIndex] > maxGen) {
            maxGen = pixelGeneration[newIndex];
        }
        /* if (!(newIndex in edges)) { // deduplication check breaks propegation to top edge. I don't know why
            edges.push(newIndex);
        } */
        edges.push(newIndex);
    }
    if (validIndexes.length <= 1) {
        /*
        Changing the value above changes the type of propegation.
        With 4-connected:
        4+: a single snake
        3: two snakes
        2: sparse front, leaves holes
        1: normal propegation 
        0: seems to be the same as 1
        */
        edges.splice(edgeIndex, 1);
    }
}


function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect()
    // the below doesn't account for scaling
    //const x = event.clientX - rect.left
    //const y = event.clientY - rect.top
    const x = Math.floor((event.clientX - rect.left) / (rect.right - rect.left) * width);
    const y = Math.floor((event.clientY - rect.top) / (rect.bottom - rect.top) * height);
    return [x, y];
}

let lastMouseIndex = -1;
let lastMouseCoords = [-1, -1];
canvas.addEventListener('mousemove', function(e) {
    mouseHandler(e);
});
canvas.addEventListener('mousedown', function(e) {
    mouseHandler(e);
});

const nucleatePoint = (x, y) => {
    const index = coordToIndex(x, y);
    pixelGeneration[index] = Math.max(pixelGeneration[index] + maxGenDiff + 1, maxGen);
    //pixelGeneration[index] = maxGen + 5;
    edges.push(index);
}

const bresenham = (x0, y0, x1, y1, callback) => {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;
    
    while (true) {
        callback(x, y);
        
        if (x === x1 && y === y1) break;
        
        const e2 = 2 * err;
        
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
};



const mouseHandler = (e) => {
    // check if left mouse button is pressed
    if (e.buttons % 2 == 1) {
        const [x, y] = getCursorPosition(canvas, e);
        const index = coordToIndex(x, y);
        if (e.type == 'mousedown'){
            // fresh click, no line
            nucleatePoint(x, y);
        }
        else if (index != lastMouseIndex) {
            // mousemove, draw line
            const [lastX, lastY] = lastMouseCoords;
            if (lastX == -1 && lastY == -1) {
                return;
            }
            bresenham(lastX, lastY, x, y, nucleatePoint);
        }
        lastMouseIndex = index;
        lastMouseCoords = [x, y];
    }
    else {
        // invalidate coords (as to not draw lines when mouse is not pressed)
        lastMouseCoords = [-1, -1];
    }
}


const multiStep = (steps) => {
    for (let i = 0; i < steps; i++) {
        randomStep();
    }
}


const variStep = (maxSteps) => {
    //let steps = Math.min(Math.floor((totalFrames + 1)**1.2), maxSteps);
    let steps = clamp(Math.ceil(edges.length)/2, 1, maxSteps);
    for (let i = 0; i < steps; i++) {
        randomStep();
    }
    frameCount++;
}

const animate = () => {
    variStep(1000);
    drawDebugWhiteEdges();
    requestAnimationFrame(animate);
}


initRGBA(186, 186, 186, 255);


/* const interval = setInterval(() => {
    multiStep(10);
    drawDebugWhiteEdges();
}, 200); */


animate();