// EXERCISE DATA - Add all exercises here
const EXERCISES = [
    {
        id: 'dumbbellfrontsquat',
        name: 'Dumbbell Front Squat',
        targetReps: 12,
        image: 'img/dumbbell_front_squat.jpg',
        gif: 'img/dumbbell_front_squat.gif'
    },
    {
        id: 'deadlift',
        name: 'Romanian Deadlift',
        targetReps: 10,
        image: 'img/barbell_romanian_deadlift.jpg',
        gif: 'img/barbell_romanian_deadlift.gif'
    },
    {
        id: 'bench',
        name: 'Bench Press',
        targetReps: 8,
        image: 'img/barbell_benchpress.jpg',
        gif: 'img/barbell_benchpress.gif'
    },
    {
        id: 'hammercurl',
        name: 'Hammer Curl',
        targetReps: 8,
        image: 'img/hammer_curl.jpg',
        gif: 'img/hammer_curl.gif'
    },
    {
        id: 'widegrippushup',
        name: 'Wide Grip Push Up',
        targetReps: 20,
        image: 'img/wide_grip_pushup.jpg',
        gif: 'img/wide_grip_pushup.gif'
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
        this.renderExercises();
        this.initLightbox();
        this.loadSavedValues();
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

        exercisesToRender.forEach((exercise, index) => {
            const rowHTML = this.createExerciseRowHTML(exercise, index);
            container.insertAdjacentHTML('beforeend', rowHTML);
        });

        this.initExerciseListeners();
    },

    createExerciseRowHTML(exercise, index) {
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
                        <div class="col-4">
                            <input type="number" id="${exercise.id}-weight-${index}" placeholder="weight..." class="exercise-input">
                        </div>
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
        const reps = repsInput.value;
        const weight = weightInput.value;
        
        if (reps && weight) {
            document.getElementById(`${exerciseId}-output-${index}`).textContent = `${reps} x ${weight}`;
            this.saveExercise(exerciseId, reps, weight);
            
            const exerciseRow = repsInput.closest('.exercise-row');
            exerciseRow.classList.add('exercise-complete');

            repsInput.value = '';
            weightInput.value = '';
        }
    },

    clearExercise(exerciseId, index) {
        localStorage.removeItem(`exercise-${exerciseId}`);
        
        const exerciseRow = document.querySelector(`[data-exercise-id="${exerciseId}"][data-index="${parseInt(index) + 1}"]`);
        exerciseRow.classList.remove('exercise-complete');
        
        document.getElementById(`${exerciseId}-output-${index}`).textContent = '';
        document.getElementById(`${exerciseId}-reps-${index}`).value = '';
        document.getElementById(`${exerciseId}-weight-${index}`).value = '';
    },

    saveExercise(exerciseId, reps, weight) {
        localStorage.setItem(`exercise-${exerciseId}`, JSON.stringify([reps, weight]));
    },

    loadSavedValues() {
        document.querySelectorAll('.exercise-row').forEach(row => {
            const exerciseId = row.getAttribute('data-exercise-id');
            const saved = localStorage.getItem(`exercise-${exerciseId}`);
            
            if (saved) {
                const [reps, weight] = JSON.parse(saved);
                const index = parseInt(row.getAttribute('data-index')) - 1;
                
                document.getElementById(`${exerciseId}-output-${index}`).textContent = `${reps} x ${weight}`;
                // Don't add the exercise-complete class on page load
                // row.classList.add('exercise-complete');
            }
        });
    }
};