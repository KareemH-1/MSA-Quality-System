import React from 'react';
import ManageCourses from '../../components/Admin/Courses/ManageCourses';
import Loader from '../../components/Loader';

const CoursesPage = ({ currentNavItem }) => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <div style={{ padding: '20px 40px' }}>
      {isLoading ? <Loader /> : (currentNavItem === 'Courses' && <ManageCourses />)}
    </div>
  );
};

export default CoursesPage;
