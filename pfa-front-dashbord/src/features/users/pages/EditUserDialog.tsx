import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../../../lib/axiosInstance";
import { User, Role } from "../../../types";

interface Props {
	open: boolean;
	onClose: () => void;
	user: User | null;
	roles: Role[];
	onSuccess: () => void;
}

export default function EditUserDialog({
	open,
	onClose,
	user,
	roles,
	onSuccess,
}: Props) {
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const [form, setForm] = useState({
		nom: "",
		prenom: "",
		email: "",
		password: "",
		roleId: "",
	});

	useEffect(() => {
		if (user) {
			setForm({
				nom: user.nom || "",
				prenom: user.prenom || "",
				email: user.email || "",
				password: "",
				roleId: String(user.role?.id || ""),
			});
		}
	}, [user]);

	const handleUpdate = async () => {
		if (!user) return;

		try {
			setSaving(true);
			setError("");

			const payload: User = {
				nom: form.nom,
				prenom: form.prenom,
				email: form.email,
				role: {
					id: Number(form.roleId),
					name : roles.find((r) => r.id === Number(form.roleId))?.name || "",
				},
			};

			if (form.password.trim()) {
				payload.password = form.password;
			}

			await api.put(`/users/update-user/${user.id}`, payload);

			onSuccess();
			onClose();
            
		} catch (e: any) {
			setError(
				e.response?.data?.message ||
					e.response?.data ||
					"Erreur lors de la modification"
			);
		} finally {
			setSaving(false);
		}
	};

	if (!open || !user) return null;

	return (
		<div
			className="fixed inset-0 z-50 bg-black/50 overflow-y-auto"
			onClick={onClose}
		>
			<div className="flex justify-center pt-10">
				<div
					className="bg-white w-full max-w-xl rounded-xl shadow-xl"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
						<h2 className="text-2xl font-semibold text-slate-900">
							Modifier utilisateur
						</h2>

						<button
							onClick={onClose}
							className="text-slate-400 hover:text-slate-600"
						>
							<X size={22} />
						</button>
					</div>

					<div className="p-6 space-y-5">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-sm text-slate-500 mb-1">
									Nom
								</label>

								<input
									value={form.nom}
									onChange={(e) =>
										setForm({
											...form,
											nom: e.target.value,
										})
									}
									className="w-full h-11 border border-slate-300 rounded-md px-3"
								/>
							</div>

							<div>
								<label className="block text-sm text-slate-500 mb-1">
									Prénom
								</label>

								<input
									value={form.prenom}
									onChange={(e) =>
										setForm({
											...form,
											prenom: e.target.value,
										})
									}
									className="w-full h-11 border border-slate-300 rounded-md px-3"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm text-slate-500 mb-1">
								Email
							</label>

							<input
								type="email"
								value={form.email}
								onChange={(e) =>
									setForm({
										...form,
										email: e.target.value,
									})
								}
								className="w-full h-11 border border-slate-300 rounded-md px-3"
							/>
						</div>

						<div>
							<label className="block text-sm text-slate-500 mb-1">
								Nouveau mot de passe
							</label>

							<input
								type="password"
								value={form.password}
								onChange={(e) =>
									setForm({
										...form,
										password: e.target.value,
									})
								}
								placeholder="Laisser vide pour conserver l'ancien"
								className="w-full h-11 border border-slate-300 rounded-md px-3"
							/>
						</div>

						<div>
							<label className="block text-sm text-slate-500 mb-1">
								Rôle
							</label>

							<select
								value={form.roleId}
								onChange={(e) =>
									setForm({
										...form,
										roleId: e.target.value,
									})
								}
								className="w-full h-11 border border-slate-300 rounded-md px-3 bg-white"
							>
								{roles.map((role) => (
									<option
										key={role.id}
										value={role.id}
									>
										{role.name}
									</option>
								))}
							</select>
						</div>

						{error && (
							<p className="text-red-500 text-sm">
								{error}
							</p>
						)}
					</div>

					<div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
						<button
							onClick={onClose}
							className="px-5 h-10 border border-slate-300 rounded-md hover:bg-slate-50"
						>
							Annuler
						</button>

						<button
							onClick={handleUpdate}
							disabled={saving}
							className="px-5 h-10 bg-teal-600 text-white rounded-md hover:bg-teal-700"
						>
							{saving
								? "Modification..."
								: "Modifier"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

