// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Urdu (`ur`).
class AppLocalizationsUr extends AppLocalizations {
  AppLocalizationsUr([String locale = 'ur']) : super(locale);

  @override
  String get appName => 'ہینڈی گو';

  @override
  String get workerPortal => 'ورکر پورٹل';

  @override
  String get appTitle => 'ہینڈی گو - ورکر';

  @override
  String get onboardingTitle1 => 'بہترین کام تلاش کریں';

  @override
  String get onboardingDesc1 =>
      'ان صارفین سے جوڑیں جنہیں آپ کی مہارت کی ضرورت ہے۔ اپنے شیڈول کے مطابق کام قبول کریں۔';

  @override
  String get onboardingTitle2 => 'زیادہ کمائیں';

  @override
  String get onboardingDesc2 =>
      'اپنی شرحیں خود مقرر کریں اور اپنی ساکھ بنائیں۔ زیادہ کام، زیادہ کمائی!';

  @override
  String get onboardingTitle3 => 'محفوظ اور مامون';

  @override
  String get onboardingDesc3 =>
      'تصدیق شدہ صارفین کے ساتھ کام کریں۔ ہمارا SOS فیچر آپ کو ہمیشہ محفوظ رکھتا ہے۔';

  @override
  String get skip => 'چھوڑیں';

  @override
  String get getStarted => 'شروع کریں';

  @override
  String get next => 'اگلا';

  @override
  String get alreadyHaveAccount => 'پہلے سے اکاؤنٹ ہے؟ ';

  @override
  String get login => 'لاگ ان';

  @override
  String get signUp => 'سائن اپ';

  @override
  String get enterYourEmail => 'اپنا ای میل درج کریں';

  @override
  String get emailOtpDescription =>
      'ہم آپ کی ای میل کی تصدیق کے لیے OTP بھیجیں گے';

  @override
  String get emailAddress => 'ای میل ایڈریس';

  @override
  String get emailHint => 'you@example.com';

  @override
  String get pleaseEnterEmail => 'براہ کرم اپنا ای میل درج کریں';

  @override
  String get pleaseEnterValidEmail =>
      'براہ کرم ایک درست ای میل ایڈریس درج کریں';

  @override
  String get emailActiveNote =>
      'یقینی بنائیں کہ یہ ای میل ایکٹو ہے۔ ہم تصدیق کے لیے 6 ہندسوں کا OTP بھیجیں گے۔';

  @override
  String get continueButton => 'جاری رکھیں';

  @override
  String get byContinuingAgree => 'جاری رکھ کر، آپ ہماری ';

  @override
  String get termsOfService => 'سروس کی شرائط';

  @override
  String get privacyPolicy => 'رازداری کی پالیسی';

  @override
  String get verification => 'تصدیق';

  @override
  String get verificationCode => 'تصدیقی کوڈ';

  @override
  String enterOtpSentTo(String email) {
    return '$email پر بھیجا گیا\n6 ہندسوں کا کوڈ درج کریں';
  }

  @override
  String resendCodeIn(int seconds) {
    return '$seconds سیکنڈ میں دوبارہ بھیجیں';
  }

  @override
  String get resendCode => 'کوڈ دوبارہ بھیجیں';

  @override
  String get verify => 'تصدیق کریں';

  @override
  String get welcomeBack => 'خوش آمدید!';

  @override
  String get loginToWorkerAccount => 'اپنے ورکر اکاؤنٹ میں لاگ ان کریں';

  @override
  String get password => 'پاس ورڈ';

  @override
  String get pleaseEnterPassword => 'براہ کرم اپنا پاس ورڈ درج کریں';

  @override
  String get pleaseEnterValidEmailShort => 'براہ کرم درست ای میل درج کریں';

  @override
  String get forgotPassword => 'پاس ورڈ بھول گئے؟';

  @override
  String get dontHaveAccount => 'اکاؤنٹ نہیں ہے؟ ';

  @override
  String get createAccount => 'اکاؤنٹ بنائیں';

  @override
  String get personalInformation => 'ذاتی معلومات';

  @override
  String get firstName => 'پہلا نام';

  @override
  String get lastName => 'آخری نام';

  @override
  String get phoneNumberOptional => 'فون نمبر (اختیاری)';

