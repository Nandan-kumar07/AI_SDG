// Shared State and Session Management for Multi-Page SDG Antigravity Web Platform
// Synchronizes auth state across pages and persists it through the backend when available.

class AppState {
  constructor() {
    this.STORAGE_KEY = "SDG_CAMPUS_PLATFORM_V3_MULTIPAGE";
    this.state = this.loadInitialState();
    this.listeners = new Set();
    this.ready = this.hydrateFromBackend();
  }

  authHeaders() {
    const token = localStorage.getItem("SDG_SESSION_TOKEN");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async hydrateFromBackend() {
    try {
      const response = await fetch("/api/state", { headers: this.authHeaders() });
      if (!response.ok) return;
      const backendState = await response.json();
      this.state = { ...this.state, ...backendState };
      this.persistLocalState();
      this.notify();
    } catch (error) {
      console.info("Backend unavailable; using local seed state.", error.message);
    }
  }

  persistLocalState() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn("Could not save to LocalStorage", e);
    }
  }

  loadInitialState() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved state, initializing fresh state", e);
      }
    }

    // Default Fresh State: Not logged in (Guest) until explicit login
    return {
      currentUser: null,
      userRole: "guest",
      studentSubPage: "progress",
      facultySubPage: "student-progress",

      activities: [...(window.SDG_DATA?.activities || [])],
      submissions: [...(window.SDG_DATA?.submissions || [])],
      students: [...(window.SDG_DATA?.students || [])],
      faculty: [...(window.SDG_DATA?.faculty || [])],
      quizzes: [...(window.SDG_DATA?.quizzes || [])],

      studentOngoingTasks: [],
      chatHistory: [],
      gameScores: {},

      theme: "light",
      notifications: []
    };
  }

  save() {
    this.persistLocalState();
    fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...this.authHeaders() },
      body: JSON.stringify(this.state)
    }).then(async response => {
      if (response.ok) {
        const result = await response.json();
        if (Number.isInteger(result.revision)) this.state.revision = result.revision;
        this.persistLocalState();
      } else if (response.status === 409) {
        console.warn("State update skipped because another user changed the shared state.");
      }
    }).catch(() => undefined);
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error("State listener error:", err);
      }
    }
  }

  // Auth Guard Helper for Protected Dashboard Pages
  checkAuthGuard(requiredRole) {
    if (!this.state.currentUser || this.state.userRole !== requiredRole) {
      return false;
    }
    return true;
  }

  async loginStudent(usnOrEmail, password, collegeCode = "CAMPUS001", classCode = "") {
    await this.ready;
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "student", identifier: usnOrEmail, password, collegeCode, classCode })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.token) localStorage.setItem("SDG_SESSION_TOKEN", result.token);
        this.state = { ...this.state, ...result.state };
        if (window.sdgAiEngine && result.user) {
          const assignedTask = await window.sdgAiEngine.suggestTaskForStudent(result.user);
          this.state.activities.unshift(assignedTask);
          this.assignTaskToStudent(assignedTask.id, result.user.id, "ai_agent");
          this.save();
        }
        this.persistLocalState();
        this.notify();
        return { success: true, user: result.user, backend: "postgresql" };
      }
    } catch (error) {
      console.info("Student login API unavailable; using local state.", error.message);
    }
    const student = this.state.students.find(
      s => (s.usn.toLowerCase() === usnOrEmail.toLowerCase() || s.email.toLowerCase() === usnOrEmail.toLowerCase())
    );

    if (student) {
      this.state.currentUser = student;
      this.state.userRole = "student";
      this.save();
      return { success: true, user: student, backend: 'localstorage' };
    }

    return {
      success: false,
      message: "Student record not found. Please sign up or connect a backend.",
      backend: 'localstorage'
    };
  }

  async signupStudent(formData, collegeCode = "CAMPUS001", classCode = "") {
    await this.ready;
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "student", formData, collegeCode, classCode })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.token) localStorage.setItem("SDG_SESSION_TOKEN", result.token);
        this.state = { ...this.state, ...result.state };
        this.persistLocalState();
        this.notify();
        return { success: true, user: result.user, backend: "postgresql" };
      }
    } catch (error) {
      console.info("Student signup API unavailable; using local state.", error.message);
    }
    const skillsList = formData.skills ? formData.skills.split(",").map(s => s.trim()).filter(Boolean) : ["Python", "Deep Learning"];
    const interestsList = formData.interests ? formData.interests.split(",").map(i => i.trim()).filter(Boolean) : ["Responsible Consumption (SDG 12)"];

    const newStudent = {
      id: "STU-" + Math.floor(1000 + Math.random() * 9000),
      name: formData.name,
      usn: formData.usn.toUpperCase(),
      department: formData.department,
      skills: skillsList,
      interests: interestsList,
      phone: formData.phone,
      email: formData.email,
      password: formData.password,
      points: 100,
      tasksCompletedCount: 0,
      ongoingTasksCount: 1,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      sdgCoverage: {},
      badges: ["New Changemaker"]
    };

    this.state.students.unshift(newStudent);
    this.state.currentUser = newStudent;
    this.state.userRole = "student";

    if (window.sdgAiEngine) {
      const assignedTask = await window.sdgAiEngine.suggestTaskForStudent(newStudent);
      this.state.activities.unshift(assignedTask);
      this.assignTaskToStudent(assignedTask.id, newStudent.id, "ai_agent");
    }

    this.save();
    return { success: true, user: newStudent, backend: 'localstorage' };
  }

  async loginFaculty(email, password, collegeCode = "CAMPUS001", classCode = "") {
    await this.ready;
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "faculty", identifier: email, password, collegeCode, classCode })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.token) localStorage.setItem("SDG_SESSION_TOKEN", result.token);
        this.state = { ...this.state, ...result.state };
        this.persistLocalState();
        this.notify();
        return { success: true, user: result.user, backend: "postgresql" };
      }
    } catch (error) {
      console.info("Faculty login API unavailable; using local state.", error.message);
    }
    const faculty = this.state.faculty.find(
      f => f.email.toLowerCase() === email.toLowerCase()
    );

    if (faculty) {
      this.state.currentUser = faculty;
      this.state.userRole = "faculty";
      this.save();
      return { success: true, user: faculty, backend: 'localstorage' };
    }

    return {
      success: false,
      message: "Faculty record not found. Please sign up or connect a backend.",
      backend: 'localstorage'
    };
  }

  async signupFaculty(formData, collegeCode = "CAMPUS001", createCollege = false, classCode = "") {
    await this.ready;
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "faculty", formData, collegeCode, classCode, createCollege })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.token) localStorage.setItem("SDG_SESSION_TOKEN", result.token);
        this.state = { ...this.state, ...result.state };
        this.persistLocalState();
        this.notify();
        return { success: true, user: result.user, backend: "postgresql" };
      }
    } catch (error) {
      console.info("Faculty signup API unavailable; using local state.", error.message);
    }
    const newFaculty = {
      id: "FAC-" + Math.floor(1000 + Math.random() * 9000),
      name: formData.name,
      department: formData.department,
      phone: formData.phone,
      email: formData.email,
      designation: formData.designation || "Assistant Professor",
      avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80"
    };

    this.state.faculty.unshift(newFaculty);
    this.state.currentUser = newFaculty;
    this.state.userRole = "faculty";
    this.save();
    return { success: true, user: newFaculty, backend: 'localstorage' };
  }

  async logout() {
    this.state.currentUser = null;
    this.state.userRole = "guest";
    localStorage.removeItem("SDG_SESSION_TOKEN");
    this.save();
    await this.ready;
    window.location.href = "index.html";
  }

  // Task & Submission Methods
  setStudentSubPage(page) {
    this.state.studentSubPage = page;
    this.save();
  }

  setFacultySubPage(page) {
    this.state.facultySubPage = page;
    this.save();
  }

  addQuiz(quiz) {
    this.state.quizzes.unshift(quiz);
    this.save();
    return quiz;
  }

  async createClass(name, joinCode, section = "A") {
    const response = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.authHeaders() },
      body: JSON.stringify({ name, joinCode, section })
    });
    if (!response.ok) throw new Error((await response.json()).message || "Could not create class");
    const result = await response.json();
    this.state.classes = [result.class, ...(this.state.classes || [])];
    this.save();
    return result.class;
  }

  async selectClass(classId) {
    const response = await fetch("/api/classes/select", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.authHeaders() },
      body: JSON.stringify({ classId })
    });
    if (!response.ok) throw new Error((await response.json()).message || "Could not select class");
    const result = await response.json();
    if (result.token) localStorage.setItem("SDG_SESSION_TOKEN", result.token);
    this.state.activeClass = result.activeClass;
    this.state.classId = result.activeClass.id;
    await this.hydrateFromBackend();
    return result.activeClass;
  }

  async joinClass(joinCode) {
    const response = await fetch("/api/classes/join", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.authHeaders() },
      body: JSON.stringify({ joinCode })
    });
    if (!response.ok) throw new Error((await response.json()).message || "Could not join class");
    const result = await response.json();
    if (result.token) localStorage.setItem("SDG_SESSION_TOKEN", result.token);
    this.state.activeClass = result.activeClass;
    this.state.classId = result.activeClass.id;
    await this.hydrateFromBackend();
    return result.activeClass;
  }

  createActivity(activityData) {
    const isDl = activityData.taskType === "technical_dl_project";
    const milestones = isDl ? [
      { index: 1, title: "Dataset Curation & Prep", weight: 25, deliverables: "Dataset repository link with annotations" },
      { index: 2, title: "Model Code & Pipeline", weight: 25, deliverables: "GitHub repo with train.py" },
      { index: 3, title: "Loss Curves Optimization", weight: 25, deliverables: "Training loss plot & confusion matrix (>90% acc)" },
      { index: 4, title: "Live Demo & Report", weight: 25, deliverables: "Demo URL & SDG impact summary" }
    ] : [];

    const newActivity = {
      id: isDl ? "TASK-DL-" + Math.floor(300 + Math.random() * 600) : "TASK-" + Math.floor(200 + Math.random() * 800),
      title: activityData.title,
      goalId: parseInt(activityData.goalId, 10),
      department: activityData.department || "All Departments",
      points: parseInt(activityData.points, 10) || (isDl ? 300 : 150),
      deadline: activityData.deadline || "2026-09-30",
      status: activityData.status || "Active",
      difficulty: activityData.difficulty || (isDl ? "Advanced" : "Intermediate"),
      taskType: activityData.taskType || "field_activity",
      aiAssigned: false,
      matchedSkills: activityData.matchedSkills || (isDl ? ["Python", "Deep Learning", "PyTorch"] : ["Campus Action", "Sustainability"]),
      description: activityData.description,
      verificationRules: activityData.verificationRules || "Complete deliverables and upload verification proof.",
      milestones: milestones,
      participantsCount: 0,
      createdBy: this.state.currentUser ? this.state.currentUser.name : "Faculty Administrator"
    };

    this.state.activities.unshift(newActivity);
    this.save();
    return newActivity;
  }

  toggleActivityStatus(taskId) {
    const task = this.state.activities.find(t => t.id === taskId);
    if (task) {
      task.status = task.status === "Active" ? "Inactive" : "Active";
      this.save();
      return task;
    }
    return null;
  }

  assignTaskToStudent(taskId, studentId = null, assignedBy = "ai_agent") {
    const targetStudentId = studentId || (this.state.currentUser ? this.state.currentUser.id : "STU-001");
    const task = this.state.activities.find(t => t.id === taskId);
    if (!task) return false;

    const existing = this.state.studentOngoingTasks.find(o => o.taskId === taskId);
    if (!existing) {
      this.state.studentOngoingTasks.unshift({
        taskId: taskId,
        assignedAt: new Date().toISOString().split("T")[0],
        status: "in-progress",
        currentMilestoneIndex: 1,
        progressPct: task.taskType === "technical_dl_project" ? 25 : 10,
        assignedBy: assignedBy,
        aiMatchRationale: `Assigned based on skill profile for SDG ${task.goalId}.`
      });

      const student = this.state.students.find(s => s.id === targetStudentId);
      if (student) {
        student.ongoingTasksCount = (student.ongoingTasksCount || 0) + 1;
      }
      task.participantsCount = (task.participantsCount || 0) + 1;
      this.save();
      return true;
    }
    return false;
  }

  addSubmission(submissionData) {
    const student = this.state.currentUser || this.state.students[0];
    const task = this.state.activities.find(t => t.id === submissionData.taskId);
    const isDl = task ? task.taskType === "technical_dl_project" : (submissionData.taskType === "technical_dl_project");

    const newSub = {
      id: isDl ? "SUB-DL-" + Math.floor(900 + Math.random() * 1000) : "SUB-" + Math.floor(900 + Math.random() * 1000),
      taskId: submissionData.taskId,
      taskTitle: task ? task.title : submissionData.taskTitle,
      sdgGoalId: task ? task.goalId : (submissionData.goalId || 12),
      studentId: student.id,
      studentName: student.name,
      usn: student.usn,
      department: student.department,
      taskType: isDl ? "technical_dl_project" : "field_activity",
      milestoneIndex: submissionData.milestoneIndex || 1,
      submittedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
      impactSummary: submissionData.impactSummary,
      location: submissionData.location || "Campus Grounds",
      imageUrl: submissionData.imageUrl,
      githubRepoUrl: submissionData.githubRepoUrl || null,
      colabNotebookUrl: submissionData.colabNotebookUrl || null,
      trainingLossPlotUrl: submissionData.trainingLossPlotUrl || submissionData.imageUrl,
      modelMetricsSummary: submissionData.modelMetricsSummary || {},
      liveDemoUrl: submissionData.liveDemoUrl || null,
      verification: submissionData.verification,
      pointsAwarded: submissionData.verification.status === "Verified" ? (task ? task.points : 150) : 0
    };

    this.state.submissions.unshift(newSub);

    const ongoing = this.state.studentOngoingTasks.find(t => t.taskId === submissionData.taskId);
    if (ongoing && isDl) {
      const nextMilestone = Math.min(4, (submissionData.milestoneIndex || 1) + 1);
      ongoing.currentMilestoneIndex = nextMilestone;
      ongoing.progressPct = Math.min(100, (submissionData.milestoneIndex || 1) * 25);
    }

    if (newSub.verification.status === "Verified") {
      this.creditStudentReward(student.id, newSub.pointsAwarded, newSub.sdgGoalId);
      if (!isDl || newSub.milestoneIndex === 4) {
        this.state.studentOngoingTasks = this.state.studentOngoingTasks.filter(t => t.taskId !== submissionData.taskId);
      }
    }

    this.save();
    return newSub;
  }

  reviewSubmission(submissionId, decision, feedback = "", awardedPoints = null) {
    const sub = this.state.submissions.find(s => s.id === submissionId);
    if (!sub) return null;

    const task = this.state.activities.find(t => t.id === sub.taskId);
    const points = task ? task.points : (sub.taskType === "technical_dl_project" ? 300 : 150);

    sub.verification.status = decision === "approve" ? "Verified" : (decision === "reject" ? "Rejected" : "Needs Review");
    sub.verification.reviewedBy = this.state.currentUser ? this.state.currentUser.name : "Faculty Reviewer";
    sub.verification.reviewTimestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
    sub.verification.facultyFeedback = feedback;

    if (decision === "approve") {
      const approvedPoints = awardedPoints === null
        ? points
        : Math.max(0, Math.min(points, Number(awardedPoints) || 0));
      sub.pointsAwarded = approvedPoints;
      this.creditStudentReward(sub.studentId, approvedPoints, sub.sdgGoalId);
      this.state.studentOngoingTasks = this.state.studentOngoingTasks.filter(t => t.taskId !== sub.taskId);
    }

    this.save();
    return sub;
  }

  creditStudentReward(studentId, points, goalId) {
    const student = this.state.students.find(s => s.id === studentId);
    if (student) {
      student.points = (student.points || 0) + points;
      student.tasksCompletedCount = (student.tasksCompletedCount || 0) + 1;
      if (student.ongoingTasksCount > 0) student.ongoingTasksCount--;

      if (!student.sdgCoverage) student.sdgCoverage = {};
      student.sdgCoverage[goalId] = (student.sdgCoverage[goalId] || 0) + 1;

      if (!student.badges.includes("Deep Learning Changemaker")) {
        student.badges.push("Deep Learning Changemaker");
      }
    }
  }

  addChatMessage(message) {
    this.state.chatHistory.push(message);
    this.save();
  }
}

window.appState = new AppState();
