import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import ConferenceOverview from "@/components/ConferenceOverview";
import MemberSchools from "@/components/MemberSchools";
import SchedulesResults from "@/components/SchedulesResults";
import ConferenceStandings from "@/components/ConferenceStandings";
import NewsAnnouncements from "@/components/NewsAnnouncements";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <section id="home">
        <Hero />
      </section>
      <section id="about">
        <ConferenceOverview />
      </section>
      <section id="schools">
        <MemberSchools />
      </section>
      <section id="schedules">
        <SchedulesResults />
      </section>
      <section id="standings">
        <ConferenceStandings />
      </section>
      <section id="news">
        <NewsAnnouncements />
      </section>
      <section id="contact">
        <ContactSection />
      </section>
      <Footer />
    </div>
  );
}
