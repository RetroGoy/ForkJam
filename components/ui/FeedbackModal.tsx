'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createFeedback } from '@/lib/createFeedback';

export default function FeedbackModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  // focus auto quand ça s’ouvre
  useEffect(() => {
    if (open) nameRef.current?.focus();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createFeedback(form);
      setSent(true);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      alert('Erreur lors de l’envoi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg bg-gray-900 border border-yellow-900 p-6 text-sm">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-400 hover:text-white">
          ✕
        </button>

        <h3 className="text-xl font-semibold text-primary mb-4">
          Donne‑nous ton avis
        </h3>

        {sent ? (
          <p className="text-green-400">
            Merci ! Ton retour a été envoyé.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-1">
              <label htmlFor="name">Nom</label>
              <input
                ref={nameRef}
                id="name"
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="email">E‑mail (optionnel)</label>
              <input
                id="email"
                type="email"
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="msg">Idées / suggestions</label>
              <textarea
                id="msg"
                rows={4}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 resize-none"
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>

            {/* roadmap « à venir » */}
            <div className="border border-yellow-900 bg-gray-800/70 p-2 rounded">
              <p className="font-semibold text-green-400 text-sm">
                Mises à jour à venir
              </p>
              <ul className="list-disc ml-4 text-xs text-green-300/70 space-y-0.5">
                <li>Lecture de samples audio</li>
                <li>Partage public de nœuds</li>
                <li>Mode hors‑ligne</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1 bg-primary hover:bg-primary/90 rounded disabled:opacity-50"
              >
                {loading ? '…' : 'Envoyer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
