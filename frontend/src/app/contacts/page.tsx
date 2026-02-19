'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi, Contact } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Search, Phone, Mail, Building, User, Trash2 } from 'lucide-react';

const SOURCE_LABELS: Record<string, string> = {
  referral: 'המלצה',
  website: 'אתר',
  social: 'סושיאל',
  cold: 'קר',
  other: 'אחר',
};

function AddContactDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    source: '',
    notes: '',
  });

  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: contactsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      setOpen(false);
      setForm({ name: '', phone: '', email: '', company: '', source: '', notes: '' });
      onSuccess();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-2 bg-blue-500 hover:bg-blue-400 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] font-semibold"
        >
          <Plus size={16} />
          איש קשר חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-[rgba(10,20,50,0.92)] backdrop-blur-xl border border-white/15 rounded-2xl text-white">
        <DialogHeader>
          <DialogTitle className="text-white">הוספת איש קשר</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-white/70">שם *</Label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="שם מלא"
              className="bg-white/[0.08] border-white/15 rounded-xl text-white placeholder:text-white/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-white/70">טלפון</Label>
              <Input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="05X-XXXXXXX"
                dir="ltr"
                className="bg-white/[0.08] border-white/15 rounded-xl text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-white/70">אימייל</Label>
              <Input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
                dir="ltr"
                className="bg-white/[0.08] border-white/15 rounded-xl text-white placeholder:text-white/30"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-white/70">חברה</Label>
              <Input
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="שם החברה"
                className="bg-white/[0.08] border-white/15 rounded-xl text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-white/70">מקור</Label>
              <select
                value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                className="flex h-9 w-full rounded-xl border border-white/15 bg-white/[0.08] px-3 py-1 text-sm text-white"
              >
                <option value="" className="bg-[#0a1432]">בחר מקור</option>
                {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value} className="bg-[#0a1432]">{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-white/70">הערות</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="הערות נוספות..."
              rows={3}
              className="bg-white/[0.08] border-white/15 rounded-xl text-white placeholder:text-white/30"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={!form.name || mutation.isPending}
            className="bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold"
          >
            {mutation.isPending ? 'שומר...' : 'הוסף'}
          </Button>
        </DialogFooter>
        {mutation.isError && (
          <p className="text-sm text-red-400">{(mutation.error as Error).message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ContactsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', debouncedSearch],
    queryFn: () => contactsApi.list(debouncedSearch || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: contactsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__searchTimer);
    (window as any).__searchTimer = setTimeout(() => setDebouncedSearch(val), 300);
  };

  const contacts = data?.data || [];

  return (
    <div className="relative z-10 p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">אנשי קשר</h1>
          <p className="text-white/40 text-sm mt-1">
            {data?.total ?? 0} אנשי קשר במערכת
          </p>
        </div>
        <AddContactDialog onSuccess={() => {}} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute right-3 top-2.5 text-white/30" />
        <input
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="חיפוש לפי שם, אימייל, טלפון, חברה..."
          className="w-full h-10 pr-9 pl-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] backdrop-blur rounded-xl text-white placeholder:text-white/30 text-sm outline-none focus:border-blue-500/50 transition-colors"
        />
      </div>

      {/* Contact Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="py-16 text-center">
          <User size={40} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/40">
            {search ? 'לא נמצאו תוצאות לחיפוש' : 'אין אנשי קשר עדיין'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-[rgba(255,255,255,0.06)] border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {contact.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold truncate">{contact.name}</p>
                    {contact.company && (
                      <div className="flex items-center gap-1 text-white/40 text-xs mt-0.5">
                        <Building size={10} />
                        <span className="truncate">{contact.company}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`למחוק את ${contact.name}?`)) {
                      deleteMutation.mutate(contact.id);
                    }
                  }}
                  className="p-1 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mt-3 space-y-1.5">
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 text-white/50 text-xs hover:text-white/70 transition-colors"
                    dir="ltr"
                  >
                    <Phone size={11} />
                    {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-white/50 text-xs hover:text-white/70 transition-colors"
                    dir="ltr"
                  >
                    <Mail size={11} />
                    {contact.email}
                  </a>
                )}
              </div>

              {contact.source && (
                <div className="mt-3">
                  <span className="bg-blue-500/20 text-blue-300 text-[10px] rounded-full px-2 py-0.5">
                    {SOURCE_LABELS[contact.source] || contact.source}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
