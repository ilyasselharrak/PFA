import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import api from "../../../lib/axiosInstance";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", {
        email,
      });

      setStep(2);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          "Erreur lors de l'envoi du code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await api.post<{resetToken: string;}>("/auth/verify-code", {
        email,
        code,
      });

      setResetToken(res.data.resetToken);

      setStep(3);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          "Code invalide ou expiré"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "Le mot de passe doit contenir au moins 6 caractères"
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        resetToken,
        newPassword,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          "Erreur lors de la réinitialisation"
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-[380px] text-center">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <CheckCircle2
              size={20}
              className="text-emerald-600"
            />
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Mot de passe réinitialisé
          </h2>

          <p className="text-sm text-gray-500 mb-6">
            Connectez-vous avec votre nouveau mot de passe.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="w-full h-10 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-6">
          <button
            onClick={() => navigate("/login")}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-6 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            Retour
          </button>

          <h1 className="text-xl font-semibold text-gray-900">
            Mot de passe oublié
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            {step === 1 && "Entrez votre adresse email"}

            {step === 2 && "Saisissez le code reçu par email"}

            {step === 3 && "Choisissez un nouveau mot de passe"}
          </p>
        </div>

        {step === 1 && (
          <form
            onSubmit={handleSendCode}
            className="space-y-4"
          >
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
                placeholder="votre@email.com"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
              />
            </div>

            {error && (
              <div className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Envoyer le code"
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form
            onSubmit={handleVerifyCode}
            className="space-y-4"
          >
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Code de vérification
              </label>

              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value)
                }
                required
                placeholder="123456"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
              />
            </div>

            {error && (
              <div className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Vérifier"
              )}
            </button>
          </form>
        )}

        {step === 3 && (
          <form
            onSubmit={handleReset}
            className="space-y-4"
          >
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Nouveau mot de passe
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                required
                placeholder="Minimum 6 caractères"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Confirmer le mot de passe
              </label>

              <input
                type="password"
                value={confirm}
                onChange={(e) =>
                  setConfirm(e.target.value)
                }
                required
                placeholder="Confirmez le mot de passe"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
              />
            </div>

            {error && (
              <div className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Réinitialiser"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}