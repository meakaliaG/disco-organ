/*
	main.js is primarily responsible for hooking up the UI to the rest of the application 
	and setting up the main event loop
*/

import * as utils from './utils.js';
import * as audio from './audio.js';
import * as canvas from './canvasOrganCopy.js';

let appData = null;

// drawParams object for visualization control OLD
const drawParams = {
  showGradient: true,
  showBars: true,
  showCircles: true,
  showNoise: false,
  showInvert: false,
  showEmboss: false,
  showLightOrgan: true
};

document.addEventListener('DOMContentLoaded', () => {
  loadAppData();
});

const loadAppData = () => {
  fetch('./data/av-data.json')
    .then(response => response.json())
    .then(json => {
      appData = json;
      updateUIFromAppData();
      init(); 
    })
    .catch(err => {
      console.error("Error loading av-data.json:", err);
    });
};

const updateUIFromAppData = () => {
  document.title = appData.title;
  document.getElementById('instructions').textContent = appData.instructions;
  
  populateTrackSelect();
  
  // Add visualization types if they exist in the JSON
  // if (appData.visualizationTypes) {
  //   populateVisualizationSelect();
  // }
};

const populateTrackSelect = () => {
  const selectTrack = document.getElementById('select-track');
  selectTrack.innerHTML = ""; 
  
  appData.tracks.forEach(track => {
    const option = document.createElement('option');
    option.value = track.file;
    option.textContent = track.name;
    selectTrack.appendChild(option);
  });
};

// Populate visualization type selection if available
// const populateVisualizationSelect = () => {
//   const visualizationSelect = document.getElementById('select-visualization');
//   if (!visualizationSelect) {
//     console.warn("Visualization select element not found");
//     return;
//   }
  
//   visualizationSelect.innerHTML = ""; // Clear existing options
  
//   appData.visualizationTypes.forEach(vizType => {
//     const option = document.createElement('option');
//     option.value = vizType.type;
//     option.textContent = vizType.name;
//     visualizationSelect.appendChild(option);
//   });
// };


const init = () => {
  console.log("init called");
  
  audio.setupWebaudio(appData.tracks[0].file);
  
  let canvasElement = document.querySelector("canvas");
  setupUI(canvasElement);
  canvas.setupCanvas(canvasElement, audio.analyserNode);
  
  loop();
};

const setupUI = (canvasElement) => {
  const fsButton = document.querySelector("#btn-fs");
  fsButton.onclick = e => {
    console.log("goFullscreen() called");
    utils.goFullscreen(canvasElement);
  };
  
  const playButton = document.querySelector("#btn-play");
  playButton.onclick = e => {
    console.log(`audioCtx.state before = ${audio.audioCtx.state}`);
    
    if (audio.audioCtx.state == "suspended") {
      audio.audioCtx.resume();
    }
    
    console.log(`audioCtx.state after = ${audio.audioCtx.state}`);
    
    if (e.target.dataset.playing == "no") {
      audio.audioCtx.resume();
      audio.playCurrentSound();
      e.target.dataset.playing = "yes";
    } else {
      audio.pauseCurrentSound();
      e.target.dataset.playing = "no";
    }
  };
  
  let volumeSlider = document.querySelector("#slider-volume");
  let volumeLabel = document.querySelector("#label-volume");
  volumeSlider.oninput = e => {
    audio.setVolume(e.target.value);
    volumeLabel.innerHTML = Math.round((e.target.value/2 * 100));
  };
  volumeSlider.dispatchEvent(new Event("input"));
  
  let bassSlider = document.querySelector("#slider-bass");
  let bassLabel = document.querySelector("#label-bass");
  bassSlider.oninput = e => {
    audio.setBass(e.target.value);
    bassLabel.innerHTML = e.target.value;
  };
  
  let trebleSlider = document.querySelector("#slider-treble");
  let trebleLabel = document.querySelector("#label-treble");
  trebleSlider.oninput = e => {
    audio.setTreble(e.target.value);
    trebleLabel.innerHTML = e.target.value;
  };
  
  const selectTrack = document.getElementById('select-track');
  selectTrack.onchange = e => {
    audio.loadSoundFile(e.target.value);
    if (playButton.dataset.playing == "yes") {
      playButton.dispatchEvent(new MouseEvent("click"));
    }
  };
  
  setupVisualizationToggle();
  
  const uploadInput = document.getElementById('upload-track');
  uploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileURL = URL.createObjectURL(file);
      
      const newOption = document.createElement('option');
      newOption.value = fileURL;
      newOption.textContent = file.name;
      newOption.selected = true;
      selectTrack.appendChild(newOption);
      
      audio.loadSoundFile(fileURL);
      
      if (playButton.dataset.playing == "yes") {
        playButton.dispatchEvent(new MouseEvent("click"));
      }
    }
  });
  
  setupControlsPanel();
  
  // Set up checkbox handlers for visualization parameters if needed
  /*
  document.querySelector("#cb-gradient").onclick = e => drawParams.showGradient = e.target.checked;
  document.querySelector("#cb-bars").onclick = e => drawParams.showBars = e.target.checked;
  document.querySelector("#cb-circles").onclick = e => drawParams.showCircles = e.target.checked;
  document.querySelector("#cb-noise").onclick = e => drawParams.showNoise = e.target.checked;
  document.querySelector("#cb-invert").onclick = e => drawParams.showInvert = e.target.checked;
  document.querySelector("#cb-emboss").onclick = e => drawParams.showEmboss = e.target.checked;
  */
};

