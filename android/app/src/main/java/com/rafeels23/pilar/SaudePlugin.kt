package com.rafeels23.pilar

import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateGroupByPeriodRequest
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.Period
import java.time.ZoneId
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/** Pulseira (Amazfit pelo app Zepp): lê do Health Connect passos, calorias ativas, sono e exercícios. Só leitura. */
@CapacitorPlugin(name = "PilarSaude")
class SaudePlugin : Plugin() {
    private val escopo = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val permissoes = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
    )

    private fun status(): String = when (HealthConnectClient.getSdkStatus(context)) {
        HealthConnectClient.SDK_AVAILABLE -> "ok"
        HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "atualizar"
        else -> "indisponivel"
    }

    @PluginMethod
    fun estado(call: PluginCall) {
        val st = status()
        if (st != "ok") { call.resolve(JSObject().put("status", st).put("permitido", false)); return }
        escopo.launch {
            try {
                val dadas = HealthConnectClient.getOrCreate(context).permissionController.getGrantedPermissions()
                call.resolve(JSObject().put("status", st).put("permitido", dadas.containsAll(permissoes)))
            } catch (e: Exception) { call.reject(e.message ?: "erro") }
        }
    }

    @PluginMethod
    fun pedirPermissoes(call: PluginCall) {
        if (status() != "ok") { call.resolve(JSObject().put("permitido", false).put("status", status())); return }
        val intent = PermissionController.createRequestPermissionResultContract().createIntent(context, permissoes)
        startActivityForResult(call, intent, "depoisPermissoes")
    }

    @ActivityCallback
    private fun depoisPermissoes(call: PluginCall, result: ActivityResult) {
        escopo.launch {
            try {
                val dadas = HealthConnectClient.getOrCreate(context).permissionController.getGrantedPermissions()
                call.resolve(JSObject().put("permitido", dadas.containsAll(permissoes)).put("status", "ok"))
            } catch (e: Exception) { call.reject(e.message ?: "erro") }
        }
    }

    /** dias: quantos dias para trás ler (inclui hoje). */
    @PluginMethod
    fun ler(call: PluginCall) {
        val dias = (call.getInt("dias") ?: 7).coerceIn(1, 60)
        escopo.launch {
            try {
                val hc = HealthConnectClient.getOrCreate(context)
                val zona = ZoneId.systemDefault()
                val ini = LocalDate.now().minusDays((dias - 1).toLong()).atStartOfDay()
                val fim = LocalDateTime.now()
                val faixa = TimeRangeFilter.between(ini, fim)
                val faixaInstante = TimeRangeFilter.between(ini.atZone(zona).toInstant(), Instant.now())

                // passos e calorias ativas por dia
                val porDia = JSArray()
                val grupos = hc.aggregateGroupByPeriod(AggregateGroupByPeriodRequest(
                    metrics = setOf(StepsRecord.COUNT_TOTAL, ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL),
                    timeRangeFilter = faixa, timeRangeSlicer = Period.ofDays(1)))
                for (g in grupos) {
                    porDia.put(JSObject()
                        .put("data", g.startTime.toLocalDate().toString())
                        .put("passos", g.result[StepsRecord.COUNT_TOTAL] ?: 0L)
                        .put("kcal", Math.round(g.result[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories ?: 0.0)))
                }

                // sono: cada sessão (o app soma por noite)
                val sono = JSArray()
                for (r in hc.readRecords(ReadRecordsRequest(SleepSessionRecord::class, faixaInstante)).records) {
                    sono.put(JSObject()
                        .put("fim", r.endTime.atZone(zona).toLocalDate().toString())
                        .put("minutos", (r.endTime.epochSecond - r.startTime.epochSecond) / 60))
                }

                // exercícios registrados na pulseira
                val exercicios = JSArray()
                for (r in hc.readRecords(ReadRecordsRequest(ExerciseSessionRecord::class, faixaInstante)).records) {
                    val janela = TimeRangeFilter.between(r.startTime, r.endTime)
                    val agg = hc.aggregate(AggregateRequest(setOf(ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL, DistanceRecord.DISTANCE_TOTAL), janela))
                    exercicios.put(JSObject()
                        .put("id", r.metadata.id)
                        .put("tipo", tipoDe(r.exerciseType))
                        .put("titulo", r.title ?: "")
                        .put("data", r.startTime.atZone(zona).toLocalDate().toString())
                        .put("hora", r.startTime.atZone(zona).toLocalTime().toString().take(5))
                        .put("minutos", (r.endTime.epochSecond - r.startTime.epochSecond) / 60)
                        .put("kcal", Math.round(agg[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories ?: 0.0))
                        .put("km", Math.round((agg[DistanceRecord.DISTANCE_TOTAL]?.inKilometers ?: 0.0) * 10) / 10.0))
                }

                call.resolve(JSObject().put("dias", porDia).put("sono", sono).put("exercicios", exercicios))
            } catch (e: SecurityException) {
                call.reject("sem_permissao")
            } catch (e: Exception) {
                call.reject(e.message ?: "erro")
            }
        }
    }

    private fun tipoDe(t: Int): String = when (t) {
        ExerciseSessionRecord.EXERCISE_TYPE_WALKING -> "caminhada"
        ExerciseSessionRecord.EXERCISE_TYPE_RUNNING, ExerciseSessionRecord.EXERCISE_TYPE_RUNNING_TREADMILL -> "corrida"
        ExerciseSessionRecord.EXERCISE_TYPE_BIKING, ExerciseSessionRecord.EXERCISE_TYPE_BIKING_STATIONARY -> "bike"
        ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_POOL, ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_OPEN_WATER -> "natacao"
        ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING, ExerciseSessionRecord.EXERCISE_TYPE_WEIGHTLIFTING -> "musculacao"
        ExerciseSessionRecord.EXERCISE_TYPE_HIKING -> "trilha"
        ExerciseSessionRecord.EXERCISE_TYPE_ELLIPTICAL -> "eliptico"
        ExerciseSessionRecord.EXERCISE_TYPE_YOGA, ExerciseSessionRecord.EXERCISE_TYPE_PILATES -> "yoga"
        ExerciseSessionRecord.EXERCISE_TYPE_HIGH_INTENSITY_INTERVAL_TRAINING -> "hiit"
        ExerciseSessionRecord.EXERCISE_TYPE_SOCCER -> "futebol"
        ExerciseSessionRecord.EXERCISE_TYPE_DANCING -> "danca"
        ExerciseSessionRecord.EXERCISE_TYPE_STAIR_CLIMBING, ExerciseSessionRecord.EXERCISE_TYPE_STAIR_CLIMBING_MACHINE -> "escada"
        ExerciseSessionRecord.EXERCISE_TYPE_ROWING_MACHINE, ExerciseSessionRecord.EXERCISE_TYPE_ROWING -> "remo"
        else -> "outro"
    }
}
