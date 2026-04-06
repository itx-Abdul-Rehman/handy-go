// Handy Go Customer App - Widget Tests
//
// Basic widget tests for the customer application.

import 'package:flutter_test/flutter_test.dart';
import 'package:customer_app/app.dart';

void main() {
  testWidgets('App starts successfully', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const HandyGoApp());

    // Verify app starts (splash screen should be visible)
    await tester.pump();

    // Basic test that app renders
    expect(find.byType(HandyGoApp), findsOneWidget);
  });
}
