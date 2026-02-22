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
        
        // Update WeatherWidget
        sendUpdateBroadcast(context, WeatherWidget::class.java)
        // Update DailyWidget
        sendUpdateBroadcast(context, DailyWidget::class.java)
        // Update AstroWidget
        sendUpdateBroadcast(context, AstroWidget::class.java)
        // Update AuroraWidget
        sendUpdateBroadcast(context, AuroraWidget::class.java)
        
        android.util.Log.d("WidgetModule", "Broadcasts sent to all widgets")
    }

    private fun sendUpdateBroadcast(context: com.facebook.react.bridge.ReactContext, cls: Class<*>) {
        val intent = Intent("com.weatherly.ai.FORCE_UPDATE")
        intent.component = ComponentName(context, cls)
        
        val widgetManager = AppWidgetManager.getInstance(context)
        val ids = widgetManager.getAppWidgetIds(ComponentName(context, cls))
        
        if (ids.isNotEmpty()) {
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            context.sendBroadcast(intent)
            android.util.Log.d("WidgetModule", "Sent update to ${cls.simpleName} (${ids.size} widgets)")
        }
    }

    @ReactMethod
    fun setWidgetEnabled(widgetName: String, enabled: Boolean) {
        val context = reactApplicationContext
        val pm = context.packageManager
        val cls = when(widgetName) {
            "AstroWidget" -> AstroWidget::class.java
            "DailyWidget" -> DailyWidget::class.java
            "AuroraWidget" -> AuroraWidget::class.java
            "WeatherWidget" -> WeatherWidget::class.java
            else -> return
        }
        val compName = ComponentName(context, cls)
        val state = if (enabled) android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_ENABLED else android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_DISABLED
        pm.setComponentEnabledSetting(compName, state, android.content.pm.PackageManager.DONT_KILL_APP)
    }
}
