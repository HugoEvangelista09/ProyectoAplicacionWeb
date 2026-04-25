package com.asociacion.dto;

import com.asociacion.model.Deuda;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DeudaResponseDTO {
    private Long id;
    private Long socioId;
    private String socioNombre;
    private LocalDate fecha;
    private String descripcion;
    private Deuda.EstadoDeuda estado;
    private BigDecimal totalPendiente;
    private List<DeudaItemResponseDTO> items;
}
