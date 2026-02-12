package com.weatherly.ai

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import android.content.SharedPreferences
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

    companion object {
        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            try {
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

                // Get gradient colors
                val colorStartStr = prefs.getString("gradientStart", "#4facfe") ?: "#4facfe"
                val colorEndStr = prefs.getString("gradientEnd", "#00f2fe") ?: "#00f2fe"

                // Get weather code for icon
                val weatherCodeStr = prefs.getString("weatherCode", "0") ?: "0"
                val weatherCode = weatherCodeStr.toIntOrNull() ?: 0

                val views = RemoteViews(context.packageName, R.layout.weather_widget)
                
                // 1. Set Text
                views.setTextViewText(R.id.widget_city, city)
                views.setTextViewText(R.id.widget_temperature, "$tempStr°")
                views.setTextViewText(R.id.widget_description, desc)
                views.setTextViewText(R.id.widget_updated, timeString)

                // 2. Set Icon
                val iconRes = getWeatherIcon(weatherCode)
                views.setImageViewResource(R.id.widget_icon, iconRes)

                // 3. Set Dynamic Gradient Background via Bitmap
                try {
                    val width = 400
                    val height = 400
                    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                    val canvas = Canvas(bitmap)
                    val paint = Paint()
                    
                    val startColor = Color.parseColor(colorStartStr)
                    val endColor = Color.parseColor(colorEndStr)
                    val shader = LinearGradient(0f, 0f, 0f, height.toFloat(), startColor, endColor, Shader.TileMode.CLAMP)
                    paint.shader = shader
                    
                    // Draw a full rectangle (let the system/widget container handle corner clipping)
                    // If we draw rounded corners here, we might conflict with system corners
                    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
                    
                    views.setImageViewBitmap(R.id.widget_background_image, bitmap)
                } catch (e: Exception) {
                    e.printStackTrace()
                }

                // Instruct the widget manager to update the widget
                appWidgetManager.updateAppWidget(appWidgetId, views)
            } catch (e: Exception) {
                e.printStackTrace()
            }
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
