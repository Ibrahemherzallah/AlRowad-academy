/**
 * Rich seed dataset for اكاديمية الرواد.
 * Courses carry full Arabic/English curricula, some with discounts,
 * installments, coming-soon status, and enrollment caps.
 */

export interface SeedLesson {
  title: string;
  duration: number; // seconds
  isFreePreview?: boolean;
}
export interface SeedSection {
  title: string;
  lessons: SeedLesson[];
}
export interface SeedCourse {
  slug: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  category: string;
  instructorName: string;
  instructorBio: string;
  price: number;
  discountedPrice?: number | null;
  installmentOptions?: { parts: number; amount: number }[];
  status: 'published' | 'coming_soon' | 'draft';
  accessBufferWeeks?: number;
  maxStudents?: number | null;
  waitlistEnabled?: boolean;
  curriculum: SeedSection[];
  faqs: { question: string; answer: string }[];
}

export const SEED_COURSES: SeedCourse[] = [
  {
    slug: 'digital-marketing',
    title: { ar: 'التسويق الرقمي من الصفر للاحتراف', en: 'Digital Marketing from Zero to Pro' },
    description: {
      ar: 'تعلّم بناء حملات تسويقية تحقق مبيعات حقيقية عبر السوشيال ميديا والإعلانات الممولة وتحليل النتائج. دورة عملية بمشاريع تطبيقية.',
      en: 'Learn to build campaigns that drive real sales across social media, paid ads, and analytics. Hands-on with practical projects.',
    },
    category: 'التسويق',
    instructorName: 'أحمد الرواد',
    instructorBio: 'خبير تسويق رقمي بخبرة 8 سنوات، أدار حملات لأكثر من 120 علامة تجارية في فلسطين والأردن.',
    price: 350,
    discountedPrice: 280,
    installmentOptions: [{ parts: 2, amount: 145 }],
    status: 'published',
    accessBufferWeeks: 2,
    maxStudents: 40,
    curriculum: [
      {
        title: 'مقدمة التسويق الرقمي',
        lessons: [
          { title: 'ما هو التسويق الرقمي ولماذا يهمك', duration: 480, isFreePreview: true },
          { title: 'خريطة القنوات التسويقية', duration: 620, isFreePreview: true },
          { title: 'تحديد الجمهور المستهدف', duration: 540 },
        ],
      },
      {
        title: 'السوشيال ميديا',
        lessons: [
          { title: 'استراتيجية المحتوى على إنستغرام', duration: 900 },
          { title: 'بناء هوية بصرية متسقة', duration: 720 },
          { title: 'جدولة المحتوى والأدوات', duration: 600 },
        ],
      },
      {
        title: 'الإعلانات الممولة',
        lessons: [
          { title: 'إعداد حملة Meta Ads', duration: 1080 },
          { title: 'استهداف الجمهور واختبار A/B', duration: 960 },
          { title: 'قراءة النتائج وتحسين الأداء', duration: 840 },
        ],
      },
    ],
    faqs: [
      { question: 'هل أحتاج خبرة سابقة؟', answer: 'لا، الدورة تبدأ من الصفر وتصل بك للاحتراف.' },
      { question: 'هل الدورة مسجّلة أم مباشرة؟', answer: 'مسجّلة بالكامل مع متابعة شخصية 1:1 عبر واتساب.' },
      { question: 'كم مدة الوصول للفيديوهات؟', answer: 'طوال مدة الدورة بالإضافة إلى أسبوعين بعد الانتهاء.' },
    ],
  },
  {
    slug: 'marketing-with-ai',
    title: { ar: 'التسويق بالذكاء الاصطناعي', en: 'Marketing with AI' },
    description: {
      ar: 'ضاعف إنتاجيتك التسويقية باستخدام أدوات الذكاء الاصطناعي: كتابة المحتوى، تصميم الإعلانات، تحليل البيانات، وأتمتة الحملات.',
      en: 'Multiply your marketing output with AI tools: content writing, ad design, data analysis, and campaign automation.',
    },
    category: 'التسويق',
    instructorName: 'سارة منصور',
    instructorBio: 'مستشارة تسويق ومدرّبة معتمدة في أدوات الذكاء الاصطناعي التطبيقية.',
    price: 400,
    discountedPrice: 320,
    installmentOptions: [{ parts: 2, amount: 165 }],
    status: 'published',
    accessBufferWeeks: 2,
    curriculum: [
      {
        title: 'أساسيات الذكاء الاصطناعي للمسوّقين',
        lessons: [
          { title: 'نظرة عامة على أدوات AI التسويقية', duration: 540, isFreePreview: true },
          { title: 'كتابة الأوامر الفعّالة (Prompting)', duration: 780 },
        ],
      },
      {
        title: 'إنتاج المحتوى',
        lessons: [
          { title: 'توليد أفكار ومحتوى بالجملة', duration: 900 },
          { title: 'تصميم الصور والإعلانات بالـ AI', duration: 1020 },
        ],
      },
      {
        title: 'الأتمتة والتحليل',
        lessons: [
          { title: 'أتمتة الردود وخدمة العملاء', duration: 840 },
          { title: 'تحليل حملاتك بمساعدة AI', duration: 720 },
        ],
      },
    ],
    faqs: [
      { question: 'ما الأدوات التي سنستخدمها؟', answer: 'مزيج من الأدوات المجانية والمدفوعة، مع بدائل لكل ميزانية.' },
      { question: 'هل أحتاج اشتراكات مدفوعة؟', answer: 'لا، نوفّر بدائل مجانية لكل خطوة في الدورة.' },
    ],
  },
  {
    slug: 'graphic-design',
    title: { ar: 'التصميم الجرافيكي الاحترافي', en: 'Professional Graphic Design' },
    description: {
      ar: 'من مبادئ التصميم إلى تنفيذ هويات بصرية كاملة. تعلّم الأدوات والأسس التي تجعل تصاميمك تبيع.',
      en: 'From design principles to full brand identities. Learn the tools and fundamentals that make designs sell.',
    },
    category: 'التصميم',
    instructorName: 'ليث خالد',
    instructorBio: 'مصمم جرافيك ومدير فني، عمل مع وكالات إعلانية إقليمية.',
    price: 380,
    installmentOptions: [{ parts: 2, amount: 195 }],
    status: 'published',
    accessBufferWeeks: 3,
    curriculum: [
      {
        title: 'مبادئ التصميم',
        lessons: [
          { title: 'نظرية الألوان', duration: 660, isFreePreview: true },
          { title: 'التكوين والتوازن البصري', duration: 720 },
          { title: 'الطباعة واختيار الخطوط', duration: 600 },
        ],
      },
      {
        title: 'الأدوات العملية',
        lessons: [
          { title: 'أساسيات فوتوشوب', duration: 1200 },
          { title: 'أساسيات إليستريتور', duration: 1140 },
        ],
      },
      {
        title: 'مشروع الهوية البصرية',
        lessons: [
          { title: 'تصميم شعار احترافي', duration: 1080 },
          { title: 'دليل الهوية البصرية الكامل', duration: 960 },
        ],
      },
    ],
    faqs: [
      { question: 'هل أحتاج جهاز قوي؟', answer: 'جهاز متوسط يكفي للبدء، ونوضّح المتطلبات في أول درس.' },
    ],
  },
  {
    slug: 'n8n-automation',
    title: { ar: 'أتمتة الأعمال باستخدام n8n', en: 'Business Automation with n8n' },
    description: {
      ar: 'اربط تطبيقاتك وأتمت مهامك المتكررة بدون كود. وفّر ساعات عملك اليومية وابنِ أنظمة تعمل تلقائياً.',
      en: 'Connect your apps and automate repetitive tasks with no code. Save daily hours and build systems that run themselves.',
    },
    category: 'تقنية / بدون كود',
    instructorName: 'إبراهيم حرزالله',
    instructorBio: 'مطوّر ومهندس أنظمة، متخصص في حلول الأتمتة ودمج الأنظمة.',
    price: 300,
    discountedPrice: 240,
    status: 'published',
    accessBufferWeeks: 2,
    curriculum: [
      {
        title: 'مقدمة n8n',
        lessons: [
          { title: 'ما هي الأتمتة ولماذا n8n', duration: 480, isFreePreview: true },
          { title: 'تثبيت وإعداد البيئة', duration: 600 },
        ],
      },
      {
        title: 'بناء سير العمل',
        lessons: [
          { title: 'أول workflow: من نموذج إلى بريد', duration: 780 },
          { title: 'العقد والشروط والحلقات', duration: 900 },
          { title: 'ربط واتساب وجداول جوجل', duration: 1020 },
        ],
      },
    ],
    faqs: [
      { question: 'هل أحتاج معرفة برمجية؟', answer: 'لا، n8n أداة بصرية بدون كود، لكن الفهم المنطقي مفيد.' },
    ],
  },
  {
    slug: 'programming-fundamentals',
    title: { ar: 'أساسيات البرمجة بلغة C++', en: 'Programming Fundamentals (C++)' },
    description: {
      ar: 'ابنِ أساساً برمجياً متيناً يؤهلك لأي مسار تقني لاحق. مفاهيم، حل مشكلات، ومشاريع تطبيقية.',
      en: 'Build a solid programming foundation for any future tech path. Concepts, problem solving, and practical projects.',
    },
    category: 'البرمجة',
    instructorName: 'محمد أبو ريان',
    instructorBio: 'مهندس برمجيات ومدرّب، درّب أكثر من 500 طالب على أساسيات البرمجة.',
    price: 320,
    installmentOptions: [{ parts: 2, amount: 165 }],
    status: 'published',
    accessBufferWeeks: 3,
    curriculum: [
      {
        title: 'البداية',
        lessons: [
          { title: 'كيف يفكّر الحاسوب', duration: 540, isFreePreview: true },
          { title: 'المتغيرات وأنواع البيانات', duration: 720 },
          { title: 'الشروط والتحكّم بالمسار', duration: 780 },
        ],
      },
      {
        title: 'البنى والدوال',
        lessons: [
          { title: 'الحلقات التكرارية', duration: 840 },
          { title: 'الدوال وإعادة الاستخدام', duration: 900 },
          { title: 'المصفوفات', duration: 720 },
        ],
      },
    ],
    faqs: [
      { question: 'لماذا C++ للمبتدئين؟', answer: 'تعطيك فهماً عميقاً لكيفية عمل البرمجة، يسهّل تعلّم أي لغة بعدها.' },
    ],
  },
  {
    slug: 'frontend-development',
    title: { ar: 'تطوير واجهات الويب الحديثة', en: 'Modern Frontend Development' },
    description: {
      ar: 'من HTML إلى React. ابنِ مواقع وتطبيقات ويب حقيقية واحترف أكثر مهارة مطلوبة في سوق العمل.',
      en: 'From HTML to React. Build real websites and web apps, and master the most in-demand skill in the job market.',
    },
    category: 'البرمجة',
    instructorName: 'إبراهيم حرزالله',
    instructorBio: 'مطوّر full-stack ومؤسس منصات تقنية، خبرة عملية في React وTypeScript.',
    price: 450,
    discountedPrice: 360,
    installmentOptions: [
      { parts: 2, amount: 185 },
      { parts: 3, amount: 125 },
    ],
    status: 'published',
    accessBufferWeeks: 4,
    maxStudents: 30,
    curriculum: [
      {
        title: 'أساسيات الويب',
        lessons: [
          { title: 'HTML: بنية الصفحة', duration: 660, isFreePreview: true },
          { title: 'CSS: التنسيق والتخطيط', duration: 900 },
          { title: 'التصميم المتجاوب', duration: 780 },
        ],
      },
      {
        title: 'JavaScript',
        lessons: [
          { title: 'أساسيات JavaScript', duration: 1080 },
          { title: 'التعامل مع DOM', duration: 960 },
          { title: 'الطلبات غير المتزامنة', duration: 900 },
        ],
      },
      {
        title: 'React',
        lessons: [
          { title: 'مكوّنات React', duration: 1140 },
          { title: 'الحالة والخصائص', duration: 1020 },
          { title: 'مشروع تطبيق كامل', duration: 1500 },
        ],
      },
    ],
    faqs: [
      { question: 'هل تؤهلني للعمل الحر؟', answer: 'نعم، تنهي الدورة بمشروع محفظة يؤهلك للتقديم على مشاريع حقيقية.' },
      { question: 'ما المتطلبات؟', answer: 'يُفضّل إنهاء أساسيات البرمجة، لكنها ليست شرطاً.' },
    ],
  },
  {
    slug: 'claude-ai-tools',
    title: { ar: 'كلود وأدوات الذكاء الاصطناعي للإنتاجية', en: 'Claude & AI Tools for Productivity' },
    description: {
      ar: 'استثمر أدوات الذكاء الاصطناعي لمضاعفة إنتاجيتك في العمل والدراسة والمشاريع الشخصية.',
      en: 'Leverage AI tools to multiply your productivity in work, study, and personal projects.',
    },
    category: 'الذكاء الاصطناعي',
    instructorName: 'سارة منصور',
    instructorBio: 'مستشارة في تبنّي أدوات الذكاء الاصطناعي داخل فرق العمل.',
    price: 300,
    status: 'published',
    accessBufferWeeks: 2,
    curriculum: [
      {
        title: 'البداية مع المساعدات الذكية',
        lessons: [
          { title: 'كيف تفكّر النماذج اللغوية', duration: 540, isFreePreview: true },
          { title: 'فن كتابة الأوامر', duration: 720 },
        ],
      },
      {
        title: 'تطبيقات عملية',
        lessons: [
          { title: 'أتمتة المهام الكتابية', duration: 840 },
          { title: 'تحليل المستندات والبيانات', duration: 900 },
        ],
      },
    ],
    faqs: [{ question: 'هل المحتوى للمبتدئين؟', answer: 'نعم، مصمّم لأي شخص بغضّ النظر عن خلفيته التقنية.' }],
  },
  {
    slug: 'entrepreneurship',
    title: { ar: 'ريادة الأعمال ونمو الدخل', en: 'Entrepreneurship & Income Growth' },
    description: {
      ar: 'من الفكرة إلى الدخل. تعلّم كيف تبني مشروعاً مربحاً، تسعّر خدماتك، وتنمّي دخلك بخطوات عملية.',
      en: 'From idea to income. Learn to build a profitable venture, price your services, and grow your income with practical steps.',
    },
    category: 'الأعمال',
    instructorName: 'أحمد الرواد',
    instructorBio: 'رائد أعمال ومستشار نمو، أسّس ودعم عدة مشاريع ناشئة ناجحة.',
    price: 500,
    discountedPrice: 400,
    installmentOptions: [
      { parts: 2, amount: 205 },
      { parts: 3, amount: 140 },
    ],
    status: 'published',
    accessBufferWeeks: 4,
    curriculum: [
      {
        title: 'من الفكرة إلى النموذج',
        lessons: [
          { title: 'كيف تكتشف فرصة حقيقية', duration: 660, isFreePreview: true },
          { title: 'اختبار الفكرة قبل الاستثمار', duration: 840 },
          { title: 'نموذج العمل التجاري', duration: 900 },
        ],
      },
      {
        title: 'التسعير والدخل',
        lessons: [
          { title: 'كيف تسعّر خدماتك بثقة', duration: 780 },
          { title: 'مصادر دخل متعددة', duration: 720 },
          { title: 'التفاوض وإغلاق الصفقات', duration: 900 },
        ],
      },
    ],
    faqs: [
      { question: 'هل الدورة نظرية؟', answer: 'لا، كل درس ينتهي بخطوة تطبيقية على مشروعك أنت.' },
    ],
  },
  {
    slug: 'video-editing',
    title: { ar: 'مونتاج الفيديو للسوشيال ميديا', en: 'Video Editing for Social Media' },
    description: {
      ar: 'اصنع مقاطع فيديو احترافية تجذب المشاهدات. مهارة مطلوبة بشدة للعمل الحر والمحتوى.',
      en: 'Create professional videos that attract views. A highly demanded skill for freelancing and content.',
    },
    category: 'التصميم',
    instructorName: 'ليث خالد',
    instructorBio: 'محرّر فيديو وصانع محتوى بصري.',
    price: 340,
    status: 'coming_soon',
    accessBufferWeeks: 2,
    waitlistEnabled: true,
    curriculum: [
      {
        title: 'المقدمة',
        lessons: [{ title: 'نظرة عامة على الدورة', duration: 420, isFreePreview: true }],
      },
    ],
    faqs: [{ question: 'متى تُطلق الدورة؟', answer: 'قريباً، سجّل في قائمة الانتظار لتصلك أول إشعار.' }],
  },
];

