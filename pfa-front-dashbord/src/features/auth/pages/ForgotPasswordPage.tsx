import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, ChevronLeft, Shield, Users, BarChart3 } from "lucide-react";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg border border-slate-200 p-6 text-center">

        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          Mot de passe oublié
        </h1>

        <p className="text-slate-600 text-sm mb-6">
          Pour des raisons de sécurité, les mots de passe ne
          peuvent pas être réinitialisés automatiquement.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-700 mb-2">
            Veuillez contacter l'administration :
          </p>

          <a
            href="mailto:admin@gmail.com"
            className="text-teal-600 font-semibold hover:underline"
          >
            admin@gmail.com
          </a>
        </div>

        <button
          onClick={() => navigate("/")}
          className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
           Retour à la connexion
        </button>
      </div>
      </div>
  );
}