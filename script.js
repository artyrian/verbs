let verbs = [
    "be - was/were - been - быть",
    "do - did - done - делать",
    "go - went - gone - идти",
    "have - had - had - иметь",
    "say - said - said - говорить"
];

let parsedVerbs = [];
let availableVerbs = [];
let correctlyAnsweredVerbs = [];

let currentVerb = null;
let currentMode = 'v1'; // 'v1' or 'ru'
let score = 0;
let total = 0;
let isCheckingAnswer = false;
let showTranslate = false;
let showHint = false;

const verbPrompt = document.getElementById('verb-prompt');
const v1QuizForm = document.getElementById('v1-quiz-form');
const ruQuizForm = document.getElementById('ru-quiz-form');
const v1ModeButton = document.getElementById('v1-mode');
const ruModeButton = document.getElementById('ru-mode');
const checkButton = document.getElementById('check-button');
const feedback = document.getElementById('feedback');
const correctAnswer = document.getElementById('correct-answer');
const scoreElement = document.getElementById('score');
const totalElement = document.getElementById('total');
const percentageElement = document.getElementById('percentage');
const remainingVerbsElement = document.getElementById('remaining-verbs');
const fileInput = document.getElementById('verb-file');
const fileStatus = document.getElementById('file-status');
const excludeCorrectCheckbox = document.getElementById('exclude-correct');
const resetStatsButton = document.getElementById('reset-stats');
const showTranslateCheckbox = document.getElementById('show-translate');
const showHintCheckbox = document.getElementById('show-hint');

function tryLoadDefaultFile() {
    fetch('irregular_verbs.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error('File not found');
            }
            return response.text();
        })
        .then(data => {
            processVerbFile(data);
            fileStatus.textContent = 'Successfully loaded irregular_verbs.txt';
        })
        .catch(error => {
            console.error('Error loading default file:', error);
            fileStatus.textContent = 'No default file found. Please select a verb file.';
            parseVerbs(verbs);
        });
}

function processVerbFile(content) {
    const lines = content.split('\n');
    const validLines = lines.filter(line => line.trim() !== '' && line.includes(' - '));
    
    if (validLines.length > 0) {
        verbs = validLines;
        parseVerbs(verbs);
        fileStatus.textContent = `Loaded ${verbs.length} verbs successfully.`;
    } else {
        fileStatus.textContent = 'Invalid file format. Using default verbs.';
        parseVerbs(verbs);
    }
}

function parseVerbs(verbList) {
    parsedVerbs = verbList.map((verb, index) => {
        const parts = verb.split(' - ');
        if (parts.length >= 4) {
            return {
                id: index,
                v1: parts[0].trim(),
                v2: parts[1].trim(),
                v3: parts[2].trim(),
                ru: parts[3].trim()
            };
        }
        return null;
    }).filter(v => v !== null);
    
    resetAvailableVerbs();
    
    loadNextVerb();
}

function resetAvailableVerbs() {
    availableVerbs = [...parsedVerbs];
    correctlyAnsweredVerbs = [];
    
    if (resetStatsButton) {
        resetStatsButton.classList.add('hidden');
    }
    
    updateRemainingCount();
}

function updateRemainingCount() {
    if (remainingVerbsElement) {
        remainingVerbsElement.textContent = availableVerbs.length;
    }
}

function toggleTranslate() {
    showTranslate = showTranslateCheckbox.checked;
    updateVerbPrompt();
}

function toggleHint() {
    showHint = showHintCheckbox.checked;
    updateVerbPrompt();
}

