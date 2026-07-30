import { School, Calendar, Medal } from "lucide-react";

export default function ConferenceOverview() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 64; // Account for sticky header
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  const stats = [
    {
      icon: School,
      title: "10 Member Schools",
      description: "Representing communities across the River Valley region",
      bgColor: "bg-conference-navy",
      onClick: () => scrollToSection("schools")
    },
    {
      icon: Calendar,
      title: "12 Sports & Activities",
      description: "Athletics, academic competitions, and fine-arts events across the conference",
      bgColor: "bg-conference-gold",
      onClick: () => scrollToSection("schedules")
    },
    {
      icon: Medal,
      title: "Latest News",
      description: "Stay updated with conference announcements and results",
      bgColor: "bg-conference-green",
      onClick: () => scrollToSection("news")
    }
  ];

  return (
    <section id="about" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">About Our Conference</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            The River Valley Conference is committed to promoting excellence in high school athletics while fostering character development, teamwork, and academic achievement among student-athletes.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                className={`text-center ${stat.onClick !== undefined ? 'cursor-pointer hover:transform hover:scale-105 transition-transform' : ''}`}
                onClick={stat.onClick}
              >
                <div className={`${stat.bgColor} text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{stat.title}</h3>
                <p className="text-gray-600">{stat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
