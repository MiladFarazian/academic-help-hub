export interface Course {
  id: string;
  course_number: string;
  course_title: string;
  instructor: string | null;
  department: string;
  description?: string | null;
  code?: string;
  name?: string;
  term_code?: string;
  units?: string;
  days?: string;
  time?: string;
  location?: string;
  session_type?: string;
}

export interface Term {
  id: string;
  code: string;
  name: string;
  is_current: boolean;
}

export interface CourseFilterOptions {
  term: string;
  search: string;
  department: string;
}
