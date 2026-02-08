import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  Trash2, 
  TrendingUp,
  Award,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
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
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MockTest {
  id: string;
  test_name: string;
  marks: number;
  max_marks: number;
  test_date: string;
  remarks: string | null;
}

const MockTestsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [newTest, setNewTest] = useState({
    test_name: '',
    marks: '',
    max_marks: '100',
    test_date: format(new Date(), 'yyyy-MM-dd'),
    remarks: '',
  });

  useEffect(() => {
    if (user) {
      fetchTests();
    }
  }, [user]);

  const fetchTests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('mock_tests')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: true });

    if (error) {
      toast({ title: 'Error fetching tests', variant: 'destructive' });
    } else {
      setTests(data || []);
    }
    setLoading(false);
  };

  const handleAddTest = async () => {
    if (!user || !newTest.test_name.trim() || !newTest.marks) return;

    const { error } = await supabase.from('mock_tests').insert({
      user_id: user.id,
      test_name: newTest.test_name.trim(),
      marks: parseFloat(newTest.marks),
      max_marks: parseFloat(newTest.max_marks),
      test_date: newTest.test_date,
      remarks: newTest.remarks || null,
    });

    if (error) {
      toast({ title: 'Error adding test', variant: 'destructive' });
    } else {
      toast({ title: 'Test record added' });
      setNewTest({
        test_name: '',
        marks: '',
        max_marks: '100',
        test_date: format(new Date(), 'yyyy-MM-dd'),
        remarks: '',
      });
      setIsAddingTest(false);
      fetchTests();
    }
  };

  const handleDeleteTest = async (id: string) => {
    const { error } = await supabase.from('mock_tests').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting test', variant: 'destructive' });
    } else {
      toast({ title: 'Test deleted' });
      fetchTests();
    }
  };

  const chartData = tests.map(test => ({
    name: test.test_name.substring(0, 10),
    score: (test.marks / test.max_marks) * 100,
    date: format(new Date(test.test_date), 'MMM d'),
  }));

  const averageScore = tests.length > 0 
    ? tests.reduce((acc, t) => acc + (t.marks / t.max_marks) * 100, 0) / tests.length 
    : 0;

  const highestScore = tests.length > 0 
    ? Math.max(...tests.map(t => (t.marks / t.max_marks) * 100)) 
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Mock Tests</h1>
            <p className="text-muted-foreground">Track your test performance</p>
          </div>
          
          <Dialog open={isAddingTest} onOpenChange={setIsAddingTest}>
            <DialogTrigger asChild>
              <GradientButton>
                <Plus className="w-5 h-5 mr-2" /> Add Test
              </GradientButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Mock Test Record</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Test Name *</Label>
                  <Input
                    placeholder="e.g., GATE Mock Test 1"
                    value={newTest.test_name}
                    onChange={(e) => setNewTest({ ...newTest, test_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Marks Obtained *</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 65"
                      value={newTest.marks}
                      onChange={(e) => setNewTest({ ...newTest, marks: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Marks</Label>
                    <Input
                      type="number"
                      value={newTest.max_marks}
                      onChange={(e) => setNewTest({ ...newTest, max_marks: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Test Date</Label>
                  <Input
                    type="date"
                    value={newTest.test_date}
                    onChange={(e) => setNewTest({ ...newTest, test_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea
                    placeholder="Notes about the test..."
                    value={newTest.remarks}
                    onChange={(e) => setNewTest({ ...newTest, remarks: e.target.value })}
                  />
                </div>

                <GradientButton onClick={handleAddTest} className="w-full">
                  Add Test Record
                </GradientButton>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {tests.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassCard>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tests Taken</p>
                  <p className="text-2xl font-bold">{tests.length}</p>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Highest Score</p>
                  <p className="text-2xl font-bold">{highestScore.toFixed(1)}%</p>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Chart */}
        {tests.length > 1 && (
          <GlassCard>
            <h3 className="font-semibold mb-4">Performance Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}

        {/* Tests List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : tests.length === 0 ? (
          <GlassCard className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No mock tests yet</h3>
            <p className="text-muted-foreground mb-6">
              Start recording your mock test scores to track progress
            </p>
            <GradientButton onClick={() => setIsAddingTest(true)}>
              <Plus className="w-5 h-5 mr-2" /> Add Your First Test
            </GradientButton>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {tests.slice().reverse().map((test, index) => {
              const percentage = (test.marks / test.max_marks) * 100;
              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard hover={false} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{test.test_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(test.test_date), 'MMMM d, yyyy')}
                        </p>
                        {test.remarks && (
                          <p className="text-sm text-muted-foreground mt-1">{test.remarks}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold gradient-text">{percentage.toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">
                            {test.marks}/{test.max_marks}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteTest(test.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MockTestsPage;
