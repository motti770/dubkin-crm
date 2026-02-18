'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi, Contact } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <Button size="sm" className="gap-2">
          <Plus size={16} />
          איש קשר חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>הוספת איש קשר</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>שם *</Label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="שם מלא"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>טלפון</Label>
              <Input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="05X-XXXXXXX"
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <Label>אימייל</Label>
              <Input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
                dir="ltr"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>חברה</Label>
              <Input
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="שם החברה"
              />
            </div>
            <div className="space-y-1">
              <Label>מקור</Label>
              <select
                value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">בחר מקור</option>
                {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>הערות</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="הערות נוספות..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={!form.name || mutation.isPending}
          >
            {mutation.isPending ? 'שומר...' : 'הוסף'}
          </Button>
        </DialogFooter>
        {mutation.isError && (
          <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">אנשי קשר</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.total ?? 0} אנשי קשר במערכת
          </p>
        </div>
        <AddContactDialog onSuccess={() => {}} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute right-3 top-2.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="חיפוש לפי שם, אימייל, טלפון, חברה..."
          className="pr-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-14 rounded bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-12 text-center">
              <User size={40} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                {search ? 'לא נמצאו תוצאות לחיפוש' : 'אין אנשי קשר עדיין'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">שם</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">חברה</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">טלפון</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">אימייל</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">מקור</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">תאריך</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact, idx) => (
                    <tr
                      key={contact.id}
                      className={`border-b border-border/40 hover:bg-secondary/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-secondary/10'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                            {contact.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{contact.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {contact.company ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building size={12} />
                            {contact.company}
                          </div>
                        ) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {contact.phone ? (
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                            dir="ltr"
                          >
                            <Phone size={12} />
                            {contact.phone}
                          </a>
                        ) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                            dir="ltr"
                          >
                            <Mail size={12} />
                            {contact.email}
                          </a>
                        ) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {contact.source ? (
                          <Badge variant="secondary" className="text-xs">
                            {SOURCE_LABELS[contact.source] || contact.source}
                          </Badge>
                        ) : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">{formatDate(contact.created_at)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            if (confirm(`למחוק את ${contact.name}?`)) {
                              deleteMutation.mutate(contact.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
