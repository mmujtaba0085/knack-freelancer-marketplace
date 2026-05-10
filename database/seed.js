// database/seed.js — Full platform seed
// Run: node database/seed.js
// Passwords: admin@knack.com → Admin@123 | everyone else → Pass@1234
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db     = require('../config/db');

async function seed() {
  console.log('\n🌱  Seeding Knack database…\n');

  // ── 1. Clear all tables ───────────────────────────────────────────────────
  process.stdout.write('  Clearing tables…');
  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of ['notifications','reviews','deliverables','disputes',
                    'contracts','proposals','jobs','user_skills',
                    'password_resets','users','skills','categories']) {
    await db.query(`TRUNCATE TABLE \`${t}\``);
  }
  await db.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log(' done.');

  // ── 2. Hash passwords (bcrypt 10 rounds for speed) ────────────────────────
  process.stdout.write('  Hashing passwords…');
  const adminPw = await bcrypt.hash('Admin@123', 10);
  const pw      = await bcrypt.hash('Pass@1234', 10);
  console.log(' done.');

  // ── 3. Categories (IDs 1-8) ───────────────────────────────────────────────
  await db.query(`INSERT INTO categories (name,icon,slug) VALUES
    ('Design & Brand','✦','design'),
    ('Engineering','/>','engineering'),
    ('Writing','¶','writing'),
    ('Video & Motion','▶','video'),
    ('Marketing','◎','marketing'),
    ('Product','◇','product'),
    ('Audio','♪','audio'),
    ('Data & AI','∑','data-ai')`);

  // ── 4. Skills (IDs 1-27) ─────────────────────────────────────────────────
  await db.query(`INSERT INTO skills (name,category_id) VALUES
    ('Brand Identity',1),('Logo Design',1),('Packaging',1),('Typography',1),('Figma',1),
    ('React',2),('Node.js',2),('Python',2),('iOS / Swift',2),('Webflow',2),
    ('Copywriting',3),('Technical Writing',3),('Editing',3),
    ('Motion Graphics',4),('Video Editing',4),('After Effects',4),
    ('SEO',5),('Social Media',5),('Email Marketing',5),
    ('Product Strategy',6),('UX Research',6),('Wireframing',6),
    ('Podcast Editing',7),('Sound Design',7),
    ('Machine Learning',8),('Data Analysis',8),('SQL',8)`);

  // ── 5. Users: ID 1 = admin | 2-11 = clients | 12-33 = freelancers ────────
  process.stdout.write('  Inserting users…');
  await db.query(`INSERT INTO users
    (name,email,password_hash,role,bio,headline,location,hourly_rate,availability) VALUES
    ('Admin','admin@knack.com',?,'admin',
      'Platform administrator.',
      'Platform Administrator','Remote',NULL,'open'),

    ('Alex Rivera','alex@knack.com',?,'client',
      'Co-founder and Creative Director at Hatch & Co., a branding studio that works with ambitious consumer brands. Previously led creative for Nike campaigns and Spotify activations. We believe in the power of craft.',
      'Creative Director · Hatch & Co.','New York, US',NULL,'open'),

    ('Sarah Chen','sarah@knack.com',?,'client',
      'Founder of Axon Labs, a B2B SaaS company in legal tech. We are rebuilding our entire product from the ground up and need world-class talent. We move fast and expect the same.',
      'Founder · Axon Labs','San Francisco, US',NULL,'open'),

    ('James Okafor','james@knack.com',?,'client',
      'Head of Growth at Roam, a travel lifestyle brand for digital nomads. We produce original content, run city events, and build community across 40 cities globally.',
      'Head of Growth · Roam','London, UK',NULL,'open'),

    ('Priya Sharma','priya@knack.com',?,'client',
      'Product Lead at Cleardata — a healthcare data analytics startup helping hospitals unlock patient data without compromising privacy. We work with NHS trusts and private hospital groups.',
      'Product Lead · Cleardata','Bangalore, IN',NULL,'open'),

    ('Marco Bianchi','marco@knack.com',?,'client',
      'Founder of Artigiano, a marketplace connecting 200+ premium Italian artisan producers with global buyers. We cover food, ceramics, leather goods, and home objects — all made by hand.',
      'Founder · Artigiano','Milan, IT',NULL,'open'),

    ('Lisa Thompson','lisa@knack.com',?,'client',
      'CEO of WorkNest, a flexible coworking and community platform in 12 cities. We are in growth mode — scaling fast across Europe and North America.',
      'CEO · WorkNest','Austin, US',NULL,'open'),

    ('David Park','david@knack.com',?,'client',
      'Builder and product person. Running Stackr — a developer productivity platform used by 4,200 engineering teams. I prefer working with specialists who think clearly and deliver without hand-holding.',
      'Founder · Stackr','Seattle, US',NULL,'open'),

    ('Emma Walsh','emma@knack.com',?,'client',
      'Managing Director at Clover Digital, a full-service agency with clients in fintech, retail, and healthcare. Strategy, design, and engineering under one roof.',
      'Managing Director · Clover Digital','Dublin, IE',NULL,'open'),

    ('Carlos Mendez','carlos@knack.com',?,'client',
      'Serial entrepreneur on my third venture — a marketplace for independent creative studios. Passionate about craft. I pay well and write detailed briefs.',
      'Founder · Studio Grid','Madrid, ES',NULL,'open'),

    ('Nina Patel','nina@knack.com',?,'client',
      'Product Manager at Volta Energy, a clean energy startup building the software layer for EV charging networks. Recently closed Series B and scaling the team.',
      'Product Manager · Volta Energy','Toronto, CA',NULL,'open'),

    ('Maya Okafor','maya@knack.com',?,'freelancer',
      'Brand and identity designer with eight years in CPG, beauty, wellness, and editorial. I help ambitious brands find their visual voice — from first sketch to final guidelines. Previously senior designer at Pentagram New York.',
      'Brand & Identity Designer','Lisbon, PT',85.00,'open'),

    ('Théo Marchand','theo@knack.com',?,'freelancer',
      'Full-stack engineer specialising in React and scalable Node.js APIs. Shipped products used by hundreds of thousands of users. Previously worked with teams at Stripe, Linear, and Vercel. Clean code, fast delivery.',
      'Full-Stack · React & Node.js','Paris, FR',120.00,'open'),

    ('Sofia Andersson','sofia@knack.com',?,'freelancer',
      'Product and UX designer with a background in cognitive science. I design for clarity — every interaction should feel inevitable. Strong research skills; I do not guess when I can test.',
      'Product & UX Designer','Stockholm, SE',95.00,'open'),

    ('Raj Patel','raj@knack.com',?,'freelancer',
      'Backend engineer with deep expertise in Node.js, Python, and database architecture. Seven years across fintech, logistics, and SaaS. I build systems that scale and care about long-term code health.',
      'Backend Engineer · Node & Python','Mumbai, IN',75.00,'open'),

    ('Amara Diallo','amara@knack.com',?,'freelancer',
      'Motion designer and visual storyteller. I bring brands to life through animation, title sequences, and cinematic work. Clients include BBC Africa, Orange Telecom, and several award-winning documentary studios.',
      'Motion Designer & Animator','Dakar, SN',80.00,'open'),

    ('Kai Nakamura','kai@knack.com',?,'freelancer',
      'iOS engineer with ten years building native Swift applications. Shipped twelve apps to the App Store, including two in the top 10 of their categories. Former Apple engineer on the UIKit team.',
      'iOS / Swift Engineer','Tokyo, JP',110.00,'busy'),

    ('Luna Rodriguez','luna@knack.com',?,'freelancer',
      'Copywriter and brand voice specialist. I write for brands that have something real to say — newsletters, campaigns, and long-form content. Clients include VC-backed startups and established D2C brands. No filler.',
      'Copywriter & Brand Voice','Buenos Aires, AR',65.00,'open'),

    ('Oliver Wright','oliver@knack.com',?,'freelancer',
      'Data scientist and ML practitioner focused on applied machine learning — churn prediction, demand forecasting, and recommendation systems. PhD in Statistics from UCL. I translate complex models into clear business value.',
      'Data Scientist & ML Engineer','London, UK',105.00,'open'),

    ('Zara Ahmed','zara@knack.com',?,'freelancer',
      'Performance marketer and social media strategist. I run paid campaigns that convert and build organic communities that last. Managed over $2M in ad spend across Meta and TikTok.',
      'Social Media & Performance Marketer','Dubai, AE',70.00,'open'),

    ('Finn Larsen','finn@knack.com',?,'freelancer',
      'Video editor and documentary filmmaker. I cut everything from three-minute brand films to feature-length docs. Fast, precise, and I understand story. Work with a small team including a colourist and sound designer.',
      'Video Editor & Filmmaker','Copenhagen, DK',75.00,'open'),

    ('Aisha Mbeki','aisha@knack.com',?,'freelancer',
      'SEO strategist and content architect. I help e-commerce and SaaS brands rank for searches that matter. Technical SEO, content strategy, and link building. Previous clients have 500K+ monthly organic sessions.',
      'SEO Strategist','Nairobi, KE',60.00,'open'),

    ('Luca Ferrari','luca@knack.com',?,'freelancer',
      'React specialist and frontend engineer. I build fast, accessible, and beautifully implemented web applications. Three years at a Milan-based SaaS startup building complex data dashboards. Now freelance full-time.',
      'React & Frontend Engineer','Rome, IT',80.00,'open'),

    ('Nadia Volkov','nadia@knack.com',?,'freelancer',
      'Technical writer and documentation architect. I translate complex systems into clear, structured docs that developers actually read. Worked with Elastic, HashiCorp, and several open-source projects.',
      'Technical Writer','Berlin, DE',70.00,'open'),

    ('Sam Kim','sam@knack.com',?,'freelancer',
      'Product strategist and former startup founder. I help teams clarify product vision, prioritise ruthlessly, and align stakeholders. Sold my last company in 2021. I speak both business and engineering.',
      'Product Strategist','Seoul, KR',100.00,'open'),

    ('Isla MacLean','isla@knack.com',?,'freelancer',
      'Logo and identity designer with an obsession for letterforms and marks that work at every scale. Trusted by founders, agencies, and cultural institutions. Ten years of craft.',
      'Logo & Identity Designer','Edinburgh, UK',75.00,'open'),

    ('Felix Weber','felix@knack.com',?,'freelancer',
      'Machine learning engineer specialising in Python, scikit-learn, and PyTorch. I build and productionise ML models for real business problems. MSc in Machine Learning from ETH Zurich.',
      'ML Engineer · Python & PyTorch','Zurich, CH',115.00,'open'),

    ('Yuki Tanaka','yuki@knack.com',?,'freelancer',
      'Audio producer and podcast specialist. I handle everything from multi-track editing to sound design and mastering. Over 500 podcast episodes edited across 30 active shows. Quick turnaround, transparent process.',
      'Podcast Producer & Audio Engineer','Osaka, JP',55.00,'open'),

    ('Jade Williams','jade@knack.com',?,'freelancer',
      'Email marketing strategist and copywriter. I design welcome sequences, nurture flows, and re-engagement campaigns that perform. Consistent 40-55% open rates across client lists. Every word written by me.',
      'Email Marketing Strategist','Toronto, CA',65.00,'open'),

    ('Noah Andersen','noah@knack.com',?,'freelancer',
      'Webflow developer and front-end engineer. I build marketing sites and landing pages that are fast, pixel-perfect, and easy for your team to update. 80+ sites delivered in three years.',
      'Webflow Developer','Amsterdam, NL',70.00,'open'),

    ('Chloe Martin','chloe@knack.com',?,'freelancer',
      'Video editor and motion designer specialising in social-first content — reels, brand videos, and animated ads that stop the scroll. Previously senior editor at BETC Paris working with Air France and Evian.',
      'Video Editor & Motion Designer','Paris, FR',80.00,'open'),

    ('Arjun Singh','arjun@knack.com',?,'freelancer',
      'Data analyst and Python developer. I turn messy data into actionable insight — ETL pipelines, visual dashboards, and predictive models. Four years in consulting across banking, retail, and logistics.',
      'Data Analyst · Python & SQL','Delhi, IN',60.00,'open'),

    ('Petra Novak','petra@knack.com',?,'freelancer',
      'UX researcher and product designer specialising in discovery. I understand users before a single pixel is placed — interviews, usability testing, surveys, and card sorting. Previously at Google UX Research in London.',
      'UX Researcher & Product Designer','Prague, CZ',80.00,'open')
  `, [adminPw, ...Array(32).fill(pw)]);
  console.log(' done. (33 users)');

  // ── 6. User skills ────────────────────────────────────────────────────────
  await db.query(`INSERT INTO user_skills (user_id,skill_id) VALUES
    (12,1),(12,2),(12,3),(12,4),(12,5),
    (13,6),(13,7),(13,10),
    (14,5),(14,20),(14,21),(14,22),
    (15,7),(15,8),(15,27),
    (16,14),(16,15),(16,16),
    (17,9),
    (18,11),(18,13),
    (19,25),(19,26),(19,27),
    (20,17),(20,18),(20,19),
    (21,15),
    (22,17),(22,18),
    (23,6),(23,7),
    (24,12),(24,13),
    (25,20),(25,21),(25,22),
    (26,1),(26,2),(26,4),
    (27,8),(27,25),(27,26),
    (28,23),(28,24),
    (29,18),(29,19),
    (30,6),(30,10),
    (31,14),(31,15),(31,16),
    (32,8),(32,25),(32,26),(32,27),
    (33,21),(33,22),(33,20)`);

  // ── 7. Jobs (IDs 1-40) ───────────────────────────────────────────────────
  // Status key: J1,J9,J10,J27,J29,J32,J36,J40 = in_progress
  //             J2,J11,J17,J18,J23,J25,J39    = completed
  //             rest                           = open
  process.stdout.write('  Inserting jobs…');
  await db.query(`INSERT INTO jobs
    (client_id,category_id,title,description,budget_min,budget_max,deadline,level,skills_text,status) VALUES

    (2,1,'Brand identity for a sustainable skincare brand',
      'We are launching a new skincare line called Verdant — clean ingredients, minimal footprint, premium positioning. We need a complete brand identity: wordmark, colour system, type hierarchy, pattern language, and packaging guidelines. Deliverables: Figma source files, brand guidelines PDF, and print-ready packaging artwork. Looking for a designer with CPG or beauty experience.',
      2000,2800,DATE_ADD(NOW(),INTERVAL 30 DAY),'expert','Brand Identity,Typography,Figma,Packaging','in_progress'),

    (3,1,'Logo redesign for a legal tech startup',
      'Axon Labs needs a fresh, confident wordmark and visual identity. Our current logo was designed in a weekend and it shows. We want something that communicates trust, intelligence, and precision — not another generic tech startup look. Deliverables: primary mark and variants, colour palette, and a simple usage guide in Figma.',
      800,1200,DATE_ADD(NOW(),INTERVAL 14 DAY),'intermediate','Logo Design,Brand Identity,Figma','completed'),

    (6,1,'Packaging design for artisan chocolate brand',
      'Artigiano is launching a premium chocolate line sourced from three Sicilian producers. We need packaging for six SKUs — bars and gift boxes. The aesthetic should feel artisanal and collectable, not mass-market. Deliverables: print-ready dielines, all assets in Illustrator. Previous luxury packaging experience preferred.',
      1500,2200,DATE_ADD(NOW(),INTERVAL 28 DAY),'expert','Packaging,Brand Identity,Typography','open'),

    (9,1,'Brand guidelines for a digital agency',
      'Clover Digital is refreshing its visual identity and needs a thorough brand guidelines document covering logo usage, colour, typography, photography style, and tone of voice. We have an existing logo we are happy with — this is about systematising and documenting it properly. Deliverables: 40-60 page brand book in PDF and Figma.',
      1200,1800,DATE_ADD(NOW(),INTERVAL 21 DAY),'intermediate','Brand Identity,Typography,Figma','open'),

    (7,1,'Visual identity for a coworking brand',
      'WorkNest is building a new identity that works across physical signage, digital platforms, and member merchandise. We need a flexible visual system that feels warm, professional, and distinctly non-corporate. Deliverables: full brand identity with guidelines, icon set, and social media templates in Figma.',
      1800,2500,DATE_ADD(NOW(),INTERVAL 35 DAY),'expert','Brand Identity,Logo Design,Figma','open'),

    (8,1,'Typeface selection and brand kit for a developer tool',
      'Stackr needs a refined brand kit: typeface pairing, colour system update, and a set of UI illustration guidelines. We want something that communicates precision and clarity without feeling sterile. We are not redesigning the logo — this is a refinement, not a rebuild. Deliverables: brand guidelines PDF and Figma token library.',
      900,1400,DATE_ADD(NOW(),INTERVAL 18 DAY),'intermediate','Typography,Brand Identity,Figma','open'),

    (6,1,'E-commerce product page design (Shopify)',
      'Artigiano needs a custom Shopify theme design for product pages, the collection page, and checkout. The current store is functional but generic — we want it to feel as premium as our products. Deliverables: Figma designs for all key pages, responsive for mobile, with a handoff-ready component library.',
      2000,3000,DATE_ADD(NOW(),INTERVAL 25 DAY),'intermediate','Figma,Brand Identity','open'),

    (10,1,'Pitch deck design for a Series A raise',
      'Studio Grid is raising a Series A and needs a compelling pitch deck — not a template, a proper presentation. 14 slides covering problem, solution, market, traction, team, and financials. Content is written; we need a designer who can elevate it visually and make it feel confident and clear.',
      800,1200,DATE_ADD(NOW(),INTERVAL 10 DAY),'intermediate','Figma,Typography','open'),

    (3,2,'Full-stack developer for a client portal rebuild',
      'Our client portal is a legacy PHP monolith. We want to rebuild it in React and Node.js. Key features: role-based access (admin, lawyer, client), document upload and versioning, real-time notifications, Stripe billing, and a reporting dashboard. We work in two-week sprints and expect daily async updates.',
      10000,14000,DATE_ADD(NOW(),INTERVAL 60 DAY),'expert','React,Node.js','in_progress'),

    (4,2,'React Native mobile app for a travel platform',
      'Roam needs a mobile app for our city-guide and events platform. iOS and Android via React Native. Features: personalised city feeds, event booking, offline mode, and push notifications. We have designs ready in Figma. Looking for an engineer who has shipped React Native apps to both stores.',
      25000,35000,DATE_ADD(NOW(),INTERVAL 90 DAY),'expert','React,Node.js','in_progress'),

    (9,2,'Webflow development for agency website',
      'Clover Digital needs a new marketing website built in Webflow. 8 pages including a case study template, blog, and team page. Designs are finalised in Figma. We need a developer who works precisely from designs and can implement smooth scroll animations without killing performance.',
      3500,5000,DATE_ADD(NOW(),INTERVAL 21 DAY),'intermediate','Webflow','completed'),

    (8,2,'Node.js API for a real-time analytics dashboard',
      'Stackr is building an analytics dashboard for engineering teams. We need a Node.js API layer with WebSocket support for real-time data, a REST API for historical queries, and integration with our existing PostgreSQL database. Must handle high concurrency — 200+ simultaneous connections per customer.',
      8000,12000,DATE_ADD(NOW(),INTERVAL 45 DAY),'expert','Node.js','open'),

    (6,2,'E-commerce backend — inventory management',
      'Artigiano needs a backend system to manage inventory across 200+ producers. Key features: stock sync, automatic low-stock alerts, order fulfilment tracking, and a supplier portal. We use MySQL. The system needs to be robust — inventory errors cost us real money.',
      5000,8000,DATE_ADD(NOW(),INTERVAL 40 DAY),'intermediate','Node.js,SQL','open'),

    (5,2,'Python automation for a healthcare data pipeline',
      'Cleardata needs a Python engineer to build automated ETL pipelines that pull data from hospital systems (HL7 FHIR APIs), transform it into our standard schema, and load it into our analytics warehouse. Strong experience with healthcare data standards preferred. Security and compliance are paramount.',
      6000,9000,DATE_ADD(NOW(),INTERVAL 35 DAY),'expert','Python,SQL','open'),

    (10,2,'iOS fitness tracker app',
      'Studio Grid is building a fitness companion app for the creative community — workout tracking, habit streaks, and a simple social layer. Native iOS in Swift. We have a full Figma design ready. Looking for an experienced iOS engineer who has shipped a fitness or health app before.',
      15000,22000,DATE_ADD(NOW(),INTERVAL 75 DAY),'expert','iOS / Swift','open'),

    (8,2,'React dashboard for a SaaS platform',
      'Stackr needs a new customer-facing analytics dashboard built in React. 12 chart types, date range filtering, CSV export, and a drill-down view per metric. Our design system is in Figma and we have an existing component library. Looking for a React engineer with strong data visualisation experience.',
      6000,9000,DATE_ADD(NOW(),INTERVAL 40 DAY),'intermediate','React','open'),

    (2,3,'Monthly founder newsletter — ghostwriter',
      'Hatch & Co. publishes a monthly newsletter on branding, craft, and the creative economy. We need a ghostwriter who can match our founder voice — sharp, opinionated, and genuinely interesting. 1,800 words per issue, one issue per month. Ongoing engagement. Please include writing samples with your proposal.',
      400,600,NULL,'intermediate','Copywriting,Editing','completed'),

    (5,3,'Technical documentation for a developer API',
      'Cleardata is launching a public API for hospital systems to query de-identified patient data. We need a technical writer to produce comprehensive API docs: endpoint reference, authentication guide, quickstart tutorials, and code examples in Python, JavaScript, and Java. Our existing internal docs are a starting point.',
      1800,2500,DATE_ADD(NOW(),INTERVAL 28 DAY),'intermediate','Technical Writing','completed'),

    (7,3,'Product launch blog series — 5 articles',
      'WorkNest is launching a new enterprise tier and needs five 1,000-word blog posts to support the launch: one thought leadership piece, two how-to guides, and two case study-style posts. SEO-optimised. We will provide topic briefs. Looking for a writer who understands B2B SaaS and coworking.',
      600,900,DATE_ADD(NOW(),INTERVAL 20 DAY),'entry','Copywriting','open'),

    (5,3,'UX writing for a healthcare mobile app',
      'Cleardata is building a patient-facing mobile app and needs a UX writer to own all microcopy: onboarding flows, empty states, error messages, tooltips, and push notifications. Must write with empathy and clarity — this is a healthcare product used by people in stressful situations.',
      1200,1800,DATE_ADD(NOW(),INTERVAL 30 DAY),'intermediate','Copywriting,Editing','open'),

    (8,3,'Case study writing for a B2B SaaS product',
      'Stackr needs three in-depth customer case studies (1,500 words each) for our sales and marketing collateral. We will arrange customer interviews; you handle the writing. Stories must be specific, data-rich, and avoid the usual SaaS buzzwords. Technical understanding of developer tools is a plus.',
      1200,1800,DATE_ADD(NOW(),INTERVAL 25 DAY),'intermediate','Copywriting,Editing','open'),

    (10,3,'Long-form profile piece — founder story',
      'Studio Grid needs a 3,000-word profile of our founder for a major design publication. The piece needs to weave personal history, business philosophy, and a clear narrative arc. The founder is an interview-ready subject. Looking for a journalist-level writer with strong feature experience.',
      800,1200,DATE_ADD(NOW(),INTERVAL 18 DAY),'expert','Copywriting,Editing','open'),

    (3,4,'Product explainer video (90 seconds)',
      'Axon Labs needs a 90-second animated explainer video for our homepage. Style: clean, professional motion graphics — not cartoon. Script is written. We need an editor or animator who can bring it to life with motion design, voiceover direction, and sound design. Deliverable: final MP4, 1080p and 4K.',
      3000,4500,DATE_ADD(NOW(),INTERVAL 30 DAY),'intermediate','Motion Graphics,After Effects,Video Editing','completed'),

    (4,4,'YouTube channel launch — 3 hero videos',
      'Roam is launching a YouTube channel and needs three flagship videos (8-12 minutes each) edited from raw travel footage. Style: cinematic and editorial — think Vox or The Atlantic Video, not vlog. Strong colour grading and pacing skills essential. Provide examples of long-form video work in your proposal.',
      5000,8000,DATE_ADD(NOW(),INTERVAL 45 DAY),'expert','Video Editing','open'),

    (11,4,'Social media reels package — 10 reels',
      'Volta Energy needs a package of 10 short-form reels (15-30 seconds each) for Instagram and TikTok promoting our EV charging story. Raw footage and b-roll will be provided. We need snappy editing, text overlays, and trend-aware pacing. Fast turnaround is essential.',
      1800,2600,DATE_ADD(NOW(),INTERVAL 16 DAY),'intermediate','Video Editing,Motion Graphics','completed'),

    (2,4,'Brand motion guidelines and logo animation',
      'Hatch & Co. needs motion guidelines for our brand — how the logo animates, how transitions work, how type appears on screen. Plus a set of reusable After Effects templates for client presentations and social. Looking for a motion designer who thinks systematically, not just decoratively.',
      2000,3000,DATE_ADD(NOW(),INTERVAL 28 DAY),'expert','Motion Graphics,After Effects','open'),

    (6,5,'SEO audit and 6-month strategy',
      'Artigiano.com gets solid direct traffic but almost no organic search. We need a full technical SEO audit, keyword gap analysis, and a 6-month content and link-building strategy. We want to rank for high-intent searches like "buy authentic Italian ceramics" and "Italian artisan food gifts". Show us your process.',
      2400,3200,DATE_ADD(NOW(),INTERVAL 21 DAY),'intermediate','SEO','in_progress'),

    (4,5,'Paid social campaign — Meta and TikTok',
      'Roam is running a campaign to drive app downloads among 25-35 year old digital nomads. Budget: $15,000/month in ad spend. We need someone to build the campaign structure, write ad copy, create audiences, and manage ongoing optimisation. Experience with travel or lifestyle brands preferred.',
      2000,3000,NULL,'intermediate','Social Media','open'),

    (7,5,'Email welcome sequence — 8 emails',
      'WorkNest needs a new member welcome sequence for people who sign up to a free trial. 8 emails over 14 days: onboarding, feature highlights, social proof, objection handling, and a conversion nudge. We need a writer who understands SaaS onboarding psychology and can write copy that does not feel like a robot wrote it.',
      700,1100,DATE_ADD(NOW(),INTERVAL 14 DAY),'entry','Email Marketing,Copywriting','in_progress'),

    (11,5,'Content marketing strategy and editorial calendar',
      'Volta Energy is building a content programme from scratch. We need a strategist to define our content pillars, audience segments, channel mix, and a 12-month editorial calendar. We want to become the voice of the EV infrastructure conversation in Canada. Experience with B2B or climate tech content preferred.',
      2000,3000,DATE_ADD(NOW(),INTERVAL 25 DAY),'intermediate','Social Media,Email Marketing','open'),

    (10,5,'Influencer outreach and campaign management',
      'Studio Grid is partnering with independent designers and creatives for a product launch campaign. We need someone to identify 30-50 relevant micro-influencers (10K-100K), manage outreach, negotiate terms, and coordinate content delivery. Experience managing influencer campaigns for creative or design brands essential.',
      1800,2600,DATE_ADD(NOW(),INTERVAL 30 DAY),'intermediate','Social Media','open'),

    (8,6,'UX/UI redesign for a developer dashboard',
      'Stackr is redesigning its core analytics dashboard — the screen our users spend 90% of their time in. We need a product designer to conduct a heuristic evaluation, run 5 user interviews, and produce high-fidelity redesigned screens in Figma. Design system and component library will be handed over at project end.',
      10000,14000,DATE_ADD(NOW(),INTERVAL 50 DAY),'expert','Figma,UX Research,Product Strategy,Wireframing','in_progress'),

    (5,6,'UX research — 10 user interviews and synthesis',
      'Cleardata is making a major product pivot and needs rigorous user research before we build. We need a UX researcher to conduct 10 interviews with hospital administrators, synthesise findings into a research report, and present actionable recommendations. Experience with healthcare or enterprise software users preferred.',
      3000,4500,DATE_ADD(NOW(),INTERVAL 30 DAY),'intermediate','UX Research','open'),

    (11,6,'Product roadmap facilitation workshop',
      'Volta Energy needs an experienced product strategist to facilitate a two-day roadmap planning workshop with our leadership team. Pre-workshop: stakeholder interviews and opportunity mapping. Post-workshop: a prioritised 12-month roadmap and a decision log. Remote-friendly; we use Notion and Miro.',
      2500,3500,DATE_ADD(NOW(),INTERVAL 20 DAY),'expert','Product Strategy,UX Research','open'),

    (3,6,'Mobile app wireframes and clickable prototype',
      'Axon Labs needs wireframes and a clickable prototype for a new mobile feature — a document collaboration tool for legal teams. 20-25 screens covering the main user flows. We will use the prototype for stakeholder sign-off and investor demos. Figma preferred. Quick turnaround (10 days) required.',
      2000,3000,DATE_ADD(NOW(),INTERVAL 12 DAY),'intermediate','Wireframing,Figma,UX Research','open'),

    (4,7,'Weekly podcast editing — ongoing engagement',
      'Roam publishes a weekly podcast (45 minutes, two hosts, one guest). We need an editor to handle multi-track cleanup, music integration, chapter markers, and delivery of a clean final file every Thursday. Must be fast, reliable, and able to handle 4+ episodes per month without quality dips.',
      400,600,NULL,'entry','Podcast Editing','in_progress'),

    (2,7,'Brand sonic identity and UI sounds',
      'Hatch & Co. is working with a client who needs a complete sonic identity: brand theme, UI sound effects for their app (notifications, confirmations, errors), and guidelines for music usage in video. Looking for an audio designer with brand sound experience — not just a music producer.',
      2000,3000,DATE_ADD(NOW(),INTERVAL 30 DAY),'expert','Sound Design','open'),

    (7,7,'Audiobook narration and production editing',
      'WorkNest is producing an audiobook of our CEO memoir (45,000 words). The CEO will narrate — we need a producer and editor to handle session recording guidance, multi-session editing, noise reduction, and final mastering to ACX standards. Experience with non-fiction audiobook production required.',
      2500,3500,DATE_ADD(NOW(),INTERVAL 40 DAY),'intermediate','Podcast Editing,Sound Design','open'),

    (5,8,'Sales data analysis and Power BI dashboard',
      'Cleardata needs a data analyst to clean and analyse 18 months of B2B sales data and build a Power BI dashboard for the sales team. Key metrics: pipeline velocity, win rates by segment, rep performance, and forecast accuracy. Raw data is in MySQL. Deliverable: connected dashboard + documentation.',
      3000,4200,DATE_ADD(NOW(),INTERVAL 25 DAY),'intermediate','Data Analysis,SQL','completed'),

    (8,8,'Customer churn prediction model',
      'Stackr wants a machine learning model to predict which customers are at risk of churning in the next 60 days. We have 3 years of product usage data in BigQuery. Deliverables: trained model, a Python scoring script our engineers can integrate, feature importance analysis, and a plain-English executive summary.',
      8000,12000,DATE_ADD(NOW(),INTERVAL 45 DAY),'expert','Machine Learning,Python,Data Analysis','in_progress')`);
  console.log(' done. (40 jobs)');

  // ── 8. Proposals for contracted jobs + contracts ──────────────────────────
  process.stdout.write('  Inserting proposals and contracts…');

  // ── J1: Brand identity (in_progress) — Maya wins ─────────────────────────
  const [rJ1] = await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES
    (1,12,'I have been working in brand identity for brands in the beauty and wellness space for seven years. My recent work includes the full identity for a zero-waste skincare brand that launched in Selfridges — happy to share the case study. I approach every project with a discovery phase first, so we both understand the brand deeply before anything is designed. Proposed timeline: 3 weeks for discovery + concepts, 2 weeks for refinement and guidelines. Figma, print-ready files, and a thorough brand guidelines document are standard deliverables for me.',2200,35,'accepted'),
    (1,26,'Verdant sounds like a project I would love to work on. I specialise in premium consumer identity — particularly marks that work as well on a 10mm emboss as they do on a billboard. I would bring three distinct directions, each fully resolved, with clear rationale. No half-baked ideas.',1900,28,'rejected'),
    (1,16,'I work primarily in motion and brand animation, but I have strong identity skills and have collaborated on several CPG launches. I am particularly interested in the pattern language element — that is where I feel I add unique value.',2500,42,'rejected')`);
  const ct1PropId = rJ1.insertId;
  await db.query(`INSERT INTO contracts (job_id,proposal_id,client_id,freelancer_id,agreed_budget,milestone_pct,status) VALUES (1,?,2,12,2200,65,'active')`, [ct1PropId]);

  // ── J2: Logo redesign (completed) — Isla wins ─────────────────────────────
  const [rJ2] = await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES
    (2,26,'A logo that communicates trust and precision for a legal tech company — this is exactly the kind of brief I am built for. I work in three phases: mark exploration (10 days), refinement of the chosen direction (7 days), and finalisation with full asset package (4 days). You will always know where we are in the process.',950,21,'accepted'),
    (2,12,'Axon Labs is a great fit for my portfolio — I have done identity work for two other legal tech brands and understand the tension between approachability and authority that this sector requires.',1100,28,'rejected')`);
  const ct2PropId = rJ2.insertId;
  await db.query(`INSERT INTO contracts (job_id,proposal_id,client_id,freelancer_id,agreed_budget,milestone_pct,status) VALUES (2,?,3,26,950,100,'completed')`, [ct2PropId]);

  // ── J9: Portal rebuild (in_progress) — Théo wins ─────────────────────────
  const [rJ9] = await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES
    (9,13,'I have rebuilt two legacy portals — one for a legal firm (ironically) and one for a compliance SaaS — both migrations from PHP to React/Node. My approach: start with a one-week architecture document before writing a line of code. This prevents surprises later. I can have the first sprint delivered within 10 days of kickoff.',11500,55,'accepted'),
    (9,23,'Strong React and Node experience here. I built the client-facing dashboard for a fintech startup and handled their Stripe integration end-to-end. Happy to share the codebase structure.',9800,60,'rejected'),
    (9,15,'Backend-first approach: I would architect the API layer and database schema first, then work with your frontend team. If you need someone who can own the whole stack, I can, but I am strongest in Node and the data layer.',8500,50,'rejected')`);
  const ct3PropId = rJ9.insertId;
  await db.query(`INSERT INTO contracts (job_id,proposal_id,client_id,freelancer_id,agreed_budget,milestone_pct,status) VALUES (9,?,3,13,11500,40,'active')`, [ct3PropId]);

  // ── J10: React Native app (in_progress) — Luca wins ──────────────────────
  const [rJ10] = await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES
    (10,23,'I have shipped three React Native apps to both the App Store and Google Play. Travel apps specifically — I built the offline-first architecture for a city guide app with 80K users. Happy to walk you through the architecture on a call.',28000,80,'accepted'),
    (10,17,'iOS/Swift is my primary platform but I also work in React Native. Travel apps are a domain I have experience with — contributed to a city guide app with 120K users. Would like to review the Figma designs before committing to the full timeline.',20000,85,'rejected'),
    (10,15,'I can build the backend API and work with a frontend specialist for the React Native shell. Strong experience with real-time push notification infrastructure.',22000,75,'rejected')`);
  const ct4PropId = rJ10.insertId;
  await db.query(`INSERT INTO contracts (job_id,proposal_id,client_id,freelancer_id,agreed_budget,milestone_pct,status) VALUES (10,?,4,23,28000,20,'active')`, [ct4PropId]);

  // ── J11: Webflow site (completed) — Noah wins ─────────────────────────────
  const [rJ11] = await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES
    (11,30,'Webflow is my primary tool — I have delivered 80+ sites and I build from Figma designs pixel-perfectly. My process: components first, then pages, then animations. I always hand over with thorough CMS documentation so your team can update content without touching the designer.',4200,18,'accepted'),
    (11,13,'I can deliver this in Next.js rather than Webflow — static generation with a clean CMS would give you more long-term flexibility. But if Webflow is the requirement, I have worked with it on two marketing sites and can build precisely from Figma.',4500,18,'rejected'),
    (11,23,'I can build this in React if Webflow is not a requirement — a Next.js static site might give you more flexibility long-term. But happy to work in Webflow if that is the preference.',3800,20,'rejected')`);
  const ct5PropId = rJ11.insertId;
  await db.query(`INSERT INTO contracts (job_id,proposal_id,client_id,freelancer_id,agreed_budget,milestone_pct,status) VALUES (11,?,9,30,4200,100,'completed')`, [ct5PropId]);

  // ── J17: Newsletter ghostwriting (completed) — Luna wins ─────────────────
  const [rJ17] = await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES
    (17,18,'I ghost-write two other founder newsletters in the brand and creative space. I get into the voice quickly — usually by the second issue it is indistinguishable from something the founder wrote on a good day. I would start with a voice document and two draft issues before we settle into a rhythm.',500,7,'accepted'),
    (17,24,'Strong writing background, though my focus is technical. I can adapt to a more editorial voice — I have written a monthly industry newsletter for an engineering publication.',380,10,'rejected')`);
  const ct6PropId = rJ17.insertId;
  await db.query(`INSERT INTO contracts (job_id,proposal_id,client_id,freelancer_id,agreed_budget,milestone_pct,status) VALUES (17,?,2,18,500,100,'completed')`, [ct6PropId]);

  // ── J18: API documentation (completed) — Nadia wins ──────────────────────
  const [rJ18] = await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES
    (18,24,'I have written API documentation for five developer-facing products, including a healthcare data API for a UK startup working with NHS trusts. I understand HL7 FHIR — worked adjacent to it on the NHS Digital API project. I structure docs for two audiences simultaneously: the developer in a hurry and the one who wants to understand everything.',2200,22,'accepted'),
    (18,18,'I write clearly about complex subjects and have done some technical writing for a developer tools company. API docs would be a stretch of my usual work but I am confident in the output.',1800,28,'rejected')`);
  const ct7PropId = rJ18.insertId;
  await db.query(`INSERT INTO contracts (job_id,proposal_id,client_id,freelancer_id,agreed_budget,milestone_pct,status) VALUES (18,?,5,24,2200,100,'completed')`, [ct7PropId]);

  // ── J23: Explainer video (completed) — Finn wins ──────────────────────────
  const [rJ23] = await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES
    (23,21,'I cut three product explainer videos last year — all in the 60-120 second range for B2B SaaS. I work closely with a sound designer and voiceover director in my network, which means I can handle the full production chain. Will deliver a first cut within 10 days of receiving the script.',3800,20,'accepted'),
    (23,16,'Motion design is my primary skill and explainer videos are a core format I work in. I can animate from the script and direct the voiceover remotely.',3200,24,'rejected'),
    (23,31,'Strong social-first editing background but I have produced several explainers for B2B brands. I would approach this as a motion-design-led piece.',3500,22,'rejected')`);
  const ct8PropId = rJ23.insertId;
  await db.query(`INSERT INTO contracts (job_id,proposal_id,client_id,freelancer_id,agreed_budget,milestone_pct,status) VALUES (23,?,3,21,3800,100,'completed')`, [ct8PropId]);

  // ── J25: Social media reels (completed) — Chloe wins ────────────────────
  const [rJ25] = await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES
    (25,31,'Ten reels in two weeks is a format I thrive in. I was senior editor at BETC Paris for three years — social-first, high-tempo editing is my native format. I will deliver a consistent look and feel across all ten without making them look like the same template repeated.',2400,14,'accepted'),
    (25,21,'I edit long-form well but have produced short social content for brand clients. Ten reels in two weeks is a tight timeline — I would want to be confident on the brief before committing.',2000,18,'rejected'),
    (25,16,'Motion-led reels with animation overlays is where I am most comfortable. Happy to create reels that are more animated than purely edited footage.',2600,16,'rejected')`);
  const ct9PropId = rJ25.insertId;
  await db.query(`INSERT INTO contracts (job_id,proposal_id,client_id,freelancer_id,agreed_budget,milestone_pct,status) VALUES (25,?,11,31,2400,100,'completed')`, [ct9PropId]);

  // ── J27: SEO audit (in_progress) — Aisha wins ────────────────────────────
  const [rJ27] = await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES
    (27,22,'E-commerce SEO is 80% of what I do. I have taken three similar marketplaces from under 5K to over 60K monthly organic sessions in 12 months. My audits are comprehensive: technical (crawl, speed, schema), on-page, content gap, and competitor backlink analysis. I deliver a full audit in week one, then the strategy document in week two.',2800,60,'accepted'),
    (27,20,'I have managed SEO alongside social and paid campaigns for several e-commerce brands. My approach is holistic — organic search is most powerful when it works with the content and social strategy.',2400,90,'rejected')`);
  const ct10PropId = rJ27.insertId;
  await db.query(`INSERT INTO contracts (job_id,proposal_id,client_id,freelancer_id,agreed_budget,milestone_pct,status) VALUES (27,?,6,22,2800,55,'active')`, [ct10PropId]);

  // ── J29: Email sequence (in_progress) — Jade wins ────────────────────────
  const [rJ29] = await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES
    (29,29,'SaaS welcome sequences are my speciality. My average open rate across client lists is 47% and average click rate is 9.2% — I track this obsessively because it is the only thing that matters. I will start with a map of the 8-email journey, get your sign-off, then write. I deliver clean copy ready for your ESP.',900,14,'accepted'),
    (29,20,'Email is part of my full-funnel toolkit. I have written sequences for three SaaS products and managed the send schedules. I think about email as part of the broader customer journey, not in isolation.',750,18,'rejected')`);
  const ct11PropId = rJ29.insertId;
  await db.query(`INSERT INTO contracts (job_id,proposal_id,client_id,freelancer_id,agreed_budget,milestone_pct,status) VALUES (29,?,7,29,900,75,'active')`, [ct11PropId]);

  // ── J32: UX/UI redesign (in_progress) — Sofia wins ───────────────────────
  const [rJ32] = await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES
    (32,14,'A developer analytics dashboard is a complex design problem — high information density, expert users, and zero tolerance for friction. I have redesigned two comparable products (one for a DevOps tool, one for a code quality platform) and in both cases the redesign drove a measurable reduction in time-on-task. I lead with research, not assumptions.',12000,45,'accepted'),
    (32,25,'Strong product strategy background. I would approach this with a Jobs To Be Done framework — understanding what developers are actually trying to accomplish before redesigning anything.',10000,40,'rejected'),
    (32,33,'UX research is my strongest skill and I would want to front-load the interviews before any design work. I have researched developer tools products before and know how to recruit from that audience.',9500,50,'rejected')`);
  const ct12PropId = rJ32.insertId;
  await db.query(`INSERT INTO contracts (job_id,proposal_id,client_id,freelancer_id,agreed_budget,milestone_pct,status) VALUES (32,?,8,14,12000,30,'active')`, [ct12PropId]);

  // ── J36: Podcast editing (in_progress) — Yuki wins ───────────────────────
  const [rJ36] = await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES
    (36,28,'I edit four weekly podcasts currently, all in the 40-60 minute range. My turnaround is 48 hours from receiving files to delivering the final cut. I handle EQ, noise reduction, breath removal, music integration, and chapter markers as standard. I have never missed a delivery date.',550,999,'accepted'),
    (36,31,'I have edited podcast content as part of broader video projects. Happy to take on an ongoing audio-only engagement.',480,999,'rejected')`);
  const ct13PropId = rJ36.insertId;
  await db.query(`INSERT INTO contracts (job_id,proposal_id,client_id,freelancer_id,agreed_budget,milestone_pct,status) VALUES (36,?,4,28,550,60,'active')`, [ct13PropId]);

  // ── J39: Sales data analysis (completed) — Oliver wins ───────────────────
  const [rJ39] = await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES
    (39,19,'I have built Power BI dashboards for B2B sales teams at three SaaS companies. Sales data analysis is something I genuinely enjoy — there is always a story buried in it. My process: data audit first, then agree on the KPI framework with you, then build. I deliver with full documentation so your team can maintain it.',3500,20,'accepted'),
    (39,32,'Strong data analyst with Python and SQL skills. I would handle the data cleaning and analysis in Python and build the dashboard in either Power BI or Streamlit depending on your preference.',3000,22,'rejected'),
    (39,27,'I usually work on predictive modelling but I am comfortable with descriptive analytics and BI dashboards. Would use Python for the analysis and Power BI for the visualisation layer.',3200,18,'rejected')`);
  const ct14PropId = rJ39.insertId;
  await db.query(`INSERT INTO contracts (job_id,proposal_id,client_id,freelancer_id,agreed_budget,milestone_pct,status) VALUES (39,?,5,19,3500,100,'completed')`, [ct14PropId]);

  // ── J40: Churn prediction (in_progress) — Felix wins ─────────────────────
  const [rJ40] = await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES
    (40,27,'Churn prediction is one of three model types I have productionised in the last year. My approach: EDA first to understand the data quality and shape, then feature engineering, then model selection (usually gradient boosting for this use case), then evaluation against your current churn detection method. I write production-ready Python and document everything.',9500,40,'accepted'),
    (40,19,'I have built churn models as part of broader data science engagements. Comfortable with the full lifecycle from feature engineering to deployment.',8500,45,'rejected'),
    (40,32,'Data analytics background with Python and ML skills. I have applied classification models in a consulting context and am confident I can deliver a well-evaluated model.',7800,50,'rejected')`);
  const ct15PropId = rJ40.insertId;
  await db.query(`INSERT INTO contracts (job_id,proposal_id,client_id,freelancer_id,agreed_budget,milestone_pct,status) VALUES (40,?,8,27,9500,25,'active')`, [ct15PropId]);

  console.log(' done. (15 contracts)');

  // ── 9. Pending proposals for open jobs ───────────────────────────────────
  process.stdout.write('  Inserting pending proposals…');
  await db.query(`INSERT INTO proposals
    (job_id,freelancer_id,cover_letter,proposed_budget,estimated_days,status) VALUES

    (3,12,'Premium chocolate packaging is a wonderful brief. I have done luxury food packaging for three Sicilian producers — coincidentally. My work focuses on materials, print finishes, and typography that make the product feel precious before it is unwrapped.',1800,28,'pending'),
    (3,26,'Packaging is an area I want to develop in my portfolio and I have the identity skills to support it. I work closely with a packaging specialist who would advise on technical print constraints.',1600,24,'pending'),
    (3,16,'I approach packaging as a motion designer would — thinking about how it reads when rotating on a shelf, how it photographs for social. Unusual perspective that has value.',1900,35,'pending'),

    (4,26,'Brand guidelines are my bread and butter — I have documented the visual identity for eleven brands in the last three years. I would audit what exists, systematise it, and produce a guidelines document your team will actually use.',1400,18,'pending'),
    (4,12,'I have created brand guidelines for agencies and studios before. I know how to write for an audience that includes both designers and non-designers.',1600,21,'pending'),

    (5,12,'A visual identity for a coworking brand needs to work across a huge range of touchpoints — physical wayfinding, digital UI, member swag. I design systems that are flexible enough to scale. Would love to discuss the brand values on a short call first.',2000,30,'pending'),
    (5,26,'Identity systems for physical-digital brands are something I specialise in. I work from a core mark outward — getting the mark right before building the system around it.',1800,28,'pending'),

    (6,26,'I have designed brand kits for four developer tools companies. The tension between warmth and precision is something I enjoy resolving. My Figma token libraries are thorough and well-documented.',1100,14,'pending'),
    (6,12,'Typeface selection is one of my favourite things to do — and the thing most brands get wrong. I would approach this as a typographic consultation first, then build the system.',1300,18,'pending'),
    (6,33,'As a UX designer who builds in Figma daily, I understand how brand tokens need to work inside a design system. I can bridge the gap between brand guidelines and engineering implementation.',1000,16,'pending'),

    (7,30,'Shopify and Webflow are my two tools. I would build this as a Shopify theme with custom sections. 80+ sites means I know exactly what clients need in terms of editability and performance.',2200,24,'pending'),
    (7,13,'I can build a custom Shopify theme from Figma — React-based with Liquid where Shopify requires it. Performance-first.',2800,22,'pending'),
    (7,12,'I design Shopify stores as a natural extension of brand identity work. The product page should feel like the brand, not like a Shopify template.',2000,21,'pending'),

    (8,12,'Pitch decks are a specific skill — part design, part storytelling. I have designed eight Series A and B decks, four of which led to successful raises. I work from the narrative first, then design.',950,10,'pending'),
    (8,26,'Clean, confident pitch deck design is in my wheelhouse. I work fast on these — usually first draft within 5 days.',850,9,'pending'),

    (12,15,'Node.js API architecture is what I enjoy most. WebSocket infrastructure for high-concurrency real-time data — I built a similar system for a logistics platform handling 500+ concurrent connections.',9500,40,'pending'),
    (12,13,'I have built real-time APIs with WebSocket support in Node. Would use Redis Pub/Sub for the real-time layer and a separate read replica for historical queries.',10500,38,'pending'),
    (12,23,'Frontend-focused but comfortable with Node APIs. I have built the API layer for two SaaS products alongside the React dashboard.',8000,45,'pending'),

    (13,15,'Inventory management systems are something I have built before — once for a marketplace with 150 suppliers. The complexity is in the stock sync logic, which I would design carefully before writing code.',6500,35,'pending'),
    (13,23,'E-commerce backends in Node with MySQL are familiar territory. I would structure this as a RESTful API with a webhook system for real-time stock alerts to suppliers.',5500,40,'pending'),

    (14,15,'Python ETL pipelines are central to my backend work. I have worked with FHIR APIs before in a different healthcare context. The security requirements are something I take seriously — I would want to discuss your data handling architecture early.',7000,30,'pending'),
    (14,27,'Python data pipelines are core to my ML work. I can build a robust ETL pipeline that feeds cleanly into your analytics warehouse, and document it thoroughly for your team.',6500,28,'pending'),
    (14,32,'I build ETL pipelines in Python for data analytics workflows. Healthcare data compliance is something I have worked with in the Indian healthcare context.',5800,32,'pending'),

    (15,17,'iOS development is all I do. Ten years, twelve shipped apps. I would want to review the Figma designs before committing to a timeline — fitness app interaction patterns can be deceptively complex.',18000,70,'pending'),

    (16,23,'React dashboards with data visualisation are my primary focus. I have built 4 analytics dashboards with 10+ chart types. I use Recharts and D3 depending on complexity.',7200,38,'pending'),
    (16,13,'I would build this as a React application with a clean component architecture. Strong data visualisation experience — I have used D3 and Recharts extensively.',8500,35,'pending'),
    (16,30,'Webflow is my primary tool but I also build in React for complex application UIs. A data dashboard requires React — I have built two in the last year.',6500,40,'pending'),

    (19,18,'I write B2B SaaS content regularly and understand the coworking space well — I have written for a WorkNest competitor. Five posts across thought leadership and how-to is a format I enjoy.',700,18,'pending'),
    (19,24,'I can write clearly about B2B products and have done content for SaaS companies. Technical writing background means I am good at making complex features sound accessible.',550,20,'pending'),

    (20,18,'UX writing is where copywriting meets product thinking — one of my favourite intersections. I have written microcopy for two mobile apps. Healthcare context means I would be especially careful with tone.',1400,24,'pending'),
    (20,24,'UX writing and microcopy is adjacent to technical writing — I have contributed to in-product copy for two developer tools. Happy to work in this mode for a healthcare product.',1100,21,'pending'),

    (21,24,'Case study writing is something I do well — I understand how to interview a customer, extract the specific detail, and write a story that feels concrete rather than marketing-speak.',1300,22,'pending'),
    (21,18,'Three case studies is a project I would enjoy. I understand B2B SaaS positioning and the importance of specificity — no vague "50% improvement" claims without the story behind them.',1400,20,'pending'),

    (22,18,'Long-form magazine-style profiles are something I want more of in my portfolio. I have written two founder profiles for a design publication. I would want to do a 90-minute interview to really understand the person before writing a word.',900,16,'pending'),

    (24,21,'YouTube long-form in a cinematic editorial style is exactly what I do. I cut a 10-episode travel series last year — happy to share links. I work with a colourist who specialises in travel footage.',6000,40,'pending'),
    (24,16,'I bring a motion design layer to video editing — animated lower thirds, transitions, and graphics that elevate the production value without feeling overproduced.',5500,35,'pending'),
    (24,31,'Social-first editing is my background but I have also cut longer-form content. I am fast and responsive — important for a channel launch timeline.',4800,38,'pending'),

    (26,16,'Brand motion guidelines are a specific thing I have produced for three brands. The deliverable is a system — not just pretty animations — that your team and future agencies can follow.',2200,25,'pending'),
    (26,31,'After Effects is where I spend most of my day. Logo animations and motion guidelines are something I am very confident in. Can share three examples on request.',1900,22,'pending'),

    (28,20,'Meta and TikTok paid social for a travel brand targeting digital nomads — this is a specific audience I have run campaigns for. Cost-per-install and ROAS optimisation are where I focus.',2500,999,'pending'),
    (28,22,'SEO and paid social work best together. I have managed paid social campaigns alongside organic for e-commerce brands. Audience targeting and creative testing are my focus.',2000,999,'pending'),
    (28,29,'Email and paid social are closely linked in full-funnel thinking. I have managed Meta campaigns for two SaaS products, focused on trial signups and demo bookings.',2200,999,'pending'),

    (30,20,'Content strategy for a B2B climate tech company is an exciting brief. I have built content programmes for two clean energy brands in the Middle East. I understand the audience — engineers, fleet managers, and sustainability officers.',2200,22,'pending'),
    (30,29,'I build email-first content strategies and understand how email, social, and SEO content work together. A 12-month calendar with clear KPIs is my standard deliverable.',1900,25,'pending'),
    (30,22,'Content strategy sits naturally alongside SEO — the best content is planned around search intent. I would combine keyword research with audience insight to build a calendar that serves both search and social.',2000,20,'pending'),

    (31,20,'Influencer campaign management for a creative brand is something I am well-positioned for. I have managed three micro-influencer campaigns for design and architecture brands. Creator relationships are everything in this niche.',2000,28,'pending'),
    (31,29,'I manage influencer relationships as part of email and social programmes. I have a network of design-adjacent creators from previous campaigns.',1800,30,'pending'),

    (33,33,'Healthcare user research is a specialised skill and one I take seriously. I have run research programmes with clinicians and hospital administrators — I know how to recruit hard-to-reach participants and make the most of limited interview time.',3500,28,'pending'),
    (33,25,'I would approach this with a Jobs To Be Done interview framework. Synthesis into a research report is where I add particular value — executives can act on my findings without reading 80 pages of notes.',3200,25,'pending'),
    (33,14,'UX research with expert users in high-stakes domains is something I have done twice — once for a clinical decision support tool and once for a legal tech product. I understand how to design research for users who are time-pressured.',4000,30,'pending'),

    (34,25,'Product roadmap facilitation is core to my work. I have facilitated 12 roadmap workshops in the last two years, for teams ranging from 4 to 40. I use a Jobs To Be Done and ICE scoring framework that generates alignment quickly.',3200,10,'pending'),
    (34,33,'I bring a research perspective to roadmap workshops — I make sure the prioritisation is grounded in real user evidence, not internal assumptions.',2800,12,'pending'),
    (34,14,'Design-led roadmap facilitation. I would prepare opportunity maps and proto-personas to anchor the discussion in real user needs.',2600,10,'pending'),

    (35,14,'Mobile wireframes and prototype in Figma is something I can deliver in 10 days. Document collaboration for legal teams is a UX challenge I find genuinely interesting — the permissions and version control flows are complex.',2200,10,'pending'),
    (35,33,'Figma prototypes at this fidelity and pace is something I am set up for. I would focus on the three or four key user flows that matter most for stakeholder sign-off.',2000,10,'pending'),
    (35,25,'I can produce wireframes and a clickable prototype that tells a clear product story. Have done this for two investor demos in the past year.',2400,10,'pending'),

    (37,28,'Brand sonic identity is a discipline I have been building towards for the last two years. I have completed two sonic identity projects and have a sound library and process specifically for this. UI sounds, brand themes, and guidelines are all within scope.',2200,25,'pending'),

    (38,28,'Audiobook production to ACX standards is something I do. I handle session recording consultation, multi-session edit assembly, noise reduction, and final mastering. Non-fiction memoir is a format I enjoy — the pacing challenges are interesting.',3000,35,'pending')`);

  console.log(' done.');

  // ── 10. Deliverables for active contracts ─────────────────────────────────
  process.stdout.write('  Inserting deliverables…');
  await db.query(`INSERT INTO deliverables (contract_id,file_url,message,status) VALUES
    (1,NULL,'Initial brand concepts attached — three distinct directions for Verdant. Direction A leans into botanical illustration; Direction B is minimal and typographic; Direction C is more editorial and premium. Would love your thoughts on which resonates with the brand vision.',  'approved'),

    (3,NULL,'Sprint 1 complete. Delivered: authentication system (login/register/session management), role-based routing, and the document upload system with versioning. All code is on the feature branch — PR is open for your review. The Stripe integration begins in Sprint 2.',  'pending'),

    (10,NULL,'Full SEO audit delivered. Key findings: 143 pages with missing or duplicate meta titles, 0 schema markup across the product catalogue, page speed below 50 on mobile for product pages, and 28 broken internal links. Priority fixes are documented in the action plan. Strategy document will follow by end of week.',  'approved'),

    (11,NULL,'First three emails of the welcome sequence are attached for review: (1) Welcome and quick win, (2) Feature spotlight — the booking system, (3) Social proof — three member stories. Awaiting your feedback before writing emails 4-8.',  'pending'),

    (12,NULL,'Initial wireframes for the main dashboard view and the drill-down metric page are ready for review in Figma. I have also included three alternative layouts for the chart grid — happy to discuss the trade-offs on a call. The component inventory document is also linked.',  'revision'),

    (13,NULL,'Episode 3 (this week) is delivered — link in the shared folder. Included EQ, noise reduction, breath clean-up, the intro and outro music, chapter markers, and a transcript-ready version. Let me know if you want the music level adjusted.',  'approved'),
    (13,NULL,'Episode 4 delivered. Same treatment as last week. I noticed James''s microphone was slightly closer this week — I have balanced the levels so it sounds consistent with previous episodes.',  'pending'),

    (15,NULL,'Exploratory Data Analysis complete. Delivered a 12-page report covering: data quality assessment (8.3% missing values in usage events, handled), feature distributions, churn rate by cohort, and the five features most correlated with churn. The model training phase begins next week.',  'pending')`);
  console.log(' done.');

  // ── 11. Reviews for completed contracts ────────────────────────────────────
  // Completed contracts: 2(J2), 5(J11), 6(J17), 7(J18), 8(J23), 9(J25), 14(J39)
  process.stdout.write('  Inserting reviews…');
  await db.query(`INSERT INTO reviews (contract_id,reviewer_id,reviewee_id,rating,comment) VALUES
    (2,3,26,5,'Isla delivered an exceptional logo. She grasped the brief immediately, brought three genuinely distinct directions, and the refinement process was precise and responsive. The final mark is exactly what Axon Labs needed — confident and distinctive. I would hire her again without hesitation.'),
    (2,26,3,5,'Sarah gave one of the best briefs I have received — specific, honest about what was not working, and clear on the emotional territory she wanted the mark to occupy. Fast feedback and real enthusiasm for the work. A pleasure to work with.'),

    (5,9,30,5,'Noah delivered the Webflow site exactly as designed, on time, with no corners cut. The animations are smooth, the CMS is set up logically, and he handed everything over with thorough documentation. I have already referred him to two other agency clients.'),
    (5,30,9,4,'Emma and the Clover team were organised and knew what they wanted. Clear Figma designs, quick feedback rounds, and no scope creep. The only slight friction was getting final copy approved — but that is content, not the client. Would work with them again.'),

    (6,2,18,5,'Luna has been writing our founder newsletter for three months and it keeps getting better. She captured our voice within two issues and writes with genuine insight — not marketing fluff. Our open rate has gone from 31% to 58%. An exceptional collaborator.'),
    (6,18,2,5,'Alex trusts me with the voice and the content direction, which is rare. He responds to drafts with specific, useful feedback rather than vague "make it punchier" notes. The kind of client that makes you produce better work.'),

    (7,5,24,5,'Nadia produced API documentation that our developers have called the best they have ever used. Structured, accurate, written for two audiences simultaneously (beginner and expert), and delivered ahead of schedule. The quickstart tutorial in particular has significantly reduced our developer support tickets.'),
    (7,24,5,4,'Priya and the Cleardata team were thorough and knowledgeable — they knew their API deeply and could answer every technical question instantly. The review process was meticulous, which is appropriate for a healthcare product. Feedback was always specific and reasonable.'),

    (8,3,21,5,'Finn delivered a 90-second explainer that our whole team is proud of. The pacing is perfect, the motion design feels premium without being flashy, and he incorporated our feedback from the first cut cleanly and quickly. The sound design is particularly good.'),
    (8,21,3,4,'Sarah had a clear vision and communicated it well. The brief was detailed, the script was tight, and feedback came back within 24 hours. The one revision round was focused and practical. Solid client to work with.'),

    (9,11,31,5,'Chloe delivered ten reels in 12 days — all consistent in quality, all on-brief, and all genuinely good. The editing is sharp, the text overlays feel native to each platform, and she clearly understands what makes short-form content work. Will be using her for our ongoing content programme.'),
    (9,31,11,5,'Nina gave us a detailed brief with clear reference points, fast approvals, and genuine excitement about the work. The raw footage was also well-organised, which makes a real difference. Would work with Volta Energy again any time.'),

    (14,5,19,5,'Oliver delivered exactly what he promised: a clean Power BI dashboard, thorough data analysis, and a write-up that I could share with our board without editing. He found patterns in our sales data that our team had missed for 18 months. The documentation means our team can maintain it without him.'),
    (14,19,5,4,'Priya and the Cleardata team had the data well-organised and were responsive throughout. The scope was clearly defined upfront, which made the project straightforward. Would work with them again.')`);
  console.log(' done.');

  // ── 12. Notifications ─────────────────────────────────────────────────────
  process.stdout.write('  Inserting notifications…');
  await db.query(`INSERT INTO notifications (user_id,type,message,link,is_read) VALUES
    (2,'proposal','Maya Okafor submitted a proposal for "Brand identity for a sustainable skincare brand"','/client/proposals/1',1),
    (2,'proposal','Isla MacLean submitted a proposal for "Brand identity for a sustainable skincare brand"','/client/proposals/1',1),
    (2,'proposal','Amara Diallo submitted a proposal for "Brand identity for a sustainable skincare brand"','/client/proposals/1',1),
    (12,'accepted','Your proposal for "Brand identity for a sustainable skincare brand" was accepted! Contract created.','/contracts/1',1),
    (12,'contract','Alex Rivera approved your initial brand concepts.','/contracts/1',0),

    (3,'proposal','Isla MacLean submitted a proposal for "Logo redesign for a legal tech startup"','/client/proposals/2',1),
    (3,'proposal','Maya Okafor submitted a proposal for "Logo redesign for a legal tech startup"','/client/proposals/2',1),
    (26,'accepted','Your proposal for "Logo redesign for a legal tech startup" was accepted! Contract created.','/contracts/2',1),
    (26,'review','Sarah Chen left you a 5-star review.','/profile/26',1),
    (3,'review','Isla MacLean left you a 5-star review.','/profile/3',0),

    (3,'proposal','Théo Marchand submitted a proposal for "Full-stack developer for a client portal rebuild"','/client/proposals/9',1),
    (3,'proposal','Luca Ferrari submitted a proposal for "Full-stack developer for a client portal rebuild"','/client/proposals/9',1),
    (13,'accepted','Your proposal for "Full-stack developer for a client portal rebuild" was accepted! Contract created.','/contracts/3',1),
    (3,'contract','Théo Marchand submitted Sprint 1 deliverables.','/contracts/3',0),

    (4,'proposal','Luca Ferrari submitted a proposal for "React Native mobile app for a travel platform"','/client/proposals/10',1),
    (23,'accepted','Your proposal for "React Native mobile app for a travel platform" was accepted! Contract created.','/contracts/4',1),

    (9,'proposal','Noah Andersen submitted a proposal for "Webflow development for agency website"','/client/proposals/11',1),
    (30,'accepted','Your proposal for "Webflow development for agency website" was accepted! Contract created.','/contracts/5',1),
    (30,'review','Emma Walsh left you a 5-star review.','/profile/30',1),
    (9,'review','Noah Andersen left you a 4-star review.','/profile/9',0),

    (2,'proposal','Luna Rodriguez submitted a proposal for "Monthly founder newsletter — ghostwriter"','/client/proposals/17',1),
    (18,'accepted','Your proposal for "Monthly founder newsletter — ghostwriter" was accepted! Contract created.','/contracts/6',1),
    (18,'review','Alex Rivera left you a 5-star review.','/profile/18',1),
    (2,'review','Luna Rodriguez left you a 5-star review.','/profile/2',0),

    (5,'proposal','Nadia Volkov submitted a proposal for "Technical documentation for a developer API"','/client/proposals/18',1),
    (24,'accepted','Your proposal for "Technical documentation for a developer API" was accepted! Contract created.','/contracts/7',1),
    (24,'review','Priya Sharma left you a 5-star review.','/profile/24',1),
    (5,'review','Nadia Volkov left you a 4-star review.','/profile/5',1),

    (3,'proposal','Finn Larsen submitted a proposal for "Product explainer video (90 seconds)"','/client/proposals/23',1),
    (21,'accepted','Your proposal for "Product explainer video (90 seconds)" was accepted! Contract created.','/contracts/8',1),
    (21,'review','Sarah Chen left you a 5-star review.','/profile/21',1),
    (3,'review','Finn Larsen left you a 4-star review.','/profile/3',1),

    (11,'proposal','Chloe Martin submitted a proposal for "Social media reels package — 10 reels"','/client/proposals/25',1),
    (31,'accepted','Your proposal for "Social media reels package — 10 reels" was accepted! Contract created.','/contracts/9',1),
    (31,'review','Nina Patel left you a 5-star review.','/profile/31',1),
    (11,'review','Chloe Martin left you a 5-star review.','/profile/11',1),

    (6,'proposal','Aisha Mbeki submitted a proposal for "SEO audit and 6-month strategy"','/client/proposals/27',1),
    (22,'accepted','Your proposal for "SEO audit and 6-month strategy" was accepted! Contract created.','/contracts/10',1),
    (22,'contract','Marco Bianchi approved your SEO audit deliverable.','/contracts/10',0),

    (7,'proposal','Jade Williams submitted a proposal for "Email welcome sequence — 8 emails"','/client/proposals/29',1),
    (29,'accepted','Your proposal for "Email welcome sequence — 8 emails" was accepted! Contract created.','/contracts/11',1),

    (8,'proposal','Sofia Andersson submitted a proposal for "UX/UI redesign for a developer dashboard"','/client/proposals/32',1),
    (14,'accepted','Your proposal for "UX/UI redesign for a developer dashboard" was accepted! Contract created.','/contracts/12',1),
    (8,'contract','Sofia Andersson submitted initial wireframes for review.','/contracts/12',0),
    (14,'contract','David Park requested revisions on the wireframes.','/contracts/12',0),

    (4,'proposal','Yuki Tanaka submitted a proposal for "Weekly podcast editing — ongoing engagement"','/client/proposals/36',1),
    (28,'accepted','Your proposal for "Weekly podcast editing — ongoing engagement" was accepted! Contract created.','/contracts/13',1),
    (4,'contract','Yuki Tanaka delivered Episode 3.','/contracts/13',1),
    (4,'contract','Yuki Tanaka delivered Episode 4.','/contracts/13',0),

    (5,'proposal','Oliver Wright submitted a proposal for "Sales data analysis and Power BI dashboard"','/client/proposals/39',1),
    (19,'accepted','Your proposal for "Sales data analysis and Power BI dashboard" was accepted! Contract created.','/contracts/14',1),
    (19,'review','Priya Sharma left you a 5-star review.','/profile/19',1),
    (5,'review','Oliver Wright left you a 4-star review.','/profile/5',1),

    (8,'proposal','Felix Weber submitted a proposal for "Customer churn prediction model"','/client/proposals/40',1),
    (27,'accepted','Your proposal for "Customer churn prediction model" was accepted! Contract created.','/contracts/15',1),
    (8,'contract','Felix Weber submitted the EDA report.','/contracts/15',0)`);
  console.log(' done.\n');

  console.log('✅  Seed complete!\n');
  console.log('─────────────────────────────────────────────');
  console.log('  Admin:        admin@knack.com  /  Admin@123');
  console.log('  Clients:      alex@knack.com   /  Pass@1234');
  console.log('                sarah@knack.com  /  Pass@1234');
  console.log('                james@knack.com  /  Pass@1234');
  console.log('                priya@knack.com  /  Pass@1234');
  console.log('                marco@knack.com  /  Pass@1234');
  console.log('                lisa@knack.com   /  Pass@1234');
  console.log('                david@knack.com  /  Pass@1234');
  console.log('                emma@knack.com   /  Pass@1234');
  console.log('                carlos@knack.com /  Pass@1234');
  console.log('                nina@knack.com   /  Pass@1234');
  console.log('  Freelancers:  maya@knack.com   /  Pass@1234');
  console.log('                theo@knack.com   /  Pass@1234');
  console.log('                sofia@knack.com  /  Pass@1234');
  console.log('                (+ 19 more)      /  Pass@1234');
  console.log('─────────────────────────────────────────────\n');

  process.exit(0);
}

seed().catch(err => { console.error('\n❌  Seed failed:', err.message); process.exit(1); });
