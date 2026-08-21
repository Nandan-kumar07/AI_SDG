// SDG Antigravity Data Store
// Seed data for 17 SDGs, Quizzes, Activities, CS Deep Learning Mini-Projects, Students, and Submissions

window.SDG_DATA = {
  // 17 UN Sustainable Development Goals
  goals: [
    {
      id: 1, number: "01", name: "No Poverty", shortName: "No Poverty",
      tagline: "End poverty in all its forms everywhere", color: "#E5243B",
      icon: "fa-solid fa-hand-holding-dollar",
      vision: "Eradicate extreme poverty globally, build resilience among vulnerable communities, and guarantee equal rights to economic resources.",
      category: "Society", campusImpact: "Textbook donation drives, student hardship emergency funds, and community tutoring.",
      keyTargets: ["Eradicate extreme poverty for all.", "Ensure equal access to economic resources."]
    },
    {
      id: 2, number: "02", name: "Zero Hunger", shortName: "Zero Hunger",
      tagline: "End hunger, achieve food security and improved nutrition", color: "#DDA63A",
      icon: "fa-solid fa-wheat-awn",
      vision: "Ensure year-round access to safe, nutritious food and promote resilient, sustainable agriculture practices.",
      category: "Biosphere", campusImpact: "Hostel food waste audits, surplus meal recovery, and campus organic composting.",
      keyTargets: ["End hunger and ensure food access.", "Promote sustainable agriculture."]
    },
    {
      id: 3, number: "03", name: "Good Health and Well-being", shortName: "Good Health",
      tagline: "Ensure healthy lives and promote well-being for all at all ages", color: "#4C9F38",
      icon: "fa-solid fa-heart-pulse",
      vision: "Universal health coverage, mental wellness support, and active healthy lifestyles.",
      category: "Society", campusImpact: "Mental wellness workshops, blood donation camps, and campus yoga marathons.",
      keyTargets: ["Promote mental health and emotional well-being.", "Achieve universal healthcare access."]
    },
    {
      id: 4, number: "04", name: "Quality Education", shortName: "Quality Education",
      tagline: "Ensure inclusive and equitable quality education", color: "#C5192D",
      icon: "fa-solid fa-graduation-cap",
      vision: "Equitable education, open educational resources, and STEM training for underserved schools.",
      category: "Society", campusImpact: "Mentoring rural school kids in coding & robotics, peer tutoring pods.",
      keyTargets: ["Ensure equal access to affordable technical education.", "Increase youth digital skills."]
    },
    {
      id: 5, number: "05", name: "Gender Equality", shortName: "Gender Equality",
      tagline: "Achieve gender equality and empower all women and girls", color: "#FF3A21",
      icon: "fa-solid fa-venus-mars",
      vision: "Eliminate discrimination, ensure leadership representation, and foster safe academic environments.",
      category: "Society", campusImpact: "Women in STEM hackathons, leadership mentorship, and campus safety audits.",
      keyTargets: ["End all forms of discrimination.", "Ensure women full participation in leadership."]
    },
    {
      id: 6, number: "06", name: "Clean Water and Sanitation", shortName: "Clean Water",
      tagline: "Ensure availability and sustainable management of water", color: "#26BDE2",
      icon: "fa-solid fa-droplet",
      vision: "Clean drinking water access, reduction of pollution, rainwater harvesting, and smart water management.",
      category: "Biosphere", campusImpact: "Campus IoT smart water leak detectors, rainwater catchment restoration, lake cleanups.",
      keyTargets: ["Achieve safe drinking water for all.", "Substantially increase water-use efficiency."]
    },
    {
      id: 7, number: "07", name: "Affordable and Clean Energy", shortName: "Clean Energy",
      tagline: "Ensure access to affordable, reliable, sustainable and modern energy", color: "#FCC30B",
      icon: "fa-solid fa-solar-panel",
      vision: "Accelerate renewable energy adoption, boost energy efficiency, and transition away from fossil fuels.",
      category: "Economy", campusImpact: "Rooftop solar monitoring dashboards, campus smart lighting retrofits, bicycle charging hubs.",
      keyTargets: ["Increase the share of renewable energy.", "Double the global rate of energy efficiency."]
    },
    {
      id: 8, number: "08", name: "Decent Work and Economic Growth", shortName: "Decent Work",
      tagline: "Promote sustained, inclusive and sustainable economic growth", color: "#A21942",
      icon: "fa-solid fa-briefcase",
      vision: "Promote innovation, entrepreneurship, youth employment, and safe working conditions.",
      category: "Economy", campusImpact: "Student green startup incubators, ethical career fairs, freelance gig skill training.",
      keyTargets: ["Achieve higher levels of productivity through innovation.", "Promote safe work environments."]
    },
    {
      id: 9, number: "09", name: "Industry, Innovation and Infrastructure", shortName: "Innovation",
      tagline: "Build resilient infrastructure, promote sustainable industrialization and foster innovation", color: "#FD6925",
      icon: "fa-solid fa-industry",
      vision: "Foster technological research, develop resilient green infrastructure, and support sustainable industrial processes.",
      category: "Economy", campusImpact: "AI for Sustainability labs, smart IoT campus testbeds, circular economy prototyping.",
      keyTargets: ["Upgrade technological capabilities of industrial sectors.", "Enhance scientific research."]
    },
    {
      id: 10, number: "10", name: "Reduced Inequalities", shortName: "Reduced Inequalities",
      tagline: "Reduce inequality within and among countries", color: "#DD1367",
      icon: "fa-solid fa-scale-balanced",
      vision: "Promote universal social, economic, and political inclusion.",
      category: "Society", campusImpact: "Campus wheelchair accessibility mapping, assistive tech projects, digital divide bridging.",
      keyTargets: ["Empower and promote social, economic and political inclusion for all."]
    },
    {
      id: 11, number: "11", name: "Sustainable Cities and Communities", shortName: "Sustainable Cities",
      tagline: "Make cities inclusive, safe, resilient and sustainable", color: "#FD9D24",
      icon: "fa-solid fa-city",
      vision: "Safe public spaces, accessible green transport, cultural heritage preservation, and disaster risk reduction.",
      category: "Biosphere", campusImpact: "Campus pedestrianization advocacy, EV shuttle scheduling apps, heritage tree mapping.",
      keyTargets: ["Provide access to safe, sustainable transport.", "Reduce environmental impact of cities."]
    },
    {
      id: 12, number: "12", name: "Responsible Consumption and Production", shortName: "Responsible Consumption",
      tagline: "Ensure sustainable consumption and production patterns", color: "#BF8B2E",
      icon: "fa-solid fa-arrows-rotate",
      vision: "Halve per capita food waste, promote 3R (Reduce, Reuse, Recycle), and eliminate single-use plastics.",
      category: "Economy", campusImpact: "Zero single-use plastic campus pledge, swap-shops for electronics, e-waste dismantling workshops.",
      keyTargets: ["Halve food waste.", "Substantially reduce waste through prevention, recycling and reuse."]
    },
    {
      id: 13, number: "13", name: "Climate Action", shortName: "Climate Action",
      tagline: "Take urgent action to combat climate change and its impacts", color: "#3F7E44",
      icon: "fa-solid fa-cloud-sun-rain",
      vision: "Strengthen climate resilience, institutionalize carbon footprint tracking, and educate on climate adaptation.",
      category: "Biosphere", campusImpact: "Campus Carbon Footprint calculator, Miyawaki micro-forest planting, climate policy hackathons.",
      keyTargets: ["Strengthen resilience to climate hazards.", "Improve education on climate change mitigation."]
    },
    {
      id: 14, number: "14", name: "Life Below Water", shortName: "Life Below Water",
      tagline: "Conserve and sustainably use the oceans, seas and marine resources", color: "#0A97D9",
      icon: "fa-solid fa-water",
      vision: "Prevent marine pollution, stop ocean acidification, and restore fragile aquatic ecosystems.",
      category: "Biosphere", campusImpact: "River basin microplastic studies, local wetland conservation, clean waterways campaigns.",
      keyTargets: ["Prevent and significantly reduce marine pollution of all kinds."]
    },
    {
      id: 15, number: "15", name: "Life on Land", shortName: "Life on Land",
      tagline: "Protect, restore and promote sustainable use of terrestrial ecosystems", color: "#56C02B",
      icon: "fa-solid fa-tree",
      vision: "Halt biodiversity loss, reverse land degradation, and reforest degraded lands.",
      category: "Biosphere", campusImpact: "Native biodiversity census, 1000-tree afforestation drives, seed-bomb making.",
      keyTargets: ["Halt deforestation and restore degraded forests.", "Halt the loss of biodiversity."]
    },
    {
      id: 16, number: "16", name: "Peace, Justice and Strong Institutions", shortName: "Peace & Justice",
      tagline: "Promote peaceful and inclusive societies, provide access to justice", color: "#00689D",
      icon: "fa-solid fa-gavel",
      vision: "Promote the rule of law, eradicate corruption, and foster transparent, accountable institutions.",
      category: "Governance", campusImpact: "Campus student council transparency portals, dispute resolution mediation cells.",
      keyTargets: ["Substantially reduce corruption.", "Develop effective, accountable and transparent institutions."]
    },
    {
      id: 17, number: "17", name: "Partnerships for the Goals", shortName: "Partnerships",
      tagline: "Strengthen the means of implementation and revitalize global partnerships", color: "#19486A",
      icon: "fa-solid fa-handshake-angle",
      vision: "Multi-stakeholder partnerships mobilizing resources, technology sharing, and cross-border innovation.",
      category: "Governance", campusImpact: "Inter-university sustainability consortiums, open SDG data hackathons.",
      keyTargets: ["Enhance international cooperation on technology and innovation."]
    }
  ],

  // Activities, Field Actions, and CS Deep Learning Technical Projects
  activities: [
    {
      id: "TASK-DL-201",
      title: "Campus Waste Segregation YOLOv8 Deep Learning Classifier",
      goalId: 12,
      department: "Computer Science & Engineering / AI & ML",
      points: 300,
      deadline: "2026-09-30",
      status: "Active",
      difficulty: "Advanced",
      taskType: "technical_dl_project",
      aiAssigned: true,
      matchedSkills: ["Python", "Deep Learning", "PyTorch", "Computer Vision", "YOLO"],
      description: "Develop and train an end-to-end Computer Vision Deep Learning model (YOLOv8 / ResNet) to detect and classify campus waste items (Plastic, Organic, E-Waste, Paper) from camera frames to automate campus smart bins.",
      verificationRules: "Complete all 4 Milestones: Dataset Curation, GitHub Repo with Model Code, Training Loss Curves (>90% accuracy), and Live Demo link.",
      milestones: [
        { index: 1, title: "Dataset Curation & Augmentation", weight: 25, deliverables: "Kaggle/Roboflow campus waste dataset link with at least 4 classes" },
        { index: 2, title: "Model Architecture & Pipeline", weight: 25, deliverables: "GitHub repository with documented train.py and model architecture" },
        { index: 3, title: "Training & Loss Curve Validation", weight: 25, deliverables: "TensorBoard/Matplotlib loss curve plot and confusion matrix (>90% accuracy)" },
        { index: 4, title: "Live Demo & SDG Impact Report", weight: 25, deliverables: "Streamlit/Gradio live demo link and sample inference predictions" }
      ],
      participantsCount: 38,
      createdBy: "AI Task Manager"
    },
    {
      id: "TASK-DL-202",
      title: "LSTM Neural Network for Solar Inverter Generation & Load Forecasting",
      goalId: 7,
      department: "Computer Science / EEE / AI",
      points: 280,
      deadline: "2026-09-25",
      status: "Active",
      difficulty: "Advanced",
      taskType: "technical_dl_project",
      aiAssigned: true,
      matchedSkills: ["Python", "Deep Learning", "LSTM", "Time Series", "Energy Analytics"],
      description: "Build a Long Short-Term Memory (LSTM) or Transformer time-series deep learning model to forecast rooftop solar PV power output (kW) based on weather and irradiance data.",
      verificationRules: "Submit GitHub repo with time-series preprocessing, train/test MAE loss curves, and prediction overlay chart.",
      milestones: [
        { index: 1, title: "Telemetry Dataset Prep", weight: 25, deliverables: "Solar irradiance & kW telemetry time-series dataset" },
        { index: 2, title: "LSTM / GRU Model Design", weight: 25, deliverables: "GitHub code with sliding-window sequence preprocessing" },
        { index: 3, title: "RMSE & Loss Optimization", weight: 25, deliverables: "Training loss vs validation loss plot (RMSE < 0.15)" },
        { index: 4, title: "Forecast Dashboard & Report", weight: 25, deliverables: "Overlay plot of Predicted vs Actual generation" }
      ],
      participantsCount: 24,
      createdBy: "AI Task Manager"
    },
    {
      id: "TASK-101",
      title: "Campus Plastic-Free Audit & Segregation Drive",
      goalId: 12,
      department: "All Departments",
      points: 150,
      deadline: "2026-08-30",
      status: "Active",
      difficulty: "Intermediate",
      taskType: "field_activity",
      aiAssigned: false,
      matchedSkills: ["Field Audit", "Data Collection", "Environmental Analysis"],
      description: "Perform a 2-hour single-use plastic audit in the student cafeteria or hostel area. Categorize collected items into recyclables and non-recyclables, calculate estimated weekly reduction, and submit photo proof.",
      verificationRules: "Upload photo of segregated bins with handwritten placard showing date and USN. EXIF timestamp must match submission day.",
      milestones: [],
      participantsCount: 42,
      createdBy: "Dr. Sarah Johnson (Faculty Chair)"
    },
    {
      id: "TASK-102",
      title: "Rooftop Solar Efficiency & Shading Analysis",
      goalId: 7,
      department: "ECE / EEE / MECH",
      points: 200,
      deadline: "2026-09-05",
      status: "Active",
      difficulty: "Advanced",
      taskType: "field_activity",
      aiAssigned: true,
      matchedSkills: ["IoT", "Circuit Design", "Renewable Energy"],
      description: "Inspect the Engineering Block solar PV installation. Record generation readings from the inverter display at 10 AM, 1 PM, and 4 PM. Identify any dust accumulation or shading obstructions.",
      verificationRules: "Clear photo of inverter readout LCD displaying kW generated with campus landmark in background.",
      milestones: [],
      participantsCount: 28,
      createdBy: "Prof. Arvind Raman (Dept of EEE)"
    },
    {
      id: "TASK-103",
      title: "Native Biodiversity Census & Micro-Planting",
      goalId: 15,
      department: "All Departments",
      points: 120,
      deadline: "2026-08-28",
      status: "Active",
      difficulty: "Beginner",
      taskType: "field_activity",
      aiAssigned: false,
      matchedSkills: ["Botany", "Photography", "Ecosystem Tracking"],
      description: "Plant 2 native saplings in the designated campus green corridor or take geo-tagged photos of 5 native flora/fauna species on campus.",
      verificationRules: "Geo-tagged photo of sapling planting with student ID card next to sapling.",
      milestones: [],
      participantsCount: 65,
      createdBy: "Dr. Sarah Johnson (Faculty Chair)"
    }
  ],

  // Quizzes
  quizzes: [
    {
      topicId: "climate-13",
      goalId: 13,
      title: "SDG 13: Climate Action & Carbon Footprint Masterclass",
      badge: "Climate Sentinel",
      icon: "fa-solid fa-cloud-sun-rain",
      color: "#3F7E44",
      timeLimitSeconds: 120,
      questions: [
        {
          id: "q1",
          question: "What is the global temperature rise limit targeted by the Paris Climate Agreement?",
          options: [
            "Well below 2.0°C, aiming for 1.5°C above pre-industrial levels",
            "Below 3.5°C above pre-industrial levels",
            "Exactly 0.5°C above pre-industrial levels",
            "No limit set as long as carbon trading is active"
          ],
          correctIndex: 0,
          explanation: "The Paris Agreement aims to hold global average temperature increase to well below 2°C above pre-industrial levels and pursue efforts to limit it to 1.5°C."
        },
        {
          id: "q2",
          question: "Which greenhouse gas has a global warming potential (GWP) roughly 28-36 times higher than CO2 over 100 years?",
          options: ["Methane (CH4)", "Water Vapor (H2O)", "Nitrogen (N2)", "Argon (Ar)"],
          correctIndex: 0,
          explanation: "Methane is a potent greenhouse gas with a warming potential estimated between 28 and 36 times that of CO2 over a century."
        },
        {
          id: "q3",
          question: "What does 'Net Zero emissions' specifically mean for an institution?",
          options: [
            "Emitting zero carbon by shutting down all electricity",
            "Balancing greenhouse gas emissions produced with an equivalent amount removed from the atmosphere",
            "Only purchasing carbon offsets without reducing actual emissions",
            "Relying entirely on coal with scrubbers"
          ],
          correctIndex: 1,
          explanation: "Net Zero means achieving an overall balance between emissions produced and emissions sequestered or removed from the atmosphere."
        }
      ]
    },
    {
      topicId: "energy-7",
      goalId: 7,
      title: "SDG 7: Affordable & Clean Energy Technologies",
      badge: "Clean Spark Pioneer",
      icon: "fa-solid fa-bolt",
      color: "#FCC30B",
      timeLimitSeconds: 120,
      questions: [
        {
          id: "q1",
          question: "Which renewable energy source converts sunlight directly into electricity via the photovoltaic effect?",
          options: ["Solar Photovoltaic (PV) Panels", "Concentrated Solar Thermal (CSP)", "Geothermal binary turbines", "Hydroelectric wheels"],
          correctIndex: 0,
          explanation: "Solar PV panels utilize semiconductor materials to convert photons directly into electric current through the photovoltaic effect."
        },
        {
          id: "q2",
          question: "What is the primary benefit of a 'Smart Microgrid' on a university campus?",
          options: [
            "Allows the campus to intelligently balance renewable generation, battery storage, and grid demand with resilience during outages",
            "Increases electricity consumption by 50%",
            "Bans laptop use after sunset",
            "Replaces all cables with satellite microwaves"
          ],
          correctIndex: 0,
          explanation: "Smart microgrids optimize local renewable energy generation, battery storage, and critical loads with resilience."
        }
      ]
    },
    {
      topicId: "consumption-12",
      goalId: 12,
      title: "SDG 12: Circular Economy & Zero Waste Habits",
      badge: "Circular Champion",
      icon: "fa-solid fa-arrows-rotate",
      color: "#BF8B2E",
      timeLimitSeconds: 120,
      questions: [
        {
          id: "q1",
          question: "In the Waste Hierarchy, which step provides the greatest environmental benefit?",
          options: ["Refuse / Prevention (Source Reduction)", "Recycling into low-grade plastic", "Incineration for energy recovery", "Engineered Landfill"],
          correctIndex: 0,
          explanation: "Preventing waste before it is created (Refusing & Reducing) saves raw materials and pollution most effectively."
        },
        {
          id: "q2",
          question: "What constitutes a 'Circular Economy' compared to a traditional linear economy?",
          options: [
            "Designing out waste and keeping materials/products in loop use indefinitely through repair, reuse, and remanufacturing",
            "Take, Make, and Dispose model",
            "Dumping waste into circular trenches",
            "Printing round coins instead of rectangular paper money"
          ],
          correctIndex: 0,
          explanation: "A circular economy aims to design out waste and pollution, keep products in use, and regenerate natural systems."
        }
      ]
    }
  ],

  // Seed Students
  students: [
    {
      id: "STU-001",
      name: "Akash Sharma",
      usn: "1RV22CS045",
      department: "Computer Science & Engineering",
      email: "akash.cs22@campus.edu",
      phone: "+91 98765 43210",
      skills: ["Python", "Deep Learning", "PyTorch", "Computer Vision", "IoT Sensor Data"],
      interests: ["Clean Energy (SDG 7)", "Climate Action (SDG 13)", "Responsible Consumption (SDG 12)"],
      points: 1240,
      tasksCompletedCount: 14,
      ongoingTasksCount: 2,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      sdgCoverage: { 7: 4, 13: 5, 12: 3, 6: 1, 4: 1 },
      badges: ["Climate Sentinel", "Clean Spark Pioneer", "Deep Learning Changemaker", "Zero-Waste Hero"]
    },
    {
      id: "STU-002",
      name: "Ananya Deshmukh",
      usn: "1RV22AI012",
      department: "Artificial Intelligence & ML",
      email: "ananya.ai22@campus.edu",
      phone: "+91 98450 11223",
      skills: ["Computer Vision", "Neural Networks", "Data Visualization", "YOLO"],
      interests: ["Quality Education (SDG 4)", "Gender Equality (SDG 5)", "Climate Action (SDG 13)"],
      points: 1180,
      tasksCompletedCount: 13,
      ongoingTasksCount: 1,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      sdgCoverage: { 4: 6, 5: 3, 13: 3, 9: 1 },
      badges: ["STEM Mentor", "Eco Innovator", "Equity Ambassador"]
    },
    {
      id: "STU-003",
      name: "Rohan Varma",
      usn: "1RV22ME088",
      department: "Mechanical Engineering",
      email: "rohan.me22@campus.edu",
      phone: "+91 91234 56789",
      skills: ["3D CAD", "Renewable Energy Systems", "Thermodynamics"],
      interests: ["Affordable and Clean Energy (SDG 7)", "Sustainable Cities (SDG 11)"],
      points: 1050,
      tasksCompletedCount: 11,
      ongoingTasksCount: 2,
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
      sdgCoverage: { 7: 6, 11: 3, 12: 2 },
      badges: ["Solar Tech Lead", "Urban Planner"]
    }
  ],

  // Faculty Accounts
  faculty: [
    {
      id: "FAC-101",
      name: "Dr. Sarah Johnson",
      department: "Environmental Engineering",
      email: "sarah.johnson@campus.edu",
      phone: "+91 98800 12345",
      designation: "Associate Professor & Sustainability Chair",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "FAC-102",
      name: "Dr. Deepa Nair",
      department: "Computer Science & Engineering",
      email: "deepa.nair@campus.edu",
      phone: "+91 98800 67890",
      designation: "Professor & Head of AI Research",
      avatar: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80"
    }
  ],

  // Submissions including Technical Deep Learning Milestone deliverables
  submissions: [
    {
      id: "SUB-DL-901",
      taskId: "TASK-DL-201",
      taskTitle: "Campus Waste Segregation YOLOv8 Deep Learning Classifier",
      sdgGoalId: 12,
      studentId: "STU-001",
      studentName: "Akash Sharma",
      usn: "1RV22CS045",
      department: "Computer Science & Engineering",
      taskType: "technical_dl_project",
      milestoneIndex: 3,
      submittedAt: "2026-08-15 11:30:00",
      impactSummary: "Completed Milestone 3: Model training and validation. Trained YOLOv8m on 1,850 augmented campus waste images over 50 epochs. Achieved 93.4% mAP@0.5 and 0.91 F1-Score.",
      githubRepoUrl: "https://github.com/akash-sharma/campus-waste-yolov8",
      colabNotebookUrl: "https://colab.research.google.com/drive/sample-sdg12-waste-classifier",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80",
      trainingLossPlotUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80",
      modelMetricsSummary: {
        architecture: "YOLOv8m Transfer Learning",
        mAP: "93.4%",
        f1Score: "0.91",
        epochsTrained: 50,
        classes: ["PET Plastic", "Organic Food Waste", "E-Waste Batteries", "Paper/Cardboard"]
      },
      liveDemoUrl: "https://huggingface.co/spaces/campus-waste-vision",
      verification: {
        status: "Needs Review", // Pending faculty review
        aiConfidence: 94,
        duplicateHashMatch: false,
        metadataIntegrity: "Passed (GitHub repository public and contains valid train.py & dataset.yaml)",
        detectedObjects: ["training loss curve", "confusion matrix", "bounding box inference"],
        aiExplanation: "AI Code Analysis: Genuine PyTorch/YOLO implementation with converging validation loss (mAP 93.4%). Ready for faculty technical evaluation.",
        reviewedBy: "Pending Faculty Technical Review",
        reviewTimestamp: null,
        facultyFeedback: ""
      },
      pointsAwarded: 0
    },
    {
      id: "SUB-801",
      taskId: "TASK-101",
      taskTitle: "Campus Plastic-Free Audit & Segregation Drive",
      sdgGoalId: 12,
      studentId: "STU-001",
      studentName: "Akash Sharma",
      usn: "1RV22CS045",
      department: "Computer Science & Engineering",
      taskType: "field_activity",
      submittedAt: "2026-08-14 14:35:10",
      impactSummary: "Audited Central Canteen waste bins. Separated 4.8 kg of single-use PET bottles and directed them to the mechanical shredder unit.",
      location: "Campus Central Canteen Hub",
      imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80",
      verification: {
        status: "Verified",
        aiConfidence: 94,
        duplicateHashMatch: false,
        metadataIntegrity: "Passed (EXIF matches device & campus geo-fence)",
        detectedObjects: ["recycling bin", "plastic bottles", "waste audit placard"],
        aiExplanation: "Neural image classifier identified correct sorting bins and legible verification placard.",
        reviewedBy: "AI Auto-Validator",
        reviewTimestamp: "2026-08-14 14:35:15",
        facultyFeedback: "Automated instant verification approved."
      },
      pointsAwarded: 150
    }
  ]
};
