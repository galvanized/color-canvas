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

var ctx = canvas.getContext("2d");
var imgData = ctx.getImageData(0, 0, width, height);
var data = imgData.data;


const draw = () => {
    ctx.putImageData(imgData, 0, 0);
}

const initialize = () => {
    // set all pixels to opaque white
    for (let i = 0; i < data.length; i+=4) {
        for (let j = 0; j < 4; j++) {
            data[i + j] = 255;
        }
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

const randomStep = () => {
    for (let i = 0; i < data.length; i+=4) {
        for (let j = 0; j < 3; j++) {
            data[i + j] = mod(data[i + j] + randomIntInclusive(-1, 1), 256);
        }
    }
}

initialize();

// increment and draw once every 100ms
setInterval(() => {
    randomStep();
    draw();
}, 100);

