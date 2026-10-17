/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { createBackupRecordService } from '../../store/tanstackStore/services/api';
import { queryClient } from '../../utils/tanstack';

const selectClass = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

const initialForm = () => ({
  type: 'RESTORE_TEST',
  status: 'SUCCESS',
  performedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  sizeGb: '',
  notes: '',
});

/**
 * Lets a SuperAdmin record a backup or restore test that the provider API cannot report
 * (restore tests are always manual).
 */
const RecordBackupDialog = ({ open, onOpenChange }) => {
  const [form, setForm] = useState(initialForm);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: createBackupRecordService,
    onSuccess: () => {
      toast.success('Backup record saved');
      queryClient.invalidateQueries({ queryKey: ['system-report'] });
      setForm(initialForm());
      onOpenChange(false);
    },
    onError: (error) => toast.error(error?.message || 'Failed to save backup record'),
  });

  const submit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...form, performedAt: new Date(form.performedAt).toISOString() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record restore test or manual export</DialogTitle>
          <DialogDescription>
            Use this for restore tests and one-off exports. Scheduled backups are reported automatically by mongodb_backup.sh.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="backup-type">Type</Label>
              <select id="backup-type" className={selectClass} value={form.type} onChange={set('type')}>
                <option value="RESTORE_TEST">Restore test</option>
                <option value="MANUAL_EXPORT">Manual export</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="backup-status">Result</Label>
              <select id="backup-status" className={selectClass} value={form.status} onChange={set('status')}>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="backup-date">Performed at</Label>
              <Input id="backup-date" type="datetime-local" value={form.performedAt} max={format(new Date(), "yyyy-MM-dd'T'HH:mm")} onChange={set('performedAt')} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="backup-size">Size (GB, optional)</Label>
              <Input id="backup-size" type="number" min="0" step="0.01" value={form.sizeGb} onChange={set('sizeGb')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="backup-notes">Notes</Label>
            <Textarea
              id="backup-notes"
              rows={3}
              placeholder="e.g. Restored 17 Oct snapshot to staging cluster; verified student and document counts match."
              value={form.notes}
              onChange={set('notes')}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-[#23388F] hover:bg-[#1c2d73]">
              {mutation.isPending ? 'Saving…' : 'Save record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecordBackupDialog;
