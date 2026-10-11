import PlaceholderModulePage from '../operations/PlaceholderModulePage';

export default function InstallationPage() {
  return (
    <PlaceholderModulePage
      title="Installation"
      description="Dispatch and track on-site installation jobs."
      planned={[
        'Schedule installation visits from completed orders',
        'Assign field teams and track job progress',
        'Capture site notes and completion photos',
        'Close jobs and sync status back to orders',
      ]}
    />
  );
}
