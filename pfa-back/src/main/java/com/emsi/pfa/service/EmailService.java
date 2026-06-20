package com.emsi.pfa.service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendResetCode(String to, String code) throws MessagingException {

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(to);
        helper.setSubject("Réinitialisation de votre mot de passe");

        String html = """
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:30px;">
                <div style="max-width:600px; margin:auto; background:white; border-radius:12px;
                            overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.1);">

                    <div style="background:#2563eb; color:white; padding:25px; text-align:center;">
                        <h1 style="margin:0;">Réinitialisation du mot de passe</h1>
                    </div>

                    <div style="padding:30px; color:#333;">
                        <p>Bonjour,</p>

                        <p>
                            Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.
                        </p>

                        <p style="text-align:center; margin:30px 0;">
                            <span style="
                                display:inline-block;
                                background:#eff6ff;
                                color:#2563eb;
                                font-size:32px;
                                font-weight:bold;
                                letter-spacing:8px;
                                padding:15px 30px;
                                border-radius:10px;
                                border:2px dashed #2563eb;">
                                %s
                            </span>
                        </p>

                        <p>
                            Ce code est valable pendant <strong>15 minutes</strong>.
                        </p>

                        <p>
                            Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.
                        </p>

                        <br>

                        <p>
                            Cordialement,<br>
                            <strong>Équipe Support Réclamation</strong>
                        </p>
                    </div>

                    <div style="
                        background:#f8fafc;
                        text-align:center;
                        padding:15px;
                        color:#64748b;
                        font-size:12px;">
                        © 2026 Plateforme de Gestion des Réclamations
                    </div>

                </div>
            </body>
            </html>
            """.formatted(code);

        helper.setText(html, true);

        mailSender.send(message);
    }
}