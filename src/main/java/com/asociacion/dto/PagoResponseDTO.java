package com.asociacion.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PagoResponseDTO {
    private Long id;
    private Long socioId;
    private String socioNombre;
    private LocalDate fecha;
    private BigDecimal montoTotal;
    private String observacion;
    private List<DeudaItemResponseDTO> itemsPagados;
}
