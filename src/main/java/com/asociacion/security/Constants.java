package com.asociacion.security;

import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.security.Key;

public class Constants {

    public static final String HEADER_AUTHORIZATION = "Authorization";
    public static final String TOKEN_PREFIX         = "Bearer ";
    public static final String SUPER_SECRET_TEXT    = "X7k$9Lm!qR2vZp@8#dF4tYw0BnC3uHjK5sE&aM6QxLrPzT";
    public static final long   EXPIRATION_TIME      = 86_400_000L; // 24 horas en ms

    public static Key getSigningKey(String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(bytes);
    }
}
