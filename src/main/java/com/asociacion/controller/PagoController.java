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

    // GET /api/pagos?socioId=5&buscar=term
    @GetMapping
    public ResponseEntity<List<PagoResponseDTO>> listar(
            @RequestParam(required = false) Long socioId,
            @RequestParam(required = false) String buscar) {
        if (buscar != null && !buscar.isBlank()) {
            if (socioId != null) {
                return ResponseEntity.ok(pagoService.buscarPorSocio(socioId, buscar));
            }
            return ResponseEntity.ok(pagoService.buscar(buscar));
        }
        if (socioId != null) {
            return ResponseEntity.ok(pagoService.listarPorSocio(socioId));
        }
        return ResponseEntity.ok(pagoService.listarTodos());
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
