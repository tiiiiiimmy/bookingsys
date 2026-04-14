export const PUBLIC_LANGUAGE_STORAGE_KEY = 'public-site-language';

export const LANGUAGES = [
  { code: 'zh-CN', label: '简' },
  { code: 'zh-TW', label: '繁' },
  { code: 'en', label: 'EN' },
];

export const HOME_LOAD_ERROR = '__LOAD_SERVICES_ERROR__';

export const HOME_COPY = {
  'zh-CN': {
    brand: '静谧的庇护所',
    nav: {
      services: '服务',
      process: '流程',
      about: '关于',
      bookNow: '立即预约',
      openMenu: '打开菜单',
      closeMenu: '关闭菜单',
    },
    hero: {
      title: '静谧的庇护所',
      subtitle: '身心专业按摩体验',
      description: '让身心在触碰之间，重新找回宁静、松弛与平衡。',
      bookNow: '立即预约',
      explore: '探索服务',
      heroAlt: '高端按摩疗愈空间',
    },
    about: {
      title1: '专业放松',
      desc1: '以细致手法针对不同疲劳来源，帮助舒缓肌肉紧张与日常压力。',
      title2: '静谧疗愈环境',
      desc2: '在香氛、光线与柔和氛围中放慢节奏，给自己一段真正安静的恢复时间。',
      title3: '安全在线支付',
      desc3: '通过 Stripe 加密支付流程，预约与付款更顺畅也更安心。',
    },
    services: {
      heading: '精选疗程',
      loading: '正在加载疗程…',
      empty: '当前没有可预约的疗程，你仍可进入预约页查看最新状态。',
      goBooking: '前往预约',
      bookNow: '立即预约',
      defaultDescription: '专业疗程，可依你的需求调整力度与重点区域。',
      durationLabel: '分钟',
      subtitleFallback: '疗程',
    },
    process: {
      heading: '预约流程',
      subheading: '简单四步，开启你的舒压之旅',
      paymentHint: '付款成功后预约才会正式生效',
      steps: [
        {
          title: '选择服务',
          subtitle: 'Select Service',
          description: '挑选最适合你当前状态的疗程项目。',
        },
        {
          title: '选择时间',
          subtitle: 'Select Time',
          description: '查看即时空档，预约你的专属时段。',
        },
        {
          title: '填写资料',
          subtitle: 'Fill Info',
          description: '提供基础联络信息，方便我们为你做好准备。',
        },
        {
          title: '支付确认',
          subtitle: 'Payment Confirmation',
          description: '完成安全在线支付，预约即可正式确认。',
        },
      ],
    },
    payment: {
      heading: '安全在线支付',
      description: '我们使用 Stripe 提供行业领先的支付保护。支持主流银行卡及设备可用时显示的快捷支付方式，交易数据全程加密。',
    },
    info: {
      heading: '营业信息',
      hoursTitle: '营业时间',
      hoursLine1: '每周四与周日',
      hoursLine2: '上午 9:00 - 下午 5:00',
      locationTitle: '地点',
      locationLine1: '静谧市区疗愈中心',
      locationLine2: '预约完成后将发送详细导航指南',
      policiesTitle: '服务守则',
      policies: [
        {
          label: '改期政策：',
          text: '请至少于预约时间 24 小时前提出。Rescheduling requires 24h notice.',
        },
        {
          label: '退款须知：',
          text: '预约取消需经人工审核，退款将原路退回。Manual refund review required.',
        },
        {
          label: '迟到处理：',
          text: '迟到将依比例缩短疗程时间，以保障后续客人的预约安排。Late arrivals result in shortened treatment time.',
        },
      ],
    },
    cta: {
      title: '开始你的疗愈之旅',
      subtitle: 'Start Your Healing Journey',
      button: '立即预约',
    },
    footer: {
      rights: '版权所有',
      hours: '营业时间',
      payments: '支付方式',
      contact: '联系我们',
      refund: '退款政策',
    },
    errors: {
      loadServices: '无法加载疗程项目',
    },
  },
  'zh-TW': {
    brand: '靜謐的庇護所',
    nav: {
      services: '服務',
      process: '流程',
      about: '關於',
      bookNow: '立即預約',
      openMenu: '開啟選單',
      closeMenu: '關閉選單',
    },
    hero: {
      title: '靜謐的庇護所',
      subtitle: '身心專業按摩體驗',
      description: '讓身心在觸碰之間，重新找回寧靜、鬆弛與平衡。',
      bookNow: '立即預約',
      explore: '探索服務',
      heroAlt: '高端按摩療癒空間',
    },
    about: {
      title1: '專業放鬆',
      desc1: '以細緻手法針對不同疲勞來源，幫助舒緩肌肉緊繃與日常壓力。',
      title2: '幽靜療癒環境',
      desc2: '在香氛、光線與柔和氛圍中放慢節奏，給自己一段真正安靜的恢復時間。',
      title3: '安全在線支付',
      desc3: '透過 Stripe 加密支付流程，預約與付款更流暢也更安心。',
    },
    services: {
      heading: '精選療程',
      loading: '正在載入療程…',
      empty: '目前沒有可預約的療程，您仍可進入預約頁查看最新狀態。',
      goBooking: '前往預約',
      bookNow: '立即預約',
      defaultDescription: '專業療程，可依您的需求調整力度與重點區域。',
      durationLabel: '分鐘',
      subtitleFallback: '療程',
    },
    process: {
      heading: '預約流程',
      subheading: '簡單四步，開啟您的舒壓之旅',
      paymentHint: '付款成功後預約才會正式生效',
      steps: [
        {
          title: '選擇服務',
          subtitle: 'Select Service',
          description: '挑選最適合您目前狀態的療程項目。',
        },
        {
          title: '選擇時間',
          subtitle: 'Select Time',
          description: '查看即時空檔，預約您的專屬時段。',
        },
        {
          title: '填寫資料',
          subtitle: 'Fill Info',
          description: '提供基本聯繫資訊，方便我們為您做好準備。',
        },
        {
          title: '支付確認',
          subtitle: 'Payment Confirmation',
          description: '完成安全在線支付，預約即可正式確認。',
        },
      ],
    },
    payment: {
      heading: '安全在線支付',
      description: '我們使用 Stripe 提供業界領先的支付保護。支援主流銀行卡及裝置可用時顯示的快捷支付方式，交易資料全程加密。',
    },
    info: {
      heading: '營業資訊',
      hoursTitle: '營業時間',
      hoursLine1: '每週四與週日',
      hoursLine2: '上午 9:00 - 下午 5:00',
      locationTitle: '地點',
      locationLine1: '靜謐市區療癒中心',
      locationLine2: '預約完成後將發送詳細導航指南',
      policiesTitle: '服務守則',
      policies: [
        {
          label: '改期政策：',
          text: '請至少於預約時間 24 小時前提出。Rescheduling requires 24h notice.',
        },
        {
          label: '退款須知：',
          text: '預約取消需經人工審核，退款將原路退回。Manual refund review required.',
        },
        {
          label: '遲到處理：',
          text: '遲到將依比例縮短療程時間，以保障後續客人的預約安排。Late arrivals result in shortened treatment time.',
        },
      ],
    },
    cta: {
      title: '開始您的療癒之旅',
      subtitle: 'Start Your Healing Journey',
      button: '立即預約',
    },
    footer: {
      rights: '版權所有',
      hours: '營業時間',
      payments: '支付方式',
      contact: '聯絡我們',
      refund: '退款政策',
    },
    errors: {
      loadServices: '無法載入療程項目',
    },
  },
  en: {
    brand: 'Haptic Sanctuary',
    nav: {
      services: 'Services',
      process: 'Process',
      about: 'About',
      bookNow: 'Book Now',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
    },
    hero: {
      title: 'Haptic Sanctuary',
      subtitle: 'Professional Massage for Body and Mind',
      description: 'Restore calm, softness, and balance through a massage experience designed to help both body and mind unwind.',
      bookNow: 'Book Now',
      explore: 'Explore Services',
      heroAlt: 'Luxury massage and wellness environment',
    },
    about: {
      title1: 'Professional Relaxation',
      desc1: 'Thoughtful bodywork tailored to different sources of tension, stress, and physical fatigue.',
      title2: 'Healing Environment',
      desc2: 'Slow down in a space shaped by soft light, gentle scent, and a calm restorative mood.',
      title3: 'Secure Payment',
      desc3: 'Enjoy a smoother booking journey with Stripe-secured checkout and clear confirmation steps.',
    },
    services: {
      heading: 'Signature Treatments',
      loading: 'Loading treatments...',
      empty: 'There are no bookable treatments at the moment, but you can still open the booking page for the latest availability.',
      goBooking: 'Go to Booking',
      bookNow: 'Book Now',
      defaultDescription: 'A tailored treatment adjusted to your pressure preference and focus areas.',
      durationLabel: 'mins',
      subtitleFallback: 'Treatment',
    },
    process: {
      heading: 'Booking Process',
      subheading: 'A simple four-step journey into deep relaxation',
      paymentHint: 'Your booking is confirmed only after successful payment',
      steps: [
        {
          title: 'Choose Service',
          subtitle: 'Select Service',
          description: 'Pick the treatment that best matches your body’s current needs.',
        },
        {
          title: 'Select Time',
          subtitle: 'Select Time',
          description: 'View real-time availability and reserve the timeslot that suits you.',
        },
        {
          title: 'Fill Details',
          subtitle: 'Fill Info',
          description: 'Provide your basic contact details so we can prepare for your visit.',
        },
        {
          title: 'Pay to Confirm',
          subtitle: 'Payment Confirmation',
          description: 'Complete secure online payment to lock in your session.',
        },
      ],
    },
    payment: {
      heading: 'Secure Online Payment',
      description: 'We use Stripe for industry-standard payment protection. Major cards are supported, and fast checkout options may appear when available on your device.',
    },
    info: {
      heading: 'Hours & Location',
      hoursTitle: 'Hours',
      hoursLine1: 'Every Thursday & Sunday',
      hoursLine2: '9:00 AM - 5:00 PM',
      locationTitle: 'Location',
      locationLine1: 'City Sanctuary Wellness Studio',
      locationLine2: 'Detailed directions are shared after booking confirmation',
      policiesTitle: 'Policies',
      policies: [
        {
          label: 'Rescheduling:',
          text: 'Please submit your request at least 24 hours before the appointment time.',
        },
        {
          label: 'Refunds:',
          text: 'Cancellations require manual review, and approved refunds are returned to the original payment method.',
        },
        {
          label: 'Late arrivals:',
          text: 'Treatment time may be shortened proportionally to protect later appointments.',
        },
      ],
    },
    cta: {
      title: 'Start Your Healing Journey',
      subtitle: 'Your next reset can begin today',
      button: 'Book Now',
    },
    footer: {
      rights: 'All rights reserved',
      hours: 'Hours',
      payments: 'Payments',
      contact: 'Contact',
      refund: 'Refund Policy',
    },
    errors: {
      loadServices: 'Unable to load treatments',
    },
  },
};