  @override
  String get cnicNumber => 'شناختی کارڈ نمبر';

  @override
  String get cnicHint => 'XXXXX-XXXXXXX-X';

  @override
  String get selectYourSkills => 'اپنی مہارتیں منتخب کریں';

  @override
  String get chooseSkillsDescription =>
      'وہ خدمات منتخب کریں جو آپ فراہم کر سکتے ہیں';

  @override
  String get plumbing => 'پلمبنگ';

  @override
  String get electrical => 'بجلی کا کام';

  @override
  String get cleaning => 'صفائی';

  @override
  String get acRepair => 'اے سی کی مرمت';

  @override
  String get carpenter => 'بڑھئی';

  @override
  String get painting => 'پینٹنگ';

  @override
  String get mechanic => 'مکینک';

  @override
  String get generalHandyman => 'جنرل ہینڈی مین';

  @override
  String get createPassword => 'پاس ورڈ بنائیں';

  @override
  String get confirmPassword => 'پاس ورڈ کی تصدیق';

  @override
  String get iAgreeToThe => 'میں متفق ہوں ';

  @override
  String get termsAndConditions => 'شرائط و ضوابط';

  @override
  String get pleaseSelectAtLeastOneSkill =>
      'براہ کرم کم از کم ایک مہارت منتخب کریں';

  @override
  String get pleaseAcceptTerms => 'براہ کرم شرائط و ضوابط قبول کریں';

  @override
  String get home => 'ہوم';

  @override
  String get jobs => 'ملازمتیں';

  @override
  String get earnings => 'آمدنی';

  @override
  String get profile => 'پروفائل';

  @override
  String helloName(String name) {
    return 'ہیلو، $name!';
  }

  @override
  String get available => 'دستیاب';

  @override
  String get offline => 'آف لائن';

  @override
  String get youAreOnline => 'آپ آن لائن ہیں';

  @override
  String get youAreOffline => 'آپ آف لائن ہیں';

  @override
  String get readyToReceiveJobs => 'کام کی درخواستیں وصول کرنے کے لیے تیار';

  @override
  String get toggleToStartReceiving => 'کام وصول کرنے کے لیے ٹوگل کریں';

  @override
  String get rating => 'ریٹنگ';

  @override
  String get jobsDone => 'مکمل کام';

  @override
  String get trust => 'اعتماد';

  @override
  String get activeJobs => 'فعال کام';

  @override
  String get viewAll => 'سب دیکھیں';

  @override
  String get availableJobs => 'دستیاب کام';

  @override
  String nJobs(int count) {
    return '$count کام';
  }

  @override
  String get noJobsAvailable => 'ابھی کوئی کام دستیاب نہیں';

  @override
  String get stayOnlineForJobs =>
      'نئے کام کی درخواستیں وصول کرنے کے لیے آن لائن رہیں';

  @override
  String get inProgressLabel => 'جاری';

  @override
  String get urgentLabel => 'فوری';

  @override
  String get failedToUpdateAvailability => 'دستیابی اپ ڈیٹ کرنے میں ناکامی';

  @override
  String get myJobs => 'میرے کام';

  @override
  String get all => 'تمام';

  @override
  String get pending => 'زیر التوا';

  @override
  String get accepted => 'قبول شدہ';

  @override
  String get inProgressFilter => 'جاری';

  @override
  String get completed => 'مکمل';

  @override
  String get cancelled => 'منسوخ';

  @override
  String noJobsFound(String status) {
    return 'کوئی $status کام نہیں ملا';
  }

  @override
  String get activeJob => 'فعال کام';

  @override
  String get bookingNotFound => 'بکنگ نہیں ملی';

  @override
  String get jobInProgress => 'کام جاری ہے';

  @override
  String get readyToStart => 'شروع کرنے کے لیے تیار';

  @override
  String get duration => 'دورانیہ';

  @override
  String get location => 'مقام';

  @override
  String get navigate => 'نیویگیٹ';

  @override
  String get problemDescription => 'مسئلے کی تفصیل';

  @override
  String get startJob => 'کام شروع کریں';

  @override
  String get completeJob => 'کام مکمل کریں';

  @override
  String get jobStarted => 'کام شروع ہو گیا!';

  @override
  String get failedToStartJob => 'کام شروع کرنے میں ناکامی';

