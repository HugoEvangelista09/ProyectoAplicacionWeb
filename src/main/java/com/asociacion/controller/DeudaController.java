package com.asociacion.controller;

import com.asociacion.dto.DeudaItemRequestDTO;
import com.asociacion.dto.DeudaMasivaRequestDTO;
import com.asociacion.dto.DeudaRequestDTO;
import com.asociacion.dto.DeudaResponseDTO;
import com.asociacion.service.DeudaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deudas")
public class DeudaController {

    @Autowired
    private DeudaService deudaService;

    // GET /api/deudas?socioId=5&soloPendientes=true&buscar=term
    @GetMapping
    public ResponseEntity<List<DeudaResponseDTO>> listar(
            @RequestParam(required = false) Long socioId,
            @RequestParam(required = false, defaultValue = "false") boolean soloPendientes,
            @RequestParam(required = false) String buscar) {

        if (buscar != null && !buscar.isBlank()) {
            if (socioId != null) {
                return ResponseEntity.ok(deudaService.buscarPorSocio(socioId, buscar));
            }
            return ResponseEntity.ok(deudaService.buscar(buscar));
        }
        if (socioId != null && soloPendientes) {
            return ResponseEntity.ok(deudaService.listarPendientesPorSocio(socioId));
        } else if (socioId != null) {
            return ResponseEntity.ok(deudaService.listarPorSocio(socioId));
        }
        return ResponseEntity.ok(deudaService.listarTodas());
    }

    // GET /api/deudas/{id}
    @GetMapping("/{id}")
    public ResponseEntity<DeudaResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(deudaService.buscarPorId(id));
    }

    // POST /api/deudas  (crea deuda individual)
    @PostMapping
    public ResponseEntity<DeudaResponseDTO> crear(@Valid @RequestBody DeudaRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deudaService.crear(dto));
    }

    // POST /api/deudas/masivo  (carga masiva de deudas)
    @PostMapping("/masivo")
    public ResponseEntity<List<DeudaResponseDTO>> crearMasivo(
            @Valid @RequestBody DeudaMasivaRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deudaService.crearMasivo(dto));
    }

    // POST /api/deudas/{id}/items  (agregar ítems a una deuda existente)
    @PostMapping("/{id}/items")
    public ResponseEntity<DeudaResponseDTO> agregarItems(
            @PathVariable Long id,
            @RequestBody List<DeudaItemRequestDTO> items) {
        return ResponseEntity.ok(deudaService.agregarItems(id, items));
    }
}
