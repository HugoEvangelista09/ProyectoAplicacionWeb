package com.asociacion.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

import static com.asociacion.security.Constants.*;

@Component
public class JWTAuthorizationFilter extends OncePerRequestFilter {

    private Claims extractClaims(HttpServletRequest request) {
        String rawToken = request.getHeader(HEADER_AUTHORIZATION).replace(TOKEN_PREFIX, "");
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey(SUPER_SECRET_TEXT))
                .build()
                .parseClaimsJws(rawToken)
                .getBody();
    }

    private void setAuthentication(Claims claims) {
        String role = claims.get("role", String.class);
        var auth = new UsernamePasswordAuthenticationToken(
                claims.getSubject(), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase())));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private boolean hasToken(HttpServletRequest request) {
        String header = request.getHeader(HEADER_AUTHORIZATION);
        return header != null && header.startsWith(TOKEN_PREFIX);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        try {
            if (hasToken(request)) {
                Claims claims = extractClaims(request);
                setAuthentication(claims);
            } else {
                SecurityContextHolder.clearContext();
            }
            chain.doFilter(request, response);
        } catch (ExpiredJwtException | UnsupportedJwtException | MalformedJwtException e) {
            SecurityContextHolder.clearContext();
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, e.getMessage());
        }
    }
}
