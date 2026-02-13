package com.weatherly.ai

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.content.SharedPreferences
import android.util.Log
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import org.json.JSONObject
import org.json.JSONArray
import android.app.PendingIntent // Added missing import
import android.content.ComponentName

class AuroraWidget : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == "com.weatherly.ai.FORCE_UPDATE") {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val ids = appWidgetManager.getAppWidgetIds(ComponentName(context, AuroraWidget::class.java))
            onUpdate(context, appWidgetManager, ids)
        }
    }

    companion object {
        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            try {
                val views = RemoteViews(context.packageName, R.layout.aurora_widget)
                
                // 0. Setup Refresh Intent
                val intent = Intent(context, AuroraWidget::class.java)
                intent.action = "com.weatherly.ai.FORCE_UPDATE"
                val pendingIntent = PendingIntent.getBroadcast(
                    context, 0, intent, 
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.refresh_button, pendingIntent)

                // 1. Get Data
                val prefs = context.getSharedPreferences("WeatherlyWidgetPrefs", Context.MODE_PRIVATE)
                val auroraJson = prefs.getString("aurora", "{}") ?: "{}"
                
                // Background Gradient Logic (Reused from WeatherWidget)
                val opacityStr = prefs.getString("opacity", "255") ?: "255"
                val opacity = opacityStr.toIntOrNull() ?: 255
                val colorStartStr = prefs.getString("gradientStart", "#4facfe") ?: "#4facfe"
                val colorEndStr = prefs.getString("gradientEnd", "#00f2fe") ?: "#00f2fe"
                val fixedColor = prefs.getString("fixedColor", "") ?: ""
                
                val bgBitmap = WeatherWidget.createBackgroundBitmap(opacity, colorStartStr, colorEndStr, fixedColor)
                if (bgBitmap != null) {
                    views.setImageViewBitmap(R.id.widget_background_image, bgBitmap)
                }

                // 2. Parse & Update Stats
                try {
                    val aurora = JSONObject(auroraJson)
                    val currentKp = aurora.optDouble("kp", 0.0)
                    val visibilityProb = aurora.optDouble("visibilityProb", 0.0)
                    val maxKp = aurora.optDouble("maxKp", 0.0)
                    // val maxProb = aurora.optDouble("maxProb", 0.0)
                    val bestTime = aurora.optString("bestTime", "--:--")
                    val bestKp = aurora.optDouble("bestKp", 0.0)
                    val forecastJson = aurora.optJSONArray("forecast") ?: JSONArray()
                    
                    // Update Texts
                    views.setTextViewText(R.id.kp_value, String.format("%.1f", currentKp))
                    views.setTextColor(R.id.kp_value, getKpColor(currentKp))
                    
                    views.setTextViewText(R.id.visibility_value, "${visibilityProb.toInt()}%")
                    views.setTextViewText(R.id.max_kp_value, String.format("%.1f", maxKp))
                    views.setTextColor(R.id.max_kp_value, getKpColor(maxKp))

                    // Format Best Time
                    var formattedBestTime = bestTime
                     try {
                        if (bestTime.contains("T")) {
                             val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.getDefault())
                             val outputFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
                             val date = inputFormat.parse(bestTime)
                             formattedBestTime = outputFormat.format(date)
                        }
                    } catch (e: Exception) {}
                    
                    views.setTextViewText(R.id.best_time_text, "Best time: $formattedBestTime (Kp ${String.format("%.1f", bestKp)})")

                    // 3. Draw Chart
                    val chartBitmap = drawForecastChart(forecastJson)
                    views.setImageViewBitmap(R.id.widget_chart, chartBitmap)

                } catch (e: Exception) {
                    Log.e("AuroraWidget", "JSON parse error", e)
                }

                appWidgetManager.updateAppWidget(appWidgetId, views)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        
        private fun getKpColor(kp: Double): Int {
            return when {
                kp < 3 -> Color.parseColor("#22C55E") // green
                kp < 5 -> Color.parseColor("#EAB308") // yellow
                kp < 7 -> Color.parseColor("#F97316") // orange
                kp < 8 -> Color.parseColor("#EF4444") // red
                else -> Color.parseColor("#A855F7")   // purple
            }
        }
        
        private fun getKpColorAlpha(kp: Double): Int {
             val color = getKpColor(kp)
             // Apply alpha 50%
             return Color.argb(128, Color.red(color), Color.green(color), Color.blue(color))
        }

        private fun drawForecastChart(forecast: JSONArray): Bitmap {
            val width = 400
            val height = 100
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            val paint = Paint()
            
            val count = forecast.length()
            if (count == 0) return bitmap
            
            // Draw Bars
            val barWidth = width / count.toFloat()
            val spacing = 4f
            
            for (i in 0 until count) {
                val kp = forecast.getDouble(i)
                val barHeight = (kp / 9.0) * height // Scale to max Kp = 9
                
                // Ensure min height
                val finalHeight = if (barHeight < 10) 10f else barHeight.toFloat()
                
                val left = i * barWidth + spacing
                val right = (i + 1) * barWidth - spacing
                val top = height - finalHeight
                val bottom = height.toFloat()
                
                paint.color = getKpColorAlpha(kp)
                paint.style = Paint.Style.FILL
                
                val rect = RectF(left, top, right, bottom)
                // Draw rounded top corners (radius 8f) - using drawRoundRect logic or simple rect for now
                canvas.drawRect(rect, paint)
                
                // Draw top line for better visibility
                 val linePaint = Paint()
                 linePaint.color = getKpColor(kp)
                 linePaint.strokeWidth = 4f
                 canvas.drawLine(left, top, right, top, linePaint)
            }
            
            return bitmap
        }
    }
}
