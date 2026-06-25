import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../../../components/layouts/DashboardLayout";
import api from "../../../lib/axiosInstance";

import { Reclamation, PieceJointe, ApiResponse } from "../../../types";

import ReclamationHeader from "../../affectations/components/ReclamationHeader";
import ClientFilesSection from "../../affectations/components/ClientFilesSection";
import AgentFilesSection from "../../affectations/components/AgentFilesSection";

import { MessageSquare, User, Calendar, CheckCircle, ShieldCheck } from "lucide-react";
import { Commentaire } from "../../../types";
import { useAuth } from "../../auth/hooks/useAuth";

export default function ReclamationDetailPage() {
	const { id } = useParams();

	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);

	const [reclamation, setReclamation] = useState<Reclamation | null>(null);

	const [clientFiles, setClientFiles] = useState<PieceJointe[]>([]);

	const [agentFiles, setAgentFiles] = useState<PieceJointe[]>([]);

	const { user: authUser } = useAuth();

	const [reponses, setReponses] = useState<any[]>([]);

	const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
	const [approvingId, setApprovingId] = useState<number | null>(null);

	const [reponsePage, setReponsePage] = useState(0);

	const [reponseTotalPages, setReponseTotalPages] = useState(0);

	const [clientPage, setClientPage] = useState(0);

	const [clientTotalPages, setClientTotalPages] = useState(0);

	const [agentPage, setAgentPage] = useState(0);

	const [agentTotalPages, setAgentTotalPages] = useState(0);

	useEffect(() => {
		loadAll();
	}, [id]);
	useEffect(() => {
		if (id) {
			loadReponses(reponsePage);
		}
	}, [reponsePage]);
	const loadAll = async () => {
		setLoading(true);

		try {
			await Promise.all([
				loadReclamation(),
				loadClientFiles(),
				loadAgentFiles(),
				loadReponses(),
				loadCommentaires(),
			]);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const loadReclamation = async () => {
		const res = await api.get(`/reclamations/get-reclamation/${id}`);

		setReclamation(res.data);
	};

	const loadClientFiles = async (page = 0) => {
		const res = await api.get<ApiResponse<PieceJointe>>(
			`/piece-jointes/reclamation/${id}`,
			{
				params: {
					role: "client",
					page,
					size: 5,
				},
			},
		);

		setClientFiles(res.data.content || []);

		setClientPage(res.data.page.number);

		setClientTotalPages(res.data.page.totalPages);
	};

	const loadAgentFiles = async (page = 0) => {
		const res = await api.get<ApiResponse<PieceJointe>>(
			`/piece-jointes/reclamation/${id}`,
			{
				params: {
					role: "agent",
					page,
					size: 5,
				},
			},
		);

		setAgentFiles(res.data.content || []);

		setAgentPage(res.data.page.number);

		setAgentTotalPages(res.data.page.totalPages);
	};

	const loadReponses = async (page: number = 0) => {
		const res = await api.get(`/reponse-reclamations/get-reponse/${id}`, {
			params: {
				page,
				size: 3,
			},
		});

		setReponses(res.data.content || []);

		setReponsePage(res.data.page.number);

		setReponseTotalPages(res.data.page.totalPages);
	};

	const loadCommentaires = async () => {
		try {
			const res = await api.get<Commentaire[]>(`/commentaires/get-commentaires/${id}`);
			setCommentaires(Array.isArray(res.data) ? res.data : []);
		} catch (e) {
			console.error(e);
		}
	};

	const handleApprouverCommentaire = async (commentaireId: number) => {
		setApprovingId(commentaireId);
		try {
			await api.put(`/commentaires/approuver/${commentaireId}`);
			await loadCommentaires();
		} catch (e) {
			console.error(e);
		} finally {
			setApprovingId(null);
		}
	};

	const downloadFile = async (filename?: string) => {
		if (!filename) return;

		try {
			const response = await api.get(`/piece-jointes/download/${filename}`, {
				responseType: "blob",
			});

			const url = window.URL.createObjectURL(new Blob([response.data]));

			const link = document.createElement("a");

			link.href = url;

			link.setAttribute("download", filename);

			document.body.appendChild(link);

			link.click();

			link.remove();
		} catch (e) {
			console.error(e);
		}
	};

	if (loading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-[60vh]">
					<div className="w-8 h-8 border-[3px] border-slate-200 border-t-teal-600 rounded-full animate-spin" />
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className="space-y-6">
				<ReclamationHeader reclamation={reclamation} navigate={navigate} />

				<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
					<ClientFilesSection
						clientFiles={clientFiles}
						downloadFile={downloadFile}
						page={clientPage}
						totalPages={clientTotalPages}
						onPageChange={loadClientFiles}
					/>

					<AgentFilesSection
						agentFiles={agentFiles}
						downloadFile={downloadFile}
						uploadFile={() => {}}
						uploading={false}
						page={agentPage}
						totalPages={agentTotalPages}
						onPageChange={loadAgentFiles}
						deleteFile={() => {}}
					/>
				</div>

				<div className="bg-white rounded-lg border border-slate-200 p-5">
					<div className="flex items-center gap-3 mb-6">
						<div className="w-10 h-10 rounded-md bg-teal-50 flex items-center justify-center">
							<MessageSquare size={20} className="text-teal-600" />
						</div>

						<div>
							<h2 className="text-lg font-bold text-slate-900">
								Réponses de l'agent
							</h2>

							<p className="text-sm text-slate-500">
								Historique des réponses de traitement
							</p>
						</div>
					</div>

					{reponses.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-14">
							<MessageSquare size={45} className="text-slate-300 mb-3" />

							<p className="text-slate-500">Aucune réponse disponible</p>
						</div>
					) : (
						<div className="space-y-4">
							{reponses.map((rep: any) => (
								<div
									key={rep.id}
									className="bg-slate-50 border border-slate-200 rounded-lg p-5 hover:border-teal-300 transition-all"
								>
									<div className="flex justify-between items-start mb-4">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-md bg-teal-50 flex items-center justify-center">
												<User size={16} className="text-teal-600" />
											</div>

											<div>
												<p className="text-slate-900 font-semibold">
													{rep.agent?.user?.nom} {rep.agent?.user?.prenom}
												</p>

												<p className="text-xs text-slate-500">
													Agent responsable
												</p>
											</div>
										</div>

										<div className="flex items-center gap-2 text-xs text-slate-500">
											<Calendar size={14} />

											{rep.dateCreation
												? new Date(rep.dateCreation).toLocaleDateString(
														"fr-FR",
														{
															day: "numeric",
															month: "short",
															year: "numeric",
														},
													)
												: ""}
										</div>
									</div>

									<div className="bg-white rounded-md p-4 border border-slate-200">
										<p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
											{rep.reponse}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
					{reponseTotalPages > 1 && (
						<div className="flex items-center justify-center gap-4 mt-6">
							<button
								disabled={reponsePage === 0}
								onClick={() => setReponsePage(Math.max(0, reponsePage - 1))}
								className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
							>
								Précédent
							</button>

							<span className="text-slate-900 font-medium">
								{reponsePage + 1} / {Math.max(reponseTotalPages, 1)}
							</span>

							<button
								disabled={reponsePage >= reponseTotalPages - 1}
								onClick={() => setReponsePage(reponsePage + 1)}
								className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
							>
								Suivant
							</button>
						</div>
					)}
				</div>

				{commentaires.length > 0 && (
					<div className="bg-white rounded-lg border border-slate-200 p-5">
						<div className="flex items-center gap-3 mb-6">
							<div className="w-10 h-10 rounded-md bg-purple-50 flex items-center justify-center">
								<MessageSquare size={20} className="text-purple-600" />
							</div>
							<div>
								<h2 className="text-lg font-bold text-slate-900">Commentaires</h2>
								<p className="text-sm text-slate-500">
									{commentaires.filter(c => c.approuveParAdmin === false).length > 0
										? `${commentaires.filter(c => c.approuveParAdmin === false).length} en attente d'approbation`
										: "Tous approuvés"}
								</p>
							</div>
						</div>

						<div className="space-y-3">
							{commentaires.map((c) => {
								const isPending = c.approuveParAdmin === false;
								return (
									<div key={c.id} className={`bg-slate-50 border rounded-lg p-4 ${isPending ? "border-amber-200" : "border-slate-200"}`}>
										<div className="flex justify-between items-start mb-2">
											<div className="flex items-center gap-2">
												<div className="w-7 h-7 rounded-md bg-teal-50 flex items-center justify-center">
													<User size={13} className="text-teal-600" />
												</div>
												<div>
													<p className="text-slate-900 text-sm font-medium">
														{c.user?.nom} {c.user?.prenom}
													</p>
													<p className="text-[10px] text-slate-500">{c.user?.role?.name}</p>
												</div>
											</div>
											<div className="flex items-center gap-2">
												{isPending && (
													<span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-medium">
														Non approuvé
													</span>
												)}
												{c.approuveParAdmin === true && c.user?.role?.name === "agent" && (
													<span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
														Approuvé
													</span>
												)}
												<span className="text-[10px] text-slate-500">
													{c.dateCommentaire ? new Date(c.dateCommentaire).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }) : ""}
												</span>
											</div>
										</div>
										<p className={`text-sm leading-relaxed ${isPending ? "text-slate-400" : "text-slate-700"}`}>
											{c.contenu}
										</p>
										{isPending && (authUser?.role === "admin" || authUser?.role === "manager") && (
											<div className="mt-3 pt-3 border-t border-slate-200">
												<button
													onClick={() => handleApprouverCommentaire(c.id)}
													disabled={approvingId === c.id}
													className="h-7 px-3 rounded-md flex items-center gap-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all text-xs font-medium disabled:opacity-50"
												>
													{approvingId === c.id ? (
														<div className="w-3 h-3 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
													) : (
														<><ShieldCheck size={13} /> Approuver et rendre visible au client</>
													)}
												</button>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				)}

				<div className="bg-white rounded-lg border border-slate-200 p-5">
					<div className="flex items-center gap-3 mb-6">
						<div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center">
							<CheckCircle size={20} className="text-emerald-600" />
						</div>

						<div>
							<h2 className="text-lg font-bold text-slate-900">Statut Final</h2>

							<p className="text-sm text-slate-500">
								État actuel de la réclamation
							</p>
						</div>
					</div>

					<div className="flex items-center justify-between">
						<div>
							<p className="text-slate-500 text-sm mb-2">Statut actuel</p>

							<span className="inline-flex px-4 py-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
								{reclamation?.status?.status || "Non défini"}
							</span>
						</div>

						<div className="text-right">
							<p className="text-slate-500 text-xs">Réclamation</p>

							<p className="text-slate-900 font-semibold">#{reclamation?.id}</p>
						</div>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
