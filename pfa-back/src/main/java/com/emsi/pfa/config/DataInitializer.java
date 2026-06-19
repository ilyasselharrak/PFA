package com.emsi.pfa.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.emsi.pfa.model.Administrateur;
import com.emsi.pfa.model.Role;
import com.emsi.pfa.model.User;
import com.emsi.pfa.repository.AdministrateurRepository;
import com.emsi.pfa.repository.RoleRepository;
import com.emsi.pfa.repository.UserRepository;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(
            RoleRepository roleRepository,
            UserRepository userRepository,
            AdministrateurRepository administrateurRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {

            createRoleIfNotExists(roleRepository, "admin");
            createRoleIfNotExists(roleRepository, "agent");
            createRoleIfNotExists(roleRepository, "manager");
            createRoleIfNotExists(roleRepository, "client");

            if (!userRepository.existsByEmail("admin@gmail.com")) {

                Role adminRole = roleRepository.findByName("admin")
                        .orElseThrow();

                User admin = new User();
                admin.setNom("Super");
                admin.setPrenom("Admin");
                admin.setEmail("admin@gmail.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole(adminRole);

                admin = userRepository.save(admin);

                Administrateur administrateur = new Administrateur();
                administrateur.setUser(admin);

                administrateurRepository.save(administrateur);

                System.out.println("Admin par défaut créé.");
            }
        };
    }

    private void createRoleIfNotExists(RoleRepository roleRepository, String roleName) {
        if (!roleRepository.existsByName(roleName)) {
            Role role = new Role();
            role.setName(roleName);
            roleRepository.save(role);
        }
    }
}