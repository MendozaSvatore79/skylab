import React from "react";
import {
  BoxCubeIcon,
  CalenderIcon,
  GridIcon,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "@/icons";

export type SidebarSection = "main" | "others";

export type SidebarLeafItem = {
  key: string;
  label: string;
  path: string;
  section: SidebarSection;
  group: string;
};

export type SidebarNavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  permissionKey?: string;
  subItems?: { name: string; path: string; permissionKey: string; pro?: boolean; new?: boolean }[];
};

export type SidebarMenuItem = {
  label: string;
  path: string;
  permissionKey?: string;
  adminOnly?: boolean;
};

export type SidebarMenuSection = {
  key: string;
  label: string;
  icon: React.ReactNode;
  items: SidebarMenuItem[];
};

export const SIDEBAR_LEAF_ITEMS: SidebarLeafItem[] = [
  { key: "dashboard", label: "Ecommerce", path: "/", section: "main", group: "Dashboard" },
  { key: "calendar", label: "Calendar", path: "/calendar", section: "main", group: "Calendar" },
  { key: "profile", label: "User Profile", path: "/profile", section: "main", group: "Profile" },
  { key: "form-elements", label: "Form Elements", path: "/form-elements", section: "main", group: "Forms" },
  { key: "basic-tables", label: "Basic Tables", path: "/basic-tables", section: "main", group: "Tables" },
  { key: "blank", label: "Blank Page", path: "/blank", section: "main", group: "Pages" },
  { key: "error-404", label: "404 Error", path: "/error-404", section: "main", group: "Pages" },
  { key: "line-chart", label: "Line Chart", path: "/line-chart", section: "others", group: "Charts" },
  { key: "bar-chart", label: "Bar Chart", path: "/bar-chart", section: "others", group: "Charts" },
  { key: "alerts", label: "Alerts", path: "/alerts", section: "others", group: "UI Elements" },
  { key: "avatars", label: "Avatar", path: "/avatars", section: "others", group: "UI Elements" },
  { key: "badge", label: "Badge", path: "/badge", section: "others", group: "UI Elements" },
  { key: "buttons", label: "Buttons", path: "/buttons", section: "others", group: "UI Elements" },
  { key: "images", label: "Images", path: "/images", section: "others", group: "UI Elements" },
  { key: "videos", label: "Videos", path: "/videos", section: "others", group: "UI Elements" },
  { key: "signin", label: "Sign In", path: "/signin", section: "others", group: "Authentication" },
  { key: "signup", label: "Sign Up", path: "/signup", section: "others", group: "Authentication" },
];

export const MAIN_NAV_ITEMS: SidebarNavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [{ name: "Ecommerce", path: "/", permissionKey: "dashboard", pro: false }],
  },
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "/calendar",
    permissionKey: "calendar",
  },
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    path: "/profile",
    permissionKey: "profile",
  },
  {
    name: "Forms",
    icon: <ListIcon />,
    subItems: [{ name: "Form Elements", path: "/form-elements", permissionKey: "form-elements", pro: false }],
  },
  {
    name: "Tables",
    icon: <TableIcon />,
    subItems: [{ name: "Basic Tables", path: "/basic-tables", permissionKey: "basic-tables", pro: false }],
  },
  {
    name: "Pages",
    icon: <PageIcon />,
    subItems: [
      { name: "Blank Page", path: "/blank", permissionKey: "blank", pro: false },
      { name: "404 Error", path: "/error-404", permissionKey: "error-404", pro: false },
    ],
  },
];

export const OTHER_NAV_ITEMS: SidebarNavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "/line-chart", permissionKey: "line-chart", pro: false },
      { name: "Bar Chart", path: "/bar-chart", permissionKey: "bar-chart", pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts", permissionKey: "alerts", pro: false },
      { name: "Avatar", path: "/avatars", permissionKey: "avatars", pro: false },
      { name: "Badge", path: "/badge", permissionKey: "badge", pro: false },
      { name: "Buttons", path: "/buttons", permissionKey: "buttons", pro: false },
      { name: "Images", path: "/images", permissionKey: "images", pro: false },
      { name: "Videos", path: "/videos", permissionKey: "videos", pro: false },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin", permissionKey: "signin", pro: false },
      { name: "Sign Up", path: "/signup", permissionKey: "signup", pro: false },
    ],
  },
];

export const SIDEBAR_PERMISSION_KEYS = SIDEBAR_LEAF_ITEMS.map((item) => item.key);

export const SIDEBAR_SECTIONS: SidebarMenuSection[] = [
  {
    key: 'inicio',
    label: 'Inicio',
    icon: <GridIcon />,
    items: [
      { label: 'Dashboard', path: '/', permissionKey: 'dashboard' },
      { label: 'Calendar', path: '/calendar', permissionKey: 'calendar' },
    ],
  },
  {
    key: 'administracion',
    label: 'Administración',
    icon: <ListIcon />,
    items: [
      { label: 'User Profile', path: '/profile', permissionKey: 'profile' },
      { label: 'Lab Users', path: '/lab-users', adminOnly: true },
      { label: 'Sidebar Permissions', path: '/sidebar-permissions', adminOnly: true },
    ],
  },
  {
    key: 'recursos',
    label: 'Recursos',
    icon: <BoxCubeIcon />,
    items: [
      { label: 'Form Elements', path: '/form-elements', permissionKey: 'form-elements' },
      { label: 'Basic Tables', path: '/basic-tables', permissionKey: 'basic-tables' },
      { label: 'Blank Page', path: '/blank', permissionKey: 'blank' },
      { label: '404 Error', path: '/error-404', permissionKey: 'error-404' },
    ],
  },
  {
    key: 'control-calidad',
    label: 'Control de Calidad',
    icon: <PieChartIcon />,
    items: [
      { label: 'Alerts', path: '/alerts', permissionKey: 'alerts' },
      { label: 'Avatar', path: '/avatars', permissionKey: 'avatars' },
      { label: 'Badge', path: '/badge', permissionKey: 'badge' },
    ],
  },
  {
    key: 'recurso-humano',
    label: 'Recurso Humano',
    icon: <UserCircleIcon />,
    items: [
      { label: 'Buttons', path: '/buttons', permissionKey: 'buttons' },
      { label: 'Images', path: '/images', permissionKey: 'images' },
      { label: 'Videos', path: '/videos', permissionKey: 'videos' },
    ],
  },
  {
    key: 'reportes',
    label: 'Reportes',
    icon: <TableIcon />,
    items: [
      { label: 'Line Chart', path: '/line-chart', permissionKey: 'line-chart' },
      { label: 'Bar Chart', path: '/bar-chart', permissionKey: 'bar-chart' },
    ],
  },
  {
    key: 'ayuda',
    label: 'Ayuda',
    icon: <PlugInIcon />,
    items: [
      { label: 'Sign In', path: '/signin', permissionKey: 'signin' },
      { label: 'Sign Up', path: '/signup', permissionKey: 'signup' },
    ],
  },
];
