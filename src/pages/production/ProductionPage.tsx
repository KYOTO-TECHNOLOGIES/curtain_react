import PlaceholderModulePage from '../operations/PlaceholderModulePage';

export default function ProductionPage() {
  return (
    <PlaceholderModulePage
      title="Production"
      description="Track manufacturing status of curtain orders on the factory floor."
      planned={[
        'Production queue linked to accepted orders',
        'Status workflow: pending → cutting → stitching → QC → ready',
        'Assign jobs to workshop teams',
        'Material consumption against inventory',
      ]}
    />
  );
}
