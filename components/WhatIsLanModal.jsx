import React from "react";
import { X } from "lucide-react";

export default function WhatIsLanModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div>
        <div
          className="fixed inset-0 z-50 backdrop-blur-md transition-opacity "
          onClick={onClose}
        />
      </div>

      {/* Modal */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[700px] lg:w-[1000] border-l-blue-950 border-20 bg-white shadow-2xl z-[999] overflow-y-auto animate-slideInRight">

        <div className="sticky top-0 text-white bg-blue-950 border-b border-gray-200 p-4 flex items-center justify-between shadow-2xl">
          <h2 className="text-2xl font-bold text-white">
            What is LAN Library?
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-blue-950 bg-white"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 text-gray-700 leading-relaxed">
          <p className="text-lg font-semibold text-blue-950">
            Read about LAN Library, its purpose, features, and how it benefits
            both learners, publishers, and Universities.
          </p>
          <h3 className="text-2xl font-bold text-blue-950">
            What is LAN Library
          </h3>
          <div>
            <img src="/edulan.jpg" />
          </div>
          <p className="text-base">
            LAN Library is a digital knowledge marketplace and access platform
            designed to make learning, reading, and sharing documents easy,
            secure, and rewarding. It is a place where knowledge meets
            opportunity, and where both writers, students and learners benefit from the
            power of shared information.
          </p>

          {/* What LAN Library Does */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="text-2xl font-bold text-blue-950">
              What LAN Library Does
            </h3>
            <div>
              <img src="/does.jpg" />
            </div>
            <p>
              At its core, LAN Library allows creators, authors, researchers,
              educators, and universities to upload valuable documents such as books, academic
              notes, research papers, manuals, study guides, and educational
              materials. On the other side, readers and learners can discover,
              purchase, and access these resources in one organized and
              easy-to-navigate place.
            </p>

            <p>
              Think of it as a digital library combined with a marketplace.
              Instead of physical shelves, we have digital collections. Instead
              of library cards, we have secure user accounts. And instead of
              borrowing, users purchase permanent access to the knowledge they
              need.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-2">
              Key Features
            </h4>

            <p>
              The platform offers a comprehensive document management system
              where every file is categorized, searchable, and accessible. Users
              can browse by subject, author, document type, or popularity.
              Advanced search filters help learners find exactly what they need
              in seconds.
            </p>

            <p>
              Each document comes with a detailed preview, description, and user
              reviews to help buyers make informed decisions. Once purchased,
              documents are stored in the user's personal library for unlimited
              access anytime, anywhere.
            </p>
          </div>

          {/* What Makes LAN Library Special */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="text-2xl font-bold text-blue-950">
              What Makes LAN Library Special
            </h3>
            <div>
              <img src="/special.jpg" />
            </div>
            <p>
              What makes LAN Library special is its controlled and secure
              marketplace system. When a buyer purchases a document, they pay
              through a secure payment system. The money goes into a managed
              wallet system where every transaction is tracked, verified, and
              protected.
            </p>

            <p>
              Sellers and creators earn real money from their content. Their
              earnings are safely stored in their wallet, and they can withdraw
              their funds when they choose to. This creates a fair economic
              model where knowledge has real value, and creators are properly
              rewarded for their work.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-2">
              Built-in Security
            </h4>

            <p>
              The platform ensures fairness and trust. Buyers are protected from
              fraud through secure payment processing and verified seller
              accounts. Sellers are protected from unauthorized distribution
              through digital rights management and watermarking technology. The
              platform maintains quality standards to ensure that only genuine,
              valuable content is available.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-2">
              Fair Pricing Model
            </h4>

            <p>
              Creators set their own prices, giving them full control over the
              value of their work. The platform takes a small commission to
              maintain operations and continue improving the service. This means
              more money goes directly to the people who create the content,
              encouraging them to share more high-quality materials.
            </p>
          </div>

          {/* Who Benefits */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="text-2xl font-bold text-blue-950">
              Who Benefits from LAN Library
            </h3>
            <div>
              <img src="/stu.jpeg" />
            </div>
            <h4 className="text-lg font-semibold text-blue-900">
              Students and Learners
            </h4>
            <p>
              Students can find study materials, textbooks, lecture notes, and
              past examination questions to help them succeed in their
              education. They no longer need to search endlessly across multiple
              platforms or rely on incomplete resources. Everything they need is
              organized in one trusted location.
            </p>

            <p>
              Whether preparing for exams, writing research papers, or learning
              new subjects, students have instant access to vetted, high-quality
              educational content. The affordable pricing model means that even
              students on tight budgets can access the materials they need to
              excel.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-3">
              Educators and Researchers
            </h4>
            <p>
              Educators and researchers can share their knowledge, publish their
              work, and earn income from their expertise. Their content reaches
              people who truly need it, creating meaningful impact while
              generating revenue.
            </p>

            <p>
              Teachers can upload lesson plans, course materials, and study
              guides. Researchers can publish their findings and academic
              papers. Graduate students can share their thesis work. All of this
              creates a vibrant ecosystem of knowledge sharing where expertise
              is valued and compensated.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-3">
              Professionals and Career Builders
            </h4>
            <p>
              Professionals can access specialized manuals, industry guides,
              training materials, certification study resources, and reference
              documents that help them grow in their careers. Whether you are
              learning a new skill, preparing for a certification exam, or
              staying updated with industry trends, LAN Library provides the
              resources you need.
            </p>

            <p>
              The platform is especially valuable for professionals in fields
              like technology, healthcare, finance, engineering, and law where
              continuous learning is essential for career advancement.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-3">
              Authors and Content Creators
            </h4>
            <p>
              Authors and writers have a platform to publish and sell their work
              directly to readers without complicated publishing processes or
              middlemen taking large percentages. Whether you have written an
              e-book, created a comprehensive guide, or compiled valuable
              research, LAN Library gives you the tools to reach your audience.
            </p>

            <p>
              The platform handles payment processing, content delivery, and
              customer support, allowing creators to focus on what they do best:
              creating great content.
            </p>
          </div>

          {/* The Vision */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="text-2xl font-bold text-blue-950">
              The Vision Behind LAN Library
            </h3>
            <div>
              <img src="/vision.jpeg" />
            </div>
            <p>
              LAN Library is not just about selling documents. It is about
              building a trusted digital library where knowledge is preserved,
              organized, and made accessible. It is about encouraging knowledge
              sharing in a world where information should flow freely but also
              be valued properly.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-2">
              Democratizing Education
            </h4>

            <p>
              We believe that education should be accessible to everyone,
              regardless of their location or economic status. By providing an
              affordable marketplace for educational content, we are breaking
              down barriers that have traditionally limited access to quality
              learning materials.
            </p>

            <p>
              Students in remote areas can access the same high-quality
              materials as those in major cities. Self-learners can find
              resources that were previously only available in expensive
              universities or specialized institutions.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-2">
              Rewarding Knowledge Creators
            </h4>

            <p>
              We also believe that writers deserve to be compensated for their
              hard work. Too often, teachers, researchers, and authors put
              countless hours into creating valuable content only to see it
              shared freely without recognition or compensation.
            </p>

            <p>
              LAN Library bridges that gap by creating a sustainable model where
              both learners and creators win. Learners get affordable access to
              quality content, and creators earn fair compensation for their
              expertise and effort.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-2">
              Building a Knowledge Economy
            </h4>

            <p>
              This platform creates economic opportunities through education. It
              turns knowledge into value. It empowers people to learn, earn, and
              grow. Whether you are a student looking for resources, a teacher
              sharing materials, or an author publishing your work, LAN Library
              is built for you.
            </p>

            <p>
              By creating a marketplace where knowledge has real economic value,
              we encourage more people to share what they know, leading to a
              richer, more diverse collection of learning resources for
              everyone.
            </p>
          </div>

          {/* How It Works */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="text-2xl font-bold text-blue-950">
              How LAN Library Works
            </h3>
            <div>
              <img src="/work.png" />
            </div>
            <h4 className="text-lg font-semibold text-blue-900">For Buyers</h4>
            <p>
              Getting started as a buyer is simple. Create a free account,
              browse the extensive catalog of documents, read descriptions and
              reviews, and purchase the materials you need. Payment is processed
              securely, and your purchased documents are instantly available in
              your personal library.
            </p>

            <p>
              You can organize your library with custom folders, bookmark
              important documents, and access your content from any device. Your
              purchases are permanent, meaning you can return to them anytime
              you need to review or reference the material.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-3">
              For Sellers
            </h4>
            <p>
              Becoming a seller is equally straightforward. Register as a
              content creator, upload your documents with detailed descriptions
              and appropriate pricing, and start earning when users purchase
              your content.
            </p>

            <p>
              The platform provides analytics so you can track your sales,
              understand what content is most popular, and optimize your
              offerings. Your earnings accumulate in your secure wallet, and you
              can request withdrawals at any time according to the platform's
              terms.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-3">
              Quality Control
            </h4>
            <p>
              Every uploaded document goes through a verification process to
              ensure it meets our quality standards. We check for originality,
              relevance, and appropriateness. This protects buyers from
              low-quality or plagiarized content and maintains the integrity of
              the marketplace.
            </p>

            <p>
              Sellers who consistently provide high-quality content earn badges
              and featured placement, helping them reach more potential buyers
              and build their reputation on the platform.
            </p>
          </div>

          {/* Security and Trust */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="text-2xl font-bold text-blue-950">
              Security and Trust
            </h3>
            <div>
              <img src="/libs.jpg" />
            </div>
            <p>
              Security is at the heart of everything we do. Every transaction is
              encrypted and protected using industry-standard security
              protocols. User data is kept private and secure, and we never
              share personal information with third parties without explicit
              consent.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-2">
              Payment Security
            </h4>

            <p>
              Payment processing follows international security standards to
              ensure that your money and financial information are safe. We
              partner with trusted payment providers and use encryption
              technology to protect every transaction from start to finish.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-2">
              Content Protection
            </h4>

            <p>
              We verify documents to maintain quality and authenticity. We
              monitor the platform continuously to prevent fraud, unauthorized
              sharing, and copyright violations. Digital watermarking and
              tracking systems help us identify and address misuse of content.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-2">
              Clear Policies
            </h4>

            <p>
              We provide clear terms and conditions so everyone knows exactly
              how the system works. Our refund policy protects buyers if content
              is misrepresented. Our seller agreement protects creators' rights
              and ensures fair treatment.
            </p>

            <p>
              Trust is not just a feature at LAN Library—it is our foundation.
              We work every day to maintain that trust through transparency,
              security, and fair practices.
            </p>
          </div>

          {/* Community and Growth */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="text-2xl font-bold text-blue-950">
              Community and Growth
            </h3>
            <div>
              <img src="/comm.png" />
            </div>
            <p>
              LAN Library is more than a marketplace—it is a growing community
              of learners, educators, and knowledge enthusiasts. We foster
              connections between people who value education and understand the
              importance of quality information.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-2">
              User Engagement
            </h4>

            <p>
              Users can leave reviews and ratings on documents they purchase,
              helping others make informed decisions. Sellers can respond to
              feedback and build relationships with their audience. This creates
              a dynamic environment where quality is recognized and rewarded.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-2">
              Continuous Improvement
            </h4>

            <p>
              We are constantly improving the platform based on user feedback.
              New features are added regularly to enhance the user experience,
              make navigation easier, and provide better tools for both buyers
              and sellers.
            </p>

            <p>
              Our development team works closely with the community to
              understand needs and implement solutions that make LAN Library
              more valuable for everyone.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-2">
              Global Reach
            </h4>

            <p>
              While we started with a focus on local content and needs, our
              vision is global. We are expanding to include content in multiple
              languages, covering subjects from around the world, and connecting
              learners and educators across borders.
            </p>

            <p>
              Knowledge has no boundaries, and neither should access to it. LAN
              Library is committed to becoming a truly international platform
              where anyone can learn from anyone, anywhere.
            </p>
          </div>

          {/* Future Plans */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h3 className="text-2xl font-bold text-blue-950">
              The Future of LAN Library
            </h3>
            {/* <div>
              <img src="/lanb.png" />
            </div> */}
            <p>
              We have ambitious plans for the future. We are developing features
              like live tutoring sessions, interactive learning modules,
              collaborative study groups, and subscription plans that give users
              access to entire collections at discounted rates.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-2">
              Enhanced Learning Tools
            </h4>

            <p>
              Future updates will include note-taking features, highlighting
              capabilities, bookmark syncing across devices, and even AI-powered
              study assistants that can help you understand complex materials
              better.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-2">
              Expanded Content Types
            </h4>

            <p>
              We are working on supporting more content types including video
              lectures, audio courses, interactive presentations, and multimedia
              educational packages. This will make LAN Library a comprehensive
              learning ecosystem.
            </p>

            <h4 className="text-lg font-semibold text-blue-900 pt-2">
              Partnership Programs
            </h4>

            <p>
              We plan to partner with educational institutions, training
              centers, and professional organizations to provide official course
              materials, certification preparation resources, and exclusive
              content that adds even more value to the platform.
            </p>
          </div>

          {/* Conclusion Box */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-950 p-6 rounded-r-lg mt-8 shadow-sm">
            <p className="text-xl font-bold text-blue-950 mb-3">
              In simple terms: LAN Library connects knowledge to people, and
              turns knowledge into value.
            </p>
            <p className="text-gray-700 mb-2">
              It is a marketplace where learning happens, earnings grow, and
              opportunities are created through the power of shared knowledge.
            </p>
            <p className="text-gray-700">
              We are building more than a platform—we are building a movement
              toward accessible education, fair compensation for creators, and a
              world where knowledge truly is power.
            </p>
          </div>

          <p className="text-center text-gray-600 italic pt-6 pb-4 text-lg">
            Welcome to LAN Library—where knowledge lives, grows, and pays
            forward.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
