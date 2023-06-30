"use strict";
const canvas = document.getElementById("fullcanvas");
const width = canvas.width;
const height = canvas.height;

console.log(width, height);

const getColorIndicesForCoord = (x, y) => {
    const red = y * (width * 4) + x * 4;
    return [red, red + 1, red + 2, red + 3];
}

var ctx = canvas.getContext("2d");
var imgData = ctx.getImageData(0, 0, width, height);
var data = imgData.data;

const draw = () => {
    ctx.putImageData(imgData, 0, 0);
}

// iterate over all pixels and increment all color values by 1, overflowing at 255
const increment = () => {
    for (let i = 0; i < data.length; i++) {
        data[i] = (data[i] + 1) % 256;
    }
}

const animate = () => {
    increment();
    draw();
    requestAnimationFrame(animate);
}

animate();

