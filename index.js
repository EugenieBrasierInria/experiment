// SIZE OF THE SQUARES
const SQUARE_SIZE = {
  BIG: 40,
  MEDIUM: 20,
  SMALL: 10
};
var square_sizes = [SQUARE_SIZE.BIG, SQUARE_SIZE.MEDIUM, SQUARE_SIZE.SMALL];

// NUMBER OF SQUARES 
const SQUARE_NB = {
  BIG: 40,
  MEDIUM: 20,
  SMALL: 10
};
var square_nb = [SQUARE_NB.BIG, SQUARE_NB.MEDIUM, SQUARE_NB.SMALL];

// TYPES OF SHAPES 
const SHAPE_TYPE = {
  SQUARE: 0,
  CIRCLE: 1
};

// TESTED PREATTENTIVE ITEM
const SQUARE_DIFFERENCE = {
  COLOR: 0,
  SHADOW: 1,
  BORDER: 2,
  SIZE: 3,
  ORIENTATION : 4,
  SHAPE : 5
};
var square_difference = SQUARE_DIFFERENCE.SHAPE;

const DEFAULT_SHAPE_TYPE = SHAPE_TYPE.SQUARE;
const DEFAULT_SHAPE_COLOR = "red";
const DEFAULT_SHAPE_BORDER = true;
const DEFAULT_SHAPE_SCALE = 1;
const DEFAULT_SHAPE_ORIENTATION = 0;
const DEFAULT_SHAPE_SHADOW = false;

const CUSTOM_SHAPE_TYPE = SHAPE_TYPE.CIRCLE;
const CUSTOM_SHAPE_COLOR = "blue";
const CUSTOM_SHAPE_BORDER = false;
const CUSTOM_SHAPE_SCALE = 1.5;
const CUSTOM_SHAPE_ORIENTATION = 45;
const CUSTOM_SHAPE_SHADOW = true;

// CANVAS
var canvas = null;
var ctx = null;

// TRIALS
var trialTimeout = null;
const TRIALS_TIMEOUT = 5000;
var id_trial = 0
const trials = [];

// MEASURES
const reactionTimes = [];
var nb_errors = 0;

// EXPERIMENT
let experimentRunning = false;
let startTime = null;
let end = false;

// RESULTS AREA
var results_area = null;

// SQUARES PROPERTIES
const BORDER_WIDTH = 2;
const GAP_SQUARES = SQUARE_SIZE.BIG * Math.sqrt(2) - SQUARE_SIZE.BIG + 10;

/*
 * Showing the first message for the experiment.
 */
function showStartMessage() {
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const rect = canvas.getBoundingClientRect();

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";

    // Centrage horizontal et vertical
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "Appuyez sur ESPACE pour démarrer",
        rect.width / 2,
        rect.height / 2
    );
}

function showEndMessage() {
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const rect = canvas.getBoundingClientRect();

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";

    // Centrage horizontal et vertical
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        "End",
        rect.width / 2,
        rect.height / 2
    );

    const combinations = {};

reactionTimes.forEach(trial => {
    const key = `${trial.square_nb}_${trial.square_size}`;

    if (!combinations[key]) {
        combinations[key] = [];
    }

    combinations[key].push(trial.time);
});

// Récupération des valeurs uniques
const squareNbs = [...new Set(reactionTimes.map(t => t.square_nb))].sort((a, b) => a - b);
const squareSizes = [...new Set(reactionTimes.map(t => t.square_size))].sort((a, b) => a - b);

let html = `
    <table border="1" style="border-collapse: collapse; text-align: center;">
        <thead>
            <tr>
                <th>Nombre de carrés \\ Taille</th>
`;

// En-têtes des colonnes
squareSizes.forEach(size => {
    html += `<th>${size}px</th>`;
});

html += `
            </tr>
        </thead>
        <tbody>
`;

// Création des lignes
squareNbs.forEach(nb => {

    html += `<tr>`;
    html += `<th>${nb}</th>`;

    squareSizes.forEach(size => {

        const key = `${nb}_${size}`;
        const times = combinations[key];

        if (times && times.length > 0) {

            // Moyenne
            const mean =
                times.reduce((sum, time) => sum + time, 0) / times.length;

            // Variance
            const variance =
                times.reduce((sum, time) => {
                    return sum + Math.pow(time - mean, 2);
                }, 0) / times.length;

            html += `
                <td>
                    ${mean.toFixed(2)} ms
                    <br>
                    <small>Var : ${variance.toFixed(2)}</small>
                </td>
            `;

        } else {
            html += `<td>-</td>`;
        }
    });

    html += `</tr>`;
});

html += `
        </tbody>
    </table>
`;

results_area.innerHTML = html;
}

// Vérifie si deux carrés se chevauchent
function isOverlapping(square, squares) {
    return squares.some(other => {
        return (
            square.x < other.x + other.size + GAP_SQUARES &&
            square.x + square.size + GAP_SQUARES > other.x &&
            square.y < other.y + other.size + GAP_SQUARES &&
            square.y + square.size + GAP_SQUARES > other.y
        );
    });
}


