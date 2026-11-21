const logotext = "vicky";

const meta = {
  title: "vicky",
  description:
    "Full Stack Developer. I build products end-to-end — from database architecture to pixel-perfect UI."
};

const github_username = "vickydecodes";

const introdata = {
  title: "I'm Vicky",
  animated: {
    first: "Crafting innovative code",
    second: "Building dynamic websites",
    third: "Developing robust web apps",
  },
  description:
    "Full Stack Developer. I build products end-to-end — from database architecture to pixel-perfect UI. Clean code, intentional design, no shortcuts. Also probably thinking about One Piece right now.",
  your_img_url: "/resume/my_img6.png",
};

const dataabout = {
  title: "A bit about me",
  aboutme:
    "I'm Vignesh — Full Stack Developer. I work across the full stack: system architecture, APIs, UI, deployment — the whole picture. No templates, no shortcuts — just well-built products that actually do what they promise.",
};

const worktimeline = [
  { jobtitle: "Forward Deployed Engineer (FDE)", where: "RR Donnelley", date: "Present" },
  { jobtitle: "Full Stack Developer", where: "Freelance", date: "2025 – Present" },
  {
    jobtitle: "Web Developer",
    where: "Innotech Titans",
    date: "2024 – Present",
  },
  {
    jobtitle: "Full Stack Developer",
    where: "Freelance",
    date: "2023 – 2025",
  },
];

const skills = [
  { name: "JavaScript", value: 88 },
  { name: "TypeScript", value: 80 },
  { name: "React / Next.js", value: 85 },
  { name: "Node.js", value: 88 },
  { name: "Express.js", value: 85 },
  { name: "MongoDB", value: 80 },
  { name: "REST API Architecture", value: 88 },
  { name: "Authentication & Authorization", value: 82 },
  { name: "Tailwind CSS", value: 90 },
  { name: "CSS / Responsive Design", value: 85 },
  { name: "Git & GitHub", value: 85 },
  { name: "Firebase", value: 75 },
  { name: "Docker", value: 65 },
  { name: "Deployment (Vercel / Render / VPS)", value: 75 },
  { name: "System Design (Small–Mid Scale Apps)", value: 70 },
];

const beyondProfession = [
  {
    title: "Anime",
    description:
      "Big anime fan — One Piece and Attack on Titan at the top. Stories about freedom, conviction, and not giving up hit differently. Luffy's 「海賊王に俺はなる！」 and Eren's 「駆逐してやる！」 are more than lines — they're reminders that ambition and stubbornness, in the right direction, are actually virtues.",
  },
  {
    title: "Movies",
    description:
      "I watch across genres — not just for entertainment, but for the way good storytelling reshapes how you see things. Cinema at its best makes you think differently about the world you already live in.",
  },
  {
    title: "Reading",
    description:
      "Actively building a reading habit. Books force you to slow down in a way that screens don't — and that slowness, I've found, sharpens everything else.",
  },
];

const services = [
  {
    title: "Website Development",
    description:
      "Fast, responsive, production-ready websites. React on the front, Node + MongoDB on the back. Real code — no page builders, no drag-and-drop — that holds up when it actually needs to.",
  },
  {
    title: "Web Applications",
    description:
      "Full-stack web apps built for real users doing real work. Performant, maintainable, and designed to handle actual load — not just a demo environment.",
  },
  {
    title: "Mobile App Development",
    description:
      "Cross-platform apps for Android and iOS using React Native. Feels native, ships quickly, and scales without drama. Your users won't notice the difference — and that's exactly the goal.",
  },
  {
    title: "UI/UX Design",
    description:
      "Clean, intentional interfaces — designed from wireframe to final build. No clutter, no confusing navigation, no mystery buttons. Just clarity from the first click.",
  },
  {
    title: "Digital Marketing",
    description:
      "SEO, content, and social strategy focused on outcomes, not vanity metrics. Show up where it matters and say something worth reading.",
  },
];

const education = [
  {
    title: "Bachelor of Computer Applications",
    duration: "2022 – 2025",
    school: "Gurunanak College, Velachery",
    description:
      "Covered web technologies, programming languages, data structures, mobile app development, operating systems, and databases.",
    cgpa: "CGPA: 7.85 out of 9.5",
  },
  {
    title: "11th – 12th",
    duration: "2021 – 2022",
    school: "Holy Family Convent Matriculation Hr Sec School, Keelkatalai",
    description: "Secured 72% in HSC Examination.",
  },
  {
    title: "1st – 10th",
    duration: "2010 – 2020",
    school: "Good Shepherd Matriculation Hr Sec School, Old Pallavaram",
    description: "Secured 98.7% in SSLC Examination.",
  },
];