/** Sample students (password for all: Student@123). */
export const SEED_STUDENTS = [
  { name: 'يوسف عابد', email: 'yousef@example.com', phone: '+970591000001', city: 'الخليل' },
  { name: 'مريم صالح', email: 'mariam@example.com', phone: '+970591000002', city: 'رام الله' },
  { name: 'خالد نصار', email: 'khaled@example.com', phone: '+970591000003', city: 'نابلس' },
  { name: 'رنا حدّاد', email: 'rana@example.com', phone: '+962790000004', city: 'عمّان' },
  { name: 'عمر شاهين', email: 'omar@example.com', phone: '+970591000005', city: 'بيت لحم' },
];

/** Marketing offers / coupons. */
export const SEED_OFFERS = [
  {
    type: 'coupon' as const,
    name: 'خصم الإطلاق',
    description: 'خصم 15% على جميع الدورات بمناسبة إطلاق الأكاديمية',
    code: 'LAUNCH15',
    discountType: 'percent' as const,
    discountValue: 15,
    isActive: true,
  },
  {
    type: 'coupon' as const,
    name: 'خصم ثابت 50 شيكل',
    description: 'خصم 50 شيكل على الدورات المميزة',
    code: 'SAVE50',
    discountType: 'fixed' as const,
    discountValue: 50,
    isActive: true,
  },
  {
    type: 'earlybird' as const,
    name: 'المسجّلون الأوائل',
    description: 'خصم 20% لأول 20 مسجّل في كل دورة',
    code: 'EARLY20',
    discountType: 'percent' as const,
    discountValue: 20,
    usageLimit: 20,
    isActive: true,
  },
  {
    type: 'group' as const,
    name: 'خصم المجموعات',
    description: 'سجّل مع صديقين واحصلوا على خصم 25%',
    discountType: 'percent' as const,
    discountValue: 25,
    conditions: { minEnrollments: 3 },
    isActive: true,
  },
];
