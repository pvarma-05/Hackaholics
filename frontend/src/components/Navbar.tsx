'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useUser, SignOutButton } from '@clerk/nextjs';

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isSignedIn, isLoaded } = useUser();
  const username = user?.username;
  const isExpert = user?.publicMetadata?.role === 'EXPERT';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <nav className="w-full font-outfit relative z-50">
      <div className="flex justify-between items-center py-2">
        {/* Logo */}
        <Link href="/" className="flex items-center w-auto h-auto">
          <div className="relative">
            <Image
              src="/Group.svg"
              alt="Hackaholics Logo Small"
              height={200}
              width={200}
              className="object-contain h-auto w-auto block md:hidden select-none"
              draggable={false}
              priority
            />
            <Image
              src="/Group-old.svg"
              alt="Hackaholics Logo Large"
              height={200}
              width={200}
              className="object-contain h-auto w-auto hidden md:block select-none"
              draggable={false}
              priority
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-5 relative">
          {isLoaded && isSignedIn ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <Image
                  src={user?.imageUrl!}
                  alt="profile-pic"
                  height={47}
                  width={47}
                  className="rounded-full border border-gray-300"
                />
                <ChevronDown
                  className={`w-4 h-4 transform transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 bg-white border rounded-md shadow-md py-2 w-48">
                  <Link
                    href={`/profile/${username}`}
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    View Profile
                  </Link>
                  {/* ADD EXPERT DASHBOARD LINK */}
                  {isExpert && (
                      <Link
                        href="/dashboard/expert"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Expert Dashboard
                      </Link>
                  )}
                  <Link
                    href="/settings"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Settings
                  </Link>
                  <div className="border-t my-1" />
                  <SignOutButton>
                    <button className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50">
                      Logout
                    </button>
                  </SignOutButton>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                className="bg-gray-200/50 hover:bg-gray-200 py-2 px-3 rounded-md font-medium"
                href="/signup"
              >
                Register
              </Link>
              <Link
                className="hover:bg-yellow-300/60 py-2 px-3 bg-yellow-300/70 rounded-md font-medium"
                href="/login"
              >
                Login
              </Link>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center">
          {isLoaded && isSignedIn ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="focus:outline-none"
              >
                <Image
                  src={user?.imageUrl!}
                  alt="profile-pic"
                  height={40}
                  width={40}
                  className="rounded-full border border-gray-300"
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-4 bg-white border rounded-md shadow-md py-2 w-48">
                  <Link
                    href={`/profile/${username}`}
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    View Profile
                  </Link>
                  {isExpert && (
                      <Link
                        href="/dashboard/expert"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Expert Dashboard
                      </Link>
                  )}
                  <Link
                    href="/settings"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Settings
                  </Link>
                  <div className="border-t my-1" />
                  <SignOutButton>
                    <button className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50">
                      Logout
                    </button>
                  </SignOutButton>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="focus:outline-none"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={dropdownOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                  />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-4 bg-white border rounded-md shadow-md py-2 w-48">
                  <Link
                    href="/signup"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Register
                  </Link>
                  <Link
                    href="/login"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Login
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
