// AI Mentor Chatbot for SDG Antigravity Web Platform
// Persistent animated floating bot, step-by-step guidance, and Deep Learning technical mentoring

class SdgChatbot {
  constructor() {
    this.isOpen = false;
  }

  init() {
    this.renderWidget();
    this.attachEventListeners();
  }

  renderWidget() {
    const existing = document.getElementById("ai-mentor-widget-root");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "ai-mentor-widget-root";
    root.className = "ai-mentor-floating-container";

    root.innerHTML = `
      <!-- Floating Bot Button with Pulse & Animation -->
      <button class="ai-bot-trigger-btn" id="btn-toggle-chatbot" aria-label="Open AI SDG Mentor">
        <div class="bot-avatar-inner">
          <div class="bot-eyes">
            <span class="bot-eye left"></span>
            <span class="bot-eye right"></span>
          </div>
          <i class="fa-solid fa-leaf bot-leaf-icon"></i>
        </div>
        <span class="bot-pulse-ring"></span>
        <span class="bot-status-online" title="AI Mentor Active"></span>
      </button>

      <!-- Expandable Chat Panel -->
      <div class="ai-chat-window card-glass d-none" id="ai-chat-window">
        <!-- Chat Header -->
        <div class="ai-chat-header d-flex justify-content-between align-items-center p-3 border-bottom">
          <div class="d-flex align-items-center gap-2">
            <div class="ai-header-avatar">
              <i class="fa-solid fa-robot text-white"></i>
            </div>
            <div>
              <h6 class="mb-0 fw-bold">SustainAI Mentor</h6>
              <small class="text-success d-flex align-items-center gap-1">
                <span class="online-dot"></span> Intelligent SDG & DL Guide
              </small>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-icon-ghost" id="btn-explainability" title="Responsible AI & Transparency">
              <i class="fa-solid fa-circle-info"></i>
            </button>
            <button class="btn btn-sm btn-icon-ghost" id="btn-close-chatbot">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Chat Messages Body -->
        <div class="ai-chat-body p-3" id="ai-chat-messages">
          <!-- Rendered dynamically -->
        </div>

        <!-- Quick Prompt Suggestions -->
        <div class="ai-quick-prompts p-2 border-top bg-light-subtle d-flex gap-1 overflow-x-auto" id="ai-quick-prompts">
          <button class="quick-chip-btn" data-action="dl-milestones">🔬 DL Milestones</button>
          <button class="quick-chip-btn" data-action="assign-task">📋 Assign Me a Task</button>
          <button class="quick-chip-btn" data-action="recommend-task">🌱 Recommend Tasks</button>
          <button class="quick-chip-btn" data-action="explain-verification">🔍 Verification Info</button>
          <button class="quick-chip-btn" data-action="dl-tips">💡 PyTorch / DL Tips</button>
        </div>

        <!-- Chat Input Form -->
        <form class="ai-chat-input-row p-3 border-top d-flex gap-2" id="ai-chat-form">
          <input type="text" id="ai-user-input" class="form-control form-control-sm" placeholder="Ask AI mentor or type 'assign task'..." autocomplete="off" />
          <button type="submit" class="btn btn-sm btn-primary px-3">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </div>

      <!-- AI Explainability Modal -->
      <div class="modal fade" id="aiExplainModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content card-glass">
            <div class="modal-header border-bottom">
              <h5 class="modal-title fw-bold"><i class="fa-solid fa-shield-halved text-primary me-2"></i> Responsible AI & Technical Verification</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-dark">
              <p class="small text-muted mb-3">Our platform implements ethical, privacy-preserving, and human-in-the-loop AI across all recommendations and verifications.</p>
              
              <div class="d-flex flex-column gap-2">
                <div class="p-2 rounded bg-light border">
                  <strong>🎯 CS & Deep Learning Task Matching:</strong>
                  <p class="small text-muted mb-0">Detects programming skills (Python, PyTorch, YOLO, Computer Vision) and matches students to structured 4-milestone technical SDG challenges.</p>
                </div>
                <div class="p-2 rounded bg-light border">
                  <strong>🔬 Code & Artifact Verification:</strong>
                  <p class="small text-muted mb-0">Analyzes GitHub repos, checks training loss curve convergence, and prepares automated code summaries for Faculty evaluation.</p>
                </div>
                <div class="p-2 rounded bg-light border">
                  <strong>🔒 Privacy & Data Sovereignty:</strong>
                  <p class="small text-muted mb-0">Student biometric identifiers are never stored. Image metadata is scrubbed after institutional auditing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(root);
    this.renderMessages();
  }

  attachEventListeners() {
    const triggerBtn = document.getElementById("btn-toggle-chatbot");
    const closeBtn = document.getElementById("btn-close-chatbot");
    const chatWindow = document.getElementById("ai-chat-window");
    const form = document.getElementById("ai-chat-form");
    const input = document.getElementById("ai-user-input");
    const explainBtn = document.getElementById("btn-explainability");

    if (triggerBtn) {
      triggerBtn.addEventListener("click", () => {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
          chatWindow.classList.remove("d-none");
          input.focus();
        } else {
          chatWindow.classList.add("d-none");
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.isOpen = false;
        chatWindow.classList.add("d-none");
      });
    }

    if (explainBtn) {
      explainBtn.addEventListener("click", () => {
        const modalEl = document.getElementById("aiExplainModal");
        if (modalEl && window.bootstrap) {
          const modal = new window.bootstrap.Modal(modalEl);
          modal.show();
        }
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        this.handleUserQuery(text);
        input.value = "";
      });
    }

    const quickPrompts = document.getElementById("ai-quick-prompts");
    if (quickPrompts) {
      quickPrompts.addEventListener("click", (e) => {
        const btn = e.target.closest(".quick-chip-btn");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        if (action === "dl-milestones") {
          this.handleUserQuery("How do I complete my Deep Learning project milestones?");
        } else if (action === "assign-task") {
          this.handleUserQuery("Assign me a task right now");
        } else if (action === "recommend-task") {
          this.handleUserQuery("Recommend high impact SDG tasks for my profile");
        } else if (action === "explain-verification") {
          this.handleUserQuery("How does AI proof & code verification work?");
        } else if (action === "dl-tips") {
          this.handleUserQuery("Give me PyTorch deep learning tips for SDG projects");
        }
      });
    }
  }

  renderMessages() {
    const container = document.getElementById("ai-chat-messages");
    if (!container) return;

    const history = window.appState.state.chatHistory;
    container.innerHTML = history.map(msg => {
      const isAi = msg.sender === "ai";
      return `
        <div class="chat-message-row ${isAi ? 'ai-row' : 'user-row'} mb-3 animate-fade-in">
          <div class="chat-bubble ${isAi ? 'ai-bubble' : 'user-bubble'}">
            <div class="bubble-content">${this.formatMarkdown(msg.text)}</div>
            ${msg.actionButton ? `
              <div class="mt-2">
                <button class="btn btn-sm btn-success fw-bold chat-action-btn" data-task-id="${msg.actionButton.taskId}">
                  <i class="fa-solid fa-plus-circle me-1"></i> ${msg.actionButton.label}
                </button>
              </div>
            ` : ""}
            <div class="bubble-time text-end mt-1">${msg.timestamp || ""}</div>
          </div>
        </div>
      `;
    }).join("");

    container.scrollTop = container.scrollHeight;

    const actionBtns = container.querySelectorAll(".chat-action-btn");
    actionBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const taskId = btn.getAttribute("data-task-id");
        this.executeTaskAssignment(taskId);
      });
    });
  }

  formatMarkdown(text) {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br/>");
  }

  handleUserQuery(query) {
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    window.appState.addChatMessage({
      sender: "user",
      text: query,
      timestamp: timestamp
    });
    this.renderMessages();

    this.showTypingIndicator();

    setTimeout(() => {
      this.hideTypingIndicator();
      this.generateAiResponse(query.toLowerCase());
    }, 750);
  }

  showTypingIndicator() {
    const container = document.getElementById("ai-chat-messages");
    if (!container) return;
    const typingRow = document.createElement("div");
    typingRow.id = "ai-typing-indicator";
    typingRow.className = "chat-message-row ai-row mb-2";
    typingRow.innerHTML = `
      <div class="chat-bubble ai-bubble py-2 px-3">
        <span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>
      </div>
    `;
    container.appendChild(typingRow);
    container.scrollTop = container.scrollHeight;
  }

  hideTypingIndicator() {
    const indicator = document.getElementById("ai-typing-indicator");
    if (indicator) indicator.remove();
  }

  generateAiResponse(query) {
    const student = window.appState.state.currentUser || window.appState.state.students[0];
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    let responseText = "";
    let actionButton = null;

    if (query.includes("milestone") || query.includes("deep learning") || query.includes("dl")) {
      responseText = `🔬 **Deep Learning 4-Stage Milestone Roadmap:**\n\n1. **Milestone 1 (25% - Dataset)**: Upload Kaggle/Roboflow link with 4+ classes.\n2. **Milestone 2 (50% - Model Code)**: Provide public GitHub repo with documented \`train.py\` & model architecture.\n3. **Milestone 3 (75% - Training Curves)**: Upload Loss/Accuracy plot showing convergence and >90% accuracy.\n4. **Milestone 4 (100% - Demo & Report)**: Submit live Streamlit/Gradio demo URL and impact brief for faculty approval (+300 pts)!`;
    } else if (query.includes("assign") || query.includes("give me a task")) {
      const dynamicTask = window.sdgAiEngine.generateDynamicTaskForStudent(student);
      window.appState.state.activities.unshift(dynamicTask);
      
      responseText = `✨ **Autonomous AI Task Assigned!**\n\n**${dynamicTask.title}**\n• **Goal**: SDG ${dynamicTask.goalId}\n• **Type**: ${dynamicTask.taskType === 'technical_dl_project' ? 'Technical Deep Learning Project (4 Milestones)' : 'Field Activity'}\n• **Reward**: +${dynamicTask.points} Points\n• **Brief**: ${dynamicTask.description}\n\nWould you like to enroll and add this to your Ongoing Tasks?`;
      actionButton = {
        label: `Accept & Start ${dynamicTask.id}`,
        taskId: dynamicTask.id
      };
    } else if (query.includes("recommend") || query.includes("suggest")) {
      const recommendations = window.sdgAiEngine.getRecommendedTasks(student, 2);
      if (recommendations.length > 0) {
        const top = recommendations[0];
        responseText = `🎯 **Personalized Recommendation** (${top.matchScore}% Match for you):\n\n**${top.title}** (SDG ${top.goalId})\n• **Why**: ${top.matchReasons.join("; ")}\n• **Reward**: +${top.points} pts\n• **Type**: ${top.taskType === 'technical_dl_project' ? 'Deep Learning Mini-Project' : 'Field Action'}`;
        actionButton = {
          label: `Start Task: ${top.id}`,
          taskId: top.id
        };
      }
    } else if (query.includes("pytorch") || query.includes("tip")) {
      responseText = `💡 **PyTorch Deep Learning Best Practices for SDG Projects:**\n\n• **Data Augmentation**: Use \`torchvision.transforms\` (RandomHorizontalFlip, ColorJitter) to prevent overfitting on campus photos.\n• **Transfer Learning**: Freeze backbone weights (\`requires_grad=False\`) and fine-tune only final classification heads for faster convergence.\n• **Logging**: Log loss and accuracy using \`torch.utils.tensorboard\` or \`matplotlib\` for your Milestone 3 submission!`;
    } else {
      responseText = `I'm your **Autonomous SDG & Deep Learning AI Mentor**. I can:\n• **Track your 4-stage Deep Learning project milestones**\n• **Assign personalized technical tasks** tailored to your programming skills\n• Guide you on **PyTorch, YOLO, and loss curve verification**\n• Assist with **evidence submissions**.\n\nTry asking: *"Check DL project milestones"* or *"Assign me a task"*!`;
    }

    window.appState.addChatMessage({
      sender: "ai",
      text: responseText,
      timestamp: timestamp,
      actionButton: actionButton
    });
    this.renderMessages();
  }

  executeTaskAssignment(taskId) {
    const success = window.appState.assignTaskToStudent(taskId);
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (success) {
      window.appState.addChatMessage({
        sender: "ai",
        text: `🎉 **Success! Task ${taskId} has been assigned to your Ongoing Tasks list!**\n\nYou can track milestones and submit deliverables in your **My Progress** or **Activities** dashboard.`,
        timestamp: timestamp
      });
      if (window.appState.state.currentRoute === "student-dashboard") {
        window.appState.setStudentSubPage("progress");
      }
    } else {
      window.appState.addChatMessage({
        sender: "ai",
        text: `Task ${taskId} is already in your active task list!`,
        timestamp: timestamp
      });
    }
    this.renderMessages();
  }
}

window.sdgChatbot = new SdgChatbot();
