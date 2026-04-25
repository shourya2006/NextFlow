import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function SSOCallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
