package com.asociacion.controller;

import com.asociacion.dto.UsuarioRequestDTO;
import com.asociacion.dto.UsuarioResponseDTO;
import com.asociacion.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    // GET /api/usuarios?soloActivos=true&buscar=term
    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> listar(
            @RequestParam(required = false, defaultValue = "false") boolean soloActivos,
            @RequestParam(required = false) String buscar) {
        if (buscar != null && !buscar.isBlank()) {
            return ResponseEntity.ok(usuarioService.buscar(buscar));
        }
        List<UsuarioResponseDTO> usuarios = soloActivos
                ? usuarioService.listarActivos()
                : usuarioService.listarTodos();
        return ResponseEntity.ok(usuarios);
    }

    // GET /api/usuarios/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.buscarPorId(id));
    }

    // POST /api/usuarios
    @PostMapping
    public ResponseEntity<UsuarioResponseDTO> crear(@Valid @RequestBody UsuarioRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.crear(dto));
    }

    // PUT /api/usuarios/{id}
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioRequestDTO dto) {
        return ResponseEntity.ok(usuarioService.actualizar(id, dto));
    }

    // DELETE /api/usuarios/{id}  (baja logica: activo = false)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        usuarioService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}
