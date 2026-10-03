import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const loginSchema = yup.object({
  email: yup.string().email('Email invalide').required('Email requis'),
  password: yup.string().min(6, 'Au minimum 6 caractères').required('Mot de passe requis'),
  rememberMe: yup.boolean(),
});

export default function LoginForm({ onSubmit, loading = false }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2">
          Email
        </label>
        <input
          {...register('email')}
          id="email"
          type="email"
          placeholder="exemple@mail.com"
          className="w-full h-10 px-3 py-2 bg-gray-200 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-mainColor"
          disabled={loading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-2">
          Mot de passe
        </label>
        <input
          {...register('password')}
          id="password"
          type="password"
          placeholder="••••••••"
          className="w-full h-10 px-3 py-2 bg-gray-200 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-mainColor"
          disabled={loading}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* Remember Me */}
      <div className="flex items-center">
        <input
          {...register('rememberMe')}
          id="rememberMe"
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
          disabled={loading}
        />
        <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 cursor-pointer">
          Se souvenir de moi
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-mainColor text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer mt-6"
      >
        {loading ? 'Connexion en cours...' : 'Se connecter'}
      </button>
    </form>
  );
}
