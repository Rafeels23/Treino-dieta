package com.rafeels23.pilar;

import android.Manifest;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.JSONArray;

/** Ponte do app (JavaScript) com os lembretes nativos. */
@CapacitorPlugin(
    name = "PilarLembretes",
    permissions = { @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notificacoes") }
)
public class PilarLembretesPlugin extends Plugin {

    private boolean precisaPermissao() { return Build.VERSION.SDK_INT >= 33; }

    @PluginMethod
    public void estado(PluginCall call) {
        JSObject r = new JSObject();
        r.put("permitido", !precisaPermissao() || getPermissionState("notificacoes") == PermissionState.GRANTED);
        call.resolve(r);
    }

    @PluginMethod
    public void pedirPermissao(PluginCall call) {
        if (!precisaPermissao() || getPermissionState("notificacoes") == PermissionState.GRANTED) {
            JSObject r = new JSObject(); r.put("permitido", true); call.resolve(r); return;
        }
        requestPermissionForAlias("notificacoes", call, "depoisPermissao");
    }

    @PermissionCallback
    private void depoisPermissao(PluginCall call) {
        JSObject r = new JSObject();
        r.put("permitido", getPermissionState("notificacoes") == PermissionState.GRANTED);
        call.resolve(r);
    }

    /** itens: [{ id, tipo, ref, titulo, texto, hora, minuto }] — substitui a agenda inteira. */
    @PluginMethod
    public void agendar(PluginCall call) {
        JSArray itens = call.getArray("itens", new JSArray());
        Agendador.salvarAgenda(getContext(), itens);
        call.resolve();
    }

    @PluginMethod
    public void pendentes(PluginCall call) {
        JSObject r = new JSObject();
        try { r.put("acoes", new JSArray(Agendador.prefs(getContext()).getString("acoes", "[]"))); }
        catch (Exception e) { r.put("acoes", new JSArray()); }
        call.resolve(r);
    }

    @PluginMethod
    public void limparPendentes(PluginCall call) {
        Agendador.prefs(getContext()).edit().putString("acoes", "[]").apply();
        call.resolve();
    }
}
