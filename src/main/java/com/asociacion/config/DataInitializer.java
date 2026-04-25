package com.asociacion.config;

import com.asociacion.model.Usuario;
import com.asociacion.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (!usuarioRepository.existsByUsername("admin")) {
            Usuario admin = Usuario.builder()
                    .username("admin")
                    .password("admin123")
                    .nombreCompleto("Administrador Principal")
                    .dni("00000001")
                    .ruc("00000000001")
                    .email("admin@apromec.pe")
                    .rol(1)
                    .activo(true)
                    .flg(true)
                    .build();
            usuarioRepository.save(admin);
            System.out.println(">>> Usuario admin creado: admin / admin123");
        }
    }
}