  @override
  String get jobCompletedSuccessfully => 'کام کامیابی سے مکمل ہو گیا!';

  @override
  String get failedToCompleteJob => 'کام مکمل کرنے میں ناکامی';

  @override
  String get completeJobDialogTitle => 'کام مکمل کریں';

  @override
  String get enterFinalPricing => 'اس کام کی حتمی قیمت درج کریں:';

  @override
  String get finalPriceRs => 'حتمی قیمت (روپے)';

  @override
  String get materialsCostRs => 'مواد کی لاگت (روپے)';

  @override
  String get materialsHint => 'استعمال شدہ مواد کی لاگت';

  @override
  String get cancel => 'منسوخ';

  @override
  String get complete => 'مکمل';

  @override
  String get bookingDetails => 'بکنگ کی تفصیلات';

  @override
  String get urgentRequest => 'فوری درخواست';

  @override
  String get customer => 'صارف';

  @override
  String get getDirections => 'راستہ حاصل کریں';

  @override
  String get estimatedPricing => 'تخمینی قیمت';

  @override
  String get laborCost => 'مزدوری کی لاگت';

  @override
  String get estimatedDuration => 'تخمینی دورانیہ';

  @override
  String nMins(int count) {
    return '$count منٹ';
  }

  @override
  String get estimatedTotal => 'تخمینی کل';

  @override
  String get acceptJob => 'کام قبول کریں';

  @override
  String get reject => 'مسترد';

  @override
  String get failedToLoadBookingDetails =>
      'بکنگ کی تفصیلات لوڈ کرنے میں ناکامی';

  @override
  String get bookingAcceptedSuccessfully => 'بکنگ کامیابی سے قبول ہو گئی!';

  @override
  String get failedToAcceptBooking => 'بکنگ قبول کرنے میں ناکامی';

  @override
  String get bookingRejected => 'بکنگ مسترد کر دی گئی';

  @override
  String get failedToRejectBooking => 'بکنگ مسترد کرنے میں ناکامی';

  @override
  String get rejectBookingTitle => 'بکنگ مسترد کریں';

  @override
  String get provideReasonForRejection =>
      'براہ کرم اس کام کو مسترد کرنے کی وجہ بتائیں:';

  @override
  String get enterReason => 'وجہ درج کریں...';

  @override
  String get earningsTitle => 'آمدنی';

  @override
  String get totalEarnings => 'کل آمدنی';

  @override
  String nJobsCompleted(int count) {
    return '$count کام مکمل';
  }

  @override
  String get today => 'آج';

  @override
  String get thisWeek => 'اس ہفتے';

  @override
  String get thisMonth => 'اس مہینے';

  @override
  String get avgPerJob => 'فی کام اوسط';

  @override
  String get pendingEarnings => 'زیر التوا';

  @override
  String get recentTransactions => 'حالیہ لین دین';

  @override
  String get noTransactionsYet => 'ابھی تک کوئی لین دین نہیں';

  @override
  String get withdrawalComingSoon => 'کم از کم رقم نکلوانے کی حد 500 روپے ہے';

  @override
  String get withdrawToBank => 'بینک میں نکلوائیں';

  @override
  String get profileTitle => 'پروفائل';

  @override
  String get skills => 'مہارتیں';

  @override
  String get manage => 'انتظام';

  @override
  String get editProfile => 'پروفائل میں ترمیم';

  @override
  String get manageSkills => 'مہارتوں کا انتظام';

  @override
  String get documents => 'دستاویزات';

  @override
  String get notifications => 'اطلاعات';

  @override
  String get helpAndSupport => 'مدد اور سپورٹ';

  @override
  String get needHelpContactUs => 'مدد چاہیے؟ ہم سے رابطہ کریں:';

  @override
  String get supportEmail => 'support@handygo.app';

  @override
  String get supportPhone => '+92 300 1234567';

  @override
  String get close => 'بند کریں';

  @override
  String get about => 'بارے میں';

  @override
  String get handyGoWorker => 'ہینڈی گو ورکر';

  @override
  String get copyright => '© 2024 ہینڈی گو۔ جملہ حقوق محفوظ ہیں۔';

  @override
  String get logout => 'لاگ آؤٹ';

