// Quiz Engine for SDG Antigravity Web Platform
// Interactive topic-based SDG quizzes with timer, instant feedback, scoring, and badge rewards

class QuizEngine {
  constructor() {
    this.currentQuiz = null;
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.timerInterval = null;
    this.timeRemaining = 0;
    this.isAnswered = false;
  }

  startQuiz(topicId) {
    const quiz = window.SDG_DATA.quizzes.find(q => q.topicId === topicId);
    if (!quiz) {
      console.error("Quiz not found:", topicId);
      return false;
    }

    this.currentQuiz = quiz;
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.timeRemaining = quiz.timeLimitSeconds || 120;
    this.isAnswered = false;

    this.renderQuizArena();
    this.startTimer();
    return true;
  }

  startTimer() {
    clearInterval(this.timerInterval);
    const timerDisplay = document.getElementById("quiz-timer-count");

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (timerDisplay) {
        const mins = Math.floor(this.timeRemaining / 60);
        const secs = this.timeRemaining % 60;
        timerDisplay.textContent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        
        if (this.timeRemaining <= 15) {
          timerDisplay.classList.add("text-danger", "pulse-fast");
        } else {
          timerDisplay.classList.remove("text-danger", "pulse-fast");
        }
      }

      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.finishQuiz(true); // Timed out
      }
    }, 1000);
  }

  renderQuizArena() {
    const container = document.getElementById("student-subpage-container");
    if (!container || !this.currentQuiz) return;

    const currentQ = this.currentQuiz.questions[this.currentQuestionIndex];
    const totalQ = this.currentQuiz.questions.length;
    const progressPct = ((this.currentQuestionIndex + 1) / totalQ) * 100;

    container.innerHTML = `
      <div class="quiz-arena-wrapper animate-fade-in">
        <!-- Quiz Header Bar -->
        <div class="quiz-arena-header card-glass mb-4">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div class="d-flex align-items-center gap-3">
              <button class="btn btn-sm btn-outline-secondary" id="btn-exit-quiz">
                <i class="fa-solid fa-arrow-left me-1"></i> Exit Quiz
              </button>
              <div>
                <h4 class="mb-0 fw-bold d-flex align-items-center gap-2">
                  <span class="badge-sdg-dot" style="background: ${this.currentQuiz.color}"></span>
                  ${this.currentQuiz.title}
                </h4>
                <small class="text-muted">Question ${this.currentQuestionIndex + 1} of ${totalQ}</small>
              </div>
            </div>

            <div class="d-flex align-items-center gap-3">
              <div class="quiz-timer-pill">
                <i class="fa-solid fa-stopwatch me-1 text-primary"></i>
                <span id="quiz-timer-count" class="fw-bold">02:00</span>
              </div>
              <span class="badge bg-primary-soft text-primary px-3 py-2">
                <i class="fa-solid fa-award me-1"></i> Badge: ${this.currentQuiz.badge}
              </span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="quiz-progress-track mt-3">
            <div class="quiz-progress-fill" style="width: ${progressPct}%; background: ${this.currentQuiz.color}"></div>
          </div>
        </div>

        <!-- Question Box -->
        <div class="card-glass question-card mb-4" id="current-question-card">
          <div class="question-badge mb-2">
            <span class="badge rounded-pill bg-light text-dark px-3 py-1 border">
              SDG ${this.currentQuiz.goalId} Knowledge
            </span>
          </div>
          <h3 class="question-text mb-4">${currentQ.question}</h3>

          <!-- Options Grid -->
          <div class="options-grid" id="options-container">
            ${currentQ.options.map((opt, idx) => `
              <button class="option-btn" data-option-index="${idx}">
                <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                <span class="option-content">${opt}</span>
                <i class="fa-solid fa-circle-check option-icon correct-icon d-none text-success"></i>
                <i class="fa-solid fa-circle-xmark option-icon incorrect-icon d-none text-danger"></i>
              </button>
            `).join("")}
          </div>

          <!-- Instant Explanation (Hidden until clicked) -->
          <div class="explanation-box card-glass mt-4 d-none" id="explanation-box">
            <div class="d-flex align-items-start gap-2">
              <i class="fa-solid fa-lightbulb text-warning fs-5 mt-1"></i>
              <div>
                <strong class="d-block text-dark">AI Explanation & SDG Context:</strong>
                <p class="mb-0 text-muted" id="explanation-text">${currentQ.explanation}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Next / Action Controls -->
        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted small">
            <i class="fa-solid fa-shield-halved me-1"></i> Earn +100 SDG Points & the <strong>${this.currentQuiz.badge}</strong> badge
          </span>
          <button class="btn btn-primary px-4 py-2" id="btn-next-question" disabled>
            ${this.currentQuestionIndex === totalQ - 1 ? "Finish Quiz & View Results" : "Next Question"} <i class="fa-solid fa-arrow-right ms-2"></i>
          </button>
        </div>
      </div>
    `;

    // Attach listeners
    document.getElementById("btn-exit-quiz").addEventListener("click", () => {
      if (confirm("Are you sure you want to exit the quiz? Your current progress will not be saved.")) {
        clearInterval(this.timerInterval);
        window.appState.setStudentSubPage("quiz");
      }
    });

    const optionBtns = container.querySelectorAll(".option-btn");
    optionBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        if (this.isAnswered) return;
        const selectedIndex = parseInt(btn.getAttribute("data-option-index"), 10);
        this.handleAnswerSelection(selectedIndex, optionBtns);
      });
    });

    document.getElementById("btn-next-question").addEventListener("click", () => {
      if (this.currentQuestionIndex < totalQ - 1) {
        this.currentQuestionIndex++;
        this.isAnswered = false;
        this.renderQuizArena();
      } else {
        this.finishQuiz(false);
      }
    });
  }

  handleAnswerSelection(selectedIndex, optionBtns) {
    this.isAnswered = true;
    const currentQ = this.currentQuiz.questions[this.currentQuestionIndex];
    const isCorrect = selectedIndex === currentQ.correctIndex;

    this.userAnswers.push({
      questionId: currentQ.id,
      selected: selectedIndex,
      correct: currentQ.correctIndex,
      isCorrect: isCorrect
    });

    // Style the options
    optionBtns.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === currentQ.correctIndex) {
        btn.classList.add("option-correct");
        btn.querySelector(".correct-icon").classList.remove("d-none");
      } else if (idx === selectedIndex && !isCorrect) {
        btn.classList.add("option-incorrect");
        btn.querySelector(".incorrect-icon").classList.remove("d-none");
      }
    });

    // Show Explanation
    const explanationBox = document.getElementById("explanation-box");
    if (explanationBox) {
      explanationBox.classList.remove("d-none");
    }

    // Enable Next button
    const nextBtn = document.getElementById("btn-next-question");
    if (nextBtn) {
      nextBtn.disabled = false;
    }
  }

  finishQuiz(timedOut = false) {
    clearInterval(this.timerInterval);
    const totalQ = this.currentQuiz.questions.length;
    const correctCount = this.userAnswers.filter(a => a.isCorrect).length;
    const percentage = Math.round((correctCount / totalQ) * 100);
    const passed = percentage >= 60;
    const pointsAwarded = passed ? 100 : 25;

    // Credit student if passed
    if (window.appState.state.currentUser && passed) {
      const student = window.appState.state.currentUser;
      student.points = (student.points || 0) + pointsAwarded;
      if (!student.badges.includes(this.currentQuiz.badge)) {
        student.badges.push(this.currentQuiz.badge);
      }
      if (!student.sdgCoverage) student.sdgCoverage = {};
      student.sdgCoverage[this.currentQuiz.goalId] = (student.sdgCoverage[this.currentQuiz.goalId] || 0) + 1;
      window.appState.save();
    }

    this.renderQuizResults(correctCount, totalQ, percentage, passed, pointsAwarded, timedOut);
  }

  renderQuizResults(correctCount, totalQ, percentage, passed, pointsAwarded, timedOut) {
    const container = document.getElementById("student-subpage-container");
    if (!container) return;

    container.innerHTML = `
      <div class="quiz-results-card card-glass text-center animate-fade-in p-5 my-3">
        <div class="result-icon-wrapper mb-3">
          ${passed ? `
            <div class="badge-glow-circle mx-auto">
              <i class="fa-solid fa-trophy text-warning" style="font-size: 3.5rem;"></i>
            </div>
          ` : `
            <div class="badge-glow-circle bg-secondary-soft mx-auto">
              <i class="fa-solid fa-book-open-reader text-primary" style="font-size: 3.5rem;"></i>
            </div>
          `}
        </div>

        <h2 class="fw-bold mb-1">${passed ? "Congratulations! SDG Mastery Achieved!" : "Good Effort! Keep Learning"}</h2>
        <p class="text-muted mb-4">${this.currentQuiz.title}</p>

        ${timedOut ? `<div class="alert alert-warning py-2 mb-3">Time expired before all questions were answered!</div>` : ""}

        <!-- Score Metrics -->
        <div class="row justify-content-center g-3 my-4">
          <div class="col-6 col-md-3">
            <div class="metric-card p-3 rounded-4 bg-light border">
              <small class="text-muted d-block mb-1">Score</small>
              <h3 class="fw-bold mb-0 text-primary">${correctCount} / ${totalQ}</h3>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="metric-card p-3 rounded-4 bg-light border">
              <small class="text-muted d-block mb-1">Accuracy</small>
              <h3 class="fw-bold mb-0 ${passed ? 'text-success' : 'text-danger'}">${percentage}%</h3>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="metric-card p-3 rounded-4 bg-light border">
              <small class="text-muted d-block mb-1">Points Earned</small>
              <h3 class="fw-bold mb-0 text-warning">+${pointsAwarded} pts</h3>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="metric-card p-3 rounded-4 bg-light border">
              <small class="text-muted d-block mb-1">Badge Unlocked</small>
              <h4 class="fw-bold mb-0 text-success text-truncate">${passed ? this.currentQuiz.badge : "Retake to Unlock"}</h4>
            </div>
          </div>
        </div>

        <!-- Next Actions -->
        <div class="d-flex justify-content-center gap-3 flex-wrap mt-4">
          <button class="btn btn-outline-secondary px-4 py-2" id="btn-retake-quiz">
            <i class="fa-solid fa-rotate-left me-1"></i> Retake Quiz
          </button>
          <button class="btn btn-primary px-4 py-2" id="btn-back-to-topics">
            <i class="fa-solid fa-list-check me-1"></i> Explore More Quizzes
          </button>
          <button class="btn btn-success px-4 py-2" id="btn-view-my-progress">
            <i class="fa-solid fa-chart-pie me-1"></i> View Updated Progress
          </button>
        </div>
      </div>
    `;

    document.getElementById("btn-retake-quiz").addEventListener("click", () => {
      this.startQuiz(this.currentQuiz.topicId);
    });

    document.getElementById("btn-back-to-topics").addEventListener("click", () => {
      window.appState.setStudentSubPage("quiz");
    });

    document.getElementById("btn-view-my-progress").addEventListener("click", () => {
      window.appState.setStudentSubPage("progress");
    });
  }
}

window.quizEngine = new QuizEngine();
