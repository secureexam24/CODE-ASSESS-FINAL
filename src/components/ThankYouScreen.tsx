
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, BookOpen, Clock, Award } from 'lucide-react';
import type { Student } from '@/pages/Index';

interface ThankYouScreenProps {
  student: Student | null;
}

const ThankYouScreen: React.FC<ThankYouScreenProps> = ({ student }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Success Icon */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Exam Submitted Successfully!
          </h1>
          <p className="text-gray-600">
            Thank you for completing your examination
          </p>
        </div>

        {/* Student Info Card */}
        {student && (
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {student.name}
                  </h2>
                  <p className="text-gray-600">Roll Number: {student.rollNumber}</p>
                  <p className="text-gray-600">{student.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submission Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Submitted On</h3>
              <p className="text-blue-700 text-sm">
                {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900">Status</h3>
              <p className="text-green-700 text-sm">Successfully Submitted</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">Results</h3>
              <p className="text-purple-700 text-sm">Will be available soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
            <div className="space-y-2 text-gray-700">
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                Your exam responses have been securely saved and processed
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                Results will be published by your instructor within 24-48 hours
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                You will receive an email notification when results are available
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                You may now safely close this browser window
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>© 2024 Code Quest Assess - Secure Online Examination Portal</p>
        </div>
      </div>
    </div>
  );
};

export default ThankYouScreen;
