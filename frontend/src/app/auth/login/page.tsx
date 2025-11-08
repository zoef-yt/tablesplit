'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Mail, Lock, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLogin } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [emailForMagicLink, setEmailForMagicLink] = useState('');

  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onMagicLink = async (values: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync({ email: values.email });
      setEmailForMagicLink(values.email);
      setMagicLinkSent(true);
    } catch (error: any) {
      form.setError('root', {
        message: error.response?.data?.error || 'Failed to send magic link',
      });
    }
  };

  const onPasswordLogin = async (values: LoginFormValues) => {
    if (!values.password) {
      form.setError('password', { message: 'Password is required' });
      return;
    }

    try {
      await loginMutation.mutateAsync({
        email: values.email,
        password: values.password,
      });
    } catch (error: any) {
      form.setError('root', {
        message: error.response?.data?.error || 'Login failed',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-felt-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-block mb-4"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center shadow-glow-gold-strong">
              <Coins className="w-10 h-10 text-slate-950" />
            </div>
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Table<span className="text-gold-500">Split</span>
          </h1>
          <p className="text-gray-400">Welcome back to the table</p>
        </div>

        {/* Login Card */}
        <div className="bg-felt-700/50 backdrop-blur-sm border border-gold-900/30 rounded-2xl p-8 shadow-glow-gold">
          {magicLinkSent ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <Mail className="w-16 h-16 text-gold-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Check your email!</h2>
              <p className="text-gray-300 mb-6">
                We've sent a magic link to <strong>{emailForMagicLink}</strong>. Click the link to log in.
              </p>
              <Button
                variant="ghost"
                onClick={() => setMagicLinkSent(false)}
                className="text-gold-500"
              >
                Try different email
              </Button>
            </motion.div>
          ) : (
            <Form {...form}>
              {/* Magic Link Form */}
              <form onSubmit={form.handleSubmit(onMagicLink)} className="mb-6">
                <h2 className="text-xl font-bold text-white mb-4">Sign in with Magic Link</h2>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="you@example.com"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full mt-4"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Magic Link'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gold-900/30" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-felt-700/50 text-gray-400">Or with password</span>
                </div>
              </div>

              {/* Password Login Form */}
              <form onSubmit={form.handleSubmit(onPasswordLogin)}>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                    {form.formState.errors.root.message}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full mt-4"
                  disabled={loginMutation.isPending}
                >
                  Sign In
                </Button>
              </form>
            </Form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
