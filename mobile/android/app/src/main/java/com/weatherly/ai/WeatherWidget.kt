package com.weatherly.ai

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import android.content.SharedPreferences
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

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
                // Determine the correct SharedPreferences name
                // "WeatherlyWidgetPrefs" as defined in WidgetService.ts
                val prefs = context.getSharedPreferences("WeatherlyWidgetPrefs", Context.MODE_PRIVATE)

                val city = prefs.getString("city", "Open App")
                val desc = prefs.getString("description", "to sync weather")
                
                // Handle potential type mismatch for temperature (Int/Float/Double/String)
                var tempStr = "--"
                if (prefs.contains("temperature")) {
                     try {
                         tempStr = prefs.getInt("temperature", 0).toString()
                     } catch (e: Exception) {
                         try {
                             tempStr = Math.round(prefs.getFloat("temperature", 0f)).toString()
                         } catch (e2: Exception) {
                             try {
                                 // Fallback if saved as String
                                 tempStr = prefs.getString("temperature", "--") ?: "--"
                                 // Try to round if it's a number string
                                 tempStr = Math.round(tempStr.toFloatOrNull() ?: 0f).toString()
                             } catch (e3: Exception) {
                                 // ignore
                             }
                         }
                     }
                }

                var updatedAt = 0L
                try {
                    val updatedAtStr = prefs.getString("updatedAt", "0") ?: "0"
                    updatedAt = updatedAtStr.toLongOrNull() ?: 0L
                } catch (e: Exception) {
                    // unexpected error
                }

                val timeString = if (updatedAt > 0) {
                     SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(updatedAt))
                } else {
                    ""
                }

                // Construct the RemoteViews object
                val views = RemoteViews(context.packageName, R.layout.weather_widget)
                views.setTextViewText(R.id.widget_city, city)
                views.setTextViewText(R.id.widget_temp, "$tempStr°")
                views.setTextViewText(R.id.widget_desc, desc)
                views.setTextViewText(R.id.widget_updated, timeString)

                // Instruct the widget manager to update the widget
                appWidgetManager.updateAppWidget(appWidgetId, views)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
