# Architectural Diagrams — AI-Powered SDG Campus Platform

This document contains the **Use Case Diagram**, **System Process Flow Diagram**, and **Sequence Diagram** for the platform.

---

## 1. 📌 Use Case Diagram

```mermaid
graph LR
    %% Actors
    Student["🎓 Student"]
    Faculty["👨‍🏫 Faculty / Mentor"]
    AIAgent["🤖 Autonomous AI Agent"]
    Supabase["🗄️ Supabase Backend"]

    %% Student Use Cases
    subgraph StudentPortal ["Student Portal Capabilities"]
        UC1[Register & Input Skills/Interests]
        UC2[View 'My Progress' & SDG Radar]
        UC3[Receive Auto-Assigned AI Tasks]
        UC4[Track 4-Milestone DL Projects]
        UC5[Submit Proof & GitHub Code / Loss Curves]
        UC6[Play SDG Mini-Games Eco-Sorter & NetZero]
        UC7[Attempt SDG Topic Quizzes]
        UC8[View Campus Leaderboard]
        UC9[Chat with Floating AI Mentor]
    end

    %% Faculty Use Cases
    subgraph FacultyPortal ["Faculty Portal Capabilities"]
        UC10[Faculty Sign In / Sign Up]
        UC11[Create SDG Activity - Field / DL Project]
        UC12[Toggle Task Active / Inactive]
        UC13[Use AI Task Idea Generator]
        UC14[Review Flagged Proofs & DL Code]
        UC15[Approve / Reject Points & Give Feedback]
        UC16[Monitor Department Student Roster]
    end

    %% AI Agent Use Cases
    subgraph AIEngine ["Autonomous AI Engine Capabilities"]
        UC17[Analyze Skills & Synthesize Custom Task]
        UC18[Extract EXIF & Check Geofence]
        UC19[Perceptual Duplicate Hash Detection]
        UC20[Analyze Training Loss Plot Convergence]
        UC21[Route to Auto-Approval vs Review Queue]
    end

    %% Supabase Use Cases
    subgraph BackendSystem ["Supabase System Capabilities"]
        UC22[Manage Auth & JWT Sessions]
        UC23[Enforce Row Level Security RLS]
        UC24[Store Proof Images & Loss Charts]
        UC25[Broadcast Realtime Leaderboard Updates]
    end

    %% Connections
    Student --> UC1
    Student --> UC2
    Student --> UC3
    Student --> UC4
    Student --> UC5
    Student --> UC6
    Student --> UC7
    Student --> UC8
    Student --> UC9

    Faculty --> UC10
    Faculty --> UC11
    Faculty --> UC12
    Faculty --> UC13
    Faculty --> UC14
    Faculty --> UC15
    Faculty --> UC16

    AIAgent --> UC17
    AIAgent --> UC18
    AIAgent --> UC19
    AIAgent --> UC20
    AIAgent --> UC21

    Supabase --> UC22
    Supabase --> UC23
    Supabase --> UC24
    Supabase --> UC25

    UC1 -.->|Triggers| UC17
    UC5 -.->|Triggers| UC18
    UC5 -.->|Triggers| UC20
    UC21 -.->|If Flagged / DL Project| UC14
    UC15 -.->|Updates Points| UC25
```

---

## 2. 🔄 System Process Flow Diagram

