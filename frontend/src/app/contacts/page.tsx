'use client';

import { useQuery } from '@tanstack/react-query';
import { contactsApi, Contact } from '@/lib/api';
import { useState } from 'react';
import { Search, Phone, Mail, Building2, Loader2, UserPlus } from 'lucide-react';

function ContactCard({ contact }: { contact: Contact }) {
  const initials = contact.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3 active:scale-[0.98] transition-transform">
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
        {initials}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{contact.name}</p>
        {contact.company && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Building2 size={11} /> {contact.company}
          </p>
        )}
        <div className="flex gap-3 mt-2">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-1 text-xs text-blue-400 min-h-[36px]"
            >
              <Phone size={13} /> {contact.phone}
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-1 text-xs text-muted-foreground min-h-[36px] truncate"
            >
              <Mail size={13} /> {contact.email}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', search],
    queryFn: () => contactsApi.list(search || undefined),
    staleTime: 10_000,
  });

  const contacts = data?.data || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-bold">אנשי קשר</h1>
          <button className="btn-primary px-3 text-sm min-h-[36px] gap-1.5">
            <UserPlus size={16} /> הוסף
          </button>
        </div>
        {/* Search bar */}
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="חפש לפי שם, חברה, טלפון…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl pr-9 pl-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[44px]"
          />
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-sm">{search ? 'לא נמצאו תוצאות' : 'אין אנשי קשר עדיין'}</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{contacts.length} אנשי קשר</p>
            {contacts.map((c) => (
              <ContactCard key={c.id} contact={c} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
