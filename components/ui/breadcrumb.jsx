"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { data } from "@/components/app-sidebar";
import { Car } from "lucide-react";

import { cn } from "@/lib/utils";

function Breadcrumb({ ...props }) {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean);
    if (paths.length === 0) return [{ title: "Accueil", url: "/" }];

    const breadcrumbs = [];
    let currentPath = "";

    // Find matching navigation items
    const findMatchingItem = (items) => {
      for (const item of items) {
        if (item.url === pathname) {
          return {
            mainNav: item.title,
            icon: item.icon,
            subNav: null,
          };
        }
        if (item.items) {
          for (const subItem of item.items) {
            if (subItem.url === pathname) {
              return {
                mainNav: item.title,
                icon: item.icon,
                subNav: subItem.title,
              };
            }
          }
        }
      }
      return null;
    };

    const match = findMatchingItem(data.navMain);
    const homeIcon = match?.icon || Car;

    // Add home with icon
    breadcrumbs.push({
      title: "",
      icon: homeIcon,
      url: "/",
    });

    // Add main navigation if found
    if (match?.mainNav) {
      breadcrumbs.push({
        title: match.mainNav,
        url: "#",
      });
    }

    // Add sub navigation if found
    if (match?.subNav) {
      breadcrumbs.push({
        title: match.subNav,
        url: pathname,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.url}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          )}
          <Link
            href={breadcrumb.url}
            className={`hover:text-foreground flex items-center gap-1.5 ${
              index === breadcrumbs.length - 1
                ? "text-foreground font-medium"
                : ""
            }`}
          >
            {index === 0 && breadcrumb.icon && (
              <breadcrumb.icon className="h-4 w-4" />
            )}
            {breadcrumb.title}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}

function BreadcrumbList({ className, ...props }) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        className
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function BreadcrumbLink({ asChild, className, ...props }) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({ children, className, ...props }) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

function BreadcrumbEllipsis({ className, ...props }) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
