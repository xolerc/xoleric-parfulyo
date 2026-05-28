package com.xoleric.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class WeatherWidget extends AppWidgetProvider {

    private static final String PREFS = "xoleric_widget";
    private static final String KEY_TEMP = "weather_temp";
    private static final String KEY_ICON = "weather_icon";
    private static final String KEY_DESC = "weather_desc";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, id);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager manager, int id) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_weather);
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        views.setTextViewText(R.id.widget_weather_temp, prefs.getString(KEY_TEMP, "--°"));
        views.setTextViewText(R.id.widget_weather_icon, prefs.getString(KEY_ICON, "☀️"));
        views.setTextViewText(R.id.widget_weather_desc, prefs.getString(KEY_DESC, "Yuklanmoqda..."));

        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(context, 1, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(android.R.id.root, pi);

        manager.updateAppWidget(id, views);
    }

    public static void updateWeather(Context context, String temp, String icon, String desc) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit()
                .putString(KEY_TEMP, temp)
                .putString(KEY_ICON, icon)
                .putString(KEY_DESC, desc)
                .apply();

        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        int[] ids = mgr.getAppWidgetIds(
                new android.content.ComponentName(context, WeatherWidget.class));
        for (int id : ids) {
            updateAppWidget(context, mgr, id);
        }
    }
}
