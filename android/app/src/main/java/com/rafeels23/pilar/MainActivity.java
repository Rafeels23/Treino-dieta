package com.rafeels23.pilar;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PilarLembretesPlugin.class); // lembretes com ✓ / ✗ na barra de notificações
        registerPlugin(SaudePlugin.class);          // pulseira (Health Connect)
        super.onCreate(savedInstanceState);
    }
}
