import { usePopularCourses } from "@/hooks/usePopularCourses";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import CourseCard from "@/components/courses/CourseCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";
const PopularCourses = () => {
  const isMobile = useIsMobile();
  // Fetch top 20 popular courses
  const {
    courses,
    loading
  } = usePopularCourses(20);
  return <div className={isMobile ? "mt-6" : "mt-12"}>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>Popular Courses</h2>
        <Button asChild variant="ghost" className="text-usc-cardinal">
          
        </Button>
      </div>

      {loading ? <div className="flex justify-center items-center py-6 md:py-12">
          <Loader2 className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} animate-spin text-usc-cardinal`} />
          <span className={`ml-2 ${isMobile ? 'text-sm' : ''}`}>Loading popular courses...</span>
        </div> : courses.length === 0 ? <div className="text-center py-6 md:py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No popular courses available at the moment.</p>
        </div> : <div className="relative">
          {isMobile ? <div className="space-y-3">
              {courses.slice(0, 3).map(course => <CourseCard key={course.id} course={course} />)}
              {courses.length > 3 && <div className="text-center mt-4">
                  <Button asChild variant="outline" className="text-usc-cardinal border-usc-cardinal hover:bg-usc-cardinal hover:text-white">
                    <Link to="/courses">
                      View More Courses
                    </Link>
                  </Button>
                </div>}
            </div> : <Carousel className="w-full">
              <CarouselContent className="-ml-4">
                {courses.map(course => <CarouselItem key={course.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <CourseCard course={course} />
                  </CarouselItem>)}
              </CarouselContent>
              <CarouselPrevious className="-left-12 bg-white" />
              <CarouselNext className="-right-12 bg-white" />
            </Carousel>}
        </div>}
    </div>;
};
export default PopularCourses;