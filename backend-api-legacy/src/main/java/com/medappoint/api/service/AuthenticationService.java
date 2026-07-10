package com.medappoint.api.service;

import com.medappoint.api.dto.AuthenticationRequest;
import com.medappoint.api.dto.AuthenticationResponse;
import com.medappoint.api.dto.RegisterRequest;
import com.medappoint.api.model.Patient;
import com.medappoint.api.model.Role;
import com.medappoint.api.model.Utilisateur;
import com.medappoint.api.repository.UtilisateurRepository;
import com.medappoint.api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UtilisateurRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthenticationResponse register(RegisterRequest request) {
        // Pour simplifier, on crée un Patient par défaut si le rôle n'est pas spécifié
        // Dans une vraie app, on gérerait mieux les types d'utilisateurs
        Utilisateur user = Patient.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .motDePasse(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole() : Role.PATIENT)
                .build();
        
        repository.save(user);
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole())
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole())
                .build();
    }
}
