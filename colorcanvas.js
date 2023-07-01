"use strict";
const canvas = document.getElementById("fullcanvas");
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
var data = imgData.data;


const draw = () => {
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
let edges = []; // freshly visited pixels

edges.push(Math.floor(height/2) * width + Math.floor(width/2)); // initial pixel

const randomStep = (variation=10) => {
    // select a edge pixel at random
    if (edges.length == 0) {
        return;
    }
    const edgeIndex = randomIntInclusive(0, edges.length - 1);
    const edge = edges[edgeIndex];
    const [x, y] = indexToCoord(edge);
    if (isNaN(edge)) {
        clearInterval(interval);
    }
    //console.log(edge, x, y);

    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    let validIndexes = [];
    for (const direction of directions) {
        const newX = x + direction[0];
        if (newX < 0 || newX >= width) continue;
        const newY = y + direction[1];
        if (newY < 0 || newY >= height) continue;

        const newIndex = coordToIndex(newX, newY);
        if (!visited[newIndex]) {
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


        visited[newIndex] = true;
        edges.push(newIndex);
    }
    if (validIndexes.length <= 1) {
        edges.splice(edgeIndex, 1);
    }
}

const multiStep = (steps) => {
    for (let i = 0; i < steps; i++) {
        randomStep();
    }
}

let totalFrames = 0;
let totalSteps = 0;

const variStep = (maxSteps) => {
    let steps = Math.min(Math.floor((totalFrames + 1)**1.2), maxSteps);
    console.log(steps);
    for (let i = 0; i < steps; i++) {
        randomStep();
    }
    totalSteps += steps;
    totalFrames++;
}

const animate = () => {
    variStep(500);
    draw();
    if (edges.length > 0) {
        requestAnimationFrame(animate);
    }
}


initRGBA(186, 186, 186, 255);

/*
const interval = setInterval(() => {
    multiStep(10);
    draw();
}, 50);
*/

animate();