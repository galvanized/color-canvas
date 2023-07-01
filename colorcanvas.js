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

const mod = (n, m) => {
    return ((n % m) + m) % m;
}

const clamp = (x, min, max) => {
    return Math.min(Math.max(x, min), max);
}

const clamp8 = (x) => {
    return clamp(x, 0, 255);
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

const visited = new Array(width * height).fill(false);
let maxAge = 50; // at ages around 20-30, the image degrades into edges that never resolve
const pixelUpdateTime = new Uint16Array(width * height).fill(-maxAge); // last time pixel was updated, used to calculate age
// note that at 60fps, frame time overflows at 1092 seconds ≈ 18 minutes
let frameCount = 0;

let edges = []; // freshly visited pixels

//edges.push(Math.floor(height/2) * width + Math.floor(width/2)); // initial pixel

const randomStep = (variation=10) => {
    // select a edge pixel at random
    if (edges.length == 0) {
        return;
    }
    const edgeIndex = randomIntInclusive(0, edges.length - 1);
    const edge = edges[edgeIndex];
    const [x, y] = indexToCoord(edge);
    //console.log(edge, x, y);

    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    let validIndexes = [];
    for (const direction of directions) {
        const newX = x + direction[0];
        if (newX < 0 || newX >= width) continue;
        const newY = y + direction[1];
        if (newY < 0 || newY >= height) continue;

        const newIndex = coordToIndex(newX, newY);
        if (mod(frameCount - pixelUpdateTime[newIndex],0xFFFF) > maxAge) {
            validIndexes.push(newIndex);
        }
    }

    if (validIndexes.length > 0) {
        const newIndex = validIndexes[randomIntInclusive(0, validIndexes.length - 1)];
        
        const oldRedIndex = edge * 4;
        const redIndex = newIndex * 4;
        for (let i = 0; i < 3; i++) {
            data[redIndex + i] = clamp8(data[oldRedIndex + i] + randomIntInclusive(-variation, variation));
        }


        pixelUpdateTime[newIndex] = frameCount;
        edges.push(newIndex);
    }
    if (validIndexes.length <= 1) {
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

// add clicked point to edges
canvas.addEventListener('click', function(e) {
    const [x, y] = getCursorPosition(canvas, e);
    const index = coordToIndex(x, y);
    if (!visited[index]) {
        visited[index] = true;
        edges.push(index);
    }
});


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
    frameCount = (frameCount + 1) % 0xFFFF;
}

const animate = () => {
    variStep(500);
    drawDebugBrightEdges();
    requestAnimationFrame(animate);
}


initRGBA(186, 186, 186, 255);

/*
const interval = setInterval(() => {
    multiStep(10);
    draw();
}, 50);
*/

animate();