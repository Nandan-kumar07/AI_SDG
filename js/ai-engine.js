// AI Engine for SDG Antigravity Web Platform
// Recommendation engine, CS Deep Learning Project Generator, Multi-Factor Image/Code Verification, and Duplicate Hashing

class SdgAiEngine {
  constructor() {
    this.campusGeoFence = {
      lat: 12.9352,
      lng: 77.5360,
      radiusKm: 3.5
    };
  }

  // 1. AI Recommendation Engine: Match student profile to SDG tasks (Technical DL vs Field)
  getRecommendedTasks(student, limit = 3) {
    if (!student) return [];

    const activities = window.appState.state.activities.filter(a => a.status === "Active");
    const userSkills = (student.skills || []).map(s => s.toLowerCase());
    const userInterests = (student.interests || []).map(i => i.toLowerCase());
    const userCoverage = student.sdgCoverage || {};

    const isTechnicalStudent = userSkills.some(s => 
      s.includes("python") || s.includes("learning") || s.includes("vision") || s.includes("code") || s.includes("ai") || s.includes("iot")
    );

    const scoredTasks = activities.map(task => {
      let score = 50;
      let matchReasons = [];

      // Technical DL vs Field task affinity
      if (task.taskType === "technical_dl_project" && isTechnicalStudent) {
        score += 30;
        matchReasons.push("Matches your CS & Deep Learning programming profile");
      }

      // Skill match
      const matchedSkill = (task.matchedSkills || []).some(skill => 
        userSkills.some(us => us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us))
      );
      if (matchedSkill) {
        score += 25;
        matchReasons.push("Applies your technical expertise");
      }

      // Interest match
      const goal = window.SDG_DATA.goals.find(g => g.id === task.goalId);
      if (goal) {
        const goalName = goal.name.toLowerCase();
        const goalShort = goal.shortName.toLowerCase();
        const matchesInterest = userInterests.some(ui => 
          ui.includes(goalName) || ui.includes(goalShort) || ui.includes(String(goal.id))
        );
        if (matchesInterest) {
          score += 20;
          matchReasons.push(`Aligns with your interest in SDG ${goal.id} (${goal.shortName})`);
        }
      }

      // Cap score between 70% and 98%
      const finalPercentage = Math.min(98, Math.max(70, score));

      return {
        ...task,
        matchScore: finalPercentage,
        matchReasons: matchReasons.length ? matchReasons : ["Recommended for campus sustainability impact"]
      };
    });

