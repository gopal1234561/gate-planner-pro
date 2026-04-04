import React from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Subject {
  id: string;
  name: string;
}

const categories = [
  { value: 'conceptual', label: 'Conceptual', group: 'academic' },
  { value: 'calculation', label: 'Calculation', group: 'academic' },
  { value: 'silly', label: 'Silly Mistake', group: 'academic' },
  { value: 'time_management', label: 'Time Management', group: 'personal' },
  { value: 'discipline', label: 'Discipline', group: 'personal' },
  { value: 'habit', label: 'Bad Habit', group: 'personal' },
  { value: 'personal_other', label: 'Personal Other', group: 'personal' },
  { value: 'other', label: 'Other', group: 'academic' },
];

interface MistakeFormProps {
  subjects: Subject[];
  formSubjectId: string;
  setFormSubjectId: (v: string) => void;
  formTopic: string;
  setFormTopic: (v: string) => void;
  formMistake: string;
  setFormMistake: (v: string) => void;
  formCorrection: string;
  setFormCorrection: (v: string) => void;
  formCategory: string;
  setFormCategory: (v: string) => void;
  onSave: () => void;
  saveLabel: string;
}

export const MistakeForm: React.FC<MistakeFormProps> = ({
  subjects, formSubjectId, setFormSubjectId, formTopic, setFormTopic,
  formMistake, setFormMistake, formCorrection, setFormCorrection,
  formCategory, setFormCategory, onSave, saveLabel,
}) => (
  <div className="space-y-3">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Select value={formSubjectId} onValueChange={setFormSubjectId}>
        <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No subject</SelectItem>
          {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input placeholder="Topic (optional)" value={formTopic} onChange={e => setFormTopic(e.target.value)} />
    </div>
    <Textarea placeholder="What was the mistake? *" value={formMistake} onChange={e => setFormMistake(e.target.value)} rows={3} />
    <Textarea placeholder="Correct approach / solution" value={formCorrection} onChange={e => setFormCorrection(e.target.value)} rows={3} />
    <div className="flex gap-3 items-center">
      <Select value={formCategory} onValueChange={setFormCategory}>
        <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">📚 Academic</p>
          {categories.filter(c => c.group === 'academic').map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          <p className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1">🧠 Personal</p>
          {categories.filter(c => c.group === 'personal').map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button onClick={onSave}><Save className="w-4 h-4 mr-1" /> {saveLabel}</Button>
    </div>
  </div>
);