  @override
  String get logoutConfirm => 'کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟';

  @override
  String get editProfileTitle => 'پروفائل میں ترمیم';

  @override
  String get save => 'محفوظ کریں';

  @override
  String get serviceSettings => 'سروس کی ترتیبات';

  @override
  String get serviceRadiusKm => 'سروس ریڈیئس (کلومیٹر)';

  @override
  String get maxDistanceDescription =>
      'زیادہ سے زیادہ فاصلہ جو آپ سفر کرنے کو تیار ہیں';

  @override
  String get bankDetails => 'بینک کی تفصیلات';

  @override
  String get accountTitle => 'اکاؤنٹ کا عنوان';

  @override
  String get accountNumber => 'اکاؤنٹ نمبر';

  @override
  String get bankName => 'بینک کا نام';

  @override
  String get saveChanges => 'تبدیلیاں محفوظ کریں';

  @override
  String get profileUpdatedSuccessfully => 'پروفائل کامیابی سے اپ ڈیٹ ہو گئی!';

  @override
  String get profileImageUpdated => 'پروفائل تصویر اپ ڈیٹ ہو گئی';

  @override
  String get firstNameRequired => 'پہلا نام ضروری ہے';

  @override
  String get lastNameRequired => 'آخری نام ضروری ہے';

  @override
  String get emailOptional => 'ای میل (اختیاری)';

  @override
  String get manageSkillsTitle => 'مہارتوں کا انتظام';

  @override
  String yearsExpRate(int years, int rate) {
    return '$years سال تجربہ • روپے $rate/گھنٹہ';
  }

  @override
  String get editDetails => 'تفصیلات ترمیم کریں';

  @override
  String get yearsOfExperience => 'تجربے کے سال';

  @override
  String get hourlyRateRs => 'فی گھنٹہ شرح (روپے)';

  @override
  String get skillsSavedSuccessfully => 'مہارتیں کامیابی سے محفوظ ہو گئیں!';

  @override
  String failedToSaveSkills(String error) {
    return 'مہارتیں محفوظ کرنے میں ناکامی: $error';
  }

  @override
  String get myDocuments => 'میری دستاویزات';

  @override
  String get requiredDocuments => 'ضروری دستاویزات';

  @override
  String get additionalDocuments => 'اضافی دستاویزات';

  @override
  String get addCertificate => 'سرٹیفکیٹ شامل کریں';

  @override
  String get profileVerified => 'پروفائل تصدیق شدہ';

  @override
  String get verificationPending => 'تصدیق زیر التوا';

  @override
  String get allDocumentsVerified => 'تمام ضروری دستاویزات کی تصدیق ہو چکی ہے';

  @override
  String get someDocumentsPending => 'کچھ دستاویزات تصدیق کے زیر انتظار ہیں';

  @override
  String get cnicFront => 'شناختی کارڈ سامنے';

  @override
  String get cnicBack => 'شناختی کارڈ پیچھے';

  @override
  String get profilePhoto => 'پروفائل تصویر';

  @override
  String get notUploadedYet => 'ابھی تک اپ لوڈ نہیں ہوا';

  @override
  String get verified => 'تصدیق شدہ';

  @override
  String get pendingStatus => 'زیر التوا';

  @override
  String get rejected => 'مسترد';

  @override
  String get upload => 'اپ لوڈ';

  @override
  String get documentUploadedSuccessfully => 'دستاویز کامیابی سے اپ لوڈ ہو گئی';

  @override
  String get takePhoto => 'تصویر لیں';

  @override
  String get chooseFromGallery => 'گیلری سے منتخب کریں';

  @override
  String get emergencySos => 'ایمرجنسی SOS';

  @override
  String get emergencyHelp => 'ایمرجنسی مدد';

  @override
  String get sosMainDescription =>
      'ایڈمن ٹیم کو SOS الرٹ بھیجیں۔\nوہ جلد از جلد جواب دیں گے۔';

  @override
  String get whatIsHappening => 'کیا ہو رہا ہے؟';

  @override
  String get sosReasonUnsafe => 'مجھے خطرہ محسوس ہو رہا ہے';

  @override
  String get sosReasonAggressive => 'صارف جارحانہ ہے';

  @override
  String get sosReasonHarassment => 'ہراسانی';

