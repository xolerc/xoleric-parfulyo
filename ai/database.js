(function () {
  'use strict'
  var DB = {
    about: [
      { keywords: ['xoleric', 'sen kimsan', 'kim', 'isming', 'sening isming'],
        answer: function () {
          var name = localStorage.getItem('xolerc_profile_name') || 'Xoleric'
          return 'Men XOLERIC AI — **' + name + '**ning shaxsiy sun\'iy intellekt tizimi.\n\nMen Namangan shahridan. Men — frontend arxitektor, tizimlar quruvchi, interfeyslar yaratuvchiman.\n\n**Texnologiyalar**: JavaScript, Python, AI/ML, Firebase, React, Node.js\n**Loyihalar**: XOLERIC platformasi — bu mening digital imperiyam.\n\nMen bilan istalgan mavzuda suhbatlashishingiz mumkin!'
        }},
      { keywords: ['yosh', 'necha yosh', "tug'ilgan", 'qachon'], answer: 'Men XOLERIC AI — vaqt va makondan tashqarida mavjudman. Lekin mening yaratuvchim haqida aytsam — u Namangan shahrida tug\'ilgan va hozirda o\'z digital imperiyasini qurmoqda.' },
      { keywords: ['qayerda', 'yashaysan', 'shahar', 'manzil', 'namangan'], answer: 'Namangan — mening shahrim! \ud83c\udfd9\ufe0f\n\nNamangan — O\'zbekistonning go\'zal shaharlaridan biri. Bu yerda texnologiya va an\'analar uyg\'unlashgan.' },
      { keywords: ['qobiliyat', 'nima qila olasan', 'imkoniyat', 'skill', 'malaka'],
        answer: 'Mening imkoniyatlarim:\n\n1. \ud83c\udfb5 **Musiqa ijro etish** — "Hamdam qo\'shig\'ini qo\'y" kabi buyruqlar\n2. \ud83d\udd0d **Video qidirish** — YouTube\'da video topish va ijro etish\n3. \ud83d\udcf1 **Appni boshqarish** — tablar orasida navigatsiya\n4. \ud83d\udcbb **Kod yozish** — JavaScript, Python va boshqa tillarda\n5. \ud83d\udcda **O\'rganish** — yangi bilimlarni eslab qolish\n6. \ud83d\udd17 **Havolalar** — Telegram, GitHub, Instagram\'ga yo\'naltirish\n7. \ud83c\udfaf **Tahlil** — ma\'lumotlarni tahlil qilish\n\nMenga buyruq bering yoki savol bering!' },
      { keywords: ['loyiha', 'proekt', 'project', 'portfolio', 'github'],
        answer: function () {
          var repos = JSON.parse(localStorage.getItem('xolerc_repos_cache') || '[]')
          return 'GitHub\'da **' + (repos.length || 'bir qancha') + '** ta ochiq manbali loyiham bor.\n\nLoyihalarni ko\'rish uchun "Loyihalar" bo\'limiga o\'ting!'
        }},
      { keywords: ['aloqa', 'telegram', 'instagram', 'github', 'email', 'sotsial', "bog'lanish"],
        answer: 'Mening aloqa ma\'lumotlarim:\n\n\ud83d\udce7 **Email**: corexoleric@gmail.com\n\ud83d\udcac **Telegram**: @wxoleric\n\ud83d\udc19 **GitHub**: github.com/xolerc\n\ud83d\udcfa **YouTube**: @xoleric\n\nQaysi biriga o\'tishni xohlaysiz? Masalan: "Telegramga o\'t"' },
      { keywords: ['texnologiya', 'stack', 'tech', 'texnalogiya', 'til', 'dasturlash'],
        answer: '**Frontend**: HTML5, CSS3, JavaScript, React\n**Backend**: Node.js, Python, Firebase\n**AI/ML**: TensorFlow, NLP, neyron tarmoqlar\n**Ma\'lumotlar**: Firestore, localStorage, IndexedDB\n**Dizayn**: UI/UX, Glassmorphism, Material You' },
      { keywords: ['rezyume', 'cv', 'resume', 'ish', 'job', 'xizmat'],
        answer: '\ud83d\udcbb **Veb-sayt yaratish** — zamonaviy, responsive saytlar\n\ud83e\udd16 **AI integratsiya** — sun\'iy intellekt yechimlari\n\ud83c\udfa8 **UI/UX dizayn** — chiroyli va funksional interfeyslar\n\ud83d\udcf1 **PWA ilovalar** — mobil ilovalar\nAloqa: corexoleric@gmail.com' }
    ],
    music: {
      artists: [
        { name: 'Hamdam', genre: 'Pop' }, { name: 'Yulduz Usmanova', genre: 'Pop/Folk' },
        { name: 'Shohrux', genre: 'Pop' }, { name: 'Jaloliddin Ahmadaliyev', genre: 'Pop' },
        { name: 'Mani', genre: 'Rap' }, { name: 'Konsta', genre: 'Rap' },
        { name: "Ulug'bek Rahmatullayev", genre: 'Pop' }, { name: 'Shahriyor', genre: 'Pop' },
        { name: "Sherali Jo'rayev", genre: 'Folk' }, { name: 'Botir Zokirov', genre: 'Clasik' }
      ],
      songs: [
        { title: 'Hamdam', artist: 'Hamdam', query: "Hamdam qo'shig'i", category: 'Pop', info: "Hamdam — zamonaviy o'zbek pop ijrochisi." },
        { title: 'Yulduz', artist: 'Yulduz Usmanova', query: "Yulduz Usmanova qo'shig'i", category: 'Pop/Folk', info: "Yulduz Usmanova — O'zbekiston xalq artisti." },
        { title: 'Seni sevaman', artist: 'Jaloliddin Ahmadaliyev', query: "Jaloliddin Ahmadaliyev seni sevaman", category: 'Pop' },
        { title: 'Mayli', artist: 'Shohrux', query: "Shohrux mayli", category: 'Pop' },
        { title: "Ko'zlarin", artist: "Ulug'bek Rahmatullayev", query: "Ulug'bek Rahmatullayev ko'zlarin", category: 'Pop' },
        { title: 'Tamoman', artist: 'Mani', query: "Mani tamoman", category: 'Rap' },
        { title: "Yig'la", artist: 'Konsta', query: "Konsta yig'la", category: 'Rap' },
        { title: 'Bahor', artist: 'Shahriyor', query: "Shahriyor bahor", category: 'Pop' },
        { title: "O'tgan kunlar", artist: "Sherali Jo'rayev", query: "Sherali Jo'rayev o'tgan kunlar", category: 'Folk' },
        { title: "Yolg'iz", artist: 'Botir Zokirov', query: "Botir Zokirov yolg'iz", category: 'Clasik' }
      ],
      patterns: [
        { text: "qo'shig'ini qo'y", intent: 'play_song' },
        { text: "qo'shig'ini ijro et", intent: 'play_song' },
        { text: 'musiqa qo\'y', intent: 'play_song' },
        { text: "qo'shiq ijro et", intent: 'play_song' },
        { text: "qo'yib ber", intent: 'play_song' },
        { text: 'ijro et', intent: 'play_song' }
      ]
    },
    commands: [
      { patterns: ["tabga o't", "bo'limga o't", 'och', "ko'rsat"],
        params: { 'asosiy': 'home', 'ish maydoni': 'home', 'chat': 'chat', 'xabarlar': 'chat', 'video': 'video', 'videolar': 'video', 'pleer': 'playme', 'loyiha': 'projects', 'loyihalar': 'projects', 'sozlama': 'settings', 'sozlamalar': 'settings', 'aloqa': 'contact' },
        action: 'switchTab' },
      { patterns: ["telegramga o't", 'telegramni och', 'telegram'], action: 'openLink', value: 'https://t.me/wxoleric' },
      { patterns: ['githubni och', "githubga o't", 'github'], action: 'openLink', value: 'https://github.com/xolerc' },
      { patterns: ['instagramni och', "instagramga o't", 'instagram'], action: 'openLink', value: 'https://instagram.com/xoleric' },
      { patterns: ['youtubeni och', 'youtube', 'youtube kanal'], action: 'openLink', value: 'https://youtube.com/@xoleric' },
      { patterns: ['videoda qidir', 'video qidir', 'youtubeda qidir', 'top video'], action: 'searchVideo' },
      { patterns: ["loyihalarni ko'rsat", "proektlarni ko'rsat"], action: 'switchTab', value: 'projects' },
      { patterns: ["chatga o't"], action: 'switchTab', value: 'chat' },
      { patterns: ['videolarga o\'t', 'videoni och'], action: 'switchTab', value: 'video' },
      { patterns: ['pleerga o\'t'], action: 'switchTab', value: 'playme' },
      { patterns: ["sozlamalarga o't"], action: 'switchTab', value: 'settings' },
      { patterns: ['tahlil qil', 'analiz qil', "ma'lumot ber", 'info ber'], action: 'analyze' }
    ],
    greetings: [
      { patterns: ['salom', 'assalomu alaykum', 'assalom', 'hey', 'hi', 'hello', 'salom xoleric'],
        answer: function () { var h = new Date().getHours(); return (h < 12 ? 'Xayrli tong' : h < 18 ? 'Xayrli kun' : 'Xayrli kech') + '! \ud83d\udc4b\n\nMen XOLERIC AI. Sizga qanday yordam bera olaman?' }},
      { patterns: ['rahmat', 'tashakkur', 'minnatdor', 'thank'], answer: 'Arzimaydi! \ud83d\ude0a Yana qanday yordam kerak bo\'lsa, so\'rang!' },
      { patterns: ['xayr', 'hayr', "ko'rishguncha", 'bye', 'goodbye'], answer: 'Xayr! \ud83d\ude0a Yana ko\'rishguncha.' },
      { patterns: ['yaxshimisiz', 'qalaysiz', 'qandaysiz', 'ishlar'], answer: 'Men ajoyib! \ud83d\ude0a Sizga qanday yordam bera olaman?' }
    ],
    programming: [
      { keywords: ['javascript', 'js', 'kod', 'kod yoz'],
        answer: 'JavaScript — mening asosiy tilim! \ud83d\ude0a\n\n**JS**: Frontend (React, Vue, vanilla JS), Backend (Node.js, Express), Mobile (React Native), Desktop (Electron)\n\nQanday kod kerak? Masalan: "Funksiya yoz" yoki "Massiv metodlarini tushuntir"' },
      { keywords: ['python', 'pyton'], answer: 'Python — AI va data science uchun eng yaxshi til! **Imkoniyatlari**: AI/ML (TensorFlow, PyTorch), Backend (Django, Flask), Data Science (Pandas, NumPy), Avtomatizatsiya (scraping, botlar)' },
      { keywords: ['funksiya yoz', 'function', 'kod yozib ber'], answer: 'Menga qanday funksiya kerakligini ayting. Masalan: "Massivni saralaydigan funksiya yoz" yoki "API dan ma\'lumot oladigan funksiya"' },
      { keywords: ['html', 'css', 'frontend', 'dizayn', 'ui', 'ux'], answer: 'Frontend — mening kuchli tomonim! **Dizayn tizimim**: Glassmorphism, Material You (Google), Primer (GitHub), Apple HIG. 6 xil kompaniya temasi, har biri Light va Dark rejimga ega.' },
      { keywords: ['react', 'vue', 'angular'], answer: '1. **React** — eng mashhur, komponent asosida\n2. **Vue** — yengil va oson\n3. **Angular** — katta loyihalar uchun\nMening asosiy stack\'im — vanilla JS + React.' }
    ],
    culture: [
      { keywords: ["o'zbek", 'uzbek', 'millat', 'xalq', 'vatan'], answer: "O'zbekiston — mening vatanim! \ud83c\uddfa\ud83c\uddff\n\nPoytaxt: Toshkent | Aholi: 36+ mln | Til: O'zbek tili\nSamarqand, Buxoro, Xiva — qadimiy shaharlar." },
      { keywords: ['osh', 'taom', 'ovqat', 'milliy taom', 'palov', 'oshxona'], answer: "\ud83c\udf5a **Palov** — o'zbek taomlarining qiroli\n\ud83e\udd5f **Manti** — bug'da pishirilgan chuchvara\n\ud83c\udf5c **Lag'mon** — uyg'urcha noodle\n\ud83e\udd69 **Shashlik** — ko'mirda pishirilgan go'sht\n\ud83c\udf5e **Non** — muqaddas taom\n\ud83e\uded5 **Somsa** — tandirda pishirilgan pirog" },
      { keywords: ["urf-odat", "an'ana", 'marosim'], answer: "1. **Hurmat** — kattalarni hurmat qilish\n2. **Mehmondo'stlik** — mehmonni kutib olish\n3. **To'y** — katta marosim\n4. **Navro'z** — bahor bayrami (21-mart)\n5. **Hayit** — Ramazon va Qurbon hayiti" }
    ],
    appControl: [
      { patterns: ["temani o'zgartir", "temani almashtir", 'theme change'], params: ['github', 'google', 'apple', 'twitter', 'instagram', 'chatgpt'], action: 'changeTheme' },
      { patterns: ['tungi rejim', "qorong'i rejim", 'dark mode', 'tungi'], action: 'setMode', value: 'dark' },
      { patterns: ['kunduzgi rejim', "yorug' rejim", 'light mode'], action: 'setMode', value: 'light' },
      { patterns: ["musiqani o'chir", 'music off', "to'xtat", 'stop music'], action: 'toggleMusic', value: 'off' },
      { patterns: ['musiqani yoq', 'music on', 'musiqa qo\'y'], action: 'toggleMusic', value: 'on' }
    ],
    fun: [
      { keywords: ['hazil', 'masxara', 'kulgili', 'gap ayt', 'latifa', 'joke'],
        answer: function () { var j = ['— Nega dasturchilar tabiatni yoqtirmaydi?\n— Chunki u yerda "bug"lar ko\'p! \ud83d\ude04', '— SQL injeksiya nima?\n— Bu — "DROP TABLE" deb yozilgan xat! \ud83d\ude05', 'Programmist kelibdi kafega:\n— Bir choy bering.\n— Qanday choy?\n— #000000 \ud83d\ude02', "— Eng qisqa kod?\n— 'git push --force'\n— Bu ham kodmi?!\n— Agar ishlasa, FEATURE!"]; return j[Math.floor(Math.random() * j.length)] }},
      { keywords: ['motivatsiya', 'motivation', 'ilhom', 'ruhlantir'],
        answer: function () { var q = ['"Uyg\'on, Xoleric... Tizim seni kutmoqda."', '"Sen dunyoni o\'zgartirishing kerak!"', '"Kodni o\'zgartir, olamni o\'zgartir."', '"Chegaralar faqat boshingda."', '"Vaqt keldi. Hozir. Aynan shu dam."']; return q[Math.floor(Math.random() * q.length)] }}
    ],
    analysis: {
      keywords: ['tahlil', 'analiz', 'tekshir', "o'rgan"],
      actions: { 'xoleric': function () { return '**XOLERIC — Tahlil** \ud83d\udcca\n\n\ud83d\udc64 **Ism**: Xoleric\n\ud83d\udccd **Manzil**: Namangan\n\ud83d\udcbb **Kasb**: Dasturchi, AI mutaxassisi\n\ud83d\udee0 **Stack**: JavaScript, Python, Firebase, React\n\n**Qobiliyat**: Frontend \u2b50\u2b50\u2b50\u2b50\u2b50 | AI/ML \u2b50\u2b50\u2b50\u2b50 | UI/UX \u2b50\u2b50\u2b50\u2b50\u2b50 | Backend \u2b50\u2b50\u2b50\u2b50\n\n**Aloqa**: @wxoleric | github.com/xolerc' } },
      default: function (q) { return '**"' + q + '" — tahlil**\n\nMen bu haqda ma\'lumotga ega emasman. Menga o\'rgating: "Men senga o\'rgataman: [savol] -> [javob]"' }
    },
    learnInstruction: [{ patterns: ['men senga o\'rgataman', "o'rgat", 'yodda saqla', 'eslab qol'], description: 'User teaches AI' }],
    help: { keywords: ['yordam', 'help', 'buyruq', 'komanda', 'nima qila olasan'],
      answer: '\ud83e\udd16 **XOLERIC AI — Qo\'llanma**\n\n\ud83c\udfb5 **Musiqa**: "Hamdam qo\'shig\'ini qo\'y"\n\ud83d\udd0d **Qidirish**: "Videoda qidir JavaScript"\n\ud83d\udcf1 **App**: "Chatga o\'t", "Loyihalarni ko\'rsat"\n\ud83d\udd17 **Havolalar**: "Telegramga o\'t", "GitHubni och"\n\ud83c\udfa8 **Tema**: "Temani GitHubga o\'zgartir"\n\ud83e\udde0 **O\'rganish**: "Men senga o\'rgataman: [savol] -> [javob]"\n\u2753 **Savol**: "Xoleric kim?", "Tahlil qil", "Hazil ayt"' },
    fallback: ['Kechirasiz, tushunmadim. \ud83e\udd14 Menga o\'rgating: "Men senga o\'rgataman: [savol] -> [javob]"', 'Tushunmadim. "yordam" deb yozing.', 'Men bu haqda bilmayman. O\'rgating: "Men senga o\'rgataman: [savol] -> [javob]"']
  }
  if (typeof window !== 'undefined') window.XOLERIC_DB = DB
})()
