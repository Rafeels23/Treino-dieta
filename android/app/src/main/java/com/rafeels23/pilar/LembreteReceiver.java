package com.rafeels23.pilar;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import org.json.JSONObject;

/** Na hora do lembrete: mostra a notificação com ✓ Sim / ✗ Não e já agenda o de amanhã. */
public class LembreteReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent intent) {
        int id = intent.getIntExtra("id", 0);
        JSONObject o = Agendador.item(c, id);
        if (o == null) return;
        Agendador.criarCanal(c);
        String data = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());

        Intent abrir = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent piAbrir = PendingIntent.getActivity(c, id, abrir, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder b = new NotificationCompat.Builder(c, Agendador.CANAL)
            .setSmallIcon(R.drawable.ic_stat_pilar)
            .setContentTitle(o.optString("titulo", "Pilar"))
            .setContentText(o.optString("texto", ""))
            .setContentIntent(piAbrir)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .addAction(0, "✓ Sim", acao(c, id, o, data, "sim"))
            .addAction(0, "✗ Não", acao(c, id, o, data, "nao"));
        try {
            NotificationManagerCompat.from(c).notify(id, b.build());
        } catch (SecurityException ignored) {
            // sem permissão de notificação: não mostra nada
        }
        Agendador.agendar(c, o); // repete amanhã no mesmo horário
    }

    private static PendingIntent acao(Context c, int id, JSONObject o, String data, String resposta) {
        Intent i = new Intent(c, AcaoReceiver.class)
            .putExtra("id", id)
            .putExtra("tipo", o.optString("tipo"))
            .putExtra("ref", o.optString("ref"))
            .putExtra("data", data)
            .putExtra("resposta", resposta);
        int req = id * 2 + ("sim".equals(resposta) ? 1 : 0);
        return PendingIntent.getBroadcast(c, req, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
