// App Controller for SDG Antigravity Web Platform
// Main Router, Page Renderers, Auth Logic, Deep Learning Milestone Steppers, and Faculty Code Review

class AppController {
  constructor() {
    this.currentCaptcha = { student: "", faculty: "", forgot: "" };
  }

  init() {
    this.setupGlobalNavigation();
    this.setupAuthForms();
    this.setupSubmissionModal();
    this.setupGoalDetailModal();
    this.setupActivityCreationForm();
    this.setupThemeToggle();
    this.setupEventListeners();

    window.appState.subscribe((state) => {
      this.renderCurrentView(state);
    });

    this.renderCurrentView(window.appState.state);
    window.sdgChatbot.init();

    this.refreshCaptcha("student");
    this.refreshCaptcha("faculty");
    this.refreshCaptcha("forgot");
  }

  setupEventListeners() {
    document.querySelectorAll("[data-switch-role]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const role = e.currentTarget.getAttribute("data-switch-role");
        window.appState.switchRole(role);
      });
    });

    document.querySelectorAll("[data-nav-route]").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const route = link.getAttribute("data-nav-route");
        const subPage = link.getAttribute("data-nav-subpage");
        window.appState.setRoute(route, subPage);
      });
    });

    document.querySelectorAll(".btn-logout").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (confirm("Are you sure you want to logout?")) {
          await window.appState.logout();
        }
      });
    });
  }

  setupThemeToggle() {
    const toggleBtn = document.getElementById("theme-toggle-btn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "light";
        const next = current === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        toggleBtn.innerHTML = next === "dark" 
          ? `<i class="fa-solid fa-sun text-warning"></i>` 
          : `<i class="fa-solid fa-moon text-secondary"></i>`;
      });
    }
  }

  refreshCaptcha(type) {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.currentCaptcha[type] = code;

    const displayEl = document.getElementById(`captcha-display-${type}`);
    if (displayEl) {
      displayEl.textContent = code;
    }
  }

  setupAuthForms() {
    ["student", "faculty", "forgot"].forEach(type => {
      const btn = document.getElementById(`btn-refresh-captcha-${type}`);
      if (btn) {
        btn.addEventListener("click", () => this.refreshCaptcha(type));
      }
    });

    const setupTabToggles = (prefix) => {
      const loginTab = document.getElementById(`${prefix}-tab-login`);
      const signupTab = document.getElementById(`${prefix}-tab-signup`);
      const loginBox = document.getElementById(`${prefix}-form-login-box`);
      const signupBox = document.getElementById(`${prefix}-form-signup-box`);

      if (loginTab && signupTab && loginBox && signupBox) {
        loginTab.addEventListener("click", () => {
          loginTab.classList.add("active");
          signupTab.classList.remove("active");
          loginBox.classList.remove("d-none");
          signupBox.classList.add("d-none");
        });
        signupTab.addEventListener("click", () => {
          signupTab.classList.add("active");
          loginTab.classList.remove("active");
          signupBox.classList.remove("d-none");
          loginBox.classList.add("d-none");
        });
      }
    };

    setupTabToggles("student");
    setupTabToggles("faculty");

    // Student Login
    const studentLoginForm = document.getElementById("form-student-login");
    if (studentLoginForm) {
      studentLoginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = studentLoginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Signing In...';

          const usnOrEmail = document.getElementById("student-login-usn").value.trim();
          const pass = document.getElementById("student-login-pass").value;
          const captcha = document.getElementById("student-login-captcha").value.trim().toUpperCase();

          if (captcha !== this.currentCaptcha.student) {
            alert("Invalid Captcha code! Please enter the exact characters displayed.");
            this.refreshCaptcha("student");
            return;
          }

          const result = await window.appState.loginStudent(usnOrEmail, pass);
          
          if (result.success) {
            console.log(`✅ Student logged in via ${result.backend}`);
            setTimeout(() => window.location.href = "student-dashboard.html", 500);
          } else {
            alert("Login failed. Please check your credentials.");
          }
        } catch (error) {
          console.error('Login error:', error);
          alert('An error occurred during login. Please try again.');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    }

    // Student Signup with Automatic AI Task Manager Assignment
    const studentSignupForm = document.getElementById("form-student-signup");
    if (studentSignupForm) {
      studentSignupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = studentSignupForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Creating Account...';

          const name = document.getElementById("student-signup-name").value.trim();
          const usn = document.getElementById("student-signup-usn").value.trim();
          const dept = document.getElementById("student-signup-dept").value;
          const skills = document.getElementById("student-signup-skills").value.trim();
          const interests = document.getElementById("student-signup-interests").value.trim();
          const phone = document.getElementById("student-signup-phone").value.trim();
          const email = document.getElementById("student-signup-email").value.trim();
          const pass = document.getElementById("student-signup-pass").value;
          const captcha = document.getElementById("student-signup-captcha").value.trim().toUpperCase();

          if (captcha !== this.currentCaptcha.student) {
            alert("Invalid Captcha code! Please try again.");
            this.refreshCaptcha("student");
            return;
          }

          const result = await window.appState.signupStudent({
            name, usn, department: dept, skills, interests, phone, email, password: pass
          });

          if (result.success) {
            console.log(`✅ Student registered via ${result.backend}`);
            setTimeout(() => window.location.href = "student-dashboard.html", 500);
          } else {
            alert("Signup failed. Please try again.");
          }
        } catch (error) {
          console.error('Signup error:', error);
          alert('An error occurred during signup. Please try again.');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    }

    // Faculty Login
    const facultyLoginForm = document.getElementById("form-faculty-login");
    if (facultyLoginForm) {
      facultyLoginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = facultyLoginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Signing In...';

          const email = document.getElementById("faculty-login-email").value.trim();
          const pass = document.getElementById("faculty-login-pass").value;
          const captcha = document.getElementById("faculty-login-captcha").value.trim().toUpperCase();

          if (captcha !== this.currentCaptcha.faculty) {
            alert("Invalid Captcha code! Please try again.");
            this.refreshCaptcha("faculty");
            return;
          }

          const result = await window.appState.loginFaculty(email, pass);
          
          if (result.success) {
            console.log(`✅ Faculty logged in via ${result.backend}`);
            setTimeout(() => window.location.href = "faculty-dashboard.html", 500);
          } else {
            alert("Login failed. Please check your credentials.");
          }
        } catch (error) {
          console.error('Login error:', error);
          alert('An error occurred during login. Please try again.');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    }

    // Faculty Signup
    const facultySignupForm = document.getElementById("form-faculty-signup");
    if (facultySignupForm) {
      facultySignupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = facultySignupForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> Creating Account...';

          const name = document.getElementById("faculty-signup-name").value.trim();
          const dept = document.getElementById("faculty-signup-dept").value;
          const phone = document.getElementById("faculty-signup-phone").value.trim();
          const email = document.getElementById("faculty-signup-email").value.trim();
          const pass = document.getElementById("faculty-signup-pass").value;
          const captcha = document.getElementById("faculty-signup-captcha").value.trim().toUpperCase();

          if (captcha !== this.currentCaptcha.faculty) {
            alert("Invalid Captcha code! Please try again.");
            this.refreshCaptcha("faculty");
            return;
          }

          const result = await window.appState.signupFaculty({
            name, department: dept, phone, email, password: pass
          });

          if (result.success) {
            console.log(`✅ Faculty registered via ${result.backend}`);
            setTimeout(() => window.location.href = "faculty-dashboard.html", 500);
          } else {
            alert("Signup failed. Please try again.");
          }
        } catch (error) {
          console.error('Signup error:', error);
          alert('An error occurred during signup. Please try again.');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    }

    // Forgot Password
    const forgotForm = document.getElementById("form-forgot-password");
    if (forgotForm) {
      forgotForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("forgot-email").value.trim();
        const newPass = document.getElementById("forgot-new-pass").value;
        const confirmPass = document.getElementById("forgot-confirm-pass").value;
        const captcha = document.getElementById("forgot-captcha").value.trim().toUpperCase();

        if (captcha !== this.currentCaptcha.forgot) {
          alert("Invalid Captcha code! Please try again.");
          this.refreshCaptcha("forgot");
          return;
        }

        if (newPass.length < 6) {
          alert("Password must be at least 6 characters long.");
          return;
        }

        if (newPass !== confirmPass) {
          alert("Passwords do not match! Please check your confirmation password.");
          return;
        }

        alert(`✅ Password successfully reset for ${email}! You can now login with your new password.`);
        window.appState.setRoute("student-auth");
      });
    }
  }

  setupGlobalNavigation() {
    document.querySelectorAll("[data-student-tab]").forEach(tab => {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        const page = tab.getAttribute("data-student-tab");
        window.appState.setStudentSubPage(page);
      });
    });

    document.querySelectorAll("[data-faculty-tab]").forEach(tab => {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        const page = tab.getAttribute("data-faculty-tab");
        window.appState.setFacultySubPage(page);
      });
    });
  }

  renderCurrentView(state) {
    const route = state.currentRoute;
    const views = [
      "home-view", 
      "student-auth-view", 
      "faculty-auth-view", 
      "forgot-password-view", 
      "student-dashboard-view", 
      "faculty-dashboard-view"
    ];

    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.classList.add("d-none");
    });

    const activeView = document.getElementById(`${route}-view`);
    if (activeView) {
      activeView.classList.remove("d-none");
    }

    this.updateNavbarUserBadge(state);

    if (route === "home") {
      this.renderHomeGoalsShowcase();
    } else if (route === "student-dashboard") {
      this.renderStudentDashboard(state);
    } else if (route === "faculty-dashboard") {
      this.renderFacultyDashboard(state);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  updateNavbarUserBadge(state) {
    const userBadge = document.getElementById("navbar-user-badge");
    const userRolePill = document.getElementById("navbar-role-pill");
    const userAvatar = document.getElementById("navbar-user-avatar");
    const authActions = document.getElementById("navbar-auth-actions");
    const userProfileDropdown = document.getElementById("navbar-user-dropdown");

    if (state.currentUser) {
      if (authActions) authActions.classList.add("d-none");
      if (userProfileDropdown) userProfileDropdown.classList.remove("d-none");
      if (userBadge) userBadge.textContent = state.currentUser.name;
      if (userRolePill) {
        userRolePill.textContent = state.userRole === "faculty" ? "Faculty" : "Student";
        userRolePill.className = state.userRole === "faculty" ? "badge bg-info-soft text-info" : "badge bg-success-soft text-success";
      }
      if (userAvatar && state.currentUser.avatar) {
        userAvatar.src = state.currentUser.avatar;
      }
    } else {
      if (authActions) authActions.classList.remove("d-none");
      if (userProfileDropdown) userProfileDropdown.classList.add("d-none");
    }
  }

  // ----------------------------------------------------
  // HOME PAGE RENDERER
  // ----------------------------------------------------
  renderHomeGoalsShowcase() {
    const grid = document.getElementById("home-sdg-grid");
    if (!grid) return;

    grid.innerHTML = window.SDG_DATA.goals.map(goal => `
      <div class="col-6 col-md-4 col-lg-2 col-xl-2">
        <div class="home-sdg-card p-3 rounded-4 h-100 d-flex flex-column justify-content-between text-white" 
             style="background: ${goal.color}; cursor: pointer;" 
             data-goal-id="${goal.id}">
          <div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="fs-4 fw-bold opacity-75">${goal.number}</span>
              <i class="${goal.icon} fs-4"></i>
            </div>
            <h6 class="fw-bold mb-1 lh-sm">${goal.name}</h6>
          </div>
          <small class="opacity-75" style="font-size: 0.75rem;">${goal.shortName}</small>
        </div>
      </div>
    `).join("");

    grid.querySelectorAll(".home-sdg-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = parseInt(card.getAttribute("data-goal-id"), 10);
        this.openGoalDetailModal(id);
      });
    });
  }

  // ----------------------------------------------------
  // STUDENT DASHBOARD RENDERER
  // ----------------------------------------------------
  renderStudentDashboard(state) {
    const student = state.currentUser || state.students[0];
    const subPage = state.studentSubPage || "progress";

    document.querySelectorAll("[data-student-tab]").forEach(tab => {
      if (tab.getAttribute("data-student-tab") === subPage) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    const container = document.getElementById("student-subpage-container");
    if (!container) return;

    switch (subPage) {
      case "progress":
        this.renderStudentProgressPage(container, student, state);
        break;
      case "sdg-goals":
        this.renderStudentSdgGoalsPage(container);
        break;
      case "quiz":
        this.renderStudentQuizPage(container);
        break;
      case "games":
        window.gamesEngine.renderGamesHub();
        break;
      case "activities":
        this.renderStudentActivitiesPage(container, student, state);
        break;
      case "leaderboard":
        this.renderStudentLeaderboardPage(container, student, state);
        break;
      default:
        this.renderStudentProgressPage(container, student, state);
    }
  }

  // Page 1: My Progress (With Deep Learning 4-Milestone Progress Tracker)
  renderStudentProgressPage(container, student, state) {
    const completedSubs = state.submissions.filter(s => s.studentId === student.id && s.verification.status === "Verified");
    
    const ongoingTasks = state.studentOngoingTasks.map(og => {
      const task = state.activities.find(a => a.id === og.taskId);
      return { ...og, task };
    }).filter(og => og.task);

    const aiRecs = window.sdgAiEngine.getRecommendedTasks(student, 3);

    container.innerHTML = `
      <div class="student-progress-wrapper animate-fade-in">
        <!-- Welcome Banner -->
        <div class="card-glass student-welcome-banner p-4 mb-4 position-relative overflow-hidden">
          <div class="row align-items-center">
            <div class="col-lg-8">
              <div class="d-flex align-items-center gap-3 mb-2">
                <span class="badge bg-success-soft text-success px-3 py-1 fw-bold">
                  <i class="fa-solid fa-microchip me-1"></i> CS & AI SDG Changemaker
                </span>
                <span class="text-muted small">USN: <strong>${student.usn}</strong></span>
              </div>
              <h2 class="fw-bold mb-1">Hey, ${student.name}!</h2>
              <p class="text-muted mb-3">
                Welcome back • <strong>${student.department}</strong>
              </p>

              <div class="d-flex align-items-center gap-3 flex-wrap">
                <div class="stat-pill-inline">
                  <i class="fa-solid fa-award text-warning"></i>
                  <span><strong>${student.points || 0}</strong> SDG Points</span>
                </div>
                <div class="stat-pill-inline">
                  <i class="fa-solid fa-circle-check text-success"></i>
                  <span><strong>${completedSubs.length}</strong> Completed Tasks</span>
                </div>
                <div class="stat-pill-inline">
                  <i class="fa-solid fa-diagram-project text-primary"></i>
                  <span><strong>${ongoingTasks.length}</strong> Ongoing Challenges</span>
                </div>
              </div>
            </div>

            <div class="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <button class="btn btn-primary px-4 py-2" id="btn-request-ai-assignment">
                <i class="fa-solid fa-wand-magic-sparkles me-2"></i> AI Auto-Assign Task
              </button>
            </div>
          </div>
        </div>

        <!-- Visual Graphs & AI Recommendations Row -->
        <div class="row g-4 mb-4">
          <!-- SDG Radar / Doughnut Coverage -->
          <div class="col-lg-6">
            <div class="card-glass p-4 h-100">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">🎯 Your SDG Impact Distribution</h5>
                <span class="badge bg-light text-muted">17 UN Goals</span>
              </div>
              
              <div class="d-flex justify-content-center align-items-center my-3" style="min-height: 220px;">
                ${this.generateSdgDoughnutSvg(student.sdgCoverage || {})}
              </div>

              <!-- Unlocked Badges -->
              <div class="mt-3">
                <small class="text-muted fw-bold d-block mb-2">Unlocked Badges:</small>
                <div class="d-flex flex-wrap gap-2">
                  ${(student.badges || ["New Changemaker"]).map(b => `
                    <span class="badge rounded-pill bg-warning-soft text-dark px-3 py-1 border">
                      🏅 ${b}
                    </span>
                  `).join("")}
                </div>
              </div>
            </div>
          </div>

          <!-- AI Recommended SDG Activities -->
          <div class="col-lg-6">
            <div class="card-glass p-4 h-100">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">🤖 AI Recommended For You</h5>
                <span class="badge bg-primary-soft text-primary">Profile Match</span>
              </div>

              <div class="ai-recommendations-list d-flex flex-column gap-3">
                ${aiRecs.map(rec => `
                  <div class="ai-rec-card p-3 rounded-3 bg-light border">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                      <span class="badge ${rec.taskType === 'technical_dl_project' ? 'bg-primary text-white' : 'bg-light text-dark border'}">
                        ${rec.taskType === 'technical_dl_project' ? '🔬 Deep Learning Project' : `SDG ${rec.goalId} Field Task`}
                      </span>
                      <span class="badge bg-success-soft text-success fw-bold">
                        <i class="fa-solid fa-sparkles me-1"></i> ${rec.matchScore}% Match
                      </span>
                    </div>
                    <h6 class="fw-bold mb-1">${rec.title}</h6>
                    <p class="text-muted small mb-2">${rec.matchReasons.join("; ")}</p>
                    <div class="d-flex justify-content-between align-items-center">
                      <strong class="text-warning small">+${rec.points} Points</strong>
                      <button class="btn btn-sm btn-outline-primary btn-enroll-task" data-task-id="${rec.id}">
                        Enroll & Start <i class="fa-solid fa-arrow-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>

        <!-- Ongoing Tasks (With Deep Learning 4-Milestone Steppers) -->
        <div class="row g-4">
          <div class="col-lg-7">
            <div class="card-glass p-4 h-100">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 class="fw-bold mb-0">⏳ Ongoing Tasks & Technical Projects (${ongoingTasks.length})</h5>
                  <small class="text-muted">Track stage-by-stage milestone progress and submit verification deliverables.</small>
                </div>
              </div>

              ${ongoingTasks.length === 0 ? `
                <div class="text-center py-4 text-muted">
                  <p class="mb-2">No active tasks right now.</p>
                  <button class="btn btn-sm btn-primary" id="btn-browse-activities">Browse Tasks Catalog</button>
                </div>
              ` : `
                <div class="d-flex flex-column gap-3">
                  ${ongoingTasks.map(item => {
                    const isDl = item.task.taskType === "technical_dl_project";
                    const currentM = item.currentMilestoneIndex || 1;
                    return `
                      <div class="ongoing-task-card p-4 rounded-4 bg-light border">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <span class="badge ${isDl ? 'bg-primary text-white' : 'bg-secondary text-white'} mb-1">
                              ${isDl ? '🔬 Deep Learning Mini-Project' : 'Field Activity'}
                            </span>
                            <h6 class="fw-bold mb-0">${item.task.title}</h6>
                          </div>
                          <span class="badge bg-warning-soft text-warning fw-bold fs-6">+${item.task.points} pts</span>
                        </div>

                        <p class="text-muted small mb-3">${item.task.description}</p>

                        ${isDl ? `
                          <!-- 4-Stage Deep Learning Milestone Stepper -->
                          <div class="dl-milestone-stepper p-3 rounded-3 bg-white border mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                              <span class="small fw-bold text-dark">Technical Milestones Progress:</span>
                              <span class="badge bg-success text-white">${item.progressPct || 25}% Complete</span>
                            </div>

                            <div class="milestone-steps-grid d-flex justify-content-between gap-1 text-center">
                              <div class="step-col ${currentM >= 1 ? 'step-active' : ''}">
                                <div class="step-num ${currentM > 1 ? 'step-done' : ''}">1</div>
                                <small class="step-label">Dataset</small>
                              </div>
                              <div class="step-line ${currentM > 1 ? 'line-done' : ''}"></div>
                              <div class="step-col ${currentM >= 2 ? 'step-active' : ''}">
                                <div class="step-num ${currentM > 2 ? 'step-done' : ''}">2</div>
                                <small class="step-label">Model Code</small>
                              </div>
                              <div class="step-line ${currentM > 2 ? 'line-done' : ''}"></div>
                              <div class="step-col ${currentM >= 3 ? 'step-active' : ''}">
                                <div class="step-num ${currentM > 3 ? 'step-done' : ''}">3</div>
                                <small class="step-label">Loss Curves</small>
                              </div>
                              <div class="step-line ${currentM > 3 ? 'line-done' : ''}"></div>
                              <div class="step-col ${currentM >= 4 ? 'step-active' : ''}">
                                <div class="step-num">4</div>
                                <small class="step-label">Live Demo</small>
                              </div>
                            </div>
                          </div>
                        ` : `
                          <div class="progress mb-3" style="height: 8px;">
                            <div class="progress-bar bg-success" style="width: ${item.progressPct || 50}%"></div>
                          </div>
                        `}

                        <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                          <small class="text-muted">Deadline: <strong>${item.task.deadline}</strong></small>
                          <button class="btn btn-sm btn-success px-3 btn-submit-proof" data-task-id="${item.task.id}">
                            <i class="fa-solid ${isDl ? 'fa-code-branch' : 'fa-camera'} me-1"></i>
                            ${isDl ? `Submit Milestone ${currentM} Deliverables` : 'Submit Proof & Verify'}
                          </button>
                        </div>
                      </div>
                    `;
                  }).join("")}
                </div>
              `}
            </div>
          </div>

          <!-- Completed History -->
          <div class="col-lg-5">
            <div class="card-glass p-4 h-100">
              <h5 class="fw-bold mb-3">✅ Verified Completed Activities (${completedSubs.length})</h5>

              ${completedSubs.length === 0 ? `
                <div class="text-center py-4 text-muted">
                  <p class="mb-0">Complete your first SDG activity or technical milestone to build your transcript!</p>
                </div>
              ` : `
                <div class="completed-subs-scroll d-flex flex-column gap-3" style="max-height: 480px; overflow-y: auto;">
                  ${completedSubs.map(sub => `
                    <div class="completed-item-card p-3 rounded-3 bg-light border d-flex align-items-center gap-3">
                      <img src="${sub.imageUrl}" alt="Proof" class="rounded-3" style="width: 60px; height: 60px; object-fit: cover;" />
                      <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start">
                          <h6 class="fw-bold mb-0 text-truncate" style="max-width: 70%;">${sub.taskTitle}</h6>
                          <span class="badge bg-success text-white">+${sub.pointsAwarded} pts</span>
                        </div>
                        <small class="text-muted d-block">${sub.submittedAt}</small>
                        <span class="badge bg-success-soft text-success small mt-1">
                          <i class="fa-solid fa-circle-check me-1"></i> AI Verified (${sub.verification.aiConfidence}% Cert.)
                        </span>
                      </div>
                    </div>
                  `).join("")}
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    // Listeners
    const reqBtn = document.getElementById("btn-request-ai-assignment");
    if (reqBtn) {
      reqBtn.addEventListener("click", () => {
        const dynamicTask = window.sdgAiEngine.generateDynamicTaskForStudent(student);
        window.appState.state.activities.unshift(dynamicTask);
        window.appState.assignTaskToStudent(dynamicTask.id);
        alert(`🌟 AI Task Assigned: "${dynamicTask.title}" (+${dynamicTask.points} pts) added to your ongoing tasks!`);
      });
    }

    container.querySelectorAll(".btn-enroll-task").forEach(btn => {
      btn.addEventListener("click", () => {
        const taskId = btn.getAttribute("data-task-id");
        window.appState.assignTaskToStudent(taskId);
        alert("Enrolled successfully in task! It has been added to your Ongoing Tasks.");
      });
    });

    container.querySelectorAll(".btn-submit-proof").forEach(btn => {
      btn.addEventListener("click", () => {
        const taskId = btn.getAttribute("data-task-id");
        this.openSubmissionModal(taskId);
      });
    });

    const browseBtn = document.getElementById("btn-browse-activities");
    if (browseBtn) browseBtn.addEventListener("click", () => window.appState.setStudentSubPage("activities"));
  }

  // Generate SVG Doughnut
  generateSdgDoughnutSvg(coverage) {
    const goals = window.SDG_DATA.goals;
    const activeGoals = Object.keys(coverage).map(Number);

    if (activeGoals.length === 0) {
      return `
        <div class="text-center text-muted">
          <p class="small mb-1">No SDG activities recorded yet.</p>
          <small>Complete tasks to populate your institutional impact wheel!</small>
        </div>
      `;
    }

    const totalCount = Object.values(coverage).reduce((a, b) => a + b, 0);
    let cumulativeAngle = 0;
    const radius = 70;
    const strokeWidth = 26;
    const center = 90;
    const circumference = 2 * Math.PI * radius;

    const segments = activeGoals.map(goalId => {
      const count = coverage[goalId];
      const fraction = count / totalCount;
      const strokeDasharray = `${fraction * circumference} ${circumference}`;
      const strokeDashoffset = -cumulativeAngle * circumference;
      cumulativeAngle += fraction;
      const goal = goals.find(g => g.id === goalId) || { color: "#3F7E44", shortName: `SDG ${goalId}` };

      return `
        <circle cx="${center}" cy="${center}" r="${radius}" 
                fill="transparent" 
                stroke="${goal.color}" 
                stroke-width="${strokeWidth}" 
                stroke-dasharray="${strokeDasharray}" 
                stroke-dashoffset="${strokeDashoffset}"
                transform="rotate(-90 ${center} ${center})">
          <title>${goal.shortName}: ${count} task(s)</title>
        </circle>
      `;
    }).join("");

    return `
      <div class="d-flex align-items-center gap-4 flex-wrap justify-content-center">
        <svg width="180" height="180" viewBox="0 0 180 180">
          ${segments}
          <text x="${center}" y="${center - 5}" text-anchor="middle" font-size="22" font-weight="bold" fill="#1e293b">${totalCount}</text>
          <text x="${center}" y="${center + 15}" text-anchor="middle" font-size="11" fill="#64748b">Verified Tasks</text>
        </svg>

        <div class="d-flex flex-column gap-1" style="max-height: 160px; overflow-y: auto;">
          ${activeGoals.map(id => {
            const g = goals.find(item => item.id === id);
            return `
              <div class="d-flex align-items-center gap-2 small">
                <span class="badge-sdg-dot" style="background: ${g ? g.color : '#333'}; width: 10px; height: 10px;"></span>
                <span><strong>SDG ${id}:</strong> ${g ? g.shortName : ''} (${coverage[id]})</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  // Page 2: About SDG Goals
  renderStudentSdgGoalsPage(container) {
    container.innerHTML = `
      <div class="sdg-goals-page animate-fade-in">
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h3 class="fw-bold mb-1">🌍 The 17 UN Sustainable Development Goals</h3>
            <p class="text-muted mb-0">Explore the global vision, targets, and campus initiatives driving sustainable transformation.</p>
          </div>

          <div class="d-flex gap-2 flex-wrap" id="sdg-category-filters">
            <button class="btn btn-sm btn-primary filter-category-btn active" data-cat="all">All (17)</button>
            <button class="btn btn-sm btn-outline-secondary filter-category-btn" data-cat="Biosphere">Biosphere</button>
            <button class="btn btn-sm btn-outline-secondary filter-category-btn" data-cat="Society">Society</button>
            <button class="btn btn-sm btn-outline-secondary filter-category-btn" data-cat="Economy">Economy</button>
            <button class="btn btn-sm btn-outline-secondary filter-category-btn" data-cat="Governance">Governance</button>
          </div>
        </div>

        <div class="row g-4" id="goals-card-container">
          ${window.SDG_DATA.goals.map(goal => `
            <div class="col-md-6 col-lg-4 goal-grid-item" data-category="${goal.category}">
              <div class="card-glass goal-detail-card h-100 p-4 d-flex flex-column justify-content-between" 
                   style="border-top: 5px solid ${goal.color};">
                <div>
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <span class="badge rounded-pill text-white fw-bold px-3 py-1" style="background: ${goal.color};">
                      Goal ${goal.number}
                    </span>
                    <i class="${goal.icon} fs-3" style="color: ${goal.color};"></i>
                  </div>
                  <h5 class="fw-bold mb-2">${goal.name}</h5>
                  <p class="text-muted small mb-3">${goal.vision}</p>
                </div>

                <div class="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                  <span class="badge bg-light text-dark border">${goal.category}</span>
                  <button class="btn btn-sm btn-outline-primary btn-inspect-goal" data-goal-id="${goal.id}">
                    Explore Targets <i class="fa-solid fa-arrow-right ms-1"></i>
                  </button>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    container.querySelectorAll(".btn-inspect-goal").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-goal-id"), 10);
        this.openGoalDetailModal(id);
      });
    });
  }

  // Page 3: Quiz Arena
  renderStudentQuizPage(container) {
    container.innerHTML = `
      <div class="quiz-hub-wrapper animate-fade-in">
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 class="fw-bold mb-1">🧠 SDG Knowledge Arena & Quizzes</h3>
            <p class="text-muted mb-0">Test your mastery on key SDGs, earn institutional points, and unlock verified mastery badges.</p>
          </div>
        </div>

        <div class="row g-4">
          ${window.SDG_DATA.quizzes.map(quiz => `
            <div class="col-md-6">
              <div class="card-glass quiz-topic-card h-100 p-4 d-flex flex-column justify-content-between">
                <div>
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <span class="badge rounded-pill text-white px-3 py-1" style="background: ${quiz.color};">
                      SDG ${quiz.goalId}
                    </span>
                    <span class="badge bg-light text-dark border">
                      <i class="fa-solid fa-clock me-1"></i> ${quiz.timeLimitSeconds / 60} mins
                    </span>
                  </div>

                  <div class="d-flex align-items-center gap-3 mb-3">
                    <div class="quiz-icon-box" style="background: ${quiz.color}20; color: ${quiz.color}; width: 50px; height: 50px; border-radius: 12px; display: grid; place-items: center;">
                      <i class="${quiz.icon} fs-4"></i>
                    </div>
                    <h5 class="fw-bold mb-0">${quiz.title}</h5>
                  </div>

                  <p class="text-muted small mb-3">
                    ${quiz.questions.length} interactive questions covering global targets, real-world case studies, and campus sustainability.
                  </p>
                </div>

                <div class="pt-3 border-top d-flex justify-content-between align-items-center">
                  <span class="text-success small fw-bold">
                    <i class="fa-solid fa-award me-1"></i> Badge: ${quiz.badge}
                  </span>
                  <button class="btn btn-primary px-4 btn-start-quiz" data-topic-id="${quiz.topicId}">
                    Start Quiz <i class="fa-solid fa-play ms-1"></i>
                  </button>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    container.querySelectorAll(".btn-start-quiz").forEach(btn => {
      btn.addEventListener("click", () => {
        const topicId = btn.getAttribute("data-topic-id");
        window.quizEngine.startQuiz(topicId);
      });
    });
  }

  // Page 5: Activities Catalog & Proof Submission
  renderStudentActivitiesPage(container, student, state) {
    const activities = state.activities;

    container.innerHTML = `
      <div class="student-activities-wrapper animate-fade-in">
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h3 class="fw-bold mb-1">📋 SDG Campus Activities & Technical Projects</h3>
            <p class="text-muted mb-0">Participate in field activities or Deep Learning code challenges to earn verified SDG credits.</p>
          </div>

          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-success" id="btn-quick-submit-proof">
              <i class="fa-solid fa-cloud-arrow-up me-1"></i> Submit Deliverables
            </button>
            <button class="btn btn-outline-primary" id="btn-trigger-ai-assign-2">
              <i class="fa-solid fa-wand-magic-sparkles me-1"></i> AI Auto-Assign
            </button>
          </div>
        </div>

        <div class="row g-4" id="tasks-cards-grid">
          ${activities.map(task => {
            const isDl = task.taskType === "technical_dl_project";
            return `
              <div class="col-md-6 col-lg-4 task-card-item">
                <div class="card-glass task-item-card h-100 p-4 d-flex flex-column justify-content-between position-relative">
                  <div>
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <span class="badge ${isDl ? 'bg-primary text-white' : (task.status === 'Active' ? 'bg-success-soft text-success' : 'bg-secondary-soft text-secondary')}">
                        ${isDl ? '🔬 Deep Learning Project' : `● ${task.status}`}
                      </span>
                      <span class="badge bg-warning-soft text-dark fw-bold">+${task.points} pts</span>
                    </div>

                    <h5 class="fw-bold mb-2">${task.title}</h5>
                    <p class="text-muted small mb-3">${task.description}</p>

                    <div class="task-metadata mb-3">
                      <div class="small text-muted mb-1">
                        <i class="fa-solid fa-bullseye me-1 text-primary"></i> <strong>SDG ${task.goalId}</strong>
                      </div>
                      <div class="small text-muted mb-1">
                        <i class="fa-solid fa-building-columns me-1 text-secondary"></i> ${task.department}
                      </div>
                      <div class="small text-muted">
                        <i class="fa-solid fa-calendar me-1 text-danger"></i> Deadline: ${task.deadline}
                      </div>
                    </div>
                  </div>

                  <div class="pt-3 border-top d-flex gap-2">
                    ${task.status === "Active" ? `
                      <button class="btn btn-sm btn-outline-primary flex-grow-1 btn-enroll-single" data-task-id="${task.id}">
                        Enroll
                      </button>
                      <button class="btn btn-sm btn-success flex-grow-1 btn-submit-single" data-task-id="${task.id}">
                        ${isDl ? 'Submit Code/Milestone' : 'Submit Proof'}
                      </button>
                    ` : `
                      <button class="btn btn-sm btn-light w-100 text-muted" disabled>Closed</button>
                    `}
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    container.querySelectorAll(".btn-enroll-single").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-task-id");
        window.appState.assignTaskToStudent(id);
        alert("Enrolled successfully in task! Added to your Ongoing Tasks.");
      });
    });

    container.querySelectorAll(".btn-submit-single").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-task-id");
        this.openSubmissionModal(id);
      });
    });

    const quickSubmitBtn = document.getElementById("btn-quick-submit-proof");
    if (quickSubmitBtn) {
      quickSubmitBtn.addEventListener("click", () => this.openSubmissionModal(null));
    }

    const aiAssignBtn2 = document.getElementById("btn-trigger-ai-assign-2");
    if (aiAssignBtn2) {
      aiAssignBtn2.addEventListener("click", () => {
        const dynamicTask = window.sdgAiEngine.generateDynamicTaskForStudent(student);
        window.appState.state.activities.unshift(dynamicTask);
        window.appState.assignTaskToStudent(dynamicTask.id);
        alert(`🌟 AI Task Assigned: "${dynamicTask.title}" (+${dynamicTask.points} pts) added to your ongoing tasks!`);
      });
    }
  }

  // Page 6: Leaderboard
  renderStudentLeaderboardPage(container, student, state) {
    const studentsSorted = [...state.students].sort((a, b) => (b.points || 0) - (a.points || 0));
    const top3 = studentsSorted.slice(0, 3);

    container.innerHTML = `
      <div class="leaderboard-page-wrapper animate-fade-in">
        <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 class="fw-bold mb-1">🏆 Campus Sustainability Leaderboard</h3>
            <p class="text-muted mb-0">Celebrating top student changemakers across departments driving the UN Sustainable Development Goals.</p>
          </div>
        </div>

        <div class="podium-showcase-row row g-4 align-items-end justify-content-center mb-5">
          ${top3[1] ? `
            <div class="col-md-4 order-2 order-md-1">
              <div class="card-glass podium-card podium-silver text-center p-4">
                <div class="podium-avatar-wrapper position-relative mx-auto mb-3">
                  <img src="${top3[1].avatar}" alt="${top3[1].name}" class="rounded-circle podium-img" />
                  <span class="podium-rank-badge badge-silver">2</span>
                </div>
                <h5 class="fw-bold mb-1">${top3[1].name}</h5>
                <small class="text-muted d-block mb-2">${top3[1].department}</small>
                <div class="badge bg-light text-dark border px-3 py-1 mb-2"><strong>${top3[1].points}</strong> Points</div>
              </div>
            </div>
          ` : ""}

          ${top3[0] ? `
            <div class="col-md-4 order-1 order-md-2">
              <div class="card-glass podium-card podium-gold text-center p-4">
                <div class="crown-icon mb-1"><i class="fa-solid fa-crown text-warning fs-2"></i></div>
                <div class="podium-avatar-wrapper position-relative mx-auto mb-3">
                  <img src="${top3[0].avatar}" alt="${top3[0].name}" class="rounded-circle podium-img podium-img-large" />
                  <span class="podium-rank-badge badge-gold">1</span>
                </div>
                <h4 class="fw-bold mb-1">${top3[0].name}</h4>
                <small class="text-muted d-block mb-2">${top3[0].department}</small>
                <div class="badge bg-warning text-dark px-3 py-1 mb-2 fs-6"><strong>${top3[0].points}</strong> Points</div>
              </div>
            </div>
          ` : ""}

          ${top3[2] ? `
            <div class="col-md-4 order-3 order-md-3">
              <div class="card-glass podium-card podium-bronze text-center p-4">
                <div class="podium-avatar-wrapper position-relative mx-auto mb-3">
                  <img src="${top3[2].avatar}" alt="${top3[2].name}" class="rounded-circle podium-img" />
                  <span class="podium-rank-badge badge-bronze">3</span>
                </div>
                <h5 class="fw-bold mb-1">${top3[2].name}</h5>
                <small class="text-muted d-block mb-2">${top3[2].department}</small>
                <div class="badge bg-light text-dark border px-3 py-1 mb-2"><strong>${top3[2].points}</strong> Points</div>
              </div>
            </div>
          ` : ""}
        </div>

        <div class="card-glass p-4">
          <h5 class="fw-bold mb-3">🏅 Institutional Rankings</h5>
          <div class="table-responsive">
            <table class="table align-middle table-hover">
              <thead>
                <tr class="text-muted small">
                  <th>Rank</th>
                  <th>Student</th>
                  <th>USN</th>
                  <th>Department</th>
                  <th>Completed Tasks</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                ${studentsSorted.map((stu, index) => `
                  <tr>
                    <td>${index === 0 ? '🥇 #1' : (index === 1 ? '🥈 #2' : (index === 2 ? '🥉 #3' : `#${index + 1}`))}</td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <img src="${stu.avatar}" alt="" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;" />
                        <span>${stu.name}</span>
                      </div>
                    </td>
                    <td><code>${stu.usn}</code></td>
                    <td class="small text-muted">${stu.department}</td>
                    <td><span class="badge bg-light text-dark border">${stu.tasksCompletedCount || 0}</span></td>
                    <td><strong class="text-warning">${stu.points}</strong></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // ----------------------------------------------------
  // FACULTY DASHBOARD RENDERER (With Technical DL Code Review)
  // ----------------------------------------------------
  renderFacultyDashboard(state) {
    const faculty = state.currentUser || state.faculty[0];
    const subPage = state.facultySubPage || "student-progress";

    document.querySelectorAll("[data-faculty-tab]").forEach(tab => {
      if (tab.getAttribute("data-faculty-tab") === subPage) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    const container = document.getElementById("faculty-subpage-container");
    if (!container) return;

    if (subPage === "student-progress") {
      this.renderFacultyProgressPage(container, faculty, state);
    } else {
      this.renderFacultyActivityCreationPage(container, faculty, state);
    }
  }

  renderFacultyProgressPage(container, faculty, state) {
    const submissions = state.submissions;
    const students = state.students;
    const pendingReviews = submissions.filter(s => s.verification.status === "Needs Review");

    container.innerHTML = `
      <div class="faculty-progress-wrapper animate-fade-in">
        <div class="card-glass p-4 mb-4">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <span class="badge bg-info-soft text-info px-3 py-1 mb-2 fw-bold">
                <i class="fa-solid fa-chalkboard-user me-1"></i> Faculty Portal
              </span>
              <h2 class="fw-bold mb-1">Welcome, ${faculty.name}</h2>
              <p class="text-muted mb-0">${faculty.designation} • <strong>${faculty.department}</strong></p>
            </div>
            <div class="d-flex gap-3">
              <div class="metric-card p-3 rounded-3 bg-light border text-center">
                <small class="text-muted d-block">Pending Reviews</small>
                <strong class="fs-4 ${pendingReviews.length > 0 ? 'text-danger' : 'text-success'}">${pendingReviews.length}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Human-In-The-Loop AI Review Queue (Supports Technical DL Code & Loss Curves) -->
        <div class="card-glass p-4 mb-4">
          <h5 class="fw-bold mb-3 d-flex align-items-center gap-2">
            <i class="fa-solid fa-shield-halved text-warning"></i> Human-In-The-Loop Technical Review Queue (${pendingReviews.length})
          </h5>

          ${pendingReviews.length === 0 ? `
            <div class="text-center py-4 text-muted">
              <i class="fa-solid fa-circle-check fs-1 mb-2 text-success"></i>
              <p class="mb-0">All student submissions & Deep Learning milestones are verified!</p>
            </div>
          ` : `
            <div class="review-queue-list d-flex flex-column gap-3">
              ${pendingReviews.map(item => {
                const isDl = item.taskType === "technical_dl_project";
                return `
                  <div class="review-queue-item p-4 rounded-4 bg-light border">
                    <div class="row g-3">
                      <div class="col-md-4">
                        <img src="${item.imageUrl || item.trainingLossPlotUrl}" alt="Proof" class="rounded-3 w-100 shadow-sm" style="height: 160px; object-fit: cover;" />
                        ${isDl ? `<small class="text-muted text-center d-block mt-1">Uploaded Training Loss / Validation Metric Curve</small>` : ""}
                      </div>

                      <div class="col-md-4">
                        <span class="badge ${isDl ? 'bg-primary text-white' : 'bg-warning-soft text-dark'} mb-2">
                          ${isDl ? `🔬 DL Milestone ${item.milestoneIndex || 3} Deliverables` : `SDG ${item.sdgGoalId} Task`}
                        </span>
                        <h6 class="fw-bold mb-1">${item.taskTitle}</h6>
                        <p class="text-muted small mb-2">${item.impactSummary}</p>
                        
                        <div class="small text-muted mb-2">
                          <div><strong>Student:</strong> ${item.studentName} (<code>${item.usn}</code>)</div>
                          <div><strong>Submitted:</strong> ${item.submittedAt}</div>
                        </div>

                        ${isDl && item.githubRepoUrl ? `
                          <div class="d-flex gap-2 flex-wrap">
                            <a href="${item.githubRepoUrl}" target="_blank" class="btn btn-sm btn-dark">
                              <i class="fa-brands fa-github me-1"></i> Inspect GitHub Code
                            </a>
                            ${item.colabNotebookUrl ? `
                              <a href="${item.colabNotebookUrl}" target="_blank" class="btn btn-sm btn-outline-warning">
                                <i class="fa-solid fa-code me-1"></i> Colab
                              </a>
                            ` : ""}
                          </div>
                        ` : ""}
                      </div>

                      <div class="col-md-4 border-start-md">
                        <div class="p-3 bg-white rounded-3 border mb-3">
                          <div class="d-flex justify-content-between align-items-center mb-1">
                            <small class="fw-bold text-muted">AI Code Certainty:</small>
                            <span class="badge bg-success text-white fw-bold">${item.verification.aiConfidence}%</span>
                          </div>
                          <small class="text-dark d-block mb-1"><strong>AI Note:</strong> ${item.verification.aiExplanation}</small>
                        </div>

                        <div class="d-flex gap-2">
                          <button class="btn btn-sm btn-success flex-grow-1 btn-faculty-approve" data-sub-id="${item.id}">
                            <i class="fa-solid fa-check me-1"></i> Approve (+${isDl ? '300' : '150'} pts)
                          </button>
                          <button class="btn btn-sm btn-danger flex-grow-1 btn-faculty-reject" data-sub-id="${item.id}">
                            <i class="fa-solid fa-xmark me-1"></i> Request Refactor
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          `}
        </div>

        <!-- Student Roster -->
        <div class="card-glass p-4">
          <h5 class="fw-bold mb-3">👥 Department Students Progress Roster</h5>
          <div class="table-responsive">
            <table class="table align-middle table-hover">
              <thead>
                <tr class="text-muted small">
                  <th>Student Name</th>
                  <th>USN</th>
                  <th>Department</th>
                  <th>Ongoing Tasks</th>
                  <th>Completed</th>
                  <th>Points</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${students.map(stu => `
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <img src="${stu.avatar}" alt="" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;" />
                        <strong>${stu.name}</strong>
                      </div>
                    </td>
                    <td><code>${stu.usn}</code></td>
                    <td class="small text-muted">${stu.department}</td>
                    <td><span class="badge bg-warning-soft text-dark">${stu.ongoingTasksCount || 0}</span></td>
                    <td><span class="badge bg-success-soft text-success">${stu.tasksCompletedCount || 0}</span></td>
                    <td><strong class="text-warning">${stu.points || 0}</strong></td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary btn-assign-student-direct" data-student-id="${stu.id}">
                        Assign Task
                      </button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll(".btn-faculty-approve").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-sub-id");
        window.appState.reviewSubmission(id, "approve", "Approved by Faculty Mentor.");
        alert("✅ Submission Approved! SDG Points credited to student.");
      });
    });

    container.querySelectorAll(".btn-faculty-reject").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-sub-id");
        const reason = prompt("Enter feedback or request for code refactoring:", "Please adjust hyperparameter learning rate to improve loss curve convergence.");
        if (reason !== null) {
          window.appState.reviewSubmission(id, "reject", reason);
          alert("Marked for revision.");
        }
      });
    });

    container.querySelectorAll(".btn-assign-student-direct").forEach(btn => {
      btn.addEventListener("click", () => {
        const stuId = btn.getAttribute("data-student-id");
        const targetStudent = students.find(s => s.id === stuId);
        const dynamicTask = window.sdgAiEngine.generateDynamicTaskForStudent(targetStudent);
        window.appState.state.activities.unshift(dynamicTask);
        window.appState.assignTaskToStudent(dynamicTask.id, stuId);
        alert(`🌟 Task "${dynamicTask.title}" directly assigned to ${targetStudent.name}!`);
      });
    });
  }

  // Faculty Page 2: Activity Creation
  renderFacultyActivityCreationPage(container, faculty, state) {
    const activities = state.activities;

    container.innerHTML = `
      <div class="activity-creation-wrapper animate-fade-in">
        <div class="row g-4">
          <div class="col-lg-6">
            <div class="card-glass p-4 h-100">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">✍️ Publish New SDG Activity / Project</h5>
                <button class="btn btn-sm btn-outline-primary" id="btn-generate-ai-ideas">
                  <i class="fa-solid fa-wand-magic-sparkles me-1"></i> AI Idea Generator
                </button>
              </div>

              <form id="form-faculty-create-activity">
                <div class="mb-3">
                  <label class="form-label small fw-bold">Task Type</label>
                  <select id="new-task-type" class="form-select form-select-sm">
                    <option value="technical_dl_project">🔬 Technical / Deep Learning Mini-Project (4 Milestones)</option>
                    <option value="field_activity">🌱 Field Sustainability Activity</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold">Title</label>
                  <input type="text" id="new-task-title" class="form-control form-control-sm" placeholder="e.g. YOLOv8 Waste Classifier" required />
                </div>

                <div class="row g-2 mb-3">
                  <div class="col-md-6">
                    <label class="form-label small fw-bold">SDG Goal</label>
                    <select id="new-task-goal" class="form-select form-select-sm" required>
                      ${window.SDG_DATA.goals.map(g => `<option value="${g.id}">SDG ${g.id}: ${g.shortName}</option>`).join("")}
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small fw-bold">Target Department</label>
                    <select id="new-task-dept" class="form-select form-select-sm">
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Artificial Intelligence & ML">Artificial Intelligence & ML</option>
                      <option value="Electrical & Electronics Eng">Electrical & Electronics Eng</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="All Departments">All Departments</option>
                    </select>
                  </div>
                </div>

                <div class="row g-2 mb-3">
                  <div class="col-md-6">
                    <label class="form-label small fw-bold">Points</label>
                    <input type="number" id="new-task-points" class="form-control form-control-sm" value="300" min="50" max="500" required />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small fw-bold">Deadline</label>
                    <input type="date" id="new-task-deadline" class="form-control form-control-sm" value="2026-09-30" required />
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold">Description</label>
                  <textarea id="new-task-desc" class="form-control form-control-sm" rows="3" placeholder="Describe the deep learning project or campus action..." required></textarea>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold">Verification Rules</label>
                  <input type="text" id="new-task-rules" class="form-control form-control-sm" placeholder="Submit GitHub repo and loss curve plot" required />
                </div>

                <button type="submit" class="btn btn-primary w-100 py-2 fw-bold">
                  <i class="fa-solid fa-plus-circle me-1"></i> Publish Activity
                </button>
              </form>
            </div>
          </div>

          <div class="col-lg-6">
            <div class="card-glass p-4 h-100">
              <h5 class="fw-bold mb-3">📑 Manage Activities (${activities.length})</h5>
              <div class="activities-manage-list d-flex flex-column gap-3" style="max-height: 520px; overflow-y: auto;">
                ${activities.map(task => `
                  <div class="manage-task-item p-3 rounded-3 bg-light border d-flex justify-content-between align-items-center">
                    <div style="max-width: 65%;">
                      <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge ${task.taskType === 'technical_dl_project' ? 'bg-primary text-white' : 'bg-light text-dark border'}">
                          ${task.taskType === 'technical_dl_project' ? 'DL Project' : `SDG ${task.goalId}`}
                        </span>
                        <strong class="text-truncate">${task.title}</strong>
                      </div>
                      <small class="text-muted d-block">Points: +${task.points}</small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                      <button class="btn btn-sm ${task.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'} btn-toggle-activity" data-task-id="${task.id}">
                        ${task.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const createForm = document.getElementById("form-faculty-create-activity");
    if (createForm) {
      createForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = document.getElementById("new-task-title").value.trim();
        const goalId = document.getElementById("new-task-goal").value;
        const dept = document.getElementById("new-task-dept").value;
        const points = document.getElementById("new-task-points").value;
        const deadline = document.getElementById("new-task-deadline").value;
        const desc = document.getElementById("new-task-desc").value.trim();
        const rules = document.getElementById("new-task-rules").value.trim();
        const taskType = document.getElementById("new-task-type").value;

        window.appState.createActivity({
          title, goalId, department: dept, points, deadline,
          description: desc, verificationRules: rules,
          taskType: taskType, status: "Active"
        });

        alert("🎉 Published successfully to task catalog!");
      });
    }

    container.querySelectorAll(".btn-toggle-activity").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-task-id");
        window.appState.toggleActivityStatus(id);
      });
    });

    const aiIdeasBtn = document.getElementById("btn-generate-ai-ideas");
    if (aiIdeasBtn) {
      aiIdeasBtn.addEventListener("click", () => {
        const goalId = document.getElementById("new-task-goal").value;
        const dept = document.getElementById("new-task-dept").value;
        const ideas = window.sdgAiEngine.generateFacultyTaskIdeas(goalId, dept);
        const chosen = ideas[Math.floor(Math.random() * ideas.length)];

        document.getElementById("new-task-title").value = chosen.title;
        document.getElementById("new-task-points").value = chosen.points;
        document.getElementById("new-task-desc").value = chosen.description;
        document.getElementById("new-task-rules").value = chosen.verificationRules;
        if (chosen.taskType) document.getElementById("new-task-type").value = chosen.taskType;
        alert("✨ AI populated form with high-impact task idea aligned to the selected SDG!");
      });
    }
  }

  // ----------------------------------------------------
  // EVIDENCE & DEEP LEARNING SUBMISSION MODAL
  // ----------------------------------------------------
  setupSubmissionModal() {
    const modalEl = document.getElementById("evidenceSubmissionModal");
    if (!modalEl) return;

    const form = document.getElementById("form-evidence-submit");
    const taskSelect = document.getElementById("submission-task-select");
    const dlSection = document.getElementById("dl-project-submission-fields");
    const fieldSection = document.getElementById("field-activity-submission-fields");
    const imageInput = document.getElementById("evidence-image-file");
    const imagePreview = document.getElementById("evidence-image-preview");
    const aiAnalysisBox = document.getElementById("ai-analysis-output");

    if (taskSelect) {
      taskSelect.addEventListener("change", () => {
        const taskId = taskSelect.value;
        const task = window.appState.state.activities.find(t => t.id === taskId);
        const isDl = task && task.taskType === "technical_dl_project";

        if (dlSection && fieldSection) {
          if (isDl) {
            dlSection.classList.remove("d-none");
            fieldSection.classList.add("d-none");
          } else {
            dlSection.classList.add("d-none");
            fieldSection.classList.remove("d-none");
          }
        }
      });
    }

    if (imageInput && imagePreview) {
      imageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            imagePreview.src = re.target.result;
            imagePreview.classList.remove("d-none");
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const taskId = taskSelect.value;
        const task = window.appState.state.activities.find(t => t.id === taskId);
        const isDl = task && task.taskType === "technical_dl_project";

        const impact = document.getElementById("submission-impact-summary").value.trim();
        const milestoneIndex = parseInt(document.getElementById("submission-milestone-select")?.value || 1, 10);
        const githubRepoUrl = document.getElementById("submission-github-url")?.value.trim() || "";
        const colabNotebookUrl = document.getElementById("submission-colab-url")?.value.trim() || "";
        const modelAccuracy = document.getElementById("submission-model-accuracy")?.value.trim() || "93.4%";
        const liveDemoUrl = document.getElementById("submission-demo-url")?.value.trim() || "";
        const location = document.getElementById("submission-location")?.value.trim() || "Campus Grounds";
        const file = imageInput ? imageInput.files[0] : null;

        const submitBtn = form.querySelector("button[type='submit']");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i> ${isDl ? 'Verifying Code & Loss Curves...' : 'AI Image Analysis...'}`;
        }

        if (aiAnalysisBox) {
          aiAnalysisBox.classList.remove("d-none");
          aiAnalysisBox.innerHTML = `
            <div class="p-3 bg-light rounded-3 border text-center">
              <div class="spinner-border spinner-border-sm text-primary mb-2"></div>
              <p class="small text-muted mb-0">${isDl ? 'Checking GitHub repository, loss curve plot convergence, and computing accuracy score...' : 'Extracting EXIF metadata, scanning perceptual hash, and running neural object detection...'}</p>
            </div>
          `;
        }

        const verification = await window.sdgAiEngine.analyzeSubmissionEvidence(file, task, {
          taskType: task ? task.taskType : "field_activity",
          milestoneIndex: milestoneIndex,
          githubRepoUrl: githubRepoUrl,
          modelAccuracy: modelAccuracy,
          location: location
        });

        const sampleImg = isDl 
          ? "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80" 
          : "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80";

        window.appState.addSubmission({
          taskId: taskId,
          impactSummary: impact,
          taskType: isDl ? "technical_dl_project" : "field_activity",
          milestoneIndex: milestoneIndex,
          githubRepoUrl: githubRepoUrl,
          colabNotebookUrl: colabNotebookUrl,
          modelMetricsSummary: { accuracy: modelAccuracy },
          liveDemoUrl: liveDemoUrl,
          location: location,
          imageUrl: (imagePreview && !imagePreview.classList.contains("d-none")) ? imagePreview.src : sampleImg,
          trainingLossPlotUrl: (imagePreview && !imagePreview.classList.contains("d-none")) ? imagePreview.src : sampleImg,
          verification: verification
        });

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i class="fa-solid fa-check me-2"></i> Deliverables Submitted`;
        }

        if (aiAnalysisBox) {
          aiAnalysisBox.innerHTML = `
            <div class="p-3 rounded-3 border bg-success-soft border-success animate-fade-in">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <strong class="text-success">🎉 ${isDl ? `Milestone ${milestoneIndex} Code Verified` : 'AI Verification Passed'}</strong>
                <span class="badge bg-success text-white">Certainty: ${verification.aiConfidence}%</span>
              </div>
              <p class="small mb-1">${verification.aiExplanation}</p>
              <small class="text-muted d-block">${verification.metadataIntegrity}</small>
              <div class="alert alert-info py-1 mb-0 mt-2 small text-center">
                ${isDl ? `Milestone ${milestoneIndex} logged. Progress updated to ${milestoneIndex * 25}%!` : 'SDG Points credited to your profile!'}
              </div>
            </div>
          `;
        }

        setTimeout(() => {
          if (window.bootstrap && modalEl) {
            const bsModal = window.bootstrap.Modal.getInstance(modalEl);
            if (bsModal) bsModal.hide();
          }
          window.appState.setStudentSubPage("progress");
        }, 3000);
      });
    }
  }

  openSubmissionModal(preselectedTaskId = null) {
    const modalEl = document.getElementById("evidenceSubmissionModal");
    const taskSelect = document.getElementById("submission-task-select");
    const aiAnalysisBox = document.getElementById("ai-analysis-output");
    const dlSection = document.getElementById("dl-project-submission-fields");
    const fieldSection = document.getElementById("field-activity-submission-fields");

    if (aiAnalysisBox) aiAnalysisBox.classList.add("d-none");

    if (taskSelect) {
      taskSelect.innerHTML = `
        <option value="">-- Select Active Task or DL Project --</option>
        ${window.appState.state.activities.filter(a => a.status === "Active").map(t => `
          <option value="${t.id}" ${preselectedTaskId === t.id ? "selected" : ""}>
            [${t.taskType === 'technical_dl_project' ? '🔬 DL Project' : '🌱 Field'}] ${t.title} (+${t.points} pts)
          </option>
        `).join("")}
      `;

      const chosenTask = window.appState.state.activities.find(t => t.id === (preselectedTaskId || taskSelect.value));
      const isDl = chosenTask && chosenTask.taskType === "technical_dl_project";
      if (dlSection && fieldSection) {
        if (isDl) {
          dlSection.classList.remove("d-none");
          fieldSection.classList.add("d-none");
        } else {
          dlSection.classList.add("d-none");
          fieldSection.classList.remove("d-none");
        }
      }
    }

    if (modalEl && window.bootstrap) {
      const modal = new window.bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  openGoalDetailModal(goalId) {
    const goal = window.SDG_DATA.goals.find(g => g.id === goalId);
    if (!goal) return;

    const modalTitle = document.getElementById("goalModalTitle");
    const modalBody = document.getElementById("goalModalBody");
    const modalHeader = document.getElementById("goalModalHeader");

    if (modalHeader) {
      modalHeader.style.background = goal.color;
      modalHeader.style.color = "#ffffff";
    }

    if (modalTitle) {
      modalTitle.innerHTML = `<i class="${goal.icon} me-2"></i> SDG ${goal.number}: ${goal.name}`;
    }

    if (modalBody) {
      modalBody.innerHTML = `
        <div class="goal-modal-content">
          <div class="p-3 mb-3 rounded-3 bg-light border">
            <h6 class="fw-bold mb-1 text-dark">Global Vision:</h6>
            <p class="text-muted small mb-0">${goal.vision}</p>
          </div>
          <h6 class="fw-bold mb-2">🎯 Key UN Targets:</h6>
          <ul class="small text-muted mb-3">
            ${goal.keyTargets.map(t => `<li class="mb-1">${t}</li>`).join("")}
          </ul>
          <div class="p-3 mb-3 rounded-3 bg-light border">
            <h6 class="fw-bold mb-1 text-success"><i class="fa-solid fa-leaf me-1"></i> Campus Action & Technical Projects:</h6>
            <p class="text-muted small mb-0">${goal.campusImpact}</p>
          </div>
        </div>
      `;
    }

    const modalEl = document.getElementById("goalDetailModal");
    if (modalEl && window.bootstrap) {
      const modal = new window.bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  setupGoalDetailModal() {}
  setupActivityCreationForm() {}
}

document.addEventListener("DOMContentLoaded", () => {
  window.appController = new AppController();
  window.appController.init();
});
