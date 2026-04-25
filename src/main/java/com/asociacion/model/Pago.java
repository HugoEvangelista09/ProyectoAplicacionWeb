package com.asociacion.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "pagos")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id", nullable = false)
    private Socio socio;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal montoTotal;

    // Ítems pagados en esta transacción (pago total de cada ítem seleccionado)
    @ManyToMany
    @JoinTable(
        name = "pago_items",
        joinColumns = @JoinColumn(name = "pago_id"),
        inverseJoinColumns = @JoinColumn(name = "deuda_item_id")
    )
    private List<DeudaItem> itemsPagados;

    @Column
    private String observacion;
}
