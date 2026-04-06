package com.handygo.customer_app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import androidx.core.app.ActivityCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.handygo/phone_number"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "getPhoneNumbers" -> {
                    if (ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED ||
                        (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_NUMBERS) != PackageManager.PERMISSION_GRANTED)) {
                        result.error("PERMISSION_DENIED", "Phone state permission not granted", null)
                        return@setMethodCallHandler
                    }
                    try {
                        val phoneNumbers = getSimPhoneNumbers()
                        result.success(phoneNumbers)
                    } catch (e: Exception) {
                        result.error("ERROR", "Failed to get phone numbers: ${e.message}", null)
                    }
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun getSimPhoneNumbers(): List<Map<String, String?>> {
        val numbers = mutableListOf<Map<String, String?>>()

        try {
            // Method 1: SubscriptionManager (Android 5.1+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                val subscriptionManager = getSystemService(TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
                if (subscriptionManager != null) {
                    if (ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                        val subscriptions = subscriptionManager.activeSubscriptionInfoList
                        if (subscriptions != null) {
                            for (info in subscriptions) {
                                val number = info.number
                                if (!number.isNullOrBlank()) {
                                    numbers.add(mapOf(
                                        "phone" to number,
                                        "carrier" to (info.carrierName?.toString() ?: "Unknown"),
                                        "slot" to info.simSlotIndex.toString(),
                                        "countryIso" to (info.countryIso ?: "")
                                    ))
                                }
                            }
                        }
                    }
                }
            }

            // Method 2: TelephonyManager fallback
            if (numbers.isEmpty()) {
                val telephonyManager = getSystemService(TELEPHONY_SERVICE) as? TelephonyManager
                if (telephonyManager != null) {
                    if (ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                        val line1 = telephonyManager.line1Number
                        if (!line1.isNullOrBlank()) {
                            numbers.add(mapOf(
                                "phone" to line1,
                                "carrier" to (telephonyManager.networkOperatorName ?: "Unknown"),
                                "slot" to "0",
                                "countryIso" to (telephonyManager.simCountryIso ?: "")
                            ))
                        }
                    }
                }
            }
        } catch (e: SecurityException) {
            // Permission revoked at runtime
        }

        return numbers
    }
}