const setupVisualizationToggle = () => {
  const controlsDiv = document.getElementById('controls');
  
  if (!document.getElementById('visualization-toggle')) {
    const toggleContainer = document.createElement('div');
    toggleContainer.id = 'visualization-toggle'; // Add this line to set the ID
    toggleContainer.className = 'viz-toggle-container';
    toggleContainer.style.margin = '10px 0';
    
    const label = document.createElement('label');
    label.textContent = 'Visualization Type:';
    label.style.display = 'block';
    label.style.marginBottom = '5px';
    
    const freqLabel = document.createElement('label');
    freqLabel.style.marginRight = '10px';
    const freqRadio = document.createElement('input');
    freqRadio.type = 'radio';
    freqRadio.name = 'visualization-type';
    freqRadio.id = 'viz-frequency';
    freqRadio.value = 'frequency';
    freqRadio.checked = true;
    freqLabel.appendChild(freqRadio);
    freqLabel.appendChild(document.createTextNode(' Frequency'));
    
    const timeLabel = document.createElement('label');
    const timeRadio = document.createElement('input');
    timeRadio.type = 'radio';
    timeRadio.name = 'visualization-type';
    timeRadio.id = 'viz-time';
    timeRadio.value = 'time';
    timeLabel.appendChild(timeRadio);
    timeLabel.appendChild(document.createTextNode(' Waveform'));
    
    toggleContainer.appendChild(label);
    toggleContainer.appendChild(freqLabel);
    toggleContainer.appendChild(timeLabel);
    
    controlsDiv.appendChild(toggleContainer);
    
    freqRadio.addEventListener('change', function() {
      if (this.checked) {
        canvas.setVisualizationType('frequency');
      }
    });
    
    timeRadio.addEventListener('change', function() {
      if (this.checked) {
        canvas.setVisualizationType('time');
      }
    });
  }
};

const setupControlsPanel = () => {
  const controls = document.getElementById("controls");
  const settingsToggle = document.getElementById("settings-toggle");
  let isDragging = false;
  let offsetX, offsetY;
  
  settingsToggle.addEventListener("click", (e) => {
    e.preventDefault();
    if (controls.style.display === "none") {
      controls.style.visibility = "visible";
      controls.style.display = "block";
      controls.style.top = "80px";
      controls.style.left = "50%";
      controls.style.transform = "translateX(-50%)";
    } else {
      controls.style.display = "none";

    }
  });
  
  controls.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - controls.offsetLeft;
    offsetY = e.clientY - controls.offsetTop;
    controls.style.cursor = "grabbing";
  });
  
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    controls.style.left = `${e.clientX - offsetX}px`;
    controls.style.top = `${e.clientY - offsetY}px`;
  });
  
  document.addEventListener("mouseup", () => {
    isDragging = false;
    controls.style.cursor = "grab";
  });

  document.addEventListener("click", (e) => {
    if (
      controls.style.display === "block" && 
      !controls.contains(e.target) && 
      e.target !== settingsToggle
    ) {
      controls.style.display = "none";
      controls.style.visibility = "hidden";
    }
  });
  
};

let lastTime = performance.now();
const loop = (currentTime) => {
  requestAnimationFrame(loop);
  
  let deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;
  
  canvas.draw(drawParams, deltaTime);
};

export { init };