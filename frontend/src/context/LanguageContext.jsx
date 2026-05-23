import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const translations = {
  en: {
    name: 'English',
    flag: '🇬🇧',
    navbar: { home: 'Home', search: 'Search', dashboard: 'Dashboard' },
    hero: {
      badge: 'AI-Powered Wish Matching Platform',
      title: 'Got a wish? WishPal makes it happen —',
      subtitle: 'powered by AI and 100% free. Try it now',
      formula: 'Your Wish + WishPal = Your Solution',
      cta: { free: 'It is Free, start now', makeWish: 'Make a Wish', explore: 'Explore Wishes' },
      search: { placeholder: "Search wishes... e.g., 'house cleaning', 'web developer job'", button: 'Search' },
    },
    ticker: {
      mostSuccessful: 'Most successful wishes this week:',
      jobsFound: 'Jobs found',
      productsBought: 'Products bought',
      usersAdvised: 'Users advised for free',
      trending: 'Trending:',
      wishesFulfilled: 'Wishes fulfilled',
      activeWishes: 'Active wishes',
      beingPosted: 'Being posted now',
    },
    stats: {
      liveNow: 'Live Now',
      wishesLive: 'Wishes Live',
      closedThisWeek: 'Closed This Week',
      beingPostedNow: 'Being Posted Now',
      updatingRealTime: 'Updating in real-time',
    },
    banner: {
      wishesLiveNow: 'Wishes Live Now',
      closedThisWeek: 'Closed This Week',
      jobsFound: 'Jobs Found',
      productsBought: 'Products Bought',
    },
    noticeBoard: {
      title: 'Notice Board',
      viewAll: 'View all',
      empty: 'No wishes posted yet. Be the first!',
    },
    map: {
      title: 'WishPad Map',
      allCountries: 'All Countries',
      matches: 'matches',
      viewPage: 'View Page',
    },
    closingSoon: {
      title: 'Closing Soon',
      empty: 'No wishes closing soon',
      lastDay: 'Last day!',
    },
    topWishpads: {
      title: 'Explore Top WishPads',
      subtitle: 'Discover businesses and service providers ready to fulfill your wishes worldwide',
      empty: 'No WishPads registered yet. Be the first!',
      register: 'Register as WishPad',
      matches: 'matches',
    },
    testimonials: {
      title: 'Success Stories',
      subtitle: 'Real people, real results — powered by WishPal',
      verified: 'Verified',
    },
    features: {
      title: 'Why We All Need WishPal',
      subtitle: 'The platform that connects wishes with opportunities',
      revenue: { title: 'Revenue Generator', desc: 'Turn wishes into revenue. Businesses get matched with customers actively seeking their services — no cold outreach needed.' },
      costSaving: { title: 'Cost Saving Tool', desc: 'Save money by finding exactly what you need through wish-based matching. No expensive ads or middleman fees.' },
      informative: { title: 'Informative', desc: 'AI-powered insights on every wish. Get smart matching, market intelligence, and data-driven recommendations.' },
      problemSolving: { title: 'Problem Solving', desc: 'Have a problem? Post a wish and let our AI match you with the perfect solution. From home repairs to career moves.' },
    },
    tagline: {
      title: 'WishPal: The only tool for all your need all times',
      subtitle: 'Your wishes, matched by AI. Every time, every need.',
      cta: 'It is Free, start now',
    },
    footer: {
      description: 'Your wishes, matched by AI. We connect you with the right people to fulfill your wishes.',
      platform: 'Platform',
      browseWishes: 'Browse Wishes',
      joinWishMate: 'Join as WishMate',
      joinWishPad: 'Join as WishPad',
      support: 'Support',
      faq: 'FAQ',
      contactUs: 'Contact Us',
      privacyPolicy: 'Privacy Policy',
      legal: 'Legal',
      termsOfService: 'Terms of Service',
      cookiePolicy: 'Cookie Policy',
      allRightsReserved: 'All rights reserved.',
    },
    daysLeft: '{days}d left',
    today: 'Today',
  },
  fr: {
    name: 'Français',
    flag: '🇫🇷',
    hero: {
      badge: 'Plateforme de correspondance de souhaits par IA',
      title: 'Un souhait ? WishPal le réalise —',
      subtitle: 'propulsé par l\'IA et 100% gratuit. Essayez maintenant',
      formula: 'Votre Souhait + WishPal = Votre Solution',
      cta: { free: 'C\'est gratuit, commencez maintenant', makeWish: 'Faire un Souhait', explore: 'Explorer les Souhaits' },
      search: { placeholder: 'Rechercher des souhaits... ex: "ménage", "emploi développeur"', button: 'Rechercher' },
    },
    ticker: {
      mostSuccessful: 'Souhaits les plus réussis cette semaine :',
      jobsFound: 'Emplois trouvés',
      productsBought: 'Produits achetés',
      usersAdvised: 'Utilisateurs conseillés gratuitement',
      trending: 'Tendances :',
      wishesFulfilled: 'Souhaits réalisés',
      activeWishes: 'Souhaits actifs',
      beingPosted: 'Publiés maintenant',
    },
    stats: {
      liveNow: 'En Direct',
      wishesLive: 'Souhaits en Direct',
      closedThisWeek: 'Clos Cette Semaine',
      beingPostedNow: 'Publiés Maintenant',
      updatingRealTime: 'Mise à jour en temps réel',
    },
    banner: {
      wishesLiveNow: 'Souhaits en Direct',
      closedThisWeek: 'Clos Cette Semaine',
      jobsFound: 'Emplois Trouvés',
      productsBought: 'Produits Achetés',
    },
    noticeBoard: {
      title: 'Tableau d\'Affichage',
      viewAll: 'Voir tout',
      empty: 'Aucun souhait publié. Soyez le premier !',
    },
    map: {
      title: 'Carte WishPad',
      allCountries: 'Tous les Pays',
      matches: 'correspondances',
      viewPage: 'Voir la Page',
    },
    closingSoon: {
      title: 'Bientôt Fermé',
      empty: 'Aucun souhait ne ferme bientôt',
      lastDay: 'Dernier jour !',
    },
    topWishpads: {
      title: 'Découvrir les Meilleurs WishPads',
      subtitle: 'Découvrez des entreprises et prestataires prêts à réaliser vos souhaits dans le monde entier',
      empty: 'Aucun WishPad inscrit. Soyez le premier !',
      register: 'S\'inscrire comme WishPad',
      matches: 'correspondances',
    },
    testimonials: {
      title: 'Histoires de Réussite',
      subtitle: 'Des vraies personnes, des vrais résultats — propulsés par WishPal',
      verified: 'Vérifié',
    },
    features: {
      title: 'Pourquoi Nous Avons Tous Besoin de WishPal',
      subtitle: 'La plateforme qui connecte les souhaits aux opportunités',
      revenue: { title: 'Générateur de Revenus', desc: 'Transformez les souhaits en revenus. Les entreprises sont mises en relation avec des clients recherchant activement leurs services.' },
      costSaving: { title: 'Outil d\'Économie', desc: 'Économisez en trouvant exactement ce qu\'il vous faut grâce à la correspondance basée sur les souhaits. Pas de publicités coûteuses.' },
      informative: { title: 'Informatif', desc: 'Informations basées sur l\'IA pour chaque souhait. Correspondance intelligente et recommandations data-driven.' },
      problemSolving: { title: 'Résolution de Problèmes', desc: 'Un problème ? Publiez un souhait et laissez notre IA vous trouver la solution parfaite.' },
    },
    tagline: {
      title: 'WishPal : Le seul outil pour tous vos besoins, à tout moment',
      subtitle: 'Vos souhaits, associés par IA. À chaque fois, pour chaque besoin.',
      cta: 'C\'est gratuit, commencez maintenant',
    },
    footer: {
      description: 'Vos souhaits, associés par IA. Nous vous connectons avec les bonnes personnes pour réaliser vos souhaits.',
      platform: 'Plateforme',
      browseWishes: 'Parcourir les Souhaits',
      joinWishMate: 'Rejoindre comme WishMate',
      joinWishPad: 'Rejoindre comme WishPad',
      support: 'Support',
      faq: 'FAQ',
      contactUs: 'Nous Contacter',
      privacyPolicy: 'Politique de Confidentialité',
      legal: 'Mentions Légales',
      termsOfService: 'Conditions d\'Utilisation',
      cookiePolicy: 'Politique des Cookies',
      allRightsReserved: 'Tous droits réservés.',
    },
    daysLeft: 'encore {days}j',
    today: 'Aujourd\'hui',
  },
  es: {
    name: 'Español',
    flag: '🇪🇸',
    hero: {
      badge: 'Plataforma de coincidencia de deseos con IA',
      title: '¿Un deseo? WishPal lo hace realidad —',
      subtitle: 'impulsado por IA y 100% gratis. Pruébalo ahora',
      formula: 'Tu Deseo + WishPal = Tu Solución',
      cta: { free: 'Es gratis, empieza ahora', makeWish: 'Pedir un Deseo', explore: 'Explorar Deseos' },
      search: { placeholder: 'Buscar deseos... ej: "limpieza", "trabajo desarrollador"', button: 'Buscar' },
    },
    ticker: {
      mostSuccessful: 'Deseos más exitosos esta semana:',
      jobsFound: 'Empleos encontrados',
      productsBought: 'Productos comprados',
      usersAdvised: 'Usuarios asesorados gratis',
      trending: 'Tendencias:',
      wishesFulfilled: 'Deseos cumplidos',
      activeWishes: 'Deseos activos',
      beingPosted: 'Publicándose ahora',
    },
    stats: {
      liveNow: 'En Vivo',
      wishesLive: 'Deseos en Vivo',
      closedThisWeek: 'Cerrados Esta Semana',
      beingPostedNow: 'Publicándose Ahora',
      updatingRealTime: 'Actualizando en tiempo real',
    },
    banner: {
      wishesLiveNow: 'Deseos en Vivo',
      closedThisWeek: 'Cerrados Esta Semana',
      jobsFound: 'Empleos Encontrados',
      productsBought: 'Productos Comprados',
    },
    noticeBoard: {
      title: 'Tablón de Anuncios',
      viewAll: 'Ver todo',
      empty: 'No hay deseos publicados. ¡Sé el primero!',
    },
    map: {
      title: 'Mapa WishPad',
      allCountries: 'Todos los Países',
      matches: 'coincidencias',
      viewPage: 'Ver Página',
    },
    closingSoon: {
      title: 'Próximo a Cerrar',
      empty: 'No hay deseos por cerrar pronto',
      lastDay: '¡Último día!',
    },
    topWishpads: {
      title: 'Explorar los Mejores WishPads',
      subtitle: 'Descubre empresas y proveedores listos para cumplir tus deseos en todo el mundo',
      empty: 'No hay WishPads registrados. ¡Sé el primero!',
      register: 'Registrarse como WishPad',
      matches: 'coincidencias',
    },
    testimonials: {
      title: 'Historias de Éxito',
      subtitle: 'Gente real, resultados reales — impulsados por WishPal',
      verified: 'Verificado',
    },
    features: {
      title: 'Por Qué Todos Necesitamos WishPal',
      subtitle: 'La plataforma que conecta deseos con oportunidades',
      revenue: { title: 'Generador de Ingresos', desc: 'Convierte deseos en ingresos. Las empresas se conectan con clientes que buscan activamente sus servicios.' },
      costSaving: { title: 'Herramienta de Ahorro', desc: 'Ahorra dinero encontrando exactamente lo que necesitas. Sin anuncios caros ni comisiones de intermediarios.' },
      informative: { title: 'Informativo', desc: 'Información impulsada por IA para cada deseo. Coincidencias inteligentes y recomendaciones basadas en datos.' },
      problemSolving: { title: 'Solución de Problemas', desc: '¿Tienes un problema? Publica un deseo y deja que nuestra IA te encuentre la solución perfecta.' },
    },
    tagline: {
      title: 'WishPal: La única herramienta para todas tus necesidades en todo momento',
      subtitle: 'Tus deseos, emparejados por IA. Cada vez, cada necesidad.',
      cta: 'Es gratis, empieza ahora',
    },
    footer: {
      description: 'Tus deseos, emparejados por IA. Te conectamos con las personas adecuadas para cumplir tus deseos.',
      platform: 'Plataforma',
      browseWishes: 'Explorar Deseos',
      joinWishMate: 'Únete como WishMate',
      joinWishPad: 'Únete como WishPad',
      support: 'Soporte',
      faq: 'FAQ',
      contactUs: 'Contáctanos',
      privacyPolicy: 'Política de Privacidad',
      legal: 'Legal',
      termsOfService: 'Términos de Servicio',
      cookiePolicy: 'Política de Cookies',
      allRightsReserved: 'Todos los derechos reservados.',
    },
    daysLeft: '{days}d restantes',
    today: 'Hoy',
  },
  zh: {
    name: '中文',
    flag: '🇨🇳',
    hero: {
      badge: 'AI智能愿望匹配平台',
      title: '有愿望？WishPal帮你实现 —',
      subtitle: 'AI驱动，100%免费。立即尝试',
      formula: '你的愿望 + WishPal = 你的解决方案',
      cta: { free: '免费，立即开始', makeWish: '许个愿望', explore: '浏览愿望' },
      search: { placeholder: '搜索愿望... 例如："家政清洁"、"网页开发工作"', button: '搜索' },
    },
    ticker: {
      mostSuccessful: '本周最成功的愿望：',
      jobsFound: '找到的工作',
      productsBought: '购买的产品',
      usersAdvised: '免费咨询的用户',
      trending: '热门：',
      wishesFulfilled: '已实现的愿望',
      activeWishes: '活跃愿望',
      beingPosted: '正在发布',
    },
    stats: {
      liveNow: '实时',
      wishesLive: '实时愿望',
      closedThisWeek: '本周已关闭',
      beingPostedNow: '正在发布',
      updatingRealTime: '实时更新',
    },
    banner: {
      wishesLiveNow: '实时愿望',
      closedThisWeek: '本周已关闭',
      jobsFound: '找到的工作',
      productsBought: '购买的产品',
    },
    noticeBoard: {
      title: '公告板',
      viewAll: '查看全部',
      empty: '还没有发布的愿望。成为第一个！',
    },
    map: {
      title: 'WishPad地图',
      allCountries: '所有国家',
      matches: '匹配',
      viewPage: '查看页面',
    },
    closingSoon: {
      title: '即将关闭',
      empty: '没有即将关闭的愿望',
      lastDay: '最后一天！',
    },
    topWishpads: {
      title: '探索热门WishPad',
      subtitle: '发现全球准备好实现你愿望的企业和服务提供商',
      empty: '还没有注册的WishPad。成为第一个！',
      register: '注册为WishPad',
      matches: '匹配',
    },
    testimonials: {
      title: '成功故事',
      subtitle: '真实的人，真实的结果 — 由WishPal驱动',
      verified: '已验证',
    },
    features: {
      title: '为什么我们都需要WishPal',
      subtitle: '连接愿望与机遇的平台',
      revenue: { title: '创收工具', desc: '将愿望转化为收入。企业与积极寻求服务的客户精准匹配。' },
      costSaving: { title: '省钱工具', desc: '通过基于愿望的匹配找到你真正需要的东西。没有昂贵的广告或中间商费用。' },
      informative: { title: '信息丰富', desc: '每个愿望的AI驱动洞察。智能匹配、市场情报和数据驱动推荐。' },
      problemSolving: { title: '解决问题', desc: '有问题？发布愿望，让我们的AI为你找到完美解决方案。从家庭维修到职业发展。' },
    },
    tagline: {
      title: 'WishPal：满足你所有需求的唯一工具',
      subtitle: '你的愿望，由AI匹配。每次都有求必应。',
      cta: '免费，立即开始',
    },
    footer: {
      description: '你的愿望，由AI匹配。我们为你连接合适的人来实现你的愿望。',
      platform: '平台',
      browseWishes: '浏览愿望',
      joinWishMate: '加入成为WishMate',
      joinWishPad: '加入成为WishPad',
      support: '支持',
      faq: '常见问题',
      contactUs: '联系我们',
      privacyPolicy: '隐私政策',
      legal: '法律',
      termsOfService: '服务条款',
      cookiePolicy: 'Cookie政策',
      allRightsReserved: '版权所有。',
    },
    daysLeft: '剩余{days}天',
    today: '今天',
  },
  sw: {
    name: 'Kiswahili',
    flag: '🇰🇪',
    hero: {
      badge: 'Jukwaa la Kulinganisha Matamanio kwa AI',
      title: 'Una tamaa? WishPal inatimiza —',
      subtitle: 'inayoendeshwa na AI na 100% bure. Jaribu sasa',
      formula: 'Tamaa Yako + WishPal = Suluhisho Lako',
      cta: { free: 'Ni Bure, anza sasa', makeWish: 'Tengeneza Tamaa', explore: 'Chunguza Matamanio' },
      search: { placeholder: 'Tafuta matamanio... mf: "kusafisha nyumba", "kazi ya programu"', button: 'Tafuta' },
    },
    ticker: {
      mostSuccessful: 'Matamanio yaliyofanikiwa wiki hii:',
      jobsFound: 'Kazi zilizopatikana',
      productsBought: 'Bidhaa zilizonunuliwa',
      usersAdvised: 'Watumiaji waliopewa ushauri bure',
      trending: 'Yanayovuma:',
      wishesFulfilled: 'Matamanio yaliyotimizwa',
      activeWishes: 'Matamanio hai',
      beingPosted: 'Yanachapishwa sasa',
    },
    stats: {
      liveNow: 'Moja kwa Moja',
      wishesLive: 'Matamanio Moja kwa Moja',
      closedThisWeek: 'Yamefunga Wiki Hii',
      beingPostedNow: 'Yanachapishwa Sasa',
      updatingRealTime: 'Inasasishwa kwa wakati halisi',
    },
    banner: {
      wishesLiveNow: 'Matamanio Moja kwa Moja',
      closedThisWeek: 'Yamefunga Wiki Hii',
      jobsFound: 'Kazi Zilizopatikana',
      productsBought: 'Bidhaa Zilizonunuliwa',
    },
    noticeBoard: {
      title: 'Ubao wa Matangazo',
      viewAll: 'Ona yote',
      empty: 'Hakuna matamanio yaliyochapishwa. Kuwa wa kwanza!',
    },
    map: {
      title: 'Ramani ya WishPad',
      allCountries: 'Nchi Zote',
      matches: 'zinazolingana',
      viewPage: 'Tazama Ukurasa',
    },
    closingSoon: {
      title: 'Kufunga Karibuni',
      empty: 'Hakuna matamanio yanayofunga karibuni',
      lastDay: 'Siku ya Mwisho!',
    },
    topWishpads: {
      title: 'Chunguza WishPads Bora',
      subtitle: 'Gundua biashara na watoa huduma walio tayari kutimiza matamanio yako duniani kote',
      empty: 'Hakuna WishPads zilizosajiliwa. Kuwa wa kwanza!',
      register: 'Jisajili kama WishPad',
      matches: 'zinazolingana',
    },
    testimonials: {
      title: 'Hadithi za Mafanikio',
      subtitle: 'Watu halisi, matokeo halisi — yanayoendeshwa na WishPal',
      verified: 'Imethibitishwa',
    },
    features: {
      title: 'Kwa Nini Sote Tunahitaji WishPal',
      subtitle: 'Jukwaa linalounganisha matamanio na fursa',
      revenue: { title: 'Kizalishaji Mapato', desc: 'Geuza matamanio kuwa mapato. Biashara huunganishwa na wateja wanaotafuta huduma zao.' },
      costSaving: { title: 'Chombo cha Kuokoa', desc: 'Okoa pesa kwa kupata kile unachohitaji. Hakuna matangazo ghali au ada za wakala.' },
      informative: { title: 'Taarifa', desc: 'Ufahamu wa AI kwa kila tamaa. Ulinganishaji mahiri na mapendekezo yanayotokana na data.' },
      problemSolving: { title: 'Utatuzi wa Matatizo', desc: 'Una tatizo? Weka tamaa na acha AI yetu ikupatie suluhisho kamili.' },
    },
    tagline: {
      title: 'WishPal: Chombo cha pekee kwa mahitaji yako yote wakati wote',
      subtitle: 'Matamanio yako, yanayolinganishwa na AI. Kila wakati, kila mahitaji.',
      cta: 'Ni Bure, anza sasa',
    },
    footer: {
      description: 'Matamanio yako, yanayolinganishwa na AI. Tunakuunganisha na watu sahihi kutimiza matamanio yako.',
      platform: 'Jukwaa',
      browseWishes: 'Vinjari Matamanio',
      joinWishMate: 'Jiunge kama WishMate',
      joinWishPad: 'Jiunge kama WishPad',
      support: 'Msaada',
      faq: 'Maswali',
      contactUs: 'Wasiliana Nasi',
      privacyPolicy: 'Sera ya Faragha',
      legal: 'Kisheria',
      termsOfService: 'Masharti ya Huduma',
      cookiePolicy: 'Sera ya Vidakuzi',
      allRightsReserved: 'Haki zote zimehifadhiwa.',
    },
    daysLeft: 'siku {days} zimebaki',
    today: 'Leo',
  },
  ar: {
    name: 'العربية',
    flag: '🇸🇦',
    rtl: true,
    hero: {
      badge: 'منصة مطابقة الرغبات بالذكاء الاصطناعي',
      title: 'لديك أمنية؟ WishPal يحققها —',
      subtitle: 'مدعوم بالذكاء الاصطناعي ومجاني 100%. جربه الآن',
      formula: 'أمنيتك + WishPal = حلك',
      cta: { free: 'إنه مجاني، ابدأ الآن', makeWish: 'تقديم أمنية', explore: 'استكشاف الأمنيات' },
      search: { placeholder: 'بحث عن أمنيات... مثال: "تنظيف منزل"، "وظيفة مطور ويب"', button: 'بحث' },
    },
    ticker: {
      mostSuccessful: 'الأمنيات الأكثر نجاحاً هذا الأسبوع:',
      jobsFound: 'وظائف وجدت',
      productsBought: 'منتجات اشتراها',
      usersAdvised: 'مستخدمين نُصحوا مجاناً',
      trending: 'الأكثر رواجاً:',
      wishesFulfilled: 'أمنيات تحققت',
      activeWishes: 'أمنيات نشطة',
      beingPosted: 'تُنشر الآن',
    },
    stats: {
      liveNow: 'مباشر',
      wishesLive: 'أمنيات مباشرة',
      closedThisWeek: 'أغلقت هذا الأسبوع',
      beingPostedNow: 'تُنشر الآن',
      updatingRealTime: 'التحديث في الوقت الفعلي',
    },
    banner: {
      wishesLiveNow: 'أمنيات مباشرة',
      closedThisWeek: 'أغلقت هذا الأسبوع',
      jobsFound: 'وظائف وجدت',
      productsBought: 'منتجات اشتراها',
    },
    noticeBoard: {
      title: 'لوحة الإعلانات',
      viewAll: 'عرض الكل',
      empty: 'لا توجد أمنيات منشورة بعد. كن الأول!',
    },
    map: {
      title: 'خريطة WishPad',
      allCountries: 'جميع البلدان',
      matches: 'مطابقة',
      viewPage: 'عرض الصفحة',
    },
    closingSoon: {
      title: 'تغلق قريباً',
      empty: 'لا توجد أمنيات تغلق قريباً',
      lastDay: 'اليوم الأخير!',
    },
    topWishpads: {
      title: 'استكشاف أفضل WishPads',
      subtitle: 'اكتشف الشركات ومقدمي الخدمات المستعدين لتحقيق أمنياتك في جميع أنحاء العالم',
      empty: 'لا توجد WishPads مسجلة بعد. كن الأول!',
      register: 'التسجيل كـ WishPad',
      matches: 'مطابقة',
    },
    testimonials: {
      title: 'قصص النجاح',
      subtitle: 'أناس حقيقيون، نتائج حقيقية — مدعومة من WishPal',
      verified: 'موثّق',
    },
    features: {
      title: 'لماذا نحتاج جميعاً إلى WishPal',
      subtitle: 'المنصة التي تربط الأمنيات بالفرص',
      revenue: { title: 'مدرة للدخل', desc: 'حول الأمنيات إلى دخل. تتواصل الشركات مع العملاء الذين يبحثون بنشاط عن خدماتهم.' },
      costSaving: { title: 'أداة توفير', desc: 'وفر المال بالعثور على ما تحتاجه بالضبط من خلال المطابقة القائمة على الأمنيات. لا إعلانات باهظة.' },
      informative: { title: 'غني بالمعلومات', desc: 'رؤى مدعومة بالذكاء الاصطناعي لكل أمنية. مطابقة ذكية وتوصيات مبنية على البيانات.' },
      problemSolving: { title: 'حل المشكلات', desc: 'لديك مشكلة؟ انشر أمنية ودع الذكاء الاصطناعي لدينا يجد لك الحل الأمثل.' },
    },
    tagline: {
      title: 'WishPal: الأداة الوحيدة لجميع احتياجاتك في كل الأوقات',
      subtitle: 'أمنياتك، متطابقة بالذكاء الاصطناعي. كل مرة، كل حاجة.',
      cta: 'إنه مجاني، ابدأ الآن',
    },
    footer: {
      description: 'أمنياتك، متطابقة بالذكاء الاصطناعي. نوصلك بالأشخاص المناسبين لتحقيق أمنياتك.',
      platform: 'المنصة',
      browseWishes: 'تصفح الأمنيات',
      joinWishMate: 'انضم كـ WishMate',
      joinWishPad: 'انضم كـ WishPad',
      support: 'الدعم',
      faq: 'الأسئلة الشائعة',
      contactUs: 'اتصل بنا',
      privacyPolicy: 'سياسة الخصوصية',
      legal: 'قانوني',
      termsOfService: 'شروط الخدمة',
      cookiePolicy: 'سياسة ملفات تعريف الارتباط',
      allRightsReserved: 'جميع الحقوق محفوظة.',
    },
    daysLeft: '{days} أيام متبقية',
    today: 'اليوم',
  },
  pt: {
    name: 'Português',
    flag: '🇵🇹',
    hero: {
      badge: 'Plataforma de Correspondência de Desejos com IA',
      title: 'Tem um desejo? WishPal realiza —',
      subtitle: 'alimentado por IA e 100% gratuito. Experimente agora',
      formula: 'Seu Desejo + WishPal = Sua Solução',
      cta: { free: 'É grátis, comece agora', makeWish: 'Fazer um Desejo', explore: 'Explorar Desejos' },
      search: { placeholder: 'Pesquisar desejos... ex: "limpeza", "emprego programador"', button: 'Pesquisar' },
    },
    ticker: {
      mostSuccessful: 'Desejos mais bem-sucedidos esta semana:',
      jobsFound: 'Empregos encontrados',
      productsBought: 'Produtos comprados',
      usersAdvised: 'Utilizadores aconselhados grátis',
      trending: 'Tendências:',
      wishesFulfilled: 'Desejos realizados',
      activeWishes: 'Desejos ativos',
      beingPosted: 'A ser publicados agora',
    },
    stats: {
      liveNow: 'Ao Vivo',
      wishesLive: 'Desejos ao Vivo',
      closedThisWeek: 'Fechados Esta Semana',
      beingPostedNow: 'A Serem Publicados Agora',
      updatingRealTime: 'Atualizando em tempo real',
    },
    banner: {
      wishesLiveNow: 'Desejos ao Vivo',
      closedThisWeek: 'Fechados Esta Semana',
      jobsFound: 'Empregos Encontrados',
      productsBought: 'Produtos Comprados',
    },
    noticeBoard: {
      title: 'Quadro de Avisos',
      viewAll: 'Ver tudo',
      empty: 'Nenhum desejo publicado ainda. Seja o primeiro!',
    },
    map: {
      title: 'Mapa WishPad',
      allCountries: 'Todos os Países',
      matches: 'correspondências',
      viewPage: 'Ver Página',
    },
    closingSoon: {
      title: 'A Fechar em Breve',
      empty: 'Nenhum desejo a fechar em breve',
      lastDay: 'Último dia!',
    },
    topWishpads: {
      title: 'Explorar os Melhores WishPads',
      subtitle: 'Descubra empresas e prestadores de serviços prontos para realizar seus desejos em todo o mundo',
      empty: 'Nenhum WishPad registrado ainda. Seja o primeiro!',
      register: 'Registrar como WishPad',
      matches: 'correspondências',
    },
    testimonials: {
      title: 'Histórias de Sucesso',
      subtitle: 'Pessoas reais, resultados reais — alimentados por WishPal',
      verified: 'Verificado',
    },
    features: {
      title: 'Por Que Todos Precisamos do WishPal',
      subtitle: 'A plataforma que conecta desejos a oportunidades',
      revenue: { title: 'Gerador de Receita', desc: 'Transforme desejos em receita. Empresas conectam-se com clientes que procuram ativamente seus serviços.' },
      costSaving: { title: 'Ferramenta de Economia', desc: 'Economize encontrando exatamente o que precisa. Sem anúncios caros ou taxas de intermediários.' },
      informative: { title: 'Informativo', desc: 'Insights alimentados por IA para cada desejo. Correspondência inteligente e recomendações baseadas em dados.' },
      problemSolving: { title: 'Resolução de Problemas', desc: 'Tem um problema? Publique um desejo e deixe nossa IA encontrar a solução perfeita.' },
    },
    tagline: {
      title: 'WishPal: A única ferramenta para todas as suas necessidades em todos os momentos',
      subtitle: 'Seus desejos, combinados por IA. Toda vez, toda necessidade.',
      cta: 'É grátis, comece agora',
    },
    footer: {
      description: 'Seus desejos, combinados por IA. Conectamo-lo com as pessoas certas para realizar seus desejos.',
      platform: 'Plataforma',
      browseWishes: 'Explorar Desejos',
      joinWishMate: 'Juntar-se como WishMate',
      joinWishPad: 'Juntar-se como WishPad',
      support: 'Suporte',
      faq: 'FAQ',
      contactUs: 'Fale Connosco',
      privacyPolicy: 'Política de Privacidade',
      legal: 'Legal',
      termsOfService: 'Termos de Serviço',
      cookiePolicy: 'Política de Cookies',
      allRightsReserved: 'Todos os direitos reservados.',
    },
    daysLeft: '{days}d restantes',
    today: 'Hoje',
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('wishpal-lang') || 'en';
    } catch { return 'en'; }
  });

  useEffect(() => {
    try { localStorage.setItem('wishpal-lang', language); } catch {}
    const dir = translations[language]?.rtl ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const t = useCallback((key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English
        let fallback = translations.en;
        for (const fk of keys) {
          fallback = fallback?.[fk];
        }
        return fallback ?? key;
      }
    }
    return typeof value === 'string' ? value : key;
  }, [language]);

  const tReplace = useCallback((key, replacements) => {
    let text = t(key);
    for (const [placeholder, value] of Object.entries(replacements)) {
      text = text.replace(`{${placeholder}}`, value);
    }
    return text;
  }, [t]);

  const languageOptions = Object.entries(translations).map(([code, lang]) => ({
    code,
    name: lang.name,
    flag: lang.flag,
  }));

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tReplace, languageOptions }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export { translations };
