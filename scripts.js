// EXERCISE DATA - Add all exercises here
const EXERCISES = [
    {
        id: 'dumbbellfrontsquat',
        name: 'Dumbbell Front Squat',
        targetReps: 12,
        image: 'img/dumbbell_front_squat.jpg',
        gif: 'img/dumbbell_front_squat.gif',
        weight: true
    },
    {
        id: 'deadlift',
        name: 'Romanian Deadlift',
        targetReps: 10,
        image: 'img/barbell_romanian_deadlift.jpg',
        gif: 'img/barbell_romanian_deadlift.gif',
        weight: true
    },
    {
        id: 'bench',
        name: 'Bench Press',
        targetReps: 8,
        image: 'img/barbell_benchpress.jpg',
        gif: 'img/barbell_benchpress.gif',
        weight: true
    },
    {
        id: 'hammercurl',
        name: 'Hammer Curl',
        targetReps: 8,
        image: 'img/hammer_curl.jpg',
        gif: 'img/hammer_curl.gif',
        weight: true
    },
    {
        id: 'widegrippushup',
        name: 'Wide Grip Push Up',
        targetReps: 20,
        image: 'img/wide_grip_pushup.jpg',
        gif: 'img/wide_grip_pushup.gif',
        weight: false
    },
    {
        id: 'twistingsitup',
        name: 'Twisting Sit Up',
        targetReps: 20,
        image: 'img/twisting_situp.jpg',
        gif: 'img/twisting_situp.gif',
        weight: false
    }
];

// WORKOUT PRESETS - Define different workout routines
const WORKOUT_PRESETS = [
    {
        name: 'Full Body',
        description: 'All exercises',
        exercises: [1, 2, 3, 4, 5]
    },
    {
        name: 'Leg Day',
        description: 'Lower body focus',
        exercises: [1, 2]
    },
    {
        name: 'Upper Body',
        description: 'Chest, back, arms',
        exercises: [3, 4, 5]
    },
    {
        name: 'Strength',
        description: 'Heavy compound lifts',
        exercises: [1, 2, 3]
    },
    {
        name: 'Endurance',
        description: 'High reps',
        exercises: [4, 5]
    }
];

