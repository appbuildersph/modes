// Global UI string table. Every user-facing label flows through t(key, lang)
// so picking a language in the header switches the WHOLE app — nav, buttons,
// lessons, feedback, assessments, transcripts — except the app title "Gabay".
//
// Languages match content.json + lang.js: 'en' (English), 'fil' (Tagalog),
// 'taglish' (natural Tagalog-English mix, the default).
//
// localize() handles content fields that may be a plain string OR a
// { en, fil, taglish } object, so curriculum items can be partially translated
// (pure math stems stay as one string; word problems / solutions translate).

import { DEFAULT_LANG } from './lang.js'

export const STRINGS = {
  // ---- Splash ----
  'splash.banner': {
    en: 'Learn Math even with no signal.',
    fil: 'Matuto ng Math kahit walang signal.',
    taglish: 'Matuto ng Math kahit walang signal.',
  },
  'splash.start': { en: 'START', fil: 'MAGSIMULA', taglish: 'MAGSIMULA' },
  'splash.subtitle': {
    en: 'Grades 4–6 Math · Multilingual · Offline-first',
    fil: 'Math para sa Grade 4–6 · Maraming wika · Offline',
    taglish: 'Grades 4–6 Math · Multilingual · Offline-first',
  },
  'splash.offline': { en: '100% OFFLINE LEARNING', fil: '100% OFFLINE NA PAG-AARAL', taglish: '100% OFFLINE LEARNING' },
  'splash.tagline': {
    en: 'Your offline AI Math Companion',
    fil: 'Ang iyong AI na kasama sa Math, kahit offline',
    taglish: 'Ang offline AI Math companion mo',
  },

  // ---- shared / nav ----
  'common.back': { en: 'Back', fil: 'Bumalik', taglish: 'Bumalik' },
  'common.exit': { en: 'Exit', fil: 'Lumabas', taglish: 'Lumabas' },
  'common.online': { en: 'Online', fil: 'Online', taglish: 'Online' },
  'common.offline': { en: 'Offline', fil: 'Offline', taglish: 'Offline' },
  'common.language': { en: 'Language', fil: 'Wika', taglish: 'Wika' },
  'home.destinations': { en: 'Destinations', fil: 'Mga pupuntahan', taglish: 'Mga pupuntahan' },
  'common.mastery': { en: 'Mastery', fil: 'Kahusayan', taglish: 'Mastery' },
  'common.question': { en: 'Question', fil: 'Tanong', taglish: 'Tanong' },
  'common.yourAnswer': { en: 'Your answer', fil: 'Sagot mo', taglish: 'Sagot mo' },
  'common.correctAnswer': { en: 'Correct answer', fil: 'Tamang sagot', taglish: 'Tamang sagot' },
  'common.explanation': { en: 'Explanation', fil: 'Paliwanag', taglish: 'Paliwanag' },
  'common.feedback': { en: 'Feedback', fil: 'Feedback', taglish: 'Feedback' },
  'common.correct': { en: 'Correct', fil: 'Tama', taglish: 'Tama' },
  'common.wrong': { en: 'Wrong', fil: 'Mali', taglish: 'Mali' },
  'common.next': { en: 'Next', fil: 'Susunod', taglish: 'Susunod' },
  'common.finish': { en: 'Finish', fil: 'Tapusin', taglish: 'Tapusin' },
  'common.done': { en: 'Done', fil: 'Tapos', taglish: 'Tapos' },
  'common.answerPlaceholder': { en: 'Type your answer...', fil: 'Isulat ang sagot...', taglish: 'Isulat ang sagot...' },
  'common.needAnswer': { en: 'Type your answer first.', fil: 'Isulat muna ang sagot.', taglish: 'Isulat muna ang sagot.' },
  'common.needNumber': { en: 'Type a number.', fil: 'Magbigay ng numero.', taglish: 'Mag-type ng number.' },
  'common.yes': { en: 'Yes', fil: 'Oo', taglish: 'Oo' },
  'common.no': { en: 'No', fil: 'Hindi', taglish: 'Hindi' },
  'questions.generating': { en: 'Preparing your questions…', fil: 'Inihahanda ang mga tanong…', taglish: 'Preparing your questions…' },
  'questions.generatingSub': { en: 'Teacher Gabay is building this practice session.', fil: 'Inihahanda ni Teacher Gabay ang pagsasanay mo.', taglish: 'Binubuo ni Teacher Gabay ang practice session mo.' },
  'questions.generatingSub2': { en: 'Matching questions to your level…', fil: 'Inihahanda ayon sa antas mo…', taglish: 'Ini-adjust ayon sa level mo…' },
  'questions.generatingSub3': { en: 'Double-checking every answer…', fil: 'Tinitiyak na tama ang mga sagot…', taglish: 'Tinitingnan kung tama lahat ng sagot…' },
  'questions.generatingSub4': { en: 'Almost ready…', fil: 'Halos tapos na…', taglish: 'Konti na lang…' },

  // ---- Onboarding / grade ----
  'onboarding.step': { en: 'Step {step} of 4', fil: 'Hakbang {step} sa 4', taglish: 'Step {step} of 4' },
  'onboarding.grade': { en: 'What grade are you in?', fil: 'Anong grade ka?', taglish: 'Anong grade ka?' },
  'onboarding.gradeLabel': { en: 'Grade {grade}', fil: 'Grade {grade}', taglish: 'Grade {grade}' },
  'onboarding.name': { en: 'What is your name?', fil: 'Anong pangalan mo?', taglish: 'Anong pangalan mo?' },
  'onboarding.namePlaceholder': { en: 'Your name', fil: 'Pangalan mo', taglish: 'Name mo' },
  'onboarding.next': { en: 'Next', fil: 'Sunod', taglish: 'Sunod' },
  'onboarding.greeting': {
    en: 'Hello, {name}! I am Teacher Gabay, your math guide.',
    fil: 'Kumusta, {name}! Ako si Teacher Gabay, ang iyong gabay sa Math.',
    taglish: 'Kumusta, {name}! Ako si Teacher Gabay, ang iyong math guide.',
  },
  'onboarding.masteryTitle': { en: 'Grow your Mastery', fil: 'Palakihin ang Mastery', taglish: 'Grow your Mastery' },
  'onboarding.mastery': {
    en: 'As you answer correctly, your Mastery will grow. Let us try!',
    fil: 'Habang sumasagot ka nang tama, lalaki ang iyong Mastery. Subukan natin!',
    taglish: 'Habang sumasagot ka nang tama, lalaki ang iyong Mastery. Subukan natin!',
  },
  'onboarding.start': { en: 'Let’s start!', fil: 'Magsimula!', taglish: 'Magsimula!' },
  'gradePicker.title': { en: 'Change grade', fil: 'Baguhin ang Grade', taglish: 'Baguhin ang Grade' },
  'gradePicker.subtitle': {
    en: 'Choose the grade you want to switch to.',
    fil: 'Piliin ang grade na gusto mong lipatan.',
    taglish: 'Piliin ang grade na gusto mong lipatan.',
  },
  'gradePicker.selected': { en: 'Selected', fil: 'Napili', taglish: 'Napili' },
  'gradePicker.current': { en: 'Current grade', fil: 'Kasalukuyang grade', taglish: 'Kasalukuyang grade' },
  'gradePicker.confirmTitle': {
    en: 'Change to Grade {grade}?',
    fil: 'Lumipat sa Grade {grade}?',
    taglish: 'Change to Grade {grade}?',
  },
  'gradePicker.confirm': {
    en: 'Your progress for this grade will be cleared. Continue?',
    fil: 'Mabubura ang iyong progress. Sige ba?',
    taglish: 'Mabubura ang iyong progress. Sige ba?',
  },
  'gradePicker.yesChange': {
    en: 'Yes, change grade',
    fil: 'Oo, palitan ang grade',
    taglish: 'Oo, change grade',
  },
  'gradePicker.noKeep': {
    en: 'No, keep Grade {grade}',
    fil: 'Hindi, manatili sa Grade {grade}',
    taglish: 'Hindi, keep Grade {grade}',
  },

  // ---- nav tabs ----
  'nav.lessons': { en: 'Lessons', fil: 'Aralin', taglish: 'Lessons' },
  'nav.practice': { en: 'Practice', fil: 'Pagsasanay', taglish: 'Practice' },
  'nav.games': { en: 'Games', fil: 'Laro', taglish: 'Games' },
  'nav.profile': { en: 'Profile', fil: 'Profile', taglish: 'Profile' },

  // ---- Home ----
  'home.hallwayTag': { en: 'Classroom Hallway', fil: 'Hallway ng Silid-Aralan', taglish: 'Hallway ng Silid-Aralan' },
  'home.greeting': { en: 'Hello, Ka-Gabay!', fil: 'Kumusta, Ka-Gabay!', taglish: 'Kumusta, Ka-Gabay!' },
  'home.greetingName': { en: 'Hello, {name}!', fil: 'Kumusta, {name}!', taglish: 'Kumusta, {name}!' },
  'home.grade': { en: 'Grade {grade}', fil: 'Grade {grade}', taglish: 'Grade {grade}' },
  'home.subtitle': { en: 'Where shall we go today?', fil: 'Saan tayo pupunta ngayon?', taglish: 'Saan tayo pupunta ngayon?' },
  'home.open': { en: 'OPEN', fil: 'BUKAS', taglish: 'OPEN' },
  'home.lessons.title': { en: 'Lessons', fil: 'Mga Aralin', taglish: 'Mga Aralin' },
  'home.lessons.status': { en: 'New lesson', fil: 'Bagong aralin', taglish: 'Bagong aralin' },
  'home.lessons.cta': { en: 'Open', fil: 'Buksan', taglish: 'Buksan' },
  'home.classroom.title': { en: 'Teacher Gabay', fil: 'Teacher Gabay', taglish: 'Teacher Gabay' },
  'home.classroom.status': { en: 'AI tutor', fil: 'AI tutor', taglish: 'AI tutor' },
  'home.classroom.cta': { en: 'Enter', fil: 'Pasukin', taglish: 'Pasukin' },
  'home.games.title': { en: 'Mini Games', fil: 'Mga Laro', taglish: 'Mini Games' },
  'home.games.status': { en: 'Playable', fil: 'Nalalaro', taglish: 'Playable' },
  'home.games.cta': { en: 'Play', fil: 'Laruin', taglish: 'Laruin' },

  // ---- Start Choice ----
  'start.heading': { en: 'How would you like to start?', fil: 'Paano ka magsisimula?', taglish: 'Paano ka magsisimula?' },
  'start.sub': {
    en: 'Do your best in math, Explorer! Pick what you want to do.',
    fil: 'Galingan mo sa math, Explorer! Piliin mo kung ano ang gusto mong gawin.',
    taglish: 'Galingan mo sa math, Explorer! Piliin mo kung ano ang gusto mong gawin.',
  },
  'start.continueTag': { en: '01 - Continue', fil: '01 - Tuloy', taglish: '01 - Tuloy' },
  'start.continueTitle': { en: 'Continue the lesson', fil: 'Ituloy ang aralin', taglish: 'Ituloy ang aralin' },
  'start.masteryProgress': { en: 'Mastery Progress', fil: 'Progreso ng Kahusayan', taglish: 'Mastery Progress' },
  'start.startNow': { en: 'Start now', fil: 'Magsimula na', taglish: 'Magsimula na' },
  'start.browseTag': { en: '02 - Browse', fil: '02 - Tingnan', taglish: '02 - Tingnan' },
  'start.browseTitle': { en: 'View all topics', fil: 'Tingnan lahat ng topics', taglish: 'Tingnan lahat ng topics' },
  'start.browseSub': {
    en: 'Find the full list of Grade 6 lessons.',
    fil: 'Hanapin ang buong listahan ng mga aralin sa Grade 6.',
    taglish: 'Hanapin ang buong listahan ng mga aralin sa Grade 6.',
  },
  'start.browseSubGrade': {
    en: 'Find all available Grade {grade} lessons.',
    fil: 'Hanapin ang lahat ng aralin para sa Grade {grade}.',
    taglish: 'Hanapin ang lahat ng Grade {grade} lessons.',
  },
  'start.viewList': { en: 'View the list', fil: 'Tingnan ang listahan', taglish: 'Tingnan ang listahan' },

  // ---- Topic Picker ----
  'topics.heading': { en: 'What shall we study today?', fil: 'Anong aaralin natin ngayon?', taglish: 'Anong aaralin natin ngayon?' },
  'topics.sub': { en: 'Pick a topic and start practising.', fil: 'Pumili ng topic at magsimula ng practice.', taglish: 'Pumili ng topic at magsimula ng practice.' },
  'topics.all': { en: 'All', fil: 'Lahat', taglish: 'Lahat' },
  'topics.search': { en: 'Search topics', fil: 'Maghanap ng aralin', taglish: 'Search ng topic' },
  'topics.noResults': { en: 'No results found.', fil: 'Walang nahanap.', taglish: 'Walang nahanap.' },
  'topics.lessonCount': { en: '{count} lessons', fil: '{count} na aralin', taglish: '{count} lessons' },
  'topics.lessonCountOne': { en: '{count} lesson', fil: '{count} aralin', taglish: '{count} lesson' },
  'topics.completedCount': { en: '{count} completed', fil: '{count} natapos', taglish: '{count} completed' },
  'topics.startedCount': { en: '{count} in progress', fil: '{count} ginagawa pa', taglish: '{count} in progress' },
  'topics.showLessons': { en: 'Show', fil: 'Ipakita', taglish: 'Show' },
  'topics.hideLessons': { en: 'Hide', fil: 'Itago', taglish: 'Hide' },
  'topics.practiceHeading': { en: 'Due for review', fil: 'Dapat balikan', taglish: 'Due for review' },
  'topics.practiceSub': { en: 'Strengthen topics that need another look.', fil: 'Balikan ang mga araling kailangan pa ng practice.', taglish: 'Balikan ang topics na kailangan pa ng practice.' },
  'topics.nothingDue': {
    en: 'Great! Nothing is due for review. Try a new lesson!',
    fil: 'Magaling! Wala pang dapat pag-aralan. Subukan ang bagong aralin!',
    taglish: 'Magaling! Wala pang dapat pag-aralan. Subukan ang bagong aralin!',
  },
  'topics.browseNew': { en: 'Browse new lessons', fil: 'Tingnan ang bagong aralin', taglish: 'Browse new lessons' },
  'topics.practiceTip': {
    en: 'Keep practicing to master each topic.',
    fil: 'Magpatuloy sa pag-practice para ma-master ang bawat topic.',
    taglish: 'Magpatuloy sa pag-practice para ma-master ang bawat topic.',
  },
  'difficulty.madali': { en: 'Easy', fil: 'Madali', taglish: 'Madali' },
  'difficulty.katamtaman': { en: 'Medium', fil: 'Katamtaman', taglish: 'Katamtaman' },
  'difficulty.mahirap': { en: 'Hard', fil: 'Mahirap', taglish: 'Mahirap' },
  'domain.Number and Algebra': { en: 'Number & Algebra', fil: 'Number at Algebra', taglish: 'Number & Algebra' },
  'domain.Measurement and Geometry': { en: 'Measurement & Geometry', fil: 'Sukat at Geometry', taglish: 'Measurement & Geometry' },
  'domain.Data and Probability': { en: 'Data & Probability', fil: 'Data at Probability', taglish: 'Data & Probability' },
  'domain.Statistics and Probability': { en: 'Statistics & Probability', fil: 'Statistics at Probability', taglish: 'Statistics & Probability' },

  // ---- Lesson Brief ----
  'brief.lessonOverview': { en: 'Lesson Overview', fil: 'Buod ng Aralin', taglish: 'Lesson Overview' },
  'brief.yourProgress': { en: 'Your Progress', fil: 'Iyong Progreso', taglish: 'Your Progress' },
  'brief.contentStandard': { en: 'Content Standard', fil: 'Pamantayang Nilalaman', taglish: 'Content Standard' },
  'brief.lessonGoal': { en: 'Lesson goal', fil: 'Layunin ng aralin', taglish: 'Lesson goal' },
  'brief.lessonSteps': { en: 'Lesson Steps', fil: 'Mga Hakbang sa Aralin', taglish: 'Lesson Steps' },
  'brief.whatYouDo': { en: 'Your Learning Plan', fil: 'Iyong Plano sa Pag-aaral', taglish: 'Your Learning Plan' },
  'brief.task.understandShort': { en: 'Understand the lesson.', fil: 'Intindihin ang aralin.', taglish: 'Understand the lesson.' },
  'brief.task.answerShort': { en: "Answer Teacher Gabay's questions.", fil: 'Sagutin ang mga tanong ni Teacher Gabay.', taglish: "Answer Teacher Gabay's questions." },
  'brief.task.askShort': { en: 'Ask for help if something is unclear.', fil: 'Humingi ng tulong kung may hindi malinaw.', taglish: 'Ask for help if something is unclear.' },
  'brief.task.understand': {
    en: 'Understand the lesson: {topic}.',
    fil: 'Intindihin ang aralin: {topic}.',
    taglish: 'Intindihin ang aralin: {topic}.',
  },
  'brief.task.answer': {
    en: "Answer Teacher Gabay's questions on the board.",
    fil: 'Sagutin ang mga tanong ni Teacher Gabay sa pisara.',
    taglish: 'Sagutin ang mga tanong ni Teacher Gabay sa pisara.',
  },
  'brief.task.ask': {
    en: 'Ask if something is unclear — raise your hand!',
    fil: 'Magtanong kung may hindi malinaw - itaas ang kamay!',
    taglish: 'Magtanong kung may hindi malinaw - itaas ang kamay!',
  },
  'brief.lessonProgress': { en: 'Lesson Progress', fil: 'Progreso ng Aralin', taglish: 'Lesson Progress' },
  'brief.category': { en: 'Category', fil: 'Kategorya', taglish: 'Category' },
  'brief.questions': { en: 'Questions', fil: 'Mga Tanong', taglish: 'Mga Tanong' },
  'brief.level': { en: 'Level', fil: 'Antas', taglish: 'Antas' },
  'brief.learningTip': { en: 'Learning tip', fil: 'Tip sa pag-aaral', taglish: 'Learning tip' },
  'brief.learningTipText': { en: 'Take your time, read each part carefully, and ask Teacher Gabay whenever you need help.', fil: 'Maglaan ng oras, basahing mabuti ang bawat bahagi, at tanungin si Teacher Gabay kapag kailangan mo ng tulong.', taglish: 'Take your time, read each part carefully, and ask Teacher Gabay whenever you need help.' },
  'brief.beforeBegin': { en: 'Before you begin', fil: 'Bago ka magsimula', taglish: 'Before you begin' },
  'brief.beforeBeginText': { en: "Read each part carefully, answer Teacher Gabay's questions, and ask for help whenever something is unclear.", fil: 'Basahing mabuti ang bawat bahagi, sagutin ang mga tanong ni Teacher Gabay, at humingi ng tulong kapag may hindi malinaw.', taglish: "Read each part carefully, answer Teacher Gabay's questions, and ask for help whenever something is unclear." },
  'brief.readBeforeEntering': { en: 'Please read all the lesson information before entering the class!', fil: 'Please read all the lesson information before entering the class!', taglish: 'Please read all the lesson information before entering the class!' },
  'brief.ready': { en: "I'm ready inside the class. Let's go!", fil: 'Handa na ako sa loob ng klase. Tara!', taglish: 'Handa na ako sa loob ng klase. Tara!' },
  'brief.enter2d': { en: 'Enter 2D Class', fil: 'Pumasok sa 2D Class', taglish: 'Pumasok sa 2D Class' },
  'brief.enter3d': { en: 'Enter 3D Class', fil: 'Pumasok sa 3D Class', taglish: 'Pumasok sa 3D Class' },

  // ---- Classroom (2D) ----
  'class.tab.explain': { en: 'Explanation', fil: 'Paliwanag', taglish: 'Paliwanag' },
  'class.tab.example': { en: 'Example', fil: 'Halimbawa', taglish: 'Halimbawa' },
  'class.tab.practice': { en: 'Practice', fil: 'Pagsasanay', taglish: 'Pagsasanay' },
  'class.lessonSections': { en: 'Lesson sections', fil: 'Mga bahagi ng aralin', taglish: 'Lesson sections' },
  'class.tabLocked': { en: 'Complete the previous step to unlock', fil: 'Tapusin muna ang naunang bahagi para mabuksan', taglish: 'Tapusin muna ang previous step para ma-unlock' },
  'class.guide.explain': { en: 'Make sure to read the key idea first before continuing.', fil: 'Basahin muna ang pangunahing ideya bago magpatuloy.', taglish: 'Make sure na basahin muna ang Key Idea bago magpatuloy.' },
  'class.guide.example': { en: 'Study each step in the example before continuing.', fil: 'Pag-aralan ang bawat hakbang sa halimbawa bago magpatuloy.', taglish: 'Study each step sa example bago magpatuloy.' },
  'class.guide.practice': { en: 'You are ready. Start the practice when you feel prepared.', fil: 'Handa ka na. Simulan ang pagsasanay kapag handa ka na.', taglish: 'Ready ka na. Start the practice kapag handa ka na.' },
  'class.teacherName': { en: 'Teacher Gabay', fil: 'Gurong Gabay', taglish: 'Teacher Gabay' },
  'class.teacherPanel': { en: 'Teacher Gabay help', fil: 'Tulong ni Gurong Gabay', taglish: 'Teacher Gabay help' },
  'class.teacherOpen': { en: 'Open Teacher Gabay', fil: 'Buksan si Gurong Gabay', taglish: 'Buksan si Teacher Gabay' },
  'class.teacherClose': { en: 'Close Teacher Gabay', fil: 'Isara si Gurong Gabay', taglish: 'Isara si Teacher Gabay' },
  'class.helpPrompt': { en: 'Need help? You can ask me anytime!', fil: 'Kailangan mo ba ng tulong? Maaari mo akong tanungin anumang oras!', taglish: 'Need help? Pwede mo akong tanungin anytime!' },
  'class.listenAgain': { en: 'Listen again', fil: 'Pakinggan ulit', taglish: 'Pakinggan ulit' },
  'class.play': { en: 'Resume', fil: 'Ituloy', taglish: 'Ituloy' },
  'class.pause': { en: 'Pause', fil: 'I-pause', taglish: 'I-pause' },
  'class.raiseHand': { en: 'Ask Teacher', fil: 'Itaas ang kamay', taglish: 'Itaas ang kamay' },
  'class.askPlaceholder': { en: 'Ask Teacher Gabay...', fil: 'Itanong kay Teacher Gabay...', taglish: 'Itanong kay Teacher Gabay...' },
  'class.speak': { en: 'Speak', fil: 'Magsalita', taglish: 'Magsalita' },
  'class.mic': { en: 'Mic', fil: 'Mic', taglish: 'Mic' },
  'class.micStop': { en: 'Stop', fil: 'Itigil', taglish: 'Itigil' },
  'class.ask': { en: 'Ask', fil: 'Tanong', taglish: 'Tanong' },
  'class.listening': { en: 'Listening... one moment.', fil: 'Pinapakinggan kita... sandali lang.', taglish: 'Pinapakinggan kita... sandali lang.' },
  'class.listeningShort': { en: 'One moment, I am listening...', fil: 'Sandali, pinapakinggan kita...', taglish: 'Sandali, pinapakinggan kita...' },
  'class.offlineNote': {
    en: 'Offline: Gabay still answers using on-device AI or cached explanations. Mic needs internet.',
    fil: 'Offline: sasagot pa rin si Gabay gamit ang on-device AI o naka-cache na paliwanag. Mic ay online lang.',
    taglish: 'Offline: sasagot pa rin si Gabay gamit ang on-device AI o cached na paliwanag. Mic ay online lang.',
  },
  'class.micOfflineTitle': { en: 'Mic — needs internet', fil: 'Mic — kailangan ng internet', taglish: 'Mic — kailangan ng internet' },
  'class.askError': { en: 'There was a problem answering. Please try again.', fil: 'May problema sa pagsagot. Subukan ulit.', taglish: 'May problema sa pagsagot. Subukan ulit.' },
  'class.startPractice': { en: 'Start the practice', fil: 'Simulan ang pagsasanay', taglish: 'Simulan ang pagsasanay' },
  'class.readyPractice': { en: 'Ready to Practice', fil: 'Handa nang Magsanay', taglish: 'Ready to Practice' },
  'class.answer': { en: 'Answer', fil: 'Sumagot', taglish: 'Sumagot' },
  'class.typeHere': { en: 'Type your answer here 👇', fil: 'Isulat ang sagot dito 👇', taglish: 'I-type ang sagot mo dito 👇' },
  'class.pickAnswer': { en: 'Tap your answer', fil: 'Pumili ng sagot', taglish: 'Pumili ng sagot' },
  'class.repeat': { en: 'Repeat', fil: 'Ulitin', taglish: 'Ulitin' },
  'class.source.nano': { en: 'On-device (offline)', fil: 'On-device (offline)', taglish: 'On-device (offline)' },
  'class.source.online': { en: 'Teacher Gabay (online)', fil: 'Teacher Gabay (online)', taglish: 'Teacher Gabay (online)' },
  'class.source.cached': { en: 'Cached explanation', fil: 'Naka-cache na paliwanag', taglish: 'Naka-cache na paliwanag' },
  'class.reviewMissed': { en: "Let's review what we missed:", fil: 'Balikan natin ang mga namali:', taglish: 'Balikan natin ang mga namali:' },
  'class.keyIdea': { en: 'Key idea', fil: 'Pangunahing Ideya', taglish: 'Key Idea' },
  'class.quickChallenge': { en: 'Quick Challenge', fil: 'Mabilisang Hamon', taglish: 'Quick Challenge' },
  'class.steps': { en: 'Solve step by step', fil: 'Sagutan nang hakbang-hakbang', taglish: 'Solve step by step' },
  'class.stepCounter': { en: 'Step {step} / {total}', fil: 'Hakbang {step} / {total}', taglish: 'Hakbang {step} / {total}' },
  'classroom.tryAgain': {
    en: 'Not quite — give it another shot!',
    fil: 'Hindi pa — subukan ulit!',
    taglish: 'Hindi pa tama — try mo ulit!',
  },
  'classroom.correctOverlay': { en: 'Correct! 🌟', fil: 'Tama! 🌟', taglish: 'Tama! 🌟' },
  'classroom.retry': { en: 'Try again', fil: 'Subukan ulit', taglish: 'Subukan ulit' },
  'classroom.readSolution': { en: 'Read Nova’s explanation…', fil: 'Basahin ang paliwanag ni Nova…', taglish: 'Basahin ang explanation ni Nova…' },
  // dynamic teacher lines ({n}=number, {total}=total)
  'class.bubble.explain': {
    en: 'Look at the key idea first. Then open the example to see it in action.',
    fil: 'Basahin muna ang mahalagang ideya. Pagkatapos, buksan ang halimbawa upang makita kung paano ito ginagamit.',
    taglish: 'Read the key idea first. Then open the example para makita kung paano ito ginagamit.',
  },
  'class.bubble.intro': {
    en: 'Question {n} of {total}: Write your answer below. You can do it!',
    fil: 'Tanong {n} sa {total}: Isulat ang sagot sa baba. Kaya mo ’yan!',
    taglish: 'Tanong {n} sa {total}: Isulat ang sagot sa baba. Kaya mo ’yan!',
  },
  'class.bubble.practiceHelp': {
    en: 'For Question {n}, read what is being asked and compare each choice carefully before deciding.',
    fil: 'Para sa Tanong {n}, basahing mabuti ang hinihingi at ihambing ang bawat pagpipilian bago sumagot.',
    taglish: 'Para sa Question {n}, basahin nang mabuti ang tanong at i-compare ang bawat choice bago sumagot.',
  },
  'class.bubble.done': {
    en: 'All done! {correct} of {total} correct. Great work, scholar!',
    fil: 'Tapos na! {correct} sa {total} ang tama. Magaling, iskolar!',
    taglish: 'Tapos na! {correct} sa {total} ang tama. Magaling, iskolar!',
  },
  'class.welcome3d': {
    en: 'Welcome to class! Walk to the board to begin.',
    fil: 'Maligayang pagdating sa klase! Lumakad sa pisara para magsimula.',
    taglish: 'Maligayang pagdating sa klase! Lakad sa pisara para magsimula.',
  },

  // ---- Summary (shared by Classroom / Games / 3D) ----
  'summary.done': { en: 'All done!', fil: 'Tapos na!', taglish: 'Tapos na!' },
  'summary.scoreLine': { en: '{correct} / {total} correct', fil: '{correct} / {total} tama', taglish: '{correct} / {total} tama' },

  // ---- Progress (Profile) ----
  // ---- Profile dashboard ----
  'profile.myProfile': { en: 'My profile', fil: 'Aking profile', taglish: 'Aking profile' },
  'profile.achievements': { en: 'Achievements', fil: 'Mga tagumpay', taglish: 'Mga achievement' },
  'profile.achievementsUnlocked': { en: '{count} of {total} unlocked', fil: '{count} sa {total} ang nabuksan', taglish: '{count} sa {total} unlocked' },
  'profile.achievementProgress': { en: 'Achievement progress', fil: 'Progreso ng mga tagumpay', taglish: 'Progress ng mga achievement' },
  'profile.viewAll': { en: 'View all', fil: 'Tingnan lahat', taglish: 'Tingnan lahat' },
  'profile.showLess': { en: 'Show less', fil: 'Bawasan', taglish: 'Bawasan' },
  'profile.unlocked': { en: 'unlocked', fil: 'nabuksan', taglish: 'unlocked' },
  'profile.learningSummary': { en: 'Learning summary', fil: 'Buod ng pag-aaral', taglish: 'Buod ng pag-aaral' },
  'profile.currentStreak': { en: 'Current streak', fil: 'Kasalukuyang streak', taglish: 'Current streak' },
  'profile.dayCount': { en: '{count} day', fil: '{count} araw', taglish: '{count} araw' },
  'profile.dayCountPlural': { en: '{count} days', fil: '{count} na araw', taglish: '{count} na araw' },
  'profile.keepGoing': { en: 'Keep it going!', fil: 'Ipagpatuloy mo!', taglish: 'Keep it going!' },
  'profile.lessonCount': { en: '{count} lesson', fil: '{count} aralin', taglish: '{count} lesson' },
  'profile.lessonCountPlural': { en: '{count} lessons', fil: '{count} na aralin', taglish: '{count} lessons' },
  'profile.inProgress': { en: '{count} in progress', fil: '{count} ginagawa pa', taglish: '{count} in progress' },
  'profile.preferences': { en: 'Preferences', fil: 'Mga kagustuhan', taglish: 'Mga preference' },
  'profile.gradeLevel': { en: 'Grade level', fil: 'Antas ng grado', taglish: 'Grade level' },
  'profile.chooseGrade': { en: 'Choose grade level', fil: 'Pumili ng antas ng grado', taglish: 'Pumili ng grade level' },
  'profile.chooseLanguage': { en: 'Choose language', fil: 'Pumili ng wika', taglish: 'Pumili ng wika' },
  'achievement.shape.name': { en: 'Shape Explorer', fil: 'Shape Explorer', taglish: 'Shape Explorer' },
  'achievement.shape.req': { en: 'Complete the first Measurement & Geometry lesson.', fil: 'Tapusin ang unang aralin sa Sukat at Geometry.', taglish: 'Tapusin ang unang lesson sa Measurement & Geometry.' },
  'achievement.number.name': { en: 'Number Ninja', fil: 'Number Ninja', taglish: 'Number Ninja' },
  'achievement.number.req': { en: 'Complete the first Number & Algebra lesson.', fil: 'Tapusin ang unang aralin sa Bilang at Algebra.', taglish: 'Tapusin ang unang lesson sa Number & Algebra.' },
  'achievement.data.name': { en: 'Data Detective', fil: 'Data Detective', taglish: 'Data Detective' },
  'achievement.data.req': { en: 'Complete the first Statistics & Probability lesson.', fil: 'Tapusin ang unang aralin sa Estadistika at Probabilidad.', taglish: 'Tapusin ang unang lesson sa Statistics & Probability.' },
  'achievement.streak.name': { en: 'Streak Spark', fil: 'Streak Spark', taglish: 'Streak Spark' },
  'achievement.streak.req': { en: 'Maintain a two-day learning streak.', fil: 'Panatilihin ang dalawang araw na sunod-sunod na pag-aaral.', taglish: 'I-maintain ang two-day learning streak.' },
  'achievement.quiz.name': { en: 'Quiz Whiz', fil: 'Quiz Whiz', taglish: 'Quiz Whiz' },
  'achievement.quiz.req': { en: 'Get a perfect score on one quiz.', fil: 'Kumuha ng perpektong marka sa isang pagsusulit.', taglish: 'Kumuha ng perfect score sa isang quiz.' },
  'achievement.master.name': { en: 'Math Master', fil: 'Math Master', taglish: 'Math Master' },
  'achievement.master.req': { en: 'Reach 100% mastery in any subject.', fil: 'Abutin ang 100% na kahusayan sa alinmang paksa.', taglish: 'Abutin ang 100% mastery sa kahit anong subject.' },
  'brief.section': { en: 'Section {number}', fil: 'Bahagi {number}', taglish: 'Section {number}' },
  'sound.mute': { en: 'Turn sound off', fil: 'Patayin ang tunog', taglish: 'Patayin ang tunog' },
  'sound.unmute': { en: 'Turn sound on', fil: 'Buksan ang tunog', taglish: 'Buksan ang tunog' },
  'progress.title': { en: 'My Progress', fil: 'Aking Progreso', taglish: 'Aking Progreso' },
  'progress.avg': { en: 'Average mastery: {pct}%', fil: 'Karaniwang kahusayan: {pct}%', taglish: 'Karaniwang mastery: {pct}%' },
  'progress.tab.mastery': { en: 'Mastery', fil: 'Kahusayan', taglish: 'Mastery' },
  'progress.tab.review': { en: 'Practice', fil: 'Pagsasanay', taglish: 'Pagsasanay' },
  'progress.nextUp': { en: 'Continue learning', fil: 'Ipagpatuloy ang pag-aaral', taglish: 'Ipagpatuloy ang pag-aaral' },
  'progress.start': { en: 'Start', fil: 'Magsimula', taglish: 'Magsimula' },
  'progress.continue': { en: 'Continue', fil: 'Magpatuloy', taglish: 'Magpatuloy' },
  'progress.sortBy': { en: 'Sort by progress', fil: 'Ayusin ayon sa progreso', taglish: 'Ayusin ayon sa progreso' },
  'progress.asc': { en: 'Ascending', fil: 'Pataas', taglish: 'Pataas' },
  'progress.desc': { en: 'Descending', fil: 'Pababa', taglish: 'Pababa' },
  'progress.lessonsHeading': { en: 'Your lessons', fil: 'Iyong mga aralin', taglish: 'Iyong mga aralin' },
  'progress.filterLabel': { en: 'Filter lessons by status', fil: 'Salain ang mga aralin ayon sa katayuan', taglish: 'Filter lessons ayon sa status' },
  'progress.filter.all': { en: 'All', fil: 'Lahat', taglish: 'Lahat' },
  'progress.filter.started': { en: 'Started', fil: 'Sinimulan', taglish: 'Sinimulan' },
  'progress.filter.completed': { en: 'Completed', fil: 'Tapos', taglish: 'Tapos' },
  'progress.filterEmptyTitle': { en: 'No lessons here yet', fil: 'Wala pang aralin dito', taglish: 'Wala pang aralin dito' },
  'progress.filterEmptyBody': { en: 'Choose another filter to see more lessons.', fil: 'Pumili ng ibang filter para makita ang iba pang aralin.', taglish: 'Pumili ng ibang filter para makita ang ibang lessons.' },
  'progress.completedCount': { en: '{completed} of {total} completed', fil: '{completed} sa {total} tapos', taglish: '{completed} sa {total} tapos' },
  'progress.notStarted': { en: 'Not started', fil: 'Hindi pa nasisimulan', taglish: 'Hindi pa nasisimulan' },
  'progress.lessonProgress': { en: '{pct}% complete', fil: '{pct}% tapos', taglish: '{pct}% tapos' },
  'progress.completed': { en: 'Completed', fil: 'Tapos na', taglish: 'Tapos na' },
  'progress.recommended': { en: 'Recommended', fil: 'Inirerekomenda', taglish: 'Inirerekomenda' },
  'progress.reviewLesson': { en: 'Review', fil: 'Balikan', taglish: 'Balikan' },
  'progress.showMore': { en: 'Show {count} more lessons', fil: 'Ipakita ang {count} pang aralin', taglish: 'Ipakita ang {count} pang aralin' },
  'progress.showLess': { en: 'Show fewer lessons', fil: 'Magpakita ng mas kaunti', taglish: 'Ipakita ang mas kaunti' },
  'progress.locked': { en: 'locked', fil: 'naka-lock', taglish: 'naka-lock' },
  'progress.empty.title': { en: 'No practice yet', fil: 'Wala pang pagsasanay', taglish: 'Wala pang pagsasanay' },
  'progress.empty.sub': {
    en: 'Answer questions in Practice or Games — your review will appear here.',
    fil: 'Sagutan ang mga tanong sa Practice o Games — lalabas dito ang review mo.',
    taglish: 'Sagutan ang mga tanong sa Practice o Games — lalabas dito ang review mo.',
  },
  'progress.yourAnswers': { en: 'What you answered', fil: 'Mga sinagot mo', taglish: 'Mga sinagot mo' },
  'progress.clear': { en: 'Clear', fil: 'Burahin', taglish: 'Burahin' },
  'profile.learner': { en: 'Learner', fil: 'Mag-aaral', taglish: 'Learner' },
  'profile.overall': { en: 'Overall mastery', fil: 'Kabuuang mastery', taglish: 'Overall mastery' },
  'profile.streak': { en: '{count} days in a row', fil: '{count} araw na sunod-sunod', taglish: '{count} araw na sunod-sunod' },
  'profile.changeGrade': { en: 'Change Grade', fil: 'Baguhin ang Grade', taglish: 'Baguhin ang Grade' },
  'profile.settings': { en: 'Settings', fil: 'Mga Setting', taglish: 'Settings' },
  'achievement.first': { en: 'First Step', fil: 'Unang Hakbang', taglish: 'Unang Hakbang' },
  'achievement.games': { en: 'Game On', fil: 'Game On', taglish: 'Game On' },
  'achievement.streak': { en: 'On a Roll', fil: 'On a Roll', taglish: 'On a Roll' },

  // ---- mastery band labels (the "In Progress" change lives here) ----
  'band.red': { en: 'Just starting', fil: 'Simulan na natin', taglish: 'Simulan na natin' },
  'band.orange': { en: 'In Progress', fil: 'Kaya pa', taglish: 'Kaya pa' },
  'band.green': { en: 'Doing great', fil: 'Mabuti', taglish: 'Magaling na' },

  // ---- Games (Tindahan) ----
  'games.title': { en: 'Gabay Games', fil: 'Gabay Games', taglish: 'Gabay Games' },
  'games.store': { en: 'Store Game', fil: 'Tindahan Game', taglish: 'Tindahan Game' },
  'games.tagline': {
    en: 'Compute totals, discounts, ratios, and percent while you sell.',
    fil: 'Mag-compute ng total, diskwento, ratio, at percent habang nagtitinda.',
    taglish: 'Mag-compute ng total, discount, ratio, at percent habang nagtitinda.',
  },
  'games.howMany': { en: 'How many questions will you answer?', fil: 'Ilang tanong ang sasagutan mo?', taglish: 'Ilang tanong ang sasagutan mo?' },
  'games.challenge': { en: 'Choose your challenge', fil: 'Piliin ang iyong hamon', taglish: 'Piliin ang iyong challenge' },
  'games.learningObjective': { en: 'Learning objective', fil: 'Layunin sa pagkatuto', taglish: 'Layunin ng aralin' },
  'games.minMax': { en: 'Minimum 5, maximum 20 questions.', fil: 'Minimum 5, maximum 20 na tanong.', taglish: 'Minimum 5, maximum 20 na tanong.' },
  'games.startStore': { en: 'Open the Store ({n} questions)', fil: 'Simulan ang Tindahan ({n} tanong)', taglish: 'Simulan ang Tindahan ({n} tanong)' },
  'games.closed': { en: 'Store closed!', fil: 'Tindahan sarado!', taglish: 'Tindahan sarado!' },
  'games.earned': { en: 'You earned: {coins} coins', fil: 'Kita mo: {coins} coins', taglish: 'Kita mo: {coins} coins' },
  'games.answered': { en: 'Answered', fil: 'Sinagot', taglish: 'Sinagot' },
  'games.accuracy': { en: 'Accuracy', fil: 'Accuracy', taglish: 'Accuracy' },
  'games.coins': { en: 'Coins', fil: 'Coins', taglish: 'Coins' },
  'games.customer': { en: 'Customer', fil: 'Suki', taglish: 'Customer' },
  'games.pay': { en: 'Pay', fil: 'Bayaran', taglish: 'Bayaran' },
  'games.playAgain': { en: 'Play again', fil: 'Laruin ulit', taglish: 'Laruin ulit' },

  // ---- Games hub (pick a game) ----
  'games.pick': { en: 'Pick a game', fil: 'Pumili ng laro', taglish: 'Pumili ng laro' },
  'games.pickSub': {
    en: 'Each game practices a different part of the curriculum.',
    fil: 'Bawat laro ay para sa ibang bahagi ng kurikulum.',
    taglish: 'Bawat game ay para sa ibang bahagi ng curriculum.',
  },
  'games.pickNote': {
    en: 'Choose a game and practice through play.',
    fil: 'Pumili ng laro at magsanay sa paglalaro.',
    taglish: 'Pumili ng game at magsanay sa paglalaro.',
  },
  'games.chooseAnother': { en: 'Choose another game', fil: 'Pumili ng ibang laro', taglish: 'Pumili ng ibang game' },
  'games.summary.perfect': { en: 'Perfect run. You cleared every question.', fil: 'Perfect run. Nasagot mo lahat nang tama.', taglish: 'Perfect run. Nasagot mo lahat nang tama.' },
  'games.summary.great': { en: 'Strong run. You are getting faster.', fil: 'Magaling. Mas mabilis ka na.', taglish: 'Strong run. Mas mabilis ka na.' },
  'games.summary.practice': { en: 'Good try. Review the missed items below.', fil: 'Good try. Balikan ang mga namali sa baba.', taglish: 'Good try. Balikan ang mga namali sa baba.' },
  'games.summaryPracticed': { en: 'You practiced: {game}', fil: 'Pinractice mo: {game}', taglish: 'Pinractice mo: {game}' },
  'games.results.coinsEarned': { en: '+{coins} coins earned', fil: '+{coins} coins na nakuha', taglish: '+{coins} coins earned' },
  'games.results.reviewSubtitle': { en: 'One quick review before your next round', fil: 'Isang mabilis na balik-aral bago ang susunod na round', taglish: 'Isang quick review bago ang next round' },
  'games.results.needsReview': { en: 'Needs review', fil: 'Kailangang balikan', taglish: 'Kailangang balikan' },
  'games.badge.number': { en: 'Number & Algebra', fil: 'Number & Algebra', taglish: 'Number & Algebra' },
  'games.badge.geometry': { en: 'Geometry', fil: 'Geometry', taglish: 'Geometry' },
  'games.badge.data': { en: 'Data', fil: 'Data', taglish: 'Data' },
  'games.badge.percent': { en: 'Percent', fil: 'Percent', taglish: 'Percent' },
  'games.badge.ratio': { en: 'Ratio', fil: 'Ratio', taglish: 'Ratio' },
  'games.badge.area': { en: 'Area', fil: 'Area', taglish: 'Area' },
  'games.badge.perimeter': { en: 'Perimeter', fil: 'Perimeter', taglish: 'Perimeter' },
  'games.badge.angles': { en: 'Angles', fil: 'Angles', taglish: 'Angles' },
  'games.badge.volume': { en: 'Volume', fil: 'Volume', taglish: 'Volume' },
  'games.badge.stats': { en: 'Mean/Median/Mode', fil: 'Mean/Median/Mode', taglish: 'Mean/Median/Mode' },
  'games.badge.probability': { en: 'Probability', fil: 'Probability', taglish: 'Probability' },

  // Store (Number & Algebra)
  'games.store.name': { en: 'Store Game', fil: 'Tindahan Game', taglish: 'Tindahan Game' },
  'games.store.tagline': {
    en: 'Compute totals, discounts, ratios, and percent while you sell.',
    fil: 'Mag-compute ng total, diskwento, ratio, at percent habang nagtitinda.',
    taglish: 'Mag-compute ng total, discount, ratio, at percent habang nagtitinda.',
  },
  'games.store.actor': { en: 'Customer', fil: 'Suki', taglish: 'Customer' },
  'games.store.action': { en: 'Pay', fil: 'Bayaran', taglish: 'Bayaran' },
  'games.store.start': { en: 'Open the Store', fil: 'Buksan ang Tindahan', taglish: 'Buksan ang Tindahan' },
  'games.store.closed': { en: 'Store closed!', fil: 'Tindahan sarado!', taglish: 'Tindahan sarado!' },

  // Garden (Measurement & Geometry — plane figures, area, perimeter)
  'games.garden.name': { en: 'Garden Game', fil: 'Hardin Game', taglish: 'Hardin Game' },
  'games.garden.tagline': {
    en: 'Measure plots, fences, and flower beds with area and perimeter.',
    fil: 'Sukatin ang taniman, bakod, at halamanan gamit ang area at perimeter.',
    taglish: 'Sukatin ang plots, bakod, at flower beds gamit ang area at perimeter.',
  },
  'games.garden.actor': { en: 'Gardener', fil: 'Hardinero', taglish: 'Hardinero' },
  'games.garden.action': { en: 'Plant', fil: 'Itanim', taglish: 'Itanim' },
  'games.garden.start': { en: 'Start the Garden', fil: 'Simulan ang Hardin', taglish: 'Simulan ang Hardin' },
  'games.garden.closed': { en: 'Garden grown!', fil: 'Lumago ang hardin!', taglish: 'Lumago ang hardin!' },

  // House Builder (Measurement & Geometry — angles, volume, capacity)
  'games.house.name': { en: 'House Builder', fil: 'Bahay Builder', taglish: 'Bahay Builder' },
  'games.house.tagline': {
    en: 'Build rooms using angles, volume, and capacity.',
    fil: 'Magtayo ng silid gamit ang anggulo, volume, at kapasidad.',
    taglish: 'Mag-build ng rooms gamit ang angles, volume, at capacity.',
  },
  'games.house.actor': { en: 'Client', fil: 'Kliyente', taglish: 'Client' },
  'games.house.action': { en: 'Build', fil: 'Itayo', taglish: 'Itayo' },
  'games.house.start': { en: 'Start Building', fil: 'Simulan ang Pagtatayo', taglish: 'Simulan ang Build' },
  'games.house.closed': { en: 'House finished!', fil: 'Tapos na ang bahay!', taglish: 'Tapos na ang bahay!' },

  // Fiesta Booth (Data & Probability — graphs, mean/median/mode, chance)
  'games.fiesta.name': { en: 'Fiesta Booth', fil: 'Fiesta Booth', taglish: 'Fiesta Booth' },
  'games.fiesta.tagline': {
    en: 'Read graphs, find mean, median, and mode, and guess the chances.',
    fil: 'Basahin ang grap, hanapin ang mean, median, at mode, at hulaan ang tsansa.',
    taglish: 'Basahin ang graphs, hanapin ang mean, median, mode, at hulaan ang chance.',
  },
  'games.fiesta.actor': { en: 'Visitor', fil: 'Bisita', taglish: 'Bisita' },
  'games.fiesta.action': { en: 'Answer', fil: 'Sagutin', taglish: 'Sagutin' },
  'games.fiesta.start': { en: 'Open the Fiesta', fil: 'Buksan ang Fiesta', taglish: 'Buksan ang Fiesta' },
  'games.fiesta.closed': { en: 'Fiesta done!', fil: 'Tapos ang fiesta!', taglish: 'Tapos ang fiesta!' },

  // ---- 3D Classroom HUD ----
  '3d.preparing': { en: 'Preparing the 3D class...', fil: 'Inihahanda ang 3D klase...', taglish: 'Inihahanda ang 3D klase...' },
  '3d.unavailable.title': { en: '3D class is not available on this device.', fil: 'Hindi available ang 3D klase sa device na ito.', taglish: 'Hindi available ang 3D class sa device na ito.' },
  '3d.unavailable.body': { en: 'You can continue with the same questions in the 2D classroom.', fil: 'Maaari mong ipagpatuloy ang parehong mga tanong sa 2D na klase.', taglish: 'Pwede mong ituloy ang parehong questions sa 2D classroom.' },
  '3d.unavailable.action': { en: 'Continue in 2D →', fil: 'Ituloy sa 2D →', taglish: 'Ituloy sa 2D →' },
  '3d.theme': { en: 'Theme', fil: 'Tema', taglish: 'Tema' },
  '3d.changeRoom': { en: 'Change the room', fil: 'Palitan ang klase', taglish: 'Palitan ang klase' },
  '3d.answerBoard': { en: 'Answer', fil: 'Sagutin', taglish: 'Sagutin' },
  '3d.zoomIn': { en: 'Zoom in', fil: 'Zoom in', taglish: 'Zoom in' },
  '3d.zoomOut': { en: 'Zoom out', fil: 'Zoom out', taglish: 'Zoom out' },
  '3d.board.correct': { en: 'Correct!', fil: 'Tama!', taglish: 'Tama!' },
  '3d.board.tryAgain': { en: 'Try again', fil: 'Subukan ulit', taglish: 'Subukan ulit' },
  '3d.board.ready': { en: 'The class is ready.', fil: 'Handa na ang klase.', taglish: 'Handa na ang klase.' },

  // ---- 3D first-entry coachmark ----
  '3d.intro.title': { en: 'How to answer', fil: 'Paano sumagot', taglish: 'Paano sumagot' },
  '3d.intro.s1': { en: 'Move to the board.', fil: 'Lumapit sa pisara.', taglish: 'Galaw papunta sa pisara.' },
  '3d.intro.s2': { en: 'Tap the Answer button.', fil: 'I-tap ang Sagutin.', taglish: 'I-tap ang Sagutin.' },
  '3d.intro.s3': { en: 'Type your answer, then send.', fil: 'Isulat ang sagot, tapos ipasa.', taglish: 'I-type ang sagot mo, tapos send.' },
  '3d.intro.go': { en: "Got it!", fil: 'Sige!', taglish: 'Sige!' },
  // Gabay is phone-first: lead with the on-screen joystick, mention the keys second.
  '3d.coach.move': {
    en: 'Drag the yellow joystick to walk.',
    fil: 'I-drag ang dilaw na joystick para maglakad.',
    taglish: 'I-drag ang dilaw na joystick para maglakad.',
  },
  '3d.coach.board': {
    en: 'Walk closer to the board to see the lesson.',
    fil: 'Lumapit sa pisara para makita ang aralin.',
    taglish: 'Lumapit sa pisara para makita ang aralin.',
  },
  '3d.move': { en: 'Move', fil: 'Galaw', taglish: 'Galaw' },
  '3d.help': { en: 'Help', fil: 'Tulong', taglish: 'Tulong' },
  '3d.joystick': { en: 'Movement joystick', fil: 'Joystick para gumalaw', taglish: 'Joystick para gumalaw' },

  // ---- 3D renovation theme names ----
  'theme.classic': { en: 'Classic', fil: 'Klasiko', taglish: 'Klasiko' },
  'theme.forest': { en: 'Forest', fil: 'Gubat', taglish: 'Gubat' },
  'theme.ocean': { en: 'Ocean', fil: 'Dagat', taglish: 'Dagat' },
  'theme.sunset': { en: 'Sunset', fil: 'Takipsilim', taglish: 'Takipsilim' },
  'theme.night': { en: 'Night', fil: 'Gabi', taglish: 'Gabi' },
}

