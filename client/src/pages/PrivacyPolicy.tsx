import { ArrowLeft, Shield, Eye, Lock, Users, Mail, Calendar, Database } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
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
            <Shield className="h-8 w-8 text-conference-green mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
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
              <Eye className="h-6 w-6 text-conference-blue mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Introduction</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              The River Valley Conference ("RVC," "we," "us," or "our") is committed to protecting the privacy and security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services related to high school athletic conference management.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Database className="h-6 w-6 text-conference-green mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Information We Collect</h2>
            </div>
            
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Personal Information You Provide</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li><strong>Contact Information:</strong> Name, email address, phone number, and school affiliation when you submit contact forms or register for services</li>
              <li><strong>Athletic Director Information:</strong> Professional credentials, school association, and authentication details for administrative access</li>
              <li><strong>Game Result Submissions:</strong> Team names, scores, game details, and contact information when submitting game results</li>
              <li><strong>Communication Records:</strong> Messages, inquiries, and correspondence sent through our contact forms</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">Information Automatically Collected</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li><strong>Usage Data:</strong> Pages visited, time spent on site, click patterns, and navigation behavior</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
              <li><strong>Log Files:</strong> Server logs including access times, error reports, and system performance data</li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-conference-gold mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How We Use Your Information</h2>
            </div>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Conference Administration:</strong> Managing athletic schedules, game results, and conference standings</li>
              <li><strong>Communication:</strong> Responding to inquiries, sending conference updates, and facilitating school-to-school communication</li>
              <li><strong>Authentication:</strong> Verifying Athletic Director credentials and maintaining secure access to administrative features</li>
              <li><strong>Website Improvement:</strong> Analyzing usage patterns to enhance user experience and website functionality</li>
              <li><strong>Compliance:</strong> Meeting IHSA requirements and maintaining accurate athletic records</li>
              <li><strong>Security:</strong> Protecting against fraud, unauthorized access, and ensuring data integrity</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Lock className="h-6 w-6 text-conference-navy mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Information Sharing and Disclosure</h2>
            </div>
            
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">We Share Information With:</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2">
              <li><strong>Member Schools:</strong> Athletic Directors and school officials within the RVC network for legitimate conference business</li>
              <li><strong>IHSA:</strong> Illinois High School Association for compliance and reporting requirements</li>
              <li><strong>Service Providers:</strong> Trusted third-party vendors who assist with website hosting, email services, and technical support</li>
              <li><strong>Legal Compliance:</strong> Law enforcement or regulatory bodies when required by law or to protect rights and safety</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">We Do NOT Share Information With:</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Commercial advertisers or marketing companies</li>
              <li>Data brokers or information resellers</li>
              <li>Unauthorized third parties for profit</li>
              <li>Social media platforms beyond official RVC accounts</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-conference-green mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Data Security</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>Encrypted data transmission using SSL/TLS protocols</li>
              <li>Secure database storage with access controls</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Staff training on data protection best practices</li>
              <li>Incident response procedures for potential breaches</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-conference-blue mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Rights and Choices</h2>
            </div>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal requirements</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from non-essential communications</li>
              <li><strong>Data Portability:</strong> Request your data in a portable format where technically feasible</li>
            </ul>
          </section>

          {/* Cookies and Tracking */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Eye className="h-6 w-6 text-conference-gold mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Cookies and Tracking Technologies</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We use cookies and similar technologies to enhance your browsing experience, analyze website usage, and maintain login sessions. You can control cookie settings through your browser preferences.
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for basic website functionality and security</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our website</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 text-conference-navy mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Third-Party Services</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              Our website integrates with third-party services to provide enhanced functionality:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Google Calendar:</strong> For athletic schedule synchronization and event management</li>
              <li><strong>Streaming Platforms:</strong> NFHS Network and YouTube for game broadcasts</li>
              <li><strong>Email Services:</strong> For contact form delivery and official communications</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
              These services have their own privacy policies, and we encourage you to review them.
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Database className="h-6 w-6 text-conference-green mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Data Retention</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              We retain personal information for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, and resolve disputes. Specific retention periods include:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Athletic Records:</strong> Maintained per IHSA requirements (typically 7 years)</li>
              <li><strong>Contact Information:</strong> Until withdrawal of consent or account deactivation</li>
              <li><strong>Website Logs:</strong> Retained for 12 months for security and performance analysis</li>
              <li><strong>Communication Records:</strong> Retained for 3 years for operational purposes</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-conference-blue mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Children's Privacy</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Our website is designed for use by Athletic Directors, school officials, parents, and fans. We do not knowingly collect personal information from children under 13 without parental consent. If we learn that we have inadvertently collected such information, we will promptly delete it.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Mail className="h-6 w-6 text-conference-gold mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Changes to This Privacy Policy</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update this Privacy Policy periodically to reflect changes in our practices, services, or legal requirements. We will notify users of significant changes by posting the updated policy on our website with a new effective date. Your continued use of our services after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Mail className="h-6 w-6 text-conference-navy mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Contact Us</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>River Valley Conference</strong><br />
                Email: <a href="mailto:principals@rvc-il.com" className="text-conference-blue hover:text-conference-navy">principals@rvc-il.com</a><br />
                Subject Line: "Privacy Policy Inquiry"
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              This Privacy Policy is part of our commitment to transparency and user protection.<br />
              River Valley Conference - Serving 10 member schools in northeastern Illinois.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}