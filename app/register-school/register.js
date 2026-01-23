"use client"
import { useState, useEffect } from 'react';
import { Upload, Building2, Mail, Phone, User, FileText, CheckCircle, AlertCircle, Loader2, Plus, X, Target, Eye as EyeIcon, BookOpen, Globe } from 'lucide-react';
import { db, auth } from "@/lib/firebaseConfig";
import { addDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { useRouter } from "next/navigation";

export default function SchoolRegistrationClient() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        // Basic Info
        schoolName: '',
        schoolType: '',
        approvalNumber: '',
        established: '',
        motto: '',

        // Contact
        email: '',
        phone: '',
        principalName: '',
        address: '',
        state: '',
        country: 'Nigeria',
        website: '',

        // About
        description: '',
        mission: '',
        vision: '',

        // Academic Programs
        departments: [],
        academicPrograms: [],

        // Documents
        proofDocument: null,
        agreeToTerms: false
    });

    const [newDepartment, setNewDepartment] = useState('');
    const [newProgram, setNewProgram] = useState('');
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [applicationId, setApplicationId] = useState('');

    const schoolTypes = [
        'Primary School (Public)',
        'Primary School (Private)',
        'Secondary School (Public)',
        'Secondary School (Private)',
        'University',
        'Polytechnic',
        'College of Education',
        'Technical College',
        'Coding Institution'
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

    const addDepartment = () => {
        if (newDepartment.trim() && !formData.departments.includes(newDepartment.trim())) {
            setFormData(prev => ({
                ...prev,
                departments: [...prev.departments, newDepartment.trim()]
            }));
            setNewDepartment('');
        }
    };

    const removeDepartment = (dept) => {
        setFormData(prev => ({
            ...prev,
            departments: prev.departments.filter(d => d !== dept)
        }));
    };

    const addAcademicProgram = () => {
        if (newProgram.trim() && !formData.academicPrograms.includes(newProgram.trim())) {
            setFormData(prev => ({
                ...prev,
                academicPrograms: [...prev.academicPrograms, newProgram.trim()]
            }));
            setNewProgram('');
        }
    };

    const removeAcademicProgram = (program) => {
        setFormData(prev => ({
            ...prev,
            academicPrograms: prev.academicPrograms.filter(p => p !== program)
        }));
    };

    const validateStep = (currentStep) => {
        const newErrors = {};

        if (currentStep === 1) {
            if (!formData.schoolName.trim()) newErrors.schoolName = 'School name is required';
            if (!formData.schoolType) newErrors.schoolType = 'School type is required';
            if (!formData.approvalNumber.trim()) newErrors.approvalNumber = 'Approval number is required';
            if (!formData.address.trim()) newErrors.address = 'Address is required';
            if (!formData.state) newErrors.state = 'State is required';
            if (!formData.established.trim()) newErrors.established = 'Establishment year is required';
        }

        if (currentStep === 2) {
            if (!formData.email.trim()) {
                newErrors.email = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = 'Invalid email format';
            }
            if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
            if (!formData.principalName.trim()) newErrors.principalName = 'Principal/Registrar name is required';
        }

        if (currentStep === 3) {
            if (!formData.description.trim()) newErrors.description = 'School description is required';
            if (!formData.mission.trim()) newErrors.mission = 'Mission statement is required';
            if (!formData.vision.trim()) newErrors.vision = 'Vision statement is required';
        }

        if (currentStep === 4) {
            if (formData.departments.length === 0) newErrors.departments = 'Add at least one department';
            if (formData.academicPrograms.length === 0) newErrors.academicPrograms = 'Add at least one academic program';
        }

        if (currentStep === 5) {
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
        // Replace with actual Firebase Storage upload
        return `https://storage.lanlibrary.com/schools/proof-${Date.now()}.pdf`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(5)) return;

        setSubmitting(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                alert('You must be logged in');
                router.push('/auth/signin');
                return;
            }

            let proofUrl = '';
            if (formData.proofDocument) {
                proofUrl = await uploadFileToFirebase(formData.proofDocument);
            }

            const appId = `SCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            const schoolId = `school-${Date.now()}`;

            const schoolApplicationData = {
                userId: user.uid,
                applicationId: appId,
                schoolId: schoolId,

                // Basic Info
                schoolName: formData.schoolName,
                schoolType: formData.schoolType,
                approvalNumber: formData.approvalNumber,
                established: formData.established,
                motto: formData.motto,

                // Contact
                email: formData.email,
                phone: formData.phone,
                principalName: formData.principalName,
                address: formData.address,
                state: formData.state,
                country: formData.country,
                website: formData.website,

                // About
                description: formData.description,
                mission: formData.mission,
                vision: formData.vision,

                // Academic
                departments: formData.departments,
                academicPrograms: formData.academicPrograms,

                // Verification
                proofDocumentUrl: proofUrl,
                status: 'pending',
                verifiedSchool: false,

                // Stats
                totalDocuments: 0,
                totalDownloads: 0,
                totalViews: 0,
                totalStudents: 0,

                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                joinedDate: serverTimestamp()
            };

            await addDoc(collection(db, 'schoolApplications'), schoolApplicationData);
            setApplicationId(appId);
            setSubmitted(true);

        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to submit: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
                <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Application Submitted!</h2>
                    <p className="text-center text-gray-600 mb-6">
                        Thank you for registering <span className="font-semibold text-blue-600">{formData.schoolName}</span>
                    </p>
                    <div className="bg-blue-50 rounded-xl p-6 mb-6">
                        <p className="text-sm text-gray-600 mb-2 text-center">Reference Number</p>
                        <p className="text-2xl font-mono font-bold text-blue-900 text-center">{applicationId}</p>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 text-blue-950">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Register Your Institution</h1>
                    <p className="text-gray-600">Complete all steps to join LAN Library</p>
                </div>

                {/* Progress */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <div key={num} className="flex items-center flex-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                                    }`}>
                                    {step > num ? '✓' : num}
                                </div>
                                {num < 5 && <div className={`h-2 flex-1 mx-2 rounded ${step > num ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold mb-6">Basic Information</h2>

                            <div>
                                <label className="block font-semibold mb-2">School Name *</label>
                                <input
                                    type="text"
                                    name="schoolName"
                                    value={formData.schoolName}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-xl ${errors.schoolName ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="University of Lagos"
                                />
                                {errors.schoolName && <p className="text-red-600 text-sm mt-1">{errors.schoolName}</p>}
                            </div>

                            <div>
                                <label className="block font-semibold mb-2">Institution Type *</label>
                                <select
                                    name="schoolType"
                                    value={formData.schoolType}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-xl ${errors.schoolType ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Select type</option>
                                    {schoolTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                                {errors.schoolType && <p className="text-red-600 text-sm mt-1">{errors.schoolType}</p>}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold mb-2">Approval Number *</label>
                                    <input
                                        type="text"
                                        name="approvalNumber"
                                        value={formData.approvalNumber}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border-2 rounded-xl ${errors.approvalNumber ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="FED/SCH/2024/001"
                                    />
                                    {errors.approvalNumber && <p className="text-red-600 text-sm mt-1">{errors.approvalNumber}</p>}
                                </div>

                                <div>
                                    <label className="block font-semibold mb-2">Est. Year *</label>
                                    <input
                                        type="text"
                                        name="established"
                                        value={formData.established}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border-2 rounded-xl ${errors.established ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="1962"
                                    />
                                    {errors.established && <p className="text-red-600 text-sm mt-1">{errors.established}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold mb-2">School Motto</label>
                                <input
                                    type="text"
                                    name="motto"
                                    value={formData.motto}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl"
                                    placeholder="In Deed and Truth"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold mb-2">Full Address *</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows="3"
                                    className={`w-full px-4 py-3 border-2 rounded-xl ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="Akoka, Yaba, Lagos State, Nigeria"
                                />
                                {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold mb-2">State *</label>
                                    <select
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border-2 rounded-xl ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select state</option>
                                        {nigerianStates.map(state => <option key={state} value={state}>{state}</option>)}
                                    </select>
                                    {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state}</p>}
                                </div>

                                <div>
                                    <label className="block font-semibold mb-2">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Contact Info */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold mb-6">Contact Information</h2>

                            <div>
                                <label className="block font-semibold mb-2">Official Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-xl ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="info@unilag.edu.ng"
                                />
                                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block font-semibold mb-2">Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-xl ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="+234 1 493 4270"
                                />
                                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                            </div>

                            <div>
                                <label className="block font-semibold mb-2">Principal/Registrar Name *</label>
                                <input
                                    type="text"
                                    name="principalName"
                                    value={formData.principalName}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-xl ${errors.principalName ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="Prof. John Adeyemi"
                                />
                                {errors.principalName && <p className="text-red-600 text-sm mt-1">{errors.principalName}</p>}
                            </div>

                            <div>
                                <label className="block font-semibold mb-2">Website</label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl"
                                    placeholder="https://unilag.edu.ng"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: About School */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold mb-6">About Your Institution</h2>

                            <div>
                                <label className="block font-semibold mb-2">
                                    <FileText className="w-4 h-4 inline mr-1" />
                                    School Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    className={`w-full px-4 py-3 border-2 rounded-xl ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="The University of Lagos, popularly known as UNILAG, is a premier institution of learning..."
                                />
                                {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
                            </div>

                            <div>
                                <label className="block font-semibold mb-2">
                                    <Target className="w-4 h-4 inline mr-1" />
                                    Our Mission *
                                </label>
                                <textarea
                                    name="mission"
                                    value={formData.mission}
                                    onChange={handleChange}
                                    rows="3"
                                    className={`w-full px-4 py-3 border-2 rounded-xl ${errors.mission ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="To provide world-class education and foster innovation..."
                                />
                                {errors.mission && <p className="text-red-600 text-sm mt-1">{errors.mission}</p>}
                            </div>

                            <div>
                                <label className="block font-semibold mb-2">
                                    <EyeIcon className="w-4 h-4 inline mr-1" />
                                    Our Vision *
                                </label>
                                <textarea
                                    name="vision"
                                    value={formData.vision}
                                    onChange={handleChange}
                                    rows="3"
                                    className={`w-full px-4 py-3 border-2 rounded-xl ${errors.vision ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="To be a leading institution of learning in Africa..."
                                />
                                {errors.vision && <p className="text-red-600 text-sm mt-1">{errors.vision}</p>}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Academic Programs */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold mb-6">Academic Programs</h2>

                            {/* Departments */}
                            <div>
                                <label className="block font-semibold mb-2">Departments *</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newDepartment}
                                        onChange={(e) => setNewDepartment(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDepartment())}
                                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl"
                                        placeholder="e.g., Engineering, Medicine, Law"
                                    />
                                    <button
                                        type="button"
                                        onClick={addDepartment}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.departments.map(dept => (
                                        <div key={dept} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full flex items-center gap-2">
                                            {dept}
                                            <button type="button" onClick={() => removeDepartment(dept)}>
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {errors.departments && <p className="text-red-600 text-sm mt-2">{errors.departments}</p>}
                            </div>

                            {/* Academic Programs */}
                            <div>
                                <label className="block font-semibold mb-2">Academic Programs *</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newProgram}
                                        onChange={(e) => setNewProgram(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAcademicProgram())}
                                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl"
                                        placeholder="e.g., B.Sc Engineering, M.A Education"
                                    />
                                    <button
                                        type="button"
                                        onClick={addAcademicProgram}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.academicPrograms.map(program => (
                                        <div key={program} className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full flex items-center gap-2">
                                            {program}
                                            <button type="button" onClick={() => removeAcademicProgram(program)}>
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {errors.academicPrograms && <p className="text-red-600 text-sm mt-2">{errors.academicPrograms}</p>}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Documents */}
                    {step === 5 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold mb-6">Verification Documents</h2>

                            <div>
                                <label className="block font-semibold mb-2">Upload Proof Document *</label>
                                <div className={`border-2 border-dashed rounded-xl p-8 text-center ${errors.proofDocument ? 'border-red-500' : 'border-gray-300'}`}>
                                    <input
                                        type="file"
                                        id="proofDoc"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <label htmlFor="proofDoc" className="cursor-pointer">
                                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        {formData.proofDocument ? (
                                            <p className="text-green-600 font-semibold">{formData.proofDocument.name}</p>
                                        ) : (
                                            <p className="text-gray-600">Click to upload (PDF, JPG, PNG - Max 5MB)</p>
                                        )}
                                    </label>
                                </div>
                                {errors.proofDocument && <p className="text-red-600 text-sm mt-2">{errors.proofDocument}</p>}
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6">
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
                                {errors.agreeToTerms && <p className="text-red-600 text-sm mt-2">{errors.agreeToTerms}</p>}
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
                        {step < 5 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="flex-1 bg-blue-950 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg"
                            >
                                Next Step
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? (
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