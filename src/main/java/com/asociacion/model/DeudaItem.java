package com.asociacion.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "deuda_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DeudaItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deuda_id", nullable = false)
    private Deuda deuda;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "motivo_cobro_id", nullable = false)
    private MotivoCobro motivoCobro;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Column
    private String observacion;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private EstadoItem estado = EstadoItem.PENDIENTE;
}
