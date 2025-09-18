import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle, Circle, Flag, FullscreenIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Exam, Student } from '@/pages/Index';

interface Question {
  id: string;
  examId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  topicTag: string;
  questionOrder: number;
}

interface Answer {
  questionId: string;
  selectedAnswer: string;
  status: 'answered' | 'not-answered' | 'marked-for-review';
  timeSpent: number;
}

interface ExamInterfaceProps {
  exam: Exam;
  student: Student;
  onComplete: () => void;
}

const ExamInterface: React.FC<ExamInterfaceProps> = ({ exam, student, onComplete }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(isFullscreen);
  const pendingAutoSubmit = useRef(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch questions from database
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Calculate exam duration and set timer
        const now = new Date();
        const examEndTime = new Date(exam.endTime);
        const remainingSeconds = Math.max(0, Math.floor((examEndTime.getTime() - now.getTime()) / 1000));
        
        if (remainingSeconds <= 0) {
          toast({
            title: "Exam Ended",
            description: "This exam has already ended.",
            variant: "destructive"
          });
          onComplete();
          return;
        }
        
        setTimeRemaining(remainingSeconds);

        const { data: questionsData, error } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', exam.id)
          .order('question_order');

        if (error) {
          throw error;
        }

        if (questionsData && questionsData.length > 0) {
          const formattedQuestions: Question[] = questionsData.map(q => ({
            id: q.id,
            examId: q.exam_id,
            questionText: q.question_text,
            optionA: q.option_a,
            optionB: q.option_b,
            optionC: q.option_c,
            optionD: q.option_d,
            correctAnswer: q.correct_answer,
            topicTag: q.topic_tag,
            questionOrder: q.question_order
          }));

          setQuestions(formattedQuestions);
          console.log('Loaded questions:', formattedQuestions);
        } else {
          toast({
            title: "No Questions Found",
            description: "This exam has no questions available.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast({
          title: "Error",
          description: "Failed to load exam questions.",
          variant: "destructive"
        });
      }
    };

    fetchQuestions();
    enterFullscreen();
  }, [exam.id, exam.endTime, toast, onComplete]);

  // Create submission record when exam starts
  useEffect(() => {
    const createSubmission = async () => {
      if (!student.id || questions.length === 0) return;

      try {
        const { data: submission, error } = await supabase
          .from('submissions')
          .insert({
            student_id: student.id,
            exam_id: exam.id,
            total_questions: questions.length,
            total_score: 0,
            time_taken_minutes: 0
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        setSubmissionId(submission.id);
        console.log('Created submission:', submission);
      } catch (error) {
        console.error('Error creating submission:', error);
        toast({
          title: "Error",
          description: "Failed to initialize exam submission.",
          variant: "destructive"
        });
      }
    };

    createSubmission();
  }, [student.id, exam.id, questions.length, toast]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fullscreen and exit detection
  const enterFullscreen = useCallback(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        toast({
          title: "Exam Started",
          description: "You are now in proctored mode. Do not exit fullscreen.",
        });
      });
    }
  }, [toast]);

  const handleFullscreenChange = useCallback(() => {
    const isNowFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
    if (!isNowFullscreen && isFullscreenRef.current) {
      setIsFullscreen(false);
      toast({
        title: "Fullscreen Exit Detected",
        description: "Your exam will be auto-submitted due to policy violation.",
        variant: "destructive"
      });
      if (submissionId) {
        setTimeout(() => submitExam(true), 2000);
      } else {
        pendingAutoSubmit.current = true;
      }
    }
  }, [toast, submissionId]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      toast({
        title: "Tab Switch Detected",
        description: "Please return to the exam immediately.",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    if (!submissionId) return; // Only add listeners if submissionId is set

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleFullscreenChange, handleVisibilityChange, submissionId]);

  useEffect(() => {
    if (submissionId && pendingAutoSubmit.current) {
      setTimeout(() => submitExam(true), 2000);
      pendingAutoSubmit.current = false;
    }
  }, [submissionId]);

  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveAnswer = async (questionId: string, selectedAnswer: string, status: Answer['status']) => {
    const timeSpent = Date.now() - questionStartTime;
    const answerData: Answer = {
      questionId,
      selectedAnswer,
      status,
      timeSpent
    };

    setAnswers(prev => new Map(prev).set(questionId, answerData));

    // Error handling for missing submissionId
    if (!submissionId) {
      toast({
        title: "Submission Error",
        description: "No submission ID available. Please refresh or contact support.",
        variant: "destructive"
      });
      console.error('Attempted to save answer without a submission ID');
      return;
    }

    // Save response to database
    if (selectedAnswer !== undefined && selectedAnswer !== null) {
      try {
        const question = questions.find(q => q.id === questionId);
        const correctAnswerLower = question?.correctAnswer?.toLowerCase() || '';
        const selectedAnswerLower = selectedAnswer ? selectedAnswer.toLowerCase() : 'n';
        const isCorrect = question && selectedAnswerLower && selectedAnswerLower !== 'n' ? selectedAnswerLower === correctAnswerLower : false;

        const { error } = await supabase
          .from('responses')
          .upsert({
            submission_id: submissionId,
            question_id: questionId,
            selected_answer: selectedAnswerLower,
            correct_answer: correctAnswerLower,
            is_correct: isCorrect,
            time_taken_seconds: Math.floor(timeSpent / 1000)
          }, {
            onConflict: 'submission_id,question_id'
          });

        if (error) {
          console.error('Error saving response:', error);
        } else {
          console.log(`Response saved for question ${questionId}:`, { selectedAnswer, isCorrect, timeSpent });
        }
      } catch (error) {
        console.error('Error saving response:', error);
      }
    }
  };

  const handleAnswerSelect = (option: string) => {
    if (!submissionId) {
      toast({
        title: "Submission Error",
        description: "No submission ID available. Please refresh or contact support.",
        variant: "destructive"
      });
      console.error('Attempted to select answer without a submission ID');
      return;
    }
    const currentQuestion = questions[currentQuestionIndex];
    saveAnswer(currentQuestion.id, option, 'answered');
  };

  const markForReview = () => {
    if (!submissionId) {
      toast({
        title: "Submission Error",
        description: "No submission ID available. Please refresh or contact support.",
        variant: "destructive"
      });
      console.error('Attempted to mark for review without a submission ID');
      return;
    }
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.get(currentQuestion.id);
    saveAnswer(
      currentQuestion.id, 
      currentAnswer?.selectedAnswer || '', 
      'marked-for-review'
    );
  };

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setQuestionStartTime(Date.now());
  };

  const submitExam = async (autoSubmit = false) => {
    if (!submissionId) {
      console.error('No submission ID available');
      return;
    }

    try {
      // Calculate total score
      let totalScore = 0;
      const responses = Array.from(answers.values());
      
      responses.forEach(answer => {
        if (answer.selectedAnswer && answer.status === 'answered') {
          const question = questions.find(q => q.id === answer.questionId);
          if (question && answer.selectedAnswer === question.correctAnswer) {
            totalScore++;
          }
        }
      });

      // Export all unanswered questions as 'not-answered' to the database
      const unansweredQuestions = questions.filter(q => !answers.has(q.id));
      for (const question of unansweredQuestions) {
        try {
          const correctAnswerLower = question.correctAnswer?.toLowerCase() || '';
          await supabase
            .from('responses')
            .upsert({
              submission_id: submissionId,
              question_id: question.id,
              selected_answer: 'n',
              correct_answer: correctAnswerLower,
              is_correct: false,
              time_taken_seconds: 0
            }, {
              onConflict: 'submission_id,question_id'
            });
        } catch (error) {
          console.error('Error saving unanswered response:', error);
        }
      }

      // Calculate time taken in minutes
      const examStartTime = new Date(exam.startTime);
      const currentTime = new Date();
      const timeTakenMinutes = Math.floor((currentTime.getTime() - examStartTime.getTime()) / (1000 * 60));

      // Update submission with final score and time
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          total_score: totalScore,
          time_taken_minutes: timeTakenMinutes,
          submitted_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (updateError) {
        throw updateError;
      }

      console.log('Exam submitted successfully:', {
        submissionId,
        totalScore,
        timeTakenMinutes,
        totalQuestions: questions.length,
        autoSubmit
      });

      toast({
        title: autoSubmit ? "Exam Auto-Submitted" : "Exam Submitted",
        description: "Your responses have been saved successfully.",
      });

      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      onComplete();
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit exam. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getQuestionStatus = (questionId: string): Answer['status'] => {
    return answers.get(questionId)?.status || 'not-answered';
  };

  const getStatusCounts = () => {
    const answered = Array.from(answers.values()).filter(a => a.status === 'answered').length;
    const markedForReview = Array.from(answers.values()).filter(a => a.status === 'marked-for-review').length;
    const notAnswered = questions.length - answered - markedForReview;
    
    return { answered, markedForReview, notAnswered };
  };

  if (questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Loading exam...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion.id);
  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-gray-900">{exam.name}</h1>
              <Badge variant="secondary">{currentQuestion.topicTag}</Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
              </div>
              
              <Button onClick={() => submitExam()} variant="destructive">
                Submit Exam
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Panel */}
        <div className="lg:col-span-3">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Question Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </h2>
                  <Button
                    onClick={markForReview}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Flag className="h-4 w-4" />
                    Mark for Review
                  </Button>
                </div>

                {/* Question Text */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 text-lg leading-relaxed">
                    {currentQuestion.questionText}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map(option => {
                    const optionText = currentQuestion[`option${option}` as keyof Question] as string;
                    const isSelected = currentAnswer?.selectedAnswer === option;
                    
                    return (
                      <div
                        key={option}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-50 ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        }`}
                        onClick={() => handleAnswerSelect(option)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                          </div>
                          <span className="font-medium text-gray-700">{option}.</span>
                          <span className="text-gray-900">{optionText}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button
                    onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  
                  <Button
                    onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Panel */}
        <div className="space-y-6">
          {/* Status Summary */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Progress Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Answered
                  </span>
                  <span className="font-medium">{statusCounts.answered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    Marked for Review
                  </span>
                  <span className="font-medium">{statusCounts.markedForReview}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    Not Answered
                  </span>
                  <span className="font-medium">{statusCounts.notAnswered}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Grid */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const status = getQuestionStatus(question.id);
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={question.id}
                      onClick={() => navigateToQuestion(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                          : status === 'answered'
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : status === 'marked-for-review'
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Proctoring Status */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Proctored Exam</span>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                Stay in fullscreen mode. Any violations will auto-submit your exam.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;
