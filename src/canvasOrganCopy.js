import * as utils from './utils.js';
import * as audio from './audio.js';

let ctx,canvasWidth,canvasHeight,gradient,analyserNode,audioData, timeData;
let visualizationType = "frequency"; 

const imageSources = {
    bass: ["../media/light-organ-layers/red-top.png", "../media/light-organ-layers/white.png"],
    mid: ["../media/light-organ-layers/yellow.png", "../media/light-organ-layers/green.png"],
    treble: ["../media/light-organ-layers/red-bottom.png", "../media/light-organ-layers/orange.png", "../media/light-organ-layers/blue.png"],
    static: ["../media/light-organ-layers/outlines.png", "../media/light-organ-layers/dots.png"]
};

const spriteSheetImage = new Image();
spriteSheetImage.src = '../media/Cat Sprite Sheet.png';


const images = {};

for (let category in imageSources) {
    images[category] = imageSources[category].reduce((spriteObj, src, index) => {
        spriteObj[`image${index + 1}`] = new Image();
        spriteObj[`image${index + 1}`].src = src;
        return spriteObj;
    }, {});
}

const setupCanvas = (canvasElement,analyserNodeRef) => {
	// create drawing context
	ctx = canvasElement.getContext("2d");
	canvasWidth = canvasElement.width;
	canvasHeight = canvasElement.height;
    analyserNode = analyserNodeRef;
	audioData = new Uint8Array(analyserNode.fftSize/2);
    timeData = new Uint8Array(analyserNode.fftSize);
}

const draw = (params = {}, deltaTime) => {
    // Get audio data as you're already doing
    analyserNode.getByteFrequencyData(audioData);
    
    ctx.save();
    ctx.fillStyle = "black";
    ctx.globalAlpha = 0.1;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();

    if (visualizationType === "frequency") {
        drawFrequencyData(params, deltaTime);
    } else {
        drawTimeDomainData(params, deltaTime);
    }
    audioSprite.updateWithAudio(audioData);
    
    audioSprite.draw(ctx);
}

const drawFrequencyData = (params = {}, deltaTime) => {
    analyserNode.getByteFrequencyData(audioData); 

    ctx.save();
    ctx.fillStyle = "black";
    ctx.globalAlpha = 0.1;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();

    let bass = audioData.slice(0, audioData.length / 3);
    let mid = audioData.slice(audioData.length / 3, (2 * audioData.length) / 3);
    let treble = audioData.slice((2 * audioData.length) / 3);

    let bassAvg = bass.reduce((a, b) => a + b, 0) / bass.length;
    let midAvg = mid.reduce((a, b) => a + b, 0) / mid.length;
    let trebleAvg = treble.reduce((a, b) => a + b, 0) / treble.length;

    let timeFactor = deltaTime * 60; 

    let bassScale = 1 + ((bassAvg / 255) * 0.5) * timeFactor;
    let midScale = 1 + ((midAvg / 255) * 0.25) * timeFactor;
    let trebleScale = 1 + ((trebleAvg / 255) * 0.25) * timeFactor;

    let opacity = (bassAvg / 255) * timeFactor; // bass average to opacity
    let saturation = (midAvg / 255) * timeFactor; // mid average to saturation
    let filterSaturation = `saturate(${1 + saturation * 2})`; // more saturation for higher audio volume

    drawImageLayer(images.treble, canvasWidth / 2, canvasHeight / 2, trebleScale, opacity, filterSaturation);
    drawImageLayer(images.mid, canvasWidth / 2, canvasHeight / 2, midScale, opacity, filterSaturation);
    drawImageLayer(images.bass, canvasWidth / 2, canvasHeight / 2, bassScale, opacity, filterSaturation);
    
    drawImageLayer(images.static, canvasWidth / 2, canvasHeight / 2, 1, 1, 'none');
}

const drawTimeDomainData = (params = {}, deltaTime) => {
    analyserNode.getByteTimeDomainData(timeData);

    ctx.save();
    ctx.fillStyle = "black";
    ctx.globalAlpha = 0.1;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();

    ctx.save();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, "#FF0000");    
    gradient.addColorStop(0.5, "#00FF00");  
    gradient.addColorStop(1, "#0000FF");   
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();

    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
        sum += Math.abs(timeData[i] - 128); 
    }
    let avgLevel = sum / timeData.length / 128; 
    
    const waveHeight = canvasHeight * (0.4 + avgLevel * 0.3); 
    const sliceWidth = canvasWidth / timeData.length;
    
    for (let i = 0; i < timeData.length; i++) {
        const x = i * sliceWidth;
        const y = ((timeData[i] / 255) * waveHeight) + (canvasHeight - waveHeight) / 2;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    ctx.shadowBlur = 10 + avgLevel * 15;
    ctx.shadowColor = `rgb(${Math.floor(255 * avgLevel)}, 
                          ${Math.floor(100 + 155 * (1-avgLevel))}, 
                          ${Math.floor(255 * (1-avgLevel))})`;
    ctx.stroke();
    
    ctx.restore();
    
    drawImageLayer(images.static, canvasWidth / 2, canvasHeight / 2, 1, 0.5, 'none');
}