export const SERVICE_TRANSLATIONS = {
  'Deep Tissue': {
    'zh-CN': {
      title: '深层组织按摩',
      subtitle: 'Deep Tissue',
      description: '针对肌肉深层压力，帮助缓解慢性疼痛与僵硬，重建身体活力。',
    },
    'zh-TW': {
      title: '深層組織按摩',
      subtitle: 'Deep Tissue',
      description: '針對肌肉底層壓力，緩解慢性疼痛與僵硬，重建身體活力。',
    },
    en: {
      title: 'Deep Tissue Massage',
      subtitle: 'Deep Tissue',
      description: 'Targets deeper muscular tension to ease chronic tightness, soreness, and built-up strain.',
    },
  },
  'Swedish Aroma': {
    'zh-CN': {
      title: '瑞典香氛疗愈',
      subtitle: 'Swedish Aroma',
      description: '结合天然精油与温和手法，促进循环，让身体与情绪都重新轻盈起来。',
    },
    'zh-TW': {
      title: '瑞典香氛療癒',
      subtitle: 'Swedish Aroma',
      description: '結合天然精油與溫和手法，促進循環，讓身體與情緒都重新輕盈起來。',
    },
    en: {
      title: 'Swedish Aromatherapy',
      subtitle: 'Swedish Aroma',
      description: 'Blends essential oils with flowing Swedish strokes for a lighter, more balanced full-body reset.',
    },
  },
  'Hot Stone': {
    'zh-CN': {
      title: '热石能量引导',
      subtitle: 'Hot Stone',
      description: '运用温热石材温暖身体核心，深度释放韧带与肌群中的累积紧绷。',
    },
    'zh-TW': {
      title: '熱石能量引導',
      subtitle: 'Hot Stone',
      description: '運用溫熱石材溫暖身體核心，深度釋放韌帶與肌群中的累積緊繃。',
    },
    en: {
      title: 'Hot Stone Therapy',
      subtitle: 'Hot Stone',
      description: 'Uses warmed volcanic stones to soften deep tension and create a grounded, soothing body experience.',
    },
  },
  'Focus Release': {
    'zh-CN': {
      title: '头肩颈释压',
      subtitle: 'Focus Release',
      description: '为久坐与高压力人群设计，快速缓解头部、肩部与颈部的不适与沉重感。',
    },
    'zh-TW': {
      title: '頭肩頸釋壓',
      subtitle: 'Focus Release',
      description: '為久坐與高壓力人群設計，快速緩解頭部、肩部與頸部的不適與沉重感。',
    },
    en: {
      title: 'Head, Neck & Shoulder Relief',
      subtitle: 'Focus Release',
      description: 'Designed for desk-bound tension, helping quickly release heaviness around the head, neck, and shoulders.',
    },
  },
};

