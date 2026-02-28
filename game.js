const apiKey = ''; // replace with your API Key
const model = 'gemini-2.5-flash';
const serverURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let lives = 3;

const questionText = document.getElementById('question-text');
const questionCounter = document.getElementById('question-counter');
const currentScoreEl = document.getElementById('current-score');
const choiceButtons = document.querySelectorAll('.choice-btn');
const livesElements = document.querySelectorAll('.life'); 


const jsConfetti = new JSConfetti();


const systemPrompt = `You are an expert Full Stack Developer creating a high-quality quiz.

Your task is to generate EXACTLY 10 unique multiple-choice questions about Full Stack Development (covering both Front-End and Back-End technologies).

Difficulty progression:
- Questions 1–4: Easy level (basic HTML, CSS, JavaScript, Node.js fundamentals, REST APIs)
- Questions 5–8: Intermediate level (React/Vue/Angular, Express, authentication, async/await, databases, middleware)
- Questions 9–10: Hard level (SSR, WebSockets, caching strategies, security best practices, performance optimization, advanced patterns)

IMPORTANT RULES:
- Generate 10 COMPLETELY UNIQUE questions — never repeat the same question or very similar ones.
- Each question must have EXACTLY 4 choices.
- Only ONE choice is clearly and unambiguously correct.
- The correct answer index ("correct") must be RANDOM — it can be 0, 1, 2, or 3 with equal probability. Do NOT favor index 0.
- Shuffle the order of the choices so the correct answer appears in different positions across questions.
- Cover a good mix of Front-End and Back-End topics.
- Questions should be fresh and varied each time this prompt is used (even if called multiple times in the same session).

Output ONLY a valid JSON array in this exact format — nothing else (no explanations, no markdown, no extra text):

[
  {
    "question": "Example question here?",
    "choices": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 2
  }
  // ... exactly 10 objects total
]

Do not add any text before or after the JSON array.`;

async function generateQuestions() {
  const payload = {
    contents: [
      {
      parts: [{ text: systemPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    },
  };

  try {
    const response = await fetch(serverURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    let aiResponse = data.candidates[0].content.parts[0].text.trim();

    aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const jsonMatch = aiResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      aiResponse = jsonMatch[0];
    }

    questions = JSON.parse(aiResponse);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    if (!Array.isArray(questions) || questions.length !== 10) {
      questions = getFallbackQuestions();
    }

    choiceButtons.forEach(btn => {
      btn.style.display = 'block';
    });

    startQuiz();

  } catch (error) {
    alert(error);
    choiceButtons.forEach(btn => {
      btn.style.display = 'block';
    });
    questions = getFallbackQuestions();
    startQuiz();
  }
}

function startQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  lives = 3;
  updateScore();
  updateLives();
  loadQuestion();
}

function loadQuestion() {
  const q = questions[currentQuestionIndex];

  questionText.textContent = q.question;
  questionCounter.textContent = currentQuestionIndex + 1;

  choiceButtons.forEach((btn, index) => {
    btn.textContent = q.choices[index];
    btn.dataset.choice = index;
    btn.classList.remove('correct', 'incorrect', 'disabled');
    btn.disabled = false;
  });
}

function selectAnswer(selectedIndex) {
  const q = questions[currentQuestionIndex];
  const correctIndex = q.correct;

  choiceButtons.forEach(btn => {
    btn.classList.add('disabled');
    btn.disabled = true;
  });

  choiceButtons[correctIndex].classList.add('correct');
  if (selectedIndex !== correctIndex) {
    choiceButtons[selectedIndex].classList.add('incorrect');
    lives--;
    updateLives();

    if (lives <= 0) {
      setTimeout(() => endGame(false), 2000);
      return;
    }
  } else {
    score += 10;
    updateScore();
    triggerConfetti();
  }

  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      loadQuestion();
    } else {
      endGame(true);
    }
  }, 2000);
}

function updateScore() {
  currentScoreEl.textContent = score;
}

function updateLives() {
  livesElements.forEach((heart, i) => {
    heart.style.opacity = i < lives ? '1' : '0.3';
  });
}

function triggerConfetti() {
  jsConfetti.addConfetti({
    emojis: ['🎉', '💯', '⭐', '🚀'],
    confettiNumber: 120,
  });
}

function endGame(won) {
  questionText.textContent = won
    ? `Congratulations! You finished the quiz! Final Score: ${score} 🎉`
    : `Game Over! You lost all lives. Final Score: ${score} 💔`;

  questions = [];

  choiceButtons[2].style.display = 'none'; 
  choiceButtons[3].style.display = 'none';

  const playAgainBtn = choiceButtons[0];
  playAgainBtn.textContent = 'Play Again';
  playAgainBtn.style.display = 'block';
  playAgainBtn.classList.remove('correct', 'incorrect', 'disabled');
  playAgainBtn.disabled = false;

  playAgainBtn.onclick = function() {
    choiceButtons[0].onclick = null;
    choiceButtons[1].onclick = null;

    questions = [];
    currentQuestionIndex = 0;
    score = 0;
    lives = 3;
    updateScore();
    updateLives();

    generateQuestions();
    alert("Reloading questions...");
  };

  const goHomeBtn = choiceButtons[1];
  goHomeBtn.textContent = 'Go back home';
  goHomeBtn.style.display = 'block';
  goHomeBtn.classList.remove('correct', 'incorrect', 'disabled');
  goHomeBtn.disabled = false;

  goHomeBtn.onclick = function() {
    choiceButtons[0].onclick = null;
    choiceButtons[1].onclick = null;
    window.location.href = 'index.html';
  };

}

function getFallbackQuestions() {
  return [
    {
      question: "What does HTML stand for?",
      choices: ["Hyper Text Markup Language", "High Text Markup Language", "Hyper Tab Markup Language", "Home Tool Markup Language"],
      correct: 0
    },
    {
      question: "Which CSS property controls the text size?",
      choices: ["text-style", "font-style", "font-size", "text-size"],
      correct: 2
    },
    {
      question: "How do you add a comment in JavaScript?",
      choices: ["<!-- This is a comment -->", "// This is a comment", "/* This is a comment */", "# This is a comment"],
      correct: 1
    },
    {
      question: "Which HTML tag is used to define an unordered list?",
      choices: ["<ol>", "<li>", "<ul>", "<list>"],
      correct: 2
    },
    {
      question: "In CSS, how do you select an element with id='demo'?",
      choices: [".demo", "#demo", "demo", "*demo"],
      correct: 1
    },
    {
      question: "What is the correct way to link an external JavaScript file?",
      choices: ['<script href="script.js">', '<script src="script.js">', '<link rel="script" src="script.js">', '<js src="script.js">'],
      correct: 1
    },
    {
      question: "Which HTTP method is used to send data to create a new resource?",
      choices: ["GET", "POST", "PUT", "DELETE"],
      correct: 1
    },
    {
      question: "In Node.js, what is Express.js primarily used for?",
      choices: ["Database management", "Building web servers and APIs", "Front-end styling", "Game development"],
      correct: 1
    },
    {
      question: "What does 'DOM' stand for in JavaScript?",
      choices: ["Document Object Model", "Data Object Management", "Display Object Model", "Document Order Model"],
      correct: 0
    },
    {
      question: "Which symbol is used for single-line comments in CSS?",
      choices: ["//", "<!-- -->", "/* */", "#"],
      correct: 2
    }
  ];
}

choiceButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (!button.disabled) {
      const selected = parseInt(button.dataset.choice);
      selectAnswer(selected);
    }
  });
});

window.addEventListener('load', generateQuestions);