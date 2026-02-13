package com.weatherly.ai

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Shader
import android.util.Log
import android.widget.RemoteViews
import org.json.JSONObject

class AstroWidget : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == "com.weatherly.ai.FORCE_UPDATE") {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisAppWidget = ComponentName(context.packageName, AstroWidget::class.java.name)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(thisAppWidget)
            onUpdate(context, appWidgetManager, appWidgetIds)
        }
    }

    companion object {
        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            try {
                val prefs = context.getSharedPreferences("WeatherlyWidgetPrefs", Context.MODE_PRIVATE)
                val views = RemoteViews(context.packageName, R.layout.astro_widget)

                // 1. Load Data
                val astroJson = prefs.getString("astronomy", "{}") ?: "{}"
                val auroraJson = prefs.getString("aurora", "{}") ?: "{}"
                
                // 2. Parse & Update UI
                try {
                    val astro = JSONObject(astroJson)
                    var sunrise = astro.optString("sunrise", "--:--")
                    var sunset = astro.optString("sunset", "--:--")
                    val moonPhase = astro.optString("moonPhase", "Unknown")
                    
                    // Format ISO times (YYYY-MM-DDTHH:mm) to HH:mm
                    try {
                        // Handle potential timezone or seconds if present, though likely just T-separated
                        if (sunrise.contains("T")) {
                             val inputFormat = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm", java.util.Locale.getDefault())
                             val outputFormat = java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault())
                             val date = inputFormat.parse(sunrise)
                             sunrise = outputFormat.format(date)
                        }
                        if (sunset.contains("T")) {
                             val inputFormat = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm", java.util.Locale.getDefault())
                             val outputFormat = java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault())
                             val date = inputFormat.parse(sunset)
                             sunset = outputFormat.format(date)
                        }
                    } catch (e: Exception) {
                        Log.e("AstroWidget", "Time parse error", e)
                    }
                    
                    views.setTextViewText(R.id.sun_text, "$sunrise  $sunset")
                    views.setTextViewText(R.id.moon_text, moonPhase)
                    
                    val aurora = JSONObject(auroraJson)
                    val kp = aurora.optDouble("kp", 0.0)
                    val prob = aurora.optDouble("visibilityProb", 0.0)
                    
                    if (kp > 0) {
                         views.setTextViewText(R.id.aurora_text, "Aurora: Kp %.1f (%d%%)".format(kp, prob.toInt()))
                    } else {
                         views.setTextViewText(R.id.aurora_text, "Aurora data unavailable")
                    }

                } catch (e: Exception) {
                    Log.e("AstroWidget", "JSON parse error", e)
                }

                // 3. Background/Theme (Reuse logic)
                val opacityStr = prefs.getString("opacity", "255") ?: "255"
                val opacity = opacityStr.toIntOrNull() ?: 255
                val colorStartStr = prefs.getString("gradientStart", "#1a0a2e") ?: "#1a0a2e"
                val colorEndStr = prefs.getString("gradientEnd", "#1a1a2e") ?: "#1a1a2e"
                val fixedColor = prefs.getString("fixedColor", "") ?: ""

                try {
                    val width = 400
                    val height = 400
                    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                    val canvas = Canvas(bitmap)
                    val paint = Paint()

                    if (fixedColor.isNotEmpty()) {
                         try {
                            paint.color = Color.parseColor(fixedColor)
                        } catch (e: Exception) { paint.color = Color.DKGRAY }
                    } else {
                        try {
                            val startColor = Color.parseColor(colorStartStr)
                            val endColor = Color.parseColor(colorEndStr)
                            val shader = LinearGradient(0f, 0f, 0f, height.toFloat(), startColor, endColor, Shader.TileMode.CLAMP)
                            paint.shader = shader
                        } catch (e: Exception) { paint.color = Color.DKGRAY }
                    }
                    paint.alpha = opacity
                    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
                    views.setImageViewBitmap(R.id.widget_background_image, bitmap)
                } catch (e: Exception) {
                    Log.e("AstroWidget", "Bg error", e)
                }

                // 4. PendingIntent to open app
                val intent = try {
                    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
                    launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                } catch (e: Exception) { null }

                if (intent != null) {
                    val pendingIntent = PendingIntent.getActivity(
                        context, 0, intent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )
                    views.setOnClickPendingIntent(R.id.widget_background_image, pendingIntent)
                }
                
                // Refresh button
                val refreshIntent = Intent("com.weatherly.ai.FORCE_UPDATE")
                refreshIntent.component = ComponentName(context, AstroWidget::class.java)
                val refreshPendingIntent = PendingIntent.getBroadcast(
                    context, appWidgetId, refreshIntent, 
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.refresh_button, refreshPendingIntent)

                appWidgetManager.updateAppWidget(appWidgetId, views)
            } catch (e: Exception) {
                Log.e("AstroWidget", "Update failed", e)
            }
        }
    }
}
