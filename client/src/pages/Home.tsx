import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import ConferenceOverview from "@/components/ConferenceOverview";
import MemberSchools from "@/components/MemberSchools";
import SchedulesResults from "@/components/SchedulesResults";
import ConferenceEvents from "@/components/ConferenceEvents";
import ConferenceStandings from "@/components/ConferenceStandings";
import NewsAnnouncements from "@/components/NewsAnnouncements";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Seo
        title="River Valley Conference | Illinois High School Athletics"
        description="Official website of the River Valley Conference featuring 10 IHSA member schools, game schedules, conference standings, events, athletics news, and contact information."
        type="website"
      />
      <Navigation />
      <Hero />
      <ConferenceOverview />
      <MemberSchools />
      <SchedulesResults />
      <ConferenceEvents />
      <ConferenceStandings />
      <NewsAnnouncements />
      <ContactSection />
      <Footer />
    </div>
  );
}