export const BOOKING_FLOW_COPY = {
  'zh-CN': {
    nav: {
      home: '首页',
      booking: '预约',
      manage: '改期管理',
      bookNow: '立即预约',
    },
    footer: HOME_COPY['zh-CN'].footer,
    booking: {
      heroTag: '预约流程',
      title: '预约你的疗愈时段',
      description: '沿用 landing page 的沉静体验，在同一套风格中完成服务选择、时段确认与安全支付。',
      progressTitle: '预约步骤',
      steps: ['选择项目与时间', '填写信息', '完成支付'],
      cards: {
        service: '按摩项目',
        serviceSelected: '已选项目',
        availability: '本周可预约时间',
        selectedSlots: '已选择的时间段',
        summary: '当前选择',
        contact: '联系信息',
        payment: '支付确认',
        paymentSummary: '订单摘要',
      },
      hints: {
        durationWindow: '当前按 {duration} 分钟完整疗程展示时间段，只有可连续预约完整时长的时段才会显示。',
        payment: '支付成功后，预约才会正式确认。当前显示的时段均可完整预约你选择的按摩时长。',
        multiSlot: '已选择 {count} 个时段（可跨天）',
      },
      actions: {
        next: '下一步',
        backToTime: '返回修改时间',
        backToInfo: '返回修改',
        toPayment: '前往支付',
        creating: '创建中...',
        payNow: '确认支付',
        paying: '支付处理中...',
        previousWeek: '上一周',
        nextWeek: '下一周',
        returnHome: '返回首页',
      },
      labels: {
        item: '项目',
        duration: '时长',
        time: '时间',
        amount: '金额',
        slotCount: '时段数',
        totalPrice: '总价',
        firstName: '名字',
        lastName: '姓氏',
        email: '邮箱',
        phone: '电话',
        notes: '备注',
      },
      placeholders: {
        notes: '可填写希望重点放松的部位或其他说明',
      },
      empty: {
        chooseService: '先选择按摩项目',
        noSlots: '暂无可完整预约 {duration} 分钟的空档',
      },
      loading: {
        services: '正在加载服务项目...',
        weeklySlots: '正在加载本周空余时间...',
      },
      errors: {
        loadServices: '无法加载服务类型，请刷新页面重试',
        loadSlots: '无法加载本周可预约时间',
        createBooking: '创建预约失败，请重试',
        chooseServiceAndTime: '请选择按摩项目和预约时间',
        paymentFailed: '支付失败，请重试',
      },
      aria: {
        removeSlot: '删除 {date} {time} 时段',
      },
    },
    confirmation: {
      heroTag: '预约状态',
      loading: '加载中...',
      notFound: '预约不存在',
      title: {
        pending: '预约处理中',
        confirmed: '预约已确认',
        expired: '预约已过期',
        paymentFailed: '支付未完成',
        cancelled: '预约已取消',
      },
      message: {
        syncing: '我们正在同步支付和预约状态。',
        confirmed: '支付成功，预约已经正式确认。',
        expired: '预约保留已超时，请重新选择时间并完成支付。',
        paymentFailed: '支付未成功完成，预约暂未确认。',
        cancelled: '该预约目前处于已取消状态。',
        pending: '支付完成后，系统会自动确认预约。',
      },
      cards: {
        bookingDetails: '预约详情',
        contact: '联系信息',
        nextSteps: '下一步',
      },
      labels: {
        bookingId: '预约编号',
        service: '服务项目',
        duration: '服务时长',
        time: '预约时间',
        price: '价格',
        status: '预约状态',
        paymentStatus: '支付状态',
        reservedUntil: '保留到',
        name: '姓名',
        email: '邮箱',
        phone: '电话',
        notes: '备注',
      },
      steps: [
        '支付成功后，系统会自动确认预约并发送邮件。',
        '如果预约仍显示处理中，请稍候几秒后刷新本页。',
        '如需取消，请直接联系客服；如需改期，请使用邮件中的管理链接。',
      ],
      actions: {
        returnHome: '返回首页',
        rebook: '重新预约',
      },
      errors: {
        loadBooking: '无法加载预约信息',
      },
    },
    manage: {
      heroTag: '预约管理',
      title: '提交改期申请',
      description: '在与 landing page 一致的预约体验中，查看当前预约并提交新的时段申请。',
      cards: {
        currentBooking: '当前预约',
        instructions: '改期说明',
        availableSlots: '可改期时间',
        history: '历史改期申请',
      },
      labels: {
        customer: '客户',
        service: '服务',
        duration: '时长',
        time: '时间',
        status: '状态',
        paymentStatus: '支付状态',
        supportEmail: '支持邮箱',
        newDate: '选择新的日期',
        note: '申请备注',
      },
      instructions: '本页面仅支持提交改期申请，预约取消请直接联系客服。',
      placeholders: {
        note: '可补充说明为什么希望调整时间',
      },
      actions: {
        submit: '提交改期申请',
        returnHome: '返回首页',
      },
      messages: {
        submitted: '改期申请已提交，请等待管理员审核。',
      },
      empty: {
        noSlots: '当天没有可用时间',
        noHistory: '暂无改期申请记录。',
        noNote: '无客户备注',
      },
      loading: {
        page: '加载中...',
        slots: '加载中...',
      },
      errors: {
        loadBooking: '无法加载预约信息',
        loadSlots: '无法加载可改期时间',
        chooseSlot: '请选择新的预约时间',
        submit: '提交改期申请失败',
      },
    },
    status: {
      booking: {
        pending: '待支付确认',
        confirmed: '已确认',
        cancelled: '已取消',
        completed: '已完成',
        no_show: '未到店',
        expired: '已过期',
      },
      payment: {
        pending: '待支付',
        failed: '支付失败',
        succeeded: '支付成功',
        refunded: '已退款',
        partially_refunded: '部分退款',
      },
      request: {
        pending: '待处理',
        approved: '已通过',
        rejected: '已拒绝',
      },
    },
  },
  'zh-TW': {
    nav: {
      home: '首頁',
      booking: '預約',
      manage: '改期管理',
      bookNow: '立即預約',
    },
    footer: HOME_COPY['zh-TW'].footer,
    booking: {
      heroTag: '預約流程',
      title: '預約您的療癒時段',
      description: '沿用 landing page 的沉靜體驗，在同一套風格中完成服務選擇、時段確認與安全支付。',
      progressTitle: '預約步驟',
      steps: ['選擇項目與時間', '填寫資訊', '完成支付'],
      cards: {
        service: '按摩項目',
        serviceSelected: '已選項目',
        availability: '本週可預約時間',
        selectedSlots: '已選擇的時間段',
        summary: '目前選擇',
        contact: '聯絡資訊',
        payment: '支付確認',
        paymentSummary: '訂單摘要',
      },
      hints: {
        durationWindow: '目前按 {duration} 分鐘完整療程顯示時段，只有可連續預約完整時長的時段才會顯示。',
        payment: '支付成功後，預約才會正式確認。目前顯示的時段皆可完整預約您選擇的按摩時長。',
        multiSlot: '已選擇 {count} 個時段（可跨天）',
      },
      actions: {
        next: '下一步',
        backToTime: '返回修改時間',
        backToInfo: '返回修改',
        toPayment: '前往支付',
        creating: '建立中...',
        payNow: '確認支付',
        paying: '支付處理中...',
        previousWeek: '上一週',
        nextWeek: '下一週',
        returnHome: '返回首頁',
      },
      labels: {
        item: '項目',
        duration: '時長',
        time: '時間',
        amount: '金額',
        slotCount: '時段數',
        totalPrice: '總價',
        firstName: '名字',
        lastName: '姓氏',
        email: '電子郵件',
        phone: '電話',
        notes: '備註',
      },
      placeholders: {
        notes: '可填寫希望重點放鬆的部位或其他說明',
      },
      empty: {
        chooseService: '請先選擇按摩項目',
        noSlots: '暫無可完整預約 {duration} 分鐘的空檔',
      },
      loading: {
        services: '正在載入服務項目...',
        weeklySlots: '正在載入本週空餘時間...',
      },
      errors: {
        loadServices: '無法載入服務類型，請重新整理頁面後再試',
        loadSlots: '無法載入本週可預約時間',
        createBooking: '建立預約失敗，請稍後再試',
        chooseServiceAndTime: '請選擇按摩項目與預約時間',
        paymentFailed: '支付失敗，請再試一次',
      },
      aria: {
        removeSlot: '刪除 {date} {time} 時段',
      },
    },
    confirmation: {
      heroTag: '預約狀態',
      loading: '載入中...',
      notFound: '預約不存在',
      title: {
        pending: '預約處理中',
        confirmed: '預約已確認',
        expired: '預約已過期',
        paymentFailed: '支付未完成',
        cancelled: '預約已取消',
      },
      message: {
        syncing: '我們正在同步支付與預約狀態。',
        confirmed: '支付成功，預約已正式確認。',
        expired: '預約保留已逾時，請重新選擇時間並完成支付。',
        paymentFailed: '支付尚未成功完成，預約尚未確認。',
        cancelled: '此預約目前為已取消狀態。',
        pending: '支付完成後，系統會自動確認預約。',
      },
      cards: {
        bookingDetails: '預約詳情',
        contact: '聯絡資訊',
        nextSteps: '下一步',
      },
      labels: {
        bookingId: '預約編號',
        service: '服務項目',
        duration: '服務時長',
        time: '預約時間',
        price: '價格',
        status: '預約狀態',
        paymentStatus: '支付狀態',
        reservedUntil: '保留到',
        name: '姓名',
        email: '電子郵件',
        phone: '電話',
        notes: '備註',
      },
      steps: [
        '支付成功後，系統會自動確認預約並寄送通知郵件。',
        '若頁面仍顯示處理中，請稍候幾秒再重新整理。',
        '如需取消請直接聯絡客服；如需改期請使用郵件中的管理連結。',
      ],
      actions: {
        returnHome: '返回首頁',
        rebook: '重新預約',
      },
      errors: {
        loadBooking: '無法載入預約資訊',
      },
    },
    manage: {
      heroTag: '預約管理',
      title: '提交改期申請',
      description: '在與 landing page 一致的預約體驗中，查看目前預約並提交新的時段申請。',
      cards: {
        currentBooking: '目前預約',
        instructions: '改期說明',
        availableSlots: '可改期時間',
        history: '歷史改期申請',
      },
      labels: {
        customer: '客戶',
        service: '服務',
        duration: '時長',
        time: '時間',
        status: '狀態',
        paymentStatus: '支付狀態',
        supportEmail: '支援信箱',
        newDate: '選擇新的日期',
        note: '申請備註',
      },
      instructions: '本頁面僅支援提交改期申請，預約取消請直接聯絡客服。',
      placeholders: {
        note: '可補充說明為什麼希望調整時間',
      },
      actions: {
        submit: '提交改期申請',
        returnHome: '返回首頁',
      },
      messages: {
        submitted: '改期申請已提交，請等待管理員審核。',
      },
      empty: {
        noSlots: '當天沒有可用時間',
        noHistory: '暫無改期申請記錄。',
        noNote: '無客戶備註',
      },
      loading: {
        page: '載入中...',
        slots: '載入中...',
      },
      errors: {
        loadBooking: '無法載入預約資訊',
        loadSlots: '無法載入可改期時間',
        chooseSlot: '請選擇新的預約時間',
        submit: '提交改期申請失敗',
      },
    },
    status: {
      booking: {
        pending: '待支付確認',
        confirmed: '已確認',
        cancelled: '已取消',
        completed: '已完成',
        no_show: '未到店',
        expired: '已過期',
      },
      payment: {
        pending: '待支付',
        failed: '支付失敗',
        succeeded: '支付成功',
        refunded: '已退款',
        partially_refunded: '部分退款',
      },
      request: {
        pending: '待處理',
        approved: '已通過',
        rejected: '已拒絕',
      },
    },
  },
  en: {
    nav: {
      home: 'Home',
      booking: 'Booking',
      manage: 'Manage',
      bookNow: 'Book Now',
    },
    footer: HOME_COPY.en.footer,
    booking: {
      heroTag: 'Booking Flow',
      title: 'Reserve Your Restorative Session',
      description: 'Move from service selection to payment inside the same calm visual language as the landing page.',
      progressTitle: 'Booking Steps',
      steps: ['Choose service & time', 'Fill details', 'Confirm payment'],
      cards: {
        service: 'Treatments',
        serviceSelected: 'Selected',
        availability: 'Available this week',
        selectedSlots: 'Selected timeslots',
        summary: 'Current selection',
        contact: 'Contact details',
        payment: 'Payment confirmation',
        paymentSummary: 'Order summary',
      },
      hints: {
        durationWindow: 'Slots are shown in {duration}-minute treatment windows, so only fully bookable sessions appear.',
        payment: 'Your booking is only confirmed after successful payment. Every visible slot can accommodate the full duration you selected.',
        multiSlot: '{count} slots selected across one or more days',
      },
      actions: {
        next: 'Next',
        backToTime: 'Back to time selection',
        backToInfo: 'Back to edit',
        toPayment: 'Continue to payment',
        creating: 'Creating...',
        payNow: 'Confirm payment',
        paying: 'Processing payment...',
        previousWeek: 'Previous week',
        nextWeek: 'Next week',
        returnHome: 'Return home',
      },
      labels: {
        item: 'Treatment',
        duration: 'Duration',
        time: 'Time',
        amount: 'Amount',
        slotCount: 'Timeslots',
        totalPrice: 'Total',
        firstName: 'First name',
        lastName: 'Last name',
        email: 'Email',
        phone: 'Phone',
        notes: 'Notes',
      },
      placeholders: {
        notes: 'Share focus areas or anything you would like us to know',
      },
      empty: {
        chooseService: 'Choose a treatment first',
        noSlots: 'No fully bookable {duration}-minute sessions are available on this day',
      },
      loading: {
        services: 'Loading treatments...',
        weeklySlots: 'Loading this week’s availability...',
      },
      errors: {
        loadServices: 'Unable to load treatments. Please refresh and try again.',
        loadSlots: 'Unable to load weekly availability.',
        createBooking: 'Unable to create the booking. Please try again.',
        chooseServiceAndTime: 'Please choose a treatment and at least one timeslot.',
        paymentFailed: 'Payment failed. Please try again.',
      },
      aria: {
        removeSlot: 'Remove {date} {time}',
      },
    },
    confirmation: {
      heroTag: 'Booking Status',
      loading: 'Loading...',
      notFound: 'Booking not found',
      title: {
        pending: 'Booking in progress',
        confirmed: 'Booking confirmed',
        expired: 'Booking expired',
        paymentFailed: 'Payment incomplete',
        cancelled: 'Booking cancelled',
      },
      message: {
        syncing: 'We are syncing your payment and booking status.',
        confirmed: 'Payment succeeded and your booking is now fully confirmed.',
        expired: 'The booking hold expired. Please choose a new time and complete payment again.',
        paymentFailed: 'Payment did not complete successfully, so the booking is not confirmed yet.',
        cancelled: 'This booking is currently cancelled.',
        pending: 'Once payment clears, the booking will confirm automatically.',
      },
      cards: {
        bookingDetails: 'Booking details',
        contact: 'Contact details',
        nextSteps: 'What happens next',
      },
      labels: {
        bookingId: 'Booking ID',
        service: 'Treatment',
        duration: 'Duration',
        time: 'Appointment time',
        price: 'Price',
        status: 'Booking status',
        paymentStatus: 'Payment status',
        reservedUntil: 'Held until',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        notes: 'Notes',
      },
      steps: [
        'After payment succeeds, the system confirms the booking and sends an email.',
        'If the page still shows pending, wait a few seconds and refresh.',
        'For cancellations, please contact support directly. For rescheduling, use the management link from your email.',
      ],
      actions: {
        returnHome: 'Return home',
        rebook: 'Book again',
      },
      errors: {
        loadBooking: 'Unable to load booking details.',
      },
    },
    manage: {
      heroTag: 'Booking Management',
      title: 'Submit a Reschedule Request',
      description: 'Review your current booking and request a new timeslot inside the same polished public experience.',
      cards: {
        currentBooking: 'Current booking',
        instructions: 'Rescheduling policy',
        availableSlots: 'Available reschedule times',
        history: 'Previous reschedule requests',
      },
      labels: {
        customer: 'Customer',
        service: 'Treatment',
        duration: 'Duration',
        time: 'Time',
        status: 'Status',
        paymentStatus: 'Payment status',
        supportEmail: 'Support email',
        newDate: 'Choose a new date',
        note: 'Request note',
      },
      instructions: 'This page only supports reschedule requests. For cancellations, please contact support directly.',
      placeholders: {
        note: 'Add any context about why you would like to move the session',
      },
      actions: {
        submit: 'Submit reschedule request',
        returnHome: 'Return home',
      },
      messages: {
        submitted: 'Your reschedule request has been sent. Please wait for admin review.',
      },
      empty: {
        noSlots: 'No available times on this date',
        noHistory: 'There are no previous reschedule requests.',
        noNote: 'No customer note',
      },
      loading: {
        page: 'Loading...',
        slots: 'Loading...',
      },
      errors: {
        loadBooking: 'Unable to load booking details.',
        loadSlots: 'Unable to load reschedule availability.',
        chooseSlot: 'Please choose a new appointment time.',
        submit: 'Unable to submit the reschedule request.',
      },
    },
    status: {
      booking: {
        pending: 'Pending payment confirmation',
        confirmed: 'Confirmed',
        cancelled: 'Cancelled',
        completed: 'Completed',
        no_show: 'No-show',
        expired: 'Expired',
      },
      payment: {
        pending: 'Pending',
        failed: 'Failed',
        succeeded: 'Succeeded',
        refunded: 'Refunded',
        partially_refunded: 'Partially refunded',
      },
      request: {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
      },
    },
  },
};

export const getLocalizedServiceContent = (service, language, fallbackDescription) => {
  const matched = SERVICE_TRANSLATIONS[service?.name]?.[language];

  if (matched) {
    return matched;
  }

  const fallbackTitle = language === 'en'
    ? service?.name || 'Treatment'
    : service?.name_zh || service?.name || '疗程';

  return {
    title: fallbackTitle,
    subtitle: service?.name || fallbackTitle,
    description: service?.description || fallbackDescription,
  };
};
