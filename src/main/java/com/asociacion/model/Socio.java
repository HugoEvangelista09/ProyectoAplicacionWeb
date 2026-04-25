package com.asociacion.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "socios")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Socio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String apellido;

    @Column(nullable = false, unique = true)
    private String dni;

    @Column
    private String telefono;

    @Column
    private String email;

    @Column(unique = true, length = 60)
    private String username;

    @Column(length = 255)
    private String password;

    @Column(nullable = false)
    private Boolean activo = true;

    @OneToMany(mappedBy = "socio", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Puesto> puestos;

    @OneToMany(mappedBy = "socio", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Deuda> deudas;
}
