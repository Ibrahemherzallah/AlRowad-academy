import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, MailOpen, CheckCheck, Archive } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { adminApi } from '@/lib/admin.api';

interface Message {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: string;
}

const STATUS_VARIANT: Record<string, 'success' | 'accent' | 'muted' | 'secondary'> = {
  new: 'accent', read: 'secondary', replied: 'success', archived: 'muted',
};

export default function AdminContactPage() {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    adminApi.listMessages()
      .then((m) => setMessages(m as Message[]))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminApi.updateMessage(id, status);
      load();
    } catch { toast.error(t('common.error')); }
  };

  const open = (msg: Message) => {
    setExpanded(expanded === msg._id ? null : msg._id);
    if (msg.status === 'new') updateStatus(msg._id, 'read');
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold">{t('admin.navContact')}</h2>
        <p className="text-sm text-muted-foreground">{messages.filter((m) => m.status === 'new').length} {t('admin.unread') || 'جديدة'}</p>
      </div>

      {messages.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Mail className="mx-auto size-10 mb-3 opacity-30" />
          {t('admin.noData')}
        </Card>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <Card key={msg._id} className={`overflow-hidden transition-all ${msg.status === 'archived' ? 'opacity-50' : ''}`}>
              {/* Header row */}
              <button
                className={`w-full flex items-center gap-4 p-4 text-start hover:bg-muted/30 ${msg.status === 'new' ? 'bg-primary/5' : ''}`}
                onClick={() => open(msg)}
              >
                <div className="shrink-0">
                  {msg.status === 'new'
                    ? <Mail className="size-5 text-primary" />
                    : <MailOpen className="size-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{msg.name}</span>
                    <Badge variant={STATUS_VARIANT[msg.status]}>{msg.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{msg.subject || msg.message.slice(0, 60)}</p>
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">
                  {new Date(msg.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                </div>
              </button>

              {/* Expanded content */}
              {expanded === msg._id && (
                <div className="border-t border-border p-4 space-y-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex gap-2"><span className="text-muted-foreground">{t('admin.messageFrom')}:</span><span className="font-medium">{msg.name}</span></div>
                    <div className="flex gap-2"><span className="text-muted-foreground">البريد:</span><span dir="ltr">{msg.email}</span></div>
                    {msg.phone && <div className="flex gap-2"><span className="text-muted-foreground">الهاتف:</span><span dir="ltr">{msg.phone}</span></div>}
                    {msg.subject && <div className="flex gap-2"><span className="text-muted-foreground">{t('admin.messageSubject')}:</span><span>{msg.subject}</span></div>}
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => updateStatus(msg._id, 'replied')}>
                      <CheckCheck className="size-4" />{t('admin.markReplied')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(msg._id, 'archived')} className="text-muted-foreground">
                      <Archive className="size-4" />{t('admin.archive')}
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`mailto:${msg.email}?subject=Re: ${msg.subject || ''}`} target="_blank" rel="noopener noreferrer">
                        رد عبر البريد
                      </a>
                    </Button>
                    {msg.phone && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`https://wa.me/${msg.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                          واتساب
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
