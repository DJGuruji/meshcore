'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="relative min-h-screen bg-[#030712] text-white">
      <div className="absolute inset-0">
        <div className="absolute -left-20 top-10 h-96 w-96 rounded-full bg-indigo-500/20 blur-[140px]" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <main className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-white">Terms and Conditions</h1>
          <p className="mt-2 text-slate-400">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-invert max-w-none rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/60 backdrop-blur-2xl">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-slate-300 mb-4">
              Welcome to EchoStorm (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of our website and services. By accessing or using our website, you agree to be bound by these Terms and our Privacy Policy.
            </p>
            <p className="text-slate-300">
              If you do not agree to these Terms, please do not access or use our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">2. Services</h2>
            <p className="text-slate-300 mb-4">
              EchoStorm provides a platform for developers and teams to create, test, and manage APIs. Our services include but are not limited to:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2 mb-4">
              <li>Mock API server creation and management</li>
              <li>API testing tools</li>
              <li>GraphQL query testing</li>
              <li>Developer utility tools</li>
              <li>Project collaboration features</li>
            </ul>
            <p className="text-slate-300">
              We reserve the right to modify, suspend, or discontinue any part of our services at any time without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">3. Account Registration</h2>
            <p className="text-slate-300 mb-4">
              To access certain features of our services, you may be required to create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2 mb-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="text-slate-300">
              You are responsible for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">4. Acceptable Use</h2>
            <p className="text-slate-300 mb-4">
              You agree not to use our services to:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2 mb-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Distribute viruses or other harmful computer code</li>
              <li>Engage in unauthorized access to systems or data</li>
              <li>Interfere with the operation of our services</li>
            </ul>
            <p className="text-slate-300">
              We reserve the right to terminate accounts that violate these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">5. Intellectual Property</h2>
            <p className="text-slate-300 mb-4">
              All content, features, and functionality on our website are owned by EchoStorm or its licensors and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p className="text-slate-300">
              You may not reproduce, distribute, modify, or create derivative works of any content from our website without our express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">6. User Content</h2>
            <p className="text-slate-300 mb-4">
              You retain ownership of any content you submit to our services (&quot;User Content&quot;). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your content solely for the purpose of providing our services.
            </p>
            <p className="text-slate-300">
              You are responsible for ensuring that your User Content does not violate any laws or third-party rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">7. Termination</h2>
            <p className="text-slate-300 mb-4">
              We may terminate or suspend your account and access to our services immediately, without prior notice, for any reason, including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2 mb-4">
              <li>Breach of these Terms</li>
              <li>Violation of applicable laws</li>
              <li>Security concerns</li>
              <li>Inactivity for extended periods</li>
            </ul>
            <p className="text-slate-300">
              Upon termination, your right to use our services will cease immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-slate-300 mb-4">
              Our services are provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. We do not warrant that our services will be uninterrupted, secure, or error-free.
            </p>
            <p className="text-slate-300">
              We disclaim all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
            <p className="text-slate-300 mb-4">
              To the maximum extent permitted by law, EchoStorm shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities.
            </p>
            <p className="text-slate-300">
              Our total liability for any claims arising out of or related to these Terms shall not exceed the amount you have paid to us in the past twelve months.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">10. Indemnification</h2>
            <p className="text-slate-300">
              You agree to indemnify, defend, and hold harmless EchoStorm and its affiliates from and against any claims, liabilities, damages, losses, and expenses arising out of or in any way connected with your access to or use of our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">11. Governing Law</h2>
            <p className="text-slate-300">
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">12. Changes to Terms</h2>
            <p className="text-slate-300">
              We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on our website. Your continued use of our services after such changes constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">13. Contact Information</h2>
            <p className="text-slate-300">
              If you have any questions about these Terms, please contact us at:{' '}
              <a href="mailto:nath93266@gmail.com" className="text-indigo-300 hover:text-white transition-colors">
                nath93266@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}