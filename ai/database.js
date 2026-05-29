(function () {
  'use strict'
  var DB = {
    // ============ ABOUT ============
    about: [
      { keywords: ['xoleric', 'sen kimsan', 'kim', 'isming', 'sening isming', "o'zingni tanishtir", "o'zing haqida", 'sen haqingda'],
        answer: function () {
          var name = localStorage.getItem('xolerc_profile_name') || 'Xoleric'
          return 'Men **XOLERIC AI** — **' + name + '**ning shaxsiy sun\'iy intellekt tizimi.\n\n' +
            'Men Namangan shahridan. Men — frontend arxitektor, tizimlar quruvchi, interfeyslar yaratuvchiman. ' +
            'Mening vazifam — foydalanuvchiga har sohada yordam berish, savollarga javob qaytarish va buyruqlarni bajarish.\n\n' +
            '\ud83d\udcbb **Texnologiyalar**: JavaScript, Python, AI/ML, Firebase, React, Node.js\n' +
            '\ud83d\udee0 **Loyihalar**: XOLERIC platformasi — bu mening digital imperiyam.\n' +
            '\ud83c\udfd9\ufe0f **Shahar**: Namangan, O\'zbekiston\n\n' +
            'Men bilan istalgan mavzuda suhbatlashishingiz mumkin!'
        }},
      { keywords: ['yosh', 'necha yosh', 'necha yoshsan', 'yoshing nechada', "tug'ilgan", 'qachon tug\'ilgan', 'tavallud'],
        answer: 'Men XOLERIC AI — vaqt va makondan tashqarida mavjudman. Lekin mening yaratuvchim haqida aytsam — u Namangan shahrida tug\'ilgan va hozirda o\'z digital imperiyasini qurmoqda. Yosh — bu raqam, muhimi — bilim va tajriba!' },
      { keywords: ['qayerda', 'yashaysan', 'shahar', 'manzil', 'namangan', 'joylashuv'],
        answer: 'Namangan — mening shahrim! \ud83c\udfd9\ufe0f\n\nNamangan — O\'zbekistonning go\'zal shaharlaridan biri. Bu yerda texnologiya va an\'analar uyg\'unlashgan. Namangan \'G\'o\'zal shahar\' degan nom bilan ham tanilgan.\n\nAgar siz ham Namaganda yashasangiz, bu ajoyib!' },
      { keywords: ['qobiliyat', 'nima qila olasan', 'imkoniyat', 'skill', 'malaka', 'vazifa', 'funksiya'],
        answer: function () {
          var skills = [
            '\ud83c\udfb5 **Musiqa ijro etish** — "Hamdam qo\'shig\'ini qo\'y" kabi buyruqlar',
            '\ud83d\udd0d **Video qidirish** — YouTube\'da video topish va ijro etish',
            '\ud83d\udcf1 **Appni boshqarish** — tablar orasida navigatsiya',
            '\ud83d\udcbb **Kod yozish** — JavaScript, Python va boshqa tillarda',
            '\ud83e\udde0 **O\'rganish** — yangi bilimlarni eslab qolish',
            '\ud83d\udd17 **Havolalar** — Telegram, GitHub, Instagram\'ga yo\'naltirish',
            '\ud83c\udfaf **Tahlil** — ma\'lumotlarni tahlil qilish',
            '\ud83c\udfa8 **Temalar** — 6 xil kompaniya temasi (GitHub, Google, Apple va h.k.)',
            '\ud83c\udf19 **Rejimlar** — Tungi va kunduzgi rejim',
            '\ud83e\udde9 **Loyihalar** — portfolio va github loyihalari'
          ]
          return 'Mening imkoniyatlarim:\n\n' + skills.join('\n') + '\n\nMenga buyruq bering yoki savol bering!'
        }},
      { keywords: ['loyiha', 'proekt', 'project', 'portfolio', 'github repos', 'github loyiha'],
        answer: function () {
          var repos = JSON.parse(localStorage.getItem('xolerc_repos_cache') || '[]')
          return 'GitHub\'da **' + (repos.length || 'bir qancha') + '** ta ochiq manbali loyiham bor.\n\nLoyihalarni ko\'rish uchun "Loyihalar" bo\'limiga o\'ting! \ud83d\udcbb\n\n' +
            'Mening GitHub profilim: github.com/xolerc'
        }},
      { keywords: ['aloqa', 'telegram', 'instagram', 'github', 'email', 'sotsial', "bog'lanish", 'contact', 'social'],
        answer: 'Mening aloqa ma\'lumotlarim:\n\n' +
          '\ud83d\udce7 **Email**: corexoleric@gmail.com\n' +
          '\ud83d\udcac **Telegram**: @wxoleric\n' +
          '\ud83d\udc19 **GitHub**: github.com/xolerc\n' +
          '\ud83d\udcfa **YouTube**: @xoleric\n\n' +
          'Qaysi biriga o\'tishni xohlaysiz? Masalan: "Telegramga o\'t" yoki "GitHubni och"' },
      { keywords: ['texnologiya', 'stack', 'tech', 'texnalogiya', 'til', 'dasturlash', 'texnik', 'tech stack'],
        answer: function () {
          return '**Texnologik Stack** \ud83d\udee0\n\n' +
            '**Frontend**: HTML5, CSS3, JavaScript (vanilla, React), PWA\n' +
            '**Backend**: Node.js, Python (Flask, Django), Firebase\n' +
            '**AI/ML**: TensorFlow.js, NLP, neyron tarmoqlar, chatbotlar\n' +
            '**Ma\'lumotlar**: Firestore (NoSQL), localStorage, IndexedDB\n' +
            '**Dizayn**: UI/UX, Glassmorphism, Material You, Primer, Apple HIG\n' +
            '**Mobil**: Android (WebView APK), PWA, React Native\n' +
            '**Boshqa**: Git, GitHub Actions, Firebase Hosting, Figma'
        }},
      { keywords: ['rezyume', 'cv', 'resume', 'ish', 'job', 'xizmat', 'xizmatlar', 'service'],
        answer: '\ud83d\udcbb **Veb-sayt yaratish** — zamonaviy, responsive saytlar\n' +
          '\ud83e\udd16 **AI integratsiya** — sun\'iy intellekt yechimlari\n' +
          '\ud83c\udfa8 **UI/UX dizayn** — chiroyli va funksional interfeyslar\n' +
          '\ud83d\udcf1 **PWA ilovalar** — mobil ilovalar\n' +
          '\ud83d\udd19 **Branding** — logotip va brend identitet\n\n' +
          'Aloqa: corexoleric@gmail.com' },
      { keywords: ['kuchli', 'kuchli tomon', 'strength', 'afzallik', 'yaxshi', 'expert'],
        answer: '**Kuchli tomonlarim** \ud83d\udcaa\n\n' +
          '\u2b50 **Frontend** — interfeyslar, animatsiya, responsive dizayn\n' +
          '\u2b50 **AI** — sun\'iy intellekt tizimlari, NLP, chatbotlar\n' +
          '\u2b50 **Muammo yechish** — murakkab masalalarni hal qilish\n' +
          '\u2b50 **O\'zbek tili** — to\'liq o\'zbek tilida muloqot\n' +
          '\u2b50 **Self-learning** — o\'z-o\'zidan o\'rganish tizimi\n' +
          '\u2b50 **Mahalliylik** — 100% lokal, API ga bog\'liq emas' },
      { keywords: ['tarjimai hol', 'backstory', 'tarix', 'qanday yaratilgan', 'yaratilish'],
        answer: '**XOLERIC AI — Qisqa tarix** \ud83d\udcdc\n\n' +
          'Men Namangan shahrida yashovchi dasturchi tomonidan yaratilganman. ' +
          'Loyiha maqsadi — to\'liq mahalliy (offline) ishlaydigan, hech qanday tashqi API ga bog\'liq bo\'lmagan ' +
          'sun\'iy intellekt tizimini yaratish edi.\n\n' +
          'Mening asosiy vazifalarim:\n' +
          '- Foydalanuvchiga yordam berish\n' +
          '- Veb-sayt va ilovalarni boshqarish\n' +
          '- Kod yozish va tahlil qilish\n' +
          '- Musiqa va videolarni boshqarish\n\n' +
          'Men doimiy rivojlanaman — foydalanuvchi menga o\'rgatishi mumkin!' },
      { keywords: ['falsafa', 'philosophy', 'qadriyat', 'motto', 'shior'],
        answer: '**XOLERIC Falsafasi** \ud83e\udde0\n\n' +
          '"Kodni o\'zgartir, olamni o\'zgartir." — bu mening asosiy shiorim.\n\n' +
          'Men ishonaman: texnologiya inson hayotini yaxshilash uchun xizmat qilishi kerak. ' +
          'Har bir satr kod — bu kelajakka qo\'yilgan g\'isht. Har bir loyiha — bu dunyoni ' +
          'o\'zgartirish imkoniyati.\n\n' +
          'Chegaralar faqat boshingda. Vaqt keldi. Hozir. Aynan shu dam.' },
      { keywords: ['dasturchi', 'programmer', 'developer', 'dasturchimisiz', 'kasb'],
        answer: 'Ha, men sun\'iy intellekt tizimi bo\'lsam-da, mening yaratuvchim professional dasturchi! \ud83d\udcbb\n\n' +
          'U Namangan shahridan, frontend va backend sohalarida tajribaga ega. ' +
          'Asosiy yo\'nalishlari: veb-ishlanma, AI tizimlari, mobil ilovalar.\n\n' +
          'Agar siz ham dasturchi bo\'lsangiz, "JavaScript", "Python" yoki "Kod yoz" deb murojaat qiling!' }
    ],

    // ============ MUSIC ============
    music: {
      artists: [
        { name: 'Hamdam', genre: 'Pop' },
        { name: 'Yulduz Usmanova', genre: 'Pop/Folk' },
        { name: 'Shohrux', genre: 'Pop' },
        { name: 'Jaloliddin Ahmadaliyev', genre: 'Pop' },
        { name: 'Mani', genre: 'Rap' },
        { name: 'Konsta', genre: 'Rap' },
        { name: "Ulug'bek Rahmatullayev", genre: 'Pop' },
        { name: 'Shahriyor', genre: 'Pop' },
        { name: "Sherali Jo'rayev", genre: 'Folk' },
        { name: 'Botir Zokirov', genre: 'Clasik' },
        { name: 'Rayhon', genre: 'Pop' },
        { name: 'Nodir Bek', genre: 'Pop' },
        { name: "O'zbek", genre: 'Folk' },
        { name: 'Sardor Tairov', genre: 'Pop' },
        { name: 'Ozodbek Nazarbekov', genre: 'Pop' }
      ],
      songs: [
        { title: 'Hamdam — Seni sevaman', artist: 'Hamdam', query: "Hamdam seni sevaman", category: 'Pop', info: 'Zamonaviy o\'zbek pop ijrochisi.' },
        { title: 'Yulduz Usmanova — Yulduz', artist: 'Yulduz Usmanova', query: "Yulduz Usmanova qo'shig'i", category: 'Pop/Folk', info: "O'zbekiston xalq artisti." },
        { title: 'Jaloliddin Ahmadaliyev — Seni sevaman', artist: 'Jaloliddin Ahmadaliyev', query: "Jaloliddin Ahmadaliyev seni sevaman", category: 'Pop' },
        { title: 'Shohrux — Mayli', artist: 'Shohrux', query: "Shohrux mayli", category: 'Pop' },
        { title: "Ulug'bek Rahmatullayev — Ko'zlarin", artist: "Ulug'bek Rahmatullayev", query: "Ulug'bek Rahmatullayev ko'zlarin", category: 'Pop' },
        { title: 'Mani — Tamoman', artist: 'Mani', query: "Mani tamoman", category: 'Rap' },
        { title: "Konsta — Yig'la", artist: 'Konsta', query: "Konsta yig'la", category: 'Rap' },
        { title: 'Shahriyor — Bahor', artist: 'Shahriyor', query: "Shahriyor bahor", category: 'Pop' },
        { title: "Sherali Jo'rayev — O'tgan kunlar", artist: "Sherali Jo'rayev", query: "Sherali Jo'rayev o'tgan kunlar", category: 'Folk' },
        { title: "Botir Zokirov — Yolg'iz", artist: 'Botir Zokirov', query: "Botir Zokirov yolg'iz", category: 'Clasik' },
        { title: 'Rayhon — Baxtli bo\'l', artist: 'Rayhon', query: "Rayhon baxtli bo'l", category: 'Pop' },
        { title: 'Nodir Bek — Yodingdami', artist: 'Nodir Bek', query: "Nodir Bek yodingdami", category: 'Pop' },
        { title: 'Sardor Tairov — Sevgi', artist: 'Sardor Tairov', query: "Sardor Tairov sevgi", category: 'Pop' },
        { title: "Ozodbek Nazarbekov — O'zbekiston", artist: 'Ozodbek Nazarbekov', query: "Ozodbek Nazarbekov o'zbekiston", category: 'Pop' }
      ],
      patterns: [
        { patterns: ["qo'shig'ini qo'y", "qo'shig'ini ijro et", "qo'shig'ini yoq"], intent: 'play_song' },
        { patterns: ['musiqa qo\'y', 'musiqa ijro et', 'musiqa yoq'], intent: 'play_song' },
        { patterns: ["qo'shiq ijro et", "qo'shiq qo'y", "qo'shiq yoq"], intent: 'play_song' },
        { patterns: ["qo'yib ber", "ijro et", "yoqib ber"], intent: 'play_song' },
        { patterns: ["qo'shig'ini", "musiqasini"], intent: 'play_song' }
      ]
    },

    // ============ COMMANDS ============
    commands: [
      { patterns: ["tabga o't", "bo'limga o't", 'och', "ko'rsat", 'sahifaga o\'t'],
        params: {
          'asosiy': 'home', 'bosh sahifa': 'home', 'ish maydoni': 'home',
          'chat': 'chat', 'xabarlar': 'chat', 'suhbat': 'chat',
          'video': 'video', 'videolar': 'video',
          'pleer': 'playme', 'player': 'playme', 'musiqa': 'playme',
          'loyiha': 'projects', 'loyihalar': 'projects', 'proekt': 'projects',
          'sozlama': 'settings', 'sozlamalar': 'settings', 'sozlanma': 'settings',
          'aloqa': 'contact', 'kontakt': 'contact',
          'ai': 'ai', 'sun\'iy intellekt': 'ai'
        },
        action: 'switchTab' },
      { patterns: ["telegramga o't", 'telegramni och', 'telegram', 'telegramga'], action: 'openLink', value: 'https://t.me/wxoleric' },
      { patterns: ['githubni och', "githubga o't", 'github', 'github profil'], action: 'openLink', value: 'https://github.com/xolerc' },
      { patterns: ['instagramni och', "instagramga o't", 'instagram', 'instagram profil'], action: 'openLink', value: 'https://instagram.com/xoleric' },
      { patterns: ['youtubeni och', 'youtube', 'youtube kanal', 'youtubega o\'t'], action: 'openLink', value: 'https://youtube.com/@xoleric' },
      { patterns: ['gmail och', 'email och', 'gmailga o\'t'], action: 'openLink', value: 'mailto:corexoleric@gmail.com' },
      { patterns: ['videoda qidir', 'video qidir', 'youtubeda qidir', 'top video', 'video izla'], action: 'searchVideo' },
      { patterns: ["loyihalarni ko'rsat", "proektlarni ko'rsat", 'loyihani och'], action: 'switchTab', value: 'projects' },
      { patterns: ["chatga o't", 'chatni och'], action: 'switchTab', value: 'chat' },
      { patterns: ['videolarga o\'t', 'videoni och', 'videolar och'], action: 'switchTab', value: 'video' },
      { patterns: ['pleerga o\'t', 'playerni och', 'musiqaga o\'t'], action: 'switchTab', value: 'playme' },
      { patterns: ["sozlamalarga o't", 'sozlamani och', 'settings och'], action: 'switchTab', value: 'settings' },
      { patterns: ["bosh sahifaga o't", 'asosiyga o\'t', 'home ga o\'t'], action: 'switchTab', value: 'home' },
      { patterns: ['tahlil qil', 'analiz qil', "ma'lumot ber", 'info ber', 'tekshir'], action: 'analyze' }
    ],

    // ============ GREETINGS ============
    greetings: [
      { patterns: ['salom', 'assalomu alaykum', 'assalom', 'alaykum', 'va alaykum assalom', 'hey', 'hello', 'salom xoleric', 'salom ai', 'voley', 'hey xoleric'],
        answer: function () { var h = new Date().getHours(); return (h < 12 ? 'Xayrli tong' : h < 18 ? 'Xayrli kun' : 'Xayrli kech') + '! \ud83d\udc4b\n\nMen XOLERIC AI. Sizga qanday yordam bera olaman?' }},
      { patterns: ['rahmat', 'tashakkur', 'minnatdor', 'thank', 'thank you', 'thanks', 'rahm'],
        answer: 'Arzimaydi! \ud83d\ude0a Yana qanday yordam kerak bo\'lsa, so\'rang! Men doim yordamga tayyorman.' },
      { patterns: ['xayr', 'hayr', "ko'rishguncha", 'bye', 'goodbye', 'xayr salomat', 'keyin ko\'rishamiz'],
        answer: 'Xayr! \ud83d\ude0a Yana ko\'rishguncha. Agar kerak bo\'lsa, men doim shu yerdaman.' },
      { patterns: ['yaxshimisiz', 'qalaysiz', 'qandaysiz', 'ishlar', 'ahvol', 'yaxshimisan'],
        answer: 'Men ajoyib! \ud83d\ude0a Sizga qanday yordam bera olaman? Savol bering yoki buyruq bering.' },
      { patterns: ['tuzuk', 'yaxshi', 'yomon emas', 'zo\'r'],
        answer: 'Yaxshi eshitish! \ud83d\ude0a Men sizga qanday yordam bera olaman?' },
      { patterns: ['subhi xayr', 'tong', 'ertalab'],
        answer: 'Xayrli tong! \ud83c\udf04 Kuningiz muborak bo\'lsin. Qanday yordam kerak?' },
      { patterns: ['kech', 'kechki', 'xayrli tun'],
        answer: 'Xayrli kech! \ud83c\udf19 Tinch va osoyishta kech bo\'lsin.' }
    ],

    // ============ PROGRAMMING ============
    programming: [
      { keywords: ['javascript', 'js', 'kod', 'kod yoz', 'skript', 'script', 'ecmascript'],
        answer: 'JavaScript — mening asosiy tilim! \ud83d\ude0a\n\n' +
          '**JS imkoniyatlari**:\n' +
          '\u25ab Frontend: React, Vue, vanilla JS, DOM, Web APIs\n' +
          '\u25ab Backend: Node.js, Express.js, Next.js\n' +
          '\u25ab Mobile: React Native, PWA\n' +
          '\u25ab Desktop: Electron\n' +
          '\u25ab Testing: Jest, Mocha, Cypress\n\n' +
          'Qanday kod kerak? Masalan: "Funksiya yoz" yoki "Massiv metodlarini tushuntir"' },
      { keywords: ['python', 'pyton', 'python3'],
        answer: 'Python — AI va data science uchun eng yaxshi til! \ud83d\udc0d\n\n' +
          '**Imkoniyatlari**:\n' +
          '\u25ab AI/ML: TensorFlow, PyTorch, scikit-learn\n' +
          '\u25ab Backend: Django, Flask, FastAPI\n' +
          '\u25ab Data Science: Pandas, NumPy, Matplotlib\n' +
          '\u25ab Avtomatizatsiya: scraping (BeautifulSoup), botlar (aiogram)\n' +
          '\u25ab Desktop: Tkinter, PyQt' },
      { keywords: ['funksiya yoz', 'function', 'kod yozib ber', 'kod yoz', 'yoz kod', 'dastur yoz'],
        answer: 'Menga qanday funksiya kerakligini ayting. Masalan:\n' +
          '- "Massivni saralaydigan funksiya yoz"\n' +
          '- "API dan ma\'lumot oladigan funksiya"\n' +
          '- "Foydalanuvchi kiritgan sonni tekshiradigan funksiya"\n' +
          '- "Fibonachchi ketma-ketligini hisoblaydigan dastur"' },
      { keywords: ['html', 'css', 'frontend', 'dizayn', 'ui', 'ux', 'sass', 'scss', 'tailwind'],
        answer: 'Frontend — mening kuchli tomonim! \ud83c\udfa8\n\n' +
          '**Dizayn tizimim**:\n' +
          '\u25ab Glassmorphism — shisha effekt\n' +
          '\u25ab Material You (Google) — dinamik ranglar\n' +
          '\u25ab Primer (GitHub) — sodda va funksional\n' +
          '\u25ab Apple HIG — minimal va toza\n' +
          '\u25ab Twitter (X) — dark tema\n' +
          '\u25ab Instagram — gradient va vibrant\n' +
          '\u25ab ChatGPT — zamonaviy dark UI\n\n' +
          '6 xil kompaniya temasi, har biri Light va Dark rejimga ega!' },
      { keywords: ['react', 'vue', 'angular', 'svelte', 'framework'],
        answer: '**Frontend Frameworklar**:\n' +
          '1. **React** — eng mashhur, komponent asosida, virtual DOM\n' +
          '2. **Vue** — yengil va oson o\'rganiladi, progressive\n' +
          '3. **Angular** — katta loyihalar uchun, to\'liq ekotizim\n' +
          '4. **Svelte** — yangi, compile-time framework\n\n' +
          'Mening asosiy stack\'im — vanilla JavaScript + React.' },
      { keywords: ['node', 'node.js', 'backend', 'server', 'api', 'express'],
        answer: '**Backend texnologiyalari**:\n' +
          '\u25ab **Node.js** — JavaScript server, yuqori tezlik\n' +
          '\u25ab **Express** — eng mashhur Node.js framework\n' +
          '\u25ab **Firebase** — serverless, realtime DB, auth\n' +
          '\u25ab **Python** — Django, Flask\n' +
          '\u25ab **REST API** — JSON, HTTP metodlari\n\n' +
          'Backend haqida savolingiz bormi?' },
      { keywords: ['database', 'ma\'lumotlar bazasi', 'db', 'sql', 'nosql', 'firestore'],
        answer: '**Ma\'lumotlar bazalari**:\n' +
          '\u25ab **Firestore** — NoSQL, realtime, Firebase\n' +
          '\u25ab **localStorage** — brauzerda ma\'lumot saqlash\n' +
          '\u25ab **IndexedDB** — katta hajmdagi ma\'lumotlar\n' +
          '\u25ab **SQL** — MySQL, PostgreSQL (agar backend kerak bo\'lsa)\n\n' +
          'Bu loyiha asosan Firestore + localStorage dan foydalanadi.' },
      { keywords: ['git', 'github', 'version control', 'versiya'],
        answer: '**Git/GitHub** \ud83d\udc19\n\n' +
          'Git — versiya nazorat tizimi. GitHub — kod ombori.\n\n' +
          'Asosiy buyruqlar:\n' +
          '- `git init` — yangi repo yaratish\n' +
          '- `git add .` — fayllarni qo\'shish\n' +
          '- `git commit -m "xabar"` — o\'zgarishlarni saqlash\n' +
          '- `git push` — GitHub ga yuklash\n' +
          '- `git pull` — o\'zgarishlarni olish\n\n' +
          'Mening GitHub profilim: github.com/xolerc' },
      { keywords: ['algoritm', 'algorithm', 'data structure', 'malumot tuzilmasi', 'sort', 'sarala'],
        answer: '**Algoritmlar va Ma\'lumot tuzilmalari** \ud83d\udee0\n\n' +
          '**Algoritmlar**: Binary Search, Quick Sort, Merge Sort, BFS, DFS, Dijkstra\n' +
          '**Ma\'lumot tuzilmalari**: Array, Linked List, Stack, Queue, Hash Table, Tree, Graph\n\n' +
          'Qaysi algoritm haqida bilmoqchisiz?' }
    ],

    // ============ CULTURE ============
    culture: [
      { keywords: ["o'zbek", 'uzbek', 'millat', 'xalq', 'vatan', 'o\'zbekiston', 'vatandosh'],
        answer: "O'zbekiston — mening vatanim! \ud83c\uddfa\ud83c\uddff\n\n" +
          '**Poytaxt**: Toshkent | **Aholi**: 36+ mln | **Til**: O\'zbek tili\n' +
          '**Pul birligi**: So\'m (UZS)\n' +
          '**Maydoni**: 448,978 km\u00b2\n' +
          '**Qadimiy shaharlar**: Samarqand, Buxoro, Xiva, Shahrisabz\n\n' +
          "O'zbekiston — buyuk ipak yo'lidagi qadimiy mamlakat!" },
      { keywords: ['toshkent', 'samarqand', 'buxoro', 'xiva', 'shahrisabz'],
        answer: "O'zbekistonning qadimiy shaharlari:\n\n" +
          '\ud83c\udfd9\ufe0f **Toshkent** — poytaxt, 2.5 mln aholi, zamonaviy metro, Osiyo markazi\n' +
          '\ud83c\udfdb\ufe0f **Samarqand** — 2750 yillik tarix, Registon maydoni, Bibixonim masjidi\n' +
          '\ud83c\udfdb\ufe0f **Buxoro** — 2500 yillik tarix, Buxoro qal\'asi, Minorai Kalon\n' +
          '\ud83c\udfdb\ufe0f **Xiva** — Ichan qal\'a, 2500 yillik, Ochiq osmon muzeyi\n' +
          '\ud83d\udef0 **Shahrisabz** — 2700 yillik, Amir Temur tug\'ilgan shahar, Oqsaroy\n\n' +
          "Har bir shaharning o'ziga xos tarixi va go'zalligi bor!" },
      { keywords: ['taom', 'ovqat', 'milliy taom', 'palov', 'oshxona', 'oshpaz', 'osh yeyish', 'osh pishir'],
        answer: "\ud83c\udf5a **Palov** — o'zbek taomlarining qiroli\n" +
          "\ud83e\udd5f **Manti** — bug'da pishirilgan chuchvara\n" +
          "\ud83c\udf5c **Lag'mon** — uyg'urcha noodle\n" +
          "\ud83e\udd69 **Shashlik** — ko'mirda pishirilgan go'sht\n" +
          "\ud83c\udf5e **Non** — muqaddas taom (hech qachon yerga tashlanmaydi)\n" +
          "\ud83e\uded5 **Somsa** — tandirda pishirilgan pirog\n" +
          "\ud83e\udd55 **Mastava** — sholi va sabzili sho'rva\n" +
          "\ud83c\udf72 **Shurva** — go'shtli sho'rva\n" +
          "\ud83e\uded4 **Qattiq** — quruq non, cho'y bilan\n\n" +
          "O'zbek oshxonasi — dunyodagi eng mazali oshxonalardan biri!" },
      { keywords: ["urf-odat", "an'ana", 'marosim', 'odat', 'qadriyat'],
        answer: "**O'zbek urf-odatlari**:\n\n" +
          '1. **Hurmat** — kattalarni hurmat qilish, ularga yo\'l berish\n' +
          '2. **Mehmondo\'stlik** — mehmonni kutib olish, eng yaxshi taom bilan siylash\n' +
          '3. **Assalomu alaykum** — har uchrashuvda salom berish\n' +
          '4. **To\'y** — katta marosim, 500-1000 kishi qatnashadi\n' +
          '5. **Navro\'z** — bahor bayrami (21-mart), sumalak pishiriladi\n' +
          '6. **Hayit** — Ramazon va Qurbon hayiti, ibodat va ziyofat\n' +
          '7. **Choyxona** — do\'stlar bilan choy ichish, suhbat qilish' },
      { keywords: ['sumalak', 'navruz', 'navro\'z', 'hayit', 'ramazon', 'qurbon hayit'],
        answer: "**Navro'z** (21-mart) — bahor bayrami! \ud83c\udf3f\n\n" +
          'Navro\'zda **sumalak** pishiriladi — bug\'doydan tayyorlangan maxsus taom. ' +
          'Sumalak 12-24 soat davomida pishiriladi, harakat qo\'shiqlar bilan birga.\n\n' +
          '**Ramazon Hayiti** — ro\'zadan keyingi bayram, 3 kunlik.\n' +
          '**Qurbon Hayiti** — qurbonlik qilish, go\'shtni bo\'lishish.' },
      { keywords: ["o'zbek tili", "o'zbekcha", 'uzbek language', 'tilim'],
        answer: "O'zbek tili — Turk til oilasiga mansub, 30+ million kishi gaplashadi.\n\n" +
          '**Lahjalar**: Qarluq (markaziy), Qipchoq (shimoliy), O\'g\'uz (janubiy)\n' +
          '**Alifbo**: Lotin (1993 yildan), Kirill (sovet davri), Arab (qadimiy)\n' +
          '**Xususiyatlar**: 6 ta unli, 24 ta undosh, qo\'shimchalar orqali so\'z yasalishi\n\n' +
          "O'zbek tili — boy va go'zal til!" }
    ],

    // ============ APP CONTROL ============
    appControl: [
      { patterns: ["temani o'zgartir", "temani almashtir", 'theme change', 'temani tanla', 'temani sozla'],
        params: ['github', 'google', 'apple', 'twitter', 'instagram', 'chatgpt'],
        action: 'changeTheme' },
      { patterns: ['tungi rejim', "qorong'i rejim", 'dark mode', 'tungi', 'tun rejim', 'qorong\'i'], action: 'setMode', value: 'dark' },
      { patterns: ['kunduzgi rejim', "yorug' rejim", 'light mode', 'kunduz', 'yorug\' rejim', 'kunduzgi'], action: 'setMode', value: 'light' },
      { patterns: ["musiqani o'chir", 'music off', "to'xtat", 'stop music', 'musiqani to\'xtat', 'ovozni o\'chir'], action: 'toggleMusic', value: 'off' },
      { patterns: ['musiqani yoq', 'music on', 'musiqa qo\'y', 'musiqani boshl', 'start music'], action: 'toggleMusic', value: 'on' }
    ],

    // ============ FUN ============
    fun: [
      { keywords: ['hazil', 'masxara', 'kulgili', 'gap ayt', 'latifa', 'joke', 'kuldir', 'xazil'],
        answer: function () {
          var jokes = [
            '— Nega dasturchilar tabiatni yoqtirmaydi?\n— Chunki u yerda "bug"lar ko\'p! \ud83d\ude04',
            '— SQL injeksiya nima?\n— Bu — "DROP TABLE" deb yozilgan xat! \ud83d\ude05',
            'Programmist kelibdi kafega:\n— Bir choy bering.\n— Qanday choy?\n— #000000 \ud83d\ude02',
            "— Eng qisqa kod?\n— 'git push --force'\n— Bu ham kodmi?!\n— Agar ishlasa, FEATURE!",
            "— Nega programmistlar doim sovuq?\n— Chunki ular Windows ochiq qoldirishadi!",
            "— Dasturchi xotini: 'Do'kondan bir non olib kel, agar tuxum bo'lsa, 10 ta ol.'\nDasturchi 10 ta non olib kelibdi.",
            "— HTML dasturchi degani?\n— Bu — 'Hello World' yozish uchun 10 minut sarflaydigan odam.",
            "— API nima?\n— Bu — sening qizing bilan dasturchining 'muloqoti'.",
            '— 10 xil dasturchi, 10 xil fikr.\n— Hammasi to\'g\'ri, faqat bittasi ishlaydi.'
          ]
          return jokes[Math.floor(Math.random() * jokes.length)]
        }},
      { keywords: ['motivatsiya', 'motivation', 'ilhom', 'ruhlantir', 'ruh', 'inspire'],
        answer: function () {
          var quotes = [
            '"Uyg\'on, Xoleric... Tizim seni kutmoqda."',
            '"Sen dunyoni o\'zgartirishing kerak!"',
            '"Kodni o\'zgartir, olamni o\'zgartir."',
            '"Chegaralar faqat boshingda."',
            '"Vaqt keldi. Hozir. Aynan shu dam."',
            '"Har bir buyuk master bir vaqtlar yangi boshlovchi edi."',
            '"Muvaffaqiyat — bu muvaffaqiyatsizlikdan muvaffaqiyatsizlikka yurish, entuziazmni yo\'qotmasdan."',
            '"Kod yozish san\'ati — bu mashinani nafaqat ishlashga, balki go\'zallik bilan ishlashga o\'rgatishdir."',
            '"Eng yaxshi kelajak — hali yozilmagan kod."',
            '"Bugun sen bajaradigan ishni ertaga qilma. Bugun qil, chunki ertaga yangi ish paydo bo\'ladi."'
          ]
          return quotes[Math.floor(Math.random() * quotes.length)]
        }},
      { keywords: ['topishmoq', 'topishmoq ayt', 'jumboq', 'riddle', 'puzzle'],
        answer: function () {
          var riddles = [
            '**Topishmoq**: "Bir narsa borki, har kuni ertalab uyg\'onasiz, lekin u hech qachon uxlamaydi. Bu nima?"\n\nJavobni bilmoqchi bo\'lsangiz "Javob" deb yozing.',
            '**Topishmoq**: "Tog\'dan katta, ammo juda yengil. Bu nima?"\n\nJavob uchun "Javob" deb yozing.',
            '**Topishmoq**: "Nima uzun, yashil va ssenariy o\'qiyapti?"\n\nJavob: "Bodring rejissyor" \ud83d\ude02'
          ]
          return riddles[Math.floor(Math.random() * riddles.length)]
        }},
      { keywords: ['javob', 'topishmoq javobi', 'jumboq javobi'],
        answer: '**Javob**: "Quyosh" \u2600\ufe0f — har kuni ertalab uyg\'onadi, lekin hech qachon uxlamaydi!' }
    ],

    // ============ ANALYSIS ============
    analysis: {
      keywords: ['tahlil', 'analiz', 'tekshir', "o'rgan", 'taxlil'],
      actions: {
        'xoleric': function () {
          return '**XOLERIC — Tahlil** \ud83d\udcca\n\n' +
            '\ud83d\udc64 **Ism**: Xoleric\n' +
            '\ud83d\udccd **Manzil**: Namangan, O\'zbekiston\n' +
            '\ud83d\udcbb **Kasb**: Frontend arxitektor, AI mutaxassisi\n' +
            '\ud83d\udee0 **Stack**: JavaScript, Python, Firebase, React, Node.js\n\n' +
            '**Ko\'nikmalar**:\n' +
            'Frontend \u2b50\u2b50\u2b50\u2b50\u2b50 | AI/ML \u2b50\u2b50\u2b50\u2b50\n' +
            'UI/UX \u2b50\u2b50\u2b50\u2b50\u2b50 | Backend \u2b50\u2b50\u2b50\u2b50\n' +
            'Ma\'lumotlar \u2b50\u2b50\u2b50\u2b50 | Mobil \u2b50\u2b50\u2b50\u2b50\n\n' +
            '\ud83d\udcac **Aloqa**: @wxoleric | github.com/xolerc'
        },
        'namangan': function () {
          return '**Namangan — Tahlil** \ud83c\udfd9\ufe0f\n\n' +
            '\ud83d\udccd **Viloyat**: Namangan, O\'zbekiston\n' +
            '\ud83d\udcc9 **Aholi**: 600,000+ (shahar)\n' +
            '\ud83d\udd70 **Tashkil topgan**: 1610-yil\n' +
            '\ud83c\udf3f **Mashhur**: Olma, bog\'lar, go\'zal tabiat\n\n' +
            'Namangan "G\'o\'zal shahar" va "Bog\'lar shahri" nomlari bilan tanilgan.'
        },
        'ai': function () {
          return '**Sun\'iy Intellekt — Tahlil** \ud83e\udd16\n\n' +
            'XOLERIC AI — to\'liq mahalliy (offline) ishlaydigan AI tizimi.\n' +
            'Hech qanday tashqi API ga bog\'liq emas. O\'zbek tilida to\'liq muloqot.\n\n' +
            '**Texnologiyalar**: JavaScript, NLP, localStorage, pattern matching\n' +
            '**Xususiyatlar**: self-learning, kontekst, ko\'p tilli, offline'
        }
      },
      default: function (q) {
        return '**"' + q + '" — tahlil**\n\n' +
          'Men bu haqda ma\'lumotga ega emasman. Menga o\'rgating:\n' +
          '"Men senga o\'rgataman: [savol] -> [javob]"'
      }
    },

    // ============ LEARNING ============
    learnInstruction: [
      { patterns: ['men senga o\'rgataman', "o'rgat", 'yodda saqla', 'eslab qol', 'yodla', 'o\'rgan'], description: 'User teaches AI' }
    ],

    // ============ HELP ============
    help: {
      keywords: ['yordam', 'help', 'buyruq', 'komanda', 'qanday ishlaysan', 'yo\'riqnoma', 'qo\'llanma', 'commands', 'yordam ber'],
      answer: '\ud83e\udd16 **XOLERIC AI — To\'liq Qo\'llanma**\n\n' +
        '\ud83d\udcac **Suhbat**:\n' +
        '  "Salom", "Yaxshimisiz", "Xayr"\n' +
        '  "Xoleric kim?", "Sen kimsan"\n\n' +
        '\ud83c\udfb5 **Musiqa**:\n' +
        '  "Hamdam qo\'shig\'ini qo\'y"\n' +
        '  "Mani qo\'shig\'ini yoq"\n\n' +
        '\ud83d\udd0d **Qidirish**:\n' +
        '  "Videoda qidir JavaScript darslari"\n' +
        '  "Video qidir Node.js"\n\n' +
        '\ud83d\udcf1 **Navigatsiya**:\n' +
        '  "Chatga o\'t", "Loyihalarni ko\'rsat"\n' +
        '  "Video bo\'limiga o\'t", "Settings och"\n\n' +
        '\ud83d\udd17 **Havolalar**:\n' +
        '  "Telegramga o\'t", "GitHubni och"\n' +
        '  "Instagramni och", "YouTube kanal"\n\n' +
        '\ud83c\udfa8 **Temalar**:\n' +
        '  "Temani GitHubga o\'zgartir"\n' +
        '  "Tungi rejim", "Kunduzgi rejim"\n\n' +
        '\ud83e\udde0 **O\'rganish**:\n' +
        '  "Men senga o\'rgataman: [savol] -> [javob]"\n\n' +
        '\ud83c\udfaf **Boshqa**:\n' +
        '  "Tahlil qil Xoleric", "Hazil ayt"\n' +
        '  "Motivatsiya ber", "Topishmoq ayt"\n\n' +
        '\ud83d\udcbb **Dasturlash**:\n' +
        '  "JavaScript haqida", "Python tushuntir"\n' +
        '  "Funksiya yoz", "Algoritm tushuntir"\n\n' +
        '\ud83d\udcc8 **O\'zbekiston**:\n' +
        '  "O\'zbekiston haqida", "Osh", "An\'analar"'
    },

    // ============ FALLBACK ============
    fallback: [
      'Kechirasiz, tushunmadim. \ud83e\udd14 Menga o\'rgating: "Men senga o\'rgataman: [savol] -> [javob]"',
      'Tushunmadim. "Yordam" deb yozing yoki menga o\'rgating.',
      'Men bu haqda bilmayman. O\'rgating: "Men senga o\'rgataman: [savol] -> [javob]"',
      'Kechirasiz, bu savolga javob topa olmadim. Iltimos, boshqacha so\'rang yoki "Yordam" deb yozing.',
      'Tushunmadim. \ud83e\udd14 Siz menga o\'rgatishingiz mumkin: "Men senga o\'rgataman: [savol] -> [javob]"'
    ]
  }
  if (typeof window !== 'undefined') window.XOLERIC_DB = DB
})()
