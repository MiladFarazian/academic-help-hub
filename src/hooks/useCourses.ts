
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Course, CourseFilterOptions, TermCourse } from "@/types/CourseTypes";

export function useCourses(filterOptions: CourseFilterOptions) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch courses when term changes
  useEffect(() => {
    async function fetchCourses() {
      if (!filterOptions.term) {
        setCourses([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching courses for term: ${filterOptions.term}`);
        
        // Call the query_term_courses edge function
        const { data: termCourses, error: functionError } = await supabase.functions.invoke('query_term_courses', {
          body: { term_code: filterOptions.term }
        });

        if (functionError) {
          console.error("Edge function error:", functionError);
          throw new Error(`Failed to fetch courses: ${functionError.message}`);
        }
        
        if (termCourses && termCourses.length > 0) {
          console.log(`Found ${termCourses.length} courses from edge function`);
          
          // Convert to our standard Course type
          const typedCourses: Course[] = termCourses.map((item: TermCourse) => {
            // Extract department from course number (e.g., "CSCI-104" -> "CSCI")
            const department = item["Course number"]?.split('-')[0] || 'Unknown';
            
            return {
              id: item.id || crypto.randomUUID(),
              course_number: item["Course number"] || '',
              course_title: item["Course title"] || '',
              instructor: item.Instructor,
              department: item.department || department,
              units: item.units || null,
              days: item.days || null,
              time: item.time || null,
              location: item.location || null,
              description: item.description || null
            };
          });
          
          setCourses(typedCourses);
        } else {
          // Fallback to direct table query if edge function returns no data
          console.log(`No courses found from edge function, trying direct table query`);
          
          // Determine the table name based on term code
          const tableName = `courses-${filterOptions.term}`;
          
          // Use type assertion to help TypeScript understand this is a valid table
          const { data, error } = await supabase
            .from(tableName as any)
            .select('*');
            
          if (error) {
            console.error("Direct query failed:", error);
            throw error;
          }
          
          if (data && data.length > 0) {
            console.log(`Found ${data.length} courses in ${tableName} table`);
            
            // Convert to our standard Course type
            const typedCourses: Course[] = data.map((item: any) => {
              // Extract department from course number (e.g., "CSCI-104" -> "CSCI")
              const department = item["Course number"]?.split('-')[0] || 'Unknown';
              
              return {
                id: item.id || crypto.randomUUID(),
                course_number: item["Course number"] || '',
                course_title: item["Course title"] || '',
                instructor: item.Instructor,
                department: item.department || department,
                units: item.units || null,
                days: item.days || null,
                time: item.time || null,
                location: item.location || null,
                description: item.description || null
              };
            });
            
            setCourses(typedCourses);
          } else {
            console.log(`No courses found in ${tableName} table`);
            setCourses([]);
          }
        }
      } catch (err: any) {
        console.error("Error fetching courses:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCourses();
  }, [filterOptions.term]);

  // Extract unique departments
  useEffect(() => {
    if (courses.length > 0) {
      const uniqueDepartments = Array.from(
        new Set(courses.map(course => course.department))
      ).sort();
      setDepartments(uniqueDepartments);
    } else {
      setDepartments([]);
    }
  }, [courses]);

  // Filter courses based on search and department
  useEffect(() => {
    let result = [...courses];
    
    // Filter by search query
    if (filterOptions.search) {
      const query = filterOptions.search.toLowerCase();
      result = result.filter(
        course => 
          (course.course_number && course.course_number.toLowerCase().includes(query)) ||
          (course.course_title && course.course_title.toLowerCase().includes(query)) ||
          (course.instructor && course.instructor.toLowerCase().includes(query))
      );
    }
    
    // Filter by department
    if (filterOptions.department && filterOptions.department !== "all") {
      result = result.filter(course => course.department === filterOptions.department);
    }
    
    setFilteredCourses(result);
  }, [courses, filterOptions.search, filterOptions.department]);

  return { 
    courses: filteredCourses,
    allCourses: courses,
    departments,
    loading,
    error
  };
}
