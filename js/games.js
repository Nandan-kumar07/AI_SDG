// Games Engine for SDG Antigravity Web Platform
// Mini-games: Eco-Sorter Challenge (SDG 12) and NetZero Campus Grid (SDG 7 & 13)

class GamesEngine {
  constructor() {
    this.activeGame = null;
    this.timer = null;
    this.score = 0;
    this.streak = 0;
    this.timeLeft = 45;

    // Waste items bank for Eco-Sorter
    this.wasteItems = [
      { id: "item1", name: "Banana Peel & Apple Core", type: "organic", icon: "🍌", tip: "Biodegradable organic material ideal for campus compost." },
      { id: "item2", name: "Clean PET Water Bottle", type: "recyclable", icon: "🧴", tip: "Clean plastics are shredded and recycled into new fiber." },
      { id: "item3", name: "Obsolete Lithium-Ion Battery", type: "ewaste", icon: "🔋", tip: "Batteries contain toxic heavy metals and must go to certified e-waste hubs." },
      { id: "item4", name: "Greasy Pizza Cardboard Box", type: "landfill", icon: "🍕", tip: "Food oil contaminates paper recycling fibers, so soiled paper goes to landfill or industrial composting." },
      { id: "item5", name: "Aluminum Soda Can", type: "recyclable", icon: "🥫", tip: "Aluminum can be recycled indefinitely with 95% energy savings!" },
      { id: "item6", name: "Cracked Smartphone Display", type: "ewaste", icon: "📱", tip: "Contains rare earth metals that must be reclaimed in specialized recovery labs." },
      { id: "item7", name: "Fallen Garden Leaves", type: "organic", icon: "🍂", tip: "Nutrient-rich mulch for campus soil regeneration." },
      { id: "item8", name: "Non-recyclable Snack Chip Bag (Multi-layer foil)", type: "landfill", icon: "🍟", tip: "Multi-layered foil plastic cannot be mechanically recycled easily." },
      { id: "item9", name: "Discarded Lab PCB Motherboard", type: "ewaste", icon: "💻", tip: "E-waste containing precious metals like copper and gold." },
      { id: "item10", name: "Cardboard Courier Shipping Box", type: "recyclable", icon: "📦", tip: "Clean cardboard is 100% recyclable into new packaging." }
    ];
  }

  // 1. Eco-Sorter Challenge Game
  startEcoSorter() {
    this.activeGame = "eco-sorter";
    this.score = 0;
    this.streak = 0;
    this.timeLeft = 45;
    this.currentItemIndex = 0;
    this.shuffledItems = [...this.wasteItems].sort(() => 0.5 - Math.random());

    this.renderEcoSorterUI();
    this.runGameTimer();
  }

