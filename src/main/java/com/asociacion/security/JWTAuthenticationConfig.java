package com.asociacion.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Component;

import java.util.Date;

import static com.asociacion.security.Constants.*;

@Component
public class JWTAuthenticationConfig {

    public String getJWTToken(String username, String nombre, String role, Long socioId) {
        String token = Jwts.builder()
                .setId("apromec")
                .setSubject(username)
                .claim("nombre",  nombre)
                .claim("role",    role)
                .claim("socioId", socioId)
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(SUPER_SECRET_TEXT), SignatureAlgorithm.HS256)
                .compact();
        return TOKEN_PREFIX + token;
    }
}
