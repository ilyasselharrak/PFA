import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import api from "../../../lib/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus, Search, Clock, ArrowLeft, Send,
  MessageCircle, Paperclip, X, ChevronRight, FileText,
  CheckCircle2, RotateCcw, Trash2, Edit2,
} from "lucide-react";
import {
  Reclamation, ApiResponse, CategorieReclamation,
  Priority, Status, Commentaire,
} from "../../../types";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { useToast } from "../../../context/ToastContext";
import { Skeleton } from "../../../components/Skeleton";

export default function MesReclamationsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [categories, setCategories] = useState<CategorieReclamation[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [reponses, setReponses] = useState<Commentaire[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ titre: "", description: "", categorieId: "", priorityId: "" });
  const [newReponse, setNewReponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editingRec, setEditingRec] = useState<Reclamation | null>(null);
  const [editForm, setEditForm] = useState({ titre: "", description: "" });

  useEffect(() => {
    loadData();
    loadFilters();
  }, []);

  useEffect(() => {
    if (id) loadReclamationDetail(parseInt(id));
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Reclamation>>("/reclamations/mes-reclamations", {
        params: { page: 0, size: 100 },
      });
      setReclamations(res.data?.content || []);
    } catch {
      showToast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadReclamationDetail = async (reclamationId: number) => {
    setLoading(true);
    try {
      const [recRes, repRes] = await Promise.all([
        api.get<Reclamation>(`/reclamations/get-reclamation/${reclamationId}`),
        api.get<Commentaire[]>(`/commentaires/get-commentaires/${reclamationId}`, {
          params: { page: 0, size: 50 },
        }),
      ]);
      setSelectedReclamation(recRes.data);
      setReponses(repRes.data || []);
    } catch {
      showToast("Reclamation introuvable", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadFilters = async () => {
    try {
      const [catRes, priRes] = await Promise.all([
        api.get<CategorieReclamation[]>("/categorie/get-categorie"),
        api.get<Priority[]>("/priorities/get-priority"),
      ]);
      setCategories(catRes.data || []);
      setPriorities(priRes.data || []);
    } catch {
      console.error("Error loading filters");
    }
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>, recId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      await api.post(`/piece-jointes/upload/${recId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("Fichier envoye", "success");
    } catch {
      showToast("Erreur lors de l'envoi", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateReclamation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        titre: formData.titre,
        description: formData.description,
        categorie: { id: parseInt(formData.categorieId) },
        priority: { id: parseInt(formData.priorityId) },
      };
      const recResponse = await api.post("/reclamations/add-reclamation", payload);
      const reclamationId = recResponse.data.id;

      if (selectedFile) {
        const fileData = new FormData();
        fileData.append("file", selectedFile);
        await api.post(`/piece-jointes/upload/${reclamationId}`, fileData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setShowForm(false);
      setFormData({ titre: "", description: "", categorieId: "", priorityId: "" });
      setSelectedFile(null);
      showToast("Reclamation creee avec succes", "success");
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.message || "Erreur lors de la creation";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReponse = async () => {
    if (!newReponse.trim() || !selectedReclamation) return;
    setSubmitting(true);
    try {
      await api.post("/commentaires/add-commentaire", {
        contenu: newReponse,
        reclamation: { id: selectedReclamation.id },
        user: { id: user?.userId },
      });
      setNewReponse("");
      showToast("Message envoye", "success");
      loadReclamationDetail(selectedReclamation.id);
    } catch {
      showToast("Erreur lors de l'envoi", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReclamation = async (recId: number) => {
    setDeletingId(recId);
    setConfirmDeleteId(null);
    try {
      await api.delete(`/reclamations/delete-reclamation/${recId}`);
      showToast("Reclamation supprimee", "success");
      setSelectedReclamation(null);
      loadData();
    } catch {
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (rec: Reclamation) => {
    setEditingRec(rec);
    setEditForm({ titre: rec.titre, description: rec.description || "" });
  };

  const handleEditReclamation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRec) return;
    setSubmitting(true);
    try {
      await api.put(`/reclamations/update-reclamation/${editingRec.id}`, {
        titre: editForm.titre,
        description: editForm.description,
        categorie: editingRec.categorie,
        priority: editingRec.priority,
        status: editingRec.status,
        client: editingRec.client,
      });
      showToast("Reclamation modifiee", "success");
      setEditingRec(null);
      if (selectedReclamation?.id === editingRec.id) {
        loadReclamationDetail(editingRec.id);
      }
      loadData();
    } catch {
      showToast("Erreur lors de la modification", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmer = async () => {
    if (!selectedReclamation) return;
    setConfirming(true);
    try {
      await api.put(`/reclamations/reclamation/${selectedReclamation.id}/confirmer`);
      showToast("Resolution confirmee", "success");
      loadReclamationDetail(selectedReclamation.id);
    } catch {
      showToast("Erreur", "error");
    } finally {
      setConfirming(false);
    }
  };

  const handleRejeter = async () => {
    if (!selectedReclamation || !rejectFeedback.trim()) return;
    setConfirming(true);
    try {
      await api.put(`/reclamations/reclamation/${selectedReclamation.id}/rejeter`, {
        feedback: rejectFeedback,
      });
      showToast("Reclamation renvoyee avec votre feedback", "success");
      setShowRejectModal(false);
      setRejectFeedback("");
      loadReclamationDetail(selectedReclamation.id);
    } catch {
      showToast("Erreur", "error");
    } finally {
      setConfirming(false);
    }
  };

  const statusStyle = (status?: string) => {
    if (status === "résolu") return "bg-emerald-50 text-emerald-700";
    if (status === "en cours") return "bg-blue-50 text-blue-700";
    return "bg-amber-50 text-amber-700";
  };

  const priorityStyle = (priority?: string) => {
    if (priority === "haute" || priority === "urgent") return "bg-red-50 text-red-700";
    if (priority === "moyenne") return "bg-amber-50 text-amber-700";
    return "bg-gray-50 text-gray-600";
  };

  const filteredReclamations = reclamations.filter(
    (r) =>
      r.titre?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()),
  );

  if (selectedReclamation) {
    return (
      <DashboardLayout
        title={selectedReclamation.titre}
        subtitle={`Reclamation #${selectedReclamation.id}`}
        actions={
          <div className="flex items-center gap-2">
            {selectedReclamation.status?.status === "en attente" && (
              <>
                <button
                  onClick={() => openEditModal(selectedReclamation)}
                  className="h-8 px-3 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  <Edit2 size={13} />
                  Modifier
                </button>
                <button
                  onClick={() => setConfirmDeleteId(selectedReclamation.id)}
                  disabled={deletingId === selectedReclamation.id}
                  className="h-8 px-3 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  <Trash2 size={13} />
                  Supprimer
                </button>
              </>
            )}
            <button
              onClick={() => { setSelectedReclamation(null); navigate("/mes-reclamations"); }}
              className="h-8 px-3 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <ArrowLeft size={14} />
              Retour
            </button>
          </div>
        }
      >
        <div className="space-y-5 max-w-3xl">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${statusStyle(selectedReclamation.status?.status)}`}>
                {selectedReclamation.status?.status || "en attente"}
              </span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${priorityStyle(selectedReclamation.priority?.priority)}`}>
                {selectedReclamation.priority?.priority || "Normal"}
              </span>
              {selectedReclamation.categorie?.categorie && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-50 text-gray-600">
                  {selectedReclamation.categorie.categorie}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{selectedReclamation.description}</p>
            <p className="text-xs text-gray-400 mt-3">
              Deposee le {selectedReclamation.dateDepot ? new Date(selectedReclamation.dateDepot).toLocaleDateString("fr-FR") : ""}
            </p>
          </div>

          {selectedReclamation.status?.status === "résolu" &&
            selectedReclamation.valideeParAdmin === true &&
            selectedReclamation.confirmeParClient === null && (
              <div className="bg-teal-50 border border-teal-100 rounded-lg p-5">
                <p className="text-sm font-medium text-teal-900 mb-1">
                  Cette reclamation a ete marquee comme resolue
                </p>
                <p className="text-xs text-teal-600 mb-4">
                  Confirmez la resolution ou renvoyez-la avec un feedback si le probleme persiste.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmer}
                    disabled={confirming}
                    className="h-8 px-4 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    Confirmer la resolution
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="h-8 px-4 rounded-md border border-gray-200 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} />
                    Renvoyer avec feedback
                  </button>
                </div>
              </div>
            )}

          {selectedReclamation.confirmeParClient === true && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-5 py-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <p className="text-sm font-medium text-emerald-700">Resolution confirmee - reclamation fermee</p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-900">Echanges</h3>
            </div>

            <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
              {reponses.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle size={24} className="mx-auto mb-2 text-gray-200" strokeWidth={1.5} />
                  <p className="text-xs text-gray-400">Aucun message</p>
                </div>
              ) : (
                reponses.map((rep) => {
                  const isMine = rep.user?.id === user?.userId;
                  return (
                    <div key={rep.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg px-3.5 py-2.5 ${
                        isMine
                          ? "bg-teal-600 text-white"
                          : "bg-gray-50 border border-gray-100 text-gray-700"
                      }`}>
                        <p className={`text-[11px] font-medium mb-1 ${isMine ? "text-teal-200" : "text-gray-500"}`}>
                          {isMine ? "Vous" : `${rep.user?.nom || ""} ${rep.user?.prenom || ""}`}
                        </p>
                        <p className="text-[13px] leading-relaxed">{rep.contenu}</p>
                        <p className={`text-[10px] mt-1.5 ${isMine ? "text-teal-300" : "text-gray-400"}`}>
                          {rep.dateCommentaire ? new Date(rep.dateCommentaire).toLocaleString("fr-FR") : ""}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {selectedReclamation.status?.status !== "résolu" && (
              <div className="px-5 py-3.5 border-t border-gray-100">
                <div className="flex gap-2">
                  <textarea
                    value={newReponse}
                    onChange={(e) => setNewReponse(e.target.value)}
                    placeholder="Ecrire un message..."
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
                  />
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={handleSendReponse}
                      disabled={submitting || !newReponse.trim()}
                      className="h-8 px-3 rounded-md bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <Send size={12} />
                      Envoyer
                    </button>
                    <label className="h-8 px-3 rounded-md border border-gray-200 text-gray-500 text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                      <Paperclip size={12} />
                      {uploading ? "..." : "Fichier"}
                      <input type="file" className="hidden" onChange={(e) => uploadFile(e, selectedReclamation.id)} />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
              {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Renvoyer la reclamation</h3>
              <button onClick={() => setShowRejectModal(false)} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Expliquez pourquoi le probleme n'est pas resolu
                </label>
                <textarea
                  value={rejectFeedback}
                  onChange={(e) => setRejectFeedback(e.target.value)}
                  rows={4}
                  placeholder="Decrivez ce qui ne fonctionne pas encore..."
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm outline-none resize-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 h-9 rounded-md border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRejeter}
                  disabled={confirming || !rejectFeedback.trim()}
                  className="flex-1 h-9 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {confirming ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><RotateCcw size={14} /> Renvoyer</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-lg border border-slate-200 shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-red-50 flex items-center justify-center">
                <Trash2 size={15} className="text-red-500" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">Supprimer la reclamation</h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-500">Cette action est irreversible. La reclamation et tous ses messages seront supprimes.</p>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="h-8 px-3 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button
                onClick={() => handleDeleteReclamation(confirmDeleteId)}
                className="h-8 px-3 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {editingRec  && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditingRec(null)}>
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Modifier la reclamation</h3>
              <button onClick={() => setEditingRec(null)} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleEditReclamation} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Titre</label>
                <input
                  type="text"
                  value={editForm.titre}
                  onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })}
                  required
                  className="w-full h-9 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm outline-none resize-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingRec(null)} className="flex-1 h-9 rounded-md border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="flex-1 h-9 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center">
                  {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Mes reclamations"
      subtitle="Client"
      actions={
        <button
          onClick={() => setShowForm(true)}
          className="h-8 px-3 rounded-md bg-teal-600 text-white text-xs font-medium flex items-center gap-1.5 hover:bg-teal-700 transition-colors"
        >
          <Plus size={14} />
          Nouvelle reclamation
        </button>
      }
    >
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-md border border-gray-200 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-6" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
            ))}
          </div>
        ) : filteredReclamations.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={32} className="mx-auto mb-3 text-gray-200" strokeWidth={1.5} />
            <p className="text-sm text-gray-500 mb-1">
              {search ? "Aucun resultat" : "Aucune reclamation"}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              {search ? "Essayez un autre terme de recherche" : "Creez votre premiere reclamation"}
            </p>
            {!search && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition-colors"
              >
                <Plus size={14} />
                Nouvelle reclamation
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredReclamations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => loadReclamationDetail(rec.id)}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer group"
              >
                <span className="text-xs font-mono text-gray-400 w-6 flex-shrink-0">{rec.id}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-teal-600 transition-colors">
                    {rec.titre}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {rec.dateDepot ? new Date(rec.dateDepot).toLocaleDateString("fr-FR") : ""}
                    </span>
                    {rec.categorie?.categorie && (
                      <span className="text-[11px] text-gray-400">{rec.categorie.categorie}</span>
                    )}
                  </div>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md flex-shrink-0 ${statusStyle(rec.status?.status)}`}>
                  {rec.status?.status || "en attente"}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md flex-shrink-0 ${priorityStyle(rec.priority?.priority)}`}>
                  {rec.priority?.priority || "normal"}
                </span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Nouvelle reclamation</h3>
              <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateReclamation} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Titre</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  required
                  placeholder="Objet de la reclamation"
                  className="w-full h-9 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  placeholder="Decrivez votre reclamation en detail..."
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm outline-none resize-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Categorie</label>
                  <select
                    value={formData.categorieId}
                    onChange={(e) => setFormData({ ...formData, categorieId: e.target.value })}
                    required
                    className="w-full h-9 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors bg-white"
                  >
                    <option value="">Choisir</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.categorie}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Priorite</label>
                  <select
                    value={formData.priorityId}
                    onChange={(e) => setFormData({ ...formData, priorityId: e.target.value })}
                    required
                    className="w-full h-9 px-3 rounded-md border border-gray-300 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors bg-white"
                  >
                    <option value="">Choisir</option>
                    {priorities.map((pri) => (
                      <option key={pri.id} value={pri.id}>{pri.priority}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Piece jointe</label>
                <input
                  type="file"
                  onChange={(e) => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-200 file:text-xs file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50 file:cursor-pointer file:transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 h-9 rounded-md border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-9 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Envoyer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </DashboardLayout>
  );
}
