// 1 - our WebAudio context, **we will export and make this public at the bottom of the file**
let audioCtx;

// **These are "private" properties - these will NOT be visible outside of this module (i.e. file)**
// 2 - WebAudio nodes that are part of our WebAudio audio routing graph
let element, sourceNode, analyserNode, gainNode, bassFilter, trebleFilter;

// 3 - here we are faking an enumeration
const DEFAULTS = Object.freeze({
    gain : .5,
    numSpaces : 256,
    bassFrequency: 100, //Hz
    trebleFrequency:3000 //Hz
});

// 4 - create a new array of 8-bit integers (0-255)
// this is a typed array to hold the audio frequency data
let audioData = new Uint8Array(DEFAULTS.numSpaces/2);

// **Next are "public" methods - we are going to export all of these at the bottom of this file**
const setupWebaudio = (filepath) => {
// 1 - The || is because WebAudio has not been standardized across browsers yet
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();

// 2 - this creates an <audio> element
    element = new Audio();

// 3 - have it point at a sound file
    loadSoundFile(filepath);

// 4 - create a source node that points at the <audio> element
    sourceNode = audioCtx.createMediaElementSource(element);

// 5 - create an analyser node
// note the UK spelling of "Analyser"
    analyserNode = audioCtx.createAnalyser();

/*
// 6
We will request DEFAULTS.numSamples number of samples or "bins" spaced equally 
across the sound spectrum.

If DEFAULTS.numSamples (fftSize) is 256, then the first bin is 0 Hz, the second is 172 Hz, 
the third is 344Hz, and so on. Each bin contains a number between 0-255 representing 
the amplitude of that frequency.
*/ 

// fft stands for Fast Fourier Transform
    analyserNode.fftSize = DEFAULTS.numSpaces;

// 7.0 - create a gain (volume) node
    gainNode = audioCtx.createGain();
    gainNode.gain.value = DEFAULTS.gain;

// 7.1 - create bass filter
    bassFilter = audioCtx.createBiquadFilter();
    bassFilter.type = "lowshelf";
    bassFilter.frequency.value = DEFAULTS.bassFrequency;
    bassFilter.gain.value = 0;

// 7.2 - create treble filter
    trebleFilter = audioCtx.createBiquadFilter();
    trebleFilter.type = "highshelf";
    trebleFilter.frequency.value = DEFAULTS.trebleFrequency;
    trebleFilter.gain.value = 0;



// 8 - connect the nodes - we now have an audio graph
    sourceNode.connect(analyserNode);
    analyserNode.connect(bassFilter);
    bassFilter.connect(trebleFilter);
    trebleFilter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

// make sure that it's a Number rather than a String
}

const loadSoundFile = (filepath) => {
    element.src = filepath;
}

const playCurrentSound = () => {
    element.play();
}

const pauseCurrentSound = () => {
    element.pause();
}

const setVolume = (value) => {
    value = Number(value);
    gainNode.gain.value = value;
}

const setBass = (value) => {
    value = Number(value);
    bassFilter.gain.value = value;
};

const setTreble = (value) => {
    value = Number(value);
    trebleFilter.gain.value = value;
};


export {audioCtx, setupWebaudio, playCurrentSound, pauseCurrentSound, loadSoundFile, setVolume, setBass, setTreble, analyserNode, element};