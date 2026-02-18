'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsApi, activitiesApi, contactsApi, Deal, Activity } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils';
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
import {
  Plus,
  ChevronLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  CheckSquare,
  FileText,
  Handshake,
} from 'lucide-react';

const STAGES = ['צינון', 'אפיון', 'מחירה', 'סגירה', 'לקוח פעיל', 'ארכיון'];

const STAGE_COLORS: Record<string, string> = {
  'צינון': 'secondary',
  'אפיון': 'info',
  'מחירה': 'warning',
  'סגירה': 'warning',
  'לקוח פעיל': 'success',
  'ארכיון': 'outline',
};

const ACTIVITY_TYPES = [
  { value: 'call', label: 'שיחה', icon: Phone },
  { value: 'email', label: 'אימייל', icon: Mail },
  { value: 'meeting', label: 'פגישה', icon: Handshake },
  { value: 'note', label: 'הערה', icon: FileText },
  { value: 'task', label: 'משימה', icon: CheckSquare },
];

const ACTIVITY_ICONS: Record<string, any> = {
  call: Phone,
  email: Mail,
  meeting: Handshake,
  note: FileText,
  task: CheckSquare,
  message: MessageSquare,
};

function AddDealDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    contact_id: '',
    value: '',
    stage: 'צינון',
    notes: '',
  });

  const qc = useQueryClient();
  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsApi.list(),
  });
  const contacts = contactsData?.data || [];

  const mutation = useMutation({
    mutationFn: (data: any) => dealsApi.create({
      ...data,
      contact_id: data.contact_id ? parseInt(data.contact_id) : undefined,
      value: data.value ? parseFloat(data.value) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
      setOpen(false);
      setForm({ title: '', contact_id: '', value: '', stage: 'צינון', notes: '' });
      onSuccess();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus size={16} />
          עסקה חדשה
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>הוספת עסקה</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>שם עסקה *</Label>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="תיאור העסקה"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>שלב</Label>
              <select
                value={form.stage}
                onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>שווי (₪)</Label>
              <Input
                type="number"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder="0"
                dir="ltr"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>איש קשר</Label>
            <select
              value={form.contact_id}
              onChange={e => setForm(f => ({ ...f, contact_id: e.target.value }))}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">ללא איש קשר</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>הערות</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="פרטים נוספים..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={!form.title || mutation.isPending}
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

function DealDetail({ deal, onBack }: { deal: Deal; onBack: () => void }) {
  const qc = useQueryClient();
  const [activityForm, setActivityForm] = useState({ type: 'note', description: '' });
  const [addingActivity, setAddingActivity] = useState(false);

  const { data: activitiesData, isLoading: actLoading } = useQuery({
    queryKey: ['activities', deal.id],
    queryFn: () => activitiesApi.list(deal.id),
  });

  const stageMutation = useMutation({
    mutationFn: (stage: string) => dealsApi.updateStage(deal.id, stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['pipeline'] });
    },
  });

  const activityMutation = useMutation({
    mutationFn: () => activitiesApi.create({
      deal_id: deal.id,
      type: activityForm.type,
      description: activityForm.description,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities', deal.id] });
      setActivityForm({ type: 'note', description: '' });
      setAddingActivity(false);
    },
  });

  const activities = activitiesData?.data || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">{deal.title}</h1>
          {deal.contact_name && (
            <p className="text-sm text-muted-foreground">{deal.contact_name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">פרטי עסקה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deal.value && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">שווי</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(deal.value)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-2">שלב נוכחי</p>
              <Badge variant={STAGE_COLORS[deal.stage] as any}>{deal.stage}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">שנה שלב</p>
              <div className="flex flex-wrap gap-1">
                {STAGES.filter(s => s !== deal.stage).map(stage => (
                  <button
                    key={stage}
                    onClick={() => stageMutation.mutate(stage)}
                    disabled={stageMutation.isPending}
                    className="text-xs px-2 py-1 rounded border border-border hover:bg-secondary transition-colors"
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">תאריך יצירה</p>
              <p className="text-sm">{formatDate(deal.created_at)}</p>
            </div>
            {deal.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">הערות</p>
                <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">לוג פעילות</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddingActivity(!addingActivity)}
                className="gap-1"
              >
                <Plus size={14} />
                הוסף
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add activity form */}
            {addingActivity && (
              <div className="border border-border rounded-lg p-4 space-y-3 bg-secondary/20">
                <div className="flex gap-2">
                  {ACTIVITY_TYPES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setActivityForm(f => ({ ...f, type: value }))}
                      className={cn(
                        'flex items-center gap-1 text-xs px-2 py-1.5 rounded border transition-colors',
                        activityForm.type === value
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-border text-muted-foreground hover:bg-secondary'
                      )}
                    >
                      <Icon size={12} />
                      {label}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={activityForm.description}
                  onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="תיאור הפעילות..."
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setAddingActivity(false)}>
                    ביטול
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => activityMutation.mutate()}
                    disabled={!activityForm.description || activityMutation.isPending}
                  >
                    {activityMutation.isPending ? 'שומר...' : 'שמור'}
                  </Button>
                </div>
              </div>
            )}

            {/* Activity timeline */}
            {actLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-14 rounded bg-muted/30 animate-pulse" />)}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">אין פעילות עדיין</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute right-3.5 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {activities.map(activity => {
                    const Icon = ACTIVITY_ICONS[activity.type] || FileText;
                    return (
                      <div key={activity.id} className="flex gap-4 relative">
                        <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 z-10">
                          <Icon size={13} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDateTime(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DealsPage() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [stageFilter, setStageFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: dealsApi.list,
  });

  const deals = (data?.data || []).filter(d =>
    stageFilter ? d.stage === stageFilter : true
  );

  if (selectedDeal) {
    const currentDeal = data?.data?.find(d => d.id === selectedDeal.id) || selectedDeal;
    return <DealDetail deal={currentDeal} onBack={() => setSelectedDeal(null)} />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">עסקאות</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.total ?? 0} עסקאות במערכת</p>
        </div>
        <AddDealDialog onSuccess={() => {}} />
      </div>

      {/* Stage filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStageFilter('')}
          className={cn(
            'text-xs px-3 py-1.5 rounded-full border transition-colors',
            !stageFilter ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'
          )}
        >
          הכל
        </button>
        {STAGES.map(stage => {
          const count = (data?.data || []).filter(d => d.stage === stage).length;
          return (
            <button
              key={stage}
              onClick={() => setStageFilter(stage === stageFilter ? '' : stage)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-colors',
                stageFilter === stage ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'
              )}
            >
              {stage} {count > 0 && <span className="opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Deals list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-card border border-border animate-pulse" />)}
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-16">
          <Handshake size={48} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">אין עסקאות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map(deal => (
            <div
              key={deal.id}
              onClick={() => setSelectedDeal(deal)}
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-card/80 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <Badge variant={STAGE_COLORS[deal.stage] as any} className="shrink-0">
                  {deal.stage}
                </Badge>
                <div>
                  <p className="text-sm font-medium">{deal.title}</p>
                  {deal.contact_name && (
                    <p className="text-xs text-muted-foreground">{deal.contact_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {deal.value ? (
                  <span className="text-sm font-semibold text-emerald-400">
                    {formatCurrency(deal.value)}
                  </span>
                ) : null}
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {formatDate(deal.created_at)}
                </span>
                <ChevronLeft size={16} className="text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