// t('home.greeting', 'en') -> string. Unknown keys return the key (visible in
// dev). vars fills {placeholders}: t('games.earned', lang, { coins: 12 }).
export function t(key, lang = DEFAULT_LANG, vars) {
  const entry = STRINGS[key]
  if (!entry) return key
  let s = entry[lang] ?? entry[DEFAULT_LANG] ?? entry.en ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v))
    }
  }
  return s
}

// Curried helper for components: const tt = makeT(lang); tt('home.greeting').
export function makeT(lang = DEFAULT_LANG) {
  return (key, vars) => t(key, lang, vars)
}

// Content fields may be a plain string (shared across languages, e.g. a pure
// math stem like "15.7 + 9.86 = ?") or a { en, fil, taglish } object. Resolve
// to the current language, falling back gracefully.
export function localize(value, lang = DEFAULT_LANG) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return value[lang] ?? value[DEFAULT_LANG] ?? value.en ?? ''
  return String(value)
}

const MATH_CHOICE_LABELS = Object.freeze({
  square: Object.freeze({ en: 'square', fil: 'parisukat', taglish: 'square' }),
  triangle: Object.freeze({ en: 'triangle', fil: 'tatsulok', taglish: 'triangle' }),
  rectangle: Object.freeze({ en: 'rectangle', fil: 'parihaba', taglish: 'rectangle' }),
  circle: Object.freeze({ en: 'circle', fil: 'bilog', taglish: 'circle' }),
  True: Object.freeze({ en: 'True', fil: 'Tama', taglish: 'Tama' }),
  False: Object.freeze({ en: 'False', fil: 'Mali', taglish: 'Mali' }),
  '3 sides and 3 corners': Object.freeze({
    en: '3 sides and 3 corners',
    fil: '3 gilid at 3 sulok',
    taglish: '3 sides at 3 corners',
  }),
  'two triangles': Object.freeze({ en: 'two triangles', fil: 'dalawang tatsulok', taglish: 'two triangles' }),
  'two squares': Object.freeze({ en: 'two squares', fil: 'dalawang parisukat', taglish: 'two squares' }),
  'one circle': Object.freeze({ en: 'one circle', fil: 'isang bilog', taglish: 'one circle' }),
  'one triangle': Object.freeze({ en: 'one triangle', fil: 'isang tatsulok', taglish: 'one triangle' }),
  'rectangle body and triangle roof': Object.freeze({
    en: 'rectangle body and triangle roof',
    fil: 'parihabang katawan at tatsulok na bubong',
    taglish: 'rectangle body at triangle roof',
  }),
  'square body and circle roof': Object.freeze({
    en: 'square body and circle roof',
    fil: 'parisukat na katawan at bilog na bubong',
    taglish: 'square body at circle roof',
  }),
  'triangle body and rectangle roof': Object.freeze({
    en: 'triangle body and rectangle roof',
    fil: 'tatsulok na katawan at parihabang bubong',
    taglish: 'triangle body at rectangle roof',
  }),
  'circle body and square roof': Object.freeze({
    en: 'circle body and square roof',
    fil: 'bilog na katawan at parisukat na bubong',
    taglish: 'circle body at square roof',
  }),
  'first garden row': Object.freeze({ en: 'first garden row', fil: 'unang hanay sa hardin', taglish: 'first garden row' }),
  'second garden row': Object.freeze({ en: 'second garden row', fil: 'ikalawang hanay sa hardin', taglish: 'second garden row' }),
  'same length': Object.freeze({ en: 'same length', fil: 'magkapantay ang haba', taglish: 'same length' }),
  'not enough information': Object.freeze({ en: 'not enough information', fil: 'kulang ang impormasyon', taglish: 'kulang ang information' }),
})

// Choice values stay language-neutral for answer checking and persistence. Only
// their player-facing labels are translated here.
export function localizeChoice(value, lang = DEFAULT_LANG) {
  const normalized = String(value ?? '')
  const paperClips = normalized.match(/^(\d+) paper clips$/)
  if (paperClips && lang === 'fil') return `${paperClips[1]} paper clip`
  return localize(MATH_CHOICE_LABELS[normalized] ?? normalized, lang)
}
