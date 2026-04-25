package com.asociacion.controller;

import com.asociacion.dto.PagoRequestDTO;
import com.asociacion.dto.PagoResponseDTO;
import com.asociacion.service.PagoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    @Autowired
    private PagoService pagoService;

    // GET /api/pagos?socioId=5
    @GetMapping
    public ResponseEntity<List<PagoResponseDTO>> listar(
            @RequestParam(required = false) Long socioId) {
        return ResponseEntity.ok(pagoService.listarPorSocio(socioId));
    }

    // GET /api/pagos/{id}
    @GetMapping("/{id}")
    public ResponseEntity<PagoResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(pagoService.buscarPorId(id));
    }

    // POST /api/pagos
    @PostMapping
    public ResponseEntity<PagoResponseDTO> registrarPago(@Valid @RequestBody PagoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pagoService.registrarPago(dto));
    }
}
