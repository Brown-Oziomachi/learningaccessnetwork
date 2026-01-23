"use client"
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyClient() {
    const router = useRouter()

    const handleBack = () => {
        router.push("/")
    }
    return (
        <>
            <div className="bg-blue-950">
                <img src="/lanlogo.jpg" className="relative w-full" />
            </div>
            <div className="prose prose-lg max-w-none lg:p-60 p-6">
                <div className="shadow-2xl lg:p-20 p-6 bg-white absolute lg:top-200 top-30 z-50">
                    <button
                        onClick={() => handleBack()}
                        className="text-blue-950 mb-20 cursor-pointer bg-blue-950 py-2 px-5 hover:bg-white ">
                        <ArrowLeft size={24} className="text-gray-100 hover:text-blue-950" />
                    
                    </button>
                    <h2 className="text-4xl font-bold text-slate-900 mb-6">Privacy Policy</h2>
                    <p className="text-slate-600 mb-8">Effective Date: December 31, 2025</p>

                    <section className="mb-10">
                        <h3 className="text-2xl font-semibold text-slate-800 mb-4">1. Introduction</h3>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            Welcome to LAN Library. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Learning Access Network library management system.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                            By using LAN Library, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our service.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h3 className="text-2xl font-semibold text-slate-800 mb-4">2. Information We Collect</h3>

                        <h4 className="text-xl font-semibold text-slate-700 mb-3 mt-6">2.1 Personal Information</h4>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            When you register for LAN Library, we may collect personal information including but not limited to your name, email address, username, password, and profile information. We collect information you provide directly to us when creating an account, updating your profile, or communicating with us.
                        </p>

                        <h4 className="text-xl font-semibold text-slate-700 mb-3 mt-6">2.2 Library Usage Data</h4>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            We collect information about your library activities, including books borrowed, reading history, search queries, book ratings and reviews, wishlist items, and reading preferences. This information helps us provide personalized recommendations and improve our service.
                        </p>

                        <h4 className="text-xl font-semibold text-slate-700 mb-3 mt-6">2.4 Usage Analytics</h4>
                        <p className="text-slate-700 leading-relaxed">
                            We collect analytics data about how you interact with LAN Library, including pages visited, features used, time spent on different sections, click patterns and navigation paths, and system performance metrics. This information is used to improve user experience and system functionality.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h3 className="text-2xl font-semibold text-slate-800 mb-4">3. How We Use Your Information</h3>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            We use the information we collect for various purposes, including to provide, maintain, and improve our services; to process your transactions and manage your library account; to send you notifications about due dates, new arrivals, and system updates; to personalize your experience with book recommendations and customized content; to analyze usage patterns and optimize system performance; to detect, prevent, and address technical issues and security threats; to respond to your comments, questions, and customer service requests; to comply with legal obligations and enforce our terms; and to communicate with you about changes to our policies or services.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h3 className="text-2xl font-semibold text-slate-800 mb-4">4. Information Sharing and Disclosure</h3>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                        </p>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            With your consent, when you explicitly authorize us to share specific information. With service providers who assist in operating our platform, such as hosting providers, analytics services, and email communication platforms, under strict confidentiality agreements. With network administrators in your organization, as LAN Library operates within local networks and certain administrative access may be necessary. When required by law, legal process, or government request, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                            In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity, and you will be notified via email and prominent notice on our platform of any change in ownership.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h3 className="text-2xl font-semibold text-slate-800 mb-4">5. Data Security</h3>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            We implement robust security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. Our security practices include encryption of data in transit and at rest using industry-standard protocols, secure authentication mechanisms with password hashing, regular security audits and vulnerability assessments, access controls and permission management, secure backup procedures, and network security measures including firewalls and intrusion detection.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                            While we strive to protect your personal information, no method of transmission over the internet or electronic storage is completely secure. We cannot guarantee absolute security but continuously work to improve our security measures.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h3 className="text-2xl font-semibold text-slate-800 mb-4">6. Data Retention</h3>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Account information is retained while your account is active and for a reasonable period afterward. Reading history and borrowing records are retained for administrative purposes and to provide you with historical data. Analytics and usage data may be retained in aggregated, anonymized form indefinitely.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                            When we no longer need your information, we will securely delete or anonymize it in accordance with our data retention policies.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h3 className="text-2xl font-semibold text-slate-800 mb-4">7. Your Privacy Rights</h3>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            Depending on your location and applicable laws, you may have certain rights regarding your personal information. These rights may include the right to access your personal information and request a copy of the data we hold about you; the right to rectify inaccurate or incomplete personal information; the right to delete your personal information, subject to certain exceptions; the right to restrict or object to certain processing of your information; the right to data portability, allowing you to receive your data in a structured, machine-readable format; and the right to withdraw consent where processing is based on consent.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                            To exercise these rights, please contact us using the information provided at the end of this policy. We will respond to your request within a reasonable timeframe and in accordance with applicable law.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h3 className="text-2xl font-semibold text-slate-800 mb-4">8. Children's Privacy</h3>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            LAN Library may be used by minors as part of educational or library programs. When our service is used by individuals under the age of 13 (or the applicable age of digital consent in your jurisdiction), we comply with applicable children's privacy laws. We do not knowingly collect personal information from children without appropriate parental or guardian consent.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                            If you believe we have collected information from a child without proper consent, please contact us immediately, and we will take steps to remove such information.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h3 className="text-2xl font-semibold text-slate-800 mb-4">10. Changes to This Privacy Policy</h3>
                        <p className="text-slate-700 leading-relaxed mb-4">
                            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make changes, we will update the "Effective Date" at the top of this policy and notify you through the platform or by email for significant changes.
                        </p>
                        <p className="text-slate-700 leading-relaxed">
                            We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information. Your continued use of LAN Library after changes are posted constitutes your acceptance of the updated policy.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-2xl font-semibold text-slate-800 mb-4">11. Contact Us</h3>
                        <p className="text-slate-700 leading-relaxed">
                            If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at legal@lanlibrary.com. We are committed to resolving any privacy concerns you may have.
                        </p>
                    </section>
                </div>
            </div>
        </>
    );
}