  runGameTimer() {
    clearInterval(this.timer);
    const timerDisplay = document.getElementById("game-timer-display");

    this.timer = setInterval(() => {
      this.timeLeft--;
      if (timerDisplay) {
        timerDisplay.textContent = `${this.timeLeft}s`;
        if (this.timeLeft <= 10) timerDisplay.classList.add("text-danger", "pulse-fast");
      }

      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.finishEcoSorter();
      }
    }, 1000);
  }

  renderEcoSorterUI() {
    const container = document.getElementById("game-arena-mount");
    if (!container) return;

    const currentItem = this.shuffledItems[this.currentItemIndex];

    container.innerHTML = `
      <div class="eco-sorter-board animate-fade-in card-glass p-4">
        <!-- Game HUD -->
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <button class="btn btn-sm btn-outline-secondary" id="btn-exit-game">
            <i class="fa-solid fa-arrow-left me-1"></i> Back to Games Menu
          </button>
          
          <div class="d-flex align-items-center gap-3">
            <div class="game-hud-stat">
              <small class="text-muted d-block">Time Left</small>
              <strong id="game-timer-display" class="fs-4 text-primary">${this.timeLeft}s</strong>
            </div>
            <div class="game-hud-stat">
              <small class="text-muted d-block">Score</small>
              <strong id="game-score-display" class="fs-4 text-warning">${this.score}</strong>
            </div>
            <div class="game-hud-stat">
              <small class="text-muted d-block">Streak</small>
              <strong id="game-streak-display" class="fs-4 text-success">${this.streak}x 🔥</strong>
            </div>
          </div>
        </div>

        <!-- Current Waste Item Showcase -->
        <div class="waste-conveyor-card text-center my-4 py-4 px-3 rounded-4 bg-light border shadow-sm">
          <div class="waste-emoji-large mb-2" style="font-size: 4.5rem; animation: float 3s ease-in-out infinite;">
            ${currentItem.icon}
          </div>
          <h3 class="fw-bold mb-1">${currentItem.name}</h3>
          <p class="text-muted small mb-0">Select the correct SDG 12 waste category bin below to sort this item!</p>
          <div id="sort-feedback" class="mt-2 fw-bold" style="min-height: 24px;"></div>
        </div>

        <!-- 4 Sorting Bins -->
        <div class="row g-3 mt-2">
          <div class="col-6 col-md-3">
            <button class="bin-btn bin-organic w-100 p-3 rounded-4 text-start border shadow-sm" data-bin-type="organic">
              <div class="d-flex align-items-center gap-2 mb-2">
                <i class="fa-solid fa-leaf text-success fs-3"></i>
                <h5 class="fw-bold mb-0 text-success">Compost</h5>
              </div>
              <small class="text-muted">Food waste, fruit peels, yard clippings</small>
            </button>
          </div>

          <div class="col-6 col-md-3">
            <button class="bin-btn bin-recyclable w-100 p-3 rounded-4 text-start border shadow-sm" data-bin-type="recyclable">
              <div class="d-flex align-items-center gap-2 mb-2">
                <i class="fa-solid fa-recycle text-primary fs-3"></i>
                <h5 class="fw-bold mb-0 text-primary">Recyclable</h5>
              </div>
              <small class="text-muted">Clean plastic, paper, glass, cans</small>
            </button>
          </div>

          <div class="col-6 col-md-3">
            <button class="bin-btn bin-ewaste w-100 p-3 rounded-4 text-start border shadow-sm" data-bin-type="ewaste">
              <div class="d-flex align-items-center gap-2 mb-2">
                <i class="fa-solid fa-plug-circle-bolt text-warning fs-3"></i>
                <h5 class="fw-bold mb-0 text-warning">E-Waste</h5>
              </div>
              <small class="text-muted">Electronics, batteries, cables, PCBs</small>
            </button>
          </div>

          <div class="col-6 col-md-3">
            <button class="bin-btn bin-landfill w-100 p-3 rounded-4 text-start border shadow-sm" data-bin-type="landfill">
              <div class="d-flex align-items-center gap-2 mb-2">
                <i class="fa-solid fa-trash-can text-danger fs-3"></i>
                <h5 class="fw-bold mb-0 text-danger">Landfill</h5>
              </div>
              <small class="text-muted">Greasy boxes, multi-foil wrappers</small>
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-exit-game").addEventListener("click", () => {
      clearInterval(this.timer);
      this.renderGamesHub();
    });

    const binBtns = container.querySelectorAll(".bin-btn");
    binBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const binType = btn.getAttribute("data-bin-type");
        this.handleBinSelection(binType);
      });
    });
  }

  handleBinSelection(selectedBin) {
    const currentItem = this.shuffledItems[this.currentItemIndex];
    const isCorrect = selectedBin === currentItem.type;
    const feedbackDiv = document.getElementById("sort-feedback");

    if (isCorrect) {
      this.streak++;
      const multiplier = Math.min(this.streak, 5);
      const pointsAdded = 20 * multiplier;
      this.score += pointsAdded;
      if (feedbackDiv) {
        feedbackDiv.innerHTML = `<span class="text-success"><i class="fa-solid fa-circle-check me-1"></i> Correct! +${pointsAdded} pts (${multiplier}x streak)</span>`;
      }
    } else {
      this.streak = 0;
      if (feedbackDiv) {
        feedbackDiv.innerHTML = `<span class="text-danger"><i class="fa-solid fa-circle-xmark me-1"></i> Incorrect! Fact: ${currentItem.tip}</span>`;
      }
    }

    // Update HUD
    const scoreDisp = document.getElementById("game-score-display");
    const streakDisp = document.getElementById("game-streak-display");
    if (scoreDisp) scoreDisp.textContent = this.score;
    if (streakDisp) streakDisp.textContent = `${this.streak}x 🔥`;

    // Move to next item or recycle items
    setTimeout(() => {
      this.currentItemIndex = (this.currentItemIndex + 1) % this.shuffledItems.length;
      this.renderEcoSorterUI();
    }, 600);
  }

  finishEcoSorter() {
    const container = document.getElementById("game-arena-mount");
    if (!container) return;

    // Credit student points
    const rewardPoints = Math.round(this.score / 2);
    if (window.appState.state.currentUser && rewardPoints > 0) {
      const student = window.appState.state.currentUser;
      student.points = (student.points || 0) + rewardPoints;
      if (!student.badges.includes("Zero-Waste Sorter")) {
        student.badges.push("Zero-Waste Sorter");
      }
      window.appState.save();
    }

    container.innerHTML = `
      <div class="card-glass text-center p-5 animate-fade-in my-3">
        <div class="badge-glow-circle mx-auto mb-3">
          <i class="fa-solid fa-award text-warning" style="font-size: 3.5rem;"></i>
        </div>
        <h2 class="fw-bold mb-1">Time's Up! Great Segregation Effort!</h2>
        <p class="text-muted mb-4">You contributed to SDG 12 Responsible Consumption & Waste Reduction</p>

        <div class="row justify-content-center g-3 my-4">
          <div class="col-6 col-md-3">
            <div class="p-3 bg-light rounded-4 border">
              <small class="text-muted d-block">Final Score</small>
              <h3 class="fw-bold text-primary mb-0">${this.score}</h3>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="p-3 bg-light rounded-4 border">
              <small class="text-muted d-block">SDG Reward Points</small>
              <h3 class="fw-bold text-warning mb-0">+${rewardPoints} pts</h3>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-center gap-3 mt-4">
          <button class="btn btn-outline-secondary px-4 py-2" id="btn-replay-sorter">
            <i class="fa-solid fa-rotate-left me-1"></i> Play Again
          </button>
          <button class="btn btn-primary px-4 py-2" id="btn-back-hub">
            <i class="fa-solid fa-gamepad me-1"></i> Return to Games Hub
          </button>
        </div>
      </div>
    `;

    document.getElementById("btn-replay-sorter").addEventListener("click", () => this.startEcoSorter());
    document.getElementById("btn-back-hub").addEventListener("click", () => this.renderGamesHub());
  }

  // 2. NetZero Campus Grid Challenge
  startNetZero() {
    this.activeGame = "net-zero";
    this.renderNetZeroUI();
  }

  renderNetZeroUI() {
    const container = document.getElementById("game-arena-mount");
    if (!container) return;

    let budget = 100000;
    let solarPanels = 2; // units
    let smartBatteries = 1;
    let evShuttles = 1;
    let treeParcels = 3;
    let ledRetrofits = 2;

    const calculateMetrics = () => {
      const spent = (solarPanels * 15000) + (smartBatteries * 20000) + (evShuttles * 18000) + (treeParcels * 5000) + (ledRetrofits * 8000);
      const remainingBudget = 100000 - spent;
      
      // Carbon Offset: baseline campus is 500 tCO2/yr
      const offset = (solarPanels * 45) + (smartBatteries * 20) + (evShuttles * 35) + (treeParcels * 18) + (ledRetrofits * 25);
      const netZeroPct = Math.min(100, Math.round((offset / 320) * 100));
      const reliability = Math.min(99, Math.max(60, 70 + (smartBatteries * 12) + (solarPanels * 4) - (evShuttles * 2)));

      return { spent, remainingBudget, offset, netZeroPct, reliability };
    };

    const updateView = () => {
      const m = calculateMetrics();

      container.innerHTML = `
        <div class="card-glass p-4 animate-fade-in">
          <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <button class="btn btn-sm btn-outline-secondary" id="btn-exit-netzero">
              <i class="fa-solid fa-arrow-left me-1"></i> Back to Games Menu
            </button>
            <div class="d-flex align-items-center gap-3">
              <span class="badge bg-success-soft text-success px-3 py-2">
                <i class="fa-solid fa-solar-panel me-1"></i> SDG 7 & SDG 13 Simulator
              </span>
            </div>
          </div>

          <div class="row g-4">
            <!-- Left Controls: Budget Allocation -->
            <div class="col-lg-7">
              <div class="p-3 bg-light rounded-4 border mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="text-muted fw-bold">Available Campus Budget:</span>
                  <span class="fs-4 fw-bold ${m.remainingBudget < 0 ? 'text-danger' : 'text-primary'}">$${m.remainingBudget.toLocaleString()}</span>
                </div>
                <div class="progress" style="height: 10px;">
                  <div class="progress-bar ${m.remainingBudget < 0 ? 'bg-danger' : 'bg-primary'}" style="width: ${Math.min(100, (m.spent / 100000) * 100)}%"></div>
                </div>
              </div>

              <!-- Asset Sliders/Controls -->
              <div class="asset-control-list d-flex flex-column gap-3">
                <div class="asset-item-card p-3 rounded-3 bg-white border d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="fw-bold mb-0">☀️ Rooftop Solar PV Arrays ($15k / unit)</h6>
                    <small class="text-muted">Generates clean electricity (-45 tCO2/yr)</small>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-sm btn-outline-secondary" id="btn-solar-minus">-</button>
                    <span class="fw-bold px-2">${solarPanels}</span>
                    <button class="btn btn-sm btn-outline-primary" id="btn-solar-plus">+</button>
                  </div>
                </div>

                <div class="asset-item-card p-3 rounded-3 bg-white border d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="fw-bold mb-0">🔋 Microgrid Vanadium Battery Banks ($20k / unit)</h6>
                    <small class="text-muted">Stores solar energy & boosts reliability (+12% Rel)</small>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-sm btn-outline-secondary" id="btn-bat-minus">-</button>
                    <span class="fw-bold px-2">${smartBatteries}</span>
                    <button class="btn btn-sm btn-outline-primary" id="btn-bat-plus">+</button>
                  </div>
                </div>

                <div class="asset-item-card p-3 rounded-3 bg-white border d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="fw-bold mb-0">🚌 Zero-Emission EV Campus Shuttle ($18k / unit)</h6>
                    <small class="text-muted">Eliminates diesel commuter emissions (-35 tCO2/yr)</small>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-sm btn-outline-secondary" id="btn-ev-minus">-</button>
                    <span class="fw-bold px-2">${evShuttles}</span>
                    <button class="btn btn-sm btn-outline-primary" id="btn-ev-plus">+</button>
                  </div>
                </div>

                <div class="asset-item-card p-3 rounded-3 bg-white border d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="fw-bold mb-0">🌳 Native Miyawaki Micro-Forest ($5k / parcel)</h6>
                    <small class="text-muted">Natural carbon sink & biodiversity shelter (-18 tCO2/yr)</small>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-sm btn-outline-secondary" id="btn-tree-minus">-</button>
                    <span class="fw-bold px-2">${treeParcels}</span>
                    <button class="btn btn-sm btn-outline-primary" id="btn-tree-plus">+</button>
                  </div>
                </div>

                <div class="asset-item-card p-3 rounded-3 bg-white border d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="fw-bold mb-0">💡 Smart Motion-Sensor LED Retrofits ($8k / block)</h6>
                    <small class="text-muted">Cuts lighting energy usage by 60% (-25 tCO2/yr)</small>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-sm btn-outline-secondary" id="btn-led-minus">-</button>
                    <span class="fw-bold px-2">${ledRetrofits}</span>
                    <button class="btn btn-sm btn-outline-primary" id="btn-led-plus">+</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Impact Dashboard -->
            <div class="col-lg-5">
              <div class="p-4 bg-white rounded-4 border h-100 d-flex flex-column justify-content-between">
                <div>
                  <h5 class="fw-bold mb-3 d-flex align-items-center gap-2">
                    <i class="fa-solid fa-gauge-high text-success"></i> Campus Net-Zero Gauge
                  </h5>

                  <div class="text-center my-4">
                    <div class="netzero-dial-circle mx-auto position-relative" style="width: 140px; height: 140px; border-radius: 50%; background: conic-gradient(var(--brand-teal) ${m.netZeroPct}%, #e2e8f0 0); display: grid; place-items: center;">
                      <div class="bg-white rounded-circle d-flex flex-column justify-content-center align-items-center" style="width: 110px; height: 110px;">
                        <span class="fs-3 fw-bold text-success">${m.netZeroPct}%</span>
                        <small class="text-muted" style="font-size: 0.7rem;">NET ZERO</small>
                      </div>
                    </div>
                  </div>

                  <div class="metric-row d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Total CO2 Avoided:</span>
                    <strong class="text-success">${m.offset} tCO2 / year</strong>
                  </div>

                  <div class="metric-row d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Grid Reliability Index:</span>
                    <strong class="${m.reliability > 85 ? 'text-success' : 'text-warning'}">${m.reliability}%</strong>
                  </div>

                  <div class="metric-row d-flex justify-content-between py-2">
                    <span class="text-muted">Budget Feasibility:</span>
                    <strong class="${m.remainingBudget >= 0 ? 'text-success' : 'text-danger'}">
                      ${m.remainingBudget >= 0 ? 'Within Budget' : 'Over Budget!'}
                    </strong>
                  </div>
                </div>

                <div class="mt-4">
                  ${m.netZeroPct >= 95 && m.remainingBudget >= 0 && m.reliability >= 85 ? `
                    <div class="alert alert-success text-center py-2 mb-3">
                      🎉 <strong>Target Achieved!</strong> You designed a viable Net-Zero Campus!
                    </div>
                    <button class="btn btn-success w-100 py-2 fw-bold" id="btn-claim-netzero-badge">
                      <i class="fa-solid fa-award me-1"></i> Claim NetZero Architect Badge (+150 pts)
                    </button>
                  ` : `
                    <div class="alert alert-light border text-center py-2 mb-0 small text-muted">
                      Aim for 95%+ Net Zero, ≥85% Reliability while staying within the $100k budget.
                    </div>
                  `}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Event Listeners
      document.getElementById("btn-exit-netzero").addEventListener("click", () => this.renderGamesHub());
      
      const setupBtn = (id, changeFn) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener("click", () => { changeFn(); updateView(); });
      };

      setupBtn("btn-solar-plus", () => solarPanels++);
      setupBtn("btn-solar-minus", () => { if (solarPanels > 0) solarPanels--; });

      setupBtn("btn-bat-plus", () => smartBatteries++);
      setupBtn("btn-bat-minus", () => { if (smartBatteries > 0) smartBatteries--; });

      setupBtn("btn-ev-plus", () => evShuttles++);
      setupBtn("btn-ev-minus", () => { if (evShuttles > 0) evShuttles--; });

      setupBtn("btn-tree-plus", () => treeParcels++);
      setupBtn("btn-tree-minus", () => { if (treeParcels > 0) treeParcels--; });

      setupBtn("btn-led-plus", () => ledRetrofits++);
      setupBtn("btn-led-minus", () => { if (ledRetrofits > 0) ledRetrofits--; });

      const claimBtn = document.getElementById("btn-claim-netzero-badge");
      if (claimBtn) {
        claimBtn.addEventListener("click", () => {
          if (window.appState.state.currentUser) {
            const student = window.appState.state.currentUser;
            student.points = (student.points || 0) + 150;
            if (!student.badges.includes("NetZero Architect")) {
              student.badges.push("NetZero Architect");
            }
            window.appState.save();
            alert("🌟 Badge Unlocked: NetZero Architect! +150 Points credited to your profile.");
            this.renderGamesHub();
          }
        });
      }
    };

    updateView();
  }

  // Games Hub Overview Listing
  renderGamesHub() {
    const container = document.getElementById("student-subpage-container");
    if (!container) return;

    container.innerHTML = `
      <div class="games-hub-wrapper animate-fade-in">
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 class="fw-bold mb-1">🎮 SDG Interactive Mini-Games</h3>
            <p class="text-muted mb-0">Learn sustainability through fast-paced simulations, challenge high scores, and earn SDG reward points.</p>
          </div>
        </div>

        <div id="game-arena-mount">
          <div class="row g-4">
            <!-- Game 1: Eco-Sorter -->
            <div class="col-md-6">
              <div class="card-glass game-teaser-card h-100 p-4 d-flex flex-column justify-content-between">
                <div>
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <span class="badge bg-warning-soft text-dark px-3 py-2">
                      <i class="fa-solid fa-arrows-rotate me-1 text-warning"></i> SDG 12: Circular Economy
                    </span>
                    <span class="badge bg-primary-soft text-primary px-2 py-1">Fast Arcade (45s)</span>
                  </div>

                  <div class="text-center my-3">
                    <span style="font-size: 4rem;">♻️</span>
                  </div>

                  <h4 class="fw-bold mb-2">Eco-Sorter Challenge</h4>
                  <p class="text-muted small">
                    Sort incoming campus waste items into Compost, Recyclables, E-Waste, or Landfill before time runs out. Build combos to multiply points!
                  </p>
                </div>

                <div class="mt-3">
                  <button class="btn btn-primary w-100 py-2 fw-bold" id="btn-launch-eco-sorter">
                    <i class="fa-solid fa-play me-2"></i> Play Eco-Sorter Challenge
                  </button>
                </div>
              </div>
            </div>

            <!-- Game 2: NetZero Campus Grid -->
            <div class="col-md-6">
              <div class="card-glass game-teaser-card h-100 p-4 d-flex flex-column justify-content-between">
                <div>
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <span class="badge bg-success-soft text-success px-3 py-2">
                      <i class="fa-solid fa-leaf me-1"></i> SDG 7 & 13: Climate & Energy
                    </span>
                    <span class="badge bg-info-soft text-info px-2 py-1">Strategy Simulator</span>
                  </div>

                  <div class="text-center my-3">
                    <span style="font-size: 4rem;">⚡</span>
                  </div>

                  <h4 class="fw-bold mb-2">NetZero Campus Grid Architect</h4>
                  <p class="text-muted small">
                    Balance a $100k budget across solar arrays, battery storage, native forests, and LED retrofits to drive campus carbon emissions to Zero!
                  </p>
                </div>

                <div class="mt-3">
                  <button class="btn btn-success w-100 py-2 fw-bold" id="btn-launch-netzero">
                    <i class="fa-solid fa-sliders me-2"></i> Launch NetZero Simulator
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-launch-eco-sorter").addEventListener("click", () => this.startEcoSorter());
    document.getElementById("btn-launch-netzero").addEventListener("click", () => this.startNetZero());
  }
}

window.gamesEngine = new GamesEngine();
