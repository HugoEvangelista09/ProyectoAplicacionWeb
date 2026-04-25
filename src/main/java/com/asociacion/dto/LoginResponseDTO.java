package com.asociacion.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class LoginResponseDTO {
    private String token;
    private String role;    // "admin" | "operador" | "socio"
    private String nombre;
    private Long   socioId; // solo para socios
}
