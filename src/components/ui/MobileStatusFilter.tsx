import { StatusHeaderFilter, type StatusHeaderFilterProps } from './StatusHeaderFilter';

export function MobileStatusFilter(props: StatusHeaderFilterProps) {
  return <StatusHeaderFilter {...props} mobile />;
}