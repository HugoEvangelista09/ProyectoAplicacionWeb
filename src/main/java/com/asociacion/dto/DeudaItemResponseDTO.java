package com.asociacion.dto;

import com.asociacion.model.EstadoItem;
import lombok.*;

import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DeudaItemResponseDTO {
    private Long id;
    private Long motivoCobroId;
    private String motivoCobroNombre;
    private BigDecimal monto;
    private String observacion;
    private EstadoItem estado;
}
