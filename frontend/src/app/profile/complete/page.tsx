'use client';
import { useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Define the type for formData
interface FormData {
  name: string;
  university: string;
  domains: string[];
  companyName: string;
  companyWebsite: string;
  companyDescription: string;
  verificationDocument: File | null;
}

export default function CompleteProfile() {
  const [role, setRole] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    university: '',
    domains: [],
    companyName: '',
    companyWebsite: '',
    companyDescription: '',
    verificationDocument: null,
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDomainsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({ ...prev, domains: selectedOptions }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, verificationDocument: file }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const endpoint = role === 'student' ? '/api/profile/student' : '/api/profile/expert';
      const form = new FormData();

      if (role === 'student') {
        form.append('name', formData.name);
        form.append('university', formData.university);
        form.append('domains', JSON.stringify(formData.domains));
      } else {
        form.append('companyName', formData.companyName);
        form.append('companyWebsite', formData.companyWebsite);
        form.append('companyDescription', formData.companyDescription);
        if (formData.verificationDocument) {
          form.append('verificationDocument', formData.verificationDocument);
        }
      }

      const res = await axios.post(endpoint, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.status === 200) {
        router.push(`/dashboard/${role}`);
      }
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <div className="max-w-4xl w-full">
        {!role ? (
          <div className="text-center">
            <h1 className="font-poppins text-3xl md:text-4xl font-bold mb-8">
              Complete Your Profile
            </h1>
            <p className="font-outfit text-gray-600 mb-10">
              Choose your role to get started with Hackaholics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className="border rounded-lg p-6 bg-white shadow hover:shadow-lg transition cursor-pointer flex flex-col items-center"
                onClick={() => handleRoleSelect('student')}
              >
                <Image
                  src="/students.svg"
                  alt="Student"
                  width={350}
                  height={350}
                  className="mb-4 select-none"
                  draggable={false}
                  priority={true}
                />
                <h2 className="font-poppins text-xl font-semibold">Student</h2>
                <p className="font-outfit text-gray-600 text-center">
                  Join hackathons, submit projects, and earn rewards.
                </p>
              </div>
              <div
                className="border rounded-lg p-6 bg-white shadow hover:shadow-lg transition cursor-pointer flex flex-col items-center"
                onClick={() => handleRoleSelect('expert')}
              >
                <Image
                  src="/expert.svg"
                  alt="Expert"
                  width={350}
                  height={350}
                  className="mb-4 select-none"
                  draggable={false}
                  priority={true}
                />
                <h2 className="font-poppins text-xl font-semibold">Expert</h2>
                <p className="font-outfit text-gray-600 text-center">
                  Host hackathons and mentor the next generation.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h1 className="font-poppins text-2xl md:text-3xl font-bold mb-6">
              {role === 'student' ? 'Student Profile' : 'Expert Profile'}
            </h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
              {role === 'student' ? (
                <>
                  <div>
                    <label className="font-outfit text-gray-700">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-lg mt-1 font-outfit"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-outfit text-gray-700">University</label>
                    <input
                      type="text"
                      name="university"
                      value={formData.university}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-lg mt-1 font-outfit"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-outfit text-gray-700">Domains of Interest</label>
                    <select
                      name="domains"
                      multiple
                      value={formData.domains}
                      onChange={handleDomainsChange}
                      className="w-full p-3 border rounded-lg mt-1 font-outfit"
                      required
                    >
                      <option value="AI">AI</option>
                      <option value="Web3">Web3</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="EdTech">EdTech</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="font-outfit text-gray-700">Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-lg mt-1 font-outfit"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-outfit text-gray-700">Company Website</label>
                    <input
                      type="url"
                      name="companyWebsite"
                      value={formData.companyWebsite}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-lg mt-1 font-outfit"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-outfit text-gray-700">Company Description</label>
                    <textarea
                      name="companyDescription"
                      value={formData.companyDescription}
                      onChange={handleInputChange}
                      className="w-full p-3 border rounded-lg mt-1 font-outfit"
                      rows={4}
                      required
                    />
                  </div>
                  <div>
                    <label className="font-outfit text-gray-700">Verification Document</label>
                    <input
                      type="file"
                      name="verificationDocument"
                      onChange={handleFileChange}
                      className="w-full p-3 border rounded-lg mt-1 font-outfit"
                      accept=".pdf,.jpg,.png"
                    />
                  </div>
                </>
              )}
              <button
                type="submit"
                className="bg-yellow-300/70 hover:bg-yellow-300/80 text-black font-semibold p-3 rounded-lg w-full font-outfit"
              >
                Save Profile
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
