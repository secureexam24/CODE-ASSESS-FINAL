
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User, Mail, Hash, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Exam, Student } from '@/pages/Index';

interface StudentRegistrationProps {
  exam: Exam;
  onSuccess: (student: Student) => void;
}

const StudentRegistration: React.FC<StudentRegistrationProps> = ({ exam, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.rollNumber.trim()) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!formData.email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if student already exists with this roll number using maybeSingle()
      const { data: existingStudent, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('roll_number', formData.rollNumber)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      let studentId: string;

      if (existingStudent) {
        // Use existing student
        studentId = existingStudent.id;
        console.log('Using existing student:', existingStudent);
      } else {
        // Create new student
        const { data: newStudent, error: studentError } = await supabase
          .from('students')
          .insert({
            name: formData.name,
            email: formData.email,
            roll_number: formData.rollNumber
          })
          .select()
          .single();

        if (studentError) {
          throw studentError;
        }

        studentId = newStudent.id;
        console.log('Created new student:', newStudent);
      }

      // Check if student has already submitted this exam using maybeSingle()
      const { data: existingSubmission, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', studentId)
        .eq('exam_id', exam.id)
        .maybeSingle();

      if (submissionError) {
        throw submissionError;
      }

      if (existingSubmission) {
        toast({
          title: "Already Submitted",
          description: "You have already submitted this exam",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Registration Successful",
        description: "You're now ready to start the exam",
      });

      onSuccess({
        ...formData,
        id: studentId
      });
    } catch (error) {
      console.error('Error during registration:', error);
      toast({
        title: "Registration Failed",
        description: "Failed to register. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Not specified';
    try {
      return new Date(timeString).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Exam Info Header */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-blue-900">{exam.name}</h2>
              <p className="text-blue-700">{exam.topic}</p>
              <div className="flex items-center justify-center gap-4 text-sm text-blue-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {exam.startTime && exam.endTime 
                      ? `${formatTime(exam.startTime)} - ${formatTime(exam.endTime)}`
                      : 'Time not specified'
                    }
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Student Registration
            </CardTitle>
            <CardDescription>
              Please provide your details to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rollNumber" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Roll Number
                </Label>
                <Input
                  id="rollNumber"
                  type="text"
                  placeholder="Enter your roll number"
                  value={formData.rollNumber}
                  onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                  className="focus:border-blue-500"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
                disabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Start Exam'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentRegistration;
