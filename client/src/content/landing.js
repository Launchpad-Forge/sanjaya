export const landing = {
  hero: {
    h1: "One camera. The whole building.",
    sub: "Sanjaya turns an ordinary phone or drone camera into a live 3D map your team can see, search and navigate — before anyone steps inside.",
    primaryBtn: "Try it with your phone",
    secondaryBtn: "Read the research",
    smallLine: "Open research prototype. Any camera. No LiDAR, no GPS.",
  },
  problem: {
    h2: "Most teams still go in blind.",
    body: "Floor plans are missing or out of date. GPS stops at the door. Footage gets reviewed afterwards, frame by frame. The most dangerous moment of any entry is the first one, and it happens with the least information."
  },
  howItWorks: {
    steps: [
      {
        title: "Point",
        body: "Walk with any camera. Your phone streams a few frames a second."
      },
      {
        title: "Rebuild",
        body: "Research models recover depth and position from pixels alone."
      },
      {
        title: "Understand",
        body: "Rooms, doors, stairs and objects are named and placed in 3D."
      },
      {
        title: "Share",
        body: "Everyone on the mission sees the map grow, live."
      }
    ]
  },
  showcases: [
    {
      title: "Live, not later.",
      body: "The team lead sees the building while the scout is still inside it. No upload. No overnight processing.",
      slot: "live-shared",
      tone: "dark"
    },
    {
      title: "A map you can think with.",
      body: "Alongside the full 3D map, Sanjaya keeps a mental map: rooms, places and the things in them, linked as a graph. Small enough for a weak radio link. Simple enough for a robot to plan on.",
      stats: {
        denseMB: null, // "to be measured"
        graphKB: null  // "to be measured"
      },
      slot: "mental-map",
      tone: "light"
    },
    {
      title: "It shows what it hasn't seen.",
      body: "Unexplored space is marked on the map. Every detection carries a confidence score and the frame that proves it.",
      slot: "coverage",
      tone: "dark"
    },
    {
      title: "Ask the map.",
      body: "“Where’s the nearest exit?” Answers are computed from the map itself and highlighted where they are.",
      list: [
        "Where is the stairwell?",
        "Show me all the unchecked rooms.",
        "What is the fastest route out?"
      ],
      slot: "ask-map",
      tone: "light"
    }
  ],
  whereItMatters: {
    lead: "Pre-entry building intelligence — know the layout, exits and unchecked rooms before a team goes in.",
    list: [
      "Disaster response (collapsed buildings, landslides, tunnels)",
      "Tunnels and underground spaces",
      "Ship boarding",
      "Robots and drones that need a map they can reason over",
      "Perimeter and route change detection"
    ]
  },
  research: {
    h2: "Standing on open research.",
    list: [
      { title: "VGGT-SLAM 2.0", source: "MIT SPARK Lab" },
      { title: "Hydra 3D scene graphs", source: "MIT SPARK Lab" },
      { title: "LingBot-Map", source: "streaming reconstruction" },
      { title: "MapAnything", source: "Meta & CMU" },
      { title: "MASt3R-SLAM", source: "Imperial College London" },
      { title: "SAM 3", source: "Meta" }
    ],
    linkText: "How Sanjaya builds on them"
  },
  principles: {
    h2: "Built to be trusted.",
    list: [
      {
        title: "Human in the loop",
        body: "Every detection is confirmed or rejected by a person. (Aligned with the US DoD AI ethical principles, NATO Principles of Responsible Use and NITI Aayog's Responsible AI principles.)"
      },
      {
        title: "Situational awareness only",
        body: "Sanjaya maps and describes spaces; it is not a targeting system."
      },
      {
        title: "Private by default",
        body: "Faces blurred on the phone before upload; guest sessions are never stored. (Designed around India's DPDP Act 2023 and GDPR.)"
      },
      {
        title: "Secure by design",
        body: "Built against the OWASP Top 10 and OWASP API Security Top 10."
      },
      {
        title: "Accessible",
        body: "WCAG 2.2 AA."
      },
      {
        title: "Robot-ready",
        body: "Map frames follow ROS 2 conventions (REP-103, REP-105)."
      }
    ],
    linkText: "Read our responsible use policy"
  },
  roadmap: {
    h2: "Roadmap",
    items: [
      { time: "Now", desc: "Live mapping from a phone on a cloud GPU" },
      { time: "Next", desc: "Mental-map export for ROS 2 robots, multi-camera merge" },
      { time: "Later", desc: "On-board mapping on drones and robots with no network, thermal cameras" }
    ]
  },
  openResearch: {
    h2: "This is open research. Join it.",
    body: "Sanjaya is open source. Bring a model, a dataset, a use case or a hard question.",
    primaryBtn: "Share an idea",
    secondaryBtn: "View on GitHub"
  },
  faq: [
    {
      q: "Does it need LiDAR or special hardware?",
      a: "No. It runs entirely on video frames from standard RGB cameras (phones, GoPros, drones)."
    },
    {
      q: "Is my video stored?",
      a: "Guest sessions are completely ephemeral. Frames are processed to update the map and then discarded. Faces and license plates are blurred on-device before transmission."
    },
    {
      q: "How accurate is it?",
      a: "Single-camera scale is learned and approximate. It is designed for situational awareness, not millimetre-accurate surveying. See our benchmarks for details."
    },
    {
      q: "Is this a weapon system?",
      a: "No. Sanjaya provides situational awareness. It maps and describes spaces; it is not a targeting system and keeps a human in the loop."
    },
    {
      q: "Can it run on our own servers?",
      a: "Yes. Sanjaya is open source and can be self-hosted on your own infrastructure or run locally on a workstation with a GPU."
    },
    {
      q: "How can I contribute?",
      a: "We welcome code, models, datasets, and use cases. Check out our GitHub repository or share an idea directly."
    }
  ]
};
