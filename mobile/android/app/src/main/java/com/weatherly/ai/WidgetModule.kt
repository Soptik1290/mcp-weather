package com.weatherly.ai

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WidgetModule"
    }

    @ReactMethod
    fun reloadAllWidgets() {
        android.util.Log.d("WidgetModule", "reloadAllWidgets called")
        val context = reactApplicationContext
        
        // Use exact same intent structure that worked via ADB
        val intent = Intent("com.weatherly.ai.FORCE_UPDATE")
        intent.component = ComponentName(context, WeatherWidget::class.java)
        
        val widgetManager = AppWidgetManager.getInstance(context)
        val ids = widgetManager.getAppWidgetIds(ComponentName(context, WeatherWidget::class.java))
        android.util.Log.d("WidgetModule", "Found ${ids.size} widgets to update")
        
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        context.sendBroadcast(intent)
        android.util.Log.d("WidgetModule", "Broadcast sent to com.weatherly.ai.FORCE_UPDATE")
    }
}
