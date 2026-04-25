package com.asociacion.controller;

import com.asociacion.dto.MotivoCobroRequestDTO;
import com.asociacion.dto.MotivoCobroResponseDTO;
import com.asociacion.service.MotivoCobroService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/motivos-cobro")
public class MotivoCobroController {

    @Autowired
    private MotivoCobroService motivoCobroService;

    // GET /api/motivos-cobro?soloActivos=true
    @GetMapping
    public ResponseEntity<List<MotivoCobroResponseDTO>> listar(
            @RequestParam(required = false, defaultValue = "true") boolean soloActivos) {
        List<MotivoCobroResponseDTO> motivos = soloActivos
                ? motivoCobroService.listarActivos()
                : motivoCobroService.listarTodos();
        return ResponseEntity.ok(motivos);
    }

    // POST /api/motivos-cobro
    @PostMapping
    public ResponseEntity<MotivoCobroResponseDTO> crear(@Valid @RequestBody MotivoCobroRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(motivoCobroService.crear(dto));
    }

    // PUT /api/motivos-cobro/{id}
    @PutMapping("/{id}")
    public ResponseEntity<MotivoCobroResponseDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody MotivoCobroRequestDTO dto) {
        return ResponseEntity.ok(motivoCobroService.actualizar(id, dto));
    }

    // DELETE /api/motivos-cobro/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        motivoCobroService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}
