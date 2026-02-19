'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi, Contact } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

const SOURCE_LABELS: Record<string, string> = {
  referral: 'המלצה',
  website: 'אתר',
  social: 'סושיאל',
  cold: 'קר',
  other: 'אחר',
  'ישיר': 'ישיר',
  'שיתוף פעולה': 'שיתוף פעולה',
  'לקוחה ישנה': 'לקוחה ישנה',
  'לקוח ישן': 'לקוח ישן',
  'בר (מעצבת)': 'בר',
  'משפחה': 'משפחה',
  'ממולץ': 'ממולץ',
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
        <button className="glass-panel h-10 w-10 rounded-full flex items-center justify-center text-primary hover:bg-white/80 transition-all duration-200 shadow-glass-sm active:scale-95">
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl text-slate-900 scale-in">
        <DialogHeader>
          <DialogTitle className="text-slate-900">הוספת איש קשר</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-slate-600">שם *</Label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="שם מלא"
              className="bg-white/60 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-600">טלפון</Label>
              <Input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="05X-XXXXXXX"
                dir="ltr"
                className="bg-white/60 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600">אימייל</Label>
              <Input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
                dir="ltr"
                className="bg-white/60 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-600">חברה</Label>
              <Input
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="שם החברה"
                className="bg-white/60 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-600">מקור</Label>
              <select
                value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                className="flex h-9 w-full rounded-xl border border-slate-200 bg-white/60 px-3 py-1 text-sm text-slate-900"
              >
                <option value="">בחר מקור</option>
                {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-600">הערות</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="הערות נוספות..."
              rows={3}
              className="bg-white/60 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={!form.name || mutation.isPending}
            className="bg-primary hover:bg-blue-600 rounded-xl font-semibold text-white"
          >
            {mutation.isPending ? 'שומר...' : 'הוסף'}
          </Button>
        </DialogFooter>
        {mutation.isError && (
          <p className="text-sm text-red-500">{(mutation.error as Error).message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ContactCard({ contact, onDelete, index }: { contact: Contact; onDelete: (id: number) => void; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="glass-card rounded-2xl p-4 shadow-glass hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99] fade-in-up"
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <Link href={`/contacts/${contact.id}`} onClick={e => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-0.5 shadow-sm shrink-0">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <span className="text-lg font-bold text-primary/80">{contact.name.charAt(0)}</span>
            </div>
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/contacts/${contact.id}`}
            onClick={e => e.stopPropagation()}
            className="block"
          >
            <h4 className="text-slate-900 font-bold text-sm truncate hover:text-primary transition-colors duration-200">{contact.name}</h4>
          </Link>
          {contact.company && (
            <p className="text-slate-500 text-xs truncate">{contact.company}</p>
          )}
        </div>
        {contact.source && (
          <span className="text-[10px] font-medium text-primary bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
            {SOURCE_LABELS[contact.source] || contact.source}
          </span>
        )}
        {contact.phone && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open('https://wa.me/972' + contact.phone!.replace(/\D/g, '').replace(/^0/, ''), '_blank');
            }}
            className="h-9 w-9 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-sm hover:scale-110 active:scale-95 transition-transform duration-200 shrink-0"
            title="שלח WhatsApp"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 pt-3 border-t border-slate-200/50 fade-in-up" style={{ animationDelay: '0ms' }}>
          {contact.phone && (
            <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-3 group hover:bg-white/40 p-2 -mx-2 rounded-xl transition-colors duration-200">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-lg">phone_iphone</span>
              </div>
              <span className="text-slate-900 font-bold text-sm" dir="ltr">{contact.phone}</span>
            </a>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-3 group hover:bg-white/40 p-2 -mx-2 rounded-xl transition-colors duration-200">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-lg">alternate_email</span>
              </div>
              <span className="text-slate-900 font-bold text-sm truncate" dir="ltr">{contact.email}</span>
            </a>
          )}

          <div className="grid grid-cols-4 gap-2 pt-2">
            {contact.phone && (
              <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()} className="flex flex-col items-center gap-1 group">
                <div className="glass-button w-10 h-10 rounded-full flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform duration-200">
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </div>
                <span className="text-[10px] font-medium text-slate-500">התקשר</span>
              </a>
            )}
            {contact.phone && (
              <a href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`} onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 group">
                <div className="glass-button w-10 h-10 rounded-full flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-200">
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </div>
                <span className="text-[10px] font-medium text-slate-500">וואטסאפ</span>
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} className="flex flex-col items-center gap-1 group">
                <div className="glass-button w-10 h-10 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-200">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <span className="text-[10px] font-medium text-slate-500">מייל</span>
              </a>
            )}
            <button
              onClick={e => { e.stopPropagation(); if (confirm(`למחוק את ${contact.name}?`)) onDelete(contact.id); }}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="glass-button w-10 h-10 rounded-full flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform duration-200">
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </div>
              <span className="text-[10px] font-medium text-slate-500">מחק</span>
            </button>
          </div>

          {contact.notes && (
            <div className="bg-white/40 rounded-xl p-3 mt-2">
              <p className="text-xs text-slate-500">{contact.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
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
    clearTimeout((window as unknown as Record<string, ReturnType<typeof setTimeout>>).__searchTimer);
    (window as unknown as Record<string, ReturnType<typeof setTimeout>>).__searchTimer = setTimeout(() => setDebouncedSearch(val), 300);
  };

  const contacts = data?.data || [];

  return (
    <div className="pt-8 px-2 md:px-0 pb-24 md:pb-8 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">אנשי קשר</h1>
          <p className="text-slate-500 text-sm mt-1">{data?.total ?? 0} אנשי קשר</p>
        </div>
        <AddContactDialog onSuccess={() => {}} />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 text-[20px]">search</span>
        <input
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="חיפוש לפי שם, אימייל, טלפון..."
          className="w-full h-10 pr-10 pl-3 glass-panel rounded-2xl text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      {/* Contact List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-20 rounded-2xl glass-card animate-pulse" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="py-16 text-center">
          <span className="material-symbols-outlined text-slate-300 text-[48px] mb-3 block">groups</span>
          <p className="text-slate-400 text-sm mb-4">
            {search ? 'לא נמצאו תוצאות לחיפוש' : 'אין אנשי קשר עדיין'}
          </p>
          {!search && (
            <AddContactDialog onSuccess={() => {}} />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {contacts.map((contact, i) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onDelete={(id) => deleteMutation.mutate(id)}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
