package com.emsi.pfa.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.emsi.pfa.model.Historique;
import com.emsi.pfa.model.RefreshToken;
import com.emsi.pfa.model.User;
import com.emsi.pfa.repository.HistoriqueRepository;
import com.emsi.pfa.repository.UserRepository;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private HistoriqueRepository historiqueRepository;

    @Autowired
    private RefreshTokenService refreshTokenService;
    @Autowired
    private EmailService emailService;

    public Map<String, String> login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email incorrect"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Mot de passe incorrect");
        }

        String role = user.getRole().getName();
        if (java.util.List.of("agent", "manager", "admin").contains(role)) {
            Historique historique = new Historique();
            historique.setAction(user.getNom() + " " + user.getPrenom() + " s'est connecté au système");
            historique.setUser(user);
            historique.setDateAction(LocalDateTime.now());
            historiqueRepository.save(historique);
        }

        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.create(user);

        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken.getToken());
        return tokens;
    }

    public Map<String, String> refresh(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenService.validate(refreshTokenValue);
        User user = refreshToken.getUser();

        String newAccessToken = jwtService.generateToken(user);
        RefreshToken newRefreshToken = refreshTokenService.create(user);

        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", newAccessToken);
        tokens.put("refreshToken", newRefreshToken.getToken());
        return tokens;
    }

    public String forgotPassword(String email, String reponse) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email introuvable"));

        if (user.getReponseSecurite() == null) {
            throw new RuntimeException("Aucune question de sécurité configurée pour ce compte");
        }

        if (!passwordEncoder.matches(reponse, user.getReponseSecurite())) {
            throw new RuntimeException("Réponse incorrecte");
        }

        return jwtService.generateResetToken(user);
    }

    public void resetPassword(String resetToken, String newPassword) {
        String email = jwtService.validateResetToken(resetToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        refreshTokenService.revokeByUser(user);
    }

    public void setupSecurityQuestion(String email, String question, String reponse) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        user.setQuestionSecurite(question);
        user.setReponseSecurite(passwordEncoder.encode(reponse));
        userRepository.save(user);
    }
    public void sendResetCode(String email) {
        try {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Email introuvable"));

    String code = String.format("%06d", new Random().nextInt(999999));

    user.setResetCode(code);
    user.setResetCodeExpiry(LocalDateTime.now().plusMinutes(10));

    userRepository.save(user);

    emailService.sendResetCode(email, code);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'envoi du code de réinitialisation : " + e.getMessage());
        }
    }

    public String verifyCode(String email, String code) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

    if (!code.equals(user.getResetCode())) {
        throw new RuntimeException("Code invalide");
    }

    if (user.getResetCodeExpiry().isBefore(LocalDateTime.now())) {
        throw new RuntimeException("Code expiré");
    }

    return jwtService.generateResetToken(user);
}
}