// Génère les carrés
function generateShapes() {

    const rect = canvas.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const shapes = [];

    let attempts = 0;
    const maxAttempts = 10000;

    var shape_type = DEFAULT_SHAPE_TYPE;
    var shape_color = DEFAULT_SHAPE_COLOR;
    var shape_border = DEFAULT_SHAPE_BORDER;
    var shape_scale = DEFAULT_SHAPE_SCALE;
    var shape_orientation = DEFAULT_SHAPE_ORIENTATION;
    var shape_shadow = DEFAULT_SHAPE_SHADOW;

    switch (square_difference) {
        case SQUARE_DIFFERENCE.COLOR:
            shape_color = CUSTOM_SHAPE_COLOR;
            break;
        case SQUARE_DIFFERENCE.SHADOW:
            shape_shadow = CUSTOM_SHAPE_SHADOW;
            break;
        case SQUARE_DIFFERENCE.BORDER:
            shape_border = CUSTOM_SHAPE_BORDER;
            break;
        case SQUARE_DIFFERENCE.SIZE:
            shape_scale = CUSTOM_SHAPE_SCALE;
            break;
        case SQUARE_DIFFERENCE.ORIENTATION:
            shape_orientation = CUSTOM_SHAPE_ORIENTATION;
            break;
        case SQUARE_DIFFERENCE.SHAPE:
        default:
            shape_type = CUSTOM_SHAPE_TYPE;
            break;
    }

    if(trials[id_trial].trap){
        const first_shape = {
            type: DEFAULT_SHAPE_TYPE,
            color: DEFAULT_SHAPE_COLOR,
            orientation: DEFAULT_SHAPE_ORIENTATION,
            shadow: DEFAULT_SHAPE_SHADOW,
            border: DEFAULT_SHAPE_BORDER,
            x: GAP_SQUARES + Math.random() * ((width - GAP_SQUARES * 2) - trials[id_trial].square_size * DEFAULT_SHAPE_SCALE),
            y: GAP_SQUARES + Math.random() * ((height - GAP_SQUARES * 2) - trials[id_trial].square_size * DEFAULT_SHAPE_SCALE),
            size: trials[id_trial].square_size * DEFAULT_SHAPE_SCALE
        };
        shapes.push(first_shape);
    } else {
        const first_shape = {
            type: shape_type,
            color: shape_color,
            orientation: shape_orientation,
            shadow: shape_shadow,
            border: shape_border,
            x: GAP_SQUARES + Math.random() * ((width - GAP_SQUARES * 2) - trials[id_trial].square_size * shape_scale),
            y: GAP_SQUARES + Math.random() * ((height - GAP_SQUARES * 2) - trials[id_trial].square_size * shape_scale),
            size: trials[id_trial].square_size * shape_scale
        };
        shapes.push(first_shape);
    }

    while (
        shapes.length < trials[id_trial].square_nb - 1 &&
        attempts < maxAttempts
    ) {
        attempts++;

        const shape = {
            type: DEFAULT_SHAPE_TYPE,
            color: DEFAULT_SHAPE_COLOR,
            orientation: DEFAULT_SHAPE_ORIENTATION,
            shadow: DEFAULT_SHAPE_SHADOW,
            border: DEFAULT_SHAPE_BORDER,
            x: GAP_SQUARES + Math.random() * ((width - GAP_SQUARES * 2) - trials[id_trial].square_size * DEFAULT_SHAPE_SCALE),
            y: GAP_SQUARES + Math.random() * ((height - GAP_SQUARES * 2) - trials[id_trial].square_size * DEFAULT_SHAPE_SCALE),
            size: trials[id_trial].square_size * DEFAULT_SHAPE_SCALE
        };

        if (!isOverlapping(shape, shapes)) {
            shapes.push(shape);
        }
    }

    return shapes;
}


// Dessine les carrés
function drawSquares() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const shapes = generateShapes();

    ctx.strokeStyle = "black";
    ctx.lineWidth = BORDER_WIDTH;

    shapes.forEach(shape => {

        ctx.fillStyle = shape.color;

        if(shape.shadow == false){
            ctx.shadowColor = "transparent";
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } else {
            ctx.shadowColor = "rgba(0, 0, 0, 1)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;
        }

        if(shape.type == SHAPE_TYPE.SQUARE){

            if(shape.orientation == 0){ 
                ctx.fillRect(shape.x, shape.y, shape.size, shape.size);
                if(shape.border){
                    ctx.strokeRect(shape.x, shape.y, shape.size, shape.size);
                }
            } else {
                const cx = shape.x + shape.size / Math.sqrt(2);
                const cy = shape.y + shape.size / Math.sqrt(2);
                const half = shape.size / Math.sqrt(2);

                ctx.beginPath();

                ctx.moveTo(cx, cy - half);      // haut
                ctx.lineTo(cx + half, cy);      // droite
                ctx.lineTo(cx, cy + half);      // bas
                ctx.lineTo(cx - half, cy);      // gauche
                ctx.closePath();
                ctx.fill();

                if(shape.border){
                    ctx.stroke();
                }
            }
        } else {
            ctx.beginPath();
            ctx.arc(shape.x, shape.y, 1.2 * (shape.size / 2), 0, 2 * Math.PI);
            ctx.fill();
            if(shape.border){
                ctx.stroke();
            }
        }
    });
}

