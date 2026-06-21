import { useState } from "react";
import { MessageSquare, Send, ShieldCheck } from "lucide-react";
import { Commentaire, AuthUser } from "../../../types";
import api from "../../../lib/axiosInstance";

type Props = {
	commentaires: Commentaire[];
	message: string;
	setMessage: (value: string) => void;
	sendComment: () => void;
	sending: boolean;
	user: AuthUser | null;
	onRefresh?: () => void;
	isResolu : boolean;
};

export default function CommentairesSection({
	commentaires,
	message,
	setMessage,
	sendComment,
	sending,
	user,
	onRefresh,
	isResolu,
}: Props) {
	const [approvingId, setApprovingId] = useState<number | null>(null);
	const isAdmin = user?.role === "admin";
	const isManager = user?.role === "manager";


	const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (!sending && message.trim()) sendComment();
		}
	};

	const handleApprouver = async (id: number) => {
		setApprovingId(id);
		try {
			await api.put(`/commentaires/approuver/${id}`);
			onRefresh?.();
		} catch (e) {
			console.error(e);
		} finally {
			setApprovingId(null);
		}
	};

	return (
		<div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
			<div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2.5">
				<div className="w-8 h-8 rounded-md bg-teal-50 flex items-center justify-center">
					<MessageSquare size={15} className="text-teal-600" />
				</div>
				<div>
					<h2 className="text-sm font-bold text-slate-900">Commentaires</h2>
					<p className="text-[11px] text-slate-500">
						{commentaires.length} message{commentaires.length !== 1 ? "s" : ""}
					</p>
				</div>
			</div>

			<div className="p-4 space-y-4 max-h-[420px] overflow-y-auto scroll-smooth">
				{commentaires.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center mb-3">
							<MessageSquare size={20} className="text-slate-400" />
						</div>
						<p className="text-sm text-slate-500">
							Aucun commentaire pour le moment
						</p>
						<p className="text-xs text-slate-400 mt-1">
							Soyez le premier à commenter
						</p>
					</div>
				) : (
					commentaires.map((c) => {
						const isMine = c.user?.id === user?.userId;
						const isPending = c.approuveParAdmin === false;
						return (
							<div key={c.id}>
								<div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
									<div className={`max-w-[72%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`}>
										<span className="text-[10px] font-semibold text-slate-500 px-1">
											{isMine
												? "Vous"
												: `${c.user?.nom || ""} ${c.user?.prenom || ""}`.trim()}
										</span>
										<div
											className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
												isMine
													? "bg-teal-600 text-white rounded-br-sm"
													: "bg-slate-50 border border-slate-200 text-slate-700 rounded-bl-sm"
											} ${isPending ? "opacity-70" : ""}`}
										>
											{c.contenu}
										</div>
										<div className="flex items-center gap-2 px-1">
											<span className="text-[10px] text-slate-400">
												{c.dateCommentaire
													? new Date(c.dateCommentaire).toLocaleString("fr-FR", {
															hour: "2-digit",
															minute: "2-digit",
															day: "numeric",
															month: "short",
														})
													: ""}
											</span>
											{isPending && (
												<span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md font-medium">
													En attente d'approbation
												</span>
											)}
										</div>
									</div>
								</div>
								{isPending && isAdmin || isManager && (
									<div className="flex justify-start mt-1.5 ml-1">
										<button
											onClick={() => handleApprouver(c.id)}
											disabled={approvingId === c.id}
											className="h-6 px-2.5 rounded-md flex items-center gap-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all text-[11px] font-medium disabled:opacity-50"
										>
											{approvingId === c.id ? (
												<div className="w-3 h-3 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
											) : (
												<><ShieldCheck size={12} /> Approuver</>
											)}
										</button>
									</div>
								)}
							</div>
						);
					})
				)}
			</div>
			{!isResolu && (
			<div className="border-t border-slate-200 p-4 bg-slate-50">
				<div className="flex items-end gap-3">
					<textarea
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKey}
						placeholder="Écrire un commentaire... (Entrée pour envoyer)"
						rows={2}
						className="flex-1 bg-white border border-slate-200 text-slate-900 rounded-md px-4 py-3 text-sm outline-none resize-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 placeholder-slate-400 transition-all"
					/>
					<button
						onClick={sendComment}
						disabled={sending || !message.trim()}
						className="w-11 h-11 rounded-md bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
					>
						{sending ? (
							<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
						) : (
							<Send size={16} />
						)}
					</button>
				</div>
			</div>
			)}
		</div>
	);
}