  @override
  String get sosReasonTheft => 'چوری یا ڈکیتی';

  @override
  String get sosReasonFakeIdentity => 'صارف وہ نہیں جس کا دعویٰ کرتا ہے';

  @override
  String get sosReasonPaymentDispute => 'ادائیگی پر تنازعہ';

  @override
  String get sosReasonPropertyDamage => 'جائیداد کو نقصان';

  @override
  String get sosReasonOther => 'دیگر ایمرجنسی';

  @override
  String get additionalDetails => 'اضافی تفصیلات (اختیاری)';

  @override
  String get describeSituation => 'صورتحال بیان کریں...';

  @override
  String get attachEvidence => 'ثبوت منسلک کریں (اختیاری)';

  @override
  String get addPhotoEvidence => 'تصویری ثبوت شامل کریں';

  @override
  String addMorePhotos(int count) {
    return 'مزید شامل کریں ($count/3)';
  }

  @override
  String get sendingSos => 'SOS بھیجا جا رہا ہے...';

  @override
  String get sendSosAlert => 'SOS الرٹ بھیجیں';

  @override
  String get confirmSos => 'SOS کی تصدیق';

  @override
  String get sosConfirmMessage =>
      'یہ ایڈمن ٹیم کو ایمرجنسی الرٹ بھیجے گا۔ جھوٹے الرٹ سے اکاؤنٹ پر کارروائی ہو سکتی ہے۔\n\nکیا آپ واقعی آگے بڑھنا چاہتے ہیں؟';

  @override
  String get sendSos => 'SOS بھیجیں';

  @override
  String get emergencyContacts => 'ایمرجنسی رابطے';

  @override
  String get police => 'پولیس';

  @override
  String get ambulance => 'ایمبولینس';

  @override
  String get fire => 'فائر بریگیڈ';

  @override
  String get sosSent => 'SOS بھیج دیا گیا';

  @override
  String get sosAlertSentSuccessfully => 'SOS الرٹ کامیابی سے بھیج دیا گیا';

  @override
  String get sosSuccessMessage =>
      'ہماری ایڈمن ٹیم کو مطلع کر دیا گیا ہے اور وہ\nجلد از جلد جواب دیں گے۔\n\nمحفوظ رہیں اور اگر ممکن ہو تو اپنی جگہ پر رہیں۔';

  @override
  String get backToApp => 'ایپ پر واپس';

  @override
  String get notificationsTitle => 'اطلاعات';

  @override
  String get markAllRead => 'سب پڑھا ہوا نشان زد کریں';

  @override
  String get retry => 'دوبارہ کوشش کریں';

  @override
  String get noNotificationsYet => 'ابھی تک کوئی اطلاعات نہیں';

  @override
  String get notificationsEmpty =>
      'آپ کو اپنی بکنگز اور اپ ڈیٹس\nکے بارے میں یہاں اطلاعات ملیں گی';

  @override
  String get justNow => 'ابھی';

  @override
  String minutesAgo(int count) {
    return '$count منٹ پہلے';
  }

  @override
  String hoursAgo(int count) {
    return '$count گھنٹے پہلے';
  }

  @override
  String daysAgo(int count) {
    return '$count دن پہلے';
  }

  @override
  String get noMessagesYet => 'ابھی تک کوئی پیغام نہیں';

  @override
  String startConversationWith(String name) {
    return '$name کے ساتھ بات چیت شروع کریں';
  }

  @override
  String get typeAMessage => 'پیغام لکھیں...';

  @override
  String get chatNotAvailable => 'چیٹ اس وقت دستیاب نہیں ہے';

  @override
  String get somethingWentWrong => 'کچھ غلط ہو گیا';

  @override
  String get error => 'خرابی';

  @override
  String get success => 'کامیابی';

  @override
  String get loading => 'لوڈ ہو رہا ہے...';

  @override
  String get noInternet => 'انٹرنیٹ کنکشن نہیں';

  @override
  String get checkConnection =>
      'براہ کرم اپنا انٹرنیٹ کنکشن چیک کریں اور دوبارہ کوشش کریں';

  @override
  String get tryAgain => 'براہ کرم بعد میں دوبارہ کوشش کریں';

  @override
  String get english => 'English';

  @override
  String get urdu => 'اردو';
}
