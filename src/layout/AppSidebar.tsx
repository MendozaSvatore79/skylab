"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { ChevronDownIcon, HorizontaLDots } from "../icons/index";
import SidebarWidget from "./SidebarWidget";
import { SIDEBAR_SECTIONS, type SidebarMenuItem } from "@/config/sidebarNavigation";

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleSidebar } = useSidebar();
  const { user, sidebarPermissions, permissionsLoading } = useAuth();
  const pathname = usePathname();

  const currentRole = Number(user?.role || 3);
  const enabledPermissions = useMemo(() => new Set(sidebarPermissions), [sidebarPermissions]);
  const adminOnlyPaths = useMemo(() => new Set(["/lab-users", "/sidebar-permissions"]), []);

  const isItemVisible = useCallback(
    (item: SidebarMenuItem) => {
      if (currentRole !== 3) return true;
      if (item.adminOnly) return false;
      if (adminOnlyPaths.has(item.path)) return false;
      if (permissionsLoading) return true;
      if (!item.permissionKey) return true;
      return enabledPermissions.has(item.permissionKey);
    },
    [adminOnlyPaths, currentRole, enabledPermissions, permissionsLoading]
  );

  const visibleSections = useMemo(
    () =>
      SIDEBAR_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter(isItemVisible),
      })).filter((section) => section.items.length > 0),
    [isItemVisible]
  );

  const [openSectionKey, setOpenSectionKey] = useState<string | null>(null);
  const [sectionHeights, setSectionHeights] = useState<Record<string, number>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => pathname === path, [pathname]);

  useEffect(() => {
    const matchedSection = visibleSections.find((section) =>
      section.items.some((item) => isActive(item.path))
    );

    // Only set the open section automatically if no section is currently open.
    // This prevents overriding explicit user clicks to open another section.
    if (matchedSection && (openSectionKey === null || openSectionKey === undefined)) {
      setOpenSectionKey(matchedSection.key);
    }
  }, [isActive, visibleSections, openSectionKey]);

  useEffect(() => {
    if (!openSectionKey) return;
    const measureAndSet = () => {
      const currentRef = sectionRefs.current[openSectionKey];
      if (!currentRef) return;
      const nextHeight = currentRef.scrollHeight;
      setSectionHeights((previous) => {
        if (previous[openSectionKey] === nextHeight) {
          return previous;
        }

        return {
          ...previous,
          [openSectionKey]: nextHeight,
        };
      });
    };

    // Try to measure now; if the element isn't mounted yet (e.g. sidebar was just expanded),
    // measure after a short timeout to allow the DOM to mount the element.
    const currentRef = sectionRefs.current[openSectionKey];
    if (currentRef) {
      measureAndSet();
    } else {
      const t = setTimeout(() => {
        measureAndSet();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [openSectionKey, visibleSections, isExpanded, isHovered, isMobileOpen]);

  const toggleSection = (sectionKey: string) => {
    // debug log
    // If the sidebar is collapsed (not expanded and not hovered) and not in mobile mode,
    // toggle the sidebar open (permanent expand) so the dropdown can be interacted with.
    console.log('[AppSidebar] toggleSection called', { sectionKey, isExpanded, isHovered, isMobileOpen, openSectionKey });
    if (!isExpanded && !isHovered && !isMobileOpen) {
      toggleSidebar();
      setOpenSectionKey((prev) => {
        console.log('[AppSidebar] setOpenSectionKey prev -> new', prev, prev === sectionKey ? null : sectionKey);
        return prev === sectionKey ? null : sectionKey;
      });
      return;
    }

    setOpenSectionKey((previous) => {
      console.log('[AppSidebar] setOpenSectionKey prev -> new', previous, previous === sectionKey ? null : sectionKey);
      return previous === sectionKey ? null : sectionKey;
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
        isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image className="dark:hidden" src="/images/logo/logo.svg" alt="Logo" width={150} height={40} />
              <Image className="hidden dark:block" src="/images/logo/logo-dark.svg" alt="Logo" width={150} height={40} />
            </>
          ) : (
            <Image src="/images/logo/logo-icon.svg" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`mb-4 text-xs uppercase flex leading-5 text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
              </h2>

              <ul className="flex flex-col gap-4">
                {visibleSections.map((section) => {
                  const isOpen = openSectionKey === section.key;
                  return (
                    <li key={section.key} data-open={isOpen ? 'true' : 'false'}>
                      <button
                        type="button"
                        onClick={() => toggleSection(section.key)}
                        aria-expanded={isOpen}
                        className={`menu-item group cursor-pointer ${isOpen ? "menu-item-active" : "menu-item-inactive"} ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
                      >
                        <span className={isOpen ? "menu-item-icon-active" : "menu-item-icon-inactive"}>{section.icon}</span>
                        {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{section.label}</span>}
                        {(isExpanded || isHovered || isMobileOpen) && (
                          <ChevronDownIcon className={`ml-auto h-5 w-5 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-500" : ""}`} />
                        )}
                      </button>

                      {(isExpanded || isHovered || isMobileOpen) && (
                        <div
                          ref={(el) => {
                            sectionRefs.current[section.key] = el;
                          }}
                          className="overflow-hidden transition-all duration-300"
                          // Use maxHeight to avoid measuring races; when open, allow a large maxHeight so content is visible
                          style={{ maxHeight: isOpen ? (sectionHeights[section.key] ? `${sectionHeights[section.key]}px` : '999px') : '0px' }}
                        >
                          <ul className="mt-2 space-y-1 ml-9">
                            {section.items.map((item) => (
                              <li key={item.path}>
                                <Link
                                  href={item.path}
                                  className={`menu-dropdown-item ${isActive(item.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}
                                >
                                  {item.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
