package com.rafeels23.pilar;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.app.NotificationManagerCompat;
import org.json.JSONArray;
import org.json.JSONObject;

/** ✓ ou ✗ tocado na notificação: guarda a resposta (o app aplica quando abrir) e some com a notificação. */
public class AcaoReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent intent) {
        try {
            JSONArray acoes = new JSONArray(Agendador.prefs(c).getString("acoes", "[]"));
            JSONObject a = new JSONObject()
                .put("tipo", intent.getStringExtra("tipo"))
                .put("ref", intent.getStringExtra("ref"))
                .put("data", intent.getStringExtra("data"))
                .put("resposta", intent.getStringExtra("resposta"))
                .put("em", System.currentTimeMillis());
            acoes.put(a);
            Agendador.prefs(c).edit().putString("acoes", acoes.toString()).apply();
        } catch (Exception ignored) { }
        NotificationManagerCompat.from(c).cancel(intent.getIntExtra("id", 0));
    }
}
