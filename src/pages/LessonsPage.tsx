import React, { useState } from 'react';
import { WeeklyLesson } from '../types';
import { WeeklyLessonTracker } from '../components/lessons/WeeklyLessonTracker';
import { SubmitLessonModal } from '../components/lessons/SubmitLessonModal';
import { LessonDetailModal } from '../components/lessons/LessonDetailModal';

export const LessonsPage: React.FC = () => {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [detailLesson, setDetailLesson] = useState<WeeklyLesson | null>(null);

  return (
    <div className="space-y-4">
      <WeeklyLessonTracker
        onOpenSubmitModal={() => setIsSubmitOpen(true)}
        onViewLesson={(lesson) => setDetailLesson(lesson)}
      />

      {/* Submit Lesson Modal */}
      <SubmitLessonModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
      />

      {/* Lesson Detail Modal */}
      {detailLesson && (
        <LessonDetailModal
          isOpen={Boolean(detailLesson)}
          onClose={() => setDetailLesson(null)}
          lesson={detailLesson}
        />
      )}
    </div>
  );
};