function action(event){
    // On ne réagit qu'à la barre espace
    if (event.code !== "Space" || end == true) {
        return;
    }

    // Empêche le scroll de la page avec ESPACE
    event.preventDefault();

    // Évite de déclencher plusieurs fois si la touche reste enfoncée
    if (event.repeat) {
        return;
    }


    // PREMIER APPUI
    if (!experimentRunning) {

        experimentRunning = true;

        // On enregistre le moment où les carrés apparaissent
        startTime = performance.now();

        // Affiche les carrés
        drawSquares();

        trialTimeout = setTimeout(() => {
            if (experimentRunning) {               
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                showStartMessage();
                experimentRunning = false;
                startTime = null;
                trialTimeout = null;

                if(trials[id_trial].trap == false){
                    nb_errors++;
                }
            }

            if(id_trial < trials.length - 1){
                id_trial++;
            } else {
                end = true;
                showEndMessage();
            }

        }, 5000);

    }

    // DEUXIÈME APPUI
    else {

        clearTimeout(trialTimeout);
        trialTimeout = null;

        const endTime = performance.now();

        // Temps écoulé en millisecondes
        const reactionTime = endTime - startTime;

        // Enregistrement dans le tableau
        reactionTimes.push({
            square_nb : trials[id_trial].square_nb, 
            square_size : trials[id_trial].square_size,
            time : reactionTime});
        
        // Errors
        if(trials[id_trial].trap){
            nb_errors++;
        }

        // Les carrés disparaissent
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Retour à l'état initial
        showStartMessage();

        experimentRunning = false;
        startTime = null;

        if(id_trial < trials.length - 1){
            id_trial++;
        } else {
            end = true;
            showEndMessage();
        }
        
    }
}

// Gestion de la touche ESPACE
document.addEventListener("keydown", function(event) {
    action(event);
});

document.addEventListener("touchstart", function(event) {
    action(event);
});


function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    showStartMessage();
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

function generate_trials(nb_standard, nb_traps){
    // Generating trials
    for (const square_nb of Object.values(SQUARE_NB)) {
        for (const square_size of Object.values(SQUARE_SIZE)) {
            // 5 normal trials
            for (let i = 0; i < nb_standard; i++) {
                trials.push({
                    square_nb: square_nb,
                    square_size: square_size,
                    trap: false
                });
            }
            // 2 trials with no particular squares
            for (let i = 0; i < nb_traps; i++) {
                trials.push({
                    square_nb: square_nb,
                    square_size: square_size,
                    trap: true
                });
            }
        }
    }

    shuffle(trials);
    id_trial = 0;

    return trials;
}

function setup_buttons(){

    const button_color = document.getElementById("button_color");
    const button_size = document.getElementById("button_size");
    const button_effect = document.getElementById("button_effect");
    const button_orientation = document.getElementById("button_orientation");
    const button_border = document.getElementById("button_border");
    const button_shape = document.getElementById("button_shape");

    button_color.addEventListener("click", (event) => {
        change_difference(SQUARE_DIFFERENCE.COLOR);
    });
    button_border.addEventListener("click", (event) => {
        change_difference(SQUARE_DIFFERENCE.BORDER);
    });
    button_effect.addEventListener("click", (event) => {
        change_difference(SQUARE_DIFFERENCE.SHADOW);
    });
    button_orientation.addEventListener("click", (event) => {
        change_difference(SQUARE_DIFFERENCE.ORIENTATION);
    });
    button_shape.addEventListener("click", (event) => {
        change_difference(SQUARE_DIFFERENCE.SHAPE);
    });
    button_size.addEventListener("click", (event) => {
        change_difference(SQUARE_DIFFERENCE.SIZE);
    });

    return;
}

function change_difference(n_difference){
    if (window.confirm("Voulez-vous recommencer l'expérience ?")) {

        // Changing the difference
        square_difference = n_difference;

       // Generating trials
        generate_trials(5, 2);
        id_trial = 0;
        end = false;

        // État initial
        showStartMessage();

    }
    return;
}

window.addEventListener("resize", resizeCanvas);

window.addEventListener('load', () => {

    // Setting up the canvas
    canvas = document.getElementById("experiment_area");
    ctx = canvas.getContext("2d");
    resizeCanvas();

    // Setting up the results area
    results_area = document.getElementById("results_area");

    // Setting up the buttons
    setup_buttons();

    // Generating trials
    generate_trials(2, 0);

    // État initial
    showStartMessage();

})