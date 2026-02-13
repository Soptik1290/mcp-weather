package com.weatherly.ai

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.content.SharedPreferences
import android.util.Log // Added Log
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Shader
import android.graphics.RectF

class WeatherWidget : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        // There may be multiple widgets active, so update all of them
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d("WeatherWidget", "onReceive called with action: ${intent.action}")
        super.onReceive(context, intent)
        
        if (intent.action == "com.weatherly.ai.FORCE_UPDATE" || intent.action == "com.weatherly.ai.TOGGLE_VIEW") {
            // ... (keep logic)
        }
    }

    companion object {
        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            Log.d("WeatherWidget", "updateAppWidget called for ID: $appWidgetId")
            try {
                // ...
                val prefs = context.getSharedPreferences("WeatherlyWidgetPrefs", Context.MODE_PRIVATE)

                val city = prefs.getString("city", "Weatherly") ?: "Weatherly"
                val desc = prefs.getString("description", "Update in app") ?: "Update in app"
                val tempStr = prefs.getString("temperature", "--") ?: "--"
                
                // Parse update time
                var updatedAt = 0L
                try {
                    val updatedAtStr = prefs.getString("updatedAt", "0") ?: "0"
                    updatedAt = updatedAtStr.toLongOrNull() ?: 0L
                } catch (e: Exception) { }

                val timeString = if (updatedAt > 0) {
                     SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(updatedAt))
                } else {
                    "--:--"
                }

                // Get opacity
                val opacityStr = prefs.getString("opacity", "255") ?: "255"
                val opacity = opacityStr.toIntOrNull() ?: 255

                // Get gradient colors
                val colorStartStr = prefs.getString("gradientStart", "#4facfe") ?: "#4facfe"
                val colorEndStr = prefs.getString("gradientEnd", "#00f2fe") ?: "#00f2fe"

                // Get widget theme/customization
                val theme = prefs.getString("theme", "auto") ?: "auto"
                val fixedColor = prefs.getString("fixedColor", "") ?: ""

                // Get weather code for icon
                val weatherCodeStr = prefs.getString("weatherCode", "0") ?: "0"
                val weatherCode = weatherCodeStr.toIntOrNull() ?: 0

                // Get View Mode
                val viewMode = prefs.getString("view_mode", "current") ?: "current"

                val views = RemoteViews(context.packageName, R.layout.weather_widget)
                
                // 0. Toggle Button Intent
                val toggleIntent = android.content.Intent(context, WeatherWidget::class.java)
                toggleIntent.action = "com.weatherly.ai.TOGGLE_VIEW"
                val togglePendingIntent = android.app.PendingIntent.getBroadcast(
                    context, 
                    0, 
                    toggleIntent, 
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_action_button, togglePendingIntent)

                // App Launch Intent (Background)
                val appIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
                if (appIntent != null) {
                    val pendingIntent = android.app.PendingIntent.getActivity(
                        context, 0, appIntent, 
                        android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
                    )
                    views.setOnClickPendingIntent(R.id.widget_background_image, pendingIntent)
                }
                
                // Toggle Views
                if (viewMode == "hourly") {
                    views.setViewVisibility(R.id.widget_content, android.view.View.GONE)
                    views.setViewVisibility(R.id.widget_hourly_view, android.view.View.VISIBLE)
                    
                    // Load Hourly Data
                    val hourlyJson = prefs.getString("hourly", "[]") ?: "[]"
                    try {
                        val jsonArray = org.json.JSONArray(hourlyJson)
                        for (i in 0 until minOf(3, jsonArray.length())) {
                            val item = jsonArray.getJSONObject(i)
                            val time = item.getString("time")
                            val temp = item.getDouble("temperature").toInt()
                            val code = item.getInt("weatherCode")
                            val icon = getWeatherIcon(code)
                            
                            val timeId = context.resources.getIdentifier("hourly_time_${i+1}", "id", context.packageName)
                            val tempId = context.resources.getIdentifier("hourly_temp_${i+1}", "id", context.packageName)
                            val iconId = context.resources.getIdentifier("hourly_icon_${i+1}", "id", context.packageName)
                            
                            views.setTextViewText(timeId, time)
                            views.setTextViewText(tempId, "$temp°")
                            views.setImageViewResource(iconId, icon)
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                    
                } else {
                    views.setViewVisibility(R.id.widget_content, android.view.View.VISIBLE)
                    views.setViewVisibility(R.id.widget_hourly_view, android.view.View.GONE)
                    
                    // 1. Set Text
                    views.setTextViewText(R.id.widget_city, city)
                    views.setTextViewText(R.id.widget_temperature, "$tempStr°")
                    views.setTextViewText(R.id.widget_description, desc)
                    views.setTextViewText(R.id.widget_updated, timeString)
                    
                    // 2. Set Icon
                    val iconRes = getWeatherIcon(weatherCode)
                    views.setImageViewResource(R.id.widget_icon, iconRes)
                    
                    // Theme adjustments...
                    if (theme == "light") {
                        val darkText = Color.parseColor("#333333")
                        views.setTextColor(R.id.widget_city, darkText)
                        views.setTextColor(R.id.widget_temperature, darkText)
                        views.setTextColor(R.id.widget_description, darkText)
                        views.setTextColor(R.id.widget_updated, darkText)
                        views.setInt(R.id.widget_icon, "setColorFilter", darkText)
                    }
                }

                // 3. Set Dynamic Gradient Background via Bitmap
                // 3. Set Dynamic Gradient Background via Bitmap
                try {
                    val width = 400
                    val height = 400
                    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                    val canvas = Canvas(bitmap)
                    val paint = Paint()
                    
                    if (fixedColor.isNotEmpty()) {
                        // Solid color
                        try {
                            paint.color = Color.parseColor(fixedColor)
                        } catch (e: IllegalArgumentException) {
                            Log.e("WeatherWidget", "Invalid fixedColor: $fixedColor", e)
                            paint.color = Color.DKGRAY // Fallback
                        }
                    } else {
                        // Gradient
                        try {
                            val startColor = Color.parseColor(colorStartStr)
                            val endColor = Color.parseColor(colorEndStr)
                            val shader = LinearGradient(0f, 0f, 0f, height.toFloat(), startColor, endColor, Shader.TileMode.CLAMP)
                            paint.shader = shader
                        } catch (e: IllegalArgumentException) {
                            Log.e("WeatherWidget", "Invalid gradient colors: $colorStartStr, $colorEndStr", e)
                            paint.color = Color.DKGRAY // Fallback
                        }
                    }
                    
                    // Apply opacity
                    paint.alpha = opacity
                    
                    // Draw a full rectangle (let the system/widget container handle corner clipping)
                    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
                    
                    views.setImageViewBitmap(R.id.widget_background_image, bitmap)
                } catch (e: Exception) {
                    Log.e("WeatherWidget", "Failed to generate background bitmap", e)
                    e.printStackTrace()
                }

                // Instruct the widget manager to update the widget
                appWidgetManager.updateAppWidget(appWidgetId, views)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        
        private fun minOf(a: Int, b: Int): Int {
            return if (a <= b) a else b
        }

        private fun getWeatherIcon(code: Int): Int {
            return when (code) {
                0, 1 -> R.drawable.ic_clear        // Clear
                2 -> R.drawable.ic_cloudy          // Partly cloudy
                3 -> R.drawable.ic_cloudy          // Overcast
                45, 48 -> R.drawable.ic_fog        // Fog
                51, 53, 55, 56, 57 -> R.drawable.ic_rain // Drizzle
                61, 63, 65, 66, 67 -> R.drawable.ic_rain // Rain
                71, 73, 75, 77 -> R.drawable.ic_snow     // Snow
                80, 81, 82 -> R.drawable.ic_rain         // Showers
                85, 86 -> R.drawable.ic_snow             // Snow showers
                95, 96, 99 -> R.drawable.ic_storm        // Thunderstorm
                else -> R.drawable.ic_clear
            }
        }
    }
}
