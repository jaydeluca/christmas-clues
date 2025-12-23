import './style.css';
import { cipherKey, riddles } from './gameData';

// Page sections
const landingPage = document.getElementById('landing-page') as HTMLElement;
const puzzlePage = document.getElementById('puzzle-page') as HTMLElement;
const solutionPage = document.getElementById('solution-page') as HTMLElement;
const feedbackMessageEl = document.getElementById('feedback-message') as HTMLDivElement;
const confettiContainer = document.getElementById('confetti-container') as HTMLDivElement;


const playerLilyCard = document.getElementById('player-lily') as HTMLDivElement;
const playerElsieCard = document.getElementById('player-elsie') as HTMLDivElement;

// Puzzle page elements
const puzzleAvatarEl = document.getElementById('puzzle-avatar') as HTMLImageElement;
const puzzlePlayerNameEl = document.getElementById('puzzle-player-name') as HTMLParagraphElement;
const cipherKeyContainer = document.getElementById('cipher-key') as HTMLElement;
const fullEncryptedRiddleEl = document.getElementById('full-encrypted-riddle') as HTMLParagraphElement;
const currentEncryptedWordEl = document.getElementById('current-encrypted-word') as HTMLParagraphElement;
const guessForm = document.getElementById('guess-form') as HTMLFormElement;
const playerGuessInput = document.getElementById('player-guess') as HTMLInputElement;
const solutionSoFarEl = document.getElementById('solution-so-far') as HTMLParagraphElement;

const finalRiddleEl = document.getElementById('final-riddle') as HTMLParagraphElement;

// AudioContext for Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const players: { [key: string]: { name: string; avatar: string } } = {
  'Lily': { name: 'LilyBean', avatar: 'lily.png' },
  'Elsie': { name: 'Elsie & Evie', avatar: 'elsie.png' }
};

// --- Game State ---
let originalRiddleWords: string[] = [];
let encryptedRiddleWords: string[] = [];
let solvedWords: Set<string> = new Set(); // Simplified state: A set of solved (normalized) words
let currentWordIndex = 0;

const normalize = (str: string) => str.replace(/[^\w]/g, '').toLowerCase();

function encryptRiddle(riddle: string): string {
  return riddle.toUpperCase().split('').map(char => cipherKey[char] || char).join('');
}

function playCorrectSound() {
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.15, now);
  gain.connect(audioContext.destination);

  function chime(freq: number, time: number) {
    const osc = audioContext.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, time);
    osc.connect(gain);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  chime(880, now);        // A5
  chime(1175, now + 0.2); // D6 (bright & happy)
}

function playIncorrectSound() {
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.2, now);
  gain.connect(audioContext.destination);

  const osc = audioContext.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.3);
}

function triggerConfetti() {
    const colors = ['#ffc107', '#28a745', '#007bff', '#dc3545', '#17a2b8'];
    for (let i = 0; i < 100; i++) {
        const confettiPiece = document.createElement('div');
        confettiPiece.classList.add('confetti');
        confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confettiPiece.style.left = `${Math.random() * 100}%`;
        confettiPiece.style.top = `${-20 + Math.random() * 40}%`;
        confettiPiece.style.transform = `rotate(${Math.random() * 360}deg)`;
        confettiPiece.style.animation = `fall ${1 + Math.random() * 2}s ${Math.random() * 2}s linear forwards`;
        
        confettiContainer.appendChild(confettiPiece);

        setTimeout(() => {
            confettiPiece.remove();
        }, 4000);
    }
}


function displayCipherKey() {
  cipherKeyContainer.innerHTML = '';
  for (const letter in cipherKey) {
    const keyElement = document.createElement('div');
    keyElement.innerHTML = `<strong>${letter}</strong>: ${cipherKey[letter]}`;
    cipherKeyContainer.appendChild(keyElement);
  }
}

function updateUI(newlyGuessedWord: string | null = null) {
  solutionSoFarEl.innerHTML = ''; // Clear previous content

  originalRiddleWords.forEach(word => {
    const span = document.createElement('span');
    const normalizedWord = normalize(word);

    if (solvedWords.has(normalizedWord)) {
      span.textContent = word + ' ';
      span.classList.add('solved');

      if (newlyGuessedWord && normalizedWord === newlyGuessedWord) {
        span.classList.add('sparkle');
        span.onanimationend = () => span.classList.remove('sparkle');
      }
    } else {
      span.textContent = '_'.repeat(normalizedWord.length) + ' ';
    }
    solutionSoFarEl.appendChild(span);
});

  if (currentWordIndex < encryptedRiddleWords.length) {
    currentEncryptedWordEl.innerText = encryptedRiddleWords[currentWordIndex];
  }
}


function checkWinCondition() {
    const allWordsSolved = originalRiddleWords.every(word => {
        const normalized = normalize(word);
        return !normalized || solvedWords.has(normalized);
    });

  if (allWordsSolved) {
    finalRiddleEl.innerText = originalRiddleWords.join(' ');
    puzzlePage.classList.add('hidden');
    solutionPage.classList.remove('hidden');
  }
}

function showFeedbackMessage(message: string, isError: boolean) {
  feedbackMessageEl.textContent = message;
  feedbackMessageEl.className = 'feedback-message'; // Reset classes
  if (isError) {
    feedbackMessageEl.classList.add('incorrect');
  }
  feedbackMessageEl.classList.add('visible');

  setTimeout(() => {
    feedbackMessageEl.classList.remove('visible');
  }, 1500);
}

function startGame(playerName: keyof typeof players) {
  const riddle = riddles[playerName];
  const playerData = players[playerName];
  if (!riddle || riddle === 'TBD') {
    alert("This player's riddle is not available yet!");
    return;
  }

  puzzleAvatarEl.src = playerData.avatar;
  puzzlePlayerNameEl.innerText = playerData.name;
  currentWordIndex = 0;
  solvedWords = new Set<string>();
  originalRiddleWords = riddle.split(' ');
  encryptedRiddleWords = encryptRiddle(riddle).split(' ');
  
  fullEncryptedRiddleEl.innerText = encryptedRiddleWords.join(' ');
  playerGuessInput.value = '';
  displayCipherKey();
  updateUI();
  
  landingPage.classList.add('hidden');
  puzzlePage.classList.remove('hidden');
}

playerLilyCard.addEventListener('click', () => startGame('Lily'));
playerElsieCard.addEventListener('click', () => startGame('Elsie'));

guessForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const playerGuess = playerGuessInput.value.trim();
  if (!playerGuess) return;

  const correctWord = originalRiddleWords[currentWordIndex];
  const normalizedCorrectWord = normalize(correctWord);

  if (normalize(playerGuess) === normalizedCorrectWord) {
    solvedWords.add(normalizedCorrectWord);
    
    playCorrectSound();
    triggerConfetti();
    
    while(currentWordIndex < originalRiddleWords.length && solvedWords.has(normalize(originalRiddleWords[currentWordIndex]))) {
        currentWordIndex++;
    }
    
    playerGuessInput.value = '';
    updateUI(normalizedCorrectWord);
    checkWinCondition();

  } else {
    playIncorrectSound();
    showFeedbackMessage('Nope!', true);
    playerGuessInput.classList.add('shake');
    playerGuessInput.onanimationend = () => playerGuessInput.classList.remove('shake');
  }
});
