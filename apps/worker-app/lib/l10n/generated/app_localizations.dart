import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_ur.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('ur'),
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'Handy Go'**
  String get appName;

  /// No description provided for @workerPortal.
  ///
  /// In en, this message translates to:
  /// **'Worker Portal'**
  String get workerPortal;

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Handy Go - Worker'**
  String get appTitle;

  /// No description provided for @onboardingTitle1.
  ///
  /// In en, this message translates to:
  /// **'Find Great Jobs'**
  String get onboardingTitle1;

  /// No description provided for @onboardingDesc1.
  ///
  /// In en, this message translates to:
  /// **'Get matched with customers who need your skills. Accept jobs that fit your schedule.'**
  String get onboardingDesc1;

  /// No description provided for @onboardingTitle2.
  ///
  /// In en, this message translates to:
  /// **'Earn More Money'**
  String get onboardingTitle2;

  /// No description provided for @onboardingDesc2.
  ///
  /// In en, this message translates to:
  /// **'Set your own rates and build your reputation. More jobs, more earnings!'**
  String get onboardingDesc2;

  /// No description provided for @onboardingTitle3.
  ///
  /// In en, this message translates to:
  /// **'Safe & Secure'**
  String get onboardingTitle3;

  /// No description provided for @onboardingDesc3.
  ///
  /// In en, this message translates to:
  /// **'Work with verified customers. Our SOS feature keeps you protected always.'**
  String get onboardingDesc3;

  /// No description provided for @skip.
  ///
  /// In en, this message translates to:
  /// **'Skip'**
  String get skip;

  /// No description provided for @getStarted.
  ///
  /// In en, this message translates to:
  /// **'Get Started'**
  String get getStarted;

  /// No description provided for @next.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get next;

  /// No description provided for @alreadyHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account? '**
  String get alreadyHaveAccount;

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get login;

  /// No description provided for @signUp.
  ///
  /// In en, this message translates to:
  /// **'Sign Up'**
  String get signUp;

  /// No description provided for @enterYourEmail.
  ///
  /// In en, this message translates to:
  /// **'Enter your email'**
  String get enterYourEmail;

  /// No description provided for @emailOtpDescription.
  ///
  /// In en, this message translates to:
  /// **'We\'ll send you an OTP to verify your email'**
  String get emailOtpDescription;

  /// No description provided for @emailAddress.
  ///
  /// In en, this message translates to:
  /// **'Email Address'**
  String get emailAddress;

  /// No description provided for @emailHint.
  ///
  /// In en, this message translates to:
  /// **'you@example.com'**
  String get emailHint;

  /// No description provided for @pleaseEnterEmail.
  ///
  /// In en, this message translates to:
  /// **'Please enter your email'**
  String get pleaseEnterEmail;

  /// No description provided for @pleaseEnterValidEmail.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid email address'**
  String get pleaseEnterValidEmail;

  /// No description provided for @emailActiveNote.
  ///
  /// In en, this message translates to:
  /// **'Make sure this email is active. We\'ll send a 6-digit OTP to verify your identity.'**
  String get emailActiveNote;

  /// No description provided for @continueButton.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueButton;

  /// No description provided for @byContinuingAgree.
  ///
  /// In en, this message translates to:
  /// **'By continuing, you agree to our '**
  String get byContinuingAgree;

  /// No description provided for @termsOfService.
  ///
  /// In en, this message translates to:
  /// **'Terms of Service'**
  String get termsOfService;

  /// No description provided for @privacyPolicy.
  ///
  /// In en, this message translates to:
  /// **'Privacy Policy'**
  String get privacyPolicy;

  /// No description provided for @verification.
  ///
  /// In en, this message translates to:
  /// **'Verification'**
  String get verification;

  /// No description provided for @verificationCode.
  ///
  /// In en, this message translates to:
  /// **'Verification Code'**
  String get verificationCode;

  /// No description provided for @enterOtpSentTo.
  ///
  /// In en, this message translates to:
  /// **'Enter the 6-digit code sent to\n{email}'**
  String enterOtpSentTo(String email);

  /// No description provided for @resendCodeIn.
  ///
  /// In en, this message translates to:
  /// **'Resend code in {seconds}s'**
  String resendCodeIn(int seconds);

  /// No description provided for @resendCode.
  ///
  /// In en, this message translates to:
  /// **'Resend Code'**
  String get resendCode;

  /// No description provided for @verify.
  ///
  /// In en, this message translates to:
  /// **'Verify'**
  String get verify;

  /// No description provided for @welcomeBack.
  ///
  /// In en, this message translates to:
  /// **'Welcome Back!'**
  String get welcomeBack;

  /// No description provided for @loginToWorkerAccount.
  ///
  /// In en, this message translates to:
  /// **'Login to your worker account'**
  String get loginToWorkerAccount;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @pleaseEnterPassword.
  ///
  /// In en, this message translates to:
  /// **'Please enter your password'**
  String get pleaseEnterPassword;

  /// No description provided for @pleaseEnterValidEmailShort.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid email'**
  String get pleaseEnterValidEmailShort;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot Password?'**
  String get forgotPassword;

  /// No description provided for @dontHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account? '**
  String get dontHaveAccount;

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get createAccount;

  /// No description provided for @personalInformation.
  ///
  /// In en, this message translates to:
  /// **'Personal Information'**
  String get personalInformation;

  /// No description provided for @firstName.
  ///
  /// In en, this message translates to:
  /// **'First Name'**
  String get firstName;

  /// No description provided for @lastName.
  ///
  /// In en, this message translates to:
  /// **'Last Name'**
  String get lastName;

  /// No description provided for @phoneNumberOptional.
  ///
  /// In en, this message translates to:
  /// **'Phone Number (Optional)'**
  String get phoneNumberOptional;

  /// No description provided for @cnicNumber.
  ///
  /// In en, this message translates to:
  /// **'CNIC Number'**
  String get cnicNumber;

  /// No description provided for @cnicHint.
  ///
  /// In en, this message translates to:
  /// **'XXXXX-XXXXXXX-X'**
  String get cnicHint;

  /// No description provided for @selectYourSkills.
  ///
  /// In en, this message translates to:
  /// **'Select Your Skills'**
  String get selectYourSkills;

  /// No description provided for @chooseSkillsDescription.
  ///
  /// In en, this message translates to:
  /// **'Choose the services you can provide'**
  String get chooseSkillsDescription;

  /// No description provided for @plumbing.
  ///
  /// In en, this message translates to:
  /// **'Plumbing'**
  String get plumbing;

  /// No description provided for @electrical.
  ///
  /// In en, this message translates to:
  /// **'Electrical'**
  String get electrical;

  /// No description provided for @cleaning.
  ///
  /// In en, this message translates to:
  /// **'Cleaning'**
  String get cleaning;

  /// No description provided for @acRepair.
  ///
  /// In en, this message translates to:
  /// **'AC Repair'**
  String get acRepair;

  /// No description provided for @carpenter.
  ///
  /// In en, this message translates to:
  /// **'Carpenter'**
  String get carpenter;

  /// No description provided for @painting.
  ///
  /// In en, this message translates to:
  /// **'Painting'**
  String get painting;

  /// No description provided for @mechanic.
  ///
  /// In en, this message translates to:
  /// **'Mechanic'**
  String get mechanic;

  /// No description provided for @generalHandyman.
  ///
  /// In en, this message translates to:
  /// **'General Handyman'**
  String get generalHandyman;

  /// No description provided for @createPassword.
  ///
  /// In en, this message translates to:
  /// **'Create Password'**
  String get createPassword;

  /// No description provided for @confirmPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm Password'**
  String get confirmPassword;

  /// No description provided for @iAgreeToThe.
  ///
  /// In en, this message translates to:
  /// **'I agree to the '**
  String get iAgreeToThe;

  /// No description provided for @termsAndConditions.
  ///
  /// In en, this message translates to:
  /// **'Terms & Conditions'**
  String get termsAndConditions;

  /// No description provided for @pleaseSelectAtLeastOneSkill.
  ///
  /// In en, this message translates to:
  /// **'Please select at least one skill'**
  String get pleaseSelectAtLeastOneSkill;

  /// No description provided for @pleaseAcceptTerms.
  ///
  /// In en, this message translates to:
  /// **'Please accept the Terms & Conditions'**
  String get pleaseAcceptTerms;

  /// No description provided for @home.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get home;

  /// No description provided for @jobs.
  ///
  /// In en, this message translates to:
  /// **'Jobs'**
  String get jobs;

  /// No description provided for @earnings.
  ///
  /// In en, this message translates to:
  /// **'Earnings'**
  String get earnings;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @helloName.
  ///
  /// In en, this message translates to:
  /// **'Hello, {name}!'**
  String helloName(String name);

  /// No description provided for @available.
  ///
  /// In en, this message translates to:
  /// **'Available'**
  String get available;

  /// No description provided for @offline.
  ///
  /// In en, this message translates to:
  /// **'Offline'**
  String get offline;

  /// No description provided for @youAreOnline.
  ///
  /// In en, this message translates to:
  /// **'You are Online'**
  String get youAreOnline;

  /// No description provided for @youAreOffline.
  ///
  /// In en, this message translates to:
  /// **'You are Offline'**
  String get youAreOffline;

  /// No description provided for @readyToReceiveJobs.
  ///
  /// In en, this message translates to:
  /// **'Ready to receive job requests'**
  String get readyToReceiveJobs;

  /// No description provided for @toggleToStartReceiving.
  ///
  /// In en, this message translates to:
  /// **'Toggle to start receiving jobs'**
  String get toggleToStartReceiving;

  /// No description provided for @rating.
  ///
  /// In en, this message translates to:
  /// **'Rating'**
  String get rating;

  /// No description provided for @jobsDone.
  ///
  /// In en, this message translates to:
  /// **'Jobs Done'**
  String get jobsDone;

  /// No description provided for @trust.
  ///
  /// In en, this message translates to:
  /// **'Trust'**
  String get trust;

  /// No description provided for @activeJobs.
  ///
  /// In en, this message translates to:
  /// **'Active Jobs'**
  String get activeJobs;

  /// No description provided for @viewAll.
  ///
  /// In en, this message translates to:
  /// **'View All'**
  String get viewAll;

  /// No description provided for @availableJobs.
  ///
  /// In en, this message translates to:
  /// **'Available Jobs'**
  String get availableJobs;

  /// No description provided for @nJobs.
  ///
  /// In en, this message translates to:
  /// **'{count} jobs'**
  String nJobs(int count);

  /// No description provided for @noJobsAvailable.
  ///
  /// In en, this message translates to:
  /// **'No jobs available right now'**
  String get noJobsAvailable;

  /// No description provided for @stayOnlineForJobs.
  ///
  /// In en, this message translates to:
  /// **'Stay online to receive new job requests'**
  String get stayOnlineForJobs;

  /// No description provided for @inProgressLabel.
  ///
  /// In en, this message translates to:
  /// **'IN PROGRESS'**
  String get inProgressLabel;

  /// No description provided for @urgentLabel.
  ///
  /// In en, this message translates to:
  /// **'URGENT'**
  String get urgentLabel;

  /// No description provided for @failedToUpdateAvailability.
  ///
  /// In en, this message translates to:
  /// **'Failed to update availability'**
  String get failedToUpdateAvailability;

  /// No description provided for @myJobs.
  ///
  /// In en, this message translates to:
  /// **'My Jobs'**
  String get myJobs;

  /// No description provided for @all.
  ///
  /// In en, this message translates to:
  /// **'ALL'**
  String get all;

  /// No description provided for @pending.
  ///
  /// In en, this message translates to:
  /// **'PENDING'**
  String get pending;

  /// No description provided for @accepted.
  ///
  /// In en, this message translates to:
  /// **'ACCEPTED'**
  String get accepted;

  /// No description provided for @inProgressFilter.
  ///
  /// In en, this message translates to:
  /// **'IN_PROGRESS'**
  String get inProgressFilter;

  /// No description provided for @completed.
  ///
  /// In en, this message translates to:
  /// **'COMPLETED'**
  String get completed;

  /// No description provided for @cancelled.
  ///
  /// In en, this message translates to:
  /// **'CANCELLED'**
  String get cancelled;

  /// No description provided for @noJobsFound.
  ///
  /// In en, this message translates to:
  /// **'No {status} jobs found'**
  String noJobsFound(String status);

  /// No description provided for @activeJob.
  ///
  /// In en, this message translates to:
  /// **'Active Job'**
  String get activeJob;

  /// No description provided for @bookingNotFound.
  ///
  /// In en, this message translates to:
  /// **'Booking not found'**
  String get bookingNotFound;

  /// No description provided for @jobInProgress.
  ///
  /// In en, this message translates to:
  /// **'Job In Progress'**
  String get jobInProgress;

  /// No description provided for @readyToStart.
  ///
  /// In en, this message translates to:
  /// **'Ready to Start'**
  String get readyToStart;

  /// No description provided for @duration.
  ///
  /// In en, this message translates to:
  /// **'Duration'**
  String get duration;

  /// No description provided for @location.
  ///
  /// In en, this message translates to:
  /// **'Location'**
  String get location;

  /// No description provided for @navigate.
  ///
  /// In en, this message translates to:
  /// **'Navigate'**
  String get navigate;

  /// No description provided for @problemDescription.
  ///
  /// In en, this message translates to:
  /// **'Problem Description'**
  String get problemDescription;

  /// No description provided for @startJob.
  ///
  /// In en, this message translates to:
  /// **'Start Job'**
  String get startJob;

  /// No description provided for @completeJob.
  ///
  /// In en, this message translates to:
  /// **'Complete Job'**
  String get completeJob;

  /// No description provided for @jobStarted.
  ///
  /// In en, this message translates to:
  /// **'Job started!'**
  String get jobStarted;

  /// No description provided for @failedToStartJob.
  ///
  /// In en, this message translates to:
  /// **'Failed to start job'**
  String get failedToStartJob;

  /// No description provided for @jobCompletedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Job completed successfully!'**
  String get jobCompletedSuccessfully;

  /// No description provided for @failedToCompleteJob.
  ///
  /// In en, this message translates to:
  /// **'Failed to complete job'**
  String get failedToCompleteJob;

  /// No description provided for @completeJobDialogTitle.
  ///
  /// In en, this message translates to:
  /// **'Complete Job'**
  String get completeJobDialogTitle;

  /// No description provided for @enterFinalPricing.
  ///
  /// In en, this message translates to:
  /// **'Enter the final pricing for this job:'**
  String get enterFinalPricing;

  /// No description provided for @finalPriceRs.
  ///
  /// In en, this message translates to:
  /// **'Final Price (Rs.)'**
  String get finalPriceRs;

  /// No description provided for @materialsCostRs.
  ///
  /// In en, this message translates to:
  /// **'Materials Cost (Rs.)'**
  String get materialsCostRs;

  /// No description provided for @materialsHint.
  ///
  /// In en, this message translates to:
  /// **'Cost of any materials used'**
  String get materialsHint;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @complete.
  ///
  /// In en, this message translates to:
  /// **'Complete'**
  String get complete;

  /// No description provided for @bookingDetails.
  ///
  /// In en, this message translates to:
  /// **'Booking Details'**
  String get bookingDetails;

  /// No description provided for @urgentRequest.
  ///
  /// In en, this message translates to:
  /// **'URGENT REQUEST'**
  String get urgentRequest;

  /// No description provided for @customer.
  ///
  /// In en, this message translates to:
  /// **'Customer'**
  String get customer;

  /// No description provided for @getDirections.
  ///
  /// In en, this message translates to:
  /// **'Get Directions'**
  String get getDirections;

  /// No description provided for @estimatedPricing.
  ///
  /// In en, this message translates to:
  /// **'Estimated Pricing'**
  String get estimatedPricing;

  /// No description provided for @laborCost.
  ///
  /// In en, this message translates to:
  /// **'Labor Cost'**
  String get laborCost;

  /// No description provided for @estimatedDuration.
  ///
  /// In en, this message translates to:
  /// **'Estimated Duration'**
  String get estimatedDuration;

  /// No description provided for @nMins.
  ///
  /// In en, this message translates to:
  /// **'{count} mins'**
  String nMins(int count);

  /// No description provided for @estimatedTotal.
  ///
  /// In en, this message translates to:
  /// **'Estimated Total'**
  String get estimatedTotal;

  /// No description provided for @acceptJob.
  ///
  /// In en, this message translates to:
  /// **'Accept Job'**
  String get acceptJob;

  /// No description provided for @reject.
  ///
  /// In en, this message translates to:
  /// **'Reject'**
  String get reject;

  /// No description provided for @failedToLoadBookingDetails.
  ///
  /// In en, this message translates to:
  /// **'Failed to load booking details'**
  String get failedToLoadBookingDetails;

  /// No description provided for @bookingAcceptedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Booking accepted successfully!'**
  String get bookingAcceptedSuccessfully;

  /// No description provided for @failedToAcceptBooking.
  ///
  /// In en, this message translates to:
  /// **'Failed to accept booking'**
  String get failedToAcceptBooking;

  /// No description provided for @bookingRejected.
  ///
  /// In en, this message translates to:
  /// **'Booking rejected'**
  String get bookingRejected;

  /// No description provided for @failedToRejectBooking.
  ///
  /// In en, this message translates to:
  /// **'Failed to reject booking'**
  String get failedToRejectBooking;

  /// No description provided for @rejectBookingTitle.
  ///
  /// In en, this message translates to:
  /// **'Reject Booking'**
  String get rejectBookingTitle;

  /// No description provided for @provideReasonForRejection.
  ///
  /// In en, this message translates to:
  /// **'Please provide a reason for rejecting this job:'**
  String get provideReasonForRejection;

  /// No description provided for @enterReason.
  ///
  /// In en, this message translates to:
  /// **'Enter reason...'**
  String get enterReason;

  /// No description provided for @earningsTitle.
  ///
  /// In en, this message translates to:
  /// **'Earnings'**
  String get earningsTitle;

  /// No description provided for @totalEarnings.
  ///
  /// In en, this message translates to:
  /// **'Total Earnings'**
  String get totalEarnings;

  /// No description provided for @nJobsCompleted.
  ///
  /// In en, this message translates to:
  /// **'{count} jobs completed'**
  String nJobsCompleted(int count);

  /// No description provided for @today.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get today;

  /// No description provided for @thisWeek.
  ///
  /// In en, this message translates to:
  /// **'This Week'**
  String get thisWeek;

  /// No description provided for @thisMonth.
  ///
  /// In en, this message translates to:
  /// **'This Month'**
  String get thisMonth;

  /// No description provided for @avgPerJob.
  ///
  /// In en, this message translates to:
  /// **'Avg. per Job'**
  String get avgPerJob;

  /// No description provided for @pendingEarnings.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get pendingEarnings;

  /// No description provided for @recentTransactions.
  ///
  /// In en, this message translates to:
  /// **'Recent Transactions'**
  String get recentTransactions;

  /// No description provided for @noTransactionsYet.
  ///
  /// In en, this message translates to:
  /// **'No transactions yet'**
  String get noTransactionsYet;

  /// No description provided for @withdrawalComingSoon.
  ///
  /// In en, this message translates to:
  /// **'Minimum withdrawal amount is Rs. 500'**
  String get withdrawalComingSoon;

  /// No description provided for @withdrawToBank.
  ///
  /// In en, this message translates to:
  /// **'Withdraw to Bank'**
  String get withdrawToBank;

  /// No description provided for @profileTitle.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profileTitle;

  /// No description provided for @skills.
  ///
  /// In en, this message translates to:
  /// **'Skills'**
  String get skills;

  /// No description provided for @manage.
  ///
  /// In en, this message translates to:
  /// **'Manage'**
  String get manage;

  /// No description provided for @editProfile.
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get editProfile;

  /// No description provided for @manageSkills.
  ///
  /// In en, this message translates to:
  /// **'Manage Skills'**
  String get manageSkills;

  /// No description provided for @documents.
  ///
  /// In en, this message translates to:
  /// **'Documents'**
  String get documents;

  /// No description provided for @notifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// No description provided for @helpAndSupport.
  ///
  /// In en, this message translates to:
  /// **'Help & Support'**
  String get helpAndSupport;

  /// No description provided for @needHelpContactUs.
  ///
  /// In en, this message translates to:
  /// **'Need help? Contact us:'**
  String get needHelpContactUs;

  /// No description provided for @supportEmail.
  ///
  /// In en, this message translates to:
  /// **'support@handygo.app'**
  String get supportEmail;

  /// No description provided for @supportPhone.
  ///
  /// In en, this message translates to:
  /// **'+92 300 1234567'**
  String get supportPhone;

  /// No description provided for @close.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get close;

  /// No description provided for @about.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get about;

  /// No description provided for @handyGoWorker.
  ///
  /// In en, this message translates to:
  /// **'Handy Go Worker'**
  String get handyGoWorker;

  /// No description provided for @copyright.
  ///
  /// In en, this message translates to:
  /// **'© 2024 Handy Go. All rights reserved.'**
  String get copyright;

  /// No description provided for @logout.
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get logout;

  /// No description provided for @logoutConfirm.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to logout?'**
  String get logoutConfirm;

  /// No description provided for @editProfileTitle.
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get editProfileTitle;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @serviceSettings.
  ///
  /// In en, this message translates to:
  /// **'Service Settings'**
  String get serviceSettings;

  /// No description provided for @serviceRadiusKm.
  ///
  /// In en, this message translates to:
  /// **'Service Radius (km)'**
  String get serviceRadiusKm;

  /// No description provided for @maxDistanceDescription.
  ///
  /// In en, this message translates to:
  /// **'Maximum distance you are willing to travel'**
  String get maxDistanceDescription;

  /// No description provided for @bankDetails.
  ///
  /// In en, this message translates to:
  /// **'Bank Details'**
  String get bankDetails;

  /// No description provided for @accountTitle.
  ///
  /// In en, this message translates to:
  /// **'Account Title'**
  String get accountTitle;

  /// No description provided for @accountNumber.
  ///
  /// In en, this message translates to:
  /// **'Account Number'**
  String get accountNumber;

  /// No description provided for @bankName.
  ///
  /// In en, this message translates to:
  /// **'Bank Name'**
  String get bankName;

  /// No description provided for @saveChanges.
  ///
  /// In en, this message translates to:
  /// **'Save Changes'**
  String get saveChanges;

  /// No description provided for @profileUpdatedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Profile updated successfully!'**
  String get profileUpdatedSuccessfully;

  /// No description provided for @profileImageUpdated.
  ///
  /// In en, this message translates to:
  /// **'Profile image updated'**
  String get profileImageUpdated;

  /// No description provided for @firstNameRequired.
  ///
  /// In en, this message translates to:
  /// **'First name is required'**
  String get firstNameRequired;

  /// No description provided for @lastNameRequired.
  ///
  /// In en, this message translates to:
  /// **'Last name is required'**
  String get lastNameRequired;

  /// No description provided for @emailOptional.
  ///
  /// In en, this message translates to:
  /// **'Email (Optional)'**
  String get emailOptional;

  /// No description provided for @manageSkillsTitle.
  ///
  /// In en, this message translates to:
  /// **'Manage Skills'**
  String get manageSkillsTitle;

  /// No description provided for @yearsExpRate.
  ///
  /// In en, this message translates to:
  /// **'{years} years exp • Rs. {rate}/hr'**
  String yearsExpRate(int years, int rate);

  /// No description provided for @editDetails.
  ///
  /// In en, this message translates to:
  /// **'Edit Details'**
  String get editDetails;

  /// No description provided for @yearsOfExperience.
  ///
  /// In en, this message translates to:
  /// **'Years of Experience'**
  String get yearsOfExperience;

  /// No description provided for @hourlyRateRs.
  ///
  /// In en, this message translates to:
  /// **'Hourly Rate (Rs.)'**
  String get hourlyRateRs;

  /// No description provided for @skillsSavedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Skills saved successfully!'**
  String get skillsSavedSuccessfully;

  /// No description provided for @failedToSaveSkills.
  ///
  /// In en, this message translates to:
  /// **'Failed to save skills: {error}'**
  String failedToSaveSkills(String error);

  /// No description provided for @myDocuments.
  ///
  /// In en, this message translates to:
  /// **'My Documents'**
  String get myDocuments;

  /// No description provided for @requiredDocuments.
  ///
  /// In en, this message translates to:
  /// **'Required Documents'**
  String get requiredDocuments;

  /// No description provided for @additionalDocuments.
  ///
  /// In en, this message translates to:
  /// **'Additional Documents'**
  String get additionalDocuments;

  /// No description provided for @addCertificate.
  ///
  /// In en, this message translates to:
  /// **'Add Certificate'**
  String get addCertificate;

  /// No description provided for @profileVerified.
  ///
  /// In en, this message translates to:
  /// **'Profile Verified'**
  String get profileVerified;

  /// No description provided for @verificationPending.
  ///
  /// In en, this message translates to:
  /// **'Verification Pending'**
  String get verificationPending;

  /// No description provided for @allDocumentsVerified.
  ///
  /// In en, this message translates to:
  /// **'All required documents have been verified'**
  String get allDocumentsVerified;

  /// No description provided for @someDocumentsPending.
  ///
  /// In en, this message translates to:
  /// **'Some documents are pending verification'**
  String get someDocumentsPending;

  /// No description provided for @cnicFront.
  ///
  /// In en, this message translates to:
  /// **'CNIC Front'**
  String get cnicFront;

  /// No description provided for @cnicBack.
  ///
  /// In en, this message translates to:
  /// **'CNIC Back'**
  String get cnicBack;

  /// No description provided for @profilePhoto.
  ///
  /// In en, this message translates to:
  /// **'Profile Photo'**
  String get profilePhoto;

  /// No description provided for @notUploadedYet.
  ///
  /// In en, this message translates to:
  /// **'Not uploaded yet'**
  String get notUploadedYet;

  /// No description provided for @verified.
  ///
  /// In en, this message translates to:
  /// **'Verified'**
  String get verified;

  /// No description provided for @pendingStatus.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get pendingStatus;

  /// No description provided for @rejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get rejected;

  /// No description provided for @upload.
  ///
  /// In en, this message translates to:
  /// **'Upload'**
  String get upload;

  /// No description provided for @documentUploadedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Document uploaded successfully'**
  String get documentUploadedSuccessfully;

  /// No description provided for @takePhoto.
  ///
  /// In en, this message translates to:
  /// **'Take Photo'**
  String get takePhoto;

  /// No description provided for @chooseFromGallery.
  ///
  /// In en, this message translates to:
  /// **'Choose from Gallery'**
  String get chooseFromGallery;

  /// No description provided for @emergencySos.
  ///
  /// In en, this message translates to:
  /// **'Emergency SOS'**
  String get emergencySos;

  /// No description provided for @emergencyHelp.
  ///
  /// In en, this message translates to:
  /// **'Emergency Help'**
  String get emergencyHelp;

  /// No description provided for @sosMainDescription.
  ///
  /// In en, this message translates to:
  /// **'Send an SOS alert to the admin team.\nThey will respond as quickly as possible.'**
  String get sosMainDescription;

  /// No description provided for @whatIsHappening.
  ///
  /// In en, this message translates to:
  /// **'What is happening?'**
  String get whatIsHappening;

  /// No description provided for @sosReasonUnsafe.
  ///
  /// In en, this message translates to:
  /// **'I feel unsafe'**
  String get sosReasonUnsafe;

  /// No description provided for @sosReasonAggressive.
  ///
  /// In en, this message translates to:
  /// **'Customer is aggressive'**
  String get sosReasonAggressive;

  /// No description provided for @sosReasonHarassment.
  ///
  /// In en, this message translates to:
  /// **'Harassment'**
  String get sosReasonHarassment;

  /// No description provided for @sosReasonTheft.
  ///
  /// In en, this message translates to:
  /// **'Theft or robbery'**
  String get sosReasonTheft;

  /// No description provided for @sosReasonFakeIdentity.
  ///
  /// In en, this message translates to:
  /// **'Customer not who they claim to be'**
  String get sosReasonFakeIdentity;

  /// No description provided for @sosReasonPaymentDispute.
  ///
  /// In en, this message translates to:
  /// **'Dispute over payment'**
  String get sosReasonPaymentDispute;

  /// No description provided for @sosReasonPropertyDamage.
  ///
  /// In en, this message translates to:
  /// **'Property damage'**
  String get sosReasonPropertyDamage;

  /// No description provided for @sosReasonOther.
  ///
  /// In en, this message translates to:
  /// **'Other emergency'**
  String get sosReasonOther;

  /// No description provided for @additionalDetails.
  ///
  /// In en, this message translates to:
  /// **'Additional details (optional)'**
  String get additionalDetails;

  /// No description provided for @describeSituation.
  ///
  /// In en, this message translates to:
  /// **'Describe the situation...'**
  String get describeSituation;

  /// No description provided for @attachEvidence.
  ///
  /// In en, this message translates to:
  /// **'Attach evidence (optional)'**
  String get attachEvidence;

  /// No description provided for @addPhotoEvidence.
  ///
  /// In en, this message translates to:
  /// **'Add photo evidence'**
  String get addPhotoEvidence;

  /// No description provided for @addMorePhotos.
  ///
  /// In en, this message translates to:
  /// **'Add more ({count}/3)'**
  String addMorePhotos(int count);

  /// No description provided for @sendingSos.
  ///
  /// In en, this message translates to:
  /// **'Sending SOS...'**
  String get sendingSos;

  /// No description provided for @sendSosAlert.
  ///
  /// In en, this message translates to:
  /// **'SEND SOS ALERT'**
  String get sendSosAlert;

  /// No description provided for @confirmSos.
  ///
  /// In en, this message translates to:
  /// **'Confirm SOS'**
  String get confirmSos;

  /// No description provided for @sosConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'This will send an emergency alert to the admin team. False alerts may result in account penalties.\n\nAre you sure you want to proceed?'**
  String get sosConfirmMessage;

  /// No description provided for @sendSos.
  ///
  /// In en, this message translates to:
  /// **'Send SOS'**
  String get sendSos;

  /// No description provided for @emergencyContacts.
  ///
  /// In en, this message translates to:
  /// **'Emergency Contacts'**
  String get emergencyContacts;

  /// No description provided for @police.
  ///
  /// In en, this message translates to:
  /// **'Police'**
  String get police;

  /// No description provided for @ambulance.
  ///
  /// In en, this message translates to:
  /// **'Ambulance'**
  String get ambulance;

  /// No description provided for @fire.
  ///
  /// In en, this message translates to:
  /// **'Fire'**
  String get fire;

  /// No description provided for @sosSent.
  ///
  /// In en, this message translates to:
  /// **'SOS Sent'**
  String get sosSent;

  /// No description provided for @sosAlertSentSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'SOS Alert Sent Successfully'**
  String get sosAlertSentSuccessfully;

  /// No description provided for @sosSuccessMessage.
  ///
  /// In en, this message translates to:
  /// **'Our admin team has been notified and will\nrespond as quickly as possible.\n\nStay safe and stay where you are if possible.'**
  String get sosSuccessMessage;

  /// No description provided for @backToApp.
  ///
  /// In en, this message translates to:
  /// **'Back to App'**
  String get backToApp;

  /// No description provided for @notificationsTitle.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notificationsTitle;

  /// No description provided for @markAllRead.
  ///
  /// In en, this message translates to:
  /// **'Mark all read'**
  String get markAllRead;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @noNotificationsYet.
  ///
  /// In en, this message translates to:
  /// **'No notifications yet'**
  String get noNotificationsYet;

  /// No description provided for @notificationsEmpty.
  ///
  /// In en, this message translates to:
  /// **'You will receive notifications about\nyour bookings and updates here'**
  String get notificationsEmpty;

  /// No description provided for @justNow.
  ///
  /// In en, this message translates to:
  /// **'Just now'**
  String get justNow;

  /// No description provided for @minutesAgo.
  ///
  /// In en, this message translates to:
  /// **'{count}m ago'**
  String minutesAgo(int count);

  /// No description provided for @hoursAgo.
  ///
  /// In en, this message translates to:
  /// **'{count}h ago'**
  String hoursAgo(int count);

  /// No description provided for @daysAgo.
  ///
  /// In en, this message translates to:
  /// **'{count}d ago'**
  String daysAgo(int count);

  /// No description provided for @noMessagesYet.
  ///
  /// In en, this message translates to:
  /// **'No messages yet'**
  String get noMessagesYet;

  /// No description provided for @startConversationWith.
  ///
  /// In en, this message translates to:
  /// **'Start a conversation with {name}'**
  String startConversationWith(String name);

  /// No description provided for @typeAMessage.
  ///
  /// In en, this message translates to:
  /// **'Type a message...'**
  String get typeAMessage;

  /// No description provided for @chatNotAvailable.
  ///
  /// In en, this message translates to:
  /// **'Chat is not available at the moment'**
  String get chatNotAvailable;

  /// No description provided for @somethingWentWrong.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong'**
  String get somethingWentWrong;

  /// No description provided for @error.
  ///
  /// In en, this message translates to:
  /// **'Error'**
  String get error;

  /// No description provided for @success.
  ///
  /// In en, this message translates to:
  /// **'Success'**
  String get success;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading...'**
  String get loading;

  /// No description provided for @noInternet.
  ///
  /// In en, this message translates to:
  /// **'No Internet Connection'**
  String get noInternet;

  /// No description provided for @checkConnection.
  ///
  /// In en, this message translates to:
  /// **'Please check your internet connection and try again'**
  String get checkConnection;

  /// No description provided for @tryAgain.
  ///
  /// In en, this message translates to:
  /// **'Please try again later'**
  String get tryAgain;

  /// No description provided for @english.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get english;

  /// No description provided for @urdu.
  ///
  /// In en, this message translates to:
  /// **'اردو'**
  String get urdu;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'ur'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'ur':
      return AppLocalizationsUr();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
