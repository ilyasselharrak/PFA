package com.emsi.pfa.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ForgotPasswordRequest {

    @NotBlank(message = "L'email est requis")
    @Email(message = "Format email invalide")
    private String email;



    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }


}
