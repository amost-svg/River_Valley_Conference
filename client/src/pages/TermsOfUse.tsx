import { ArrowLeft, FileText, Shield, Users, AlertTriangle, Scale, Globe, BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="inline-flex items-center text-conference-navy hover:text-conference-blue transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-conference-blue mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms of Use</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Effective Date: January 1, 2025 | Last Updated: January 1, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          
          {/* Introduction */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <BookOpen className="h-6 w-6 text-conference-green mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Agreement to Terms</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Welcome to the River Valley Conference ("RVC") website. These Terms of Use ("Terms") govern your access to and use of our website, services, and related content provided by the River Valley Conference, an Illinois High School Association (IHSA) athletic conference.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              By accessing or using our website, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.
            </p>
          </section>

          {/* Acceptance and Eligibility */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-conference-blue mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Acceptance and Eligibility</h2>
            </div>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>You must be at least 13 years old to use this website</li>
              <li>If you are under 18, you must have parental/guardian consent</li>
              <li>Athletic Directors must be officially authorized by their respective schools</li>
              <li>You must provide accurate and current information when creating accounts or submitting forms</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials</li>
            </ul>
          </section>

          {/* Permitted Uses */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-conference-green mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Permitted Uses</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You may use our website and services for the following purposes:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Information Access:</strong> Viewing athletic schedules, game results, conference standings, and news</li>
              <li><strong>Communication:</strong> Submitting contact forms and legitimate inquiries</li>
              <li><strong>Game Results:</strong> Submitting accurate game results for review and approval</li>
              <li><strong>Athletic Administration:</strong> Authorized Athletic Directors managing schedules and official business</li>
              <li><strong>Educational Use:</strong> Students, parents, and fans accessing conference information</li>
              <li><strong>Media Coverage:</strong> Journalists and media professionals covering RVC athletics</li>
            </ul>
          </section>

          {/* Prohibited Uses */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Prohibited Uses</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              You may NOT use our website or services for:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Illegal Activities:</strong> Any purpose that violates local, state, or federal laws</li>
              <li><strong>Unauthorized Access:</strong> Attempting to access restricted areas or other users' accounts</li>
              <li><strong>False Information:</strong> Submitting inaccurate game results, fake news, or misleading content</li>
              <li><strong>Harassment:</strong> Targeting individuals with harmful, defamatory, or offensive content</li>
              <li><strong>Commercial Exploitation:</strong> Using our content for unauthorized commercial purposes</li>
              <li><strong>Technical Interference:</strong> Disrupting website functionality, overloading servers, or introducing malicious code</li>
              <li><strong>Impersonation:</strong> Pretending to be an Athletic Director, official, or other authorized person</li>
              <li><strong>Data Mining:</strong> Automated scraping or harvesting of website content without permission</li>
            </ul>
          </section>

          {/* User Content and Submissions */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-conference-gold mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">User Content and Submissions</h2>
            </div>
            
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Your Responsibilities</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>All submitted content must be accurate, truthful, and appropriate</li>
              <li>You retain ownership of content you submit but grant us license to use it for conference purposes</li>
              <li>You are responsible for ensuring submitted content does not violate third-party rights</li>
              <li>Game results must be verified and submitted by authorized personnel only</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Our Rights</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>We reserve the right to review, edit, or remove any submitted content</li>
              <li>We may moderate game result submissions before publication</li>
              <li>We can suspend or terminate accounts for Terms violations</li>
              <li>We may use submitted content for conference promotion and educational purposes</li>
            </ul>
          </section>

          {/* Athletic Director Responsibilities */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-conference-navy mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Athletic Director Responsibilities</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Athletic Directors with administrative access agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Use administrative access solely for legitimate conference business</li>
              <li>Maintain accurate and up-to-date schedule and result information</li>
              <li>Protect login credentials and report suspected security breaches</li>
              <li>Comply with IHSA regulations and conference policies</li>
              <li>Promptly update or correct any erroneous information</li>
              <li>Respect the confidentiality of non-public conference information</li>
              <li>Use the platform in a professional manner consistent with their role</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-conference-blue mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Intellectual Property Rights</h2>
            </div>
            
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Our Content</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              The River Valley Conference website, including all text, graphics, logos, images, software, and other content, is owned by RVC or our licensors and is protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">School Logos and Trademarks</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Member school logos, names, and trademarks are the property of their respective schools and are used with permission for conference purposes only.
            </p>

            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Limited License</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We grant you a limited, non-exclusive, non-transferable license to access and use our website for personal, educational, or news reporting purposes. This license does not include rights to download, modify, or redistribute our content without permission.
            </p>
          </section>

          {/* Privacy and Data Protection */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-conference-green mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Privacy and Data Protection</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our <Link href="/privacy-policy" className="text-conference-blue hover:text-conference-navy underline">Privacy Policy</Link>, which is incorporated into these Terms by reference.
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>You consent to the collection and use of your information as described in our Privacy Policy</li>
              <li>You agree to provide accurate and current information</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must promptly notify us of any unauthorized use of your account</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Globe className="h-6 w-6 text-conference-gold mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Third-Party Services and Links</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Our website may integrate with or link to third-party services:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Google Calendar:</strong> For schedule synchronization and event management</li>
              <li><strong>NFHS Network:</strong> For live streaming access</li>
              <li><strong>YouTube:</strong> For video content and live broadcasts</li>
              <li><strong>Social Media:</strong> Links to official conference and school social media accounts</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              We are not responsible for the content, policies, or practices of third-party services. Your use of such services is subject to their own terms and conditions.
            </p>
          </section>

          {/* Disclaimers and Limitations */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Disclaimers and Limitations</h2>
            </div>
            
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Service Availability</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>We provide our services "as is" without warranties of any kind</li>
              <li>We do not guarantee uninterrupted or error-free service</li>
              <li>Schedule and result information is subject to change and correction</li>
              <li>We are not liable for decisions made based on information from our website</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Limitation of Liability</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              To the maximum extent permitted by law, the River Valley Conference shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of our website or services.
            </p>

            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Information Accuracy</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              While we strive for accuracy, we cannot guarantee that all athletic information, schedules, or results are completely accurate or current. Users should verify important information with official sources.
            </p>
          </section>

          {/* Enforcement and Termination */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Scale className="h-6 w-6 text-conference-navy mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Enforcement and Termination</h2>
            </div>
            
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Violations</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We reserve the right to investigate violations of these Terms and take appropriate action, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li>Issuing warnings or temporary suspensions</li>
              <li>Removing content that violates these Terms</li>
              <li>Terminating user accounts or access privileges</li>
              <li>Reporting illegal activities to law enforcement</li>
              <li>Pursuing legal remedies for damages</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Termination Rights</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>We may terminate or suspend access at our sole discretion</li>
              <li>You may stop using our services at any time</li>
              <li>Termination does not affect accrued rights or obligations</li>
              <li>Certain provisions of these Terms survive termination</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Scale className="h-6 w-6 text-conference-blue mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Governing Law and Jurisdiction</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              These Terms are governed by the laws of the State of Illinois, without regard to conflict of law principles. Any legal disputes arising from these Terms or your use of our services shall be resolved in the appropriate courts of Illinois.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-conference-green mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Changes to Terms</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting on our website. We will make reasonable efforts to notify users of significant changes.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Your continued use of our services after changes are posted constitutes acceptance of the modified Terms. If you do not agree to the changes, you must stop using our services.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-conference-gold mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Contact Information</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you have questions about these Terms of Use or need to report violations, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>River Valley Conference</strong><br />
                Email: <a href="mailto:principals@rvc-il.com" className="text-conference-blue hover:text-conference-navy">principals@rvc-il.com</a><br />
                Subject Line: "Terms of Use Inquiry"
              </p>
            </div>
          </section>

          {/* Severability */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Scale className="h-6 w-6 text-conference-navy mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Severability and Entire Agreement</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue to be valid and enforceable. These Terms, together with our Privacy Policy, constitute the entire agreement between you and the River Valley Conference regarding your use of our services.
            </p>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              By using the River Valley Conference website, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use.<br />
              River Valley Conference - Official IHSA Athletic Conference serving northeastern Illinois.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}