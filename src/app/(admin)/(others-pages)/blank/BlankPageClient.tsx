"use client";

import React, { useState } from "react";

export default function BlankPageClient() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-white bg-brand box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none"
      >
        Botón toggle
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 backdrop-blur-[2px] dark:bg-slate-950/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="authentication-modal-title"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl ring-1 ring-white/20 backdrop-blur-2xl md:p-6 dark:border-white/10 dark:bg-slate-950/20 dark:ring-white/10"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4 md:pb-5 dark:border-white/10">
              <h3 id="authentication-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Sign in to our platform
              </h3>
              <button
                type="button"
                className="ms-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-gray-700 transition hover:bg-white/30 hover:text-gray-900 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/20 dark:hover:text-white"
                onClick={() => setIsOpen(false)}
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" />
                </svg>
              </button>
            </div>

            <form action="#" className="pt-4 md:pt-6">
              <div className="mb-4">
                <label htmlFor="email" className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your email
                </label>
                <input
                  type="email"
                  id="email"
                  className="block w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-brand focus:ring-brand dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-gray-400"
                  placeholder="example@company.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your password
                </label>
                <input
                  type="password"
                  id="password"
                  className="block w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-brand focus:ring-brand dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-gray-400"
                  placeholder="•••••••••"
                  required
                />
              </div>

              <div className="my-6 flex items-start">
                <div className="flex items-center">
                  <input
                    id="checkbox-remember"
                    type="checkbox"
                    value=""
                    className="h-4 w-4 rounded border border-white/20 bg-white/10 focus:ring-2 focus:ring-brand-soft dark:border-white/10 dark:bg-white/10"
                  />
                  <label htmlFor="checkbox-remember" className="ms-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Remember me
                  </label>
                </div>
                <a href="#" className="ms-auto text-sm font-medium text-brand hover:underline">
                  Lost Password?
                </a>
              </div>

              <button
                type="submit"
                className="mb-3 w-full rounded-xl border border-transparent bg-brand px-4 py-2.5 text-sm font-medium leading-5 text-white shadow-sm transition hover:bg-brand-strong focus:outline-none focus:ring-4 focus:ring-brand-medium"
              >
                Login to your account
              </button>

              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Not registered?{' '}
                <a href="#" className="text-brand hover:underline">
                  Create account
                </a>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
