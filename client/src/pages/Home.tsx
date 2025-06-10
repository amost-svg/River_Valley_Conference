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
      <Hero />
      <ConferenceOverview />
      <MemberSchools />
      <SchedulesResults />
      <ConferenceStandings />
      <NewsAnnouncements />
      <ContactSection />
      <Footer />
    </div>
  );
}
