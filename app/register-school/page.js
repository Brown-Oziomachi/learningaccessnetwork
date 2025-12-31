"use client"
import { useState, useEffect } from 'react';
import { Upload, Building2, Mail, Phone, User, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { db, auth } from "@/lib/firebaseConfig";
import { addDoc, collection } from 'firebase/firestore';
import Navbar from '@/components/NavBar';
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function SchoolRegistration() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolType: '',
    approvalNumber: '',
    email: '',
    phone: '',
    principalName: '',
    address: '',
    state: '',
    country: 'Nigeria',
    website: '',
    proofDocument: null,
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');
    const router = useRouter();

      useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                await fetchUserData(currentUser.uid);
            } else {
                router.push('/auth/signin');
            }
        });

        return () => unsubscribe();
    }, [router]);

  
  const schoolTypes = [
    'Secondary School (Public)',
    'Secondary School (Private)',
    'University',
    'Polytechnic',
    'College of Education',
    'Technical College'
  ];

  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
    'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
    'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
    'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
    'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, proofDocument: 'File size must be less than 5MB' }));
        return;
      }
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        setErrors(prev => ({ ...prev, proofDocument: 'Only PDF, JPG, or PNG files allowed' }));
        return;
      }
      setFormData(prev => ({ ...prev, proofDocument: file }));
      if (errors.proofDocument) {
        setErrors(prev => ({ ...prev, proofDocument: '' }));
      }
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.schoolName.trim()) newErrors.schoolName = 'School name is required';
      if (!formData.schoolType) newErrors.schoolType = 'School type is required';
      if (!formData.approvalNumber.trim()) newErrors.approvalNumber = 'Approval number is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.state) newErrors.state = 'State is required';
    }
    
    if (currentStep === 2) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
        newErrors.phone = 'Invalid phone number';
      }
      if (!formData.principalName.trim()) newErrors.principalName = 'Principal/Registrar name is required';
    }
    
    if (currentStep === 3) {
      if (!formData.proofDocument) newErrors.proofDocument = 'Proof document is required';
      if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadFileToFirebase = async (file) => {
    // Simulate file upload - Replace with actual Firebase Storage upload
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`https://storage.lanlibrary.com/schools/proof-${Date.now()}.pdf`);
      }, 1500);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;

    setLoading(true);

    try {
      // Upload proof document to Firebase Storage
      let proofUrl = '';
      if (formData.proofDocument) {
        proofUrl = await uploadFileToFirebase(formData.proofDocument);
      }

      // Generate application ID
      const appId = `SCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Prepare data for Firestore
      const schoolApplicationData = {
        applicationId: appId,
        schoolName: formData.schoolName,
        schoolType: formData.schoolType,
        approvalNumber: formData.approvalNumber,
        email: formData.email,
        phone: formData.phone,
        principalName: formData.principalName,
        address: formData.address,
        state: formData.state,
        country: formData.country,
        website: formData.website || '',
        proofDocumentUrl: proofUrl,
        status: 'pending', // pending | approved | rejected
        verifiedSchool: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // TODO: Replace with actual Firestore write
      await addDoc(collection(db, 'schoolApplications'), schoolApplicationData);
      
      console.log('School Application Data:', schoolApplicationData);

      setApplicationId(appId);
      setSubmitted(true);

    } catch (error) {
      console.error('Submission error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Application Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6 text-center">
              Thank you for registering <span className="font-semibold text-blue-600">{formData.schoolName}</span> with LAN Library.
            </p>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-2">Application Reference Number</p>
                <p className="text-2xl font-mono font-bold text-blue-900 bg-white px-4 py-2 rounded-lg inline-block">
                  {applicationId}
                </p>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Please save this reference number for tracking your application
              </p>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                What Happens Next?
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Email Verification</span> - We'll send a verification link to <span className="text-blue-600">{formData.email}</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Document Review</span> - Our team will verify your approval documents
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Approval Notification</span> - You'll receive credentials via email within 2-3 business days
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Start Uploading</span> - Access your school dashboard and begin sharing educational materials
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">Need Help?</p>
                  <p>Contact us at <a href="mailto:schools@lanlibrary.com" className="text-blue-600 hover:underline">schools@lanlibrary.com</a> or call <a href="tel:+2341234567890" className="text-blue-600 hover:underline">+234 123 456 7890</a></p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all font-semibold"
              >
                Return to Home
              </button>
              <button
                onClick={() => window.location.href = '/schools'}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg"
              >
                Browse Schools
              </button>
            </div>

            {/* Info Section */}
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Why Partner with LAN Library?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Free Digital Archive</h4>
                  <p className="text-sm text-gray-600">Store and organize all your educational materials in one secure location</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Verified Badge</h4>
                  <p className="text-sm text-gray-600">Get official recognition with a verified school badge</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Easy Access</h4>
                  <p className="text-sm text-gray-600">Students can access materials anytime, anywhere, reducing printing costs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Navbar />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        
        <div className="text-center mb-8 py-10">
          <div className="inline-block bg-blue-100 p-4 rounded-full mb-4">
            <Building2 className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Register Your Institution</h1>
          <p className="text-lg text-gray-600">Join LAN Library as a verified educational institution</p>
          <p className="text-sm text-gray-500 mt-2">Become part of Nigeria's largest digital academic library</p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  step >= num 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-110' 
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {step > num ? '✓' : num}
                </div>
                {num < 3 && (
                  <div className={`h-2 flex-1 mx-3 rounded-full transition-all ${
                    step > num ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className={`transition-colors ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              School Information
            </span>
            <span className={`transition-colors ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              Contact Details
            </span>
            <span className={`transition-colors ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              Verification Documents
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white text-blue-950 rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Step 1: School Information */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">School Information</h2>
                <p className="text-gray-600 text-sm mt-1">Provide accurate details about your institution</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  School Name *
                </label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  placeholder="e.g., University of Lagos"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.schoolName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.schoolName && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.schoolName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Institution Type *
                </label>
                <select
                  name="schoolType"
                  value={formData.schoolType}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.schoolType ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select institution type</option>
                  {schoolTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.schoolType && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.schoolType}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Government Approval Number *
                </label>
                <input
                  type="text"
                  name="approvalNumber"
                  value={formData.approvalNumber}
                  onChange={handleChange}
                  placeholder="e.g., FED/SCH/2024/001"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.approvalNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">Official registration or approval number from ministry of education</p>
                {errors.approvalNumber && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.approvalNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter complete school address with landmark"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.address && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.address}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      errors.state ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select state</option>
                    {nigerianStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.state}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://school.edu.ng"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
                <p className="text-gray-600 text-sm mt-1">How can we reach your institution?</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Official School Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g., registrar@school.edu.ng or info@school.edu.ng"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">Must be an official school email domain</p>
                {errors.email && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+234 123 456 7890"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Principal/Registrar Full Name *
                </label>
                <input
                  type="text"
                  name="principalName"
                  value={formData.principalName}
                  onChange={handleChange}
                  placeholder="e.g., Prof. John Adeyemi"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.principalName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">Name of the head of institution</p>
                {errors.principalName && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.principalName}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Important Note</p>
                    <p>A verification email will be sent to the provided email address. Please ensure you have access to this email.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Verification Documents */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Verification Documents</h2>
                <p className="text-gray-600 text-sm mt-1">Upload proof of institutional authorization</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Upload className="w-4 h-4 inline mr-1" />
                  Upload Proof Document *
                </label>
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  errors.proofDocument ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-500'
                }`}>
                  <input
                    type="file"
                    id="proofDocument"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="proofDocument" className="cursor-pointer">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    {formData.proofDocument ? (
                      <div className="text-green-600 font-semibold mb-2 flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {formData.proofDocument.name}
                      </div>
                    ) : (
                      <p className="text-gray-600 font-medium mb-2">Click to upload document</p>
                    )}
                    <p className="text-sm text-gray-500">
                      PDF, JPG, or PNG (Max 5MB)
                    </p>
                  </label>
                </div>
                {errors.proofDocument && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.proofDocument}
                  </p>
                )}
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Acceptable Documents:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Government approval/registration letter</li>
                    <li>• Ministry of Education certificate</li>
                    <li>• Official school letterhead document</li>
                    <li>• School ID of Principal/Registrar</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mt-6">
                <h3 className="font-bold text-gray-900 mb-4">Terms & Conditions</h3>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to LAN Library's terms and conditions and confirm that all information provided is accurate and truthful
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.agreeToTerms}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all font-semibold"
              >
                Previous
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 bg-blue-950 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg flex items-center justify-center gap-2"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Registration
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}