const drawImageLayer = (sprite, x, y, scale = 1, opacity = 1, filter = 'none') => {
    ctx.save();
    ctx.translate(x, y);

    ctx.globalAlpha = opacity;
    ctx.filter = filter;

    for (let key in sprite) {
        let img = sprite[key];
        if (img.complete && img.naturalWidth > 0) { 
            let w = img.naturalWidth * scale;
            let h = img.naturalHeight * scale;
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
    }

    ctx.restore();
};



// class Sprite {
// 	constructor(image, x, y, width, height) {
// 		this.image = image;
// 		this.x = x; // center x
// 		this.y = y; // center y
// 		this.width = width;
// 		this.height = height;
// 	}

// 	// Automatically center-draws the sprite
// 	draw(ctx) {
// 		const drawX = this.x - this.width / 2;
// 		const drawY = this.y - this.height / 2;
// 		ctx.drawImage(this.image, drawX, drawY, this.width, this.height);
// 	}

// 	updatePositionToCenter(canvas) {
// 		this.x = canvas.width / 2;
// 		this.y = canvas.height / 2;
// 	}
// }
// const organImage = new Image();
// organImage.src = 'path/to/your/image.png';


// const sprites = [
//     new Sprite(canvasWidth / 2, canvasHeight / 3, 20, 'red'),
//     new Sprite(canvasWidth / 2, (2 * canvasHeight) / 3, 30, 'blue')
// ];

// create sprite
// const organSprite = new Sprite(organImage, canvas.width / 2, canvas.height / 2, 200, 200);

// // in your update or animation loop
// organSprite.updatePositionToCenter(canvas);
// organSprite.draw(ctx);

    
//     let lastTime = 0;
//     const fps = 60;
//     const interval = 1000 / fps;
    
class AnimatedSprite {
	constructor(image, frameWidth, frameHeight, row, totalFrames, frameSpeed, x, y) {
		this.image = image;
		this.frameWidth = frameWidth;
		this.frameHeight = frameHeight;
		this.row = row;
		this.totalFrames = totalFrames;
		this.frameSpeed = frameSpeed; // lower is faster
		this.currentFrame = 0;
		this.frameTimer = 0;

		this.x = x || canvasWidth / 2;
		this.y = y || canvasHeight / 2;
	}

	update() {
		this.frameTimer++;
		if (this.frameTimer >= this.frameSpeed) {
			this.frameTimer = 0;
			this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
		}
	}

	draw(ctx) {
        if (!this.image.complete || this.image.naturalWidth === 0) return; // Wait until loaded!

		ctx.drawImage(
			this.image,
			this.currentFrame * this.frameWidth,  // source x
			this.row * this.frameHeight,          // source y
			this.frameWidth,                      // source width
			this.frameHeight,                     // source height
			this.x - this.frameWidth / 2,         // draw center x
			this.y - this.frameHeight / 2,        // draw center y
			this.frameWidth,                      // draw width
			this.frameHeight                      // draw height
		);
	}

    updatePosition(x, y) {
        this.x = x;
        this.y = y;
    }
}

class AudioResponsiveSprite extends AnimatedSprite {
    constructor(image, frameWidth, frameHeight, totalRowsInSheet, framesPerRow, frameSpeed) {
        super(image, frameWidth, frameHeight, 0, framesPerRow[0], frameSpeed);
        this.totalRows = totalRowsInSheet;
        this.framesPerRow = framesPerRow; 
    }

    updateWithAudio(audioData) {
        let bass = audioData.slice(0, audioData.length / 3);
        let mid = audioData.slice(audioData.length / 3, (2 * audioData.length) / 3);
        let treble = audioData.slice((2 * audioData.length) / 3);
        const bassAvg = bass.reduce((a, b) => a + b, 0) / bass.length;
        const midAvg = mid.reduce((a, b) => a + b, 0) / mid.length;
        const trebleAvg = treble.reduce((a, b) => a + b, 0) / treble.length;
        
        if (bassAvg > 200) {
            this.row = 3; 
            this.totalFrames = this.framesPerRow[3];
        } else if (midAvg > 150) {
            this.row = 2;
            this.totalFrames = this.framesPerRow[2];
        } else if (trebleAvg > 180) {
            this.row = 1;
            this.totalFrames = this.framesPerRow[1];
        } else {
            this.row = 0; 
            this.totalFrames = this.framesPerRow[0];
        }
        
        this.frameSpeed = Math.max(1, 10 - (bassAvg / 50)); // more bass = faster animation
        
        super.update();
    }
}

const audioSprite = new AudioResponsiveSprite(
    spriteSheetImage, 
    64, 
    64, 
    8, 
    [4, 4, 4, 4, 8, 8, 6, 7, 8], 
    5,  
    canvasWidth - 100,  
    canvasHeight - 100  
);


export {setupCanvas,draw};