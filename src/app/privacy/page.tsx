'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
          <h1 className="mt-6 text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="mt-2 text-slate-400">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="prose prose-invert max-w-none rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/60 backdrop-blur-2xl">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-slate-300 mb-4">
              Sadasya (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
            <p className="text-slate-300">
              Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access our website or use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-semibold text-white mb-3">Personal Information</h3>
            <p className="text-slate-300 mb-4">
              We may collect personally identifiable information that you voluntarily provide to us when you register on our website, express an interest in obtaining information about us or our products and services, or otherwise contact us. The personal information we collect may include:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2 mb-4">
              <li>Name</li>
              <li>Email address</li>
              <li>Password (hashed and securely stored)</li>
              <li>Account preferences</li>
              <li>Project data and API configurations</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mb-3">Usage Data</h3>
            <p className="text-slate-300 mb-4">
              We may automatically collect certain information when you visit, use, or navigate our website. This usage data may include:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2 mb-4">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Referring URLs</li>
              <li>Pages viewed and time spent on pages</li>
              <li>Search terms</li>
              <li>Device information</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mb-3">Cookies and Tracking Technologies</h3>
            <p className="text-slate-300 mb-4">
              We may use cookies and similar tracking technologies to access or store information. Cookies are small data files stored on your device when you visit our website. We use both session cookies (which expire when you close your browser) and persistent cookies (which remain on your device until deleted).
            </p>
            <p className="text-slate-300 mb-4">
              The types of cookies we use include:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2 mb-4">
              <li><strong>Essential cookies:</strong> Necessary for the website to function properly</li>
              <li><strong>Performance cookies:</strong> Help us understand how visitors interact with our website</li>
              <li><strong>Functionality cookies:</strong> Allow the website to remember your preferences</li>
              <li><strong>Targeting cookies:</strong> Used to deliver relevant advertisements</li>
            </ul>
            <p className="text-slate-300">
              You can control cookie preferences through your browser settings. Please note that disabling cookies may affect your ability to use certain features of our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-300 mb-4">
              We use the information we collect for various purposes, including:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2 mb-4">
              <li>To create and maintain your account</li>
              <li>To provide, operate, and maintain our services</li>
              <li>To improve, personalize, and expand our services</li>
              <li>To understand and analyze how you use our services</li>
              <li>To develop new products, services, features, and functionality</li>
              <li>To communicate with you, either directly or through one of our partners</li>
              <li>To send you updates, marketing, and promotional communications (with your consent)</li>
              <li>To process your transactions and manage your orders</li>
              <li>To prevent fraudulent activities and ensure security</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-slate-300 mb-4">
              We may share your information in the following situations:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2 mb-4">
              <li><strong>With Service Providers:</strong> We may share your information with third-party service providers who perform services on our behalf</li>
              <li><strong>For Business Transfers:</strong> We may share or transfer your information in connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Affiliates:</strong> We may share your information with our affiliates</li>
              <li><strong>With Business Partners:</strong> We may share your information with our business partners to offer you certain products, services, or promotions</li>
              <li><strong>With Your Consent:</strong> We may disclose your information for any other purpose with your consent</li>
              <li><strong>For Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities</li>
            </ul>
            <p className="text-slate-300">
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">5. Data Security</h2>
            <p className="text-slate-300 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and audits</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure server infrastructure</li>
              <li>Employee training on data protection</li>
            </ul>
            <p className="text-slate-300">
              While we strive to protect your personal information, no method of transmission over the Internet or method of electronic storage is 100% secure. Therefore, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">6. Data Retention</h2>
            <p className="text-slate-300 mb-4">
              We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your personal information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.
            </p>
            <p className="text-slate-300">
              If you wish to delete your account and personal information, you may do so through your account settings or by contacting us directly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">7. Your Data Protection Rights</h2>
            <p className="text-slate-300 mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 text-slate-300 space-y-2 mb-4">
              <li><strong>Right to Access:</strong> You have the right to request copies of your personal data</li>
              <li><strong>Right to Rectification:</strong> You have the right to request correction of inaccurate data</li>
              <li><strong>Right to Erasure:</strong> You have the right to request deletion of your personal data</li>
              <li><strong>Right to Restrict Processing:</strong> You have the right to request restriction of processing your personal data</li>
              <li><strong>Right to Object:</strong> You have the right to object to our processing of your personal data</li>
              <li><strong>Right to Data Portability:</strong> You have the right to request transfer of your data to another organization</li>
            </ul>
            <p className="text-slate-300">
              If you make a request, we have one month to respond. If you would like to exercise any of these rights, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">8. Third-Party Websites</h2>
            <p className="text-slate-300">
              Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these websites. We encourage you to review the privacy policies of any third-party websites you visit.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">9. Children's Privacy</h2>
            <p className="text-slate-300">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-slate-300">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">11. Contact Us</h2>
            <p className="text-slate-300 mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="text-slate-300 space-y-2">
              <li><strong>Email:</strong> <a href="mailto:nath93266@gmail.com" className="text-indigo-300 hover:text-white transition-colors">nath93266@gmail.com</a></li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}