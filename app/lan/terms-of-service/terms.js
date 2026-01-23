"use client"
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "LAN Library | Terms Of Service",
  description: "Understand the agreement that binds users, sellers, institutions and LAN Libaray"
}
export default function TermsOfServiceClient() {
    const router = useRouter()

    const handleBack =() => {
        router.push('/')
    }
  return (
    <>
      <div>
      <img src="/lanlogo.jpg"  className="relative w-full"/>
      </div>
    <div className="prose prose-lg max-w-none lg:p-60 p-6">
      <div className="shadow-2xl lg:p-20 p-6 bg-white absolute lg:top-200 top-30 z-50">
        <button
            onClick={() => handleBack()}
            className="bg-white text-blue-950 mb-20 cursor-pointer">
            <ArrowLeft size={24} className="text-gray-900" />
        </button>
      <h2 className="text-4xl font-bold text-slate-900 mb-6">Terms of Service</h2>
      <p className="text-slate-600 mb-8">Effective Date: December 31, 2025</p>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">1. Acceptance of Terms</h3>
        <p className="text-slate-700 leading-relaxed mb-4">
          Welcome to LAN Library. These Terms of Service constitute a legally binding agreement between you and LAN Library regarding your use of our learning access network library management system, including all associated software, applications, features, and services.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          By accessing or using LAN Library, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you must not access or use our service.
        </p>
        <p className="text-slate-700 leading-relaxed">
          These terms apply to all users of LAN Library, including individual users, librarians, administrators, and any other persons who access or use the service. Your organization or institution may have additional terms or policies that apply to your use of LAN Library.
        </p>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">2. Service Description</h3>
        <p className="text-slate-700 leading-relaxed mb-4">
          LAN Library is a comprehensive library management system designed to operate within local area networks. Our platform provides tools and features for catalog management, book borrowing and returns, user account management, search and discovery functionality, reading recommendations, digital resource access, and administrative reporting and analytics.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          We reserve the right to modify, suspend, or discontinue any aspect of the service at any time, with or without notice. We may also impose limits on certain features or restrict access to parts of the service without liability.
        </p>
        <p className="text-slate-700 leading-relaxed">
          The availability and functionality of LAN Library depend on your local network infrastructure and configuration. We are not responsible for network issues, connectivity problems, or limitations imposed by your organization's IT policies.
        </p>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">3. User Accounts and Registration</h3>
        <p className="text-slate-700 leading-relaxed mb-4">
          To use LAN Library, you must create an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account or any other security breach.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate and current. Providing false information or impersonating another person or entity is prohibited and may result in account termination.
        </p>
        <p className="text-slate-700 leading-relaxed">
          You must be at least 13 years old to create an account, or have obtained parental or guardian consent if you are younger. Accounts for minors may be subject to additional restrictions or oversight as required by applicable law or institutional policy.
        </p>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">4. Acceptable Use Policy</h3>
        <p className="text-slate-700 leading-relaxed mb-4">
          You agree to use LAN Library only for lawful purposes and in accordance with these Terms. You must not use the service to violate any applicable laws, regulations, or third-party rights; transmit any harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable content; attempt to gain unauthorized access to any part of the service or related systems; interfere with or disrupt the service or servers or networks connected to the service; impersonate any person or entity or falsely state or misrepresent your affiliation with a person or entity; upload or transmit viruses, malware, or any other malicious code; collect or harvest information about other users without their consent; or use automated systems or software to extract data from the service without authorization.
        </p>
        <p className="text-slate-700 leading-relaxed">
          Violation of this Acceptable Use Policy may result in immediate suspension or termination of your account, removal of content, and potential legal action. We reserve the right to investigate violations and cooperate with law enforcement authorities as necessary.
        </p>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">5. Library Materials and Borrowing</h3>
        <p className="text-slate-700 leading-relaxed mb-4">
          LAN Library facilitates the borrowing and management of library materials. When you borrow materials through our platform, you agree to comply with all borrowing policies, including due dates and renewal procedures; return borrowed materials in the condition received, subject to normal wear and tear; pay any applicable fines, fees, or replacement costs for late, lost, or damaged materials; and respect intellectual property rights and copyright laws regarding library materials.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          Specific borrowing limits, loan periods, and renewal policies are determined by your library or organization and may vary. You are responsible for knowing and complying with these policies.
        </p>
        <p className="text-slate-700 leading-relaxed">
          Digital materials accessed through LAN Library may be subject to additional terms, including digital rights management restrictions and licensing agreements. You agree to comply with all such terms when accessing digital content.
        </p>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">6. Intellectual Property Rights</h3>
        <p className="text-slate-700 leading-relaxed mb-4">
          LAN Library and its original content, features, and functionality are owned by LAN Library and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. The LAN Library name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of LAN Library or its licensors.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          We grant you a limited, non-exclusive, non-transferable, revocable license to access and use LAN Library for its intended purpose in accordance with these Terms. This license does not include any right to resale or commercial use of the service; collection and use of product listings or descriptions; derivative use of the service or its contents; downloading or copying of account information; or use of data mining, robots, or similar data gathering tools.
        </p>
        <p className="text-slate-700 leading-relaxed">
          You retain ownership of any content you submit to LAN Library, such as reviews, ratings, or comments. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such content in connection with operating and promoting the service.
        </p>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">7. User-Generated Content</h3>
        <p className="text-slate-700 leading-relaxed mb-4">
          LAN Library may allow users to post reviews, ratings, comments, and other content. You are solely responsible for the content you post and the consequences of posting such content. We do not endorse any user-generated content and disclaim all liability related to such content.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          By posting content, you represent and warrant that you have the right to post such content; your content does not violate any third-party rights or applicable laws; your content is not defamatory, obscene, or otherwise objectionable; and you will indemnify us for all claims resulting from your content.
        </p>
        <p className="text-slate-700 leading-relaxed">
          We reserve the right, but have no obligation, to monitor, edit, or remove any user-generated content that we determine violates these Terms or is otherwise objectionable. We do not pre-screen content but may remove content after it has been posted.
        </p>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">8. Fees and Payment</h3>
        <p className="text-slate-700 leading-relaxed mb-4">
          LAN Library may offer both free and paid services. If you purchase a paid subscription or service, you agree to pay all applicable fees as described at the time of purchase. All fees are non-refundable unless otherwise specified or required by law.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          Your library or organization may incur fines or fees for late returns, lost materials, or damaged items. These fees are separate from any subscription fees and are determined by your library's policies. You are responsible for paying all such fines and fees.
        </p>
        <p className="text-slate-700 leading-relaxed">
          We reserve the right to change our fees and pricing at any time. We will provide advance notice of any fee changes, and continued use of paid services after such changes constitutes acceptance of the new fees.
        </p>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">9. Privacy and Data Protection</h3>
        <p className="text-slate-700 leading-relaxed">
          Your use of LAN Library is subject to our Privacy Policy, which describes how we collect, use, and protect your personal information. By using our service, you consent to such processing and warrant that all data provided by you is accurate. Please review our Privacy Policy to understand our privacy practices.
        </p>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">10. Disclaimers and Limitation of Liability</h3>
        <p className="text-slate-700 leading-relaxed mb-4">
          LAN Library is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We disclaim all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the service will be uninterrupted, timely, secure, or error-free; that defects will be corrected; or that the service or servers are free of viruses or other harmful components.
        </p>
        <p className="text-slate-700 leading-relaxed mb-4">
          To the fullest extent permitted by law, LAN Library shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, even if we have been advised of the possibility of such damages. Our total liability to you for all claims arising from or relating to the service shall not exceed the amount you paid us in the twelve months preceding the claim, or one hundred dollars if no fees were paid.
        </p>
        <p className="text-slate-700 leading-relaxed">
          Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so these limitations may not apply to you. In such cases, our liability will be limited to the maximum extent permitted by law.
        </p>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">11. Indemnification</h3>
        <p className="text-slate-700 leading-relaxed">
          You agree to indemnify, defend, and hold harmless LAN Library and its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from your use of the service; your violation of these Terms; your violation of any rights of another party; or any content you post or transmit through the service.
        </p>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">12. Termination</h3>
        <p className="text-slate-700 leading-relaxed mb-4">
          We may terminate or suspend your account and access to LAN Library immediately, without prior notice or liability, for any reason, including but not limited to breach of these Terms. Upon termination, your right to use the service will cease immediately.
        </p>
        <p className="text-slate-700 leading-relaxed">
          You may terminate your account at any time by contacting us or using the account closure feature. Upon termination by either party, you remain liable for all obligations incurred prior to termination. All provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
        </p>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">13. Dispute Resolution and Governing Law</h3>
        <p className="text-slate-700 leading-relaxed mb-4">
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which LAN Library operates, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the service shall be resolved through binding arbitration in accordance with the rules of the applicable arbitration association, except where prohibited by law.
        </p>
        <p className="text-slate-700 leading-relaxed">
          You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action. If for any reason a claim proceeds in court rather than arbitration, you waive any right to a jury trial.
        </p>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">14. Changes to Terms</h3>
        <p className="text-slate-700 leading-relaxed mb-4">
          We reserve the right to modify these Terms at any time. When we make changes, we will post the updated Terms and update the "Effective Date" at the top. For material changes, we will provide additional notice, such as through email or a prominent notice on our platform.
        </p>
        <p className="text-slate-700 leading-relaxed">
          Your continued use of LAN Library after changes are posted constitutes your acceptance of the updated Terms. If you do not agree to the modified Terms, you must stop using the service.
        </p>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">15. General Provisions</h3>
        <p className="text-slate-700 leading-relaxed mb-4">
          These Terms constitute the entire agreement between you and LAN Library regarding the service and supersede all prior agreements and understandings. If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
        </p>
        <p className="text-slate-700 leading-relaxed">
          Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision. You may not assign or transfer these Terms or your rights hereunder without our prior written consent. We may assign these Terms without restriction.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-semibold text-slate-800 mb-4">16. Contact Information</h3>
        <p className="text-slate-700 leading-relaxed">
          If you have any questions about these Terms of Service, please contact us at legal@lanlibrary.com. We will respond to your inquiries as promptly as possible.
        </p>
      </section>
      </div>
    </div>
    </>
  );
}