function updateVerbPrompt() {
    if (!currentVerb) return;
    
    verbPrompt.title = '';
    
    if (currentMode === 'v1') {
        if (showTranslate) {
            verbPrompt.title = showHint 
                ? `${currentVerb.v2} / ${currentVerb.v3} - ${currentVerb.ru}`
                : `${currentVerb.ru}`;
        } else if (showHint) {
            verbPrompt.title = `${currentVerb.v2} / ${currentVerb.v3}`;
        }
    } else {
        if (showHint) {
            verbPrompt.title = showTranslate 
                ? `${currentVerb.v1} / ${currentVerb.v2} / ${currentVerb.v3} - ${currentVerb.ru}`
                : `${currentVerb.v1} / ${currentVerb.v2} / ${currentVerb.v3}`;
        } else if (showTranslate) {
            verbPrompt.title = `${currentVerb.v1}`;
        }
    }
}

function initQuiz() {
    tryLoadDefaultFile();
    
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            fileStatus.textContent = `Reading ${file.name}...`;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                processVerbFile(content);
            };
            reader.onerror = () => {
                fileStatus.textContent = 'Error reading file. Using default verbs.';
                parseVerbs(verbs);
            };
            reader.readAsText(file);
        }
    });
    
    checkButton.addEventListener('click', checkAnswer);
    v1ModeButton.addEventListener('click', () => setMode('v1'));
    ruModeButton.addEventListener('click', () => setMode('ru'));
    excludeCorrectCheckbox.addEventListener('change', toggleExcludeCorrect);
    resetStatsButton.addEventListener('click', resetStats);
    showTranslateCheckbox.addEventListener('change', toggleTranslate);
    showHintCheckbox.addEventListener('change', toggleHint);
    
    document.addEventListener('keydown', handleKeyPress);
}

function toggleExcludeCorrect() {
    if (excludeCorrectCheckbox.checked && correctlyAnsweredVerbs.length > 0) {
        availableVerbs = parsedVerbs.filter(verb => 
            !correctlyAnsweredVerbs.some(correctVerb => correctVerb.id === verb.id)
        );
        
        resetStatsButton.classList.remove('hidden');
        updateRemainingCount();
        
        if (availableVerbs.length === 0) {
            alert("You've correctly answered all verbs! Resetting the quiz.");
            resetStats();
        } else {
            loadNextVerb();
        }
    } else if (!excludeCorrectCheckbox.checked) {
        resetAvailableVerbs();
        resetStatsButton.classList.add('hidden');
        loadNextVerb();
    }
}

function resetStats() {
    score = 0;
    total = 0;
    correctlyAnsweredVerbs = [];
    resetAvailableVerbs();
    updateStats();
    loadNextVerb();
    resetStatsButton.classList.add('hidden');
}

function handleKeyPress(e) {
    if (isCheckingAnswer) return;
    
    if (e.key === 'Enter') {
        if (currentMode === 'v1' && document.activeElement === document.getElementById('v2-input')) {
            e.preventDefault();
            document.getElementById('v3-input').focus();
            return;
        }
        
        if (currentMode === 'ru' && document.activeElement === document.getElementById('v1-input')) {
            e.preventDefault();
            document.getElementById('v2-input-ru').focus();
            return;
        }
        
        if (currentMode === 'ru' && document.activeElement === document.getElementById('v2-input-ru')) {
            e.preventDefault();
            document.getElementById('v3-input-ru').focus();
            return;
        }
        
        checkAnswer();
    }
}

function setMode(mode) {
    currentMode = mode;
    
    if (mode === 'v1') {
        v1ModeButton.classList.add('active');
        ruModeButton.classList.remove('active');
        v1QuizForm.classList.remove('hidden');
        ruQuizForm.classList.add('hidden');
    } else {
        v1ModeButton.classList.remove('active');
        ruModeButton.classList.add('active');
        v1QuizForm.classList.add('hidden');
        ruQuizForm.classList.remove('hidden');
    }
    
    loadNextVerb();
}

function toggleFormFields(disabled) {
    document.getElementById('v2-input').disabled = disabled;
    document.getElementById('v3-input').disabled = disabled;
    document.getElementById('v1-input').disabled = disabled;
    document.getElementById('v2-input-ru').disabled = disabled;
    document.getElementById('v3-input-ru').disabled = disabled;
    
    checkButton.disabled = disabled;
    
    isCheckingAnswer = disabled;
}

