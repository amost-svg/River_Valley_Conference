import { Button } from "@/components/ui/button";

export default function Hero() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 64;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="home" className="relative bg-conference-navy text-white">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div 
        className="relative bg-cover bg-center h-96" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1560272564-c83b66b1ad12?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')"
        }}
      >
        <div className="absolute inset-0 bg-conference-navy bg-opacity-80"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-center w-full">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">River Valley Conference</h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">Excellence in High School Athletics</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => scrollToSection("schedules")}
                className="bg-conference-gold text-conference-navy hover:bg-yellow-400 px-8 py-3 text-lg font-semibold"
              >
                View Schedules
              </Button>
              <Button 
                onClick={() => scrollToSection("schools")}
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-conference-navy px-8 py-3 text-lg font-semibold"
              >
                Member Schools
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
