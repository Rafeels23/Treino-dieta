package com.rafeels23.pilar;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import java.util.Calendar;
import org.json.JSONArray;
import org.json.JSONObject;

/** Guarda a lista de lembretes e agenda cada um para o próximo horário (todo dia). */
public final class Agendador {
    static final String PREFS = "pilar_lembretes";
    static final String CANAL = "lembretes";

    private Agendador() {}

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    static JSONArray agenda(Context c) {
        try { return new JSONArray(prefs(c).getString("agenda", "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    static JSONObject item(Context c, int id) {
        JSONArray a = agenda(c);
        for (int i = 0; i < a.length(); i++) {
            JSONObject o = a.optJSONObject(i);
            if (o != null && o.optInt("id") == id) return o;
        }
        return null;
    }

    /** Canal sem som e sem vibração: a notificação só aparece na barra. */
    static void criarCanal(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CANAL) != null) return;
        NotificationChannel ch = new NotificationChannel(CANAL, "Lembretes", NotificationManager.IMPORTANCE_DEFAULT);
        ch.setDescription("Refeições e água, com ✓ e ✗ para marcar sem abrir o app");
        ch.setSound(null, null);
        ch.enableVibration(false);
        nm.createNotificationChannel(ch);
    }

    private static PendingIntent intencao(Context c, int id) {
        Intent i = new Intent(c, LembreteReceiver.class).putExtra("id", id);
        return PendingIntent.getBroadcast(c, id, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Próxima vez que o relógio marcar hora:minuto (hoje, se ainda não passou; senão amanhã). */
    static long proximo(int hora, int minuto) {
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, hora);
        cal.set(Calendar.MINUTE, minuto);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        if (cal.getTimeInMillis() <= System.currentTimeMillis() + 5000) cal.add(Calendar.DAY_OF_YEAR, 1);
        return cal.getTimeInMillis();
    }

    static void agendar(Context c, JSONObject o) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        long t = proximo(o.optInt("hora"), o.optInt("minuto"));
        // alarme não exato (não precisa de permissão especial); costuma tocar no minuto certo
        if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t, intencao(c, o.optInt("id")));
        else am.set(AlarmManager.RTC_WAKEUP, t, intencao(c, o.optInt("id")));
    }

    static void agendarTodos(Context c) {
        criarCanal(c);
        JSONArray a = agenda(c);
        for (int i = 0; i < a.length(); i++) {
            JSONObject o = a.optJSONObject(i);
            if (o != null) agendar(c, o);
        }
    }

    static void cancelarTodos(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        JSONArray a = agenda(c);
        for (int i = 0; i < a.length(); i++) {
            JSONObject o = a.optJSONObject(i);
            if (o != null && am != null) am.cancel(intencao(c, o.optInt("id")));
        }
    }

    static void salvarAgenda(Context c, JSONArray itens) {
        cancelarTodos(c);
        prefs(c).edit().putString("agenda", itens.toString()).apply();
        agendarTodos(c);
    }
}