// Exercise Tracker Module
const ExerciseTracker = {
    lightboxConfig: {
        captionDelay: 100,
        enableZoom: true,
        captionsData: 'alt',
        animationSpeed: 250,
        history: false
    },
    _lightboxInstance: null,

    init() {
        this.renderMenu();
        this.renderExercises();
        this.initLightbox();
        this.loadSavedValues();
    },

    renderMenu() {
        const menu = document.getElementById('workout-menu');
        menu.innerHTML = '';

        WORKOUT_PRESETS.forEach((preset, index) => {
            const exerciseParams = preset.exercises.join(',');
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            const link = document.createElement('a');
            link.href = `?e=${exerciseParams}`;
            link.style.flex = '1';
            link.style.textDecoration = 'none';
            link.style.color = 'inherit';
            link.innerHTML = `
                <div><strong>${preset.name}</strong></div>
                <small class="text-muted">${preset.description}</small>
            `;
            
            const checkIcon = document.createElement('i');
            checkIcon.className = 'bi bi-check-square';
            checkIcon.style.cursor = 'pointer';
            checkIcon.style.fontSize = '1.25rem';
            checkIcon.style.color = '#6c757d';
            checkIcon.style.marginLeft = '1rem';
            checkIcon.dataset.workoutIndex = index;
            
            checkIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWorkoutComplete(index, checkIcon);
            });
            
            li.appendChild(link);
            li.appendChild(checkIcon);
            menu.appendChild(li);
        });

        // Add "View All" option
        const viewAllLi = document.createElement('li');
        viewAllLi.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        const viewAllLink = document.createElement('a');
        viewAllLink.href = '?';
        viewAllLink.style.flex = '1';
        viewAllLink.style.textDecoration = 'none';
        viewAllLink.style.color = 'inherit';
        viewAllLink.innerHTML = `
            <div><strong>View All</strong></div>
            <small class="text-muted">All exercises</small>
        `;
        
        const viewAllCheck = document.createElement('i');
        viewAllCheck.className = 'bi bi-check-square';
        viewAllCheck.style.cursor = 'pointer';
        viewAllCheck.style.fontSize = '1.25rem';
        viewAllCheck.style.color = '#6c757d';
        viewAllCheck.style.marginLeft = '1rem';
        viewAllCheck.dataset.workoutIndex = 'viewall';
        
        viewAllCheck.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWorkoutComplete('viewall', viewAllCheck);
        });
        
        viewAllLi.appendChild(viewAllLink);
        viewAllLi.appendChild(viewAllCheck);
        menu.appendChild(viewAllLi);
        
        // Restore completed states from localStorage
        restoreWorkoutStates();
    },

    parseExerciseSelection() {
        const raw = window.location.search || '';
        if (!raw || raw.length <= 1) return [];
        const qs = raw.substring(1);
        const parts = qs.split('&').filter(Boolean);
        const values = [];

        parts.forEach(part => {
            if (!part) return;
            if (part.includes('=')) {
                const [k, v] = part.split('=');
                if (k === 'e' && v) {
                    v.split(',').forEach(item => {
                        const val = item.trim();
                        if (/^\d+$/.test(val)) values.push(parseInt(val));
                    });
                }
            } else {
                const token = part.trim();
                if (/^\d+$/.test(token)) values.push(parseInt(token));
            }
        });

        return values;
    },

    renderExercises() {
        const container = document.getElementById('exercise-container');
        container.innerHTML = '';
        
        const selection = this.parseExerciseSelection();
        const exercisesToRender = selection.length > 0 
            ? selection.map(idx => EXERCISES[idx - 1]).filter(Boolean)
            : EXERCISES;

        // Update the workout title in the navbar
        updateWorkoutTitle(selection);

        exercisesToRender.forEach((exercise, index) => {
            const rowHTML = this.createExerciseRowHTML(exercise, index);
            container.insertAdjacentHTML('beforeend', rowHTML);
        });

        this.initExerciseListeners();
    },

    createExerciseRowHTML(exercise, index) {
        const weightColHtml = exercise.weight 
            ? `<div class="col-4">
                    <input type="number" id="${exercise.id}-weight-${index}" placeholder="weight..." class="exercise-input">
                </div>`
            : `<div class="col-4"></div>`;
        
        return `
            <div class="row exercise-row" data-exercise-id="${exercise.id}" data-index="${index + 1}">
                <div class="col-2">
                    <a href="${exercise.gif}" class="lightbox">
                        <img src="${exercise.image}" class="img-fluid gallery-image w-full h-48 object-cover transition duration-200" alt="${exercise.name}">
                    </a>
                </div>
                <div class="col-10">
                    <div class="row">
                        <div class="col">${exercise.name}: ${exercise.targetReps}</div>
                    </div>
                    <div class="row">
                        <div class="col-4">
                            <input type="number" id="${exercise.id}-reps-${index}" placeholder="reps..." class="exercise-input">
                        </div>
                        ${weightColHtml}
                        <div class="col-2 text-center">
                            <button class="btn btn-primary btn-sm submit-exercise" data-exercise="${exercise.id}" data-index="${index}">Submit <i class="bi bi-caret-right"></i></button>
                        </div>
                        <div class="col-2 text-end">
                            <span id="${exercise.id}-output-${index}"></span>
                            <i class="bi bi-x-circle clear-exercise" data-exercise="${exercise.id}" data-index="${index}" title="Clear exercise"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    initExerciseListeners() {
        document.querySelectorAll('.submit-exercise').forEach(button => {
            button.addEventListener('click', (e) => {
                const exercise = e.target.getAttribute('data-exercise');
                const index = e.target.getAttribute('data-index');
                this.updateExercise(exercise, index);
            });
        });

        document.querySelectorAll('.clear-exercise').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const exercise = e.target.getAttribute('data-exercise');
                const index = e.target.getAttribute('data-index');
                this.clearExercise(exercise, index);
            });
        });
    },

    initLightbox() {
        try {
            if (this._lightboxInstance && typeof this._lightboxInstance.destroy === 'function') {
                this._lightboxInstance.destroy();
            }
        } catch (e) {
            // ignore
        }
        this._lightboxInstance = new SimpleLightbox('a.lightbox', this.lightboxConfig);
    },

    updateExercise(exerciseId, index) {
        const repsInput = document.getElementById(`${exerciseId}-reps-${index}`);
        const weightInput = document.getElementById(`${exerciseId}-weight-${index}`);
        const exercise = EXERCISES.find(e => e.id === exerciseId);
        
        const reps = repsInput.value;
        const weight = weightInput ? weightInput.value : '';
        
        // If exercise requires weight, check both reps and weight
        // If exercise doesn't require weight, only check reps
        const isValid = exercise.weight ? (reps && weight) : reps;
        
        if (isValid) {
            const output = weight ? `${reps} x ${weight}` : reps;
            document.getElementById(`${exerciseId}-output-${index}`).textContent = output;
            this.saveExercise(exerciseId, reps, weight);
            
            const exerciseRow = repsInput.closest('.exercise-row');
            exerciseRow.classList.add('exercise-complete');

            repsInput.value = '';
            if (weightInput) {
                weightInput.value = '';
            }
        }
    },

    clearExercise(exerciseId, index) {
        localStorage.removeItem(`exercise-${exerciseId}`);
        
        const exerciseRow = document.querySelector(`[data-exercise-id="${exerciseId}"][data-index="${parseInt(index) + 1}"]`);
        exerciseRow.classList.remove('exercise-complete');
        
        document.getElementById(`${exerciseId}-output-${index}`).textContent = '';
        document.getElementById(`${exerciseId}-reps-${index}`).value = '';
        
        const weightInput = document.getElementById(`${exerciseId}-weight-${index}`);
        if (weightInput) {
            weightInput.value = '';
        }
    },

    saveExercise(exerciseId, reps, weight) {
        localStorage.setItem(`exercise-${exerciseId}`, JSON.stringify([reps, weight]));
    },

    loadSavedValues() {
        document.querySelectorAll('.exercise-row').forEach(row => {
            const exerciseId = row.getAttribute('data-exercise-id');
            const exercise = EXERCISES.find(e => e.id === exerciseId);
            const saved = localStorage.getItem(`exercise-${exerciseId}`);
            
            if (saved) {
                const [reps, weight] = JSON.parse(saved);
                const index = parseInt(row.getAttribute('data-index')) - 1;
                
                const output = exercise.weight ? `${reps} x ${weight}` : reps;
                document.getElementById(`${exerciseId}-output-${index}`).textContent = output;
                // Don't add the exercise-complete class on page load
                // row.classList.add('exercise-complete');
            }
        });
    }
};

// TIMER NAVBAR FUNCTIONALITY
const navbar   = document.getElementById('timerNavbar');
const timerBtn = document.getElementById('timerBtn');
const icon     = document.getElementById('stopwatchIcon');
let active = false, tid = null, startTime = 0;
let audioCtx = null;

// Timer duration (in milliseconds) - load from localStorage or default to 30 seconds
let timerDuration = parseInt(localStorage.getItem('timerDuration') || '30') * 1000;

// Function to highlight the selected timer duration in the menu
function updateTimerMenuHighlight() {
  const currentDuration = timerDuration / 1000;
  document.querySelectorAll('.timer-duration-option').forEach(option => {
    const duration = parseInt(option.getAttribute('data-duration'));
    if (duration === currentDuration) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

// Initialize timer duration options
document.querySelectorAll('.timer-duration-option').forEach(option => {
  option.addEventListener('click', (e) => {
    e.preventDefault();
    const duration = parseInt(e.target.getAttribute('data-duration'));
    timerDuration = duration * 1000;
    localStorage.setItem('timerDuration', duration);
    updateTimerMenuHighlight();
  });
});

// Highlight the selected duration on page load
updateTimerMenuHighlight();

// Only start timer on stopwatch icon click, not on dropdown toggle
document.getElementById('stopwatchIcon').addEventListener('click', (e) => {
  e.stopPropagation();
  if (active) reset(); else start();
});

function start() {
    active = true;
    startTime = Date.now();
    navbar.classList.add('active');
    icon.classList.replace('bi-stopwatch', 'bi-stopwatch-fill');
    icon.classList.add('stopwatch-active');

    // Set dynamic animation duration based on timerDuration
    const durationSeconds = timerDuration / 1000;
    navbar.style.setProperty('--animation-duration', `${durationSeconds}s`);

    void navbar.offsetWidth;
    tid = setTimeout(reset, timerDuration);
  }function reset() {
  clearTimeout(tid);
  const finishedNaturally = active && Date.now() >= startTime + timerDuration;

  active = false;
  navbar.classList.remove('active');
  icon.classList.replace('bi-stopwatch-fill', 'bi-stopwatch');
  icon.classList.remove('stopwatch-active');

  if (finishedNaturally) {
    playBeep();
  }
}

function playBeep() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.frequency.value = 200;
  osc.type = 'square';
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}

// Workout completion tracking
function toggleWorkoutComplete(workoutIndex, checkIcon) {
  const workoutName = WORKOUT_PRESETS[workoutIndex]?.name || (workoutIndex === 'viewall' ? 'View All' : 'Unknown');
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  // Flash the icon green
  checkIcon.classList.remove('bi-check-square');
  checkIcon.classList.add('bi-check-square-fill');
  checkIcon.style.color = '#28a745';
  
  // Reset after 500ms
  setTimeout(() => {
    checkIcon.classList.remove('bi-check-square-fill');
    checkIcon.classList.add('bi-check-square');
    checkIcon.style.color = '#6c757d';
  }, 500);
  
  // Add to log
  addToLog(workoutName, today);
}

function addToLog(workoutName, date) {
  // Get existing log
  let log = JSON.parse(localStorage.getItem('workoutLog') || '[]');
  
  // Add new entry
  log.push({
    id: Date.now(),
    name: workoutName,
    date: date,
    rating: 0
  });
  
  // Save to localStorage
  localStorage.setItem('workoutLog', JSON.stringify(log));
  
  // Update the log display
  renderWorkoutLog();
}

function removeFromLog(logId) {
  // Get existing log
  let log = JSON.parse(localStorage.getItem('workoutLog') || '[]');
  
  // Remove the entry
  log = log.filter(entry => entry.id !== logId);
  
  // Save to localStorage
  localStorage.setItem('workoutLog', JSON.stringify(log));
  
  // Update the log display
  renderWorkoutLog();
}

function renderWorkoutLog() {
  const logContainer = document.getElementById('workout-log');
  const log = JSON.parse(localStorage.getItem('workoutLog') || '[]');
  
  logContainer.innerHTML = '';
  
  if (log.length === 0) {
    logContainer.innerHTML = '<li class="list-group-item text-muted">No workouts logged</li>';
    return;
  }
  
  // Show in reverse order (most recent first)
  log.reverse().forEach(entry => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    
    const textDiv = document.createElement('div');
    textDiv.style.flex = '1';
    textDiv.innerHTML = `
      <div><strong>${entry.name}</strong></div>
      <small class="text-muted">${entry.date}</small>
    `;
    
    // Star rating container
    const ratingDiv = document.createElement('div');
    ratingDiv.style.display = 'flex';
    ratingDiv.style.gap = '0.25rem';
    ratingDiv.style.margin = '0 1rem';
    
    // Create 4 star icons
    for (let i = 1; i <= 4; i++) {
      const star = document.createElement('i');
      star.className = entry.rating >= i ? 'bi bi-star-fill' : 'bi bi-star';
      star.style.cursor = 'pointer';
      star.style.fontSize = '1rem';
      star.style.color = entry.rating >= i ? '#ffc107' : '#6c757d';
      star.dataset.rating = i;
      star.dataset.logId = entry.id;
      
      star.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        updateWorkoutRating(entry.id, i);
      });
      
      star.addEventListener('mouseover', () => {
        // Preview stars on hover
        for (let j = 1; j <= 4; j++) {
          const starElements = ratingDiv.querySelectorAll('[data-log-id="' + entry.id + '"]');
          starElements.forEach(s => {
            if (parseInt(s.dataset.rating) <= i) {
              s.style.color = '#ffc107';
              s.classList.remove('bi-star');
              s.classList.add('bi-star-fill');
            } else {
              s.style.color = '#6c757d';
              s.classList.remove('bi-star-fill');
              s.classList.add('bi-star');
            }
          });
        }
      });
      
      star.addEventListener('mouseout', () => {
        // Restore actual rating on mouse out
        for (let j = 1; j <= 4; j++) {
          const starElements = ratingDiv.querySelectorAll('[data-log-id="' + entry.id + '"]');
          starElements.forEach(s => {
            if (entry.rating >= parseInt(s.dataset.rating)) {
              s.style.color = '#ffc107';
              s.classList.remove('bi-star');
              s.classList.add('bi-star-fill');
            } else {
              s.style.color = '#6c757d';
              s.classList.remove('bi-star-fill');
              s.classList.add('bi-star');
            }
          });
        }
      });
      
      ratingDiv.appendChild(star);
    }
    
    const removeIcon = document.createElement('i');
    removeIcon.className = 'bi bi-x-circle';
    removeIcon.style.cursor = 'pointer';
    removeIcon.style.fontSize = '1.25rem';
    removeIcon.style.color = '#6c757d';
    
    removeIcon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeFromLog(entry.id);
    });
    
    removeIcon.addEventListener('mouseover', () => {
      removeIcon.style.color = '#dc3545';
    });
    
    removeIcon.addEventListener('mouseout', () => {
      removeIcon.style.color = '#6c757d';
    });
    
    li.appendChild(textDiv);
    li.appendChild(ratingDiv);
    li.appendChild(removeIcon);
    logContainer.appendChild(li);
  });
}

function updateWorkoutRating(logId, rating) {
  let log = JSON.parse(localStorage.getItem('workoutLog') || '[]');
  
  const entry = log.find(e => e.id === logId);
  if (entry) {
    entry.rating = rating;
    localStorage.setItem('workoutLog', JSON.stringify(log));
    renderWorkoutLog();
  }
}

function updateWorkoutTitle(selection) {
  const titleSpan = document.getElementById('workoutTitle');
  
  if (selection.length === 0) {
    // No specific workout selected, show all exercises
    titleSpan.textContent = '';
    return;
  }
  
  // Find matching workout preset
  let workoutName = null;
  
  WORKOUT_PRESETS.forEach(preset => {
    if (JSON.stringify(preset.exercises.sort((a, b) => a - b)) === 
        JSON.stringify(selection.slice().sort((a, b) => a - b))) {
      workoutName = preset.name;
    }
  });
  
  // If no preset matches, show the exercise count or indices
  if (!workoutName) {
    workoutName = `Workout (${selection.length} exercise${selection.length !== 1 ? 's' : ''})`;
  }
  
  titleSpan.textContent = workoutName;
}

function restoreWorkoutStates() {
  renderWorkoutLog();
}