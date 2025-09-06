import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { addToWaitlist } from '@/lib/waitlistService';
import { CheckCircle } from 'lucide-react';

interface WaitlistSignupProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const WaitlistSignup: React.FC<WaitlistSignupProps> = ({ isOpen, onOpenChange }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await addToWaitlist(name, email);
      setIsSuccess(true);
      setName('');
      setEmail('');
      // Auto-close after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        onOpenChange(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting waitlist signup:', error);
      setError('Failed to join waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setError('');
    setName('');
    setEmail('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[480px] backdrop-blur-md border border-gray-700/30 shadow-2xl text-white"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        {!isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Join the Waitlist
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Be among the first to get access to our product on launch.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-6 py-4">
              {error && (
                <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md border border-red-500/30 backdrop-blur-sm">
                  {error}
                </div>
              )}
              <div className="grid gap-3">
                <Label htmlFor="waitlist-name" className="text-gray-300 font-medium">
                  Name
                </Label>
                <Input
                  id="waitlist-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                  disabled={isSubmitting}
                  className="bg-white/10 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-teal-400 focus:ring-teal-400/50 backdrop-blur-sm"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="waitlist-email" className="text-gray-300 font-medium">
                  Email
                </Label>
                <Input
                  id="waitlist-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={isSubmitting}
                  className="bg-white/10 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-teal-400 focus:ring-teal-400/50 backdrop-blur-sm"
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-600/50 text-gray-300 hover:bg-white/10 backdrop-blur-sm"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  className="backdrop-blur-md border border-white/20 hover:border-white/40 hover:scale-105 px-6 py-2 rounded-md font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  style={{
                    backgroundColor: 'rgba(41,167,172,0.15)',
                    boxShadow: '0 4px 16px rgba(41,167,172,0.15)',
                    color: 'white',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(41,167,172,0.25)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(41,167,172,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(41,167,172,0.15)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(41,167,172,0.15)';
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-teal-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 border border-teal-400/30">
                <CheckCircle className="w-8 h-8 text-teal-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                You&apos;re on the list!
              </h3>
              <p className="text-gray-300">
                Thanks for joining our waitlist. We&apos;ll notify you as soon as we launch.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <span>Redirecting you back</span>
              <div className="flex gap-1">
                <div
                  className="w-1 h-1 bg-teal-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div
                  className="w-1 h-1 bg-teal-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></div>
                <div
                  className="w-1 h-1 bg-teal-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistSignup;
