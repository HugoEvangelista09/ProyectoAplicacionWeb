package com.asociacion.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(name = "nombre_completo", nullable = false, length = 120)
    private String nombreCompleto;

    @Column(nullable = false, unique = true, columnDefinition = "CHAR(8)")
    private String dni;

    @Column(nullable = false, unique = true, columnDefinition = "CHAR(11)")
    private String ruc;

    @Column(unique = true, length = 120)
    private String email;

    @Column(length = 15)
    private String telefono;

    @Column(length = 255)
    private String direccion;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(nullable = false)
    private Boolean flg = true;

    @Column(nullable = false)
    private Integer rol;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