function loadNextVerb() {
    if (parsedVerbs.length === 0) {
        verbPrompt.textContent = "Waiting for verbs to load...";
        return;
    }
    
    if (availableVerbs.length === 0) {
        verbPrompt.textContent = "You've gone through all verbs!";
        toggleFormFields(true);
        
        if (excludeCorrectCheckbox.checked) {
            resetStatsButton.classList.remove('hidden');
        }
        return;
    }
    
    feedback.style.display = 'none';
    correctAnswer.classList.add('hidden');
    
    toggleFormFields(false);
    
    document.getElementById('v2-input').value = '';
    document.getElementById('v3-input').value = '';
    document.getElementById('v1-input').value = '';
    document.getElementById('v2-input-ru').value = '';
    document.getElementById('v3-input-ru').value = '';
    
    const randomIndex = Math.floor(Math.random() * availableVerbs.length);
    currentVerb = availableVerbs[randomIndex];
    
    if (currentMode === 'v1') {
        verbPrompt.textContent = currentVerb.v1;
    } else {
        verbPrompt.textContent = currentVerb.ru;
    }
    
    updateVerbPrompt();
    
    if (currentMode === 'v1') {
        document.getElementById('v2-input').focus();
    } else {
        document.getElementById('v1-input').focus();
    }
}

function checkAnswer() {
    if (!currentVerb || isCheckingAnswer) return;
    
    toggleFormFields(true);
    
    let isCorrect = false;
    
    if (currentMode === 'v1') {
        const v2Input = document.getElementById('v2-input').value.trim();
        const v3Input = document.getElementById('v3-input').value.trim();
        
        isCorrect = checkVerbForms(v2Input, currentVerb.v2) && 
                   checkVerbForms(v3Input, currentVerb.v3);
        
        if (!isCorrect) {
            correctAnswer.textContent = `Correct answer: ${currentVerb.v2} - ${currentVerb.v3}`;
        }
    } else {
        const v1Input = document.getElementById('v1-input').value.trim();
        const v2Input = document.getElementById('v2-input-ru').value.trim();
        const v3Input = document.getElementById('v3-input-ru').value.trim();
        
        isCorrect = checkVerbForms(v1Input, currentVerb.v1) && 
                   checkVerbForms(v2Input, currentVerb.v2) && 
                   checkVerbForms(v3Input, currentVerb.v3);
        
        if (!isCorrect) {
            correctAnswer.textContent = `Correct answer: ${currentVerb.v1} - ${currentVerb.v2} - ${currentVerb.v3}`;
        }
    }
    
    feedback.textContent = isCorrect ? "Correct!" : "Not quite right";
    feedback.className = isCorrect ? "feedback correct" : "feedback incorrect";
    feedback.style.display = 'block';
    
    if (!isCorrect) {
        correctAnswer.classList.remove('hidden');
    }
    
    total++;
    if (isCorrect) {
        score++;
        
        if (excludeCorrectCheckbox.checked) {
            correctlyAnsweredVerbs.push(currentVerb);
            
            availableVerbs = availableVerbs.filter(verb => verb.id !== currentVerb.id);
            updateRemainingCount();
            
            if (correctlyAnsweredVerbs.length > 0) {
                resetStatsButton.classList.remove('hidden');
            }
        }
    }
    updateStats();
    
    setTimeout(() => {
        loadNextVerb();
    }, 2000);
}

function checkVerbForms(input, expected) {
    input = input.toLowerCase();
    expected = expected.toLowerCase();
    
    if (expected.includes('/')) {
        const variants = expected.split('/');
        return variants.some(variant => input === variant.trim());
    }
    
    return input === expected;
}

function updateStats() {
    scoreElement.textContent = score;
    totalElement.textContent = total;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    percentageElement.textContent = `${percentage}%`;
}

initQuiz();
