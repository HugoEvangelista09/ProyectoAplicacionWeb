package com.asociacion.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PuestoResponseDTO {
    private Long id;
    private String numero;
    private String descripcion;
    private Boolean activo;
    private Long socioId;
    private String socioNombre;
    private Boolean esDeAsociacion;
}
