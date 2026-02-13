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
import org.json.JSONArray
import org.json.JSONObject

class DailyWidget : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == "com.weatherly.ai.FORCE_UPDATE") {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisAppWidget = ComponentName(context.packageName, DailyWidget::class.java.name)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(thisAppWidget)
            onUpdate(context, appWidgetManager, appWidgetIds)
        }
    }

    companion object {
        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            try {
                val prefs = context.getSharedPreferences("WeatherlyWidgetPrefs", Context.MODE_PRIVATE)
                val views = RemoteViews(context.packageName, R.layout.daily_widget)

                // 1. Load Data
                val city = prefs.getString("city", "Weatherly") ?: "Weatherly"
                val dailyJson = prefs.getString("daily", "[]") ?: "[]"
                
                views.setTextViewText(R.id.location_name, city.uppercase())

                // 2. Parse JSON
                try {
                    val dailyArray = JSONArray(dailyJson)
                    // Reset all to empty first
                    // (Assuming 3 rows hardcoded in XML)
                    
                    for (i in 0 until 3) {
                        val rowId = i + 1
                        val nameId = context.resources.getIdentifier("day${rowId}_name", "id", context.packageName)
                        val tempId = context.resources.getIdentifier("day${rowId}_temp", "id", context.packageName)
                        val iconId = context.resources.getIdentifier("day${rowId}_icon", "id", context.packageName)

                        if (i < dailyArray.length()) {
                            val day = dailyArray.getJSONObject(i)
                            views.setTextViewText(nameId, day.getString("date"))
                            views.setTextViewText(tempId, "${day.getInt("maxTemp")}° / ${day.getInt("minTemp")}°")
                            
                            // Map icon
                            val weatherCode = day.getInt("weatherCode")
                            val iconResId = WeatherWidget.getWeatherIcon(weatherCode) // Always day icon for forecast
                            views.setImageViewResource(iconId, iconResId)
                        } else {
                            views.setTextViewText(nameId, "")
                            views.setTextViewText(tempId, "")
                            views.setImageViewResource(iconId, 0)
                        }
                    }
                } catch (e: Exception) {
                    Log.e("DailyWidget", "JSON parse error", e)
                }

                // 3. Background/Theme
                // Reuse parsing logic from WeatherWidget - simplified here
                val opacityStr = prefs.getString("opacity", "255") ?: "255"
                val opacity = opacityStr.toIntOrNull() ?: 255
                val colorStartStr = prefs.getString("gradientStart", "#4facfe") ?: "#4facfe"
                val colorEndStr = prefs.getString("gradientEnd", "#00f2fe") ?: "#00f2fe"
                val fixedColor = prefs.getString("fixedColor", "") ?: ""

                // Draw background
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
                    Log.e("DailyWidget", "Bg error", e)
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
                refreshIntent.component = ComponentName(context, DailyWidget::class.java)
                val refreshPendingIntent = PendingIntent.getBroadcast(
                    context, appWidgetId, refreshIntent, 
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.refresh_button, refreshPendingIntent)


                appWidgetManager.updateAppWidget(appWidgetId, views)
            } catch (e: Exception) {
                Log.e("DailyWidget", "Update failed", e)
            }
        }
    }
}
