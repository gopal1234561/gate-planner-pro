import { supabase } from '@/integrations/supabase/client';

export interface GateSubject {
  name: string;
  short: string;
  weightage: number; // approximate GATE CS weightage in %
  color: string;
}

export const GATE_SUBJECTS: GateSubject[] = [
  { name: 'Data Structures',   short: 'DS',       weightage: 7,  color: '#8B5CF6' },
  { name: 'Algorithms',        short: 'Algo',     weightage: 8,  color: '#EC4899' },
  { name: 'C Programming',     short: 'C',        weightage: 5,  color: '#F59E0B' },
  { name: 'Computer Networks', short: 'CN',       weightage: 8,  color: '#06B6D4' },
  { name: 'Operating System',  short: 'OS',       weightage: 9,  color: '#10B981' },
  { name: 'Compiler Design',   short: 'CD',       weightage: 4,  color: '#EF4444' },
  { name: 'TOC',               short: 'TOC',      weightage: 7,  color: '#6366F1' },
  { name: 'Digital Logic',     short: 'DL',       weightage: 6,  color: '#84CC16' },
  { name: 'COA',               short: 'COA',      weightage: 8,  color: '#F97316' },
  { name: 'Engineering Mathematics', short: 'EM', weightage: 13, color: '#3B82F6' },
  { name: 'Discrete Mathematics',    short: 'DM', weightage: 9,  color: '#A855F7' },
  { name: 'Aptitude',          short: 'APT',      weightage: 15, color: '#14B8A6' },
  { name: 'DBMS',              short: 'DBMS',     weightage: 8,  color: '#D946EF' },
];

/**
 * Ensures the default GATE subjects exist in the user's `subjects` table.
 * Safe to call multiple times — only inserts subjects that are missing (by name).
 */
export async function seedGateSubjects(userId: string): Promise<void> {
  if (!userId) return;
  const { data: existing } = await supabase
    .from('subjects')
    .select('name')
    .eq('user_id', userId);

  const existingNames = new Set((existing || []).map((s: any) => s.name.toLowerCase()));
  const toInsert = GATE_SUBJECTS
    .filter(s => !existingNames.has(s.name.toLowerCase()))
    .map(s => ({ user_id: userId, name: s.name, color: s.color }));

  if (toInsert.length > 0) {
    await supabase.from('subjects').insert(toInsert);
  }
}
