"use client"

import React from 'react'
import { motion } from 'framer-motion'

interface TeamMember {
  id: string
  name: string
  role: string
  image: string
  bio: string
}

interface TeamMemberCardProps {
  member: TeamMember
  delay: number
}

export default function TeamMemberCard({ member, delay }: TeamMemberCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group border-4 border-gray-900 bg-white p-6 text-center shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all duration-300"
    >
      <div className="relative mx-auto mb-6 h-40 w-40 overflow-hidden rounded-full border-4 border-gray-900 bg-gray-100">
        <img
          src={member.image}
          alt={member.name}
          className="h-full w-full object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          srcSet={`
            ${member.image}?w=300 300w,
            ${member.image}?w=600 600w,
            ${member.image}?w=900 900w
          `}
          loading="lazy"
        />
      </div>
      <h3 className="mb-1 text-xl font-bold text-gray-900">{member.name}</h3>
      <p className="mb-4 text-gray-700">{member.role}</p>
      <p className="text-gray-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {member.bio}
      </p>
    </motion.div>
  )
}