// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'Handy Go';

  @override
  String get workerPortal => 'Worker Portal';

  @override
  String get appTitle => 'Handy Go - Worker';

  @override
  String get onboardingTitle1 => 'Find Great Jobs';

  @override
  String get onboardingDesc1 =>
      'Get matched with customers who need your skills. Accept jobs that fit your schedule.';

  @override
  String get onboardingTitle2 => 'Earn More Money';

  @override
  String get onboardingDesc2 =>
      'Set your own rates and build your reputation. More jobs, more earnings!';

  @override
  String get onboardingTitle3 => 'Safe & Secure';

  @override
  String get onboardingDesc3 =>
      'Work with verified customers. Our SOS feature keeps you protected always.';

  @override
  String get skip => 'Skip';

  @override
  String get getStarted => 'Get Started';

  @override
  String get next => 'Next';

  @override
  String get alreadyHaveAccount => 'Already have an account? ';

  @override
  String get login => 'Login';

  @override
  String get signUp => 'Sign Up';

  @override
  String get enterYourEmail => 'Enter your email';

  @override
  String get emailOtpDescription =>
      'We\'ll send you an OTP to verify your email';

  @override
  String get emailAddress => 'Email Address';

  @override
  String get emailHint => 'you@example.com';

  @override
  String get pleaseEnterEmail => 'Please enter your email';

  @override
  String get pleaseEnterValidEmail => 'Please enter a valid email address';

  @override
  String get emailActiveNote =>
      'Make sure this email is active. We\'ll send a 6-digit OTP to verify your identity.';

  @override
  String get continueButton => 'Continue';

  @override
  String get byContinuingAgree => 'By continuing, you agree to our ';

  @override
  String get termsOfService => 'Terms of Service';

  @override
  String get privacyPolicy => 'Privacy Policy';

  @override
  String get verification => 'Verification';

  @override
  String get verificationCode => 'Verification Code';

  @override
  String enterOtpSentTo(String email) {
    return 'Enter the 6-digit code sent to\n$email';
  }

  @override
  String resendCodeIn(int seconds) {
    return 'Resend code in ${seconds}s';
  }

  @override
  String get resendCode => 'Resend Code';

  @override
  String get verify => 'Verify';

  @override
  String get welcomeBack => 'Welcome Back!';

  @override
  String get loginToWorkerAccount => 'Login to your worker account';

  @override
  String get password => 'Password';

  @override
  String get pleaseEnterPassword => 'Please enter your password';

  @override
  String get pleaseEnterValidEmailShort => 'Please enter a valid email';

  @override
  String get forgotPassword => 'Forgot Password?';

  @override
  String get dontHaveAccount => 'Don\'t have an account? ';

  @override
  String get createAccount => 'Create Account';

  @override
  String get personalInformation => 'Personal Information';

  @override
  String get firstName => 'First Name';

  @override
  String get lastName => 'Last Name';

  @override
  String get phoneNumberOptional => 'Phone Number (Optional)';

  @override
  String get cnicNumber => 'CNIC Number';

  @override
  String get cnicHint => 'XXXXX-XXXXXXX-X';

  @override
  String get selectYourSkills => 'Select Your Skills';

  @override
  String get chooseSkillsDescription => 'Choose the services you can provide';

  @override
  String get plumbing => 'Plumbing';

  @override
  String get electrical => 'Electrical';

  @override
  String get cleaning => 'Cleaning';

  @override
  String get acRepair => 'AC Repair';

  @override
  String get carpenter => 'Carpenter';

  @override
  String get painting => 'Painting';

  @override
  String get mechanic => 'Mechanic';

  @override
  String get generalHandyman => 'General Handyman';

  @override
  String get createPassword => 'Create Password';

  @override
  String get confirmPassword => 'Confirm Password';

  @override
  String get iAgreeToThe => 'I agree to the ';

  @override
  String get termsAndConditions => 'Terms & Conditions';

  @override
  String get pleaseSelectAtLeastOneSkill => 'Please select at least one skill';

  @override
  String get pleaseAcceptTerms => 'Please accept the Terms & Conditions';

  @override
  String get home => 'Home';

  @override
  String get jobs => 'Jobs';

  @override
  String get earnings => 'Earnings';

  @override
  String get profile => 'Profile';

  @override
  String helloName(String name) {
    return 'Hello, $name!';
  }

  @override
  String get available => 'Available';

  @override
  String get offline => 'Offline';

  @override
  String get youAreOnline => 'You are Online';

  @override
  String get youAreOffline => 'You are Offline';

  @override
  String get readyToReceiveJobs => 'Ready to receive job requests';

  @override
  String get toggleToStartReceiving => 'Toggle to start receiving jobs';

  @override
  String get rating => 'Rating';

  @override
  String get jobsDone => 'Jobs Done';

  @override
  String get trust => 'Trust';

  @override
  String get activeJobs => 'Active Jobs';

  @override
  String get viewAll => 'View All';

  @override
  String get availableJobs => 'Available Jobs';

  @override
  String nJobs(int count) {
    return '$count jobs';
  }

  @override
  String get noJobsAvailable => 'No jobs available right now';

  @override
  String get stayOnlineForJobs => 'Stay online to receive new job requests';

  @override
  String get inProgressLabel => 'IN PROGRESS';

  @override
  String get urgentLabel => 'URGENT';

  @override
  String get failedToUpdateAvailability => 'Failed to update availability';

  @override
  String get myJobs => 'My Jobs';

  @override
  String get all => 'ALL';

  @override
  String get pending => 'PENDING';

  @override
  String get accepted => 'ACCEPTED';

  @override
  String get inProgressFilter => 'IN_PROGRESS';

  @override
  String get completed => 'COMPLETED';

  @override
  String get cancelled => 'CANCELLED';

  @override
  String noJobsFound(String status) {
    return 'No $status jobs found';
  }

  @override
  String get activeJob => 'Active Job';

  @override
  String get bookingNotFound => 'Booking not found';

  @override
  String get jobInProgress => 'Job In Progress';

  @override
  String get readyToStart => 'Ready to Start';

  @override
  String get duration => 'Duration';

  @override
  String get location => 'Location';

  @override
  String get navigate => 'Navigate';

  @override
  String get problemDescription => 'Problem Description';

  @override
  String get startJob => 'Start Job';

  @override
  String get completeJob => 'Complete Job';

  @override
  String get jobStarted => 'Job started!';

  @override
  String get failedToStartJob => 'Failed to start job';

  @override
  String get jobCompletedSuccessfully => 'Job completed successfully!';

  @override
  String get failedToCompleteJob => 'Failed to complete job';

  @override
  String get completeJobDialogTitle => 'Complete Job';

  @override
  String get enterFinalPricing => 'Enter the final pricing for this job:';

  @override
  String get finalPriceRs => 'Final Price (Rs.)';

  @override
  String get materialsCostRs => 'Materials Cost (Rs.)';

  @override
  String get materialsHint => 'Cost of any materials used';

  @override
  String get cancel => 'Cancel';

  @override
  String get complete => 'Complete';

  @override
  String get bookingDetails => 'Booking Details';

  @override
  String get urgentRequest => 'URGENT REQUEST';

  @override
  String get customer => 'Customer';

  @override
  String get getDirections => 'Get Directions';

  @override
  String get estimatedPricing => 'Estimated Pricing';

  @override
  String get laborCost => 'Labor Cost';

  @override
  String get estimatedDuration => 'Estimated Duration';

  @override
  String nMins(int count) {
    return '$count mins';
  }

  @override
  String get estimatedTotal => 'Estimated Total';

  @override
  String get acceptJob => 'Accept Job';

  @override
  String get reject => 'Reject';

  @override
  String get failedToLoadBookingDetails => 'Failed to load booking details';

  @override
  String get bookingAcceptedSuccessfully => 'Booking accepted successfully!';

  @override
  String get failedToAcceptBooking => 'Failed to accept booking';

  @override
  String get bookingRejected => 'Booking rejected';

  @override
  String get failedToRejectBooking => 'Failed to reject booking';

  @override
  String get rejectBookingTitle => 'Reject Booking';

  @override
  String get provideReasonForRejection =>
      'Please provide a reason for rejecting this job:';

  @override
  String get enterReason => 'Enter reason...';

  @override
  String get earningsTitle => 'Earnings';

  @override
  String get totalEarnings => 'Total Earnings';

  @override
  String nJobsCompleted(int count) {
    return '$count jobs completed';
  }

  @override
  String get today => 'Today';

  @override
  String get thisWeek => 'This Week';

  @override
  String get thisMonth => 'This Month';

  @override
  String get avgPerJob => 'Avg. per Job';

  @override
  String get pendingEarnings => 'Pending';

  @override
  String get recentTransactions => 'Recent Transactions';

  @override
  String get noTransactionsYet => 'No transactions yet';

  @override
  String get withdrawalComingSoon => 'Minimum withdrawal amount is Rs. 500';

  @override
  String get withdrawToBank => 'Withdraw to Bank';

  @override
  String get profileTitle => 'Profile';

  @override
  String get skills => 'Skills';

  @override
  String get manage => 'Manage';

  @override
  String get editProfile => 'Edit Profile';

  @override
  String get manageSkills => 'Manage Skills';

  @override
  String get documents => 'Documents';

  @override
  String get notifications => 'Notifications';

  @override
  String get helpAndSupport => 'Help & Support';

  @override
  String get needHelpContactUs => 'Need help? Contact us:';

  @override
  String get supportEmail => 'support@handygo.app';

  @override
  String get supportPhone => '+92 300 1234567';

  @override
  String get close => 'Close';

  @override
  String get about => 'About';

  @override
  String get handyGoWorker => 'Handy Go Worker';

  @override
  String get copyright => '© 2024 Handy Go. All rights reserved.';

  @override
  String get logout => 'Logout';

  @override
  String get logoutConfirm => 'Are you sure you want to logout?';

  @override
  String get editProfileTitle => 'Edit Profile';

  @override
  String get save => 'Save';

  @override
  String get serviceSettings => 'Service Settings';

  @override
  String get serviceRadiusKm => 'Service Radius (km)';

  @override
  String get maxDistanceDescription =>
      'Maximum distance you are willing to travel';

  @override
  String get bankDetails => 'Bank Details';

  @override
  String get accountTitle => 'Account Title';

  @override
  String get accountNumber => 'Account Number';

  @override
  String get bankName => 'Bank Name';

  @override
  String get saveChanges => 'Save Changes';

  @override
  String get profileUpdatedSuccessfully => 'Profile updated successfully!';

  @override
  String get profileImageUpdated => 'Profile image updated';

  @override
  String get firstNameRequired => 'First name is required';

  @override
  String get lastNameRequired => 'Last name is required';

  @override
  String get emailOptional => 'Email (Optional)';

  @override
  String get manageSkillsTitle => 'Manage Skills';

  @override
  String yearsExpRate(int years, int rate) {
    return '$years years exp • Rs. $rate/hr';
  }

  @override
  String get editDetails => 'Edit Details';

  @override
  String get yearsOfExperience => 'Years of Experience';

  @override
  String get hourlyRateRs => 'Hourly Rate (Rs.)';

  @override
  String get skillsSavedSuccessfully => 'Skills saved successfully!';

  @override
  String failedToSaveSkills(String error) {
    return 'Failed to save skills: $error';
  }

  @override
  String get myDocuments => 'My Documents';

  @override
  String get requiredDocuments => 'Required Documents';

  @override
  String get additionalDocuments => 'Additional Documents';

  @override
  String get addCertificate => 'Add Certificate';

  @override
  String get profileVerified => 'Profile Verified';

  @override
  String get verificationPending => 'Verification Pending';

  @override
  String get allDocumentsVerified =>
      'All required documents have been verified';

  @override
  String get someDocumentsPending => 'Some documents are pending verification';

  @override
  String get cnicFront => 'CNIC Front';

  @override
  String get cnicBack => 'CNIC Back';

  @override
  String get profilePhoto => 'Profile Photo';

  @override
  String get notUploadedYet => 'Not uploaded yet';

  @override
  String get verified => 'Verified';

  @override
  String get pendingStatus => 'Pending';

  @override
  String get rejected => 'Rejected';

  @override
  String get upload => 'Upload';

  @override
  String get documentUploadedSuccessfully => 'Document uploaded successfully';

  @override
  String get takePhoto => 'Take Photo';

  @override
  String get chooseFromGallery => 'Choose from Gallery';

  @override
  String get emergencySos => 'Emergency SOS';

  @override
  String get emergencyHelp => 'Emergency Help';

  @override
  String get sosMainDescription =>
      'Send an SOS alert to the admin team.\nThey will respond as quickly as possible.';

  @override
  String get whatIsHappening => 'What is happening?';

  @override
  String get sosReasonUnsafe => 'I feel unsafe';

  @override
  String get sosReasonAggressive => 'Customer is aggressive';

  @override
  String get sosReasonHarassment => 'Harassment';

  @override
  String get sosReasonTheft => 'Theft or robbery';

  @override
  String get sosReasonFakeIdentity => 'Customer not who they claim to be';

  @override
  String get sosReasonPaymentDispute => 'Dispute over payment';

  @override
  String get sosReasonPropertyDamage => 'Property damage';

  @override
  String get sosReasonOther => 'Other emergency';

  @override
  String get additionalDetails => 'Additional details (optional)';

  @override
  String get describeSituation => 'Describe the situation...';

  @override
  String get attachEvidence => 'Attach evidence (optional)';

  @override
  String get addPhotoEvidence => 'Add photo evidence';

  @override
  String addMorePhotos(int count) {
    return 'Add more ($count/3)';
  }

  @override
  String get sendingSos => 'Sending SOS...';

  @override
  String get sendSosAlert => 'SEND SOS ALERT';

  @override
  String get confirmSos => 'Confirm SOS';

  @override
  String get sosConfirmMessage =>
      'This will send an emergency alert to the admin team. False alerts may result in account penalties.\n\nAre you sure you want to proceed?';

  @override
  String get sendSos => 'Send SOS';

  @override
  String get emergencyContacts => 'Emergency Contacts';

  @override
  String get police => 'Police';

  @override
  String get ambulance => 'Ambulance';

  @override
  String get fire => 'Fire';

  @override
  String get sosSent => 'SOS Sent';

  @override
  String get sosAlertSentSuccessfully => 'SOS Alert Sent Successfully';

  @override
  String get sosSuccessMessage =>
      'Our admin team has been notified and will\nrespond as quickly as possible.\n\nStay safe and stay where you are if possible.';

  @override
  String get backToApp => 'Back to App';

  @override
  String get notificationsTitle => 'Notifications';

  @override
  String get markAllRead => 'Mark all read';

  @override
  String get retry => 'Retry';

  @override
  String get noNotificationsYet => 'No notifications yet';

  @override
  String get notificationsEmpty =>
      'You will receive notifications about\nyour bookings and updates here';

  @override
  String get justNow => 'Just now';

  @override
  String minutesAgo(int count) {
    return '${count}m ago';
  }

  @override
  String hoursAgo(int count) {
    return '${count}h ago';
  }

  @override
  String daysAgo(int count) {
    return '${count}d ago';
  }

  @override
  String get noMessagesYet => 'No messages yet';

  @override
  String startConversationWith(String name) {
    return 'Start a conversation with $name';
  }

  @override
  String get typeAMessage => 'Type a message...';

  @override
  String get chatNotAvailable => 'Chat is not available at the moment';

  @override
  String get somethingWentWrong => 'Something went wrong';

  @override
  String get error => 'Error';

  @override
  String get success => 'Success';

  @override
  String get loading => 'Loading...';

  @override
  String get noInternet => 'No Internet Connection';

  @override
  String get checkConnection =>
      'Please check your internet connection and try again';

  @override
  String get tryAgain => 'Please try again later';

  @override
  String get english => 'English';

  @override
  String get urdu => 'اردو';
}
