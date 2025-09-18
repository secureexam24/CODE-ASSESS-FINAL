import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, BookOpen, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Exam } from '@/pages/Index';

interface AccessCodeEntryProps {
  onSuccess: (exam: Exam) => void;
}

const AccessCodeEntry: React.FC<AccessCodeEntryProps> = ({ onSuccess }) => {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an access code",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Searching for access code:', accessCode.toUpperCase());
      
      // Let's debug what's in the database first
      const { data: allExams, error: allExamsError } = await supabase
        .from('exams')
        .select('*');
      
      console.log('All exams in database:', allExams);
      console.log('All exams error:', allExamsError);

      // Fetch the specific exam
      const { data: exam, error } = await supabase
        .from('exams')
        .select('*')
        .eq('access_code', accessCode.toUpperCase())
        .eq('status', 'active')
        .maybeSingle();

      console.log('Query result - exam:', exam);
      console.log('Query result - error:', error);

      if (error) {
        console.error('Database error:', error);
        toast({
          title: "Database Error",
          description: `Error: ${error.message}. Please try again.`,
          variant: "destructive"
        });
        return;
      }

      if (!exam) {
        // Check if the exam exists but with different status
        const { data: examAnyStatus, error: statusError } = await supabase
          .from('exams')
          .select('*')
          .eq('access_code', accessCode.toUpperCase())
          .maybeSingle();

        console.log('Exam with any status:', examAnyStatus);

        if (examAnyStatus) {
          toast({
            title: "Exam Not Available",
            description: `Exam found but status is: ${examAnyStatus.status}`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Invalid Access Code",
            description: "No exam found with this access code. Please check and try again.",
            variant: "destructive"
          });
        }
        return;
      }

      toast({
        title: "Access Granted",
        description: `Welcome to ${exam.name}`,
      });

      // Convert database exam to frontend format
      const examData: Exam = {
        id: exam.id,
        name: exam.name,
        topic: exam.topic,
        accessCode: exam.access_code,
        startTime: exam.start_time || new Date().toISOString(),
        endTime: exam.end_time || new Date(Date.now() + 3600000).toISOString(), // Default 1 hour
        status: exam.status
      };

      console.log('Converted exam data:', examData);
      onSuccess(examData);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Unexpected Error",
        description: `Something went wrong: ${error}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Code Quest Assess</h1>
          <p className="text-gray-600">Secure Online Examination Portal</p>
        </div>

        {/* Access Code Form */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              Enter Access Code
            </CardTitle>
            <CardDescription>
              Please enter the access code provided by your instructor
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="e.g., MATHS101"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="text-center text-lg font-mono tracking-wider"
                  maxLength={10}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Access Exam'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccessCodeEntry;
