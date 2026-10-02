require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { connectDB, getGridFSBucket } = require('../config/db');

// Models
const Admin = require('../models/Admin');
const WebsiteSettings = require('../models/WebsiteSettings');
const PageSection = require('../models/PageSection');
const Leader = require('../models/Leader');
const Craftsmanship = require('../models/Craftsmanship');
const MaterialElement = require('../models/MaterialElement');
const Project = require('../models/Project');
const RawMaterial = require('../models/RawMaterial');
const DarbarSlide = require('../models/DarbarSlide');
const ServiceOffer = require('../models/ServiceOffer');
const Media = require('../models/Media');

async function seedMediaFile(bucket, filename, category = 'general') {
  try {
    const filePath = path.join(__dirname, '../../', filename);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    // Check if media doc already exists
    const existing = await Media.findOne({ filename });
    if (existing) {
      return existing;
    }

    const stat = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.mp4') mimeType = 'video/mp4';
    else if (ext === '.mov') mimeType = 'video/quicktime';

    const fileBuffer = fs.readFileSync(filePath);
    const readable = new Readable();
    readable.push(fileBuffer);
    readable.push(null);

    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimeType,
      metadata: { originalName: filename, category },
    });

    await new Promise((resolve, reject) => {
      readable.pipe(uploadStream)
        .on('finish', resolve)
        .on('error', reject);
    });

    const mediaDoc = await Media.create({
      fileId: uploadStream.id,
      filename: filename,
      originalName: filename,
      mimeType,
      size: stat.size,
      altText: filename.split('.')[0],
      category,
      url: `/api/media/${uploadStream.id}`,
    });

    return mediaDoc;
  } catch (err) {
    console.warn(`[Seed Media Warning] Could not seed media ${filename}:`, err.message);
    return null;
  }
}

