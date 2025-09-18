
import React, { useState } from 'react';
import AccessCodeEntry from '@/components/AccessCodeEntry';
import StudentRegistration from '@/components/StudentRegistration';
import ExamInterface from '@/components/ExamInterface';
import ThankYouScreen from '@/components/ThankYouScreen';

export type ExamPhase = 'access' | 'registration' | 'exam' | 'completed';

export interface Student {
  id?: string;
  name: string;
  email: string;
  rollNumber: string;
}

export interface Exam {
  id: string;
  name: string;
  topic: string;
  accessCode: string;
  duration?: number; // duration in minutes
  status: string;
}

const Index = () => {
  const [currentPhase, setCurrentPhase] = useState<ExamPhase>('access');
  const [exam, setExam] = useState<Exam | null>(null);
  const [student, setStudent] = useState<Student | null>(null);

  const handleAccessCodeSuccess = (examData: Exam) => {
    setExam(examData);
    setCurrentPhase('registration');
  };

  const handleStudentRegistration = (studentData: Student) => {
    setStudent(studentData);
    setCurrentPhase('exam');
  };

  const handleExamComplete = () => {
    setCurrentPhase('completed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {currentPhase === 'access' && (
        <AccessCodeEntry onSuccess={handleAccessCodeSuccess} />
      )}
      
      {currentPhase === 'registration' && exam && (
        <StudentRegistration 
          exam={exam}
          onSuccess={handleStudentRegistration} 
        />
      )}
      
      {currentPhase === 'exam' && exam && student && (
        <ExamInterface 
          exam={exam}
          student={student}
          onComplete={handleExamComplete}
        />
      )}
      
      {currentPhase === 'completed' && (
        <ThankYouScreen student={student} />
      )}
    </div>
  );
};

export default Index;
