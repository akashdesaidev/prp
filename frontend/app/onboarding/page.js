'use client';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    department: '',
    role: 'employee',
    bio: ''
  });
  const { user } = useAuth();
  const router = useRouter();

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      router.push('/');
    }
  };

  const handleSkip = () => {
    router.push('/');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-8 shadow">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Welcome to PRP!</h1>
          <p className="mt-2 text-muted">Let's get you set up in just a few steps</p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8 flex justify-center">
          <div className="flex space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full ${i <= step ? 'bg-primary' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Welcome, {user.firstName}!</h2>
            <p className="text-gray-500">
              You've successfully created your account. Let's personalize your experience.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">What you can do with PRP:</h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-500">
                  <li>• Set and track your OKRs (Objectives & Key Results)</li>
                  <li>• Give and receive continuous feedback</li>
                  <li>• Participate in performance review cycles</li>
                  <li>• Track your time and productivity</li>
                  <li>• Get AI-powered insights and suggestions</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Tell us about yourself</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Department (Optional)
                </label>
                <input
                  type="text"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border bg-transparent p-2 text-foreground"
                  placeholder="e.g., Engineering, Marketing, Sales"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Brief Bio (Optional)
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border bg-transparent p-2 text-foreground"
                  rows={3}
                  placeholder="Tell us a bit about yourself and your role..."
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">You're all set!</h2>
            <div className="space-y-4">
              <p className="text-gray-500">
                Your account is ready to use. Here are some next steps to get started:
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 rounded-lg border p-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Explore your dashboard</h4>
                    <p className="text-sm text-gray-500">Get familiar with the main features</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Set your first OKR</h4>
                    <p className="text-sm text-gray-500">Define your objectives and key results</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Give feedback</h4>
                    <p className="text-sm text-gray-500">
                      Start building a culture of continuous feedback
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={handleSkip} className="px-6">
            Skip for now
          </Button>
          <Button onClick={handleNext} className="px-6">
            {step === 3 ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
