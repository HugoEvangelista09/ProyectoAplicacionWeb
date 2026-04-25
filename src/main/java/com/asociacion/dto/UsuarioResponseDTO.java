package com.asociacion.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UsuarioResponseDTO {
    private Long id;
    private String username;
    private String nombreCompleto;
    private String dni;
    private String ruc;
    private String email;
    private String telefono;
    private String direccion;
    private Boolean activo;
    private Boolean flg;
    private Integer rol;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