async function seed() {
  console.log('🌱 Starting Rathore Heritage Developers Database Seed...');
  await connectDB();
  const bucket = getGridFSBucket();

  // 1. ADMIN USER
  const adminUsername = process.env.INITIAL_ADMIN_USERNAME || 'admin';
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@rathoreheritage.com';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123456';

  let admin = await Admin.findOne({ email: adminEmail });
  if (!admin) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    admin = await Admin.create({
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
    });
    console.log(`[Seed] Created initial Admin: ${adminEmail} (password: ${adminPassword})`);
  } else {
    console.log(`[Seed] Admin already exists: ${adminEmail}`);
  }

  // 2. WEBSITE SETTINGS
  await WebsiteSettings.deleteMany({});
  await WebsiteSettings.create({
    companyName: 'Rathore Heritage Developers',
    tagline: 'Where Timeless Indian Heritage Meets Royal Living',
    logo: 'logo.PNG',
    primaryPhone: '+91 94142 28829',
    secondaryPhone: '+91 78500 15839',
    whatsappNumber: '919414228829',
    email: 'rathoreheritagedevelopers@gmail.com',
    instagramUrl: 'https://instagram.com/rh_heritagebuilds',
    footerDescription: 'Preserving the soul of Rajasthan. Creating living heritage. Authentic craftsmanship interpreted for spaces of today and tomorrow.',
    copyrightCredit: 'Designed by Marwar Infotech',
    preloaderTitle: 'Rathore Heritage Developers — Raj Virasat',
  });
  console.log('[Seed] Seeded WebsiteSettings');

  // 3. PAGE SECTIONS
  await PageSection.deleteMany({});
  const sectionsData = [
    {
      sectionKey: 'hero',
      title: 'Hero Section',
      data: {
        kicker: 'Heritage Restoration · Luxury Havelis · Palaces · Interiors · Heritage Consultancy',
        heading: 'Where Timeless Indian Heritage Meets Royal Legacy',
        description: 'Welcome to a World of Timeless Heritage — where the soul of Rajasthan is shaped into enduring architecture.',
        ctaText: 'Enter Raj Nirmaan',
        ctaLink: '#projects',
        videoSrc: 'hero.mp4',
      },
    },
    {
      sectionKey: 'legacy',
      title: 'Raj Virasat (Our Legacy)',
      data: {
        eyebrow: 'Raj Virasat',
        heading: 'A Legacy Rooted in Royal Craftsmanship.',
        image: 'about.jpg',
        paragraphs: [
          'Rathore Heritage Developers carries forward the architectural spirit of Rajasthan through authentic heritage construction, traditional craftsmanship, and refined design. We create havelis, villas, resorts, palace-style interiors, and bespoke spaces shaped by royal proportion and cultural authenticity.',
          'Every space is composed through signature Rajasthani details — Heritage Dodi entrances, Thekri glass, carved furniture, decorative pillars, Jhomer chandeliers, and Mor Pankh ceilings. Pipla Patti and Tordi craftsmanship add depth, character, and the unmistakable language of royal interiors.',
          'Ghokda-style domes, marble borders, and Khajur Patti detailing complete the architectural vocabulary. By joining ancestral artistry with disciplined civil engineering, we preserve the character of heritage while creating spaces built for strength, permanence, and timeless beauty.',
        ],
        signature: 'Royal spaces. Timeless legacy.',
      },
    },
    {
      sectionKey: 'leadershipHeader',
      title: 'Leadership Header',
      data: {
        eyebrow: 'Leadership & Vision',
        heading: 'Guardians of a Living Legacy.',
        intro: 'Guided by experience, stewardship, and a deep respect for Rajasthan’s architectural heritage, our leadership carries traditional craftsmanship into contemporary masterpieces.',
      },
    },
    {
      sectionKey: 'craftsmanshipHeader',
      title: 'Craftsmanship Header',
      data: {
        eyebrow: 'Shilp Kala',
        heading: 'The Art of Heritage',
        intro: 'From carved stone and handcrafted furniture to ceilings, lighting, glasswork, and architectural proportions, every detail is composed to create a complete royal heritage experience.',
      },
    },
    {
      sectionKey: 'materialsHeader',
      title: 'Material Palette Header',
      data: {
        eyebrow: 'Dhaatu & Saamagri',
        heading: 'The Royal Material Palette',
        intro: 'Authentic materials selected for texture, richness, longevity, and the enduring character of Rajasthan.',
      },
    },
    {
      sectionKey: 'projectsHeader',
      title: 'Signature Projects Header',
      data: {
        eyebrow: 'Raj Nirmaan',
        heading: 'Creating the Heritage of Tomorrow',
        intro: 'Heritage defining heritage projects where royal proportion, traditional artistry, and contemporary execution meet with precision.',
      },
    },
    {
      sectionKey: 'consultancy',
      title: 'Heritage Consultancy & Expertise',
      data: {
        eyebrow: 'Our Expertise',
        heading: 'Crafting Heritage with Precision & Tradition',
        paragraphs: [
          'Our expertise brings together heritage architecture, restoration planning, traditional building knowledge, and contemporary project discipline — tailored for clients seeking authentic royal environments.',
          'We also provide heritage consultancy for new construction, redesign, restoration, and renovation, helping clients make the right decisions on planning, materials, architectural details, and traditional techniques.',
          'We bridge ancestral craftsmanship with contemporary structural engineering so that every proportion, material, detail, and finish carries authenticity while meeting modern expectations of strength and durability.',
        ],
        ctaText: 'Sampark',
        ctaLink: '#contact',
        videos: [
          { src: 'cons1.mp4', label: 'Consultancy Video 1' },
          { src: 'cons2.mp4', label: 'Consultancy Video 2' },
          { src: 'cons3.mp4', label: 'Consultancy Video 3' },
          { src: 'cons4.mp4', label: 'Consultancy Video 4' },
          { src: 'cons5.mp4', label: 'Consultancy Video 5' },
          { src: 'cons6.mp4', label: 'Consultancy Video 6' },
          { src: 'cons7.mp4', label: 'Consultancy Video 7' },
        ],
      },
    },
    {
      sectionKey: 'rawMaterialsHeader',
      title: 'Foundation of Heritage Header',
      data: {
        eyebrow: 'The Beginning of Craft',
        subEyebrow: 'Raw Structure · Living Craft',
        heading: 'The Foundation of Heritage',
        mainTagline: 'Where Every Royal Form Begins With Its First Honest Element.',
        description: 'Before a heritage space becomes a haveli, palace or timeless interior, it begins with the raw elements that shape its character. Stone, timber, lime, metal, plaster and handcrafted foundations form the first language of the structure — carrying the texture, strength and soul that later define the finished work.',
      },
    },
    {
      sectionKey: 'darbarGalleryHeader',
      title: 'Darbar Gallery Header',
      data: {
        eyebrow: 'Darbar Gallery',
        heading: 'A Collection of Timeless Masterpieces',
        intro: 'A curated collection of heritage expressions — from the Oladar Haveli to detailed architectural moments — designed in a traditional language while supported by modern structural strength, quality control, and enduring execution.',
      },
    },
    {
      sectionKey: 'approach',
      title: 'Approach & Principles (Virāsat)',
      data: {
        eyebrow: 'Virāsat',
        quote: 'From Architecture to Art.',
        intro: 'Heritage is not defined by structure alone. It lives in proportion, material, craft, light, ornament, and the details that give a space its soul.',
        principles: [
          { number: '01', title: 'Traditional Craftsmanship' },
          { number: '02', title: 'Authentic Materials' },
          { number: '03', title: 'Architectural Detailing' },
          { number: '04', modern: 'Modern Construction Understanding', title: 'Modern Construction Understanding' },
        ],
      },
    },
    {
      sectionKey: 'servicesHeader',
      title: 'Services Header',
      data: {
        eyebrow: 'Our Expertise',
        heading: 'Crafting Spaces Built for Legacy.',
      },
    },
    {
      sectionKey: 'contactHeader',
      title: 'Contact Header & Form',
      data: {
        eyebrow: 'Sampark',
        heading: 'Let Us Create Something Truly Exceptional.',
        intro: 'Padharo Sa — share your vision with us, and let us begin creating a space worthy of its story.',
        formTitle: 'Padharo Sa',
      },
    },
  ];
  await PageSection.insertMany(sectionsData);
  console.log('[Seed] Seeded PageSections (12 sections)');

  // 4. LEADERS
  await Leader.deleteMany({});
  await Leader.insertMany([
    {
      name: 'Balveer Singh Rathore',
      designation: 'Founder & Chief Managing Director',
      avatar: 'founder.jpeg',
      company: 'Rathore Heritage Developers',
      order: 1,
      bio: [
        'Under the vision and leadership of our Founder and Chief Managing Director, our work brings together the timeless soul of Indian heritage with contemporary craftsmanship and modern standards. With over 15 years of experience as a Heritage Developer, he has delivered numerous heritage projects with a focus on authenticity, cultural elegance, and architectural excellence.',
        'His expertise spans luxury havelis, heritage residences, palaces, resorts, heritage hotels, and bespoke traditional interiors. With deep knowledge of Rajasthani architecture, he provides expert guidance across heritage design, proportions, materials, craftsmanship, and traditional elements such as domes, chhatris, jharokhas, jaalis, mehraabs, intricate stonework, and marble detailing.',
        'His vision is to preserve the royal soul of Rajasthan while creating timeless spaces that combine heritage, luxury, functionality, and enduring beauty—where every project carries a distinctive story of craftsmanship and culture.',
      ],
    },
    {
      name: 'Yashvardhan Singh Rathore',
      designation: 'Managing Director & Civil Engineer',
      avatar: 'md.jpeg',
      company: 'Rathore Heritage Developers',
      order: 2,
      bio: [
        'Yashvardhan Singh Rathore is a Civil Engineer with hands-on experience in heritage and high-rise projects, including luxury villas. He has worked as a Site Engineer and Project Manager, managing quality control, site coordination, and technical execution. Skilled in construction detailing, material testing, estimation, BOQs, and project execution, with a strong focus on quality-driven construction.',
        'He also possesses practical knowledge of heritage craftsmanship, including jharokhas, domes, jaalis, lime mortar techniques, and traditional construction practices. He combines technical civil engineering expertise with modern project management and a deep understanding of traditional Rajasthani heritage architecture.',
      ],
    },
  ]);
  console.log('[Seed] Seeded Leaders (2 profiles)');

  // 5. CRAFTSMANSHIP (10 Shilp Kala Cards)
  await Craftsmanship.deleteMany({});
  const craftsmanshipData = [
    {
      title: 'Heritage Style Elevation',
      tagline: 'Traditional façades with Chhatris, Domes, Jharokhas and Mehraabs, inspired by the grandeur of Rajasthan.',
      description: 'Rooted in the royal architectural language of Rajasthan, our heritage style elevations combine classical proportion with sculpted chhatris, soaring domes, and ornate mehraabs. Every façade is thoughtfully engineered and hand-carved to evoke the timeless majesty and stately elegance of historical havelis and palaces.',
      image: 'card1.jpeg',
      subImages: ['card11.jpeg', 'card12.jpeg', 'card13.jpeg', 'card14.jpeg', 'card15.jpeg'],
      order: 1,
    },
    {
      title: 'Heritage Doors & Grand Entrances',
      tagline: 'Bespoke traditional doors, Dodi entrances and royal gateways crafted with timeless character.',
      description: 'Grand entrances and ceremonial Dodi gateways define the regal threshold of heritage architecture. Handcrafted from seasoned solid woods and adorned with heavy brass fittings, hand-carved panels, and authentic arches, our bespoke entrances welcome guests with dignified majesty and enduring character.',
      image: 'card24.jpg',
      subImages: ['card21.jpg', 'card22.jpeg', 'card23.jpg', 'card24.jpg'],
      order: 2,
    },
    {
      title: 'Jharokha & Jali Craft',
      tagline: 'Intricate Jharokhas and Jaali work, reflecting the fine craftsmanship of traditional Rajasthani architecture.',
      description: 'Jharokhas and delicate stone jaalis are the iconic soul of royal Rajasthani architecture. Designed to filter natural desert light and generate cooling cross-breezes, our cantilevered balconies and intricately pierced screens create mesmerizing light-and-shadow patterns while maintaining regal privacy.',
      image: 'card3.jpg',
      subImages: ['card31.jpg', 'card32.jpeg', 'card33.jpeg', 'card34.jpeg', 'card35.jpeg'],
      order: 3,
    },
    {
      title: 'Heritage Cement & Stone Craft',
      tagline: 'Handcrafted cement detailing, sandstone work, pillars, arches and Mehraabs rooted in traditional craftsmanship.',
      description: 'Reviving centuries-old artisan traditions, our cement relief and sandstone masonry bring structural artistry to life. From carved fluted pillars and scalloped mehraabs to handcrafted cornice mouldings, every curve is shaped by master artisans preserving age-old techniques with engineered permanence.',
      image: 'card4.jpg',
      subImages: ['card41.jpg', 'card42.jpg', 'card43.jpeg', 'card44.jpeg', 'card45.jpeg'],
      order: 4,
    },
    {
      title: 'Pipla Patti & Tordi Craft',
      tagline: 'Traditional ceiling ornamentation, borders and Tordi detailing inspired by classic Haveli interiors.',
      description: 'Pipla Patti and Tordi detailing represent the delicate language of classical Rajasthani interior ornamentation. Hand-modelled along wall cornices, lintels, and ceiling borders, these rhythmic leaf and scroll motifs bring subtle dimension, warmth, and aristocratically crafted refinement to haveli chambers.',
      image: 'card5.jpeg',
      subImages: ['card51.jpeg', 'card52.jpeg', 'card53.jpeg', 'card54.jpeg', 'card55.jpeg'],
      order: 5,
    },
    {
      title: 'Thekri & Decorative Glass Art',
      tagline: 'Intricate Thekri glass craftsmanship creating rich colour, reflection and royal detailing.',
      description: 'Thekri glass inlay is the crowning jewel of palace craftsmanship, where thousands of hand-cut convex mirror pieces and colored Belgium glass are meticulously set into lime plaster. The resulting mosaics shimmer under chandelier light and candlelight, turning royal halls into radiant sanctuaries of light and wonder.',
      image: 'card6.jpeg',
      subImages: ['card61.jpeg', 'card62.jpeg', 'card63.jpeg', 'card64.jpeg', 'card65.jpeg'],
      order: 6,
    },
    {
      title: 'Heritage Marble & Flooring',
      tagline: 'Bespoke marble flooring, traditional patterns and inlay work inspired by royal residences.',
      description: 'Sourced from authentic Rajasthan quarries, our heritage marble flooring combines Makrana, Banswara, and green marbles into exquisite geometric and floral inlay compositions. Hand-polished to a soft satin glow, every courtyard and corridor resonates with timeless luxury and regal coolness.',
      image: 'card7.jpeg',
      subImages: ['card71.jpeg', 'card72.jpeg', 'card73.jpeg', 'card74.jpeg', 'card75.jpeg'],
      order: 7,
    },
    {
      title: 'Domes, Chhatris & Architectural Forms',
      tagline: 'Signature Domes, Chhatris, Gokhadas and other sculptural architectural elements defining the heritage silhouette.',
      description: 'Sculptural chhatris, fluted domes, and cantilevered gokhadas define the unmistakable silhouette of Rajasthan’s architectural royalty. We engineer and carve these monumental silhouettes with geometric precision and artisanal devotion, commanding attention while honoring historical proportions.',
      image: 'card8.jpeg',
      subImages: ['card81.jpeg', 'card82.jpeg', 'card83.jpeg', 'card84.jpeg', 'card85.jpeg'],
      order: 8,
    },
    {
      title: 'Heritage Chandeliers & Jhumars',
      tagline: 'Grand Chandeliers, Jhumars and traditional lighting elements that bring a regal glow to heritage interiors.',
      description: 'Illumination in heritage spaces is an art of creating atmosphere, ceremonial warmth, and royal splendor. We curate and craft grand multi-tiered crystal chandeliers, antique brass jhumars, and delicate lantern fixtures that cast a golden, timeless luminescence across palace-scale ceilings and grand chambers.',
      image: 'card9.jpg',
      subImages: ['card91.jpeg', 'card92.jpeg', 'card93.jpeg', 'card94.jpg', 'card95.jpg'],
      order: 9,
    },
    {
      title: 'Handcrafted Art, Furniture & Interiors',
      tagline: 'Handcrafted paintings, carved furniture and bespoke interior details that complete the timeless heritage character.',
      description: 'Complete heritage living requires furniture and interior styling conceived as architecture at human scale. From teakwood and rosewood hand-carved thrones, diwans, and brass-studded ottomans to traditional miniature paintings and rich tapestries, we design complete interior environments steeped in royal authenticity and timeless luxury.',
      image: 'card104.jpeg',
      subImages: ['card101.jpeg', 'card102.jpeg', 'card103.jpeg', 'card104.jpeg', 'card105.jpeg', 'card106.jpeg', 'card107.jpeg', 'card108.jpeg', 'card109.jpeg', 'card110.jpeg'],
      order: 10,
    },
  ];
  await Craftsmanship.insertMany(craftsmanshipData);
  console.log('[Seed] Seeded Craftsmanship (10 Shilp Kala cards)');

  // 6. MATERIAL PALETTE (M1 to M8)
  await MaterialElement.deleteMany({});
  const materialsData = [];
  for (let i = 1; i <= 8; i++) {
    materialsData.push({
      code: `M${i}`,
      title: `MATERIAL ELEMENT M${i}`,
      image: `M${i}.jpeg`,
      order: i,
    });
  }
  await MaterialElement.insertMany(materialsData);
  console.log('[Seed] Seeded Material Elements (M1 - M8)');

  // 7. SIGNATURE PROJECTS
  await Project.deleteMany({});
  const projectsData = [
    {
      slug: 'oladar',
      title: 'OLADAR HAVELI',
      location: 'UDAIPUR',
      type: 'HERITAGE HAVELI CONSTRUCTION',
      isFeatured: true,
      summary: 'A heritage haveli language composed through carved dodi, glass, painted surfaces and engineered permanence.',
      hero: 'oladar1.jpeg',
      description: [
        'THE OLADAR HAVELI PROJECT HAS BEEN DESIGNED AND EXECUTED IN A COMPLETE TRADITIONAL HERITAGE STYLE WHILE ENSURING MODERN STRUCTURAL STRENGTH, QUALITY CONTROL AND DURABILITY FROM FOUNDATION TO FINAL FINISHING.',
        'THE PROJECT COMBINES TRADITIONAL RAJASTHANI HERITAGE ARCHITECTURE WITH MODERN CIVIL ENGINEERING STANDARDS TO ENSURE BOTH AESTHETIC BEAUTY AND STRUCTURAL SAFETY.',
        'EVERY ARCHITECTURAL AND INTERIOR ELEMENT HAS BEEN CONSIDERED AS PART OF A COMPLETE ROYAL HERITAGE EXPERIENCE.',
      ],
      images: Array.from({ length: 25 }, (_, i) => `oladar${i + 1}.jpeg`),
      order: 1,
    },
    {
      slug: 'roopmahal',
      title: 'ROOP MAHAL',
      location: 'UDAIPUR',
      type: 'LUXURY HERITAGE VILLA',
      isFeatured: false,
      summary: 'A villa experience shaped around royal proportion, texture and refined hospitality.',
      hero: 'roop1.jpeg',
      description: [
        'ROOP MAHAL IS A MAGNIFICENT HERITAGE-STYLE PROJECT INSPIRED BY THE TIMELESS ARCHITECTURE OF RAJASTHAN.',
        'THE EXTERIOR SHOWCASES BEAUTIFULLY CRAFTED HERITAGE-STYLE WINDOWS, TRADITIONAL ARCHES AND ELEGANT FAÇADE DETAILING THAT REFLECTS THE CHARM OF ROYAL HAVELIS.',
        'EVERY ELEMENT FROM THE ARCHITECTURAL DETAILS TO THE INTERIOR CRAFTSMANSHIP HAS BEEN THOUGHTFULLY DESIGNED TO CREATE AN AUTHENTIC HERITAGE AMBIANCE.',
      ],
      images: Array.from({ length: 10 }, (_, i) => `roop${i + 1}.jpeg`),
      order: 2,
    },
    {
      slug: 'mohan',
      title: 'MOHAN VILLA',
      location: 'UDAIPUR',
      type: 'HERITAGE STYLE VILLA / FARMHOUSE',
      isFeatured: false,
      summary: 'A farmhouse vocabulary elevated through heritage planning and hand-finished detail.',
      hero: 'mohan1.jpeg',
      description: [
        'MOHAN VILLA IS A LUXURIOUS HERITAGE-STYLE VILLA INSPIRED BY THE TRADITIONAL ARCHITECTURE OF RAJASTHANI HAVELIS.',
        'THE DESIGN SHOWCASES BEAUTIFULLY CARVED ARCHES, DECORATIVE WALL ARTWORK AND VIBRANT STAINED-GLASS WINDOWS THAT ENHANCE NATURAL LIGHT.',
        'TRADITIONAL JHAROKHA-STYLE WINDOWS, DETAILED CEILING ARTWORK AND HANDCRAFTED DÉCOR REFLECT TIMELESS CULTURAL RICHNESS.',
      ],
      images: Array.from({ length: 10 }, (_, i) => `mohan${i + 1}.jpeg`),
      order: 3,
    },
    {
      slug: 'salon',
      title: 'FIRST IMPRESSION SALON',
      location: 'UDAIPUR',
      type: 'PREMIUM COMMERCIAL INTERIOR',
      isFeatured: false,
      summary: 'Commercial interiors with a premium heritage sensibility and tactile identity.',
      hero: 'first1.jpeg',
      description: [
        'FIRST IMPRESSION SALON IS A LUXURIOUS HERITAGE-THEMED SALON INSPIRED BY THE ROYAL CHARM OF RAJASTHAN.',
        'THE SPACE FEATURES HERITAGE-STYLE INTERIORS, TRADITIONAL FURNITURE, BELGIUM GLASS WORK AND INTRICATE THEKRI GLASS WORK.',
        'CLASSIC DETAILING AND ARTISTIC ELEMENTS ENHANCE THE REGAL AMBIANCE, CREATING A PREMIUM GROOMING ENVIRONMENT.',
      ],
      images: Array.from({ length: 10 }, (_, i) => `first${i + 1}.jpeg`),
      order: 4,
    },
  ];
  await Project.insertMany(projectsData);
  console.log('[Seed] Seeded Signature Projects (4 projects with sub-pages)');

  // 8. RAW MATERIALS (Foundation of Heritage 11 slides)
  await RawMaterial.deleteMany({});
  const rawMaterialsData = [
    { type: 'image', src: 'raw10.jpeg', tagline: 'THE FIRST LAYER OF TIMELESS CRAFT', order: 1 },
    { type: 'image', src: 'raw6.jpeg', tagline: 'STONE THAT GIVES HERITAGE ITS STRENGTH', order: 2 },
    { type: 'image', src: 'raw3.jpeg', tagline: 'TIMBER SHAPED FOR A LIVING LEGACY', order: 3 },
    { type: 'image', src: 'raw4.jpeg', tagline: 'LIME AND EARTH, THE SOUL OF TRADITION', order: 4 },
    { type: 'image', src: 'raw5.jpeg', tagline: 'METAL DETAILING THAT CARRIES ROYAL CHARACTER', order: 5 },
    { type: 'image', src: 'raw10.jpeg', tagline: 'HANDCRAFTED SURFACES BORN FROM PATIENCE', order: 6 },
    { type: 'video', src: 'raw7.mp4', tagline: 'FOUNDATION ELEMENTS BUILT TO ENDURE', order: 7 },
    { type: 'video', src: 'raw8.mp4', tagline: 'TEXTURES THAT AGE WITH GRACE', order: 8 },
    { type: 'video', src: 'raw9.mp4', tagline: 'CRAFT MATERIALS THAT BECOME ARCHITECTURE', order: 9 },
    { type: 'video', src: 'raw10.mp4', tagline: 'FROM RAW ELEMENTS TO TIMELESS HERITAGE', order: 10 },
    { type: 'video', src: 'raw11.mp4', tagline: 'WHERE RAW MATERIAL BECOMES LIVING HERITAGE', order: 11 },
  ];
  await RawMaterial.insertMany(rawMaterialsData);
  console.log('[Seed] Seeded Raw Materials (11 slides)');

  // 9. DARBAR GALLERY (10 Oladar Haveli slides)
  await DarbarSlide.deleteMany({});
  const darbarSlidesData = [
    { image: 'oladar1.jpeg', tagline: 'A Legacy Carved Into Every Detail', subline: 'Traditional artistry, royal proportion, and enduring craftsmanship brought together as living heritage.', order: 1 },
    { image: 'oladar2.jpeg', tagline: 'Where Stone Remembers Royal Stories.', subline: 'Hand-finished surfaces and architectural rhythm preserve the language of Rajasthan.', order: 2 },
    { image: 'oladar3.jpeg', tagline: 'Craftsmanship That Speaks Without Words.', subline: 'Every carved element is treated as a signature of heritage, patience and precision.', order: 3 },
    { image: 'oladar4.jpeg', tagline: 'A Haveli Shaped By Living Tradition.', subline: 'Authentic details create an atmosphere that feels rooted, intimate and unmistakably royal.', order: 4 },
    { image: 'oladar5.jpeg', tagline: 'Royal Proportion. Timeless Presence.', subline: 'Balanced forms and layered detailing turn traditional architecture into an enduring experience.', order: 5 },
    { image: 'oladar6.jpeg', tagline: 'Details Made To Outlive Trends.', subline: 'From ornament to finish, each layer is designed for beauty that grows richer with time.', order: 6 },
    { image: 'oladar7.jpeg', tagline: 'Heritage, Reimagined For Generations.', subline: 'Classical Rajasthan craftsmanship is brought together with modern execution and structural discipline.', order: 7 },
    { image: 'oladar8.jpeg', tagline: 'The Soul Of Rajasthan In Every Frame.', subline: 'Light, texture and handmade character come together to create a deeply rooted visual identity.', order: 8 },
    { image: 'oladar9.jpeg', tagline: 'Built With Patience. Finished With Pride.', subline: 'A complete heritage expression where artisanship and engineering meet with quiet confidence.', order: 9 },
    { image: 'oladar10.jpeg', tagline: 'A Timeless Address For A Lasting Legacy.', subline: 'Oladar Haveli brings architecture, craft and royal living together as one enduring story.', order: 10 },
  ];
  await DarbarSlide.insertMany(darbarSlidesData);
  console.log('[Seed] Seeded Darbar Gallery (10 slides)');

  // 10. WHAT WE OFFER (5 service cards)
  await ServiceOffer.deleteMany({});
  const servicesData = [
    {
      number: '01',
      title: 'Heritage Haveli Construction',
      description: 'Complete haveli development shaped by authentic architectural detailing, traditional planning, and disciplined structural execution.',
      order: 1,
    },
    {
      number: '02',
      title: 'Luxury Heritage Villas',
      description: 'Royal-style villas balancing heritage aesthetics, refined proportion, and modern civil engineering standards.',
      order: 2,
    },
    {
      number: '03',
      title: 'Palace-Style Farmhouse Development',
      description: 'Grand farmhouse residences featuring domes, carved stonework, decorative pillars, and heritage ceilings.',
      order: 3,
    },
    {
      number: '04',
      title: 'Heritage Hotels & Resort Development',
      description: 'Culturally rich hospitality spaces shaped through traditional craftsmanship, royal detailing, and premium finishing.',
      order: 4,
    },
    {
      number: '05',
      title: 'Premium Heritage Commercial Interiors',
      description: 'Heritage-inspired interiors featuring Thekri glass, Heritage Dodi, Mor Pankh ceilings, and bespoke royal detailing.',
      order: 5,
    },
  ];
  await ServiceOffer.insertMany(servicesData);
  console.log('[Seed] Seeded Service Offers (5 cards)');

  // 11. MEDIA SEEDING (Seed key project images into GridFS)
  console.log('[Seed] Seeding key images into GridFS Media Storage...');
  const mediaToSeed = [
    'logo.PNG',
    'about.jpg',
    'founder.jpeg',
    'md.jpeg',
    'card1.jpeg',
    'card24.jpg',
    'card3.jpg',
    'card4.jpg',
    'card5.jpeg',
    'card6.jpeg',
    'card7.jpeg',
    'card8.jpeg',
    'card9.jpg',
    'card104.jpeg',
    'oladar1.jpeg',
    'roop1.jpeg',
    'mohan1.jpeg',
    'first1.jpeg',
    'M1.jpeg',
    'M2.jpeg',
    'M3.jpeg',
    'M4.jpeg',
    'M5.jpeg',
    'M6.jpeg',
    'M7.jpeg',
    'M8.jpeg',
  ];

  for (const filename of mediaToSeed) {
    await seedMediaFile(bucket, filename);
  }
  console.log(`[Seed] Seeded ${mediaToSeed.length} core media files to GridFS`);

  console.log('\n✅ SEEDING COMPLETE! Database is fully populated with authentic Rathore Heritage website data.');
  process.exit(0);
}

if (require.main === module) {
  seed().catch(err => {
    console.error('❌ [Seed Fatal Error]', err);
    process.exit(1);
  });
}

module.exports = seed;

