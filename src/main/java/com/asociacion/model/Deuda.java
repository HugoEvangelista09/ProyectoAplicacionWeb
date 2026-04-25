package com.asociacion.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "deudas")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Deuda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id", nullable = false)
    private Socio socio;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private String descripcion;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private EstadoDeuda estado = EstadoDeuda.PENDIENTE;

    // Cada deuda tiene uno o más ítems (un ítem por cada servicio/cargo)
    @OneToMany(mappedBy = "deuda", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<DeudaItem> items;

    public BigDecimal getTotalDeuda() {
        if (items == null) return BigDecimal.ZERO;
        return items.stream()
                .filter(i -> i.getEstado() == EstadoItem.PENDIENTE)
                .map(DeudaItem::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public enum EstadoDeuda {
        PENDIENTE, PAGADA_PARCIAL, PAGADA
    }
}
