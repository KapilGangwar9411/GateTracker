import { Lecture } from '@/types/database.types';

// Define a type for subject options used in dropdowns
export type SubjectOption = {
  id: string;
  name: string;
};

// Define state types to be shared across hooks
export type NewLectureState = {
  title: string;
  description: string;
  subject_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'needs_revision';
};

// Define the return types for our hooks
export type LecturesQueryResult = {
  lectures: Lecture[];
  isLoading: boolean;
};

export type SubjectsQueryResult = {
  subjects: SubjectOption[];
};
