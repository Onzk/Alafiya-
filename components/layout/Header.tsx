'use client'

import { useState } from 'react'
import { Menu, X, Bell } from 'lucide-react'
import { SessionUser } from '@/types'

interface HeaderProps {
  user: SessionUser
  onMenuToggle?: () => void
}

export function Header({ user, onMenuToggle }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1 lg:ml-0" />

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-700 font-semibold text-xs">
              {user.nom[0]}{user.prenoms[0]}
            </span>
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-700">
            {user.nom} {user.prenoms}
          </span>
        </div>
      </div>
    </header>
  )
}
