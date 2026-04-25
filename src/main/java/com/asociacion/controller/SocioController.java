package com.asociacion.controller;

import com.asociacion.dto.SocioRequestDTO;
import com.asociacion.dto.SocioResponseDTO;
import com.asociacion.service.SocioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/socios")
public class SocioController {

    @Autowired
    private SocioService socioService;

    // GET /api/socios?soloActivos=true
    @GetMapping
    public ResponseEntity<List<SocioResponseDTO>> listar(
            @RequestParam(required = false, defaultValue = "false") boolean soloActivos) {
        List<SocioResponseDTO> socios = soloActivos
                ? socioService.listarActivos()
                : socioService.listarTodos();
        return ResponseEntity.ok(socios);
    }

    // GET /api/socios/{id}
    @GetMapping("/{id}")
    public ResponseEntity<SocioResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(socioService.buscarPorId(id));
    }

    // POST /api/socios
    @PostMapping
    public ResponseEntity<SocioResponseDTO> crear(@Valid @RequestBody SocioRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(socioService.crear(dto));
    }

    // PUT /api/socios/{id}
    @PutMapping("/{id}")
    public ResponseEntity<SocioResponseDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody SocioRequestDTO dto) {
        return ResponseEntity.ok(socioService.actualizar(id, dto));
    }

    // DELETE /api/socios/{id}  (baja lógica)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        socioService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}