const dataportfolio = [
  {
    img: "https://res.cloudinary.com/dyrcq4l1g/image/upload/v1771329119/Screenshot_2026-02-17_172135_aje76e.png",
    description: "SAP CRM – Multi-Module Tuition ERP (4-Role Access). A comprehensive enterprise resource planning system tailored for academies. Features class scheduling dashboards, automated fee tracking, parental updates, and teacher management panels.",
    tech: ["React", "Node.js", "MongoDB", "JWT"],
    link: "https://app.sampathacademy.in",
  },
  {
    img: "https://res.cloudinary.com/dyrcq4l1g/image/upload/v1771328904/Fashbridge-logo_c4na8q.png",
    description: "FashBridge – AI-Powered Styling Assistant. An intelligent fashion recommendation engine that parses user wardrobe items and cross-references them against local weather feeds to suggest daily personalized outfit combinations.",
    tech: ["React Native", "AI API", "Node.js"],
    link: "https://github.com/codesbycookie/weatherdress_frontend",
  },
  {
    img: "https://res.cloudinary.com/dyrcq4l1g/image/upload/v1771328904/iqbridge_cs_gocl5m.jpg",
    description: "IQBridge – EdTech Corporate Website. A high-performance business portal showcasing custom corporate training, online course syllabi, automated client lead generation, and interactive student review portals.",
    tech: ["React", "Bootstrap"],
    link: "https://iqbridge.com",
  },
  {
    img: "https://res.cloudinary.com/dyrcq4l1g/image/upload/v1771331184/Decode_CLI_q5e7nj.png",
    description: "Decode CLI – Custom Boilerplate Automation Tool. A rapid developer utility script built to initialize, template, and automatically structure file layouts and dependencies for custom boilerplates.",
    tech: ["Node.js", "CLI", "File System"],
    link: `https://github.com/${github_username}/decode`,
  },
  {
    img: "https://res.cloudinary.com/dyrcq4l1g/image/upload/v1771328905/sap_checklist_mj3pd5.jpg",
    description: "SAP Checklist – Workflow & Task Automation System. A lightweight task tracker utility designed to manage internal team checklists, featuring recurring task resets, completion logs, and progress stats.",
    tech: ["React", "Node.js", "MongoDB"],
    link: "https://www.tasklist.co.in",
  },
  {
    img: "https://res.cloudinary.com/dyrcq4l1g/image/upload/v1771331184/Decode_CLI_2_uggnvv.png",
    description: "AI Web Scraper – Intelligent Content Extraction & Q&A. A Python scraping pipeline that parses document layouts, extracts text blocks, filters out layout noise, and runs natural language Q&A queries over scraped data.",
    tech: ["Python", "BeautifulSoup", "OpenAI API"],
    link: `https://github.com/${github_username}/ai-webscraper`,
  },
  {
    img: "https://res.cloudinary.com/dyrcq4l1g/image/upload/v1725289558/portfolio/project/k6nggfjaza3sbum1cntd.png",
    description: "Temple Website – Official Organisation Site. A fully responsive website showcasing event listings, photo archives, and announcement feeds, complete with Google Maps location and details integration.",
    tech: ["React", "Responsive Design"],
    link: "https://www.arulmigusreebalamuneeswarantemple.org",
  },
  {
    img: "https://res.cloudinary.com/dyrcq4l1g/image/upload/v1725179388/portfolio/project/uul4yhztqhhfkmqdh8k6.png",
    description: "YelpCamp – Full-Stack Booking Platform. A campground listing website with full user authentication, listing CRUD operations, campground map views using Mapbox, review ratings, and cloud photo management.",
    tech: ["Node.js", "Express", "MongoDB"],
    link: `https://github.com/${github_username}/yelpcamp`,
  },
  {
    img: "https://res.cloudinary.com/dyrcq4l1g/image/upload/v1771331181/Decode_CLI_3_fnntr9.png",
    description: "Sentiment Analysis – NLP Text Classification Engine. An NLP classifier that analyzes reviews and logs, detecting customer text trends and categorizing sentiment distributions.",
    tech: ["Python", "NLP", "Scikit-learn"],
    link: `https://github.com/${github_username}/sentiment_analysis_app`,
  },
  {
    img: "https://res.cloudinary.com/dyrcq4l1g/image/upload/v1771331182/Decode_CLI_1_rvxiiq.png",
    description: "PDF-to-Audio Converter – Automated TTS Processor. A document automation utility converting multi-page PDFs into natural speech audio files using deep text extraction and neural voice TTS.",
    tech: ["Python", "PDF Parsing", "TTS"],
    link: `https://github.com/${github_username}/audio-converter`,
  },
  {
    img: "https://res.cloudinary.com/dyrcq4l1g/image/upload/v1771331180/Decode_CLI_4_hpxkbp.png",
    description: "Media Downloader – yt-dlp Video Processing Tool. A terminal script designed to schedule and queue media streaming downloads with automatic progress tracking and format conversion filters.",
    tech: ["Python", "yt-dlp"],
    link: `https://github.com/${github_username}/yt-videos_downloader`,
  },
  {
    img: "https://res.cloudinary.com/dyrcq4l1g/image/upload/v1725178942/portfolio/project/tp5dt5umbitbxhm6fbkv.png",
    description: "The Tribute to Virat Kohli – My First Web Project. A clean static tribute layout mapping Virat Kohli's career records, milestones, and statistics. My starting step in front-end development.",
    tech: ["HTML", "CSS"],
    link: "https://vickydecodes.github.io/viratkohli18/viraat2.html",
  },
];

const contactConfig = {
  YOUR_EMAIL: "hello@vickify.in",
  YOUR_FONE: "+91 63851 38282",
  description:
    "I'm Vignesh — Full Stack Developer. I build things end-to-end and I don't half-ship.",
  YOUR_SERVICE_ID: "service_w1ccqt4",
  YOUR_TEMPLATE_ID: "template_wtvoz0q",
  YOUR_PUBLIC_KEY: "tZ6uCr0jgGzlfsL97",
};

const socialprofils = {
  github: "https://github.com/vickydecodes",
  linkedin: "https://www.linkedin.com/in/vickyatln26/",
  twitter: "https://x.com/vickify_x",
  instagram: "https://www.instagram.com/vickify_in",
};

export {
  meta,
  dataabout,
  dataportfolio,
  worktimeline,
  skills,
  services,
  introdata,
  contactConfig,
  socialprofils,
  logotext,
  education,
  beyondProfession,
};
