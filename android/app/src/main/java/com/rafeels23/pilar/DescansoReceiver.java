package com.rafeels23.pilar;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

/** Fim do descanso entre séries: avisa com som e vibração mesmo com a tela bloqueada. */
public class DescansoReceiver extends BroadcastReceiver {
    static final String CANAL = "descanso";
    static final int ID = 7001;

    static void criarCanal(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CANAL) != null) return;
        NotificationChannel ch = new NotificationChannel(CANAL, "Fim do descanso", NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("Avisa quando acaba o descanso entre as séries");
        ch.enableVibration(true);
        ch.setVibrationPattern(new long[] { 0, 300, 120, 300 });
        nm.createNotificationChannel(ch);
    }

    private static PendingIntent intencao(Context c, String texto) {
        Intent i = new Intent(c, DescansoReceiver.class).putExtra("texto", texto);
        return PendingIntent.getBroadcast(c, ID, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void agendar(Context c, long quando, String texto) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = intencao(c, texto);
        boolean exato = Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
        if (exato && Build.VERSION.SDK_INT >= 23) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, quando, pi);
        else if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, quando, pi);
        else am.setExact(AlarmManager.RTC_WAKEUP, quando, pi);
    }

    static void cancelar(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(intencao(c, ""));
        NotificationManagerCompat.from(c).cancel(ID);
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        criarCanal(c);
        Intent abrir = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent piAbrir = PendingIntent.getActivity(c, ID, abrir, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String texto = intent.getStringExtra("texto");
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CANAL)
            .setSmallIcon(R.drawable.ic_stat_pilar)
            .setContentTitle("Descanso acabou. Bora!")
            .setContentText(texto == null || texto.isEmpty() ? "Hora da próxima série" : texto)
            .setContentIntent(piAbrir)
            .setAutoCancel(true)
            .setTimeoutAfter(3 * 60 * 1000)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVibrate(new long[] { 0, 300, 120, 300 });
        try { NotificationManagerCompat.from(c).notify(ID, b.build()); } catch (SecurityException ignored) { }
    }
}
