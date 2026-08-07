import { ArrowLeft, Database, Eye, Lock, Mail, Shield, Users } from "lucide-react";
import { Link } from "wouter";
import Seo from "@/components/Seo";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Seo
        title="Privacy Policy | River Valley Conference"
        description="Privacy policy for the official River Valley Conference website, including contact forms, conference accounts, Cloudflare, Supabase, and Google services."
        url="/privacy-policy"
      />

      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="mb-4 inline-flex items-center text-conference-navy transition-colors hover:text-blue-700">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center">
            <Shield className="mr-3 h-8 w-8 text-conference-green" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="mt-2 text-gray-600">Effective and last updated: August 7, 2026</p>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-9 rounded-lg bg-white p-8 shadow-sm">
          <section>
            <div className="mb-4 flex items-center">
              <Eye className="mr-2 h-6 w-6 text-conference-blue" />
              <h2 className="text-2xl font-semibold text-gray-900">Overview</h2>
            </div>
            <p className="leading-relaxed text-gray-700">
              The River Valley Conference (RVC) operates this website to publish conference schedules, standings, school information, announcements, and other official conference information. This policy describes the information the site collects and the services used to operate it.
            </p>
          </section>

          <section>
            <div className="mb-4 flex items-center">
              <Database className="mr-2 h-6 w-6 text-conference-green" />
              <h2 className="text-2xl font-semibold text-gray-900">Information We Collect</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p><strong>Public website use.</strong> Most visitors can browse schedules, standings, school profiles, and announcements without creating an account.</p>
              <p><strong>Contact forms.</strong> When you send a message through the RVC contact form, we receive the name, email address, school or organization (if provided), inquiry category, and message you submit.</p>
              <p><strong>Conference accounts.</strong> Authorized principals, athletic directors, conference officials, and administrators may have accounts containing their email address, name, school affiliation, conference role, authentication information, and records of actions taken within conference workflows.</p>
              <p><strong>Operational data.</strong> The hosting and security providers used by the site may process technical information such as IP address, browser information, request timing, and security signals needed to deliver and protect the service.</p>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center">
              <Users className="mr-2 h-6 w-6 text-conference-gold" />
              <h2 className="text-2xl font-semibold text-gray-900">How We Use Information</h2>
            </div>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>Respond to conference inquiries and route messages to appropriate conference personnel.</li>
              <li>Authenticate authorized conference users and apply role-based access to administrative tools.</li>
              <li>Manage schedules, results, standings, conference events, school information, and official conference records.</li>
              <li>Protect the website against spam, automated abuse, unauthorized access, and other security threats.</li>
              <li>Diagnose errors and maintain the reliability of the conference website.</li>
            </ul>
          </section>

          <section>
            <div className="mb-4 flex items-center">
              <Lock className="mr-2 h-6 w-6 text-conference-navy" />
              <h2 className="text-2xl font-semibold text-gray-900">Services Used by the Website</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p><strong>Cloudflare.</strong> RVC uses Cloudflare to host and deliver the website and Cloudflare Turnstile to help protect public forms from automated abuse.</p>
              <p><strong>Supabase.</strong> RVC uses Supabase for the conference database, authentication, role-based access, and related application services. Public data is separated from authenticated conference information through database access controls.</p>
              <p><strong>Google Workspace.</strong> The contact form uses a protected server-side relay to deliver inquiries through the conference's Google Workspace email setup. Authorized users may also use Google authentication where configured.</p>
              <p>These providers process information as necessary to provide their services and maintain their own privacy and security practices.</p>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center">
              <Shield className="mr-2 h-6 w-6 text-conference-green" />
              <h2 className="text-2xl font-semibold text-gray-900">Data Access and Security</h2>
            </div>
            <p className="leading-relaxed text-gray-700">
              RVC limits administrative access according to conference and school roles. Internal conference documents and administrative workflows are not intended for anonymous public access. Data is transmitted over HTTPS, and the application uses database access controls and authentication to separate public information from restricted conference information. No system can guarantee absolute security, but RVC aims to collect only the information reasonably needed to operate the conference website and platform.
            </p>
          </section>

          <section>
            <div className="mb-4 flex items-center">
              <Database className="mr-2 h-6 w-6 text-conference-blue" />
              <h2 className="text-2xl font-semibold text-gray-900">Retention and Corrections</h2>
            </div>
            <p className="leading-relaxed text-gray-700">
              Conference records may be retained when they remain useful for official conference operations, historical records, accountability, or legal obligations. Contact messages and account information may be removed when they are no longer needed. If you believe information about you is inaccurate or should be reviewed, use the contact form on the RVC website.
            </p>
          </section>

          <section>
            <div className="mb-4 flex items-center">
              <Users className="mr-2 h-6 w-6 text-conference-gold" />
              <h2 className="text-2xl font-semibold text-gray-900">Student Information</h2>
            </div>
            <p className="leading-relaxed text-gray-700">
              The public RVC website is intended primarily to publish conference information. RVC does not intentionally publish private student application, academic, contact, or recommendation information through public conference records. Public recognition information, such as an approved student's name, school, award, or athletic result, may be published as part of normal conference reporting.
            </p>
          </section>

          <section>
            <div className="mb-4 flex items-center">
              <Mail className="mr-2 h-6 w-6 text-conference-navy" />
              <h2 className="text-2xl font-semibold text-gray-900">Contact and Policy Changes</h2>
            </div>
            <p className="leading-relaxed text-gray-700">
              Questions about this policy or the handling of information can be submitted through the contact form on <Link href="/#contact" className="font-semibold text-conference-navy underline">rvc-il.com</Link>. This policy may be updated as the RVC website and conference platform change; the date at the top of this page will reflect the current version.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
