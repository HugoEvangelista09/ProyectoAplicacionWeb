package com.asociacion.service;

import com.asociacion.dto.LoginRequestDTO;
import com.asociacion.dto.LoginResponseDTO;
import com.asociacion.model.Socio;
import com.asociacion.model.Usuario;
import com.asociacion.repository.SocioRepository;
import com.asociacion.repository.UsuarioRepository;
import com.asociacion.security.JWTAuthenticationConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private SocioRepository   socioRepository;
    @Autowired private JWTAuthenticationConfig jwtConfig;

    public LoginResponseDTO login(LoginRequestDTO request) {

        // 1. Buscar en la tabla usuarios
        Optional<Usuario> usuarioOpt = usuarioRepository
                .findByUsernameAndPassword(request.getUsername(), request.getPassword());

        if (usuarioOpt.isPresent()) {
            Usuario u = usuarioOpt.get();
            if (!u.getActivo()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario inactivo");
            }
            String role  = u.getRol() == 1 ? "admin" : "operador";
            String token = jwtConfig.getJWTToken(u.getUsername(), u.getNombreCompleto(), role, null);
            return LoginResponseDTO.builder()
                    .token(token)
                    .role(role)
                    .nombre(u.getNombreCompleto())
                    .socioId(null)
                    .build();
        }

        // 2. Buscar en la tabla socios
        Optional<Socio> socioOpt = socioRepository
                .findByUsernameAndPassword(request.getUsername(), request.getPassword());

        if (socioOpt.isPresent()) {
            Socio s = socioOpt.get();
            if (!s.getActivo()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Socio inactivo");
            }
            String nombre = s.getNombre() + " " + s.getApellido();
            String token  = jwtConfig.getJWTToken(s.getUsername(), nombre, "socio", s.getId());
            return LoginResponseDTO.builder()
                    .token(token)
                    .role("socio")
                    .nombre(nombre)
                    .socioId(s.getId())
                    .build();
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas");
    }
}