    scoredTasks.sort((a, b) => b.matchScore - a.matchScore);
    return scoredTasks.slice(0, limit);
  }

  async suggestTaskForStudent(student, targetGoalId = null) {
    const token = localStorage.getItem("SDG_SESSION_TOKEN");
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const response = await fetch("/api/ai/task-suggestion", {
        method: "POST",
        headers,
        body: JSON.stringify({ student, goals: window.SDG_DATA.goals })
      });
      if (!response.ok) throw new Error("Vision LLM unavailable");
      const result = await response.json();
      const task = result.task;
      return {
        id: "TASK-LLM-" + Date.now(),
        ...task,
        goalId: targetGoalId ? Number(targetGoalId) : task.goalId,
        department: student.department || "All Departments",
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "Active",
        participantsCount: 1
      };
    } catch (error) {
      console.info("Vision LLM task suggestion unavailable; using local generator.", error.message);
      return this.generateDynamicTaskForStudent(student, targetGoalId);
    }
  }

  // 2. AI Multi-Factor Verification (Supports both Technical DL Projects & Field Activities)
  async analyzeSubmissionEvidence(file, task, metadata = {}) {
    const isDl = task ? task.taskType === "technical_dl_project" : (metadata.taskType === "technical_dl_project");
    if (isDl) {
      const hasGithub = Boolean(metadata.githubRepoUrl && metadata.githubRepoUrl.includes("github.com"));
      return this.buildEvidenceResult("Needs Review", hasGithub ? 75 : 50, false, null,
        "Technical deliverables recorded for faculty review. Repository contents and model metrics are not verified by this browser-only client.",
        "Code evidence recorded; Vision-LLM and repository verification are not configured.");
    }

    if (!file || !file.type.startsWith("image/")) {
      return this.buildEvidenceResult("Needs Review", 0, false, null,
        "No image evidence was provided. Upload the original proof photo for forensic checks.",
        "Failed: an image file is required for EXIF and perceptual analysis.");
    }

    try {
      const [perceptualHash, exif] = await Promise.all([
        this.generatePerceptualHash(file),
        this.extractJpegExif(file)
      ]);
      const previousHashes = window.appState.state.submissions
        .map(submission => submission.verification && submission.verification.perceptualHash)
        .filter(Boolean);
      const duplicateHashMatch = previousHashes.some(previous => this.perceptualHashDistance(perceptualHash, previous) <= 6);
      const geo = this.verifyGeoFence(exif);

      return this.buildEvidenceResult("Needs Review", duplicateHashMatch || !geo.withinFence ? 35 : 86,
        duplicateHashMatch, perceptualHash,
        duplicateHashMatch
          ? "Duplicate Flag: this image is perceptually identical to a previous submission."
          : geo.withinFence
            ? "Image fingerprint is unique and GPS coordinates fall inside the campus fence. Visual semantic validation requires faculty review because no Vision-LLM provider is configured."
            : geo.reason,
        `EXIF: ${exif.present ? "found" : "missing"}; GPS: ${geo.reason}; Vision-LLM: not configured.`,
        { exif, geo, semanticValidation: "unavailable" });
    } catch (error) {
      return this.buildEvidenceResult("Needs Review", 0, false, null,
        `Forensic analysis could not complete: ${error.message}`,
        "Failed: the image could not be decoded for EXIF or perceptual analysis.");
    }
  }

  buildEvidenceResult(status, aiConfidence, duplicateHashMatch, perceptualHash, aiExplanation, metadataIntegrity, forensic = {}) {
    return { status, aiConfidence, duplicateHashMatch, perceptualHash, metadataIntegrity,
      detectedObjects: [], aiExplanation, forensic,
      analyzedAt: new Date().toISOString().replace("T", " ").substring(0, 19) };
  }

  async generatePerceptualHash(file) {
    const bitmap = await createImageBitmap(file);
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(bitmap, 0, 0, size, size);
    bitmap.close();
    const pixels = context.getImageData(0, 0, size, size).data;
    const luminance = [];
    for (let index = 0; index < pixels.length; index += 4) {
      luminance.push((pixels[index] * 299 + pixels[index + 1] * 587 + pixels[index + 2] * 114) / 1000);
    }
    const coefficients = [];
    for (let row = 0; row < 8; row++) {
      for (let column = 0; column < 8; column++) {
        let coefficient = 0;
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            coefficient += luminance[y * size + x]
              * Math.cos(((2 * x + 1) * column * Math.PI) / (2 * size))
              * Math.cos(((2 * y + 1) * row * Math.PI) / (2 * size));
          }
        }
        if (row || column) coefficients.push(coefficient);
      }
    }
    const sorted = [...coefficients].sort((first, second) => first - second);
    const median = sorted[Math.floor(sorted.length / 2)];
    return "pHash-" + coefficients.map(value => value >= median ? "1" : "0").join("");
  }

  perceptualHashDistance(first, second) {
    if (!first || !second || first.length !== second.length) return Number.MAX_SAFE_INTEGER;
    return Array.from(first).reduce((distance, value, index) => distance + (value !== second[index] ? 1 : 0), 0);
  }

  async extractJpegExif(file) {
    if (file.type !== "image/jpeg" && file.type !== "image/jpg") return { present: false, gps: null };
    const buffer = await file.arrayBuffer();
    const bytes = new DataView(buffer);
    if (bytes.getUint16(0, false) !== 0xffd8) return { present: false, gps: null };
    let offset = 2;
    while (offset + 4 < bytes.byteLength) {
      if (bytes.getUint8(offset) !== 0xff) { offset++; continue; }
      const marker = bytes.getUint8(offset + 1);
      const length = bytes.getUint16(offset + 2, false);
      if (marker === 0xe1 && this.readAscii(bytes, offset + 4, 6) === "Exif\0\0") return this.readExifGps(bytes, offset + 10);
      offset += 2 + length;
    }
    return { present: false, gps: null };
  }

  readAscii(bytes, offset, length) {
    return Array.from({ length }, (_, index) => String.fromCharCode(bytes.getUint8(offset + index))).join("");
  }

  readExifGps(bytes, tiffOffset) {
    const littleEndian = this.readAscii(bytes, tiffOffset, 2) === "II";
    const read16 = offset => bytes.getUint16(offset, littleEndian);
    const read32 = offset => bytes.getUint32(offset, littleEndian);
    const ifdOffset = tiffOffset + read32(tiffOffset + 4);
    const entryCount = read16(ifdOffset);
    let gpsOffset = null;
    for (let index = 0; index < entryCount; index++) {
      const entry = ifdOffset + 2 + index * 12;
      if (read16(entry) === 0x8825) gpsOffset = tiffOffset + read32(entry + 8);
    }
    if (!gpsOffset) return { present: true, gps: null };
    const gpsCount = read16(gpsOffset);
    const tags = {};
    for (let index = 0; index < gpsCount; index++) {
      const entry = gpsOffset + 2 + index * 12;
      tags[read16(entry)] = entry;
    }
    const readRef = tag => tags[tag] ? this.readAscii(bytes, tags[tag] + 8, 1) : null;
    const readRationals = tag => {
      const entry = tags[tag];
      if (!entry) return null;
      const start = tiffOffset + read32(entry + 8);
      return [0, 1, 2].map(index => read32(start + index * 8) / read32(start + index * 8 + 4));
    };
    const latitude = readRationals(2);
    const longitude = readRationals(4);
    if (!latitude || !longitude) return { present: true, gps: null };
    return { present: true, gps: {
      lat: (latitude[0] + latitude[1] / 60 + latitude[2] / 3600) * (readRef(1) === "S" ? -1 : 1),
      lng: (longitude[0] + longitude[1] / 60 + longitude[2] / 3600) * (readRef(3) === "W" ? -1 : 1)
    }};
  }

  verifyGeoFence(exif) {
    if (!exif.gps) return { withinFence: false, reason: "GPS EXIF coordinates are missing; faculty review is required." };
    const distance = this.distanceKm(this.campusGeoFence.lat, this.campusGeoFence.lng, exif.gps.lat, exif.gps.lng);
    return distance <= this.campusGeoFence.radiusKm
      ? { withinFence: true, distanceKm: distance.toFixed(2), reason: `GPS is ${distance.toFixed(2)} km from the campus reference.` }
      : { withinFence: false, distanceKm: distance.toFixed(2), reason: `GPS is ${distance.toFixed(2)} km from campus, outside the ${this.campusGeoFence.radiusKm} km fence.` };
  }

  distanceKm(lat1, lng1, lat2, lng2) {
    const radians = value => value * Math.PI / 180;
    const deltaLat = radians(lat2 - lat1);
    const deltaLng = radians(lng2 - lng1);
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(deltaLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // 3. Autonomous AI Task Assigner (Dynamically generates Technical Projects based on actual skills)
  generateDynamicTaskForStudent(student, targetGoalId = null) {
    const goals = window.SDG_DATA.goals;
    
    // Find goal matching student interests
    let selectedGoal;
    if (targetGoalId) {
      selectedGoal = goals.find(g => g.id === parseInt(targetGoalId));
    } else if (student.interests && student.interests.length > 0) {
      const interestStr = student.interests.join(" ").toLowerCase();
      // Simple heuristic match based on keywords
      selectedGoal = goals.find(g => interestStr.includes(g.name.toLowerCase()) || interestStr.includes(g.shortName.toLowerCase()) || g.name.toLowerCase().includes(student.interests[0].toLowerCase()));
    }
    
    if (!selectedGoal) {
      selectedGoal = goals[Math.floor(Math.random() * goals.length)];
    }

    const studentSkills = (student.skills && student.skills.length > 0) ? student.skills : ["Innovation"];
    const isCsStudent = (student.department && student.department.toLowerCase().includes("comp")) || 
                        studentSkills.some(s => s.toLowerCase().includes("python") || s.toLowerCase().includes("java") || s.toLowerCase().includes("code") || s.toLowerCase().includes("software") || s.toLowerCase().includes("web") || s.toLowerCase().includes("app") || s.toLowerCase().includes("deep") || s.toLowerCase().includes("ai"));

    if (isCsStudent) {
      const primarySkill = studentSkills[0];
      return {
        id: "TASK-TECH-" + Math.floor(200 + Math.random() * 800),
        title: `${primarySkill} Solution for SDG ${selectedGoal.id}: ${selectedGoal.shortName}`,
        goalId: selectedGoal.id,
        taskType: "technical_dl_project",
        points: 300,
        difficulty: "Advanced",
        matchedSkills: studentSkills,
        description: `Develop a technical project using ${primarySkill} to solve a challenge related to ${selectedGoal.name}.`,
        verificationRules: `Submit GitHub repo link and a working demo or screenshots of your ${primarySkill} solution.`,
        milestones: [
          { index: 1, title: "Requirements & Architecture", weight: 25, deliverables: "System design and environment setup" },
          { index: 2, title: "Core Implementation", weight: 25, deliverables: `GitHub repo with initial ${primarySkill} codebase` },
          { index: 3, title: "Testing & Validation", weight: 25, deliverables: "Test results and optimization" },
          { index: 4, title: "Final Deployment", weight: 25, deliverables: "Live Demo URL & SDG Impact Report" }
        ],
        department: student.department || "All Departments",
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "Active",
        isAiGenerated: true,
        participantsCount: 1,
        createdBy: "Autonomous AI Task Assigner"
      };
    }

    // Standard Field Activity for non-CS students
    return {
      id: "TASK-AI-" + Math.floor(100 + Math.random() * 900),
      title: `Campus ${selectedGoal.shortName} Action & Assessment`,
      goalId: selectedGoal.id,
      department: student.department || "All Departments",
      points: 150,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "Active",
      difficulty: "Intermediate",
      taskType: "field_activity",
      isAiGenerated: true,
      matchedSkills: [studentSkills[0] || "Campus Action", "Sustainability"],
      description: `AI-customized challenge for ${student.name}. Conduct a localized campus intervention supporting UN SDG ${selectedGoal.id}: ${selectedGoal.tagline}.`,
      verificationRules: "Upload clear photo of the implemented solution with date placard.",
      milestones: [],
      participantsCount: 1,
      createdBy: "Autonomous AI Task Assigner"
    };
  }

  // 4. AI Faculty Task Idea Generator (Supports both Field & DL Project ideas)
  generateFacultyTaskIdeas(goalId, department) {
    const goal = window.SDG_DATA.goals.find(g => g.id === parseInt(goalId)) || window.SDG_DATA.goals[11];
    
    return [
      {
        title: `Deep Learning Computer Vision Model for ${goal.shortName} Detection`,
        taskType: "technical_dl_project",
        points: 300,
        difficulty: "Advanced",
        description: `Students develop and train a PyTorch/YOLO vision model to detect and classify objects supporting ${goal.name}.`,
        verificationRules: "Submit all 4 Milestones: Dataset, GitHub repo, Training loss curves, and Demo."
      },
      {
        title: `Campus IoT Sensor Deployment & Telemetry for ${goal.shortName}`,
        taskType: "field_activity",
        points: 200,
        difficulty: "Intermediate",
        description: `Install or monitor IoT telemetry nodes capturing real-time sustainability indicators supporting ${goal.name}.`,
        verificationRules: "Screenshot of live telemetry dashboard and photo of physical sensor installation with geotag."
      },
      {
        title: `Zero-Footprint Audit & Action for ${department || "Department Labs"}`,
        taskType: "field_activity",
        points: 150,
        difficulty: "Beginner",
        description: `Conduct a resource and power-down audit across departmental computer labs and workshops.`,
        verificationRules: "Photo of signed audit checklist and labeled equipment switches."
      }
    ];
  }
}

window.sdgAiEngine = new SdgAiEngine();
