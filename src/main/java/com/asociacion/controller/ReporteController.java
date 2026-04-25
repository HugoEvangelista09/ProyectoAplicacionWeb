package com.asociacion.controller;

import com.asociacion.service.ReporteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    @Autowired
    private ReporteService reporteService;

    // GET /api/reportes/caja?fecha=2024-11-01
    @GetMapping("/caja")
    public ResponseEntity<Map<String, Object>> cajaDiaria(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {

        if (fecha == null) fecha = LocalDate.now();
        return ResponseEntity.ok(reporteService.reporteCajaDiario(fecha));
    }

    // GET /api/reportes/caja/rango?desde=2024-11-01&hasta=2024-11-30
    @GetMapping("/caja/rango")
    public ResponseEntity<Map<String, Object>> cajaRango(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(reporteService.reporteCajaRango(desde, hasta));
    }

    // GET /api/reportes/deudas-por-socio
    @GetMapping("/deudas-por-socio")
    public ResponseEntity<Map<String, Object>> deudaPorSocio() {
        return ResponseEntity.ok(reporteService.reporteDeudaPorSocio());
    }
}