```mermaid
flowchart TD
    Start([User Arrives at index.html]) --> Choice{Select Role}
    
    %% Student Flow
    Choice -->|Student| S_Auth[Open student-login.html]
    S_Auth --> S_Register{New Student?}
    S_Register -->|Yes| S_Form[Fill 9 Fields: Name, USN, Dept, Skills, Interests, Phone, Email, Pass, Captcha]
    S_Register -->|No| S_Login[Enter USN/Email, Password, Captcha]
    
    S_Form --> AI_Assign[🤖 AI Task Manager Vectorizes Profile]
    AI_Assign -->|CS / AI Student| DL_Task[Synthesize 4-Milestone Deep Learning Project e.g. YOLOv8 Classifier]
    AI_Assign -->|Non-CS Student| Field_Task[Synthesize Campus Field Activity e.g. Solar Telemetry Audit]
    
    S_Login --> S_Dash[student-dashboard.html Auth Guard Pass]
    DL_Task --> S_Dash
    Field_Task --> S_Dash
    
    S_Dash --> S_Menu{Select Menu Tab}
    S_Menu -->|1. My Progress| S_Prog[View SDG Radar, 4-Milestone DL Stepper & Ongoing Tasks]
    S_Menu -->|2. About SDGs| S_SDG[Explore 17 UN Goals, Visions & Targets]
    S_Menu -->|3. Quiz Arena| S_Quiz[Take 120s Quizzes & Earn Badges]
    S_Menu -->|4. Mini-Games| S_Game[Play Eco-Sorter & NetZero Grid Simulator]
    S_Menu -->|5. Activities| S_Act[Browse Catalog or Open Submission Modal]
    S_Menu -->|6. Leaderboard| S_Lead[View Top 3 Podium & Department Rankings]
    
    %% Submission Flow
    S_Prog --> S_Submit[Click Submit Deliverables]
    S_Act --> S_Submit
    S_Submit --> Sub_Type{Task Type?}
    
    Sub_Type -->|Technical DL Project| DL_Sub[Submit Milestone 1-4: GitHub URL, Colab Link, Loss Curve Plot, Accuracy %]
    Sub_Type -->|Field Activity| Field_Sub[Submit Photo Proof, Location Coordinates, Impact Summary]
    
    DL_Sub --> AI_Verify[🔍 Multi-Factor AI Verification Engine]
    Field_Sub --> AI_Verify
    
    AI_Verify --> AI_Check{AI Checks Passed?}
    AI_Check -->|Confidence >= 85% & No Duplicates| Auto_Approve[✅ Auto-Verified & Instant Points Credited]
    AI_Check -->|Confidence < 85% / Flagged / DL Project| Queue_Route[⚠️ Routed to Faculty Review Queue]
    
    %% Faculty Flow
    Choice -->|Faculty| F_Auth[Open faculty-login.html]
    F_Auth --> F_Login[Sign In with Institutional Email & Captcha]
    F_Login --> F_Dash[faculty-dashboard.html Auth Guard Pass]
    
    F_Dash --> F_Menu{Select Menu Tab}
    F_Menu -->|1. Student Progress & Review Queue| F_Review[Inspect Pending Submissions & GitHub Code / Loss Curves]
    F_Menu -->|2. Activity Creation| F_Create[Publish New Tasks with AI Idea Generator & Toggle Status]
    
    Queue_Route --> F_Review
    F_Review --> F_Decision{Faculty Decision}
    F_Decision -->|Approve| F_Approve[Award SDG Points & DL Badges]
    F_Decision -->|Reject / Request Refactor| F_Reject[Send Technical Feedback to Student]
    
    Auto_Approve --> Live_Sync[🗄️ Supabase Realtime Sync to Leaderboard & Profiles]
    F_Approve --> Live_Sync
```

---

## 3. ⏱️ Sequence Diagram (End-to-End Execution)

```mermaid
sequenceDiagram
    autonumber
    actor Student as 🎓 Student
    participant UI as 🖥️ Web Portal (HTML/JS)
    participant Auth as 🔐 Auth Guard & Sessions
    participant AIAgent as 🤖 Autonomous AI Task Assigner
    participant AIVerify as 🔍 Multi-Factor AI Verifier
    participant Supabase as 🗄️ Supabase (DB + Storage)
    actor Faculty as 👨‍🏫 Faculty Reviewer

    %% 1. Registration & AI Assignment
    Student->>UI: Fills Sign Up (Skills: Python, PyTorch; Interests: SDG 12)
    UI->>Supabase: Inserts New Student Profile into `profiles`
    Supabase-->>AIAgent: Profile Webhook / Hook Triggered
    Note over AIAgent: Analyzes CS Profile + SDG 12<br/>Synthesizes 4-Milestone YOLOv8 Task
    AIAgent->>Supabase: Inserts `TASK-DL-201` into `student_assigned_tasks` (Milestone 1, 25%)
    Supabase-->>UI: Real-time Sync: Ongoing Task Active
    UI-->>Student: Renders 'My Progress' with 4-Milestone Stepper

    %% 2. Milestone Deliverable Submission
    Student->>UI: Submits Milestone 3 (GitHub URL, Loss Curve Plot, 93.4% mAP)
    UI->>Supabase: Uploads Loss Chart to Storage (`sdg-proofs/`)
    UI->>AIVerify: Dispatches Submission Payload for AI Verification
    Note over AIVerify: 1. Checks GitHub Repo Integrity<br/>2. Confirms Loss Curve Convergence<br/>3. Verifies mAP Metric > 90%
    AIVerify->>Supabase: Inserts Submission with Confidence: 94% (Status: 'Needs Review')

    %% 3. Faculty Human-in-the-Loop Review
    Faculty->>UI: Opens `faculty-dashboard.html` [Review Queue]
    UI->>Supabase: Queries Pending Submissions from `submissions`
    Supabase-->>UI: Returns Milestone 3 Deliverables & GitHub Link
    Faculty->>UI: Clicks "Inspect GitHub Code" & Views Loss Plot
    Faculty->>UI: Clicks "Approve (+300 pts)" with Feedback
    UI->>Supabase: Updates `verification_status` = 'Verified', Credits +300 pts to `profiles`
    
    %% 4. Real-time Notification & Leaderboard Update
    Supabase-->>UI: Realtime Broadcast (Points Updated)
    UI-->>Student: Proactive Notification: "Milestone Approved! +300 pts Credited"
    UI-->>Student: Unlocks "Deep Learning Changemaker" Badge on Leaderboard
```
