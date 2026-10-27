/**
 * Small line icons used across the app. All are decorative (aria-hidden).
 * @author Ashmi Hettige
 */
function Icon({ size = 22, strokeWidth = 1.9, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function ArrowRightIcon(props) {
  return <Icon strokeWidth={2.2} {...props}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
}

export function TrendUpIcon(props) {
  return <Icon {...props}><path d="M3 17l5-5 4 4 8-8" /><path d="M14 8h6v6" /></Icon>;
}

export function ClockIcon(props) {
  return <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>;
}

export function TruckIcon(props) {
  return (
    <Icon {...props}>
      <path d="M2 7h11v9H2z" />
      <path d="M13 10h4l3 3v3h-7" />
      <circle cx="6" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </Icon>
  );
}

export function MarketIcon(props) {
  return <Icon {...props}><path d="M3 21h18" /><path d="M5 21V9l7-5 7 5v12" /><path d="M10 21v-6h4v6" /></Icon>;
}

export function SproutIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 21V11" />
      <path d="M12 11C12 7 9 4 5 4C5 8 8 11 12 11Z" />
      <path d="M12 14C12 10 15 7 19 7C19 11 16 14 12 14Z" />
    </Icon>
  );
}

export function UsersIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M15 15c3 0 6 2 6 5" />
    </Icon>
  );
}

export function ShieldCheckIcon(props) {
  return <Icon {...props}><path d="M12 3l8 4v5c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V7z" /><path d="M9 12l2 2 4-4" /></Icon>;
}

export function ArrowLeftIcon(props) {
  return <Icon strokeWidth={2.6} {...props}><path d="M19 12H5M11 18l-6-6 6-6" /></Icon>;
}

export function PlusIcon(props) {
  return <Icon strokeWidth={2.2} {...props}><path d="M12 5v14M5 12h14" /></Icon>;
}

export function LogoutIcon(props) {
  return (
    <Icon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </Icon>
  );
}


export function CartIcon(props) {
  return (
    <Icon strokeWidth={2} {...props}>
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
      <circle cx="10" cy="20" r="1.3" />
      <circle cx="17" cy="20" r="1.3" />
    </Icon>
  );
}

export function PhoneIcon(props) {
  return (
    <Icon {...props}>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </Icon>
  );
}

export function MapPinIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </Icon>
  );
}