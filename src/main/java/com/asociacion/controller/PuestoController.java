package com.asociacion.controller;

import com.asociacion.dto.PuestoRequestDTO;
import com.asociacion.dto.PuestoResponseDTO;
import com.asociacion.service.PuestoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/puestos")
public class PuestoController {

    @Autowired
    private PuestoService puestoService;

    // GET /api/puestos?socioId=5&buscar=term
    @GetMapping
    public ResponseEntity<List<PuestoResponseDTO>> listar(
            @RequestParam(required = false) Long socioId,
            @RequestParam(required = false, defaultValue = "false") boolean soloAsociacion,
            @RequestParam(required = false) String buscar) {

        if (buscar != null && !buscar.isBlank()) {
            return ResponseEntity.ok(puestoService.buscar(buscar));
        }
        if (socioId != null) {
            return ResponseEntity.ok(puestoService.listarPorSocio(socioId));
        } else if (soloAsociacion) {
            return ResponseEntity.ok(puestoService.listarDeLaAsociacion());
        }
        return ResponseEntity.ok(puestoService.listarTodos());
    }

    // GET /api/puestos/{id}
    @GetMapping("/{id}")
    public ResponseEntity<PuestoResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(puestoService.buscarPorId(id));
    }

    // POST /api/puestos
    @PostMapping
    public ResponseEntity<PuestoResponseDTO> crear(@Valid @RequestBody PuestoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(puestoService.crear(dto));
    }

    // PUT /api/puestos/{id}
    @PutMapping("/{id}")
    public ResponseEntity<PuestoResponseDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody PuestoRequestDTO dto) {
        return ResponseEntity.ok(puestoService.actualizar(id, dto));
    }

    // DELETE /api/puestos/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        puestoService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}
