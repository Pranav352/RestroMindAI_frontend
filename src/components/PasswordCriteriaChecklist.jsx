import React from 'react';
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '../utils/passwordUtils';

const PasswordCriteriaChecklist = ({ criteria, password }) => {
  if (!password) return null;

  return (
    <div className="mt-2.5 p-3 rounded-xl bg-[#131522] border border-[#23273b] space-y-1.5 text-[11px] backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${criteria.length ? 'bg-emerald-400' : 'bg-gray-500'}`} />
        <span className={criteria.length ? 'text-emerald-300 font-medium' : 'text-gray-400'}>
          {PASSWORD_MIN_LENGTH} to {PASSWORD_MAX_LENGTH} Characters
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${criteria.upper && criteria.lower ? 'bg-emerald-400' : 'bg-gray-500'}`} />
        <span className={criteria.upper && criteria.lower ? 'text-emerald-300 font-medium' : 'text-gray-400'}>
          Uppercase (A-Z) & Lowercase (a-z) letters
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${criteria.number ? 'bg-emerald-400' : 'bg-gray-500'}`} />
        <span className={criteria.number ? 'text-emerald-300 font-medium' : 'text-gray-400'}>
          At least 1 Number (0-9)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${criteria.special ? 'bg-emerald-400' : 'bg-gray-500'}`} />
        <span className={criteria.special ? 'text-emerald-300 font-medium' : 'text-gray-400'}>
          At least 1 Special Symbol (!@#$%^&*...)
        </span>
      </div>
    </div>
  );
};

export default PasswordCriteriaChecklist;
