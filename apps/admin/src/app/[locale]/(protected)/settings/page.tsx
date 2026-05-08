import ProfileSettingsPage from '@/components/settings/ProfileSettingsPage';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <div className="size-full">
      <ProfileSettingsPage />
    </div>
  );
}
